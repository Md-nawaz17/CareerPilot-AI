export type LocalAtsScore = {
  overallScore: number;
  breakdown: {
    contact_info: number;
    summary: number;
    experience: number;
    skills: number;
    education: number;
    projects: number;
    action_verbs: number;
    formatting: number;
  };
  reasons: string[];
};

const skillKeywords = [
  'javascript', 'typescript', 'react', 'node', 'python', 'django', 'flask', 'aws', 'azure', 'gcp',
  'sql', 'nosql', 'postgres', 'mysql', 'mongodb', 'graphql', 'rest', 'api', 'html', 'css', 'tailwind',
  'docker', 'kubernetes', 'git', 'ci/cd', 'linux', 'java', 'spring', 'c#', '.net', 'ml', 'ai', 'data', 'analytics',
  'testing', 'jest', 'pytest', 'terraform', 'ansible', 'spark', 'hadoop', 'jira', 'figma', 'ux', 'ui',
  'seo', 'marketing', 'salesforce', 'excel', 'power bi', 'tableau', 'leadership', 'management'
];

const actionVerbs = [
  'built', 'developed', 'designed', 'created', 'implemented', 'managed', 'improved',
  'led', 'delivered', 'deployed', 'optimized', 'automated', 'integrated', 'architected', 'engineered'
];

const normalizeText = (text: string) => text.toLowerCase().replace(/\s+/g, ' ').trim();

const hasSection = (text: string, patterns: string[]) => {
  const normalized = normalizeText(text);
  return patterns.some((pattern) => normalized.includes(pattern));
};

const countBulletPoints = (text: string) => {
  const lines = text.split(/\r?\n/);
  return lines.filter((line) => /^\s*[•\-*]\s+/.test(line)).length;
};

const countActionVerbsInBullets = (text: string) => {
  const lines = text.split(/\r?\n/).filter((line) => /^\s*[•\-*]\s+/.test(line));
  const normalized = lines.join(' ').toLowerCase();
  return actionVerbs.reduce((count, verb) => count + (normalized.includes(verb) ? 1 : 0), 0);
};

const countProjectMatches = (text: string) => hasSection(text, ['project', 'projects', 'portfolio']);

const countEducationMatches = (text: string) => hasSection(text, ['b.e.', 'b.tech', 'bachelor', 'master', 'mba', 'm.s.', 'm.tech', 'gpa', 'cgpa', 'degree', 'university', 'college']);

const countSummaryMatches = (text: string) => {
  const firstSegment = normalizeText(text.slice(0, 300));
  return ['summary', 'profile', 'objective', 'about'].some((keyword) => firstSegment.includes(keyword));
};

const extractContactInfo = (text: string) => {
  const lower = text.toLowerCase();
  const emailPattern = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
  const phonePattern = /(?:\+\d{1,3}[\s-]?)?(?:\(\d{2,4}\)|\d{2,4})[\s-]?\d{3,4}[\s-]?\d{3,4}/;
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const nameLine = lines[0] ?? '';
  const hasName = !!nameLine && /[A-Za-z]{2,}/.test(nameLine) && !emailPattern.test(nameLine) && !phonePattern.test(nameLine);
  const hasEmail = emailPattern.test(lower);
  const hasPhone = phonePattern.test(lower);
  return { hasName, hasEmail, hasPhone };
};

const countSkills = (text: string) => {
  const normalized = normalizeText(text);
  const matches = new Set<string>();
  skillKeywords.forEach((skill) => {
    const keyword = skill.replace(/[-+.]/g, '\\$&');
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    if (regex.test(normalized)) {
      matches.add(skill);
    }
  });
  return matches.size;
};

const hasTableMarkers = (text: string) => /\|.+\||\t/.test(text);

const specialCharacterRatio = (text: string) => {
  const total = text.length || 1;
  const special = (text.match(/[^\w\s.,;:'"()\[\]{}\-\/]/g) || []).length;
  return special / total;
};

export const scoreResumeOffline = (resumeText: string): LocalAtsScore => {
  const text = resumeText.trim();
  const contact = extractContactInfo(text);
  const bulletCount = countBulletPoints(text);
  const actionVerbCount = countActionVerbsInBullets(text);
  const skillsFound = countSkills(text);
  const hasSummary = countSummaryMatches(text);
  const hasEducation = countEducationMatches(text);
  const hasProjects = countProjectMatches(text);
  const formattingIssue = hasTableMarkers(text) || specialCharacterRatio(text) > 0.05;

  const contactScore = Math.min(15, (contact.hasName ? 5 : 0) + (contact.hasEmail ? 5 : 0) + (contact.hasPhone ? 5 : 0));
  const summaryScore = hasSummary ? 10 : 0;
  const experienceScore = Math.min(20, Math.max(0, Math.floor((bulletCount / 6) * 20)));
  const skillsScore = Math.min(15, Math.floor((skillsFound / 5) * 15));
  const educationScore = hasEducation ? 10 : 0;
  const projectsScore = hasProjects ? 10 : 0;
  const actionVerbsScore = Math.min(10, Math.floor((actionVerbCount / 6) * 10));
  const formattingScore = formattingIssue ? 0 : 10;

  const overallScore = contactScore + summaryScore + experienceScore + skillsScore + educationScore + projectsScore + actionVerbsScore + formattingScore;

  const reasons: string[] = [];
  if (!contact.hasEmail || !contact.hasPhone || !contact.hasName) {
    reasons.push('Include a clear name, email, and phone number in the top section.');
  }
  if (!hasSummary) reasons.push('Add a short summary or profile statement near the top.');
  if (bulletCount < 3) reasons.push('Use more bullet points under experience to improve readability.');
  if (skillsFound < 5) reasons.push('List at least 5 technical or role-specific skills in a dedicated skills section.');
  if (!hasEducation) reasons.push('Include your education section with degree or program details.');
  if (!hasProjects) reasons.push('Add a projects section highlighting relevant work.');
  if (actionVerbCount < 4) reasons.push('Use action verbs like built, developed, designed, or implemented in bullets.');
  if (formattingIssue) reasons.push('Avoid tables and excessive special characters in text-only resume content.');

  return {
    overallScore,
    breakdown: {
      contact_info: contactScore,
      summary: summaryScore,
      experience: experienceScore,
      skills: skillsScore,
      education: educationScore,
      projects: projectsScore,
      action_verbs: actionVerbsScore,
      formatting: formattingScore,
    },
    reasons,
  };
};
