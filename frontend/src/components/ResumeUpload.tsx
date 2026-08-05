import { useRef, useState } from 'react';
import { AlertCircle, Sparkles } from 'lucide-react';
import * as mammoth from 'mammoth';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf.mjs';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

globalThis.window && (GlobalWorkerOptions.workerSrc = pdfWorkerUrl);

type ResumeUploadProps = {
  onTextExtracted: (text: string) => void;
  onAnalyze: () => void;
  isAnalyzing?: boolean;
};

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_FILE_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const extractTextFromPdf = async (file: File) => {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  let fullText = '';

  for (let pageIndex = 1; pageIndex <= pdf.numPages; pageIndex += 1) {
    const page = await pdf.getPage(pageIndex);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => typeof item.str === 'string' ? item.str : '')
      .join(' ');
    fullText += `${pageText}\n\n`;
  }

  return fullText.trim();
};

const extractTextFromDocx = async (file: File) => {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value.trim();
};

export default function ResumeUpload({ onTextExtracted, onAnalyze, isAnalyzing = false }: ResumeUploadProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [text, setText] = useState('');

  const handleFileSelection = async (file: File | null) => {
    setError('');
    if (!file) {
      return;
    }

    if (file.size === 0) {
      setError('Could not read this file. Please try a different format or paste your resume as text.');
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError('File size exceeds 5MB. Please upload a smaller file or paste your resume as text.');
      return;
    }

    if (!ACCEPTED_FILE_TYPES.includes(file.type) && !file.name.toLowerCase().endsWith('.docx') && !file.name.toLowerCase().endsWith('.pdf') && !file.name.toLowerCase().endsWith('.txt')) {
      setError('Unsupported file type. Please upload a PDF, DOCX, or TXT file.');
      return;
    }

    setLoading(true);
    setFileName(file.name);
    setFileSize(formatBytes(file.size));

    try {
      const extension = file.name.split('.').pop()?.toLowerCase();
      let extracted = '';

      if (extension === 'pdf') {
        extracted = await extractTextFromPdf(file);
      } else if (extension === 'docx') {
        extracted = await extractTextFromDocx(file);
      } else {
        extracted = await file.text();
      }

      if (!extracted.trim()) {
        throw new Error('Empty or unreadable file');
      }

      setText(extracted);
      onTextExtracted(extracted);
    } catch (err) {
      console.error(err);
      setText('');
      setFileName(file.name);
      setError('Could not read this file. Please try a different format or paste your resume as text.');
      onTextExtracted('');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (value: string) => {
    setText(value);
    onTextExtracted(value);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] ?? null;
    await handleFileSelection(selectedFile);
  };

  const handleChooseFile = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-5 rounded-2xl border border-line bg-paper p-5 dark:border-lineDark dark:bg-ink">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-semibold">Upload or paste your resume</h2>
          <p className="text-sm text-graphite dark:text-graphiteDark">Upload PDF, DOCX, TXT, or paste plain resume text. No job description is needed for your ATS score.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={handleChooseFile} className="inline-flex items-center justify-center rounded-full border border-line px-4 py-2 font-mono text-sm font-semibold text-ink transition hover:border-flame hover:text-flame dark:border-lineDark dark:text-paper dark:hover:border-flameDark dark:hover:text-flameDark">
            Choose a file
          </button>
          <button
            type="button"
            onClick={onAnalyze}
            disabled={!text.trim() || loading || isAnalyzing}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-flame px-4 py-2 font-mono text-sm font-semibold text-paper transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-flameDark"
          >
            <Sparkles className="h-4 w-4" />
            {isAnalyzing ? 'Scoring resume...' : 'Get ATS score'}
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.txt"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="space-y-3">
        {fileName ? (
          <div className="rounded-2xl border border-line bg-paperRaised p-4 text-sm text-graphite dark:border-lineDark dark:bg-inkRaised dark:text-graphiteDark">
            <div className="font-display font-semibold text-ink dark:text-paper">Selected file</div>
            <p>{fileName}</p>
            <p>{fileSize}</p>
          </div>
        ) : null}

        {loading ? (
          <div className="flex items-center gap-3 rounded-2xl border border-line bg-paperRaised p-4 text-sm text-graphite dark:border-lineDark dark:bg-inkRaised dark:text-graphiteDark">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-flame border-t-transparent dark:border-flameDark dark:border-t-transparent" />
            <span>Parsing file, please wait...</span>
          </div>
        ) : null}

        {error ? (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-2xl border border-line border-l-4 border-l-flame bg-paperRaised p-4 text-sm text-ink dark:border-lineDark dark:border-l-flameDark dark:bg-inkRaised dark:text-paper"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-flame dark:text-flameDark" />
            <p>{error}</p>
          </div>
        ) : null}

        <label className="block font-mono text-sm font-semibold text-ink dark:text-paper">Resume text preview</label>
        <textarea
          value={text}
          onChange={(event) => handleInputChange(event.target.value)}
          placeholder="Paste your resume text here or upload a file to auto-fill..."
          className="min-h-[280px] w-full rounded-2xl border border-line bg-paperRaised p-4 text-sm text-ink outline-none transition placeholder:text-graphite/70 focus:border-flame dark:border-lineDark dark:bg-inkRaised dark:text-paper dark:placeholder:text-graphiteDark/70 dark:focus:border-flameDark"
        />

      </div>
    </div>
  );
}
