import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RealtimeService {
  private socket: WebSocket | null = null;

  private audioContext: AudioContext | null = null;
  private audioStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;

  private audioQueue: ArrayBuffer[] = [];
  private isPlaying = false;

  private readonly apiUrl = 'https://localhost:7148/api';

  isMuted = false;

  onTranscript = new Subject<{ role: string; text: string }>();
  onStatusChange = new Subject<string>();
  onError = new Subject<string>();
  onSpeakingChange = new Subject<{ who: string; speaking: boolean }>();

  // رقم الجلسة الراجع من الباك
  onSessionStarted = new Subject<number>();

  constructor(private http: HttpClient) {}

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const token = localStorage.getItem('token');

      if (!token) {
        console.error(' No token found');
        this.onError.next('Please log in first');
        reject('No token found');
        return;
      }

      const wsUrl = `wss://localhost:7148/api/realtime/ws?access_token=${encodeURIComponent(token)}`;

      console.log('Connecting to WebSocket...');

      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = (): void => {
        console.log(' Connected to backend');
        this.onStatusChange.next('connected');
        resolve();
      };

      this.socket.onmessage = (event: MessageEvent): void => {
        this.handleMessage(event.data);
      };

      this.socket.onclose = (event: CloseEvent): void => {
        console.log(' Disconnected', event);
        this.onStatusChange.next('disconnected');
        this.stopMicrophone();
      };

      this.socket.onerror = (error: Event): void => {
        console.error(' WebSocket error', error);
        this.onError.next('Connection error');
        reject(error);
      };
    });
  }

  async startMicrophone(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioStream = stream;

      this.audioContext = new AudioContext({ sampleRate: 24000 });

      const source = this.audioContext.createMediaStreamSource(stream);
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

      this.processor.onaudioprocess = (event: AudioProcessingEvent): void => {
        if (this.socket?.readyState !== WebSocket.OPEN) return;
        if (this.isMuted) return;

        const inputData = event.inputBuffer.getChannelData(0);
        const pcm16 = this.floatToPcm16(inputData);

        const pcmBuffer = this.toArrayBuffer(pcm16);
        const base64 = this.arrayBufferToBase64(pcmBuffer);

        this.socket.send(JSON.stringify({
          type: 'input_audio_buffer.append',
          audio: base64
        }));
      };

      source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);

      this.onStatusChange.next('listening');
    } catch (error: unknown) {
      console.error('Microphone error:', error);
      this.onError.next('Microphone access denied');
    }
  }

  toggleMute(): void {
    if (!this.audioStream) return;

    this.isMuted = !this.isMuted;

    this.audioStream.getTracks().forEach((track: MediaStreamTrack) => {
      track.enabled = !this.isMuted;
    });
  }

  stopMicrophone(): void {
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }

    if (this.audioStream) {
      this.audioStream.getTracks().forEach((track: MediaStreamTrack) => {
        track.stop();
      });

      this.audioStream = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.isMuted = false;
  }

  disconnect(): void {
    this.stopMicrophone();

    this.audioQueue = [];
    this.isPlaying = false;

    if (this.socket) {
      if (
        this.socket.readyState === WebSocket.OPEN ||
        this.socket.readyState === WebSocket.CONNECTING
      ) {
        this.socket.close();
      }

      this.socket = null;
    }
  }

  downloadConversationPdf(sessionId: number): Observable<Blob> {
    const token = localStorage.getItem('token');

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.get(`${this.apiUrl}/conversations/${sessionId}/pdf`, {
      headers,
      responseType: 'blob'
    });
  }

  private handleMessage(data: string): void {
    try {
      const msg = JSON.parse(data);

      switch (msg.type) {
        case 'conversation.session.started': {
          const sessionId = Number(msg.sessionId);

          this.onSessionStarted.next(sessionId);

          console.log(' Conversation Session ID:', sessionId);
          break;
        }

        case 'session.updated': {
          console.log(' Session updated');
          this.onStatusChange.next('ready');
          break;
        }

        case 'response.audio.delta': {
          if (!msg.delta) return;

          const audioData = this.base64ToArrayBuffer(msg.delta);

          this.audioQueue.push(audioData);
          this.onSpeakingChange.next({ who: 'assistant', speaking: true });

          this.playNextAudio();
          break;
        }

        case 'response.audio.done': {
          this.onSpeakingChange.next({ who: 'assistant', speaking: false });
          break;
        }

        case 'input_speech_started': {
          this.onSpeakingChange.next({ who: 'user', speaking: true });
          break;
        }

        case 'input_speech_stopped': {
          this.onSpeakingChange.next({ who: 'user', speaking: false });
          break;
        }

        case 'conversation.item.input_audio_transcription.completed': {
          this.onTranscript.next({
            role: 'user',
            text: msg.transcript || ''
          });

          break;
        }

        case 'response.audio_transcript.done': {
          this.onTranscript.next({
            role: 'assistant',
            text: msg.transcript || ''
          });

          break;
        }

        case 'error': {
          console.error('OpenAI Realtime error:', msg);
          this.onError.next(msg.error?.message || 'Realtime error');
          break;
        }

        default: {
          break;
        }
      }
    } catch (error: unknown) {
      console.error('Parse error:', error);
    }
  }

  private async playNextAudio(): Promise<void> {
    if (this.isPlaying || this.audioQueue.length === 0) return;

    this.isPlaying = true;

    const pcm16Buffer = this.audioQueue.shift();

    if (!pcm16Buffer) {
      this.isPlaying = false;
      return;
    }

    const ctx = new AudioContext({ sampleRate: 24000 });

    const int16 = new Int16Array(pcm16Buffer);
    const float32 = this.pcm16ToFloat(int16);

    const audioBuffer = ctx.createBuffer(1, float32.length, 24000);
    audioBuffer.copyToChannel(float32, 0);

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);

    source.onended = (): void => {
      this.isPlaying = false;
      ctx.close();
      this.playNextAudio();
    };

    source.start();
  }

  private floatToPcm16(float32: Float32Array): Int16Array {
    const pcm16 = new Int16Array(float32.length);

    for (let i = 0; i < float32.length; i++) {
      const sample = Math.max(-1, Math.min(1, float32[i]));
      pcm16[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    }

    return pcm16;
  }

private pcm16ToFloat(pcm16: Int16Array): Float32Array<ArrayBuffer> {
  const buffer = new ArrayBuffer(pcm16.length * 4);
  const float32 = new Float32Array(buffer);

  for (let i = 0; i < pcm16.length; i++) {
    float32[i] = pcm16[i] / 0x8000;
  }

  return float32;
}

  private toArrayBuffer(view: Int16Array): ArrayBuffer {
    const buffer = new ArrayBuffer(view.byteLength);
    const bytes = new Uint8Array(buffer);

    bytes.set(new Uint8Array(view.buffer, view.byteOffset, view.byteLength));

    return buffer;
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    return bytes.buffer;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';

    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }

    return btoa(binary);
  }
}