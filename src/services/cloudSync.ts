/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RehearsalSession, ConnectedDevice, DeviceRole, RehearsalState, RehearsalMode } from '../types/script';
import { db, auth, isFirebaseConfigured, handleFirestoreError, OperationType } from './firebase';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { securityManager } from './security';

type SyncCallback = (session: RehearsalSession) => void;

class CloudSyncService {
  private currentSession: RehearsalSession | null = null;
  private currentDeviceId: string = '';
  private currentDeviceName: string = '';
  private currentRole: DeviceRole = 'standalone';
  private subscribers: Set<SyncCallback> = new Set();
  private broadcastChannel: BroadcastChannel | null = null;
  private firestoreUnsubscribe: (() => void) | null = null;
  private heartbeatInterval: any = null;

  constructor() {
    this.currentDeviceId = this.getOrCreateDeviceId();
    this.currentDeviceName = this.detectDeviceName();
  }

  private getOrCreateDeviceId(): string {
    const key = 'sr_device_id';
    let id = sessionStorage.getItem(key);
    if (!id) {
      id = 'dev_' + Math.random().toString(36).substring(2, 9);
      sessionStorage.setItem(key, id);
    }
    return id;
  }

  private detectDeviceName(): string {
    if (typeof window === 'undefined') return 'Hub Display';
    const ua = navigator.userAgent;
    const isMobile = /Android|iPhone|iPad|iPod|webOS|Windows Phone/i.test(ua);
    const isChromeOS = /CrOS/.test(ua);
    if (isChromeOS) return 'Chromebook Display';
    if (isMobile) return 'Mobile Mic Remote';
    return 'Desktop Audio Hub';
  }

  public getDeviceId(): string {
    return this.currentDeviceId;
  }

  public getDeviceName(): string {
    return this.currentDeviceName;
  }

  public setDeviceRole(role: DeviceRole) {
    this.currentRole = role;
    if (this.currentSession) {
      const updatedDevices = { ...this.currentSession.devices };
      updatedDevices[this.currentDeviceId] = {
        deviceId: this.currentDeviceId,
        deviceName: this.currentDeviceName,
        role: this.currentRole,
        lastSeen: Date.now(),
        isOnline: true,
      };
      this.broadcastUpdate({ devices: updatedDevices });
    }
  }

  public getDeviceRole(): DeviceRole {
    return this.currentRole;
  }

  public initSession(
    sessionId: string,
    userId: string,
    initialScriptId: string,
    initialCharacter: string = '',
    role: DeviceRole = 'hub'
  ): RehearsalSession {
    this.currentRole = role;

    // Security check
    securityManager.assertResourceOwnership(userId, 'Initialize Sync Session');

    // Create session object
    const session: RehearsalSession = {
      id: sessionId,
      userId,
      currentScriptId: initialScriptId,
      activeSceneIndex: 0,
      currentLineId: 1,
      rehearsalState: 'PAUSED',
      activeCharacter: initialCharacter,
      mode: 'full',
      lastActionTimestamp: Date.now(),
      devices: {
        [this.currentDeviceId]: {
          deviceId: this.currentDeviceId,
          deviceName: this.currentDeviceName,
          role: this.currentRole,
          lastSeen: Date.now(),
          isOnline: true,
        },
      },
    };

    this.currentSession = session;
    this.setupChannels(sessionId, userId);
    return session;
  }

  private setupChannels(sessionId: string, userId: string) {
    // 1. Setup local BroadcastChannel for multi-tab / window real-time sync
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
    }

    try {
      this.broadcastChannel = new BroadcastChannel(`sr_sync_channel_${sessionId}`);
      this.broadcastChannel.onmessage = (event) => {
        if (event.data && event.data.type === 'SYNC_STATE') {
          this.handleIncomingState(event.data.payload);
        } else if (event.data && event.data.type === 'DEVICE_HEARTBEAT') {
          this.handleDeviceHeartbeat(event.data.payload);
        }
      };
    } catch (e) {
      console.warn('BroadcastChannel not supported in this environment:', e);
    }

    // 2. Setup Firestore onSnapshot listener if Firebase is connected
    if (this.firestoreUnsubscribe) {
      this.firestoreUnsubscribe();
      this.firestoreUnsubscribe = null;
    }

    if (isFirebaseConfigured && db && auth?.currentUser) {
      const docPath = `users/${userId}/sessions/${sessionId}`;
      try {
        const sessionRef = doc(db, 'users', userId, 'sessions', sessionId);
        this.firestoreUnsubscribe = onSnapshot(
          sessionRef,
          (snapshot) => {
            if (snapshot.exists()) {
              const remoteData = snapshot.data() as RehearsalSession;
              this.handleIncomingState(remoteData);
            }
          },
          (error) => {
            handleFirestoreError(error, OperationType.GET, docPath);
          }
        );
      } catch (err) {
        console.warn('Firestore session subscription warning:', err);
      }
    }

    // 3. Heartbeat timer
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, 4000);
  }

  private sendHeartbeat() {
    if (!this.currentSession) return;
    const heartbeatPayload: ConnectedDevice = {
      deviceId: this.currentDeviceId,
      deviceName: this.currentDeviceName,
      role: this.currentRole,
      lastSeen: Date.now(),
      isOnline: true,
    };

    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        type: 'DEVICE_HEARTBEAT',
        payload: heartbeatPayload,
      });
    }

    // Also prune stale devices older than 15 seconds
    const now = Date.now();
    let changed = false;
    const devices = { ...this.currentSession.devices };
    devices[this.currentDeviceId] = heartbeatPayload;

    for (const [id, dev] of Object.entries(devices)) {
      if (id !== this.currentDeviceId && now - dev.lastSeen > 12000) {
        if (dev.isOnline) {
          devices[id] = { ...dev, isOnline: false };
          changed = true;
        }
      }
    }

    if (changed) {
      this.currentSession.devices = devices;
      this.notifySubscribers(this.currentSession);
    }
  }

  private handleDeviceHeartbeat(device: ConnectedDevice) {
    if (!this.currentSession) return;
    const devices = { ...this.currentSession.devices };
    devices[device.deviceId] = { ...device, isOnline: true, lastSeen: Date.now() };
    this.currentSession.devices = devices;
    this.notifySubscribers(this.currentSession);
  }

  private handleIncomingState(incoming: RehearsalSession) {
    if (!this.currentSession) {
      this.currentSession = incoming;
      this.notifySubscribers(incoming);
      return;
    }

    // Compare timestamps to prevent outdated state overriding
    if (incoming.lastActionTimestamp >= (this.currentSession.lastActionTimestamp || 0)) {
      // Preserve our local device representation in the merged list
      const mergedDevices = {
        ...incoming.devices,
        [this.currentDeviceId]: {
          deviceId: this.currentDeviceId,
          deviceName: this.currentDeviceName,
          role: this.currentRole,
          lastSeen: Date.now(),
          isOnline: true,
        },
      };

      this.currentSession = {
        ...incoming,
        devices: mergedDevices,
      };
      this.notifySubscribers(this.currentSession);
    }
  }

  public broadcastUpdate(partial: Partial<RehearsalSession>) {
    if (!this.currentSession) return;

    const updated: RehearsalSession = {
      ...this.currentSession,
      ...partial,
      lastActionTimestamp: Date.now(),
    };

    // Ensure our device heartbeat is fresh
    updated.devices = {
      ...updated.devices,
      [this.currentDeviceId]: {
        deviceId: this.currentDeviceId,
        deviceName: this.currentDeviceName,
        role: this.currentRole,
        lastSeen: Date.now(),
        isOnline: true,
      },
    };

    this.currentSession = updated;

    // 1. BroadcastChannel message
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({
          type: 'SYNC_STATE',
          payload: updated,
        });
      } catch (e) {
        console.warn('BroadcastChannel error:', e);
      }
    }

    // 2. Sync to Firestore if available
    if (isFirebaseConfigured && db && auth?.currentUser && updated.userId === auth.currentUser.uid) {
      const docPath = `users/${updated.userId}/sessions/${updated.id}`;
      setDoc(doc(db, 'users', updated.userId, 'sessions', updated.id), updated).catch((err) => {
        handleFirestoreError(err, OperationType.WRITE, docPath);
      });
    }

    this.notifySubscribers(updated);
  }

  public subscribe(callback: SyncCallback): () => void {
    this.subscribers.add(callback);
    if (this.currentSession) {
      callback(this.currentSession);
    }
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private notifySubscribers(session: RehearsalSession) {
    for (const callback of this.subscribers) {
      try {
        callback(session);
      } catch (err) {
        console.error('Subscriber notification error:', err);
      }
    }
  }

  public cleanup() {
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
      this.broadcastChannel = null;
    }
    if (this.firestoreUnsubscribe) {
      this.firestoreUnsubscribe();
      this.firestoreUnsubscribe = null;
    }
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    this.subscribers.clear();
    this.currentSession = null;
  }
}

export const cloudSyncService = new CloudSyncService();
