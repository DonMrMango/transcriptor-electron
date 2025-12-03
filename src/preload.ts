import { contextBridge, ipcRenderer } from 'electron';

// Exponer API segura para el renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // Control de ventana
  closeWindow: () => ipcRenderer.send('window-close'),
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  resizeWindow: (width: number, height: number) => ipcRenderer.send('window-resize', { width, height }),
  setResizable: (resizable: boolean) => ipcRenderer.send('window-set-resizable', resizable),
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),

  // API Key
  getApiKey: () => ipcRenderer.invoke('get-api-key'),
  saveApiKey: (apiKey: string) => ipcRenderer.invoke('save-api-key', apiKey),

  // Transcripción
  transcribeAudio: async (audioBlob: Blob, apiKey: string) => {
    const arrayBuffer = await audioBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return ipcRenderer.invoke('transcribe-audio', buffer, apiKey);
  },

  // File dialog y transcripción de archivos
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  transcribeFile: (filePath: string, apiKey: string) => ipcRenderer.invoke('transcribe-file', filePath, apiKey),

  // Transcripción de YouTube
  transcribeYoutube: (youtubeUrl: string, apiKey: string) => ipcRenderer.invoke('transcribe-youtube', youtubeUrl, apiKey),

  // Historial
  saveTranscription: (data: any) => ipcRenderer.invoke('save-transcription', data),
  getHistory: () => ipcRenderer.invoke('get-history'),

  // Keyboard shortcut listener
  onToggleRecording: (callback: () => void) => {
    ipcRenderer.on('toggle-recording', callback);
  },
  removeToggleRecordingListener: (callback: () => void) => {
    ipcRenderer.removeListener('toggle-recording', callback);
  },

  // PDF Tools
  selectPdfFiles: () => ipcRenderer.invoke('select-pdf-files'),
  combinePdfs: (filePaths: string[]) => ipcRenderer.invoke('combine-pdfs', filePaths),
  selectSinglePdf: () => ipcRenderer.invoke('select-single-pdf'),
  getPdfPageCount: (filePath: string) => ipcRenderer.invoke('get-pdf-page-count', filePath),
  splitPdf: (filePath: string, pages: number[]) => ipcRenderer.invoke('split-pdf', filePath, pages),
  splitPdfIndividual: (filePath: string, pages: number[]) => ipcRenderer.invoke('split-pdf-individual', filePath, pages),

  // PDF Conversions
  imagesToPdf: () => ipcRenderer.invoke('images-to-pdf'),
  pdfToImages: (filePath: string) => ipcRenderer.invoke('pdf-to-images', filePath),
});
