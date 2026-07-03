import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { jsPDF } from 'jspdf';
import ResumeUpload from './components/ResumeUpload';
import FallbackPage from './pages/FallbackPage';

type BreakdownEntry = {
  label: string;
  score: number;
  weight: number;
};

type AnalysisResponse = {
  score: number;
  breakdown: Record<string, BreakdownEntry>;
  profile: {
    name: string;
    email: string;
    phone: string;
    skills: string[];
    summary: string;
    experience: string;
    education: string;
    projects: string;
    certifications: string;
    raw_text: string;
  };
  recommendations: string[];
};

type JobMatchResponse = {
  match_percentage: number;
  missing_keywords: string[];
  present_keywords: string[];
  recruiter_suggestions: string[];
};

type HistoryItem = {
  timestamp: string;
  score: number;
  summary: string;
};

const API_BASE = 'http://127.0.0.1:8000/api/analyze';
const HISTORY_KEY = 'careerpilot-history';

const parseResumeText = (text: string) => {
  const lines = text.split(/\n+/).filter(Boolean);
  return lines.slice(0, 12).join(' ');
};

const highlightText = (text: string, matched: string[], missing: string[]) => {
  const allKeywords = Array.from(new Set([...matched, ...missing]));
  const sortedKeywords = [...allKeywords].sort((a, b) => b.length - a.length);

  const pattern = new RegExp(`(${sortedKeywords.map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');

  return text.split(pattern).map((part, index) => {
    const normalized = part.toLowerCase();
    const isMatched = matched.some((keyword) => keyword.toLowerCase() === normalized);
    const isMissing = missing.some((keyword) => keyword.toLowerCase() === normalized);

    if (isMatched) {
      return <span key={`${part}-${index}`} className="rounded bg-emerald-500/20 px-1 text-emerald-300">{part}</span>;
    }
    if (isMissing) {
      return <span key={`${part}-${index}`} className="rounded bg-rose-500/20 px-1 text-rose-300">{part}</span>;
    }
    return <span key={`${part}-${index}`}>{part}</span>;
  });
};

function App() {
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [jobMatch, setJobMatch] = useState<JobMatchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [offlineMode, setOfflineMode] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem(HISTORY_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const runAnalysis = async () => {
    if (!resumeText.trim()) {
      setError('Please upload or paste a resume first.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE}/ats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume_text: resumeText }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status >= 500 || response.status === 503) {
          setOfflineMode(true);
          throw new Error('Our AI engine is temporarily unavailable. Basic offline analysis is available.');
        }
        throw new Error(data.detail || 'Analysis failed');
      }
      setAnalysis(data);
      const nextHistory = [{ timestamp: new Date().toLocaleString(), score: data.score, summary: parseResumeText(resumeText) }, ...history].slice(0, 5);
      setHistory(nextHistory);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(nextHistory));
    } catch (err) {
      if (err instanceof TypeError) {
        setOfflineMode(true);
        setError('Our AI engine is temporarily unavailable. Basic offline analysis is available.');
      } else {
        setError(err instanceof Error ? err.message : 'Unable to analyze resume.');
      }
    } finally {
      setLoading(false);
    }
  };

  const runJobMatch = async () => {
    if (!resumeText.trim() || !jobDescription.trim()) {
      setError('Please provide both a resume and a job description.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE}/job-match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume_text: resumeText, job_description: jobDescription }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status >= 500 || response.status === 503) {
          setOfflineMode(true);
          throw new Error('Our AI engine is temporarily unavailable. Basic offline analysis is available.');
        }
        throw new Error(data.detail || 'Job match failed');
      }
      setJobMatch(data);
    } catch (err) {
      if (err instanceof TypeError) {
        setOfflineMode(true);
        setError('Our AI engine is temporarily unavailable. Basic offline analysis is available.');
      } else {
        setError(err instanceof Error ? err.message : 'Unable to calculate job match.');
      }
    } finally {
      setLoading(false);
    }
  };

  const generateCoverLetter = async () => {
    if (!resumeText.trim() || !jobDescription.trim()) {
      setError('Please provide both a resume and a job description.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE}/cover-letter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume_text: resumeText, job_description: jobDescription }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status >= 500 || response.status === 503) {
          setOfflineMode(true);
          throw new Error('Our AI engine is temporarily unavailable. Basic offline analysis is available.');
        }
        throw new Error(data.detail || 'Cover letter generation failed');
      }
      setCoverLetter(data.cover_letter);
    } catch (err) {
      if (err instanceof TypeError) {
        setOfflineMode(true);
        setError('Our AI engine is temporarily unavailable. Basic offline analysis is available.');
      } else {
        setError(err instanceof Error ? err.message : 'Unable to generate cover letter.');
      }
    } finally {
      setLoading(false);
    }
  };

  const exportPdf = () => {
    if (!analysis) return;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('CareerPilot AI ATS Report', 14, 20);
    doc.setFontSize(11);
    doc.text(`ATS Score: ${analysis.score}/100`, 14, 32);
    doc.text('Breakdown:', 14, 42);
    let y = 52;
    Object.values(analysis.breakdown).forEach((item) => {
      doc.text(`${item.label}: ${item.score}% (weight ${item.weight}%)`, 16, y);
      y += 8;
    });
    doc.text('Recommendations:', 14, y + 8);
    y += 16;
    analysis.recommendations.forEach((item) => {
      doc.text(`• ${item}`, 16, y);
      y += 8;
    });
    doc.save('careerpilot-ats-report.pdf');
  };

  const breakdown = useMemo(() => analysis?.breakdown ? Object.values(analysis.breakdown) : [], [analysis]);

  const handleRetry = () => {
    setOfflineMode(false);
    setError('');
  };

  if (offlineMode) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
        <FallbackPage resumeText={resumeText} onRetry={handleRetry} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-slate-950/30">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">CareerPilot AI</p>
              <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">AI-powered resume intelligence and career readiness</h1>
              <p className="mt-3 max-w-2xl text-sm text-slate-300 sm:text-base">Analyze your resume, match it against a job description, generate a tailored cover letter, and export a polished ATS report.</p>
            </div>
            <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-200">
              <div className="font-semibold">Current score</div>
              <div className="text-2xl font-bold">{analysis?.score ?? 0}/100</div>
            </div>
          </div>
        </header>

        {error ? <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</div> : null}

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl shadow-slate-950/30">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Resume input</h2>
                  <p className="text-sm text-slate-400">Upload PDF, DOCX, TXT, or paste plain resume text to begin analysis.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button onClick={runAnalysis} className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400">Analyze ATS</button>
                  <button onClick={runJobMatch} className="rounded-full border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-cyan-400 hover:text-cyan-300">Match Job</button>
                  <button onClick={generateCoverLetter} className="rounded-full border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-cyan-400 hover:text-cyan-300">Generate Cover Letter</button>
                </div>
              </div>

              <div className="mt-4">
                <ResumeUpload onTextExtracted={setResumeText} />
              </div>
            </section>

            <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl shadow-slate-950/30">
              <h2 className="text-xl font-semibold">Job description</h2>
              <textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} className="mt-4 min-h-[160px] w-full rounded-2xl border border-slate-800 bg-slate-950/80 p-4 text-sm outline-none ring-0" placeholder="Paste the target role description..." />
            </section>
          </div>

          <div className="space-y-6">
            <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl shadow-slate-950/30">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">ATS score breakdown</h2>
                {analysis ? <button onClick={exportPdf} className="rounded-full border border-slate-700 px-3 py-1.5 text-sm text-slate-300">Export PDF</button> : null}
              </div>
              {analysis ? (
                <div className="mt-4 space-y-3">
                  {breakdown.map((item) => (
                    <div key={item.label}>
                      <div className="mb-1 flex justify-between text-sm text-slate-300">
                        <span>{item.label}</span>
                        <span>{item.score}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                        <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400" style={{ width: `${item.score}%` }} />
                      </div>
                    </div>
                  ))}
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-300">
                    <div className="font-semibold text-slate-100">Recommendations</div>
                    <ul className="mt-2 space-y-2">
                      {analysis.recommendations.map((item) => <li key={item} className="flex gap-2"><span className="text-cyan-400">•</span><span>{item}</span></li>)}
                    </ul>
                  </div>
                </div>
              ) : <div className="mt-4 rounded-2xl border border-dashed border-slate-700 p-6 text-sm text-slate-400">Run an analysis to see the weighted ATS score breakdown.</div>}
            </section>

            <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl shadow-slate-950/30">
              <h2 className="text-xl font-semibold">Keyword match preview</h2>
              {jobMatch ? (
                <div className="mt-4 space-y-3 text-sm text-slate-300">
                  <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
                    <span>Match score</span>
                    <span className="font-semibold text-cyan-300">{jobMatch.match_percentage}%</span>
                  </div>
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
                    <div className="font-semibold text-slate-100">Matched keywords</div>
                    <div className="mt-2 flex flex-wrap gap-2">{jobMatch.present_keywords.map((kw) => <span key={kw} className="rounded-full bg-emerald-500/15 px-3 py-1 text-emerald-300">{kw}</span>)}</div>
                  </div>
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
                    <div className="font-semibold text-slate-100">Missing keywords</div>
                    <div className="mt-2 flex flex-wrap gap-2">{jobMatch.missing_keywords.map((kw) => <span key={kw} className="rounded-full bg-rose-500/15 px-3 py-1 text-rose-300">{kw}</span>)}</div>
                  </div>
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
                    <div className="font-semibold text-slate-100">Recruiter suggestions</div>
                    <ul className="mt-2 space-y-2">{jobMatch.recruiter_suggestions.map((item) => <li key={item} className="flex gap-2"><span className="text-cyan-400">•</span><span>{item}</span></li>)}</ul>
                  </div>
                </div>
              ) : <div className="mt-4 rounded-2xl border border-dashed border-slate-700 p-6 text-sm text-slate-400">Run a job match to see keyword gaps and recruiter suggestions.</div>}
            </section>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl shadow-slate-950/30">
            <h2 className="text-xl font-semibold">Resume preview with highlights</h2>
            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm leading-7 text-slate-300">
              {jobMatch ? highlightText(resumeText || 'Paste a resume to preview keyword highlights.', jobMatch.present_keywords, jobMatch.missing_keywords) : <span>{resumeText || 'Paste a resume to preview keyword highlights.'}</span>}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl shadow-slate-950/30">
            <h2 className="text-xl font-semibold">Cover letter</h2>
            {coverLetter ? <div className="mt-4 whitespace-pre-line rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm leading-7 text-slate-300">{coverLetter}</div> : <div className="mt-4 rounded-2xl border border-dashed border-slate-700 p-6 text-sm text-slate-400">Generate a tailored cover letter once the resume and role description are ready.</div>}
          </section>
        </div>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl shadow-slate-950/30">
          <h2 className="text-xl font-semibold">Score history</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {history.length ? history.map((item) => (
              <div key={`${item.timestamp}-${item.score}`} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-300">
                <div className="font-semibold text-slate-100">{item.score}/100</div>
                <div className="mt-2 text-xs text-slate-500">{item.timestamp}</div>
                <div className="mt-2 line-clamp-3">{item.summary}</div>
              </div>
            )) : <div className="rounded-2xl border border-dashed border-slate-700 p-6 text-sm text-slate-400 md:col-span-2 xl:col-span-5">Your last five scan snapshots will appear here.</div>}
          </div>
        </section>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm">
              <div className="rounded-3xl border border-slate-800 bg-slate-900 px-6 py-5 text-sm text-slate-200">Analyzing your resume…</div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default App;
