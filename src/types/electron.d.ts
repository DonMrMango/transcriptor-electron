export interface ElectronAPI {
  closeWindow: () => void;
  minimizeWindow: () => void;
  getApiKey: () => Promise<string | null>;
  saveApiKey: (apiKey: string) => Promise<any>;
  transcribeAudio: (audioBlob: Blob, apiKey: string) => Promise<any>;
  openFileDialog: () => Promise<any>;
  transcribeFile: (filePath: string, apiKey: string) => Promise<any>;
  transcribeYoutube: (youtubeUrl: string, apiKey: string) => Promise<any>;
  saveTranscription: (data: any) => Promise<any>;
  getHistory: () => Promise<any[]>;
  onToggleRecording: (callback: () => void) => void;
  removeToggleRecordingListener: (callback: () => void) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
