/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from '@google/genai';
import mammoth from 'mammoth';
import { Script, Scene, DialogueLine } from '../types/script';

export interface ParsedScriptOutput {
  title: string;
  characters: string[];
  scenes: {
    scene_title: string;
    dialogue: {
      line_id: number;
      character: string;
      text: string;
      stage_directions?: string;
    }[];
  }[];
}

export class GeminiScriptParser {
  private static apiKey: string =
    (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY) ||
    '';

  public static setApiKey(key: string) {
    this.apiKey = key;
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('sr_custom_gemini_key', key);
    }
  }

  public static getApiKey(): string {
    if (!this.apiKey && typeof sessionStorage !== 'undefined') {
      const stored = sessionStorage.getItem('sr_custom_gemini_key');
      if (stored) this.apiKey = stored;
    }
    return this.apiKey;
  }

  /**
   * Extract raw text from File (txt, docx, pdf)
   */
  public static async extractTextFromFile(file: File): Promise<string> {
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension === 'txt') {
      return await file.text();
    }

    if (extension === 'docx') {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        return result.value;
      } catch (err) {
        console.error('[Parser] DOCX extraction error:', err);
        throw new Error('Failed to parse .docx file. Please check file format.');
      }
    }

    if (extension === 'pdf') {
      // For PDF, read as text stream or pass through
      const raw = await file.text();
      // Clean non-printable characters for simple text representation
      const clean = raw.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ');
      if (clean.length > 100) return clean;
      return `[PDF File: ${file.name} - ${file.size} bytes]`;
    }

    return await file.text();
  }

  /**
   * Parse script text using Gemini 3.8 Flash with structured JSON output schema
   */
  public static async parseScriptWithAI(rawScriptText: string, currentUserId: string): Promise<Script> {
    const key = this.getApiKey();

    if (key) {
      try {
        const ai = new GoogleGenAI({ apiKey: key });

        const prompt = `You are an expert theatrical script analyst and dramaturg.
Parse the following theatrical or musical script into structured scenes, characters, and dialogue lines.
Adhere strictly to the requested JSON schema.
Extract all character names cleanly.
Separate actor dialogue from stage directions/cues (stage directions are in parentheses, brackets, or italics).
Maintain line order and assign sequential line_id numbers.

SCRIPT TEXT:
"""
${rawScriptText.slice(0, 35000)}
"""`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            systemInstruction:
              'You are a high-precision script parsing engine for theater and film actors. Return valid JSON only.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                characters: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                scenes: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      scene_title: { type: Type.STRING },
                      dialogue: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            line_id: { type: Type.INTEGER },
                            character: { type: Type.STRING },
                            text: { type: Type.STRING },
                            stage_directions: { type: Type.STRING },
                          },
                          required: ['line_id', 'character', 'text'],
                        },
                      },
                    },
                    required: ['scene_title', 'dialogue'],
                  },
                },
              },
              required: ['title', 'characters', 'scenes'],
            },
          },
        });

        const jsonText = response.text?.trim() || '{}';
        const parsed: ParsedScriptOutput = JSON.parse(jsonText);

        return {
          id: 'script_' + Date.now().toString(36),
          userId: currentUserId,
          title: parsed.title || 'Untitled Play / Script',
          characters: parsed.characters || [],
          scenes: parsed.scenes || [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      } catch (aiError) {
        console.warn('[Gemini Parser] AI generation failed, falling back to heuristic dramaturg parser:', aiError);
      }
    }

    // Heuristic script parser fallback (works 100% offline or without API key)
    return this.fallbackHeuristicParser(rawScriptText, currentUserId);
  }

  /**
   * Deterministic theatrical script parser (Standard play/musical formatting)
   */
  public static fallbackHeuristicParser(text: string, currentUserId: string): Script {
    const lines = text.split(/\r?\n/);
    let title = 'Imported Script';
    const charactersSet = new Set<string>();
    const scenes: Scene[] = [];
    let currentScene: Scene = { scene_title: 'Scene 1', dialogue: [] };
    let lineCounter = 1;

    // Detect title from first non-empty lines
    for (let i = 0; i < Math.min(lines.length, 5); i++) {
      const line = lines[i].trim();
      if (line && !line.includes(':') && line.length < 60) {
        title = line;
        break;
      }
    }

    // Character pattern: e.g. "HAMLET:", "JULIAN (whispering):", or uppercase "OPHELIA"
    const charColonRegex = /^([A-Z0-9\s\(\)\.\'\-]+):\s*(.*)$/;
    const upperCharRegex = /^([A-Z][A-Z0-9\s\.\'\-]{2,25})$/;

    let pendingCharacter: string | null = null;
    let pendingStageDirections: string = '';

    for (let i = 0; i < lines.length; i++) {
      const rawLine = lines[i].trim();
      if (!rawLine) continue;

      // Check scene headers: "SCENE 1", "ACT II, SCENE 3"
      if (/^(SCENE|ACT|SCÈNE|BEDRIJF)\b/i.test(rawLine)) {
        if (currentScene.dialogue.length > 0) {
          scenes.push(currentScene);
          currentScene = { scene_title: rawLine, dialogue: [] };
        } else {
          currentScene.scene_title = rawLine;
        }
        continue;
      }

      // Check stage directions in parentheses on its own line: "(He exits left)" or "[She turns away]"
      if (/^[\(\[][^\)\]]+[\)\]]$/.test(rawLine)) {
        pendingStageDirections = rawLine.replace(/^[\(\[]|[\)\]]$/g, '').trim();
        continue;
      }

      // Pattern 1: "CHARACTER: Dialogue"
      const colonMatch = rawLine.match(charColonRegex);
      if (colonMatch) {
        let charName = colonMatch[1].trim();
        let dialogText = colonMatch[2].trim();
        let stageDir = pendingStageDirections;
        pendingStageDirections = '';

        // Extract inline parenthetical stage directions e.g. "HAMLET (angrily)"
        const parenInChar = charName.match(/^(.*?)\s*\((.*?)\)$/);
        if (parenInChar) {
          charName = parenInChar[1].trim();
          stageDir = stageDir ? `${stageDir}; ${parenInChar[2]}` : parenInChar[2];
        }

        // Inline stage directions in dialogue e.g. "(pauses) Where are you going?"
        const inlineParen = dialogText.match(/^\((.*?)\)\s*(.*)$/);
        if (inlineParen) {
          stageDir = stageDir ? `${stageDir}; ${inlineParen[1]}` : inlineParen[1];
          dialogText = inlineParen[2];
        }

        if (charName.length > 1 && charName.length < 35) {
          charactersSet.add(charName);
          currentScene.dialogue.push({
            line_id: lineCounter++,
            character: charName,
            text: dialogText || '...',
            stage_directions: stageDir || undefined,
          });
          continue;
        }
      }

      // Pattern 2: Uppercase character name on one line, dialogue on next line
      const upperMatch = rawLine.match(upperCharRegex);
      if (upperMatch && !rawLine.startsWith('INT.') && !rawLine.startsWith('EXT.')) {
        pendingCharacter = upperMatch[1].trim();
        continue;
      }

      if (pendingCharacter) {
        let dialogText = rawLine;
        let stageDir = pendingStageDirections;
        pendingStageDirections = '';

        const inlineParen = dialogText.match(/^\((.*?)\)\s*(.*)$/);
        if (inlineParen) {
          stageDir = stageDir ? `${stageDir}; ${inlineParen[1]}` : inlineParen[1];
          dialogText = inlineParen[2];
        }

        charactersSet.add(pendingCharacter);
        currentScene.dialogue.push({
          line_id: lineCounter++,
          character: pendingCharacter,
          text: dialogText,
          stage_directions: stageDir || undefined,
        });
        pendingCharacter = null;
        continue;
      }
    }

    if (currentScene.dialogue.length > 0) {
      scenes.push(currentScene);
    }

    // Fallback if no structured dialogue was extracted
    if (scenes.length === 0 || scenes.every((s) => s.dialogue.length === 0)) {
      scenes.push({
        scene_title: 'Scene 1',
        dialogue: [
          {
            line_id: 1,
            character: 'Narrator',
            text: text.slice(0, 300) || 'Welcome to the rehearsal.',
          },
        ],
      });
      charactersSet.add('Narrator');
    }

    return {
      id: 'script_' + Date.now().toString(36),
      userId: currentUserId,
      title: title || 'Imported Play',
      characters: Array.from(charactersSet),
      scenes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}
