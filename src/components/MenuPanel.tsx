import './MenuPanel.css';

interface MenuPanelProps {
  onStartRecording: () => void;
  onViewHistory: () => void;
  onClose: () => void;
}

export default function MenuPanel({ onStartRecording, onViewHistory, onClose }: MenuPanelProps) {
  const handleTranscribeFile = async () => {
    // TODO: Abrir file picker y transcribir archivo
    console.log('Transcribir archivo');
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
