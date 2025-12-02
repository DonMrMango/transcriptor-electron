import { useState } from 'react';
import './App.css';
import MenuPanel from './components/MenuPanel';
import RecordingPanel from './components/RecordingPanel';
import ResultPanel from './components/ResultPanel';
import HistoryPanel from './components/HistoryPanel';

export type AppState = 'menu' | 'recording' | 'transcribing' | 'result' | 'history';

function App() {
  const [state, setState] = useState<AppState>('menu');
  const [transcriptionResult, setTranscriptionResult] = useState<string>('');

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

  return (
    <div className="app-container">
      {state === 'menu' && (
        <MenuPanel
          onStartRecording={handleStartRecording}
          onViewHistory={handleViewHistory}
          onClose={() => {}}
        />
      )}

      {(state === 'recording' || state === 'transcribing') && (
        <RecordingPanel
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
