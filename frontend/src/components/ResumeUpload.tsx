import { useRef, useState } from 'react';
import * as mammoth from 'mammoth';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf.mjs';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

globalThis.window && (GlobalWorkerOptions.workerSrc = pdfWorkerUrl);

type ResumeUploadProps = {
  onTextExtracted: (text: string) => void;
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

export default function ResumeUpload({ onTextExtracted }: ResumeUploadProps) {
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
    <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl shadow-slate-950/20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Upload or paste your resume</h2>
          <p className="text-sm text-slate-400">Upload PDF, DOCX, TXT, or paste plain resume text below.</p>
        </div>
        <button type="button" onClick={handleChooseFile} className="inline-flex items-center justify-center rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400">
          Choose a file
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.txt"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="mt-5 space-y-3">
        {fileName ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-300">
            <div className="font-semibold text-slate-100">Selected file</div>
            <p>{fileName}</p>
            <p>{fileSize}</p>
          </div>
        ) : null}

        {loading ? (
          <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-300">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
            <span>Parsing file, please wait...</span>
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
            {error}
          </div>
        ) : null}

        <label className="block text-sm font-semibold text-slate-200">Resume text preview</label>
        <textarea
          value={text}
          onChange={(event) => handleInputChange(event.target.value)}
          placeholder="Paste your resume text here or upload a file to auto-fill..."
          className="min-h-[280px] w-full rounded-3xl border border-slate-800 bg-slate-950/90 p-4 text-sm text-slate-100 outline-none transition focus:border-cyan-500"
        />
      </div>
    </div>
  );
}
