import { invoke } from '@tauri-apps/api/core';

export interface ApiCredentials {
  api_key: string;
  api_secret: string;
}

export function useTauriBridge() {
  const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

  const saveCredentials = async (service: string, credentials: ApiCredentials) => {
    if (!isTauri) return;
    return await invoke<string>('save_secure_credentials', { service, credentials });
  };

  const getCredentials = async (service: string) => {
    if (!isTauri) return null;
    return await invoke<ApiCredentials>('get_secure_credentials', { service });
  };

  const triggerNotification = async (title: string, body: string) => {
    if (!isTauri) return;
    return await invoke('send_desktop_notification', { title, body });
  };

  const executeSignal = async (signalId: string, symbol: String, direction: String, decision: 'APPROVE' | 'REJECT') => {
    if (!isTauri) return;
    return await invoke<string>('execute_signal_command', {
      command: {
        signal_id: signalId,
        symbol,
        direction,
        decision,
      },
    });
  };

  return {
    isTauri,
    saveCredentials,
    getCredentials,
    triggerNotification,
    executeSignal,
  };
}
