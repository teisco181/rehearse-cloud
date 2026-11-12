/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { VoiceSettings, SpeechMatchConfig } from '../types/script';

export interface AvailableVoice {
  name: string;
  lang: string;
  voiceURI: string;
  default: boolean;
  isDutch: boolean;
  isEnglish: boolean;
}

export type STTStatus = 'inactive' | 'listening' | 'processing' | 'matched' | 'error' | 'unsupported';

type STTCallback = (transcript: string, isFinal: boolean, matched: boolean) => void;
type TTSCallback = (status: 'start' | 'end' | 'error') => void;

class SpeechEngine {
  private synth: SpeechSynthesis | null = null;
  private recognition: any = null;
  private isRecognitionActive: boolean = false;
  private isMuted: boolean = false; // Muted if device is strictly a Mic Remote
  private sttListeners: Set<STTCallback> = new Set();
  private voices: SpeechSynthesisVoice[] = [];
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphoneMediaStream: MediaStream | null = null;
  private micLevelCallbacks: Set<(level: number) => void> = new Set();
  private animationFrameId: number | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      if ('speechSynthesis' in window) {
        this.synth = window.speechSynthesis;
        this.loadVoices();
        if (this.synth.onvoiceschanged !== undefined) {
          this.synth.onvoiceschanged = () => this.loadVoices();
        }
      }
      this.initRecognition();
    }
  }

  private loadVoices() {
    if (!this.synth) return;
    this.voices = this.synth.getVoices();
  }

  public getAvailableVoices(): AvailableVoice[] {
    if (!this.voices.length && this.synth) {
      this.voices = this.synth.getVoices();
    }
    return this.voices.map((v) => ({
      name: v.name,
      lang: v.lang,
      voiceURI: v.voiceURI,
      default: v.default,
      isDutch: v.lang.toLowerCase().startsWith('nl'),
      isEnglish: v.lang.toLowerCase().startsWith('en'),
    }));
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && this.synth) {
      this.synth.cancel();
    }
  }

  /**
   * Play counterpart dialogue line via Text-to-Speech
   */
  public speak(
    text: string,
    voiceConfig?: VoiceSettings,
    onStatusChange?: TTSCallback
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synth || this.isMuted) {
        if (onStatusChange) onStatusChange('end');
        resolve();
        return;
      }

      // Stop previous utterance
      this.synth.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      this.currentUtterance = utterance;

      const lang = voiceConfig?.language || 'en-US';
      utterance.lang = lang;
      utterance.rate = voiceConfig?.rate ?? 1.0;
      utterance.pitch = voiceConfig?.pitch ?? 1.0;
      utterance.volume = voiceConfig?.volume ?? 1.0;

      // Find matching voice
      if (this.voices.length) {
        let matchingVoice: SpeechSynthesisVoice | undefined;
        if (voiceConfig?.voiceURI) {
          matchingVoice = this.voices.find((v) => v.voiceURI === voiceConfig.voiceURI);
        }
        if (!matchingVoice) {
          // Match by language prefix
          matchingVoice = this.voices.find((v) => v.lang.toLowerCase().startsWith(lang.toLowerCase().substring(0, 2)));
        }
        if (matchingVoice) {
          utterance.voice = matchingVoice;
        }
      }

      utterance.onstart = () => {
        if (onStatusChange) onStatusChange('start');
      };

      utterance.onend = () => {
        this.currentUtterance = null;
        if (onStatusChange) onStatusChange('end');
        resolve();
      };

      utterance.onerror = (e) => {
        this.currentUtterance = null;
        console.warn('[TTS] Synthesis warning/error:', e);
        if (onStatusChange) onStatusChange('error');
        resolve(); // resolve so rehearsal sequence is not permanently hung
      };

      this.synth.speak(utterance);
    });
  }

  /**
   * Whisper prompt (first 3-4 words of actor's line whispered softly)
   */
  public whisperCue(expectedLine: string, lang: string = 'en-US'): Promise<void> {
    const words = expectedLine.trim().split(/\s+/).slice(0, 4).join(' ');
    return this.speak(`... ${words} ...`, {
      language: lang,
      pitch: 1.1,
      rate: 0.85,
      volume: 0.35, // Low whisper volume
    });
  }

  public stopSpeaking() {
    if (this.synth) {
      this.synth.cancel();
      this.currentUtterance = null;
    }
  }

  // --- Speech-to-Text (STT) ---

  private initRecognition() {
    if (typeof window === 'undefined') return;
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      console.warn('[STT] SpeechRecognition API not supported on this browser.');
      return;
    }

    try {
      this.recognition = new SpeechRec();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 2;
    } catch (err) {
      console.error('[STT] Could not initialize SpeechRecognition:', err);
    }
  }

  public startListening(
    expectedLine: string,
    config: SpeechMatchConfig,
    onResult: STTCallback
  ) {
    if (!this.recognition) {
      this.initRecognition();
      if (!this.recognition) return;
    }

    this.recognition.lang = config.language || 'nl-NL';

    this.recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      const activeText = (finalTranscript || interimTranscript).trim();
      const isMatched = this.evaluateLineMatch(activeText, expectedLine, config.tolerance);

      onResult(activeText, !!finalTranscript, isMatched);
    };

    this.recognition.onerror = (event: any) => {
      if (event.error !== 'no-speech') {
        console.warn('[STT] Recognition event:', event.error);
      }
    };

    this.recognition.onend = () => {
      // Auto-restart if we are supposed to be listening
      if (this.isRecognitionActive) {
        try {
          this.recognition.start();
        } catch (e) {
          // ignore already started
        }
      }
    };

    try {
      this.recognition.start();
      this.isRecognitionActive = true;
      this.startMicVisualizer();
    } catch (e) {
      // might already be started
    }
  }

  public stopListening() {
    this.isRecognitionActive = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        // ignore
      }
    }
    this.stopMicVisualizer();
  }

  /**
   * Smart Actor Line Matcher
   */
  public evaluateLineMatch(
    spoken: string,
    expected: string,
    tolerance: 'strict' | 'moderate' | 'lenient' | 'keyword'
  ): boolean {
    if (!spoken || !expected) return false;

    const cleanSpoken = this.normalize(spoken);
    const cleanExpected = this.normalize(expected);

    if (cleanSpoken.length === 0) return false;

    // Substring quick match
    if (cleanExpected.includes(cleanSpoken) && cleanSpoken.length > 5) {
      if (tolerance === 'lenient' || tolerance === 'keyword') return true;
    }

    const spokenTokens = cleanSpoken.split(/\s+/).filter(Boolean);
    const expectedTokens = cleanExpected.split(/\s+/).filter(Boolean);

    if (spokenTokens.length === 0 || expectedTokens.length === 0) return false;

    // Count matched words
    let matches = 0;
    for (const token of spokenTokens) {
      if (expectedTokens.includes(token)) {
        matches++;
      }
    }

    const ratio = matches / Math.min(expectedTokens.length, Math.max(spokenTokens.length, 3));

    switch (tolerance) {
      case 'strict':
        return ratio >= 0.75;
      case 'moderate':
        return ratio >= 0.5;
      case 'lenient':
        return ratio >= 0.35 || matches >= 3;
      case 'keyword':
        return matches >= 2;
      default:
        return ratio >= 0.5;
    }
  }

  private normalize(text: string): string {
    return text
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'’‘“”]/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  // --- Real-time Mic Audio Visualizer ---

  private async startMicVisualizer() {
    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) return;
    try {
      if (!this.audioContext) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        this.audioContext = new AudioCtx();
      }
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      this.microphoneMediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = this.audioContext.createMediaStreamSource(this.microphoneMediaStream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 64;
      source.connect(this.analyser);

      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkVolume = () => {
        if (!this.analyser || !this.isRecognitionActive) return;
        this.analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        const normalized = Math.min(1.0, average / 100);

        for (const cb of this.micLevelCallbacks) {
          cb(normalized);
        }

        this.animationFrameId = requestAnimationFrame(checkVolume);
      };

      checkVolume();
    } catch (e) {
      // mic visualizer fallback
    }
  }

  private stopMicVisualizer() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.microphoneMediaStream) {
      this.microphoneMediaStream.getTracks().forEach((t) => t.stop());
      this.microphoneMediaStream = null;
    }
    for (const cb of this.micLevelCallbacks) {
      cb(0);
    }
  }

  public onMicLevel(cb: (level: number) => void): () => void {
    this.micLevelCallbacks.add(cb);
    return () => this.micLevelCallbacks.delete(cb);
  }
}

export const speechEngine = new SpeechEngine();
