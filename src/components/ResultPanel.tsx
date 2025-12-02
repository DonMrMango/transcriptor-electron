import { useState } from 'react';
import './ResultPanel.css';

interface ResultPanelProps {
  text: string;
  onBack: () => void;
}

export default function ResultPanel({ text, onBack }: ResultPanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="result-panel">
      <div className="result-header">
        <h3>Transcripción</h3>
        <button className="back-btn" onClick={onBack}>←</button>
      </div>

      <div className="result-content">
        <div className="transcription-box">
          <p className="transcription-text">{text}</p>
        </div>

        <div className="result-actions">
          <button className="copy-btn" onClick={handleCopy}>
            {copied ? '✓ Copiado' : '📋 Copiar'}
          </button>
          <button className="done-btn" onClick={onBack}>
            ✓ Listo
          </button>
        </div>

        <p className="hint">
          El texto se ha copiado automáticamente al portapapeles
        </p>
      </div>
    </div>
  );
}
