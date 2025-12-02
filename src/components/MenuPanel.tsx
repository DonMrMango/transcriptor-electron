import './MenuPanel.css';

interface MenuPanelProps {
  onStartRecording: () => void;
  onViewHistory: () => void;
  onClose: () => void;
  onFileTranscribe: (text: string) => void;
}

export default function MenuPanel({ onStartRecording, onViewHistory, onClose, onFileTranscribe }: MenuPanelProps) {
  const handleTranscribeFile = async () => {
    try {
      // Abrir file dialog
      const fileResult = await window.electronAPI.openFileDialog();

      if (fileResult.canceled || !fileResult.success) {
        return;
      }

      // Obtener API key
      const apiKey = await window.electronAPI.getApiKey();
      if (!apiKey) {
        alert('No se encontró la API key');
        return;
      }

      // Transcribir archivo
      const result = await window.electronAPI.transcribeFile(fileResult.filePath, apiKey);

      if (result.success) {
        // Guardar en historial
        await window.electronAPI.saveTranscription({
          text: result.text,
          timestamp: Date.now(),
          duration: result.duration || null,
          language: result.language || 'es',
          model: result.model || 'whisper-large-v3-turbo'
        });

        // Mostrar resultado
        onFileTranscribe(result.text);
      } else {
        alert('Error en transcripción: ' + (result.error || 'Error desconocido'));
      }
    } catch (error: any) {
      console.error('Error transcribing file:', error);
      alert('Error: ' + error.message);
    }
  };

  const handleMinimize = () => {
    window.electronAPI?.minimizeWindow();
  };

  const handleClose = () => {
    window.electronAPI?.closeWindow();
  };

  return (
    <div className="menu-panel">
      <div className="menu-header">
        <h3>Transcriptor</h3>
        <div className="window-controls">
          <button className="minimize-btn" onClick={handleMinimize} title="Minimizar">−</button>
          <button className="close-btn" onClick={handleClose} title="Cerrar">×</button>
        </div>
      </div>

      <div className="menu-options">
        <button className="menu-btn record-btn" onClick={onStartRecording}>
          <span className="btn-icon">🎙️</span>
          <span className="btn-label">Grabar Audio</span>
          <span className="btn-description">Graba y transcribe en tiempo real</span>
        </button>

        <button className="menu-btn file-btn" onClick={handleTranscribeFile}>
          <span className="btn-icon">📁</span>
          <span className="btn-label">Transcribir Archivo</span>
          <span className="btn-description">Audio o video existente</span>
        </button>

        <button className="menu-btn history-btn" onClick={onViewHistory}>
          <span className="btn-icon">📜</span>
          <span className="btn-label">Historial</span>
          <span className="btn-description">Ver transcripciones anteriores</span>
        </button>
      </div>

      <div className="menu-footer">
        <span className="version">v0.1.0</span>
      </div>
    </div>
  );
}
