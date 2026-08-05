import { motion } from 'framer-motion';
import { ArrowRight, FileScan, Target, PenLine, FileDown, WifiOff, History } from 'lucide-react';
import ScanCard from './ScanCard';
import ThemeToggle from './ThemeToggle';

const steps = [
  { n: '01', title: 'Upload your resume', desc: 'Drop a PDF, DOCX, or TXT file, or paste the text directly.' },
  { n: '02', title: 'Add a job description (optional)', desc: 'Use a target posting when you want a job match or tailored cover letter.' },
  { n: '03', title: 'Run the ATS scan', desc: 'Get a weighted score across contact info, skills, experience, and formatting.' },
  { n: '04', title: 'Check the job match', desc: "See keyword overlap, what's missing, and what to add before you apply." },
  { n: '05', title: 'Generate a cover letter', desc: 'A tailored draft built from your resume and the job description.' },
  { n: '06', title: 'Export your report', desc: 'Download a PDF summary and keep the last five scans in your history.' },
];

const features = [
  { icon: FileScan, title: 'ATS scoring', desc: 'Eight weighted categories, from contact details to measurable achievements.' },
  { icon: Target, title: 'Job matching', desc: 'Keyword overlap against any job description, with tailoring suggestions.' },
  { icon: PenLine, title: 'Cover letters', desc: 'AI-generated drafts with a local fallback when no provider key is set.' },
  { icon: FileDown, title: 'PDF export', desc: 'Turn any ATS report into a document you can save or share.' },
  { icon: WifiOff, title: 'Offline fallback', desc: 'Local heuristic scoring keeps working when the backend is unreachable.' },
  { icon: History, title: 'Scan history', desc: 'Your five most recent scans, saved in the browser.' },
];

const stack = ['React', 'TypeScript', 'Tailwind CSS', 'Framer Motion', 'FastAPI', 'pdf.js', 'mammoth', 'jsPDF'];

interface LandingPageProps {
  onLaunch: () => void;
}

export default function LandingPage({ onLaunch }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-paper text-ink dark:bg-ink dark:text-paper font-body">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <span className="font-display text-lg font-semibold">
          CareerPilot <span className="text-flame dark:text-flameDark">AI</span>
        </span>
        <div className="hidden md:flex gap-8 text-sm text-graphite dark:text-graphiteDark">
          <a href="#workflow" className="hover:text-ink dark:hover:text-paper">Workflow</a>
          <a href="#features" className="hover:text-ink dark:hover:text-paper">Features</a>
          <a href="#stack" className="hover:text-ink dark:hover:text-paper">Stack</a>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <button
            onClick={onLaunch}
            className="rounded-full bg-ink text-paper px-5 py-2 text-sm font-mono uppercase tracking-widest transition hover:opacity-95 dark:bg-paper dark:text-ink"
          >
            Launch app
          </button>
        </div>
      </nav>

      <section className="max-w-6xl mx-auto px-6 py-16 md:grid md:grid-cols-2 md:items-center md:gap-12">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <p className="text-flame font-mono text-xs uppercase tracking-wide mb-4">AI CAREER ASSISTANT</p>
          <h1 className="text-5xl font-display font-bold leading-tight mb-6">
            Get past the scanner.
            <br />
            Then get the offer.
          </h1>
          <p className="text-graphite dark:text-graphiteDark mb-8 max-w-md">
            Start with an ATS score from your resume alone, then add a job description when you want a targeted match or cover letter. Score, match, rewrite, and export in one pass.
          </p>
          <div className="flex items-center gap-6 mb-8">
            <button
              onClick={onLaunch}
              className="inline-flex items-center gap-2 rounded-full bg-flame text-paper px-6 py-3 text-sm font-semibold"
            >
              Analyze my resume <ArrowRight size={16} />
            </button>
            <a href="#workflow" className="text-sm font-mono text-graphite dark:text-graphiteDark">See how it works</a>
          </div>
          <div className="flex gap-6 text-xs text-graphite border-t pt-4">
            <span>8 scored categories</span>
            <span>PDF / DOCX / TXT</span>
            <span>Works offline</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mt-6 md:mt-0 flex justify-center md:justify-end"
        >
          {/* Use the existing ScanCard and animate it on mount to match app patterns */}
          <ScanCard />
        </motion.div>
      </section>

      <section id="workflow" className="max-w-6xl mx-auto px-6 py-16 border-t border-line dark:border-lineDark">
        <h2 className="text-3xl font-display font-bold mb-2">Six steps, one pass</h2>
        <p className="text-graphite dark:text-graphiteDark mb-10">Everything runs in a single session, no account required.</p>
        <div className="divide-y divide-line">
          {steps.map((s) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.45 }}
              className="grid grid-cols-[60px_260px_1fr] items-start gap-6 py-6"
            >
              <span className="text-flame font-mono text-sm">{s.n}</span>
              <h3 className="font-semibold">{s.title}</h3>
              <p className="text-graphite dark:text-graphiteDark text-sm">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="features" className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-display font-bold mb-10">What's under the hood</h2>
        <div className="grid md:grid-cols-3 gap-4 mb-12">
          {features.map((f) => (
            <div key={f.title} className="border rounded-xl p-5">
              <f.icon className="text-tealx mb-3" size={22} />
              <h3 className="font-semibold mb-1">{f.title}</h3>
              <p className="text-sm text-graphite dark:text-graphiteDark">{f.desc}</p>
            </div>
          ))}
        </div>

        <div id="stack" className="border-t pt-8">
          <p className="text-xs text-graphite dark:text-graphiteDark mb-3">BUILT WITH</p>
          <div className="flex flex-wrap gap-2">
            {stack.map((s) => (
              <span key={s} className="text-xs font-mono border rounded-full px-3 py-1">{s}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-ink dark:bg-paper text-white dark:text-ink text-center py-20 px-6">
        <h2 className="text-3xl font-bold mb-3">Ready to see your score?</h2>
        <p className="text-graphite dark:text-graphiteDark mb-8">No sign-up. Your resume never leaves the session unless you export it.</p>
        <button
          onClick={onLaunch}
          className="rounded-full bg-flame text-paper px-6 py-3 text-sm font-semibold inline-flex items-center gap-2"
        >
          Analyze my resume <ArrowRight size={16} />
        </button>
      </section>

      <footer className="max-w-6xl mx-auto px-6 py-6 flex justify-between text-xs text-graphite dark:text-graphiteDark">
        <span>CAREERPILOT AI</span>
        <span>RESUME ANALYSIS IS HEURISTIC. COVER LETTERS NEED A PROVIDER KEY.</span>
      </footer>
    </div>
  );
}
