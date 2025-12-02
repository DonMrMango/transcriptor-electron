import { useState, useEffect, useRef } from 'react';
import { AppState } from '../App';
import './RecordingPanel.css';

interface RecordingPanelProps {
  state: AppState;
  onStop: () => void;
  onComplete: (text: string) => void;
  onBack: () => void;
}

export default function RecordingPanel({ state, onStop, onComplete, onBack }: RecordingPanelProps) {
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const isCancelledRef = useRef(false);

  useEffect(() => {
    if (state === 'recording' && !isPaused) {
      startRecording();
    }

    return () => {
      stopTimer();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        // Solo transcribir si no fue cancelado
        if (!isCancelledRef.current) {
          const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
          handleTranscribe(audioBlob);
        }
        stream.getTracks().forEach(track => track.stop());
      };

      // Iniciar grabación
      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      startTimer();
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('No se pudo acceder al micrófono');
      onBack();
    }
  };

  const startTimer = () => {
    // Asegurarse de limpiar cualquier timer anterior
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    timerRef.current = window.setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handlePause = () => {
    if (mediaRecorderRef.current) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        startTimer();
      } else {
        mediaRecorderRef.current.pause();
        stopTimer();
      }
      setIsPaused(!isPaused);
    }
  };

  const handleStop = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      stopTimer();
    }
    onStop();
  };

  const handleCancel = () => {
    // Marcar como cancelado para evitar transcripción
    isCancelledRef.current = true;

    // Detener la grabación sin transcribir
    stopTimer();

    if (mediaRecorderRef.current) {
      // Detener el MediaRecorder
      if (mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }

      // Detener todos los tracks del stream
      const stream = mediaRecorderRef.current.stream;
      stream.getTracks().forEach(track => track.stop());
    }

    // Limpiar los chunks
    chunksRef.current = [];

    // Volver al menú sin transcribir
    onBack();
  };

  const handleTranscribe = async (audioBlob: Blob) => {
    try {
      // Obtener API key del sistema
      const apiKey = await window.electronAPI.getApiKey();

      if (!apiKey) {
        console.error('No API key found');
        onBack();
        return;
      }

      // Llamar a la API de transcripción
      const result = await window.electronAPI.transcribeAudio(audioBlob, apiKey);

      if (result.success) {
        console.log('Transcripción completada:', result.text);

        // Guardar en base de datos
        await window.electronAPI.saveTranscription({
          text: result.text,
          timestamp: Date.now(),
          duration: recordingTime,
          language: 'es',
          model: 'whisper-large-v3-turbo'
        });

        onComplete(result.text);
      } else {
        console.error('Error en transcripción:', result.error);
        onBack();
      }
    } catch (error: any) {
      console.error('Error transcribing:', error);
      onBack();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (state === 'transcribing') {
    return (
      <div className="recording-panel transcribing">
        <div className="transcribing-content">
          <div className="spinner"></div>
          <h3>Transcribiendo...</h3>
          <p>Esto puede tomar unos segundos</p>
        </div>
      </div>
    );
  }

  return (
    <div className="recording-panel">
      <div className="recording-header">
        <h3>Grabando</h3>
        <button className="back-btn" onClick={onBack}>←</button>
      </div>

      <div className="recording-content">
        <div className="timer">{formatTime(recordingTime)}</div>

        <div className="wave-animation">
          <div className="wave"></div>
          <div className="wave"></div>
          <div className="wave"></div>
        </div>

        <div className="recording-controls">
          <button
            className={`control-btn pause-btn ${isPaused ? 'resume' : ''}`}
            onClick={handlePause}
          >
            {isPaused ? '▶️' : '⏸️'}
          </button>

          <button className="control-btn cancel-btn" onClick={handleCancel}>
            ❌
          </button>

          <button className="control-btn stop-btn" onClick={handleStop}>
            ⏹️
          </button>
        </div>

        <p className="hint">
          {isPaused ? 'Grabación pausada' : 'Hablando...'}
        </p>
      </div>
    </div>
  );
}
