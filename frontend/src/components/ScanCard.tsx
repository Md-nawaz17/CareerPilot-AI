import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface ScanLine {
  width: string;
  tag: string | null;
}

const LINES: ScanLine[] = [
  { width: '78%', tag: null },
  { width: '52%', tag: null },
  { width: '64%', tag: 'React' },
  { width: '71%', tag: null },
  { width: '45%', tag: 'TypeScript' },
  { width: '68%', tag: null },
  { width: '58%', tag: 'FastAPI' },
  { width: '73%', tag: null },
];

const TARGET_SCORE = 92;
const SCAN_DURATION_MS = 2600;
const CYCLE_GAP_MS = 1600;

export default function ScanCard() {
  const reduceMotion = useReducedMotion();
  const [score, setScore] = useState(reduceMotion ? TARGET_SCORE : 0);
  const [pass, setPass] = useState(1);

  useEffect(() => {
    if (reduceMotion) return;

    let frame: number;
    let timeout: ReturnType<typeof setTimeout>;

    const runScan = () => {
      setScore(0);
      const start = performance.now();

      const tick = (now: number) => {
        const elapsed = now - start;
        const progress = Math.min(1, elapsed / SCAN_DURATION_MS);
        setScore(Math.round(progress * TARGET_SCORE));
        if (progress < 1) {
          frame = requestAnimationFrame(tick);
        } else {
          timeout = setTimeout(() => {
            setPass((p) => p + 1);
            runScan();
          }, CYCLE_GAP_MS);
        }
      };

      frame = requestAnimationFrame(tick);
    };

    runScan();

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timeout);
    };
  }, [reduceMotion]);

  const cleared = score >= TARGET_SCORE;

  return (
    <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-ink p-6 shadow-xl dark:border dark:border-line dark:bg-paper dark:shadow-none">
      <div className="mb-5 flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-widest text-paper/50 dark:text-ink/50">
          ats_scan.tsx
        </span>
        <span className="font-mono text-[11px] text-paper/50 dark:text-ink/50">pass #{pass}</span>
      </div>

      <div className="relative space-y-3">
        {LINES.map((line, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="h-2 rounded-full bg-paper/15 dark:bg-ink/15" style={{ width: line.width }} />
            {line.tag && (
              <motion.span
                key={`${pass}-${i}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 * i, duration: 0.4 }}
                className="rounded-full bg-tealx/20 px-2 py-0.5 font-mono text-[10px] text-tealx dark:bg-tealxDark/20 dark:text-tealxDark"
              >
                {line.tag}
              </motion.span>
            )}
          </div>
        ))}

        {!reduceMotion && (
          <motion.div
            key={pass}
            initial={{ top: '0%' }}
            animate={{ top: '100%' }}
            transition={{ duration: SCAN_DURATION_MS / 1000, ease: 'linear' }}
            className="pointer-events-none absolute left-0 right-0 h-8 bg-gradient-to-b from-flame/0 via-flame/25 to-flame/0 dark:via-flameDark/25"
          />
        )}
      </div>

      <div className="mt-6 flex items-end justify-between border-t border-paper/10 pt-4 dark:border-ink/10">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-widest text-paper/50 dark:text-ink/50">
            ATS score
          </p>
          <p className="font-display text-4xl text-paper dark:text-ink">
            {score}
            <span className="text-xl text-paper/40 dark:text-ink/40">/100</span>
          </p>
        </div>
        {cleared && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotate: -8 }}
            animate={{ opacity: 1, scale: 1, rotate: -8 }}
            transition={{ duration: 0.3 }}
            className="rounded border-2 border-tealx px-3 py-1 font-mono text-xs font-bold uppercase tracking-widest text-tealx dark:border-tealxDark dark:text-tealxDark"
          >
            Cleared
          </motion.div>
        )}
      </div>
    </div>
  );
}
