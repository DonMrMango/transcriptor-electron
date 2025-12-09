import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { AppState } from '../App';
import './RecordingPanel.css';

interface RecordingPanelProps {
  state: AppState;
  onStop: () => void;
  onComplete: (text: string, transcriptionId?: number) => void;
  onBack: () => void;
}

export interface RecordingPanelRef {
  stopRecording: () => void;
}

const RecordingPanel = forwardRef<RecordingPanelRef, RecordingPanelProps>(
  ({ state, onStop, onComplete, onBack }, ref) => {
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const isCancelledRef = useRef(false);

  // Exponer el método stopRecording a través de la ref
  useImperativeHandle(ref, () => ({
    stopRecording: handleStop
  }));

  useEffect(() => {
    if (state === 'recording' && !isPaused) {
      startRecording();
    }

    return () => {
      console.log('[RECORDING] Component unmounting, cleaning up...');
      stopTimer();

      // Detener el MediaRecorder si está activo
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }

      // IMPORTANTE: Liberar el stream del micrófono siempre
      if (streamRef.current) {
        console.log('[MICROPHONE] Releasing microphone on unmount...');
        streamRef.current.getTracks().forEach(track => {
          track.stop();
          console.log('[MICROPHONE] Track stopped on unmount:', track.kind);
        });
        streamRef.current = null;
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream; // Guardar referencia al stream
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
        // Nota: El stream ya se liberó en handleStop() o handleCancel()
        // No es necesario liberarlo nuevamente aquí
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

  // Función para liberar el stream del micrófono
  const releaseStream = () => {
    if (streamRef.current) {
      console.log('[MICROPHONE] Releasing microphone stream...');
      console.log('[MICROPHONE] Active tracks before stop:', streamRef.current.getTracks().length);

      streamRef.current.getTracks().forEach(track => {
        console.log('[MICROPHONE] Track state before stop:', track.readyState);
        track.stop();
        console.log('[MICROPHONE] Track state after stop:', track.readyState);
        console.log('[MICROPHONE] Track stopped:', track.kind, track.label);

        // Verificar que realmente se detuvo
        if (track.readyState !== 'ended') {
          console.error('[MICROPHONE] WARNING: Track did not stop properly!');
        }
      });

      // Remover todos los tracks del stream
      streamRef.current.getTracks().forEach(track => {
        streamRef.current?.removeTrack(track);
      });

      streamRef.current = null;
      console.log('[MICROPHONE] Microphone released successfully');
    } else {
      console.log('[MICROPHONE] No stream to release');
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

  const handleStop = async () => {
    console.log('[RECORDING] Stopping recording...');
    stopTimer();

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    // IMPORTANTE: Liberar el stream INMEDIATAMENTE, no esperar al evento onstop
    // Esto asegura que el indicador de micrófono se apague de inmediato en macOS
    releaseStream();

    // Forzar liberación a nivel del sistema operativo (macOS workaround)
    try {
      await window.electronAPI.forceReleaseMicrophone();
    } catch (error) {
      console.error('[MICROPHONE] Error forcing release at OS level:', error);
    }

    onStop();
  };

  const handleCancel = () => {
    console.log('[RECORDING] Canceling recording...');
    // Marcar como cancelado para evitar transcripción
    isCancelledRef.current = true;

    // Detener la grabación sin transcribir
    stopTimer();

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    // IMPORTANTE: Liberar el stream INMEDIATAMENTE
    releaseStream();

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
        const saveResult = await window.electronAPI.saveTranscription({
          text: result.text,
          timestamp: Date.now(),
          duration: recordingTime,
          language: 'es',
          model: 'whisper-large-v3-turbo'
        });

        const transcriptionId = saveResult?.id;
        onComplete(result.text, transcriptionId);
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
});

RecordingPanel.displayName = 'RecordingPanel';

export default RecordingPanel;
