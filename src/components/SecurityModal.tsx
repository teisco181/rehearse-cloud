/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Copy,
  Check,
  Download,
  Terminal,
  RefreshCw,
  AlertTriangle,
  FileCode,
  EyeOff,
} from 'lucide-react';
import { securityManager } from '../services/security';

interface SecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  onEmergencyPurge: () => void;
}

export const SecurityModal: React.FC<SecurityModalProps> = ({
  isOpen,
  onClose,
  currentUserId,
  onEmergencyPurge,
}) => {
  const [activeTab, setActiveTab] = useState<'audit' | 'rules' | 'blueprint'>('audit');
  const [copiedRules, setCopiedRules] = useState(false);
  const [testResult, setTestResult] = useState<{
    tested: boolean;
    passed: boolean;
    details: string;
    timestamp?: string;
  }>({
    tested: false,
    passed: false,
    details: '',
  });

  if (!isOpen) return null;

  const handleRunPenetrationTest = () => {
    const result = securityManager.runPenetrationSelfTest();
    setTestResult({
      tested: true,
      passed: result.passed,
      details: result.details,
      timestamp: result.timestamp,
    });
  };

  const firestoreRulesText = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Default-deny catch-all
    match /{document=**} {
      allow read, write: if false;
    }

    function isOwner(userId) {
      return request.auth != null && request.auth.uid == userId;
    }

    // Zero-Leakage Policy: Strictly isolated under private /users/{userId} path
    match /users/{userId} {
      allow get: if isOwner(userId);
      allow list: if false; // No public user discovery

      match /scripts/{scriptId} {
        allow read, write: if isOwner(userId);
      }

      match /sessions/{sessionId} {
        allow read, write: if isOwner(userId);
      }
    }
  }
}`;

  const blueprintText = `{
  "entities": {
    "Script": {
      "title": "Script",
      "properties": {
        "id": { "type": "string" },
        "userId": { "type": "string" },
        "title": { "type": "string", "maxLength": 200 },
        "characters": { "type": "array" },
        "scenes": { "type": "array" }
      },
      "required": ["id", "userId", "title", "characters", "scenes"]
    },
    "RehearsalSession": {
      "title": "RehearsalSession",
      "properties": {
        "id": { "type": "string" },
        "userId": { "type": "string" },
        "currentScriptId": { "type": "string" },
        "rehearsalState": { "type": "string" }
      },
      "required": ["id", "userId", "currentScriptId", "rehearsalState"]
    }
  },
  "firestore": {
    "/users/{userId}/scripts/{scriptId}": { "schema": "Script" },
    "/users/{userId}/sessions/{sessionId}": { "schema": "RehearsalSession" }
  }
}`;

  const copyRules = () => {
    navigator.clipboard.writeText(firestoreRulesText);
    setCopiedRules(true);
    setTimeout(() => setCopiedRules(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-serif font-bold text-neutral-100 flex items-center gap-2">
                <span>Security & Zero-Leakage Policy Center</span>
                <span className="px-2 py-0.5 rounded text-[10px] uppercase font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Enforced
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Guaranteed confidentiality for unreleased, copyright-protected theater scripts
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

        {/* Tab switcher */}
        <div className="flex border-b border-neutral-800 px-6 bg-neutral-950/40">
          <button
            onClick={() => setActiveTab('audit')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition ${
              activeTab === 'audit'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Data Isolation Audit
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'rules'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Firestore ABAC Rules</span>
          </button>
          <button
            onClick={() => setActiveTab('blueprint')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'blueprint'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Firebase Blueprint IR</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'audit' && (
            <div className="space-y-6">
              {/* 4 Pillars of Zero Leakage Policy */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800/80">
                  <div className="flex items-center gap-2 mb-1.5 text-emerald-400 text-xs font-bold">
                    <Lock className="w-4 h-4" />
                    <span>Strict UID Resource Partitioning</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Database operations strictly check <code className="text-amber-300 font-mono">request.auth.uid == userId</code>. Scripts and dialogues are never stored in unpartitioned root collections.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800/80">
                  <div className="flex items-center gap-2 mb-1.5 text-emerald-400 text-xs font-bold">
                    <EyeOff className="w-4 h-4" />
                    <span>Zero Cross-Account Visibility</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Zero public directories, zero cross-user search, and zero global feeds. Any query attempting to inspect foreign records is intercepted immediately.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800/80">
                  <div className="flex items-center gap-2 mb-1.5 text-emerald-400 text-xs font-bold">
                    <RefreshCw className="w-4 h-4" />
                    <span>Cryptographic Session Purging</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Logging out completely clears memory caches, token variables, browser speech queues, and storage entries, forcing a fresh authenticated login.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800/80">
                  <div className="flex items-center gap-2 mb-1.5 text-emerald-400 text-xs font-bold">
                    <ShieldCheck className="w-4 h-4" />
                    <span>GitHub Pages Client Sandbox</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Operates as a pure client-side SPA with no untrusted intermediary servers, ensuring zero server-side telemetry or script logging.
                  </p>
                </div>
              </div>

              {/* Live Penetration Test Suite */}
              <div className="p-5 rounded-2xl bg-neutral-950 border border-emerald-900/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-mono uppercase text-emerald-400 font-bold tracking-wider">
                      Adversarial Security Self-Test
                    </h3>
                    <p className="text-[11px] text-neutral-400">
                      Simulates a cross-tenant read attack against a foreign actor's script.
                    </p>
                  </div>

                  <button
                    onClick={handleRunPenetrationTest}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs transition shadow-md flex items-center gap-1.5"
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    <span>Run Verification Test</span>
                  </button>
                </div>

                {testResult.tested && (
                  <div
                    className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                      testResult.passed
                        ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                        : 'bg-red-950/40 border-red-500/40 text-red-200'
                    }`}
                  >
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">
                        {testResult.passed ? 'TEST PASSED (100% BLOCKED)' : 'TEST FAILED'}
                      </span>
                      <p className="text-[11px] text-neutral-300 mt-0.5">{testResult.details}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Emergency Session Wipe Button */}
              <div className="p-4 rounded-2xl bg-red-950/20 border border-red-500/20 flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-red-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <span>Emergency Memory & Cache Wipe</span>
                  </h4>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Immediately purge all cached scripts, speech utterances, and authentication tokens.
                  </p>
                </div>

                <button
                  onClick={() => {
                    if (confirm('Immediately purge all session caches, scripts, and tokens?')) {
                      onEmergencyPurge();
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl bg-red-900/60 hover:bg-red-800 text-red-200 border border-red-500/40 text-xs font-bold transition shrink-0"
                >
                  Emergency Purge
                </button>
              </div>
            </div>
          )}

          {activeTab === 'rules' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-neutral-400">
                  Target: <strong className="text-neutral-200">firestore.rules</strong> (ABAC Zero-Leakage)
                </span>
                <button
                  onClick={copyRules}
                  className="flex items-center gap-1 text-xs text-amber-300 hover:text-amber-200 transition font-mono"
                >
                  {copiedRules ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedRules ? 'Copied to Clipboard' : 'Copy Rules'}</span>
                </button>
              </div>

              <pre className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 font-mono text-xs text-neutral-300 overflow-x-auto leading-relaxed max-h-96">
                {firestoreRulesText}
              </pre>
            </div>
          )}

          {activeTab === 'blueprint' && (
            <div className="space-y-3">
              <span className="text-xs font-mono text-neutral-400 block">
                Target: <strong className="text-neutral-200">firebase-blueprint.json</strong> (Draft-07 IR)
              </span>
              <pre className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 font-mono text-xs text-neutral-300 overflow-x-auto leading-relaxed max-h-96">
                {blueprintText}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-end">
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
