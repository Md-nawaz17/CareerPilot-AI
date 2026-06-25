import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Briefcase,
  Brain,
  CheckCircle2,
  FileText,
  Sparkles,
  ShieldCheck,
  Target,
  UploadCloud,
} from 'lucide-react';
import { ChangeEvent, useMemo, useState } from 'react';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';

import { GlobalWorkerOptions } from 'pdfjs-dist';

GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

const features = [
  {
    title: 'Resume Upload & Parsing',
    description: 'Extract skills, experience, and achievements from PDFs and DOCX files with precision.',
    icon: FileText,
  },
  {
    title: 'ATS Intelligence',
    description: 'Measure ATS readiness, identify gaps, and improve match rates with AI guidance.',
    icon: Target,
  },
  {
    title: 'Career Insights',
    description: 'Track applications, interview readiness, and skill growth through a unified dashboard.',
    icon: BarChart3,
  },
];

type AnalysisResult = {
  atsScore: number;
  summary: string;
  skills: string[];
  suggestions: string[];
  strengthAreas: string[];
  preview: string;
  breakdown?: Array<{ name: string; points: number; reason: string }>;
  missingSkills?: string[];
  strengths?: string[];
  weaknesses?: string[];
};

const extractTextFromFile = async (file: File): Promise<string> => {
  const name = file.name.toLowerCase();
  if (name.endsWith('.pdf')) {
    const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
    const pages = [] as string[];
    for (let index = 1; index <= pdf.numPages; index += 1) {
      const page = await pdf.getPage(index);
      const textContent = await page.getTextContent();
      pages.push(textContent.items.map((item) => ('str' in item ? item.str : '')).join(' '));
    }
    return pages.join('\n');
  }

  if (name.endsWith('.docx')) {
    const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    return result.value;
  }

  return file.text();
};

const buildAnalysis = (resumeText: string, fileName: string): AnalysisResult => {
  const normalized = resumeText.toLowerCase();
  const skillKeywords = ['python', 'react', 'typescript', 'fastapi', 'aws', 'docker', 'postgresql', 'leadership', 'machine learning'];
  const detectedSkills = skillKeywords.filter((skill) => normalized.includes(skill));
  const sections = ['experience', 'education', 'skills', 'projects', 'certifications', 'summary'];
  const sectionScore = sections.filter((section) => normalized.includes(section)).length;
  const hasContact = normalized.includes('@') || normalized.includes('linkedin') || normalized.includes('github');
  const hasAction = ['built', 'led', 'shipped', 'delivered', 'developed', 'designed'].some((verb) => normalized.includes(verb));
  const hasMetrics = /\d/.test(normalized);
  const hasProjects = normalized.includes('project') || normalized.includes('projects');

  const atsScore = Math.min(100, 45 + Math.min(25, detectedSkills.length * 3) + Math.min(12, sectionScore * 2) + (hasContact ? 8 : 0) + (hasAction ? 5 : 0) + (hasMetrics ? 5 : 0) + (hasProjects ? 5 : 0));

  const strengthAreas = detectedSkills.slice(0, 3).length > 0 ? detectedSkills.slice(0, 3) : ['Communication', 'Ownership'];
  const suggestions = [
    'Add quantified impact to each role and project.',
    'Align section headers to ATS-friendly formats.',
    'Tailor keywords to the role and add relevant tools.',
  ];

  return {
    atsScore,
    summary: atsScore >= 75 ? 'This resume shows strong technical depth and clear hiring relevance.' : 'This profile is promising, and targeted improvements could significantly improve ATS performance.',
    skills: detectedSkills.length > 0 ? detectedSkills : ['Communication', 'Problem solving'],
    suggestions,
    strengthAreas,
    preview: `${fileName} • ${resumeText.slice(0, 180)}${resumeText.length > 180 ? '…' : ''}`,
    breakdown: [
      { name: 'Skills', points: Math.min(25, detectedSkills.length * 3), reason: 'Relevant technologies and tools are present.' },
      { name: 'Structure', points: Math.min(12, sectionScore * 2), reason: 'Useful resume sections improve readability and ATS parsing.' },
      { name: 'Contact details', points: hasContact ? 8 : 0, reason: 'Professional links and contact details improve recruiter trust.' },
      { name: 'Action verbs', points: hasAction ? 5 : 0, reason: 'Strong verbs demonstrate ownership and contribution.' },
      { name: 'Metrics', points: hasMetrics ? 5 : 0, reason: 'Quantified results strengthen credibility.' },
      { name: 'Projects', points: hasProjects ? 5 : 0, reason: 'Projects demonstrate applied experience.' },
    ],
    missingSkills: ['aws', 'docker', 'machine learning'].filter((skill) => !normalized.includes(skill)),
    strengths: ['Strong technical signal', 'Clear product-oriented background'].filter(() => atsScore >= 60),
    weaknesses: ['Resume impact statements could be made more specific'].filter(() => atsScore < 90),
  };
};

function App() {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [status, setStatus] = useState('Upload a resume to see ATS insights, detected skills, and improvement suggestions.');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) {
      return;
    }

    setError('');
    setIsAnalyzing(true);
    setStatus(`Analyzing ${selectedFile.name}…`);

    try {
      const text = await extractTextFromFile(selectedFile);
      const result = buildAnalysis(text, selectedFile.name);
      setAnalysis(result);
      setStatus('Analysis complete. Your resume is ready for review.');
    } catch (uploadError) {
      setError('We could not parse this file. Please try a plain text file or a standard PDF/DOCX resume.');
      setStatus('Upload failed.');
      console.error(uploadError);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const readinessSummary = useMemo(() => {
    if (!analysis) {
      return 'Insights will appear after upload';
    }
    return `${analysis.atsScore}% ATS readiness`;
  }, [analysis]);

  return (
    <div className="min-h-screen bg-transparent text-slate-100">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-8">
        <div className="text-xl font-semibold tracking-tight">CareerPilot AI</div>
        <nav className="hidden gap-6 text-sm text-slate-300 md:flex">
          <a href="#features" className="transition hover:text-white">Features</a>
          <a href="#get-started" className="transition hover:text-white">Analyzer</a>
          <a href="#results" className="transition hover:text-white">Results</a>
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-6 pb-16 lg:px-8">
        <section className="grid items-center gap-10 rounded-3xl border border-white/10 bg-white/10 p-8 shadow-2xl shadow-cyan-950/40 backdrop-blur-xl lg:grid-cols-[1.1fr_0.9fr] lg:p-12">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-sm text-cyan-200">
              <Sparkles size={16} /> AI-Powered Resume Analyzer & Career Assistant
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Upgrade your career story with intelligent AI guidance.
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-slate-300">
              CareerPilot AI helps professionals optimize resumes, improve ATS alignment, prepare for interviews, and build a measurable career roadmap.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <a href="#get-started" className="inline-flex items-center gap-2 rounded-full bg-cyan-500 px-5 py-3 font-medium text-slate-950 transition hover:bg-cyan-400">
                Start Analysis <ArrowRight size={18} />
              </a>
              <a href="#features" className="rounded-full border border-white/15 px-5 py-3 font-medium text-white transition hover:bg-white/10">
                Explore Platform
              </a>
            </div>
          </div>

          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="rounded-2xl border border-white/10 bg-slate-950/70 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Current readiness</p>
                <p className="text-3xl font-semibold">{readinessSummary}</p>
              </div>
              <div className="rounded-full bg-emerald-500/15 p-3 text-emerald-300">
                <ShieldCheck size={24} />
              </div>
            </div>
            <div className="mt-6 space-y-4">
              {['ATS optimization', 'Interview prep', 'Career roadmap'].map((item) => (
                <div key={item} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
                  <span>{item}</span>
                  <span className="text-cyan-300">Ready</span>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        <section id="get-started" className="mt-16 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur">
            <div className="mb-4 inline-flex rounded-xl bg-cyan-400/10 p-3 text-cyan-300">
              <UploadCloud size={20} />
            </div>
            <h2 className="text-2xl font-semibold">Upload your resume</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">Drop in a PDF, DOCX, or plain text resume to receive recruiter-ready feedback.</p>
            <label className="mt-6 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-cyan-400/35 bg-slate-950/40 px-6 py-10 text-center transition hover:border-cyan-300">
              <UploadCloud size={28} className="text-cyan-300" />
              <span className="mt-3 text-sm font-medium text-white">Choose a resume file</span>
              <span className="mt-2 text-xs text-slate-400">PDF, DOCX, or plain text</span>
              <input type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={handleUpload} />
            </label>
            <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/45 p-4">
              <label className="text-sm font-medium text-slate-200" htmlFor="jobDescription">Optional job description</label>
              <textarea id="jobDescription" value={jobDescription} onChange={(event) => setJobDescription(event.target.value)} rows={5} className="mt-3 w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 py-3 text-sm text-slate-100 outline-none ring-0" placeholder="Paste a target role to evaluate keyword and experience fit..." />
            </div>
            <p className="mt-4 text-sm text-slate-400">{status}</p>
            {error ? <p className="mt-3 flex items-center gap-2 text-sm text-rose-300"><AlertTriangle size={16} /> {error}</p> : null}
          </div>

          <div id="results" className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950 to-cyan-950/40 p-6 backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-cyan-400/10 p-3 text-cyan-300"><Brain size={18} /></div>
              <div>
                <p className="text-sm text-slate-400">Analysis result</p>
                <h3 className="text-xl font-semibold">Resume intelligence</h3>
              </div>
            </div>

            {isAnalyzing ? (
              <div className="mt-6 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-4 text-sm text-cyan-100">Scanning the document and generating a tailored report…</div>
            ) : analysis ? (
              <div className="mt-6 space-y-4">
                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-emerald-200">ATS score</p>
                      <p className="text-3xl font-semibold text-white">{analysis.atsScore}%</p>
                    </div>
                    <CheckCircle2 size={22} className="text-emerald-300" />
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm text-slate-400">Detected skills</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {analysis.skills.map((skill) => (
                        <span key={skill} className="rounded-full border border-cyan-400/25 bg-cyan-500/10 px-3 py-1 text-sm text-cyan-200">{skill}</span>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm text-slate-400">Strength areas</p>
                    <ul className="mt-3 space-y-2 text-sm text-slate-300">
                      {analysis.strengthAreas.map((area) => <li key={area} className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-300" /> {area}</li>)}
                    </ul>
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-slate-400">Summary</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{analysis.summary}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-slate-400">Score breakdown</p>
                  <div className="mt-3 space-y-2">
                    {analysis.breakdown?.map((item) => (
                      <div key={item.name} className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-200">{item.name}</span>
                          <span className="text-cyan-300">+{item.points}</span>
                        </div>
                        <p className="mt-1 text-xs text-slate-400">{item.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-slate-400">Improvement suggestions</p>
                  <ul className="mt-3 space-y-2 text-sm text-slate-300">
                    {analysis.suggestions.map((suggestion) => <li key={suggestion} className="flex items-start gap-2"><ArrowRight size={14} className="mt-1 text-cyan-300" /> {suggestion}</li>)}
                  </ul>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Preview</p>
                  <p className="mt-2 text-sm text-slate-300">{analysis.preview}</p>
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">No resume has been analyzed yet. Upload a file to see your ATS evaluation here.</div>
            )}
          </div>
        </section>

        <section id="features" className="mt-16 grid gap-6 md:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.article key={feature.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="rounded-2xl border border-white/10 bg-white/10 p-6 shadow-lg shadow-slate-950/20 backdrop-blur">
                <div className="mb-4 inline-flex rounded-xl bg-cyan-400/10 p-3 text-cyan-300">
                  <Icon size={20} />
                </div>
                <h3 className="text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">{feature.description}</p>
              </motion.article>
            );
          })}
        </section>

        <section className="mt-16 rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/10 to-slate-950 p-8 lg:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-200">Production-ready platform</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Built to scale from first resume upload to recruiter review.</h2>
            </div>
            <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/10 px-4 py-3 text-sm text-slate-200">
              <Briefcase size={18} /> Secure, modular, and deployment-ready architecture
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
