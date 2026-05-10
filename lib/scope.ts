// Conversational scoping flow — asks a few questions and returns a recommendation.
// Pure function, no AI API needed for first pass — deterministic logic.

export type ScopeAnswer = { q: string; a: string };

export type ScopeQuestion = {
  id: string;
  question: string;
  options: { value: string; label: string; followUp?: string }[];
};

export const SCOPE_QUESTIONS: ScopeQuestion[] = [
  {
    id: 'goal',
    question: "What's the primary outcome you're trying to achieve?",
    options: [
      { value: 'launch', label: 'Launch a new product or business' },
      { value: 'replace', label: 'Replace an existing site or system' },
      { value: 'scale', label: 'Scale or modernise what we have' },
      { value: 'understand', label: 'Understand our data better' },
      { value: 'secure', label: 'Make sure we are secure' },
    ],
  },
  {
    id: 'users',
    question: 'Who are the primary users?',
    options: [
      { value: 'consumers', label: 'Everyday consumers' },
      { value: 'business', label: 'Other businesses (B2B)' },
      { value: 'internal', label: 'Our own team / internal tools' },
      { value: 'both', label: 'A mix of all of the above' },
    ],
  },
  {
    id: 'maturity',
    question: 'Where are you in the journey?',
    options: [
      { value: 'idea', label: 'Just an idea — nothing built yet' },
      { value: 'mvp', label: 'Have an MVP, need to level up' },
      { value: 'live', label: 'Live product with users' },
      { value: 'scaling', label: 'Established, looking to grow' },
    ],
  },
  {
    id: 'budget',
    question: "What's your investment range for this project?",
    options: [
      { value: 'small',  label: 'Under GHS 30,000' },
      { value: 'medium', label: 'GHS 30,000 – 100,000' },
      { value: 'large',  label: 'GHS 100,000 – 250,000' },
      { value: 'xlarge', label: 'GHS 250,000+' },
      { value: 'unsure', label: 'Not sure yet' },
    ],
  },
];

export type Recommendation = {
  primary: string;     // service slug
  also: string[];      // additional service slugs
  package: 'starter' | 'growth' | 'platform' | 'enterprise';
  estimateLow: number;
  estimateHigh: number;
  reasoning: string;
};

export function recommend(answers: Record<string, string>): Recommendation {
  const { goal, users, maturity, budget } = answers;

  // Pick primary service
  let primary = 'web-product';
  const also: string[] = [];

  if (goal === 'launch' && (users === 'business' || users === 'both')) {
    primary = 'saas';
  } else if (goal === 'launch') {
    primary = 'web-product';
  } else if (goal === 'replace') {
    primary = 'web-product';
  } else if (goal === 'scale') {
    primary = 'saas';
    also.push('data-analysis');
  } else if (goal === 'understand') {
    primary = 'data-analysis';
    if (maturity === 'scaling') also.push('machine-learning');
  } else if (goal === 'secure') {
    primary = 'penetration-testing';
    also.push('security-analysis');
  }

  // Auto-recommend security for live products
  if ((maturity === 'live' || maturity === 'scaling') && primary !== 'penetration-testing') {
    also.push('security-analysis');
  }

  // Package + estimate (in USD)
  let pkg: Recommendation['package'] = 'starter';
  let low = 1200;
  let high = 2500;

  if (budget === 'medium') { pkg = 'growth';     low = 2000;   high = 6000; }
  if (budget === 'large')  { pkg = 'platform';   low = 6000;   high = 15000; }
  if (budget === 'xlarge') { pkg = 'enterprise'; low = 15000;  high = 40000; }

  // SaaS bumps the floor
  if (primary === 'saas' && low < 4500) { low = 4500; high = Math.max(high, 12000); }

  const reasoning = buildReasoning(goal, users, maturity, primary, also);

  return { primary, also, package: pkg, estimateLow: low, estimateHigh: high, reasoning };
}

function buildReasoning(goal: string, users: string, maturity: string, primary: string, also: string[]) {
  const parts: string[] = [];
  if (goal === 'launch')   parts.push('Since you are launching something new,');
  if (goal === 'scale')    parts.push('Because you are scaling an existing business,');
  if (goal === 'understand') parts.push('To turn your data into decisions,');
  if (goal === 'secure')   parts.push('Given you need security assurance,');

  if (primary === 'saas')        parts.push('a SaaS platform build is the right primary scope.');
  if (primary === 'web-product') parts.push('a custom website with the right backend is the right starting point.');
  if (primary === 'data-analysis') parts.push('we recommend a data analysis engagement first.');
  if (primary === 'penetration-testing') parts.push('we recommend a penetration test on your live systems.');

  if (also.length > 0) {
    parts.push(`We would also pair it with ${also.join(' and ')} to cover the full picture.`);
  }
  return parts.join(' ');
}
