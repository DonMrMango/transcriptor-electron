import './MenuPanel.css';
import { useState } from 'react';

interface MenuPanelProps {
  onStartRecording: () => void;
  onViewHistory: () => void;
  onClose: () => void;
  onFileTranscribe: (text: string, transcriptionId?: number) => void;
  currentSection?: string;
  onSectionChange?: (section: string) => void;
}

export default function MenuPanel({ onStartRecording, onViewHistory, onClose, onFileTranscribe, currentSection = 'transcription', onSectionChange }: MenuPanelProps) {
  const [showYoutubeModal, setShowYoutubeModal] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
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
        const saveResult = await window.electronAPI.saveTranscription({
          text: result.text,
          timestamp: Date.now(),
          duration: result.duration || null,
          language: result.language || 'es',
          model: result.model || 'whisper-large-v3-turbo'
        });

        const transcriptionId = saveResult?.id;
        // Mostrar resultado
        onFileTranscribe(result.text, transcriptionId);
      } else {
        alert('Error en transcripción: ' + (result.error || 'Error desconocido'));
      }
    } catch (error: any) {
      console.error('Error transcribing file:', error);
      alert('Error: ' + error.message);
    }
  };

  const handleTranscribeYoutube = async () => {
    if (!youtubeUrl.trim()) {
      alert('Por favor ingresa una URL de YouTube');
      return;
    }

    try {
      setIsTranscribing(true);

      // Obtener API key
      const apiKey = await window.electronAPI.getApiKey();
      if (!apiKey) {
        alert('No se encontró la API key');
        return;
      }

      // Transcribir YouTube
      const result = await window.electronAPI.transcribeYoutube(youtubeUrl, apiKey);

      if (result.success) {
        // Guardar en historial
        const saveResult = await window.electronAPI.saveTranscription({
          text: result.text,
          timestamp: Date.now(),
          duration: result.duration || null,
          language: result.language || 'es',
          model: result.model || 'whisper-large-v3-turbo'
        });

        const transcriptionId = saveResult?.id;

        // Cerrar modal y limpiar input
        setShowYoutubeModal(false);
        setYoutubeUrl('');

        // Mostrar resultado
        onFileTranscribe(result.text, transcriptionId);
      } else {
        alert('Error en transcripción: ' + (result.error || 'Error desconocido'));
      }
    } catch (error: any) {
      console.error('Error transcribing YouTube:', error);
      alert('Error: ' + error.message);
    } finally {
      setIsTranscribing(false);
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

        <button className="menu-btn youtube-btn" onClick={() => setShowYoutubeModal(true)}>
          <span className="btn-icon">▶️</span>
          <span className="btn-label">YouTube</span>
          <span className="btn-description">Transcribir desde URL</span>
        </button>

        <button className="menu-btn history-btn" onClick={onViewHistory}>
          <span className="btn-icon">📜</span>
          <span className="btn-label">Historial</span>
          <span className="btn-description">Ver transcripciones anteriores</span>
        </button>
      </div>

      {showYoutubeModal && (
        <div className="modal-overlay" onClick={() => !isTranscribing && setShowYoutubeModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Transcribir YouTube</h3>
            <input
              type="text"
              className="youtube-input"
              placeholder="https://www.youtube.com/watch?v=..."
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              disabled={isTranscribing}
            />
            <div className="modal-actions">
              <button
                className="modal-btn cancel-btn"
                onClick={() => setShowYoutubeModal(false)}
                disabled={isTranscribing}
              >
                Cancelar
              </button>
              <button
                className="modal-btn transcribe-btn"
                onClick={handleTranscribeYoutube}
                disabled={isTranscribing}
              >
                {isTranscribing ? 'Transcribiendo...' : 'Transcribir'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="menu-footer">
        <div className="section-nav">
          <button
            className={`section-dot ${currentSection === 'transcription' ? 'active' : ''}`}
            onClick={() => onSectionChange?.('transcription')}
            title="Transcripción"
          >
            🎤
          </button>
          <button
            className={`section-dot ${currentSection === 'pdf' ? 'active' : ''}`}
            onClick={() => onSectionChange?.('pdf')}
            title="PDF"
          >
            📄
          </button>
        </div>
        <span className="version">v0.1.0</span>
      </div>
    </div>
  );
}
