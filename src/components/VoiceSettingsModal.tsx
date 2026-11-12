/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Volume2,
  Mic,
  Sliders,
  Play,
  RotateCcw,
  Sparkles,
  Check,
} from 'lucide-react';
import { Script, VoiceSettings, SpeechMatchConfig } from '../types/script';
import { speechEngine, AvailableVoice } from '../services/speechEngine';

interface VoiceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  script: Script | null;
  onUpdateCharacterVoice: (character: string, settings: VoiceSettings) => void;
  sttConfig: SpeechMatchConfig;
  onUpdateSTTConfig: (config: SpeechMatchConfig) => void;
}

export const VoiceSettingsModal: React.FC<VoiceSettingsModalProps> = ({
  isOpen,
  onClose,
  script,
  onUpdateCharacterVoice,
  sttConfig,
  onUpdateSTTConfig,
}) => {
  const [selectedCharacter, setSelectedCharacter] = useState<string>(
    script?.characters[0] || ''
  );
  const [testingVoice, setTestingVoice] = useState(false);

  if (!isOpen) return null;

  const characters = script?.characters || [];
  const currentVoiceSettings: VoiceSettings = (script?.characterVoices &&
    selectedCharacter &&
    script.characterVoices[selectedCharacter]) || {
    language: 'nl-NL',
    pitch: 1.0,
    rate: 1.0,
    volume: 1.0,
  };

  const availableVoices = speechEngine.getAvailableVoices();
  const dutchVoices = availableVoices.filter((v) => v.isDutch);
  const englishVoices = availableVoices.filter((v) => v.isEnglish);
  const otherVoices = availableVoices.filter((v) => !v.isDutch && !v.isEnglish);

  const handleTestSpeech = async () => {
    setTestingVoice(true);
    const sampleText =
      currentVoiceSettings.language.startsWith('nl')
        ? `Hallo, ik ben de stem voor ${selectedCharacter || 'dit personage'}. Welkom bij de repetitie.`
        : `Hello, I am the voice model for ${selectedCharacter || 'this character'}. Ready for the cue.`;

    await speechEngine.speak(sampleText, currentVoiceSettings);
    setTestingVoice(false);
  };

  const updateSettings = (partial: Partial<VoiceSettings>) => {
    if (!selectedCharacter) return;
    const updated: VoiceSettings = {
      ...currentVoiceSettings,
      ...partial,
    };
    onUpdateCharacterVoice(selectedCharacter, updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-serif font-bold text-amber-200">
                Voice & Speech Engine Tuning
              </h2>
              <p className="text-xs text-neutral-400">
                Dutch & English TTS voice models and speech recognition sensitivity
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Per-Character Voice Customization */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase text-neutral-400 tracking-wider">
                1. Select Character to Tune
              </span>
              <span className="text-[11px] text-neutral-500">
                {characters.length} characters in script
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {characters.map((char) => (
                <button
                  key={char}
                  onClick={() => setSelectedCharacter(char)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
                    selectedCharacter === char
                      ? 'bg-amber-500 text-neutral-950 border-amber-400 shadow-md font-bold'
                      : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:border-amber-500/40'
                  }`}
                >
                  {char}
                </button>
              ))}
            </div>

            {selectedCharacter && (
              <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-serif font-bold text-sm text-amber-300">
                    Voice Settings for "{selectedCharacter}"
                  </h4>
                  <button
                    onClick={handleTestSpeech}
                    disabled={testingVoice}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold transition disabled:opacity-50"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{testingVoice ? 'Speaking...' : 'Test Voice Audio'}</span>
                  </button>
                </div>

                {/* Voice Selection */}
                <div>
                  <label className="block text-xs font-mono text-neutral-400 mb-1.5">
                    TTS Voice Model (Dutch / English)
                  </label>
                  <select
                    value={currentVoiceSettings.voiceURI || ''}
                    onChange={(e) => {
                      const selectedVoice = availableVoices.find((v) => v.voiceURI === e.target.value);
                      updateSettings({
                        voiceURI: e.target.value,
                        language: selectedVoice?.lang || currentVoiceSettings.language,
                      });
                    }}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="">Default System Voice for Language</option>
                    {dutchVoices.length > 0 && (
                      <optgroup label="Dutch Voices (Nederlands)">
                        {dutchVoices.map((v) => (
                          <option key={v.voiceURI} value={v.voiceURI}>
                            🇳🇱 {v.name} ({v.lang})
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {englishVoices.length > 0 && (
                      <optgroup label="English Voices (UK / US)">
                        {englishVoices.map((v) => (
                          <option key={v.voiceURI} value={v.voiceURI}>
                            🇬🇧 / 🇺🇸 {v.name} ({v.lang})
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {otherVoices.length > 0 && (
                      <optgroup label="Other Available Voices">
                        {otherVoices.map((v) => (
                          <option key={v.voiceURI} value={v.voiceURI}>
                            {v.name} ({v.lang})
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>

                {/* Pitch & Rate Sliders */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-mono text-neutral-400">Speech Rate</span>
                      <span className="font-mono text-amber-400">{currentVoiceSettings.rate}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.6"
                      max="1.5"
                      step="0.05"
                      value={currentVoiceSettings.rate}
                      onChange={(e) => updateSettings({ rate: parseFloat(e.target.value) })}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-mono text-neutral-400">Voice Pitch</span>
                      <span className="font-mono text-amber-400">{currentVoiceSettings.pitch}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.6"
                      max="1.5"
                      step="0.05"
                      value={currentVoiceSettings.pitch}
                      onChange={(e) => updateSettings({ pitch: parseFloat(e.target.value) })}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Speech-to-Text (STT) Recognition Settings */}
          <div className="space-y-4 pt-4 border-t border-neutral-800">
            <span className="text-xs font-mono uppercase text-neutral-400 tracking-wider">
              2. Speech-to-Text (Microphone Hands-Free Advancement)
            </span>

            <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-4">
              {/* STT Language */}
              <div>
                <label className="block text-xs font-mono text-neutral-400 mb-1.5">
                  Microphone Recognition Language
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'nl-NL', label: '🇳🇱 Nederlands' },
                    { id: 'en-US', label: '🇺🇸 English (US)' },
                    { id: 'en-GB', label: '🇬🇧 English (UK)' },
                  ].map((lang) => (
                    <button
                      key={lang.id}
                      onClick={() =>
                        onUpdateSTTConfig({ ...sttConfig, language: lang.id as any })
                      }
                      className={`py-2 px-3 rounded-xl text-xs font-medium border transition ${
                        sttConfig.language === lang.id
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                          : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Matching Tolerance */}
              <div>
                <label className="block text-xs font-mono text-neutral-400 mb-1.5">
                  Spoken Line Matching Tolerance
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'strict', label: 'Strict (75%)', desc: 'Exact memorization' },
                    { id: 'moderate', label: 'Moderate (50%)', desc: 'Balanced rehearsal' },
                    { id: 'lenient', label: 'Lenient (35%)', desc: 'Early learning' },
                    { id: 'keyword', label: 'Keywords Only', desc: 'Any 2 key words' },
                  ].map((tol) => (
                    <button
                      key={tol.id}
                      onClick={() =>
                        onUpdateSTTConfig({ ...sttConfig, tolerance: tol.id as any })
                      }
                      className={`p-2.5 rounded-xl text-left border transition ${
                        sttConfig.tolerance === tol.id
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                          : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <div className="text-xs font-semibold text-neutral-200">{tol.label}</div>
                      <div className="text-[10px] text-neutral-500">{tol.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
