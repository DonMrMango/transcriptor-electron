import { useState, useEffect, useRef } from 'react';
import './App.css';
import MenuPanel from './components/MenuPanel';
import RecordingPanel, { RecordingPanelRef } from './components/RecordingPanel';
import ResultPanel from './components/ResultPanel';
import HistoryPanel from './components/HistoryPanel';

export type AppState = 'menu' | 'recording' | 'transcribing' | 'result' | 'history';

function App() {
  const [state, setState] = useState<AppState>('menu');
  const [transcriptionResult, setTranscriptionResult] = useState<string>('');
  const recordingPanelRef = useRef<RecordingPanelRef>(null);

  const handleStartRecording = () => {
    setState('recording');
  };

  const handleStopRecording = () => {
    setState('transcribing');
  };

  const handleTranscribeComplete = (text: string) => {
    setTranscriptionResult(text);
    setState('result');
  };

  const handleBack = () => {
    setState('menu');
  };

  const handleViewHistory = () => {
    setState('history');
  };

  const handleToggleRecording = () => {
    console.log('[SHORTCUT] Toggle recording called, current state:', state);

    if (state === 'menu' || state === 'result' || state === 'history') {
      // Si no hay grabación en curso, iniciar una nueva
      console.log('[SHORTCUT] Starting new recording');
      setState('recording');
    } else if (state === 'recording') {
      // Si hay una grabación en curso, detenerla
      console.log('[SHORTCUT] Stopping recording');
      if (recordingPanelRef.current) {
        recordingPanelRef.current.stopRecording();
      }
    }
  };

  useEffect(() => {
    // Registrar el listener para el atajo de teclado
    const toggleHandler = () => {
      handleToggleRecording();
    };

    window.electronAPI.onToggleRecording(toggleHandler);

    // Cleanup: remover el listener cuando el componente se desmonte
    return () => {
      window.electronAPI.removeToggleRecordingListener(toggleHandler);
    };
  }, [state]);

  return (
    <div className="app-container">
      {state === 'menu' && (
        <MenuPanel
          onStartRecording={handleStartRecording}
          onViewHistory={handleViewHistory}
          onClose={() => {}}
          onFileTranscribe={handleTranscribeComplete}
        />
      )}

      {(state === 'recording' || state === 'transcribing') && (
        <RecordingPanel
          ref={recordingPanelRef}
          state={state}
          onStop={handleStopRecording}
          onComplete={handleTranscribeComplete}
          onBack={handleBack}
        />
      )}

      {state === 'result' && (
        <ResultPanel
          text={transcriptionResult}
          onBack={handleBack}
        />
      )}

      {state === 'history' && (
        <HistoryPanel
          onBack={handleBack}
        />
      )}
    </div>
  );
}

export default App;
