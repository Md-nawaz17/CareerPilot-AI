import { useEffect, useState } from 'react';
import { scoreResumeOffline, LocalAtsScore } from '../utils/localAtsScorer';

type FallbackPageProps = {
  resumeText: string;
  onRetry: () => void;
};

export default function FallbackPage({ resumeText, onRetry }: FallbackPageProps) {
  const [score, setScore] = useState<LocalAtsScore | null>(null);

  useEffect(() => {
    const offlineScore = scoreResumeOffline(resumeText || '');
    setScore(offlineScore);
  }, [resumeText]);

  return (
    <div className="mx-auto max-w-4xl rounded-3xl border border-amber-500/20 bg-slate-950/90 p-8 shadow-2xl shadow-slate-950/40">
      <div className="space-y-6">
        <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-6">
          <h1 className="text-2xl font-semibold text-amber-100">Our AI engine is temporarily unavailable.</h1>
          <p className="mt-3 text-sm text-amber-200">You can still use basic resume analysis while we reconnect. Try again later for full AI-powered results.</p>
        </div>

        {score ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
              <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Basic ATS Score (Offline Mode)</p>
              <p className="mt-4 text-5xl font-bold text-cyan-300">{score.overallScore}/100</p>
              <p className="mt-2 text-sm text-slate-400">For full AI analysis, try again later.</p>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
              <h2 className="text-lg font-semibold text-slate-100">Offline scoring breakdown</h2>
              <div className="mt-4 space-y-3 text-sm text-slate-300">
                {Object.entries(score.breakdown).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between rounded-2xl bg-slate-950/70 px-3 py-2">
                    <span className="capitalize tracking-wide text-slate-400">{key.replace('_', ' ')}</span>
                    <span className="font-semibold text-slate-100">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
          <h2 className="text-lg font-semibold text-slate-100">Why this matters</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-300">
            <li>Contact info and profile sections make your resume easier to scan.</li>
            <li>Bullet points and action verbs improve ATS parsing and recruiter readability.</li>
            <li>Skills, education, and projects help match the right role quickly.</li>
          </ul>
        </div>

        {score?.reasons.length ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
            <h2 className="text-lg font-semibold text-slate-100">Suggestions for improvement</h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-300">
              {score.reasons.slice(0, 5).map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button onClick={onRetry} className="inline-flex w-full items-center justify-center rounded-full bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 sm:w-auto">
            Retry Connection
          </button>
        </div>
      </div>
    </div>
  );
}
