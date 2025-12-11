import './PDFToolsPanel.css';
import { useState } from 'react';

type PDFMode = 'ranges' | 'pages';
type RangeMode = 'custom' | 'fixed';
type PageMode = 'extract-all' | 'select-pages';

interface PDFToolsPanelProps {
  onBack: () => void;
}

export default function PDFToolsPanel({ onBack }: PDFToolsPanelProps) {
  const [mode, setMode] = useState<PDFMode>('ranges');
  const [pdfPath, setPdfPath] = useState<string>('');
  const [pdfName, setPdfName] = useState<string>('');
  const [pageCount, setPageCount] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Por Rangos
  const [rangeMode, setRangeMode] = useState<RangeMode>('custom');
  const [customRangeInput, setCustomRangeInput] = useState('');
  const [fixedRangeSize, setFixedRangeSize] = useState('5');
  const [customRangeSeparate, setCustomRangeSeparate] = useState(false);

  // Por Páginas
  const [pageMode, setPageMode] = useState<PageMode>('extract-all');
  const [selectedPagesInput, setSelectedPagesInput] = useState('');
  const [separateFiles, setSeparateFiles] = useState(false);

  const handleSelectPdf = async () => {
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

      setPdfPath(selectResult.filePath);
      setPdfName(selectResult.filePath.split('/').pop() || '');
      setPageCount(countResult.pageCount);
    } catch (error: any) {
      console.error('Error selecting PDF:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const parseRanges = (rangeStr: string): number[] => {
    const ranges = rangeStr.split(',').map(r => r.trim());
    const pages: number[] = [];

    for (const range of ranges) {
      if (!range) continue;

      if (range.includes('-')) {
        const [start, end] = range.split('-').map(n => parseInt(n.trim()));
        if (isNaN(start) || isNaN(end) || start < 1 || end > pageCount || start > end) {
          throw new Error(`Rango invalido: ${range}`);
        }
        for (let i = start - 1; i < end; i++) {
          if (!pages.includes(i)) {
            pages.push(i);
          }
        }
      } else {
        const pageNum = parseInt(range);
        if (isNaN(pageNum) || pageNum < 1 || pageNum > pageCount) {
          throw new Error(`Pagina invalida: ${range}`);
        }
        if (!pages.includes(pageNum - 1)) {
          pages.push(pageNum - 1);
        }
      }
    }

    return pages.sort((a, b) => a - b);
  };

  const parseRangeGroups = (rangeStr: string): number[][] => {
    const ranges = rangeStr.split(',').map(r => r.trim());
    const rangeGroups: number[][] = [];

    for (const range of ranges) {
      if (!range) continue;

      if (range.includes('-')) {
        const [start, end] = range.split('-').map(n => parseInt(n.trim()));
        if (isNaN(start) || isNaN(end) || start < 1 || end > pageCount || start > end) {
          throw new Error(`Rango invalido: ${range}`);
        }
        const group: number[] = [];
        for (let i = start - 1; i < end; i++) {
          group.push(i);
        }
        rangeGroups.push(group);
      } else {
        const pageNum = parseInt(range);
        if (isNaN(pageNum) || pageNum < 1 || pageNum > pageCount) {
          throw new Error(`Pagina invalida: ${range}`);
        }
        rangeGroups.push([pageNum - 1]);
      }
    }

    return rangeGroups;
  };

  const handleCustomRangesSplit = async () => {
    if (!pdfPath || !customRangeInput.trim()) {
      alert('Por favor selecciona un PDF e ingresa rangos');
      return;
    }

    try {
      setIsProcessing(true);

      if (customRangeSeparate) {
        // Dividir por grupos de rangos (un PDF por cada rango)
        const rangeGroups = parseRangeGroups(customRangeInput);

        if (rangeGroups.length === 0) {
          alert('No se seleccionaron rangos validos');
          return;
        }

        const result = await window.electronAPI.splitPdfByRangeGroups(pdfPath, rangeGroups);

        if (result.success) {
          alert(`${result.count} archivos PDF creados exitosamente!\nGuardados en: ${result.directory}`);
          resetForm();
        } else if (!result.canceled) {
          alert(`Error al dividir PDF: ${result.error || 'Error desconocido'}`);
        }
      } else {
        // Combinar todas las páginas en un solo PDF
        const pages = parseRanges(customRangeInput);

        if (pages.length === 0) {
          alert('No se seleccionaron paginas validas');
          return;
        }

        const result = await window.electronAPI.splitPdfByRanges(pdfPath, pages);

        if (result.success) {
          alert(`PDF creado exitosamente!\nGuardado en: ${result.filePath}`);
          resetForm();
        } else if (!result.canceled) {
          alert(`Error al dividir PDF: ${result.error || 'Error desconocido'}`);
        }
      }
    } catch (error: any) {
      console.error('Error splitting PDF:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFixedRangesSplit = async () => {
    if (!pdfPath) {
      alert('Por favor selecciona un PDF');
      return;
    }

    const rangeSize = parseInt(fixedRangeSize);
    if (isNaN(rangeSize) || rangeSize < 1 || rangeSize > pageCount) {
      alert('Por favor ingresa un tamano de rango valido');
      return;
    }

    try {
      setIsProcessing(true);
      const result = await window.electronAPI.splitPdfFixedRanges(pdfPath, rangeSize);

      if (result.success) {
        alert(`${result.count} archivos PDF creados exitosamente!\nGuardados en: ${result.directory}`);
        resetForm();
      } else if (!result.canceled) {
        alert(`Error al dividir PDF: ${result.error || 'Error desconocido'}`);
      }
    } catch (error: any) {
      console.error('Error splitting PDF:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExtractAllPages = async () => {
    if (!pdfPath) {
      alert('Por favor selecciona un PDF');
      return;
    }

    try {
      setIsProcessing(true);
      const result = await window.electronAPI.splitPdfExtractAll(pdfPath);

      if (result.success) {
        alert(`${result.count} paginas extraidas exitosamente!\nGuardadas en: ${result.directory}`);
        resetForm();
      } else if (!result.canceled) {
        alert(`Error al extraer paginas: ${result.error || 'Error desconocido'}`);
      }
    } catch (error: any) {
      console.error('Error extracting pages:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelectPagesSplit = async () => {
    if (!pdfPath || !selectedPagesInput.trim()) {
      alert('Por favor selecciona un PDF e ingresa paginas');
      return;
    }

    try {
      setIsProcessing(true);
      const pages = parseRanges(selectedPagesInput);

      if (pages.length === 0) {
        alert('No se seleccionaron paginas validas');
        return;
      }

      const result = await window.electronAPI.splitPdfSelectPages(pdfPath, pages, separateFiles);

      if (result.success) {
        if (separateFiles) {
          alert(`${result.count} archivos PDF creados exitosamente!\nGuardados en: ${result.directory}`);
        } else {
          alert(`PDF creado exitosamente!\nGuardado en: ${result.filePath}`);
        }
        resetForm();
      } else if (!result.canceled) {
        alert(`Error al dividir PDF: ${result.error || 'Error desconocido'}`);
      }
    } catch (error: any) {
      console.error('Error splitting PDF:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setPdfPath('');
    setPdfName('');
    setPageCount(0);
    setCustomRangeInput('');
    setFixedRangeSize('5');
    setCustomRangeSeparate(false);
    setSelectedPagesInput('');
    setSeparateFiles(false);
  };

  const getFixedRangeCount = () => {
    if (!pageCount || !fixedRangeSize) return 0;
    const rangeSize = parseInt(fixedRangeSize);
    if (isNaN(rangeSize) || rangeSize < 1) return 0;
    return Math.ceil(pageCount / rangeSize);
  };

  return (
    <div className="pdf-tools-panel">
      <div className="pdf-tools-header">
        <button className="back-btn" onClick={onBack} disabled={isProcessing}>
          ← Volver
        </button>
        <h3>Dividir PDF</h3>
        <div className="window-controls">
          <button className="minimize-btn" onClick={() => window.electronAPI?.minimizeWindow()} title="Minimizar">−</button>
          <button className="maximize-btn" onClick={() => window.electronAPI?.maximizeWindow()} title="Maximizar">□</button>
          <button className="close-btn" onClick={() => window.electronAPI?.closeWindow()} title="Cerrar">×</button>
        </div>
      </div>

      <div className="pdf-tools-body">
        {/* PDF Info Section */}
        <div className="pdf-info-section">
          <button className="select-pdf-btn" onClick={handleSelectPdf} disabled={isProcessing}>
            {pdfPath ? '📄 Cambiar PDF' : '📁 Seleccionar PDF'}
          </button>
          {pdfPath && (
            <div className="pdf-info-display">
              <p className="pdf-info-name">{pdfName}</p>
              <p className="pdf-info-pages">{pageCount} paginas</p>
            </div>
          )}
        </div>

        {/* Mode Tabs */}
        <div className="mode-tabs">
          <button
            className={`mode-tab ${mode === 'ranges' ? 'active' : ''}`}
            onClick={() => setMode('ranges')}
            disabled={isProcessing}
          >
            Por Rangos
          </button>
          <button
            className={`mode-tab ${mode === 'pages' ? 'active' : ''}`}
            onClick={() => setMode('pages')}
            disabled={isProcessing}
          >
            Por Paginas
          </button>
        </div>

        {/* Content based on mode */}
        {mode === 'ranges' && (
          <div className="mode-content">
            {/* Range Mode Selector */}
            <div className="submodes">
              <label className="submode-option">
                <input
                  type="radio"
                  name="rangeMode"
                  value="custom"
                  checked={rangeMode === 'custom'}
                  onChange={() => setRangeMode('custom')}
                  disabled={isProcessing}
                />
                <div className="submode-info">
                  <span className="submode-title">Rangos Personalizados</span>
                  <span className="submode-desc">Un PDF con paginas especificas</span>
                </div>
              </label>
              <label className="submode-option">
                <input
                  type="radio"
                  name="rangeMode"
                  value="fixed"
                  checked={rangeMode === 'fixed'}
                  onChange={() => setRangeMode('fixed')}
                  disabled={isProcessing}
                />
                <div className="submode-info">
                  <span className="submode-title">Rangos Fijos</span>
                  <span className="submode-desc">Multiples PDFs en bloques iguales</span>
                </div>
              </label>
            </div>

            {rangeMode === 'custom' && (
              <div className="input-section">
                <label className="input-label">Rangos (ej: 1-5, 8-10, 15):</label>
                <input
                  type="text"
                  className="text-input"
                  placeholder="1-5, 8-10, 15"
                  value={customRangeInput}
                  onChange={(e) => setCustomRangeInput(e.target.value)}
                  disabled={isProcessing || !pdfPath}
                />
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={customRangeSeparate}
                    onChange={(e) => setCustomRangeSeparate(e.target.checked)}
                    disabled={isProcessing || !pdfPath}
                  />
                  <span>Extraer en PDFs separados</span>
                </label>
                <p className="input-hint">
                  {customRangeSeparate
                    ? 'Se creara un PDF individual por cada pagina/rango seleccionado'
                    : 'Se creara UN SOLO PDF con las paginas seleccionadas'}
                </p>
                <button
                  className="action-btn primary-btn"
                  onClick={handleCustomRangesSplit}
                  disabled={isProcessing || !pdfPath || !customRangeInput.trim()}
                >
                  {isProcessing ? 'Procesando...' : 'Crear PDF'}
                </button>
              </div>
            )}

            {rangeMode === 'fixed' && (
              <div className="input-section">
                <label className="input-label">Paginas por rango:</label>
                <input
                  type="number"
                  className="text-input"
                  placeholder="5"
                  min="1"
                  max={pageCount}
                  value={fixedRangeSize}
                  onChange={(e) => setFixedRangeSize(e.target.value)}
                  disabled={isProcessing || !pdfPath}
                />
                {pdfPath && fixedRangeSize && (
                  <p className="input-hint split-info">
                    Este PDF se dividira en {getFixedRangeCount()} archivos de {fixedRangeSize} paginas
                  </p>
                )}
                <button
                  className="action-btn primary-btn"
                  onClick={handleFixedRangesSplit}
                  disabled={isProcessing || !pdfPath || !fixedRangeSize}
                >
                  {isProcessing ? 'Procesando...' : `Dividir en ${getFixedRangeCount()} archivos`}
                </button>
              </div>
            )}
          </div>
        )}

        {mode === 'pages' && (
          <div className="mode-content">
            {/* Page Mode Selector */}
            <div className="submodes">
              <label className="submode-option">
                <input
                  type="radio"
                  name="pageMode"
                  value="extract-all"
                  checked={pageMode === 'extract-all'}
                  onChange={() => setPageMode('extract-all')}
                  disabled={isProcessing}
                />
                <div className="submode-info">
                  <span className="submode-title">Extraer Todas las Paginas</span>
                  <span className="submode-desc">Un PDF individual por cada pagina</span>
                </div>
              </label>
              <label className="submode-option">
                <input
                  type="radio"
                  name="pageMode"
                  value="select-pages"
                  checked={pageMode === 'select-pages'}
                  onChange={() => setPageMode('select-pages')}
                  disabled={isProcessing}
                />
                <div className="submode-info">
                  <span className="submode-title">Seleccionar Paginas</span>
                  <span className="submode-desc">Elige paginas especificas</span>
                </div>
              </label>
            </div>

            {pageMode === 'extract-all' && (
              <div className="input-section">
                {pdfPath && (
                  <p className="input-hint split-info">
                    Se extraeran {pageCount} paginas en archivos PDF individuales
                  </p>
                )}
                <button
                  className="action-btn primary-btn"
                  onClick={handleExtractAllPages}
                  disabled={isProcessing || !pdfPath}
                >
                  {isProcessing ? 'Procesando...' : `Extraer ${pageCount} paginas`}
                </button>
              </div>
            )}

            {pageMode === 'select-pages' && (
              <div className="input-section">
                <label className="input-label">Paginas (ej: 1, 3-5, 10):</label>
                <input
                  type="text"
                  className="text-input"
                  placeholder="1, 3-5, 10"
                  value={selectedPagesInput}
                  onChange={(e) => setSelectedPagesInput(e.target.value)}
                  disabled={isProcessing || !pdfPath}
                />

                <label className="checkbox-option">
                  <input
                    type="checkbox"
                    checked={separateFiles}
                    onChange={(e) => setSeparateFiles(e.target.checked)}
                    disabled={isProcessing || !pdfPath}
                  />
                  <span>Extraer en PDFs separados</span>
                </label>

                <p className="input-hint">
                  {separateFiles
                    ? 'Se creara un PDF individual por cada pagina seleccionada'
                    : 'Se creara un solo PDF con todas las paginas seleccionadas'}
                </p>

                <button
                  className="action-btn primary-btn"
                  onClick={handleSelectPagesSplit}
                  disabled={isProcessing || !pdfPath || !selectedPagesInput.trim()}
                >
                  {isProcessing ? 'Procesando...' : separateFiles ? 'Extraer Paginas' : 'Crear PDF'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
