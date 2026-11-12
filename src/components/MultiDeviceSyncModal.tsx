/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Radio,
  Smartphone,
  Monitor,
  Copy,
  Check,
  QrCode,
  Users,
  Wifi,
  ExternalLink,
  Laptop,
  RefreshCw,
} from 'lucide-react';
import { RehearsalSession, DeviceRole, ConnectedDevice } from '../types/script';
import { QRCodeDisplay } from './QRCodeDisplay';

interface MultiDeviceSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: RehearsalSession | null;
  currentDeviceId: string;
  currentRole: DeviceRole;
  onSetRole: (role: DeviceRole) => void;
  onJoinRoom: (roomPin: string) => void;
}

export const MultiDeviceSyncModal: React.FC<MultiDeviceSyncModalProps> = ({
  isOpen,
  onClose,
  session,
  currentDeviceId,
  currentRole,
  onSetRole,
  onJoinRoom,
}) => {
  const [copied, setCopied] = useState(false);
  const [joinPinInput, setJoinPinInput] = useState('');

  if (!isOpen) return null;

  const roomPin = session?.id || 'ACT-888';
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const searchParams = new URLSearchParams();
  searchParams.set('room', roomPin);
  searchParams.set('role', 'mic_remote');
  const pairingUrl = `${origin}${pathname}?${searchParams.toString()}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(pairingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const devicesList: ConnectedDevice[] = session?.devices ? Object.values(session.devices) : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-serif font-bold text-amber-200">
                Multi-Device Real-Time Sync
              </h2>
              <p className="text-xs text-neutral-400">
                Pair Chromebook (Display Hub) with Smartphone (Pocket Remote)
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
          {/* Dual-device Architecture Guide */}
          <div className="p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800 text-xs text-neutral-300 flex flex-col sm:flex-row items-center gap-4">
            <div className="flex items-center gap-2 text-blue-400 shrink-0">
              <Laptop className="w-5 h-5" />
              <span className="font-semibold text-neutral-200">Audio Hub / Music Stand</span>
            </div>
            <span className="text-neutral-600 hidden sm:inline">⇄</span>
            <div className="flex items-center gap-2 text-emerald-400 shrink-0">
              <Smartphone className="w-5 h-5" />
              <span className="font-semibold text-neutral-200">Smartphone Remote in Hand</span>
            </div>
          </div>

          {/* QR Code & Room PIN Pairing Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-neutral-950 p-5 rounded-2xl border border-neutral-800">
            {/* Left: QR Code */}
            <div className="flex flex-col items-center justify-center text-center p-2">
              <QRCodeDisplay value={pairingUrl} size={150} />
              <span className="text-[11px] text-neutral-400 mt-2">
                Scan with phone camera to connect as remote
              </span>
            </div>

            {/* Right: Room PIN & Link */}
            <div className="flex flex-col justify-center space-y-4">
              <div>
                <span className="text-[11px] uppercase tracking-wider font-mono text-neutral-400 block mb-1">
                  Active Room PIN
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-mono font-bold tracking-widest text-amber-400 bg-neutral-900 px-4 py-2 rounded-xl border border-amber-900/40">
                    {roomPin}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[11px] text-neutral-400 block mb-1 font-mono">
                  Direct Remote URL
                </span>
                <button
                  onClick={handleCopyLink}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 rounded-xl text-xs text-neutral-200 transition"
                >
                  <span className="truncate max-w-[200px] text-neutral-400">{pairingUrl}</span>
                  <span className="flex items-center gap-1 font-semibold text-amber-300 shrink-0">
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </span>
                </button>
              </div>

              {/* Join another room input */}
              <div className="pt-2 border-t border-neutral-900">
                <span className="text-[11px] text-neutral-400 block mb-1 font-mono">
                  Join Another Device Room
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Enter PIN, e.g. ACT-429"
                    value={joinPinInput}
                    onChange={(e) => setJoinPinInput(e.target.value.toUpperCase())}
                    className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-neutral-100 font-mono uppercase focus:outline-none focus:border-amber-500"
                  />
                  <button
                    onClick={() => {
                      if (joinPinInput.trim()) {
                        onJoinRoom(joinPinInput.trim());
                        setJoinPinInput('');
                        onClose();
                      }
                    }}
                    disabled={!joinPinInput.trim()}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-neutral-950 font-bold rounded-xl text-xs transition"
                  >
                    Join
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Current Device Role Configuration */}
          <div className="space-y-3">
            <span className="text-xs font-mono uppercase text-neutral-400 tracking-wider">
              This Device's Function
            </span>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => onSetRole('hub')}
                className={`p-4 rounded-2xl border text-left transition flex flex-col gap-2 ${
                  currentRole === 'hub'
                    ? 'bg-blue-950/30 border-blue-500/60 shadow-lg ring-1 ring-blue-500/30'
                    : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Monitor className="w-5 h-5 text-blue-400" />
                  {currentRole === 'hub' && (
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                  )}
                </div>
                <div>
                  <h4 className="font-serif font-bold text-sm text-neutral-200">
                    Audio Hub & Display
                  </h4>
                  <p className="text-[11px] text-neutral-400 mt-1">
                    Plays counterpart TTS audio aloud and displays high-contrast script text.
                  </p>
                </div>
              </button>

              <button
                onClick={() => onSetRole('mic_remote')}
                className={`p-4 rounded-2xl border text-left transition flex flex-col gap-2 ${
                  currentRole === 'mic_remote'
                    ? 'bg-emerald-950/30 border-emerald-500/60 shadow-lg ring-1 ring-emerald-500/30'
                    : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Smartphone className="w-5 h-5 text-emerald-400" />
                  {currentRole === 'mic_remote' && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  )}
                </div>
                <div>
                  <h4 className="font-serif font-bold text-sm text-neutral-200">
                    Microphone Controller
                  </h4>
                  <p className="text-[11px] text-neutral-400 mt-1">
                    Listens to your speech without audio echo. Huge tactile buttons for prompts.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Connected Devices List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase text-neutral-400 tracking-wider">
                Live Connected Devices ({devicesList.filter((d) => d.isOnline).length})
              </span>
              <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
                <Wifi className="w-3.5 h-3.5" /> Real-time active
              </span>
            </div>

            <div className="space-y-2">
              {devicesList.map((dev) => {
                const isThisDevice = dev.deviceId === currentDeviceId;
                return (
                  <div
                    key={dev.deviceId}
                    className="p-3 rounded-xl bg-neutral-950 border border-neutral-800/80 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-2.5 h-2.5 rounded-full ${
                          dev.isOnline ? 'bg-emerald-400' : 'bg-neutral-600'
                        }`}
                      />
                      <div>
                        <div className="font-semibold text-neutral-200 flex items-center gap-2">
                          <span>{dev.deviceName}</span>
                          {isThisDevice && (
                            <span className="px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-400 text-[10px]">
                              You
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-neutral-500 font-mono">
                          ID: {dev.deviceId}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${
                        dev.role === 'hub'
                          ? 'bg-blue-950/40 text-blue-300 border-blue-500/30'
                          : 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30'
                      }`}
                    >
                      {dev.role === 'hub' ? 'Audio Hub' : 'Mic Remote'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
