import { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
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
    <div className="mx-auto max-w-4xl rounded-2xl border border-line bg-paperRaised p-8 shadow-sm dark:border-lineDark dark:bg-inkRaised dark:shadow-none">
      <div className="space-y-6">
        <div className="flex items-start gap-3 rounded-3xl border border-line border-l-4 border-l-flame bg-paperRaised p-6 dark:border-lineDark dark:border-l-flameDark dark:bg-inkRaised">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-flame dark:text-flameDark" />
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink dark:text-paper">Our AI engine is temporarily unavailable.</h1>
            <p className="mt-3 text-sm text-graphite dark:text-graphiteDark">You can still use basic resume analysis while we reconnect. Try again later for full AI-powered results.</p>
          </div>
        </div>

        {score ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-line bg-paper p-6 dark:border-lineDark dark:bg-ink">
              <p className="font-mono text-sm uppercase tracking-widest text-graphite dark:text-graphiteDark">Basic ATS Score (Offline Mode)</p>
              <p className="mt-4 font-mono text-5xl font-bold text-tealx dark:text-tealxDark">{score.overallScore}/100</p>
              <p className="mt-2 text-sm text-graphite dark:text-graphiteDark">For full AI analysis, try again later.</p>
            </div>
            <div className="rounded-2xl border border-line bg-paper p-6 dark:border-lineDark dark:bg-ink">
              <h2 className="font-display text-lg font-semibold text-ink dark:text-paper">Offline scoring breakdown</h2>
              <div className="mt-4 space-y-3 text-sm text-graphite dark:text-graphiteDark">
                {Object.entries(score.breakdown).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between rounded-2xl bg-paperRaised px-3 py-2 dark:bg-inkRaised">
                    <span className="capitalize tracking-wide text-graphite dark:text-graphiteDark">{key.replace('_', ' ')}</span>
                    <span className="font-mono font-semibold text-ink dark:text-paper">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        <div className="rounded-2xl border border-line bg-paper p-6 dark:border-lineDark dark:bg-ink">
          <h2 className="font-display text-lg font-semibold text-ink dark:text-paper">Why this matters</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-graphite dark:text-graphiteDark">
            <li>Contact info and profile sections make your resume easier to scan.</li>
            <li>Bullet points and action verbs improve ATS parsing and recruiter readability.</li>
            <li>Skills, education, and projects help match the right role quickly.</li>
          </ul>
        </div>

        {score?.reasons.length ? (
          <div className="rounded-2xl border border-line bg-paper p-6 dark:border-lineDark dark:bg-ink">
            <h2 className="font-display text-lg font-semibold text-ink dark:text-paper">Suggestions for improvement</h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-graphite dark:text-graphiteDark">
              {score.reasons.slice(0, 5).map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button onClick={onRetry} className="inline-flex w-full items-center justify-center rounded-full bg-flame px-5 py-3 font-mono text-sm font-semibold text-paper transition hover:opacity-90 dark:bg-flameDark sm:w-auto">
            Retry Connection
          </button>
        </div>
      </div>
    </div>
  );
}
