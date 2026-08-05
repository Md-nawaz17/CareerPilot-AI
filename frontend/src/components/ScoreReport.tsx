import { Download } from 'lucide-react';

type ScoreBreakdownItem = {
  label: string;
  score: number;
  weight: number;
};

type ScoreReportProps = {
  score: number;
  breakdown: ScoreBreakdownItem[];
  recommendations: string[];
  onExport: () => void;
};

type ScoreTone = {
  label: string;
  description: string;
  badgeClass: string;
  textClass: string;
  barClass: string;
};

const getScoreTone = (score: number): ScoreTone => {
  if (score < 60) {
    return {
      label: 'Needs attention',
      description: 'Address the weakest categories before you apply.',
      badgeClass: 'border-flame/35 bg-flame/10 text-flame dark:border-flameDark/35 dark:bg-flameDark/10 dark:text-flameDark',
      textClass: 'text-flame dark:text-flameDark',
      barClass: 'bg-flame dark:bg-flameDark',
    };
  }

  if (score < 80) {
    return {
      label: 'Needs work',
      description: 'A few targeted improvements can raise this score.',
      badgeClass: 'border-caution/35 bg-caution/10 text-caution dark:border-cautionDark/35 dark:bg-cautionDark/10 dark:text-cautionDark',
      textClass: 'text-caution dark:text-cautionDark',
      barClass: 'bg-caution dark:bg-cautionDark',
    };
  }

  return {
    label: 'Strong',
    description: 'Your resume is in strong shape for a first-pass scan.',
    badgeClass: 'border-tealx/35 bg-tealx/10 text-tealx dark:border-tealxDark/35 dark:bg-tealxDark/10 dark:text-tealxDark',
    textClass: 'text-tealx dark:text-tealxDark',
    barClass: 'bg-tealx dark:bg-tealxDark',
  };
};

export default function ScoreReport({ score, breakdown, recommendations, onExport }: ScoreReportProps) {
  const overallTone = getScoreTone(score);

  return (
    <section aria-labelledby="ats-report-heading" className="rounded-2xl border border-line bg-paperRaised p-5 shadow-sm dark:border-lineDark dark:bg-inkRaised dark:shadow-none sm:p-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(220px,0.34fr)_minmax(0,0.66fr)] lg:gap-8">
        <div className="border-b border-line pb-6 dark:border-lineDark lg:border-b-0 lg:border-r lg:pb-0 lg:pr-8">
          <p className="font-mono text-xs uppercase tracking-widest text-graphite dark:text-graphiteDark">ATS score report</p>
          <div className="mt-3 flex items-end gap-2">
            <span className={`font-mono text-7xl font-semibold leading-none ${overallTone.textClass}`}>{Math.round(score)}</span>
            <span className="pb-1 font-mono text-xl text-graphite dark:text-graphiteDark">/100</span>
          </div>
          <span className={`mt-4 inline-flex rounded-full border px-3 py-1 font-mono text-xs uppercase tracking-widest ${overallTone.badgeClass}`}>{overallTone.label}</span>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-graphite dark:text-graphiteDark">{overallTone.description}</p>
          <button onClick={onExport} className="mt-6 inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 font-mono text-sm font-semibold text-ink transition hover:border-flame hover:text-flame dark:border-lineDark dark:text-paper dark:hover:border-flameDark dark:hover:text-flameDark">
            <Download className="h-4 w-4" />
            Export PDF
          </button>
        </div>

        <div>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
            <h2 id="ats-report-heading" className="font-display text-xl font-semibold">Score breakdown</h2>
            <p className="text-sm text-graphite dark:text-graphiteDark">Eight weighted categories</p>
          </div>
          <div className="mt-5 space-y-4">
            {breakdown.map((item) => {
              const tone = getScoreTone(item.score);
              return (
                <div key={item.label}>
                  <div className="mb-1.5 flex items-center justify-between gap-4 text-sm text-graphite dark:text-graphiteDark">
                    <span>{item.label}</span>
                    <span className={`font-mono font-semibold ${tone.textClass}`}>{item.score}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-line dark:bg-lineDark">
                    <div className={`h-full rounded-full transition-[width] duration-500 ${tone.barClass}`} style={{ width: `${item.score}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 border-t border-line pt-5 dark:border-lineDark">
            <h3 className="font-display font-semibold text-ink dark:text-paper">Recommended next steps</h3>
            <ul className="mt-3 grid gap-2 text-sm leading-relaxed text-graphite dark:text-graphiteDark">
              {recommendations.map((item) => <li key={item} className="flex gap-2"><span className="text-tealx dark:text-tealxDark">-</span><span>{item}</span></li>)}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
