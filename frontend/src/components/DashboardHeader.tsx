interface DashboardHeaderProps {
  score?: number | null;
}

export default function DashboardHeader({ score = null }: DashboardHeaderProps) {
  const displayScore = score ?? 0;

  return (
    <div className="rounded-2xl border border-line bg-paperRaised p-8 dark:border-lineDark dark:bg-inkRaised md:flex md:items-center md:justify-between md:gap-10">
      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-flame dark:text-flameDark">
          CareerPilot AI
        </p>
        <h1 className="mt-2 font-display text-3xl font-medium leading-tight tracking-tight text-ink dark:text-paper md:text-4xl">
          AI-powered resume intelligence and career readiness
        </h1>
        <p className="mt-3 max-w-xl text-graphite dark:text-graphiteDark">
          Upload a resume to receive an ATS score. Add a job description only
          when you want a targeted match or tailored cover letter.
        </p>
      </div>

      <div className="mt-6 shrink-0 rounded-xl border border-line bg-paper px-6 py-4 text-center dark:border-lineDark dark:bg-ink md:mt-0">
        <p className="font-mono text-[11px] uppercase tracking-widest text-graphite dark:text-graphiteDark">
          Current score
        </p>
        <p className="mt-1 font-mono text-3xl font-semibold text-tealx dark:text-tealxDark">
          {displayScore}
          <span className="text-lg text-graphite dark:text-graphiteDark">/100</span>
        </p>
      </div>
    </div>
  );
}
