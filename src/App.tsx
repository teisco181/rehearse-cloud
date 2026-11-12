/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { ScriptStageView } from './components/ScriptStageView';
import { RemoteControllerView } from './components/RemoteControllerView';
import { ScriptLibraryModal } from './components/ScriptLibraryModal';
import { MultiDeviceSyncModal } from './components/MultiDeviceSyncModal';
import { VoiceSettingsModal } from './components/VoiceSettingsModal';
import { SecurityModal } from './components/SecurityModal';
import { SAMPLE_SCRIPTS } from './data/sampleScripts';
import {
  Script,
  DialogueLine,
  RehearsalState,
  RehearsalMode,
  DeviceRole,
  RehearsalSession,
  VoiceSettings,
  SpeechMatchConfig,
} from './types/script';
import { speechEngine } from './services/speechEngine';
import { cloudSyncService } from './services/cloudSync';
import { securityManager } from './services/security';

export default function App() {
  // Session User Identity (Hardened & Isolated)
  const [userId, setUserId] = useState<string>(() => {
    let id = sessionStorage.getItem('sr_auth_uid');
    if (!id) {
      id = 'actor_' + Math.random().toString(36).substring(2, 10);
      sessionStorage.setItem('sr_auth_uid', id);
    }
    securityManager.setCurrentUser(id);
    return id;
  });

  // Scripts
  const [scripts, setScripts] = useState<Script[]>(() => {
    const saved = sessionStorage.getItem('sr_saved_scripts');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return SAMPLE_SCRIPTS.map((s) => ({ ...s, userId }));
  });

  const [currentScriptId, setCurrentScriptId] = useState<string>(scripts[0]?.id || 'sample-phantom-nl');
  const currentScript = scripts.find((s) => s.id === currentScriptId) || scripts[0];

  // Active Character
  const [activeCharacter, setActiveCharacter] = useState<string>(
    currentScript?.characters[1] || currentScript?.characters[0] || 'Christine Daaé'
  );

  // Playback & Rehearsal Flow
  const [activeSceneIndex, setActiveSceneIndex] = useState<number>(0);
  const [currentLineId, setCurrentLineId] = useState<number>(1);
  const [rehearsalState, setRehearsalState] = useState<RehearsalState>('PAUSED');
  const [rehearsalMode, setRehearsalMode] = useState<RehearsalMode>('full');

  // Device Role
  const [deviceRole, setDeviceRole] = useState<DeviceRole>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roleParam = urlParams.get('role');
    if (roleParam === 'mic_remote') return 'mic_remote';
    return 'hub';
  });

  // Multi-Device Session
  const [session, setSession] = useState<RehearsalSession | null>(null);

  // Speech Recognition States
  const [isListening, setIsListening] = useState<boolean>(false);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [isLineMatched, setIsLineMatched] = useState<boolean>(false);
  const [micLevel, setMicLevel] = useState<number>(0);
  const [sttConfig, setSttConfig] = useState<SpeechMatchConfig>({
    tolerance: 'moderate',
    language: 'nl-NL',
    autoAdvanceOnSpeech: true,
  });

  // UI Theme & Modals
  const [isStageDark, setIsStageDark] = useState<boolean>(true);
  const [isLibraryOpen, setIsLibraryOpen] = useState<boolean>(false);
  const [isSyncOpen, setIsSyncOpen] = useState<boolean>(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState<boolean>(false);
  const [isSecurityOpen, setIsSecurityOpen] = useState<boolean>(false);

  // References for playback loop prevention
  const stateRef = useRef({
    rehearsalState,
    currentLineId,
    activeSceneIndex,
    currentScript,
    activeCharacter,
    deviceRole,
    rehearsalMode,
  });
  stateRef.current = {
    rehearsalState,
    currentLineId,
    activeSceneIndex,
    currentScript,
    activeCharacter,
    deviceRole,
    rehearsalMode,
  };

  // Sync mic muting based on role (Mic Remote mutes TTS)
  useEffect(() => {
    speechEngine.setMuted(deviceRole === 'mic_remote');
    cloudSyncService.setDeviceRole(deviceRole);
  }, [deviceRole]);

  // Audio level visualizer listener
  useEffect(() => {
    const unsubscribeMic = speechEngine.onMicLevel((level) => {
      setMicLevel(level);
    });
    return unsubscribeMic;
  }, []);

  // Initialize or connect to Cloud Sync Session Room
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room') || 'ACT-' + Math.floor(100 + Math.random() * 900);

    const initialSession = cloudSyncService.initSession(
      roomParam,
      userId,
      currentScriptId,
      activeCharacter,
      deviceRole
    );
    setSession(initialSession);

    const unsubscribeSync = cloudSyncService.subscribe((updatedSession) => {
      setSession(updatedSession);

      // Mirror remote updates if different
      if (updatedSession.currentScriptId !== stateRef.current.currentScript?.id) {
        setCurrentScriptId(updatedSession.currentScriptId);
      }
      if (updatedSession.activeSceneIndex !== stateRef.current.activeSceneIndex) {
        setActiveSceneIndex(updatedSession.activeSceneIndex);
      }
      if (updatedSession.currentLineId !== stateRef.current.currentLineId) {
        setCurrentLineId(updatedSession.currentLineId);
      }
      if (updatedSession.rehearsalState !== stateRef.current.rehearsalState) {
        setRehearsalState(updatedSession.rehearsalState);
      }
      if (updatedSession.activeCharacter && updatedSession.activeCharacter !== stateRef.current.activeCharacter) {
        setActiveCharacter(updatedSession.activeCharacter);
      }
      if (updatedSession.mode !== stateRef.current.rehearsalMode) {
        setRehearsalMode(updatedSession.mode);
      }
    });

    return () => {
      unsubscribeSync();
    };
  }, [userId]);

  // Save scripts to session
  useEffect(() => {
    sessionStorage.setItem('sr_saved_scripts', JSON.stringify(scripts));
  }, [scripts]);

  // Navigation: Go to next line
  const handleNextLine = useCallback(() => {
    speechEngine.stopSpeaking();
    speechEngine.stopListening();
    setIsListening(false);
    setIsLineMatched(false);
    setLiveTranscript('');

    const scene = currentScript.scenes[activeSceneIndex] || currentScript.scenes[0];
    const currentIndex = scene.dialogue.findIndex((l) => l.line_id === currentLineId);

    if (currentIndex < scene.dialogue.length - 1) {
      const nextLine = scene.dialogue[currentIndex + 1];
      setCurrentLineId(nextLine.line_id);
      cloudSyncService.broadcastUpdate({
        currentLineId: nextLine.line_id,
        lastActionTimestamp: Date.now(),
      });
    } else if (activeSceneIndex < currentScript.scenes.length - 1) {
      // Advance to next scene
      const nextSceneIdx = activeSceneIndex + 1;
      const nextScene = currentScript.scenes[nextSceneIdx];
      setActiveSceneIndex(nextSceneIdx);
      if (nextScene.dialogue[0]) {
        setCurrentLineId(nextScene.dialogue[0].line_id);
      }
      cloudSyncService.broadcastUpdate({
        activeSceneIndex: nextSceneIdx,
        currentLineId: nextScene.dialogue[0]?.line_id || 1,
        lastActionTimestamp: Date.now(),
      });
    } else {
      // Completed script
      setRehearsalState('COMPLETED');
      cloudSyncService.broadcastUpdate({
        rehearsalState: 'COMPLETED',
        lastActionTimestamp: Date.now(),
      });
    }
  }, [currentScript, activeSceneIndex, currentLineId]);

  // Navigation: Go to previous line
  const handlePrevLine = useCallback(() => {
    speechEngine.stopSpeaking();
    speechEngine.stopListening();
    setIsListening(false);
    setIsLineMatched(false);
    setLiveTranscript('');

    const scene = currentScript.scenes[activeSceneIndex] || currentScript.scenes[0];
    const currentIndex = scene.dialogue.findIndex((l) => l.line_id === currentLineId);

    if (currentIndex > 0) {
      const prevLine = scene.dialogue[currentIndex - 1];
      setCurrentLineId(prevLine.line_id);
      cloudSyncService.broadcastUpdate({
        currentLineId: prevLine.line_id,
        lastActionTimestamp: Date.now(),
      });
    }
  }, [currentScript, activeSceneIndex, currentLineId]);

  // Replay current line
  const handleReplayLine = useCallback(() => {
    speechEngine.stopSpeaking();
    speechEngine.stopListening();
    setIsListening(false);
    setIsLineMatched(false);
    setLiveTranscript('');

    // Trigger step execution again
    executeRehearsalStep(currentLineId, true);
  }, [currentLineId]);

  // Play / Resume
  const handlePlay = useCallback(() => {
    setRehearsalState('PLAYING');
    cloudSyncService.broadcastUpdate({
      rehearsalState: 'PLAYING',
      lastActionTimestamp: Date.now(),
    });
  }, []);

  // Pause
  const handlePause = useCallback(() => {
    speechEngine.stopSpeaking();
    speechEngine.stopListening();
    setIsListening(false);
    setRehearsalState('PAUSED');
    cloudSyncService.broadcastUpdate({
      rehearsalState: 'PAUSED',
      lastActionTimestamp: Date.now(),
    });
  }, []);

  // Whisper Prompt (cheat cue)
  const handleWhisperPrompt = useCallback(() => {
    const scene = currentScript.scenes[activeSceneIndex] || currentScript.scenes[0];
    const line = scene.dialogue.find((l) => l.line_id === currentLineId);
    if (!line) return;

    const lang = sttConfig.language || 'nl-NL';
    speechEngine.whisperCue(line.text, lang);
  }, [currentScript, activeSceneIndex, currentLineId, sttConfig]);

  // Toggle Microphone
  const handleToggleMic = useCallback(() => {
    if (isListening) {
      speechEngine.stopListening();
      setIsListening(false);
    } else {
      const scene = currentScript.scenes[activeSceneIndex] || currentScript.scenes[0];
      const line = scene.dialogue.find((l) => l.line_id === currentLineId);
      if (line) {
        setIsListening(true);
        speechEngine.startListening(line.text, sttConfig, (transcript, isFinal, isMatched) => {
          setLiveTranscript(transcript);
          if (isMatched) {
            setIsLineMatched(true);
            setTimeout(() => {
              handleNextLine();
            }, 800);
          }
        });
      }
    }
  }, [isListening, currentScript, activeSceneIndex, currentLineId, sttConfig, handleNextLine]);

  // Core Rehearsal Engine Execution Loop
  const executeRehearsalStep = useCallback(
    async (lineId: number, isForceReplay: boolean = false) => {
      const scene = currentScript.scenes[activeSceneIndex] || currentScript.scenes[0];
      const line = scene.dialogue.find((l) => l.line_id === lineId);
      if (!line) return;

      const isActorRole =
        activeCharacter &&
        line.character.trim().toLowerCase() === activeCharacter.trim().toLowerCase();

      if (isActorRole) {
        // It's the user's line!
        setRehearsalState('WAITING_FOR_MIC');
        cloudSyncService.broadcastUpdate({
          rehearsalState: 'WAITING_FOR_MIC',
          currentLineId: lineId,
          lastActionTimestamp: Date.now(),
        });

        // Start listening to the actor's speech
        setIsListening(true);
        setIsLineMatched(false);
        setLiveTranscript('');

        speechEngine.startListening(line.text, sttConfig, (transcript, isFinal, isMatched) => {
          setLiveTranscript(transcript);
          if (isMatched) {
            setIsLineMatched(true);
            setTimeout(() => {
              handleNextLine();
            }, 750);
          }
        });
      } else {
        // Counterpart line: speak with TTS if on Audio Hub or Standalone
        setIsListening(false);
        speechEngine.stopListening();

        const charVoice = currentScript.characterVoices?.[line.character] || {
          language: sttConfig.language || 'nl-NL',
          pitch: 1.0,
          rate: rehearsalMode === 'speed_run' ? 1.25 : 1.0,
          volume: 1.0,
        };

        if (deviceRole === 'hub' || deviceRole === 'standalone') {
          await speechEngine.speak(line.text, charVoice);
        } else {
          // On Mic Remote, simulate slight speaking delay before advancing
          const readingDelay = Math.min(6000, Math.max(1500, line.text.length * 55));
          await new Promise((res) => setTimeout(res, readingDelay));
        }

        // If still in PLAYING state, auto-advance to next line!
        if (stateRef.current.rehearsalState === 'PLAYING' || isForceReplay) {
          handleNextLine();
        }
      }
    },
    [
      currentScript,
      activeSceneIndex,
      activeCharacter,
      deviceRole,
      rehearsalMode,
      sttConfig,
      handleNextLine,
    ]
  );

  // Trigger step when state is PLAYING or currentLineId changes
  useEffect(() => {
    if (rehearsalState === 'PLAYING') {
      executeRehearsalStep(currentLineId);
    }
  }, [rehearsalState, currentLineId]);

  // Hardened Purge & Logout
  const handleLogoutPurge = useCallback(() => {
    if (
      confirm(
        'Zero-Leakage Purge: This will securely wipe all cached theatrical scripts, browser speech queues, and tokens. Continue?'
      )
    ) {
      speechEngine.stopSpeaking();
      speechEngine.stopListening();
      cloudSyncService.cleanup();
      securityManager.purgeAllSessionData();
      window.location.reload();
    }
  }, []);

  return (
    <div className={`min-h-screen ${isStageDark ? 'bg-neutral-950' : 'bg-neutral-900'} text-neutral-100 flex flex-col font-sans select-none antialiased`}>
      {/* Top Navbar */}
      <Navbar
        currentScript={currentScript}
        activeCharacter={activeCharacter}
        deviceRole={deviceRole}
        rehearsalMode={rehearsalMode}
        session={session}
        onSelectRole={(role) => setDeviceRole(role)}
        onSelectMode={(mode) => {
          setRehearsalMode(mode);
          cloudSyncService.broadcastUpdate({ mode });
        }}
        onOpenLibrary={() => setIsLibraryOpen(true)}
        onOpenSyncModal={() => setIsSyncOpen(true)}
        onOpenVoiceModal={() => setIsVoiceOpen(true)}
        onOpenSecurityModal={() => setIsSecurityOpen(true)}
        onLogoutPurge={handleLogoutPurge}
        isStageDark={isStageDark}
        onToggleStageDark={() => setIsStageDark((prev) => !prev)}
      />

      {/* Main View: Switches between Teleprompter Stage View (Hub) & Pocket Remote (Mic Controller) */}
      <main className="flex-1 overflow-hidden relative">
        {deviceRole === 'mic_remote' ? (
          <RemoteControllerView
            script={currentScript}
            activeCharacter={activeCharacter}
            activeSceneIndex={activeSceneIndex}
            currentLineId={currentLineId}
            rehearsalState={rehearsalState}
            isListening={isListening}
            liveTranscript={liveTranscript}
            isLineMatched={isLineMatched}
            micLevel={micLevel}
            onSelectRole={(role) => setDeviceRole(role)}
            onPlay={handlePlay}
            onPause={handlePause}
            onNextLine={handleNextLine}
            onPrevLine={handlePrevLine}
            onReplayLine={handleReplayLine}
            onWhisperPrompt={handleWhisperPrompt}
            onToggleMic={handleToggleMic}
          />
        ) : (
          <ScriptStageView
            script={currentScript}
            activeCharacter={activeCharacter}
            activeSceneIndex={activeSceneIndex}
            currentLineId={currentLineId}
            rehearsalState={rehearsalState}
            rehearsalMode={rehearsalMode}
            deviceRole={deviceRole}
            isListening={isListening}
            liveTranscript={liveTranscript}
            isLineMatched={isLineMatched}
            micLevel={micLevel}
            onSelectScene={(idx) => {
              setActiveSceneIndex(idx);
              const scene = currentScript.scenes[idx];
              const firstLineId = scene?.dialogue[0]?.line_id || 1;
              setCurrentLineId(firstLineId);
              cloudSyncService.broadcastUpdate({
                activeSceneIndex: idx,
                currentLineId: firstLineId,
                lastActionTimestamp: Date.now(),
              });
            }}
            onPlay={handlePlay}
            onPause={handlePause}
            onNextLine={handleNextLine}
            onPrevLine={handlePrevLine}
            onReplayLine={handleReplayLine}
            onWhisperPrompt={handleWhisperPrompt}
            onToggleMic={handleToggleMic}
            onLineClick={(lineId) => {
              setCurrentLineId(lineId);
              cloudSyncService.broadcastUpdate({
                currentLineId: lineId,
                lastActionTimestamp: Date.now(),
              });
            }}
          />
        )}
      </main>

      {/* Modals */}
      <ScriptLibraryModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        scripts={scripts}
        currentScriptId={currentScriptId}
        activeCharacter={activeCharacter}
        onSelectScript={(selected) => {
          setCurrentScriptId(selected.id);
          setActiveSceneIndex(0);
          setCurrentLineId(selected.scenes[0]?.dialogue[0]?.line_id || 1);
          cloudSyncService.broadcastUpdate({
            currentScriptId: selected.id,
            activeSceneIndex: 0,
            currentLineId: selected.scenes[0]?.dialogue[0]?.line_id || 1,
            lastActionTimestamp: Date.now(),
          });
        }}
        onSelectCharacter={(char) => {
          setActiveCharacter(char);
          cloudSyncService.broadcastUpdate({
            activeCharacter: char,
            lastActionTimestamp: Date.now(),
          });
        }}
        onSaveScript={(newScript) => {
          setScripts((prev) => [newScript, ...prev]);
        }}
        onDeleteScript={(delId) => {
          setScripts((prev) => prev.filter((s) => s.id !== delId));
        }}
        currentUserId={userId}
      />

      <MultiDeviceSyncModal
        isOpen={isSyncOpen}
        onClose={() => setIsSyncOpen(false)}
        session={session}
        currentDeviceId={cloudSyncService.getDeviceId()}
        currentRole={deviceRole}
        onSetRole={(role) => setDeviceRole(role)}
        onJoinRoom={(roomPin) => {
          const joinedSession = cloudSyncService.initSession(
            roomPin,
            userId,
            currentScriptId,
            activeCharacter,
            deviceRole
          );
          setSession(joinedSession);
        }}
      />

      <VoiceSettingsModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        script={currentScript}
        onUpdateCharacterVoice={(charName, settings) => {
          const updatedVoices = {
            ...(currentScript.characterVoices || {}),
            [charName]: settings,
          };
          const updatedScript: Script = {
            ...currentScript,
            characterVoices: updatedVoices,
          };
          setScripts((prev) =>
            prev.map((s) => (s.id === updatedScript.id ? updatedScript : s))
          );
        }}
        sttConfig={sttConfig}
        onUpdateSTTConfig={(newCfg) => setSttConfig(newCfg)}
      />

      <SecurityModal
        isOpen={isSecurityOpen}
        onClose={() => setIsSecurityOpen(false)}
        currentUserId={userId}
        onEmergencyPurge={handleLogoutPurge}
      />
    </div>
  );
}
