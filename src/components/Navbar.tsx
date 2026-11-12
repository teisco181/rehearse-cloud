/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Sparkles,
  ShieldCheck,
  Smartphone,
  Monitor,
  Volume2,
  Users,
  Settings,
  BookOpen,
  LogOut,
  Radio,
  EyeOff,
  FastForward,
  PlayCircle,
  HelpCircle,
} from 'lucide-react';
import { DeviceRole, RehearsalMode, Script, RehearsalSession } from '../types/script';

interface NavbarProps {
  currentScript: Script | null;
  activeCharacter: string;
  deviceRole: DeviceRole;
  rehearsalMode: RehearsalMode;
  session: RehearsalSession | null;
  onSelectRole: (role: DeviceRole) => void;
  onSelectMode: (mode: RehearsalMode) => void;
  onOpenLibrary: () => void;
  onOpenSyncModal: () => void;
  onOpenVoiceModal: () => void;
  onOpenSecurityModal: () => void;
  onLogoutPurge: () => void;
  isStageDark: boolean;
  onToggleStageDark: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentScript,
  activeCharacter,
  deviceRole,
  rehearsalMode,
  session,
  onSelectRole,
  onSelectMode,
  onOpenLibrary,
  onOpenSyncModal,
  onOpenVoiceModal,
  onOpenSecurityModal,
  onLogoutPurge,
  isStageDark,
  onToggleStageDark,
}) => {
  const connectedDeviceCount = session?.devices
    ? Object.values(session.devices).filter((d) => d.isOnline).length
    : 1;

  const modeDescriptions: Record<RehearsalMode, { label: string; icon: React.ReactNode }> = {
    full: { label: 'Full Read-Through', icon: <PlayCircle className="w-3.5 h-3.5 text-emerald-400" /> },
    cues_only: { label: 'Cues Only', icon: <FastForward className="w-3.5 h-3.5 text-amber-400" /> },
    blind_run: { label: 'Blind Memory Run', icon: <EyeOff className="w-3.5 h-3.5 text-indigo-400" /> },
    speed_run: { label: 'Speed Run', icon: <FastForward className="w-3.5 h-3.5 text-rose-400" /> },
  };

  return (
    <header className="sticky top-0 z-40 border-b border-amber-950/40 bg-neutral-950/90 backdrop-blur-md text-neutral-100 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand & Script Identity */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-950/50 border border-amber-400/30">
              <span className="font-serif font-black text-lg text-neutral-950">SR</span>
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-1.5">
                <span className="font-serif tracking-wider font-bold text-amber-200 text-sm">
                  SCRIPTREHEARSER
                </span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Cloud
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 truncate max-w-[200px] lg:max-w-xs font-sans">
                {currentScript?.title || 'No Script Selected'}
              </p>
            </div>
          </div>

          {/* Quick Script Select / Library Button */}
          <button
            onClick={onOpenLibrary}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-800 hover:border-amber-500/40 transition shadow-sm"
            title="Open Script Library or Import AI Script"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-medium hidden md:inline">Scripts & AI Import</span>
            <span className="font-medium md:hidden">Scripts</span>
          </button>
        </div>

        {/* Center: Rehearsal Mode Selector & Role Switcher */}
        <div className="hidden lg:flex items-center gap-2">
          {/* Rehearsal Mode Switcher */}
          <div className="flex items-center p-1 bg-neutral-900 rounded-lg border border-neutral-800">
            {(['full', 'cues_only', 'blind_run', 'speed_run'] as RehearsalMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => onSelectMode(mode)}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md font-medium transition ${
                  rehearsalMode === mode
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
                }`}
              >
                {modeDescriptions[mode].icon}
                <span>{modeDescriptions[mode].label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right Tools & Sync Indicators */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Active Role Indicator / Toggle */}
          <button
            onClick={() => onSelectRole(deviceRole === 'hub' ? 'mic_remote' : 'hub')}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition ${
              deviceRole === 'hub'
                ? 'bg-blue-950/40 text-blue-300 border-blue-500/30 hover:bg-blue-900/40'
                : 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30 hover:bg-emerald-900/40'
            }`}
            title={`Current Role: ${deviceRole === 'hub' ? 'Audio Hub & Display' : 'Microphone Remote'}. Click to toggle.`}
          >
            {deviceRole === 'hub' ? (
              <Monitor className="w-3.5 h-3.5 text-blue-400" />
            ) : (
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            )}
            <span className="font-semibold hidden sm:inline">
              {deviceRole === 'hub' ? 'Audio Hub' : 'Mic Remote'}
            </span>
          </button>

          {/* Multi-Device Sync Room Button */}
          <button
            onClick={onOpenSyncModal}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-800 hover:border-amber-500/40 transition relative group"
            title="Multi-Device Pairing (PIN / QR)"
          >
            <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span className="font-mono text-amber-300 text-[11px] font-bold">
              {session?.id || 'ROOM'}
            </span>
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
              {connectedDeviceCount}
            </span>
          </button>

          {/* Voice Tuning Button */}
          <button
            onClick={onOpenVoiceModal}
            className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 hover:border-amber-500/40 transition"
            title="Voice Tuning (Dutch & English TTS)"
          >
            <Volume2 className="w-4 h-4 text-neutral-300" />
          </button>

          {/* Security & Zero Leakage Status */}
          <button
            onClick={onOpenSecurityModal}
            className="flex items-center gap-1 text-xs px-2 py-1.5 rounded-lg bg-emerald-950/30 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-900/30 transition"
            title="Zero-Leakage Security Policy & Firestore Rules Audit"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="hidden xl:inline text-[11px] font-medium">Zero-Leakage Active</span>
          </button>

          {/* Hardened Logout / Purge */}
          <button
            onClick={onLogoutPurge}
            className="p-2 rounded-lg bg-red-950/20 hover:bg-red-900/40 text-red-400 border border-red-500/20 hover:border-red-500/40 transition"
            title="Complete Hardened Logout & Cryptographic Purge"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sub-bar for Mobile / Tablet to select Rehearsal Mode */}
      <div className="lg:hidden flex items-center justify-between px-3 py-1.5 bg-neutral-900/60 border-t border-neutral-800/40 text-xs overflow-x-auto">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[11px] text-neutral-400">Mode:</span>
          {(['full', 'cues_only', 'blind_run'] as RehearsalMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => onSelectMode(mode)}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                rehearsalMode === mode
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {modeDescriptions[mode].label}
            </button>
          ))}
        </div>

        {activeCharacter && (
          <div className="text-[11px] text-amber-400 truncate ml-2 font-serif font-medium">
            Role: <span className="font-sans font-bold text-neutral-200">{activeCharacter}</span>
          </div>
        )}
      </div>
    </header>
  );
};
