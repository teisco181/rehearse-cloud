/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Mic,
  MicOff,
  Sparkles,
  SkipForward,
  RotateCcw,
  Play,
  Pause,
  Monitor,
  Activity,
  CheckCircle2,
  Radio,
} from 'lucide-react';
import { Script, RehearsalState, DeviceRole } from '../types/script';

interface RemoteControllerViewProps {
  script: Script;
  activeCharacter: string;
  activeSceneIndex: number;
  currentLineId: number;
  rehearsalState: RehearsalState;
  isListening: boolean;
  liveTranscript: string;
  isLineMatched: boolean;
  micLevel: number;
  onSelectRole: (role: DeviceRole) => void;
  onPlay: () => void;
  onPause: () => void;
  onNextLine: () => void;
  onPrevLine: () => void;
  onReplayLine: () => void;
  onWhisperPrompt: () => void;
  onToggleMic: () => void;
}

export const RemoteControllerView: React.FC<RemoteControllerViewProps> = ({
  script,
  activeCharacter,
  activeSceneIndex,
  currentLineId,
  rehearsalState,
  isListening,
  liveTranscript,
  isLineMatched,
  micLevel,
  onSelectRole,
  onPlay,
  onPause,
  onNextLine,
  onPrevLine,
  onReplayLine,
  onWhisperPrompt,
  onToggleMic,
}) => {
  const currentScene = script.scenes[activeSceneIndex] || script.scenes[0];
  const currentLine = currentScene?.dialogue.find((l) => l.line_id === currentLineId);
  const prevLine = currentScene?.dialogue.find((l) => l.line_id === currentLineId - 1);

  const isMyTurn =
    currentLine &&
    currentLine.character.trim().toLowerCase() === activeCharacter.trim().toLowerCase();

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-neutral-950 text-neutral-100 flex flex-col justify-between p-4 sm:p-6 max-w-lg mx-auto">
      {/* Top Remote Status & Switcher */}
      <div className="flex items-center justify-between pb-4 border-b border-neutral-900">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono text-xs uppercase tracking-wider text-emerald-400 font-bold">
            Mic Controller Mode
          </span>
        </div>

        <button
          onClick={() => onSelectRole('hub')}
          className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 transition"
        >
          <Monitor className="w-3.5 h-3.5 text-blue-400" />
          <span>Switch to Display Hub</span>
        </button>
      </div>

      {/* Center Glanceable Cue & Actor Line Display */}
      <div className="my-auto py-6 space-y-4">
        {/* Previous Counterpart Cue */}
        {prevLine && !isMyTurn && (
          <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800/80 text-xs">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
              {prevLine.character}
            </span>
            <p className="text-neutral-300 italic">"{prevLine.text}"</p>
          </div>
        )}

        {/* Current Active Line */}
        {currentLine ? (
          <div
            className={`p-5 rounded-2xl border transition-all ${
              isMyTurn
                ? 'bg-amber-950/40 border-amber-500/60 shadow-xl shadow-amber-950/50'
                : 'bg-neutral-900/80 border-neutral-800'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className={`text-xs uppercase font-bold tracking-wider font-serif ${
                  isMyTurn ? 'text-amber-400' : 'text-neutral-400'
                }`}
              >
                {currentLine.character}
              </span>
              {isMyTurn ? (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                  SPEAK NOW
                </span>
              ) : (
                <span className="text-[10px] text-neutral-500">Audio Hub Speaking</span>
              )}
            </div>

            {currentLine.stage_directions && (
              <p className="text-xs text-neutral-400 italic font-serif mb-2">
                [{currentLine.stage_directions}]
              </p>
            )}

            <p
              className={`text-lg sm:text-xl font-medium leading-snug ${
                isMyTurn ? 'text-amber-100' : 'text-neutral-300'
              }`}
            >
              {currentLine.text}
            </p>
          </div>
        ) : (
          <div className="text-center py-8 text-neutral-500">End of scene</div>
        )}

        {/* Speech Recognition Feedback */}
        <div className="bg-neutral-900/90 rounded-2xl p-4 border border-neutral-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center transition ${
                  isListening
                    ? 'bg-amber-500 text-neutral-950'
                    : 'bg-neutral-800 text-neutral-400'
                }`}
              >
                <Mic className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-neutral-300">
                {isLineMatched
                  ? 'Line Matched! Advancing...'
                  : isListening
                  ? 'Continuous Listening'
                  : 'Microphone Paused'}
              </span>
            </div>

            <button
              onClick={onToggleMic}
              className={`text-[11px] px-2 py-1 rounded font-medium border ${
                isListening
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-neutral-800 text-neutral-400 border-neutral-700'
              }`}
            >
              {isListening ? 'Mute Mic' : 'Activate Mic'}
            </button>
          </div>

          {/* Visual Audio Level Wave */}
          <div className="h-2 w-full bg-neutral-950 rounded-full overflow-hidden border border-neutral-800 my-2">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500 transition-all duration-75"
              style={{ width: `${Math.min(100, Math.max(4, micLevel * 100))}%` }}
            />
          </div>

          {liveTranscript && (
            <p className="text-xs text-neutral-400 italic truncate mt-1">
              Heard: "{liveTranscript}"
            </p>
          )}
        </div>
      </div>

      {/* Massive Tactile Touch Buttons for Handheld Remote */}
      <div className="space-y-3 pt-2">
        {/* Giant Next / Cue Button */}
        <button
          onClick={onNextLine}
          className="w-full py-5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 hover:brightness-110 text-neutral-950 font-bold font-serif text-lg tracking-wide shadow-xl shadow-amber-950/60 active:scale-98 transition flex items-center justify-center gap-2 border border-amber-400"
        >
          <span>CUE NEXT LINE</span>
          <SkipForward className="w-5 h-5 fill-current" />
        </button>

        {/* Secondary Remote Actions */}
        <div className="grid grid-cols-3 gap-2">
          {/* Replay Line */}
          <button
            onClick={onReplayLine}
            className="py-3 px-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 text-xs font-semibold flex flex-col items-center gap-1 active:scale-95 transition"
          >
            <RotateCcw className="w-4 h-4 text-neutral-400" />
            <span>Repeat</span>
          </button>

          {/* Play/Pause */}
          <button
            onClick={
              rehearsalState === 'PLAYING' || rehearsalState === 'WAITING_FOR_MIC'
                ? onPause
                : onPlay
            }
            className="py-3 px-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 text-xs font-semibold flex flex-col items-center gap-1 active:scale-95 transition"
          >
            {rehearsalState === 'PLAYING' || rehearsalState === 'WAITING_FOR_MIC' ? (
              <>
                <Pause className="w-4 h-4 text-amber-400" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 text-emerald-400 fill-current" />
                <span>Resume</span>
              </>
            )}
          </button>

          {/* Whisper Prompt */}
          <button
            onClick={onWhisperPrompt}
            className="py-3 px-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold flex flex-col items-center gap-1 active:scale-95 transition"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Whisper Cue</span>
          </button>
        </div>
      </div>
    </div>
  );
};
