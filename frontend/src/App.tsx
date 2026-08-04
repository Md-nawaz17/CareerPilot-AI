import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { jsPDF } from 'jspdf';
import { AlertCircle, FileText, Target } from 'lucide-react';
import DashboardHeader from './components/DashboardHeader';
import LandingPage from './components/LandingPage';
import ResumeUpload from './components/ResumeUpload';
import ThemeToggle from './components/ThemeToggle';
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

type CoverLetterResponse = {
  cover_letter: string;
  generation_source?: 'nvidia' | 'anthropic' | 'fallback';
  detail?: string;
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
      return <span key={`${part}-${index}`} className="rounded bg-tealx/10 px-1 text-tealx dark:bg-tealxDark/15 dark:text-tealxDark">{part}</span>;
    }
    if (isMissing) {
      return <span key={`${part}-${index}`} className="rounded bg-flame/10 px-1 text-flame dark:bg-flameDark/15 dark:text-flameDark">{part}</span>;
    }
    return <span key={`${part}-${index}`}>{part}</span>;
  });
};

const getScoreBarClasses = (score: number) => {
  if (score >= 85) return 'bg-tealx dark:bg-tealxDark';
  if (score >= 60) return 'bg-caution dark:bg-cautionDark';
  return 'bg-flame dark:bg-flameDark';
};

const getScoreTextClasses = (score: number) => {
  if (score >= 85) return 'text-tealx dark:text-tealxDark';
  if (score >= 60) return 'text-caution dark:text-cautionDark';
  return 'text-flame dark:text-flameDark';
};

function App() {
  const [view, setView] = useState<'landing' | 'app'>('landing');
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [jobMatch, setJobMatch] = useState<JobMatchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [coverLetterSource, setCoverLetterSource] = useState<CoverLetterResponse['generation_source']>();
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
    if (!resumeText.trim()) {
      setError('Add a resume to run a match.');
      return;
    }

    if (!jobDescription.trim()) {
      setError('Add a job description to run a match.');
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
    if (!resumeText.trim()) {
      setError('Add a resume to generate a cover letter.');
      return;
    }

    if (!jobDescription.trim()) {
      setError('Add a job description to generate a cover letter.');
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
      const data = await response.json() as CoverLetterResponse;
      if (!response.ok) {
        if (response.status >= 500 || response.status === 503) {
          setOfflineMode(true);
          throw new Error('Our AI engine is temporarily unavailable. Basic offline analysis is available.');
        }
        throw new Error(data.detail || 'Cover letter generation failed');
      }
      if (typeof data.cover_letter !== 'string' || !data.cover_letter.trim()) {
        throw new Error('Cover letter generation returned an empty response.');
      }
      setCoverLetter(data.cover_letter);
      setCoverLetterSource(data.generation_source);
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
      doc.text(`- ${item}`, 16, y);
      y += 8;
    });
    doc.save('careerpilot-ats-report.pdf');
  };

  const breakdown = useMemo(() => analysis?.breakdown ? Object.values(analysis.breakdown) : [], [analysis]);

  const handleRetry = () => {
    setOfflineMode(false);
    setError('');
  };

  if (view === 'landing') {
    return <LandingPage onLaunch={() => setView('app')} />;
  }

  if (offlineMode) {
    return (
      <div className="min-h-screen bg-paper px-4 py-6 font-body text-ink dark:bg-ink dark:text-paper sm:px-6 lg:px-8">
        <FallbackPage resumeText={resumeText} onRetry={handleRetry} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper px-4 py-6 font-body text-ink dark:bg-ink dark:text-paper sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <DashboardHeader score={analysis?.score ?? null} />

        {error ? (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-2xl border border-line border-l-4 border-l-flame bg-paperRaised p-4 text-sm text-ink dark:border-lineDark dark:border-l-flameDark dark:bg-inkRaised dark:text-paper"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-flame dark:text-flameDark" />
            <p>{error}</p>
          </div>
        ) : null}

        <div className="space-y-6">
          <section className="rounded-2xl border border-line bg-paperRaised p-5 shadow-sm dark:border-lineDark dark:bg-inkRaised dark:shadow-none">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-flame dark:text-flameDark">Resume-only analysis</p>
                <h2 className="mt-1 font-display text-xl font-semibold">Get an ATS score from your resume</h2>
                <p className="text-sm text-graphite dark:text-graphiteDark">Upload PDF, DOCX, TXT, or paste your resume. A job description is not required.</p>
              </div>
              <ThemeToggle />
            </div>

            <div className="mt-4">
              <ResumeUpload onTextExtracted={setResumeText} onAnalyze={runAnalysis} isAnalyzing={loading} />
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-paperRaised p-5 shadow-sm dark:border-lineDark dark:bg-inkRaised dark:shadow-none">
            <h2 className="font-display text-xl font-semibold">Target job description <span className="font-body text-sm font-normal text-graphite dark:text-graphiteDark">(optional)</span></h2>
            <p className="mt-1 text-sm text-graphite dark:text-graphiteDark">Add a target role only when you want to compare your resume or generate a tailored cover letter.</p>
            <textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} className="mt-4 min-h-[160px] w-full rounded-2xl border border-line bg-paper p-4 text-sm text-ink outline-none ring-0 transition placeholder:text-graphite/70 focus:border-flame dark:border-lineDark dark:bg-ink dark:text-paper dark:placeholder:text-graphiteDark/70 dark:focus:border-flameDark" placeholder="Optional for ATS scoring. Paste a target role to match or generate a cover letter..." />
            <div className="mt-4 flex flex-wrap gap-3">
              <button onClick={runJobMatch} disabled={loading} className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 font-mono text-sm font-semibold text-ink transition hover:border-flame hover:text-flame disabled:cursor-not-allowed disabled:opacity-50 dark:border-lineDark dark:text-paper dark:hover:border-flameDark dark:hover:text-flameDark">
                <Target className="h-4 w-4" />
                Match against job
              </button>
              <button onClick={generateCoverLetter} disabled={loading} className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 font-mono text-sm font-semibold text-ink transition hover:border-flame hover:text-flame disabled:cursor-not-allowed disabled:opacity-50 dark:border-lineDark dark:text-paper dark:hover:border-flameDark dark:hover:text-flameDark">
                <FileText className="h-4 w-4" />
                Generate cover letter
              </button>
            </div>
          </section>
        </div>

        <section className="rounded-2xl border border-line bg-paperRaised p-5 shadow-sm dark:border-lineDark dark:bg-inkRaised dark:shadow-none">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-xl font-semibold">ATS score breakdown</h2>
              <p className="mt-1 text-sm text-graphite dark:text-graphiteDark">A clear score summary helps you spot weak resume categories and improve results faster.</p>
            </div>
            {analysis ? <button onClick={exportPdf} className="rounded-full border border-line px-3 py-1.5 font-mono text-sm text-ink transition hover:border-flame hover:text-flame dark:border-lineDark dark:text-paper dark:hover:border-flameDark dark:hover:text-flameDark">Export PDF</button> : null}
          </div>

          {analysis ? (
            <div className="mt-6 space-y-6">
              <div className="grid gap-4 lg:grid-cols-[0.5fr_0.5fr]">
                <div className="rounded-2xl border border-line bg-paper p-6 text-center dark:border-lineDark dark:bg-ink">
                  <div className="font-mono text-xs uppercase tracking-[0.24em] text-graphite dark:text-graphiteDark">Resume ATS score</div>
                  <div className="mt-4 text-5xl font-semibold tracking-tight text-tealx dark:text-tealxDark">{analysis.score}</div>
                  <div className="mt-3 text-sm text-graphite dark:text-graphiteDark">Weighted across contact info, skills, experience, and formatting.</div>
                </div>
                <div className="rounded-2xl border border-line bg-paper p-6 text-sm text-graphite dark:border-lineDark dark:bg-ink dark:text-graphiteDark">
                  <div className="font-display text-lg font-semibold text-ink dark:text-paper">Recommendations</div>
                  <ul className="mt-3 space-y-2">
                    {analysis.recommendations.map((item) => <li key={item} className="flex gap-2"><span className="text-tealx dark:text-tealxDark">-</span><span>{item}</span></li>)}
                  </ul>
                </div>
              </div>

              <div className="space-y-4">
                {breakdown.map((item) => (
                  <div key={item.label}>
                    <div className="mb-1 flex justify-between text-sm text-graphite dark:text-graphiteDark">
                      <span>{item.label}</span>
                      <span className={`font-mono ${getScoreTextClasses(item.score)}`}>{item.score}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-line dark:bg-lineDark">
                      <div className={`h-full rounded-full ${getScoreBarClasses(item.score)}`} style={{ width: `${item.score}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : <div className="mt-4 rounded-2xl border border-dashed border-line p-6 text-sm text-graphite dark:border-lineDark dark:text-graphiteDark">Upload a resume and select Get ATS score. A job description is not required.</div>}
        </section>

        <section className="rounded-2xl border border-line bg-paperRaised p-5 shadow-sm dark:border-lineDark dark:bg-inkRaised dark:shadow-none">
          <h2 className="font-display text-xl font-semibold">Keyword match preview</h2>
          {jobMatch ? (
            <div className="mt-4 space-y-3 text-sm text-graphite dark:text-graphiteDark">
              <div className="flex items-center justify-between rounded-2xl border border-line bg-paper p-3 dark:border-lineDark dark:bg-ink">
                <span>Match score</span>
                <span className="font-mono font-semibold text-tealx dark:text-tealxDark">{jobMatch.match_percentage}%</span>
              </div>
              <div className="rounded-2xl border border-line bg-paper p-3 dark:border-lineDark dark:bg-ink">
                <div className="font-display font-semibold text-ink dark:text-paper">Matched keywords</div>
                <div className="mt-2 flex flex-wrap gap-2">{jobMatch.present_keywords.map((kw) => <span key={kw} className="rounded-full bg-tealx/10 px-3 py-1 font-mono text-xs text-tealx dark:bg-tealxDark/15 dark:text-tealxDark">{kw}</span>)}</div>
              </div>
              <div className="rounded-2xl border border-line bg-paper p-3 dark:border-lineDark dark:bg-ink">
                <div className="font-display font-semibold text-ink dark:text-paper">Missing keywords</div>
                <div className="mt-2 flex flex-wrap gap-2">{jobMatch.missing_keywords.map((kw) => <span key={kw} className="rounded-full bg-flame/10 px-3 py-1 font-mono text-xs text-flame dark:bg-flameDark/15 dark:text-flameDark">{kw}</span>)}</div>
              </div>
              <div className="rounded-2xl border border-line bg-paper p-3 dark:border-lineDark dark:bg-ink">
                <div className="font-display font-semibold text-ink dark:text-paper">Recruiter suggestions</div>
                <ul className="mt-2 space-y-2">{jobMatch.recruiter_suggestions.map((item) => <li key={item} className="flex gap-2"><span className="text-tealx dark:text-tealxDark">-</span><span>{item}</span></li>)}</ul>
              </div>
            </div>
          ) : <div className="mt-4 rounded-2xl border border-dashed border-line p-6 text-sm text-graphite dark:border-lineDark dark:text-graphiteDark">Run a job match to see keyword gaps and recruiter suggestions.</div>}
        </section>

        <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <section className="rounded-2xl border border-line bg-paperRaised p-5 shadow-sm dark:border-lineDark dark:bg-inkRaised dark:shadow-none">
            <h2 className="font-display text-xl font-semibold">Resume preview with highlights</h2>
            <div className="mt-4 rounded-2xl border border-line bg-paper p-4 text-sm leading-7 text-graphite dark:border-lineDark dark:bg-ink dark:text-graphiteDark">
              {jobMatch ? highlightText(resumeText || 'Paste a resume to preview keyword highlights.', jobMatch.present_keywords, jobMatch.missing_keywords) : <span>{resumeText || 'Paste a resume to preview keyword highlights.'}</span>}
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-paperRaised p-5 shadow-sm dark:border-lineDark dark:bg-inkRaised dark:shadow-none">
            <h2 className="font-display text-xl font-semibold">Cover letter</h2>
            {coverLetter ? (
              <div className="mt-4 space-y-3">
                {coverLetterSource === 'fallback' ? <p className="rounded-xl border border-flame/30 bg-flame/5 px-3 py-2 text-sm text-graphite dark:border-flameDark/30 dark:bg-flameDark/10 dark:text-graphiteDark">This draft was created by the local fallback. Configure an AI provider for a more personalized result.</p> : null}
                <div className="whitespace-pre-line rounded-2xl border border-line bg-paper p-4 text-sm leading-7 text-graphite dark:border-lineDark dark:bg-ink dark:text-graphiteDark">{coverLetter}</div>
              </div>
            ) : <div className="mt-4 rounded-2xl border border-dashed border-line p-6 text-sm text-graphite dark:border-lineDark dark:text-graphiteDark">Generate a tailored cover letter once the resume and role description are ready.</div>}
          </section>
        </div>

        <section className="rounded-2xl border border-line bg-paperRaised p-5 shadow-sm dark:border-lineDark dark:bg-inkRaised dark:shadow-none">
          <h2 className="font-display text-xl font-semibold">Score history</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {history.length ? history.map((item) => (
              <div key={`${item.timestamp}-${item.score}`} className="rounded-2xl border border-line bg-paper p-4 text-sm text-graphite dark:border-lineDark dark:bg-ink dark:text-graphiteDark">
                <div className="font-mono font-semibold text-tealx dark:text-tealxDark">{item.score}/100</div>
                <div className="mt-2 text-xs text-graphite/70 dark:text-graphiteDark/70">{item.timestamp}</div>
                <div className="mt-2 line-clamp-3">{item.summary}</div>
              </div>
            )) : <div className="rounded-2xl border border-dashed border-line p-6 text-sm text-graphite dark:border-lineDark dark:text-graphiteDark md:col-span-2 xl:col-span-5">Your last five scan snapshots will appear here.</div>}
          </div>
        </section>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-sm dark:bg-ink/70">
              <div className="rounded-2xl border border-line bg-paperRaised px-6 py-5 font-mono text-sm text-ink dark:border-lineDark dark:bg-inkRaised dark:text-paper">Analyzing your resume...</div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default App;
