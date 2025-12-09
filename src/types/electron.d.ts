export interface ElectronAPI {
  closeWindow: () => void;
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  resizeWindow: (width: number, height: number) => void;
  setResizable: (resizable: boolean) => void;
  isMaximized: () => Promise<boolean>;
  getApiKey: () => Promise<string | null>;
  saveApiKey: (apiKey: string) => Promise<any>;
  transcribeAudio: (audioBlob: Blob, apiKey: string) => Promise<any>;
  openFileDialog: () => Promise<any>;
  transcribeFile: (filePath: string, apiKey: string) => Promise<any>;
  transcribeYoutube: (youtubeUrl: string, apiKey: string) => Promise<any>;
  saveTranscription: (data: any) => Promise<any>;
  getHistory: () => Promise<any[]>;
  searchTranscriptions: (query: string) => Promise<any[]>;
  updateTranscription: (id: number, text: string) => Promise<{ success: boolean; error?: string }>;
  forceReleaseMicrophone: () => Promise<{ success: boolean; error?: string }>;
  onToggleRecording: (callback: () => void) => void;
  removeToggleRecordingListener: (callback: () => void) => void;
  selectPdfFiles: () => Promise<any>;
  combinePdfs: (filePaths: string[]) => Promise<any>;
  selectSinglePdf: () => Promise<any>;
  getPdfPageCount: (filePath: string) => Promise<any>;
  splitPdf: (filePath: string, pages: number[]) => Promise<any>;
  splitPdfIndividual: (filePath: string, pages: number[]) => Promise<any>;
  imagesToPdf: () => Promise<any>;
  pdfToImages: (filePath: string) => Promise<any>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
