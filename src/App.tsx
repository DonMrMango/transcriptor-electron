import { useState, useEffect, useRef } from 'react';
import './App.css';
import './components/MenuPanel.css';
import MenuPanel from './components/MenuPanel';
import RecordingPanel, { RecordingPanelRef } from './components/RecordingPanel';
import ResultPanel from './components/ResultPanel';
import HistoryPanel from './components/HistoryPanel';

export type AppState = 'menu' | 'recording' | 'transcribing' | 'result' | 'history';

export type Section = 'transcription' | 'pdf';

function App() {
  const [state, setState] = useState<AppState>('menu');
  const [transcriptionResult, setTranscriptionResult] = useState<string>('');
  const [currentSection, setCurrentSection] = useState<Section>('transcription');
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

  const handleSectionChange = (section: Section) => {
    console.log('[SECTION] Changing to:', section);
    setCurrentSection(section);
    setState('menu'); // Volver al menú cuando cambiamos de sección

    // Ajustar tamaño de ventana según la sección
    if (section === 'pdf') {
      // Expandir ventana para PDF
      window.electronAPI.setResizable(true);
      window.electronAPI.resizeWindow(800, 600);
    } else {
      // Ventana compacta para transcripción
      window.electronAPI.setResizable(false);
      window.electronAPI.resizeWindow(320, 550);
    }
  };

  const [showPdfLobby, setShowPdfLobby] = useState(false);
  const [pdfFiles, setPdfFiles] = useState<string[]>([]);
  const [isCombining, setIsCombining] = useState(false);

  const [showSplitModal, setShowSplitModal] = useState(false);
  const [splitPdfPath, setSplitPdfPath] = useState<string>('');
  const [splitPdfPageCount, setSplitPdfPageCount] = useState<number>(0);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [isSplitting, setIsSplitting] = useState(false);
  const [splitMode, setSplitMode] = useState<'single' | 'individual'>('single');
  const [rangeInput, setRangeInput] = useState<string>('');

  const [showConvertToPdfModal, setShowConvertToPdfModal] = useState(false);
  const [showConvertFromPdfModal, setShowConvertFromPdfModal] = useState(false);
  const [isConverting, setIsConverting] = useState(false);

  const handleOpenPdfLobby = () => {
    setShowPdfLobby(true);
    setPdfFiles([]);
  };

  const handleAddPdfs = async () => {
    try {
      const selectResult = await window.electronAPI.selectPdfFiles();

      if (selectResult.canceled || !selectResult.success) {
        return;
      }

      // Agregar los archivos seleccionados a la lista (evitando duplicados)
      setPdfFiles(prev => {
        const newFiles = selectResult.filePaths.filter((file: string) => !prev.includes(file));
        return [...prev, ...newFiles];
      });
    } catch (error: any) {
      console.error('Error selecting PDFs:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleRemovePdf = (index: number) => {
    setPdfFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleMovePdfUp = (index: number) => {
    if (index === 0) return;
    setPdfFiles(prev => {
      const newFiles = [...prev];
      [newFiles[index - 1], newFiles[index]] = [newFiles[index], newFiles[index - 1]];
      return newFiles;
    });
  };

  const handleMovePdfDown = (index: number) => {
    if (index === pdfFiles.length - 1) return;
    setPdfFiles(prev => {
      const newFiles = [...prev];
      [newFiles[index], newFiles[index + 1]] = [newFiles[index + 1], newFiles[index]];
      return newFiles;
    });
  };

  const handleCombinePdfs = async () => {
    if (pdfFiles.length < 2) {
      alert('Por favor selecciona al menos 2 archivos PDF');
      return;
    }

    try {
      setIsCombining(true);

      // Combine PDFs
      const combineResult = await window.electronAPI.combinePdfs(pdfFiles);

      if (combineResult.success) {
        alert(`PDF combinado exitosamente!\nGuardado en: ${combineResult.filePath}`);
        setShowPdfLobby(false);
        setPdfFiles([]);
      } else if (!combineResult.canceled) {
        alert(`Error al combinar PDFs: ${combineResult.error || 'Error desconocido'}`);
      }
    } catch (error: any) {
      console.error('Error combining PDFs:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsCombining(false);
    }
  };

  const handleOpenSplitModal = async () => {
    try {
      const selectResult = await window.electronAPI.selectSinglePdf();

      if (selectResult.canceled || !selectResult.success) {
        return;
      }

      const countResult = await window.electronAPI.getPdfPageCount(selectResult.filePath);

      if (!countResult.success) {
        alert(`Error al leer el PDF: ${countResult.error || 'Error desconocido'}`);
        return;
      }

      setSplitPdfPath(selectResult.filePath);
      setSplitPdfPageCount(countResult.pageCount);
      setSelectedPages([]);
      setSplitMode('single');
      setRangeInput('');
      setShowSplitModal(true);
    } catch (error: any) {
      console.error('Error opening split modal:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleApplyRange = () => {
    const ranges = rangeInput.split(',').map(r => r.trim());
    const pages: number[] = [];

    for (const range of ranges) {
      if (range.includes('-')) {
        const [start, end] = range.split('-').map(n => parseInt(n.trim()));
        if (isNaN(start) || isNaN(end) || start < 1 || end > splitPdfPageCount || start > end) {
          alert(`Rango inválido: ${range}`);
          return;
        }
        for (let i = start - 1; i < end; i++) {
          if (!pages.includes(i)) {
            pages.push(i);
          }
        }
      } else {
        const pageNum = parseInt(range);
        if (isNaN(pageNum) || pageNum < 1 || pageNum > splitPdfPageCount) {
          alert(`Página inválida: ${range}`);
          return;
        }
        if (!pages.includes(pageNum - 1)) {
          pages.push(pageNum - 1);
        }
      }
    }

    setSelectedPages(pages.sort((a, b) => a - b));
  };

  const handleTogglePage = (pageIndex: number) => {
    setSelectedPages(prev => {
      if (prev.includes(pageIndex)) {
        return prev.filter(p => p !== pageIndex);
      } else {
        return [...prev, pageIndex].sort((a, b) => a - b);
      }
    });
  };

  const handleSelectAllPages = () => {
    const allPages = Array.from({ length: splitPdfPageCount }, (_, i) => i);
    setSelectedPages(allPages);
  };

  const handleDeselectAllPages = () => {
    setSelectedPages([]);
  };

  const handleSplitPdf = async () => {
    if (selectedPages.length === 0) {
      alert('Por favor selecciona al menos una página');
      return;
    }

    try {
      setIsSplitting(true);

      let splitResult;
      if (splitMode === 'individual') {
        splitResult = await window.electronAPI.splitPdfIndividual(splitPdfPath, selectedPages);
        if (splitResult.success) {
          alert(`${splitResult.count} páginas extraídas exitosamente!\nGuardadas en: ${splitResult.directory}`);
          setShowSplitModal(false);
          setSplitPdfPath('');
          setSplitPdfPageCount(0);
          setSelectedPages([]);
          setSplitMode('single');
          setRangeInput('');
        } else if (!splitResult.canceled) {
          alert(`Error al extraer páginas: ${splitResult.error || 'Error desconocido'}`);
        }
      } else {
        splitResult = await window.electronAPI.splitPdf(splitPdfPath, selectedPages);
        if (splitResult.success) {
          alert(`PDF dividido exitosamente!\nGuardado en: ${splitResult.filePath}`);
          setShowSplitModal(false);
          setSplitPdfPath('');
          setSplitPdfPageCount(0);
          setSelectedPages([]);
          setSplitMode('single');
          setRangeInput('');
        } else if (!splitResult.canceled) {
          alert(`Error al dividir PDF: ${splitResult.error || 'Error desconocido'}`);
        }
      }
    } catch (error: any) {
      console.error('Error splitting PDF:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsSplitting(false);
    }
  };

  const handleImagesToPdf = async () => {
    try {
      setIsConverting(true);
      const result = await window.electronAPI.imagesToPdf();

      if (result.success) {
        alert(`Imágenes convertidas a PDF exitosamente!\nGuardado en: ${result.filePath}`);
        setShowConvertToPdfModal(false);
      } else if (!result.canceled) {
        alert(`Error al convertir imágenes: ${result.error || 'Error desconocido'}`);
      }
    } catch (error: any) {
      console.error('Error converting images to PDF:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsConverting(false);
    }
  };

  const handlePdfToImages = async () => {
    try {
      setIsConverting(true);

      // First select the PDF
      const selectResult = await window.electronAPI.selectSinglePdf();

      if (selectResult.canceled || !selectResult.success) {
        setIsConverting(false);
        return;
      }

      const result = await window.electronAPI.pdfToImages(selectResult.filePath);

      if (result.success) {
        alert(`PDF convertido a imágenes exitosamente!\n${result.count} imágenes guardadas en: ${result.directory}`);
        setShowConvertFromPdfModal(false);
      } else if (!result.canceled) {
        alert(`Error al convertir PDF: ${result.error || 'Error desconocido'}`);
      }
    } catch (error: any) {
      console.error('Error converting PDF to images:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsConverting(false);
    }
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
      {state === 'menu' && currentSection === 'transcription' && (
        <MenuPanel
          onStartRecording={handleStartRecording}
          onViewHistory={handleViewHistory}
          onClose={() => {}}
          onFileTranscribe={handleTranscribeComplete}
          currentSection={currentSection}
          onSectionChange={handleSectionChange}
        />
      )}

      {state === 'menu' && currentSection === 'pdf' && (
        <div className="menu-panel">
          <div className="menu-header">
            <h3>PDF Tools</h3>
            <div className="window-controls">
              <button className="minimize-btn" onClick={() => window.electronAPI?.minimizeWindow()} title="Minimizar">−</button>
              <button className="maximize-btn" onClick={() => window.electronAPI?.maximizeWindow()} title="Maximizar">□</button>
              <button className="close-btn" onClick={() => window.electronAPI?.closeWindow()} title="Cerrar">×</button>
            </div>
          </div>
          <div className="menu-options">
            <button className="menu-btn record-btn" onClick={handleOpenPdfLobby}>
              <span className="btn-icon">📄➕</span>
              <span className="btn-label">Combinar PDFs</span>
              <span className="btn-description">Unir múltiples PDFs en uno</span>
            </button>

            <button className="menu-btn file-btn" onClick={handleOpenSplitModal}>
              <span className="btn-icon">✂️</span>
              <span className="btn-label">Dividir PDF</span>
              <span className="btn-description">Separar páginas específicas</span>
            </button>

            <button className="menu-btn youtube-btn" onClick={() => setShowConvertToPdfModal(true)}>
              <span className="btn-icon">🔄</span>
              <span className="btn-label">Convertir a PDF</span>
              <span className="btn-description">Word, Excel, Imágenes → PDF</span>
            </button>

            <button className="menu-btn history-btn" onClick={() => setShowConvertFromPdfModal(true)}>
              <span className="btn-icon">📤</span>
              <span className="btn-label">Convertir desde PDF</span>
              <span className="btn-description">PDF → Word, Excel, Imágenes</span>
            </button>
          </div>
          <div className="menu-footer">
            <div className="section-nav">
              <button
                className="section-dot"
                onClick={() => handleSectionChange('transcription')}
                title="Transcripción"
              >
                🎤
              </button>
              <button
                className="section-dot active"
                onClick={() => handleSectionChange('pdf')}
                title="PDF"
              >
                📄
              </button>
            </div>
            <span className="version">v0.1.0</span>
          </div>
        </div>
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

      {showPdfLobby && (
        <div className="modal-overlay" onClick={() => !isCombining && setShowPdfLobby(false)}>
          <div className="pdf-lobby-modal" onClick={(e) => e.stopPropagation()}>
            <div className="lobby-header">
              <h3>Combinar PDFs</h3>
              <button
                className="close-modal-btn"
                onClick={() => setShowPdfLobby(false)}
                disabled={isCombining}
              >
                ×
              </button>
            </div>

            <div className="lobby-content">
              <div className="pdf-list">
                {pdfFiles.length === 0 ? (
                  <div className="empty-state">
                    <p>No hay archivos seleccionados</p>
                    <p className="hint-text">Agrega PDFs para combinarlos</p>
                  </div>
                ) : (
                  pdfFiles.map((file, index) => (
                    <div key={index} className="pdf-item">
                      <div className="pdf-item-info">
                        <span className="pdf-number">{index + 1}</span>
                        <span className="pdf-name">{file.split('/').pop()}</span>
                      </div>
                      <div className="pdf-item-controls">
                        <button
                          className="control-btn"
                          onClick={() => handleMovePdfUp(index)}
                          disabled={index === 0 || isCombining}
                          title="Mover arriba"
                        >
                          ↑
                        </button>
                        <button
                          className="control-btn"
                          onClick={() => handleMovePdfDown(index)}
                          disabled={index === pdfFiles.length - 1 || isCombining}
                          title="Mover abajo"
                        >
                          ↓
                        </button>
                        <button
                          className="control-btn delete-btn"
                          onClick={() => handleRemovePdf(index)}
                          disabled={isCombining}
                          title="Eliminar"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="lobby-actions">
                <button
                  className="lobby-btn add-btn"
                  onClick={handleAddPdfs}
                  disabled={isCombining}
                >
                  ➕ Agregar PDFs
                </button>
                <button
                  className="lobby-btn combine-btn"
                  onClick={handleCombinePdfs}
                  disabled={pdfFiles.length < 2 || isCombining}
                >
                  {isCombining ? 'Combinando...' : `Combinar ${pdfFiles.length} PDFs`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSplitModal && (
        <div className="modal-overlay" onClick={() => !isSplitting && setShowSplitModal(false)}>
          <div className="pdf-lobby-modal" onClick={(e) => e.stopPropagation()}>
            <div className="lobby-header">
              <h3>Dividir PDF</h3>
              <button
                className="close-modal-btn"
                onClick={() => setShowSplitModal(false)}
                disabled={isSplitting}
              >
                ×
              </button>
            </div>

            <div className="lobby-content">
              <div className="split-info">
                <p className="pdf-info-text">
                  <strong>{splitPdfPath.split('/').pop()}</strong>
                </p>
                <p className="page-count-text">
                  Total de páginas: {splitPdfPageCount} | Seleccionadas: {selectedPages.length}
                </p>
              </div>

              <div className="split-mode-selector">
                <label className="mode-option">
                  <input
                    type="radio"
                    name="splitMode"
                    value="single"
                    checked={splitMode === 'single'}
                    onChange={(e) => setSplitMode('single')}
                    disabled={isSplitting}
                  />
                  <span>Un solo PDF</span>
                  <span className="mode-description">Páginas seleccionadas en un archivo</span>
                </label>
                <label className="mode-option">
                  <input
                    type="radio"
                    name="splitMode"
                    value="individual"
                    checked={splitMode === 'individual'}
                    onChange={(e) => setSplitMode('individual')}
                    disabled={isSplitting}
                  />
                  <span>PDFs individuales</span>
                  <span className="mode-description">Cada página en su propio archivo</span>
                </label>
              </div>

              <div className="range-input-section">
                <div className="range-input-container">
                  <input
                    type="text"
                    className="range-input"
                    placeholder="Ej: 1-5, 10, 15-20"
                    value={rangeInput}
                    onChange={(e) => setRangeInput(e.target.value)}
                    disabled={isSplitting}
                  />
                  <button
                    className="range-apply-btn"
                    onClick={handleApplyRange}
                    disabled={isSplitting || !rangeInput.trim()}
                  >
                    Aplicar
                  </button>
                </div>
                <p className="range-hint">Ingresa rangos como "1-5" o páginas individuales como "10"</p>
              </div>

              <div className="page-selection-controls">
                <button
                  className="selection-control-btn"
                  onClick={handleSelectAllPages}
                  disabled={isSplitting}
                >
                  Seleccionar todas
                </button>
                <button
                  className="selection-control-btn"
                  onClick={handleDeselectAllPages}
                  disabled={isSplitting}
                >
                  Deseleccionar todas
                </button>
              </div>

              <div className="pages-grid">
                {Array.from({ length: splitPdfPageCount }, (_, i) => (
                  <button
                    key={i}
                    className={`page-btn ${selectedPages.includes(i) ? 'selected' : ''}`}
                    onClick={() => handleTogglePage(i)}
                    disabled={isSplitting}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <div className="lobby-actions">
                <button
                  className="lobby-btn combine-btn"
                  onClick={handleSplitPdf}
                  disabled={selectedPages.length === 0 || isSplitting}
                >
                  {isSplitting ? 'Dividiendo...' : `Extraer ${selectedPages.length} página${selectedPages.length !== 1 ? 's' : ''}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showConvertToPdfModal && (
        <div className="modal-overlay" onClick={() => !isConverting && setShowConvertToPdfModal(false)}>
          <div className="pdf-lobby-modal" onClick={(e) => e.stopPropagation()}>
            <div className="lobby-header">
              <h3>Convertir a PDF</h3>
              <button
                className="close-modal-btn"
                onClick={() => setShowConvertToPdfModal(false)}
                disabled={isConverting}
              >
                ×
              </button>
            </div>

            <div className="lobby-content">
              <div className="conversion-options">
                <button
                  className="conversion-option-btn"
                  onClick={handleImagesToPdf}
                  disabled={isConverting}
                >
                  <span className="conversion-icon">🖼️</span>
                  <span className="conversion-label">Imágenes a PDF</span>
                  <span className="conversion-desc">JPG, PNG, GIF, BMP → PDF</span>
                </button>

                <button
                  className="conversion-option-btn"
                  disabled={true}
                >
                  <span className="conversion-icon">📝</span>
                  <span className="conversion-label">Word a PDF</span>
                  <span className="conversion-desc">Próximamente</span>
                </button>

                <button
                  className="conversion-option-btn"
                  disabled={true}
                >
                  <span className="conversion-icon">📊</span>
                  <span className="conversion-label">Excel a PDF</span>
                  <span className="conversion-desc">Próximamente</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showConvertFromPdfModal && (
        <div className="modal-overlay" onClick={() => !isConverting && setShowConvertFromPdfModal(false)}>
          <div className="pdf-lobby-modal" onClick={(e) => e.stopPropagation()}>
            <div className="lobby-header">
              <h3>Convertir desde PDF</h3>
              <button
                className="close-modal-btn"
                onClick={() => setShowConvertFromPdfModal(false)}
                disabled={isConverting}
              >
                ×
              </button>
            </div>

            <div className="lobby-content">
              <div className="conversion-options">
                <button
                  className="conversion-option-btn"
                  onClick={handlePdfToImages}
                  disabled={isConverting}
                >
                  <span className="conversion-icon">🖼️</span>
                  <span className="conversion-label">PDF a Imágenes</span>
                  <span className="conversion-desc">PDF → JPG/PNG</span>
                </button>

                <button
                  className="conversion-option-btn"
                  disabled={true}
                >
                  <span className="conversion-icon">📝</span>
                  <span className="conversion-label">PDF a Word</span>
                  <span className="conversion-desc">Próximamente</span>
                </button>

                <button
                  className="conversion-option-btn"
                  disabled={true}
                >
                  <span className="conversion-icon">📊</span>
                  <span className="conversion-label">PDF a Excel</span>
                  <span className="conversion-desc">Próximamente</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
