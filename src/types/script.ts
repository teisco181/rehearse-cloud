/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface DialogueLine {
  line_id: number;
  character: string;
  text: string;
  stage_directions?: string;
}

export interface Scene {
  scene_title: string;
  dialogue: DialogueLine[];
}

export interface VoiceSettings {
  language: string; // e.g. 'nl-NL' or 'en-US'
  voiceURI?: string;
  pitch: number; // 0.5 to 2.0 (default 1.0)
  rate: number; // 0.5 to 2.0 (default 1.0)
  volume: number; // 0.0 to 1.0 (default 1.0)
}

export interface Script {
  id: string;
  userId: string;
  title: string;
  characters: string[];
  scenes: Scene[];
  characterVoices?: Record<string, VoiceSettings>;
  createdAt?: string;
  updatedAt?: string;
}

export type RehearsalState = 'PLAYING' | 'PAUSED' | 'WAITING_FOR_MIC' | 'COMPLETED';

export type DeviceRole = 'hub' | 'mic_remote' | 'standalone';

export type RehearsalMode = 'full' | 'cues_only' | 'blind_run' | 'speed_run';

export interface ConnectedDevice {
  deviceId: string;
  deviceName: string;
  role: DeviceRole;
  lastSeen: number;
  isOnline: boolean;
  batteryLevel?: number;
}

export interface RehearsalSession {
  id: string; // Room PIN or UID
  userId: string;
  currentScriptId: string;
  activeSceneIndex: number;
  currentLineId: number;
  rehearsalState: RehearsalState;
  activeCharacter: string;
  mode: RehearsalMode;
  whisperPromptRequested?: boolean;
  repeatLineRequested?: boolean;
  lastActionTimestamp: number;
  devices: Record<string, ConnectedDevice>;
}

export interface SpeechMatchConfig {
  tolerance: 'strict' | 'moderate' | 'lenient' | 'keyword';
  language: 'nl-NL' | 'en-US' | 'en-GB';
  autoAdvanceOnSpeech: boolean;
}

export interface UserAccount {
  uid: string;
  email: string;
  displayName: string;
  isAnonymous: boolean;
  sessionStartedAt: number;
}
