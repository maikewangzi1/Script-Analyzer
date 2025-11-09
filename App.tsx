import React, { useState, useCallback, useEffect } from 'react';
import { SCRIPT_TEXT } from './constants';
import { analyzeScript } from './services/geminiService';
import Spinner from './components/Spinner';
import MarkdownRenderer from './components/MarkdownRenderer';

const ANALYSIS_OPTIONS = [
  'Full Analysis',
  'Character Arcs and Development',
  'Plot Analysis',
  'Dialogue Quality',
  'Thematic Elements',
];

const TONE_OPTIONS = [
  'Standard',
  'Formal',
  'Informal',
  'Critical',
  'Enthusiastic',
];

const LOCAL_STORAGE_KEY = 'scriptAnalysisData';

const App: React.FC = () => {
  const [analysis, setAnalysis] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Set<string>>(new Set(['Full Analysis']));
  const [scriptContent, setScriptContent] = useState<string>(SCRIPT_TEXT);
  const [selectedTone, setSelectedTone] = useState<string>('Standard');
  const [customAnalysisPoints, setCustomAnalysisPoints] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');

  useEffect(() => {
    try {
      const savedDataJSON = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedDataJSON) {
        const savedData = JSON.parse(savedDataJSON);
        setAnalysis(savedData.analysis || '');
        setSelectedOptions(new Set(savedData.selectedOptions || ['Full Analysis']));
        setSelectedTone(savedData.selectedTone || 'Standard');
        setCustomAnalysisPoints(savedData.customAnalysisPoints || '');
      }
    } catch (e) {
      console.error("Failed to parse saved analysis from localStorage", e);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }, []);

  const handleOptionChange = useCallback((option: string) => {
    setSelectedOptions(currentSelected => {
      const newSelection = new Set(currentSelected);

      if (option === 'Full Analysis') {
        if (newSelection.has('Full Analysis')) {
          newSelection.delete('Full Analysis');
        } else {
          return new Set(['Full Analysis']);
        }
      } else {
        newSelection.delete('Full Analysis');
        
        if (newSelection.has(option)) {
          newSelection.delete(option);
        } else {
          newSelection.add(option);
        }
      }
      return newSelection;
    });
  }, []);

  const handleScriptChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setScriptContent(event.target.value);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setScriptContent(text);
      };
      reader.onerror = () => {
        setError(`Failed to read the file: ${file.name}`);
        setFileName('');
      };
      reader.readAsText(file);
    }
    // Reset file input to allow uploading the same file again
    event.target.value = '';
  };
  
  const handleCustomAnalysisChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCustomAnalysisPoints(event.target.value);
  };

  const handleToneChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedTone(event.target.value);
  };

  const handleAnalyzeClick = useCallback(async () => {
    if (selectedOptions.size === 0 && !customAnalysisPoints.trim()) {
        setError("Please select at least one analysis option or provide custom points.");
        return;
    }
    if (!scriptContent.trim()) {
        setError("Script content cannot be empty.");
        return;
    }
    setIsLoading(true);
    setError(null);
    setAnalysis('');
    try {
      const result = await analyzeScript(scriptContent, Array.from(selectedOptions), selectedTone, customAnalysisPoints);
      setAnalysis(result);
      try {
        const dataToSave = {
          analysis: result,
          selectedOptions: Array.from(selectedOptions),
          selectedTone: selectedTone,
          customAnalysisPoints: customAnalysisPoints,
        };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToSave));
      } catch (e) {
        console.error("Failed to save analysis to localStorage", e);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [selectedOptions, scriptContent, selectedTone, customAnalysisPoints]);

  const handleExportText = useCallback(() => {
    if (!analysis) return;
    const blob = new Blob([analysis], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'script-analysis.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [analysis]);

  const handleExportPdf = useCallback(() => {
    if (!analysis) return;
    window.print();
  }, [analysis]);

  const handleClearAnalysis = useCallback(() => {
    setAnalysis('');
    setError(null);
    setCustomAnalysisPoints('');
    setFileName('');
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (e) {
      console.error("Failed to clear analysis from localStorage", e);
    }
  }, []);


  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8 no-print">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-sky-400 tracking-tight">
            Script Analyzer AI
          </h1>
          <p className="mt-4 text-lg text-slate-400 max-w-3xl mx-auto">
            Utilizing Gemini 2.5 Pro to provide in-depth, stylized analysis of your TV show or movie script.
          </p>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-12 lg:gap-8 mt-8">
          <aside className="lg:col-span-4 xl:col-span-3 no-print">
            <div className="sticky top-8 space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-sky-400 mb-3">Analysis Options</h2>
                <div className="space-y-2">
                  {ANALYSIS_OPTIONS.map((option) => (
                    <label key={option} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedOptions.has(option)}
                        onChange={() => handleOptionChange(option)}
                        className="form-checkbox h-5 w-5 bg-slate-700 border-slate-600 rounded text-sky-500 focus:ring-sky-500"
                        aria-label={option}
                      />
                      <span className="text-slate-300">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
               <div>
                <h2 className="text-lg font-semibold text-sky-400 mb-3">Analysis Tone</h2>
                <div className="space-y-2">
                  {TONE_OPTIONS.map((tone) => (
                    <label key={tone} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="tone"
                        value={tone}
                        checked={selectedTone === tone}
                        onChange={handleToneChange}
                        className="form-radio h-4 w-4 bg-slate-700 border-slate-600 text-sky-500 focus:ring-sky-500"
                      />
                      <span className="text-slate-300">{tone}</span>
                    </label>
                  ))}
                </div>
              </div>
               <div>
                <h2 className="text-lg font-semibold text-sky-400 mb-3">Custom Analysis Points</h2>
                <textarea
                  value={customAnalysisPoints}
                  onChange={handleCustomAnalysisChange}
                  placeholder="e.g., Analyze the use of foreshadowing in Act 1."
                  className="w-full h-24 bg-slate-800 border border-slate-600 rounded-md p-3 text-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition duration-150 ease-in-out resize-none"
                  aria-label="Custom Analysis Points"
                ></textarea>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-sky-400 mb-3">Script Content</h2>
                <div className="mb-3">
                  <label htmlFor="script-upload" className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded-md flex items-center justify-center transition duration-150 ease-in-out cursor-pointer">
                    Upload File (.txt, .fdx)
                  </label>
                  <input
                    id="script-upload"
                    type="file"
                    accept=".txt,.fdx,text/plain"
                    onChange={handleFileChange}
                    className="hidden"
                    aria-label="Upload script file"
                  />
                  {fileName && <p className="text-sm text-slate-400 mt-2 text-center truncate" title={fileName}>File: {fileName}</p>}
                </div>
                <textarea
                  value={scriptContent}
                  onChange={handleScriptChange}
                  placeholder="Paste your script here or upload a file..."
                  className="w-full h-48 bg-slate-800 border border-slate-600 rounded-md p-3 text-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition duration-150 ease-in-out resize-none"
                  aria-label="Script Content"
                ></textarea>
              </div>
              <button
                onClick={handleAnalyzeClick}
                disabled={isLoading}
                className="w-full bg-sky-500 hover:bg-sky-600 disabled:bg-sky-800 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-md flex items-center justify-center transition duration-150 ease-in-out"
              >
                {isLoading ? (
                  <>
                    <Spinner />
                    <span className="ml-2">Analyzing...</span>
                  </>
                ) : (
                  'Analyze Script'
                )}
              </button>
            </div>
          </aside>

          <section className="lg:col-span-8 xl:col-span-9 bg-slate-800/50 rounded-lg p-6 ring-1 ring-slate-700 printable-area">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-sky-400">Analysis Result</h2>
              {analysis && !isLoading && (
                <div className="flex space-x-2 no-print">
                  <button
                    onClick={handleExportText}
                    className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-3 rounded-md text-sm transition duration-150 ease-in-out"
                    aria-label="Export analysis as a text file"
                  >
                    Export as TXT
                  </button>
                  <button
                    onClick={handleExportPdf}
                    className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-3 rounded-md text-sm transition duration-150 ease-in-out"
                    aria-label="Export analysis as a PDF file"
                  >
                    Export as PDF
                  </button>
                  <button
                    onClick={handleClearAnalysis}
                    className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-3 rounded-md text-sm transition duration-150 ease-in-out"
                    aria-label="Clear analysis result and local storage"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
            <div className="min-h-[60vh] overflow-y-auto" role="log" aria-live="polite">
              {isLoading && (
                <div className="flex justify-center items-center h-full">
                    <div className="text-center">
                        <Spinner />
                        <p className="mt-4 text-slate-400">Gemini is analyzing the script. This may take a moment...</p>
                    </div>
                </div>
              )}
              {error && <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-md" role="alert">{error}</div>}
              {analysis && !isLoading && (
                <MarkdownRenderer content={analysis} />
              )}
              {!analysis && !isLoading && !error && (
                <div className="flex justify-center items-center h-full">
                    <p className="text-slate-500">Your script analysis will appear here.</p>
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default App;