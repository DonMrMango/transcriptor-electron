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
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const history = await window.electronAPI.getHistory();
    setTranscriptions(history);
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setIsSearching(true);

    try {
      const results = await window.electronAPI.searchTranscriptions(query);
      setTranscriptions(results);
    } catch (error) {
      console.error('Error searching transcriptions:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    loadHistory();
  };

  const handleItemClick = (item: Transcription) => {
    setSelectedItem(item);
    setEditedText(item.text);
    setCopied(false);
    setIsEditing(false);
  };

  const handleCopy = () => {
    if (selectedItem) {
      const textToCopy = isEditing ? editedText : selectedItem.text;
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (selectedItem) {
      setEditedText(selectedItem.text);
    }
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    if (!selectedItem) return;

    setIsSaving(true);
    try {
      const result = await window.electronAPI.updateTranscription(selectedItem.id, editedText);
      if (result.success) {
        // Update local state
        setSelectedItem({ ...selectedItem, text: editedText });
        setTranscriptions(transcriptions.map(t =>
          t.id === selectedItem.id ? { ...t, text: editedText } : t
        ));
        setIsEditing(false);
      } else {
        console.error('Error updating transcription:', result.error);
        alert('Error al guardar la edición: ' + result.error);
      }
    } catch (error) {
      console.error('Error updating transcription:', error);
      alert('Error al guardar la edición');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setSelectedItem(null);
    setIsEditing(false);
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

      <div className="search-container">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Buscar en transcripciones..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-search-btn" onClick={handleClearSearch}>
              ×
            </button>
          )}
        </div>
        {searchQuery && (
          <div className="search-results-info">
            {isSearching ? (
              <span>Buscando...</span>
            ) : (
              <span>{transcriptions.length} resultado{transcriptions.length !== 1 ? 's' : ''}</span>
            )}
          </div>
        )}
      </div>

      {transcriptions.length === 0 ? (
        <div className="empty-state">
          {searchQuery ? (
            <>
              <p>No se encontraron resultados para "{searchQuery}"</p>
              <p className="hint">Intenta con otros términos de búsqueda</p>
            </>
          ) : (
            <>
              <p>No hay transcripciones guardadas</p>
              <p className="hint">Las transcripciones se guardan automáticamente</p>
            </>
          )}
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
              {isEditing ? (
                <textarea
                  className="transcription-textarea"
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  autoFocus
                />
              ) : (
                <div className="transcription-text">{selectedItem.text}</div>
              )}
            </div>

            <div className="modal-footer">
              <div className="modal-meta">
                <span>{formatDate(selectedItem.timestamp)}</span>
                {selectedItem.duration > 0 && (
                  <span>{formatDuration(selectedItem.duration)}</span>
                )}
              </div>
              <div className="modal-actions">
                {isEditing ? (
                  <>
                    <button
                      className="modal-cancel-btn"
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                    >
                      ✕ Cancelar
                    </button>
                    <button
                      className="modal-save-btn"
                      onClick={handleSaveEdit}
                      disabled={isSaving}
                    >
                      {isSaving ? '⏳ Guardando...' : '💾 Guardar'}
                    </button>
                  </>
                ) : (
                  <>
                    <button className="copy-btn" onClick={handleCopy}>
                      {copied ? '✓ Copiado' : '📋 Copiar'}
                    </button>
                    <button className="modal-edit-btn" onClick={handleEdit}>
                      ✏️ Editar
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
