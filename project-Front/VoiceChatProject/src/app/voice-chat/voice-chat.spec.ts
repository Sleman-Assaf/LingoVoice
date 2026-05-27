import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VoiceChat } from './voice-chat';

describe('VoiceChat', () => {
  let component: VoiceChat;
  let fixture: ComponentFixture<VoiceChat>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VoiceChat]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VoiceChat);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
