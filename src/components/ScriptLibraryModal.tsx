/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  UploadCloud,
  FileText,
  Sparkles,
  BookOpen,
  UserCheck,
  Check,
  Plus,
  Trash2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Script } from '../types/script';
import { GeminiScriptParser } from '../services/geminiScriptParser';
import { SAMPLE_SCRIPTS } from '../data/sampleScripts';

interface ScriptLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  scripts: Script[];
  currentScriptId: string;
  activeCharacter: string;
  onSelectScript: (script: Script) => void;
  onSelectCharacter: (character: string) => void;
  onSaveScript: (script: Script) => void;
  onDeleteScript: (scriptId: string) => void;
  currentUserId: string;
}

export const ScriptLibraryModal: React.FC<ScriptLibraryModalProps> = ({
  isOpen,
  onClose,
  scripts,
  currentScriptId,
  activeCharacter,
  onSelectScript,
  onSelectCharacter,
  onSaveScript,
  onDeleteScript,
  currentUserId,
}) => {
  const [tab, setTab] = useState<'library' | 'import' | 'paste'>('library');
  const [isParsing, setIsParsing] = useState(false);
  const [parseStatus, setParseStatus] = useState<string>('');
  const [rawTextPaste, setRawTextPaste] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState(GeminiScriptParser.getApiKey() || '');

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsParsing(true);
      setParseStatus(`Reading ${file.name}...`);
      const extractedText = await GeminiScriptParser.extractTextFromFile(file);

      setParseStatus('AI parsing dialogue, scenes, and characters with Gemini...');
      const parsed = await GeminiScriptParser.parseScriptWithAI(extractedText, currentUserId);

      if (customTitle) {
        parsed.title = customTitle;
      }

      onSaveScript(parsed);
      onSelectScript(parsed);
      if (parsed.characters.length > 0) {
        onSelectCharacter(parsed.characters[0]);
      }
      setIsParsing(false);
      setTab('library');
    } catch (err: any) {
      console.error('File parsing error:', err);
      alert('Failed to parse script: ' + (err.message || 'Unknown error'));
      setIsParsing(false);
    }
  };

  const handlePasteSubmit = async () => {
    if (!rawTextPaste.trim()) return;

    try {
      setIsParsing(true);
      setParseStatus('Analyzing script text with Gemini AI...');
      const parsed = await GeminiScriptParser.parseScriptWithAI(rawTextPaste, currentUserId);

      if (customTitle) {
        parsed.title = customTitle;
      }

      onSaveScript(parsed);
      onSelectScript(parsed);
      if (parsed.characters.length > 0) {
        onSelectCharacter(parsed.characters[0]);
      }
      setIsParsing(false);
      setTab('library');
      setRawTextPaste('');
    } catch (err: any) {
      alert('Failed to parse pasted script: ' + err.message);
      setIsParsing(false);
    }
  };

  const currentScript = scripts.find((s) => s.id === currentScriptId) || scripts[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-serif font-bold text-amber-200">
                Theatrical Scripts & AI Import
              </h2>
              <p className="text-xs text-neutral-400">
                Isolated and encrypted theatrical material (Zero Leakage)
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

        {/* Tab navigation */}
        <div className="flex border-b border-neutral-800 px-6 bg-neutral-950/40">
          <button
            onClick={() => setTab('library')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition ${
              tab === 'library'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Script Library ({scripts.length})
          </button>
          <button
            onClick={() => setTab('import')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
              tab === 'import'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Upload Document (.pdf, .docx, .txt)</span>
          </button>
          <button
            onClick={() => setTab('paste')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
              tab === 'paste'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Paste Text / Google Docs</span>
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-6">
          {tab === 'library' && (
            <div className="space-y-6">
              {/* Active Character Assignment for Current Script */}
              {currentScript && (
                <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs uppercase font-serif font-bold text-amber-300 flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-amber-400" />
                      Select Your Rehearsal Role
                    </span>
                    <span className="text-[11px] text-neutral-400">
                      Active: <strong className="text-amber-200">{activeCharacter || 'None'}</strong>
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {currentScript.characters.map((char) => (
                      <button
                        key={char}
                        onClick={() => onSelectCharacter(char)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition border flex items-center gap-1.5 ${
                          activeCharacter === char
                            ? 'bg-amber-500 text-neutral-950 border-amber-400 shadow-md font-bold'
                            : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:border-amber-500/40'
                        }`}
                      >
                        {activeCharacter === char && <Check className="w-3.5 h-3.5" />}
                        <span>{char}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Script List */}
              <div className="space-y-3">
                <span className="text-xs font-mono uppercase text-neutral-400 tracking-wider">
                  Available Scripts
                </span>
                <div className="grid gap-3">
                  {scripts.map((script) => {
                    const isSelected = script.id === currentScriptId;
                    const totalLines = script.scenes.reduce(
                      (acc, s) => acc + s.dialogue.length,
                      0
                    );

                    return (
                      <div
                        key={script.id}
                        onClick={() => {
                          onSelectScript(script);
                          if (script.characters.length > 0 && !script.characters.includes(activeCharacter)) {
                            onSelectCharacter(script.characters[0]);
                          }
                        }}
                        className={`p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-4 ${
                          isSelected
                            ? 'bg-neutral-800 border-amber-500 shadow-lg ring-1 ring-amber-500/40'
                            : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-serif font-bold text-sm text-neutral-100 truncate">
                              {script.title}
                            </h3>
                            {isSelected && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                Current
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-neutral-400">
                            <span>{script.scenes.length} Scenes</span>
                            <span>•</span>
                            <span>{totalLines} Lines</span>
                            <span>•</span>
                            <span className="truncate max-w-xs">
                              {script.characters.slice(0, 3).join(', ')}
                              {script.characters.length > 3 ? '...' : ''}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {scripts.length > 1 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Remove "${script.title}" from rehearsal library?`)) {
                                  onDeleteScript(script.id);
                                }
                              }}
                              className="p-2 rounded-xl text-neutral-500 hover:text-red-400 hover:bg-neutral-800 transition"
                              title="Delete script"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {tab === 'import' && (
            <div className="space-y-6">
              {/* Drag and Drop Zone */}
              <div className="border-2 border-dashed border-neutral-700 hover:border-amber-500/60 rounded-3xl p-8 text-center transition bg-neutral-950/40 relative">
                <input
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={handleFileUpload}
                  disabled={isParsing}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full disabled:cursor-not-allowed"
                />

                <div className="flex flex-col items-center">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-3 border border-amber-500/20">
                    {isParsing ? (
                      <Loader2 className="w-7 h-7 animate-spin text-amber-400" />
                    ) : (
                      <UploadCloud className="w-7 h-7" />
                    )}
                  </div>
                  <h3 className="font-serif font-bold text-neutral-200 text-base mb-1">
                    {isParsing ? 'Processing Document with AI...' : 'Drag and drop your script file here'}
                  </h3>
                  <p className="text-xs text-neutral-400 mb-3">
                    Supports .pdf, .docx (Word), and .txt exported from Google Docs, Final Draft, or Celtx
                  </p>
                  <span className="px-4 py-2 rounded-xl bg-amber-500 text-neutral-950 font-bold text-xs shadow-md">
                    Browse Files
                  </span>
                </div>
              </div>

              {isParsing && (
                <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-amber-400 animate-spin shrink-0" />
                  <span className="text-xs text-neutral-300 font-mono">{parseStatus}</span>
                </div>
              )}
            </div>
          )}

          {tab === 'paste' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-neutral-400 mb-1">
                  Optional Script Title
                </label>
                <input
                  type="text"
                  placeholder="e.g., Hamlet - Act 3 Scene 1"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-neutral-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-400 mb-1">
                  Script Raw Dialogue Text
                </label>
                <textarea
                  rows={9}
                  placeholder={`Paste script text directly, e.g.:

HAMLET: To be, or not to be, that is the question.
OPHELIA: (softly) My lord, I have remembrances of yours...
HAMLET: No, not I. I never gave you aught.`}
                  value={rawTextPaste}
                  onChange={(e) => setRawTextPaste(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3.5 text-xs text-neutral-100 font-mono leading-relaxed focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-neutral-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Extracts characters, scene breaks, and stage directions automatically
                </span>

                <button
                  onClick={handlePasteSubmit}
                  disabled={!rawTextPaste.trim() || isParsing}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-neutral-950 font-bold text-xs flex items-center gap-2 shadow-md transition"
                >
                  {isParsing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Parsing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Parse with Gemini AI</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-between">
          <span className="text-[11px] text-neutral-500">
            Confidential script data never leaves your isolated account.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
