import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { OnDestroy, OnInit } from '@angular/core';

import { Navbar } from '../navbar/navbar';
import { RealtimeService } from '../CORE/services/realtime.service';

@Component({
  selector: 'app-voice-chat',
  standalone: true,
  imports: [Navbar, CommonModule],
  templateUrl: './voice-chat.html',
  styleUrls: ['./voice-chat.css']
})
export class VoiceChat implements OnInit, OnDestroy {
  status = 'disconnected';

  isListening = false;
  isConnecting = false;

  isSpeaking = false;
  isUserSpeaking = false;

  currentSessionId: number | null = null;
  isDownloadingPdf = false;

  private subs: Subscription[] = [];

  constructor(private realtimeService: RealtimeService) {}

  get isMuted(): boolean {
    return this.realtimeService.isMuted;
  }

  toggleMute(): void {
    this.realtimeService.toggleMute();
  }

  ngOnInit(): void {
    this.subs.push(
      this.realtimeService.onStatusChange.subscribe((status: string) => {
        this.status = status;

        if (status === 'connected' || status === 'ready') {
          this.isConnecting = false;
        }

        if (status === 'listening') {
          this.isListening = true;
          this.isConnecting = false;
        }

        if (status === 'disconnected') {
          this.isListening = false;
          this.isConnecting = false;
          this.isSpeaking = false;
          this.isUserSpeaking = false;
        }
      }),

      this.realtimeService.onSpeakingChange.subscribe(
        ({ who, speaking }: { who: string; speaking: boolean }) => {
          if (who === 'assistant') {
            this.isSpeaking = speaking;
          }

          if (who === 'user') {
            this.isUserSpeaking = speaking;
          }
        }
      ),

      this.realtimeService.onSessionStarted.subscribe((sessionId: number) => {
        this.currentSessionId = sessionId;
        console.log('Conversation Session ID:', this.currentSessionId);
      }),

      this.realtimeService.onError.subscribe((err: unknown) => {
        console.error(err);
        this.status = 'error';
        this.isConnecting = false;
        this.isListening = false;
      })
    );
  }

  async startCall(): Promise<void> {
    if (this.isConnecting || this.isListening) {
      console.warn('Call already connecting or running');
      return;
    }

    this.isConnecting = true;
    this.status = 'connecting';
    this.currentSessionId = null;

    try {
      await this.realtimeService.connect();
      await this.realtimeService.startMicrophone();

      this.isListening = true;
      this.isConnecting = false;
      this.status = 'listening';
    } catch (error: unknown) {
      console.error('Start call error:', error);

      this.status = 'error';
      this.isListening = false;
      this.isConnecting = false;

      this.realtimeService.disconnect();
    }
  }

  async endCall(): Promise<void> {
    this.realtimeService.disconnect();

    this.isConnecting = false;
    this.isListening = false;
    this.isSpeaking = false;
    this.isUserSpeaking = false;
    this.status = 'disconnected';
  }

  downloadConversationPdf(): void {
    if (!this.currentSessionId) {
      console.warn('No session id found');
      return;
    }

    this.isDownloadingPdf = true;

    this.realtimeService.downloadConversationPdf(this.currentSessionId)
      .subscribe({
        next: (blob: Blob) => {
          const fileName = `lingovoice-session-${this.currentSessionId}.pdf`;

          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');

          a.href = url;
          a.download = fileName;
          a.click();

          window.URL.revokeObjectURL(url);

          this.isDownloadingPdf = false;
        },
        error: (error: unknown) => {
          console.error('PDF download error:', error);
          this.isDownloadingPdf = false;
        }
      });
  }

  ngOnDestroy(): void {
    this.subs.forEach((s: Subscription) => s.unsubscribe());
    this.realtimeService.disconnect();
  }
}