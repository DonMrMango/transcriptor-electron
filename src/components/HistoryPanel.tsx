import { useState, useEffect } from 'react';
import './HistoryPanel.css';

interface Transcription {
  id: number;
  text: string;
  timestamp: number;
  duration: number;
  language: string;
  model: string;
}

interface HistoryPanelProps {
  onBack: () => void;
}

export default function HistoryPanel({ onBack }: HistoryPanelProps) {
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);
  const [selectedItem, setSelectedItem] = useState<Transcription | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const history = await window.electronAPI.getHistory();
    setTranscriptions(history);
  };

  const handleItemClick = (item: Transcription) => {
    setSelectedItem(item);
    setCopied(false);
  };

  const handleCopy = () => {
    if (selectedItem) {
      navigator.clipboard.writeText(selectedItem.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setSelectedItem(null);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="history-panel">
      <div className="history-header">
        <h3>Historial</h3>
        <button className="back-btn" onClick={onBack}>←</button>
      </div>

      {transcriptions.length === 0 ? (
        <div className="empty-state">
          <p>No hay transcripciones guardadas</p>
          <p className="hint">Las transcripciones se guardan automáticamente</p>
        </div>
      ) : (
        <div className="history-content">
          <div className="history-list">
            {transcriptions.map((item) => (
              <div
                key={item.id}
                className={`history-item ${selectedItem?.id === item.id ? 'selected' : ''}`}
                onClick={() => handleItemClick(item)}
              >
                <div className="item-preview">
                  {item.text.substring(0, 60)}
                  {item.text.length > 60 && '...'}
                </div>
                <div className="item-meta">
                  <span className="item-date">{formatDate(item.timestamp)}</span>
                  {item.duration > 0 && (
                    <span className="item-duration">{formatDuration(item.duration)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedItem && (
        <div className="modal-overlay" onClick={handleClose}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>Transcripción</h4>
              <button className="close-btn" onClick={handleClose}>×</button>
            </div>

            <div className="modal-body">
              <div className="transcription-text">{selectedItem.text}</div>
            </div>

            <div className="modal-footer">
              <div className="modal-meta">
                <span>{formatDate(selectedItem.timestamp)}</span>
                {selectedItem.duration > 0 && (
                  <span>{formatDuration(selectedItem.duration)}</span>
                )}
              </div>
              <button className="copy-btn" onClick={handleCopy}>
                {copied ? '✓ Copiado' : '📋 Copiar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
