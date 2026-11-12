/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RotateCcw,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  HelpCircle,
  Eye,
  EyeOff,
  ChevronDown,
  Activity,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  Script,
  Scene,
  DialogueLine,
  RehearsalState,
  RehearsalMode,
  DeviceRole,
} from '../types/script';

interface ScriptStageViewProps {
  script: Script;
  activeCharacter: string;
  activeSceneIndex: number;
  currentLineId: number;
  rehearsalState: RehearsalState;
  rehearsalMode: RehearsalMode;
  deviceRole: DeviceRole;
  isListening: boolean;
  liveTranscript: string;
  isLineMatched: boolean;
  micLevel: number;
  onSelectScene: (sceneIndex: number) => void;
  onPlay: () => void;
  onPause: () => void;
  onNextLine: () => void;
  onPrevLine: () => void;
  onReplayLine: () => void;
  onWhisperPrompt: () => void;
  onToggleMic: () => void;
  onLineClick: (lineId: number) => void;
}

export const ScriptStageView: React.FC<ScriptStageViewProps> = ({
  script,
  activeCharacter,
  activeSceneIndex,
  currentLineId,
  rehearsalState,
  rehearsalMode,
  deviceRole,
  isListening,
  liveTranscript,
  isLineMatched,
  micLevel,
  onSelectScene,
  onPlay,
  onPause,
  onNextLine,
  onPrevLine,
  onReplayLine,
  onWhisperPrompt,
  onToggleMic,
  onLineClick,
}) => {
  const currentScene: Scene | undefined = script.scenes[activeSceneIndex] || script.scenes[0];
  const activeLineRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [revealedHiddenLines, setRevealedHiddenLines] = useState<Record<number, boolean>>({});

  // Auto-scroll to active line
  useEffect(() => {
    if (activeLineRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentLineId, activeSceneIndex]);

  // Keyboard shortcuts for rehearsal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (rehearsalState === 'PLAYING' || rehearsalState === 'WAITING_FOR_MIC') {
          onPause();
        } else {
          onPlay();
        }
      } else if (e.code === 'ArrowRight' || e.code === 'KeyN') {
        e.preventDefault();
        onNextLine();
      } else if (e.code === 'ArrowLeft' || e.code === 'KeyP') {
        e.preventDefault();
        onPrevLine();
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        onReplayLine();
      } else if (e.code === 'KeyW') {
        e.preventDefault();
        onWhisperPrompt();
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        onToggleMic();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [rehearsalState, onPlay, onPause, onNextLine, onPrevLine, onReplayLine, onWhisperPrompt, onToggleMic]);

  const totalLines = currentScene ? currentScene.dialogue.length : 0;
  const currentLineIndex = currentScene
    ? currentScene.dialogue.findIndex((l) => l.line_id === currentLineId)
    : -1;
  const progressPercent = totalLines > 0 ? Math.round(((currentLineIndex + 1) / totalLines) * 100) : 0;

  const currentDialogue = currentScene?.dialogue.find((l) => l.line_id === currentLineId);
  const isMyTurn = currentDialogue && currentDialogue.character.trim().toLowerCase() === activeCharacter.trim().toLowerCase();

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-neutral-950 text-neutral-100 select-text overflow-hidden relative">
      {/* Top Scene Sub-Header & Progress */}
      <div className="border-b border-neutral-900 bg-neutral-950/80 px-4 py-2.5 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          {/* Scene Dropdown */}
          <div className="relative">
            <select
              value={activeSceneIndex}
              onChange={(e) => onSelectScene(Number(e.target.value))}
              aria-label="Select Scene"
              className="appearance-none bg-neutral-900 text-amber-300 font-serif font-bold text-sm rounded-lg pl-3 pr-8 py-1.5 border border-amber-900/40 hover:border-amber-700/60 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer shadow-sm"
            >
              {script.scenes.map((scene, idx) => (
                <option key={idx} value={idx}>
                  {scene.scene_title || `Scene ${idx + 1}`}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-amber-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <span className="text-xs text-neutral-400 hidden sm:inline">
            Line <span className="font-mono text-amber-400 font-bold">{Math.max(1, currentLineIndex + 1)}</span> of{' '}
            <span className="font-mono">{totalLines}</span>
          </span>
        </div>

        {/* Progress Bar & Status */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2">
            <div className="w-32 bg-neutral-900 h-2 rounded-full overflow-hidden border border-neutral-800">
              <div
                className="bg-gradient-to-r from-amber-600 to-amber-400 h-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-[11px] font-mono text-neutral-400">{progressPercent}%</span>
          </div>

          {/* Actor Turn Pill */}
          {isMyTurn ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>YOUR CUE</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-900 text-neutral-400 border border-neutral-800 text-xs font-medium">
              <Volume2 className="w-3.5 h-3.5 text-blue-400" />
              <span>Counterpart</span>
            </div>
          )}
        </div>
      </div>

      {/* Primary Teleprompter Dialogue Scroll Area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-4 sm:px-8 lg:px-16 py-8 space-y-6 max-w-4xl mx-auto w-full pb-36"
      >
        {currentScene?.dialogue.map((line, idx) => {
          const isActorLine =
            activeCharacter &&
            line.character.trim().toLowerCase() === activeCharacter.trim().toLowerCase();
          const isActive = line.line_id === currentLineId;
          const isPast = line.line_id < currentLineId;
          const isBlindHidden =
            rehearsalMode === 'blind_run' && isActorLine && !revealedHiddenLines[line.line_id] && !isActive;

          // For cue only mode, determine if this line is relevant
          if (rehearsalMode === 'cues_only' && !isActorLine) {
            const nextLine = currentScene.dialogue[idx + 1];
            const isImmediateCue =
              nextLine &&
              nextLine.character.trim().toLowerCase() === activeCharacter.trim().toLowerCase();
            if (!isImmediateCue && !isActive) {
              // Dimmed or compacted line
              return (
                <div
                  key={line.line_id}
                  onClick={() => onLineClick(line.line_id)}
                  className="cursor-pointer py-1 text-xs text-neutral-600 hover:text-neutral-400 transition italic font-serif flex items-center gap-2"
                >
                  <span className="font-semibold">{line.character}:</span>
                  <span className="truncate max-w-md">{line.text}</span>
                </div>
              );
            }
          }

          return (
            <div
              key={line.line_id}
              ref={isActive ? activeLineRef : null}
              onClick={() => onLineClick(line.line_id)}
              className={`p-4 sm:p-6 rounded-2xl transition-all duration-300 cursor-pointer relative border ${
                isActive
                  ? isActorLine
                    ? 'bg-amber-950/30 border-amber-500/60 shadow-xl shadow-amber-950/40 ring-1 ring-amber-500/30 scale-[1.01]'
                    : 'bg-neutral-900/90 border-blue-500/50 shadow-xl shadow-blue-950/30 ring-1 ring-blue-500/30 scale-[1.01]'
                  : isPast
                  ? 'bg-neutral-950/40 border-neutral-900/60 opacity-60 hover:opacity-90'
                  : 'bg-neutral-900/30 border-neutral-900 hover:border-neutral-800 hover:bg-neutral-900/50'
              }`}
            >
              {/* Top Character Meta Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`font-serif text-sm tracking-wide font-bold uppercase ${
                      isActorLine ? 'text-amber-300' : 'text-neutral-300'
                    }`}
                  >
                    {line.character}
                  </span>

                  {isActorLine && (
                    <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      You (My Role)
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-neutral-500">#{line.line_id}</span>
                  {isActive && (
                    <span className="flex h-2.5 w-2.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
                    </span>
                  )}
                </div>
              </div>

              {/* Stage Directions (if present) */}
              {line.stage_directions && (
                <p className="text-xs sm:text-sm text-neutral-400 italic mb-2 font-serif">
                  [{line.stage_directions}]
                </p>
              )}

              {/* Dialogue Text */}
              {isBlindHidden ? (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setRevealedHiddenLines((prev) => ({ ...prev, [line.line_id]: true }));
                  }}
                  className="py-3 px-4 rounded-xl bg-neutral-950 border border-dashed border-amber-500/30 text-amber-400/80 text-sm flex items-center justify-between group hover:bg-amber-950/20 transition cursor-pointer"
                >
                  <span className="flex items-center gap-2 font-mono text-xs">
                    <EyeOff className="w-4 h-4 text-amber-400" />
                    <span>Memory Blind Run: Text Hidden</span>
                  </span>
                  <span className="text-xs text-neutral-400 group-hover:text-amber-200">
                    Tap to peek
                  </span>
                </div>
              ) : (
                <p
                  className={`text-base sm:text-lg leading-relaxed font-sans ${
                    isActive
                      ? isActorLine
                        ? 'text-amber-100 font-medium'
                        : 'text-neutral-100 font-medium'
                      : 'text-neutral-300'
                  }`}
                >
                  {line.text}
                </p>
              )}

              {/* Active Actor Cue Live Feedback */}
              {isActive && isActorLine && (
                <div className="mt-4 pt-3 border-t border-amber-900/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs bg-amber-950/20 -mx-4 -mb-4 sm:-mx-6 sm:-mb-6 p-4 rounded-b-2xl">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isListening
                          ? 'bg-amber-500 text-neutral-950 animate-pulse'
                          : 'bg-neutral-800 text-neutral-400'
                      }`}
                    >
                      <Mic className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-amber-200 flex items-center gap-1.5">
                        {isLineMatched ? (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Line matched! Auto-advancing...
                          </span>
                        ) : isListening ? (
                          <span>Listening to your speech...</span>
                        ) : (
                          <span>Mic paused (Tap Space or Next to advance)</span>
                        )}
                      </div>
                      {liveTranscript && (
                        <p className="text-[11px] text-neutral-300 italic truncate max-w-sm">
                          Heard: "{liveTranscript}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onWhisperPrompt();
                      }}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition text-xs font-medium"
                      title="Whisper first 3 words of this line"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Whisper Cue</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onNextLine();
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 transition font-bold text-xs shadow-md"
                    >
                      <span>I'm Done</span>
                      <SkipForward className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Floating Tactical Bottom Rehearsal Control Bar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[95%] max-w-3xl z-30">
        <div className="bg-neutral-900/95 backdrop-blur-xl border border-amber-900/40 rounded-2xl shadow-2xl p-3 sm:p-4 flex items-center justify-between gap-3 text-neutral-100">
          {/* Left: Replay & Prev */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={onPrevLine}
              className="p-2 sm:p-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700/60 transition shadow-sm active:scale-95"
              title="Previous Line (Left Arrow / P)"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              onClick={onReplayLine}
              className="p-2 sm:p-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700/60 transition shadow-sm active:scale-95"
              title="Repeat Current Line (R)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Center: Play/Pause Primary Action Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={
                rehearsalState === 'PLAYING' || rehearsalState === 'WAITING_FOR_MIC'
                  ? onPause
                  : onPlay
              }
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold font-serif tracking-wide text-sm transition shadow-lg active:scale-95 ${
                rehearsalState === 'PLAYING' || rehearsalState === 'WAITING_FOR_MIC'
                  ? 'bg-neutral-800 text-amber-300 border border-amber-500/40 hover:bg-neutral-700'
                  : 'bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 text-neutral-950 border border-amber-400 hover:brightness-110 shadow-amber-950/60'
              }`}
            >
              {rehearsalState === 'PLAYING' || rehearsalState === 'WAITING_FOR_MIC' ? (
                <>
                  <Pause className="w-5 h-5 fill-current" />
                  <span>PAUSE</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  <span>REHEARSE</span>
                </>
              )}
            </button>

            {/* Whisper Prompt Button */}
            <button
              onClick={onWhisperPrompt}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-amber-300 border border-neutral-700/60 text-xs font-semibold transition"
              title="Whisper Actor Prompt (W)"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Prompt Me</span>
            </button>
          </div>

          {/* Right: Next Line & Mic Toggle */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={onToggleMic}
              className={`p-2 sm:p-2.5 rounded-xl border transition shadow-sm active:scale-95 ${
                isListening
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-neutral-800 text-neutral-400 border-neutral-700/60 hover:text-neutral-200'
              }`}
              title={isListening ? 'Microphone Active (Listening for Speech)' : 'Microphone Muted'}
            >
              {isListening ? (
                <div className="relative">
                  <Mic className="w-4 h-4 text-amber-400" />
                  {micLevel > 0.05 && (
                    <span
                      className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping"
                      style={{ opacity: Math.min(1, micLevel * 2) }}
                    />
                  )}
                </div>
              ) : (
                <MicOff className="w-4 h-4" />
              )}
            </button>

            <button
              onClick={onNextLine}
              className="p-2 sm:p-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 border border-amber-400 transition font-bold shadow-md active:scale-95"
              title="Next Line (Right Arrow / N)"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
