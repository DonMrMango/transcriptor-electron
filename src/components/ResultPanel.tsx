import { useState } from 'react';
import './ResultPanel.css';

interface ResultPanelProps {
  text: string;
  transcriptionId?: number;
  onBack: () => void;
}

export default function ResultPanel({ text, transcriptionId, onBack }: ResultPanelProps) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentText, setCurrentText] = useState(text);
  const [editedText, setEditedText] = useState(text);
  const [isSaving, setIsSaving] = useState(false);

  const handleCopy = () => {
    const textToCopy = isEditing ? editedText : currentText;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditedText(currentText);
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    if (!transcriptionId) {
      console.error('No transcription ID available');
      return;
    }

    setIsSaving(true);
    try {
      const result = await window.electronAPI.updateTranscription(transcriptionId, editedText);
      if (result.success) {
        // Actualizar el texto actual con el texto editado
        setCurrentText(editedText);
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

  return (
    <div className="result-panel">
      <div className="result-header">
        <h3>Transcripción</h3>
        <button className="back-btn" onClick={onBack}>←</button>
      </div>

      <div className="result-content">
        <div className="transcription-box">
          {isEditing ? (
            <textarea
              className="transcription-textarea"
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              autoFocus
            />
          ) : (
            <p className="transcription-text">{currentText}</p>
          )}
        </div>

        <div className="result-actions">
          {isEditing ? (
            <>
              <button
                className="cancel-btn"
                onClick={handleCancelEdit}
                disabled={isSaving}
              >
                ✕ Cancelar
              </button>
              <button
                className="save-btn"
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
              {transcriptionId && (
                <button className="edit-btn" onClick={handleEdit}>
                  ✏️ Editar
                </button>
              )}
              <button className="done-btn" onClick={onBack}>
                ✓ Listo
              </button>
            </>
          )}
        </div>

        {!isEditing && (
          <p className="hint">
            El texto se ha copiado automáticamente al portapapeles
          </p>
        )}
      </div>
    </div>
  );
}
