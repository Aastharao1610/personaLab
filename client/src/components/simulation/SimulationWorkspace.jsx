import { AnimatePresence, motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { useEffect, useMemo, useState } from 'react';
import { PersonaInterview } from './PersonaInterview.jsx';

const recommendationLabels = {
  READY_TO_LAUNCH: 'Ready to Launch',
  IMPROVE_BEFORE_LAUNCH: 'Launch After Fixes',
  HIGH_RISK: 'High-Risk Launch',
};

const launchScoreLabels = [
  ['80-100', 'Ready to Launch'],
  ['60-79', 'Launch After Fixes'],
  ['Below 60', 'High-Risk Launch'],
];

const scoreTone = (score = 0) => {
  if (score >= 80) {
    return {
      bg: 'bg-emerald-400',
      soft: 'bg-emerald-400/10 text-emerald-200 ring-emerald-300/20',
      gradient: 'from-emerald-300 via-teal-200 to-cyan-300',
    };
  }
  if (score >= 60) {
    return {
      bg: 'bg-amber-300',
      soft: 'bg-amber-300/10 text-amber-100 ring-amber-300/20',
      gradient: 'from-amber-200 via-yellow-200 to-orange-300',
    };
  }
  return {
    bg: 'bg-red-400',
    soft: 'bg-red-400/10 text-red-100 ring-red-300/20',
    gradient: 'from-red-300 via-rose-300 to-orange-300',
  };
};

const outcomeStyles = {
  CONVERTED: 'bg-emerald-400/10 text-emerald-200 ring-emerald-300/20',
  HESITATED: 'bg-amber-300/10 text-amber-100 ring-amber-300/20',
  ABANDONED: 'bg-red-400/10 text-red-100 ring-red-300/20',
  EXITED: 'bg-zinc-500/10 text-zinc-300 ring-zinc-400/20',
};

const priorityStyles = {
  High: 'bg-red-400/10 text-red-100 ring-red-300/20',
  Medium: 'bg-amber-300/10 text-amber-100 ring-amber-300/20',
  Low: 'bg-emerald-400/10 text-emerald-100 ring-emerald-300/20',
};

const overlayModes = [
  ['original', 'Original Screenshot'],
  ['heatmap', 'AI Attention Estimate'],
  ['friction', 'Friction Overlay'],
];

const heatmapStyles = {
  attention: {
    label: 'Attention',
    color: 'bg-emerald-300/24',
    ring: 'ring-emerald-200/70',
    glow: 'shadow-[0_0_52px_rgba(52,211,153,0.34)]',
    dot: 'bg-emerald-300',
  },
  hesitation: {
    label: 'Hesitation',
    color: 'bg-amber-300/24',
    ring: 'ring-amber-200/75',
    glow: 'shadow-[0_0_52px_rgba(252,211,77,0.32)]',
    dot: 'bg-amber-300',
  },
  friction: {
    label: 'Friction',
    color: 'bg-red-400/24',
    ring: 'ring-red-300/75',
    glow: 'shadow-[0_0_52px_rgba(248,113,113,0.32)]',
    dot: 'bg-red-400',
  },
  ignored: {
    label: 'Ignored',
    color: 'bg-zinc-300/18',
    ring: 'ring-zinc-200/55',
    glow: 'shadow-[0_0_44px_rgba(212,212,216,0.22)]',
    dot: 'bg-zinc-400',
  },
};

const formatLabel = (value = '') =>
  String(value)
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatConfidence = (confidence) => `${Math.round((confidence || 0) * 100)}%`;

const getInitials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'AI';

const getJourneyForPersona = (simulation, personaId) =>
  simulation?.personaJourneys?.find((journey) => journey.personaId === personaId);

const compactFileName = (fileName = '') => fileName.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ');

const getWebsiteName = (session) =>
  session.productUnderstanding?.productName ||
  session.productUnderstanding?.websiteName ||
  session.productUnderstanding?.productType ||
  compactFileName(session.fileName) ||
  'Analyzed Website';

const getHeroSummary = (session) =>
  session.insights?.weaknesses?.[0] ||
  session.insights?.frictionPoints?.[0] ||
  session.productUnderstanding?.potentialUXProblems?.[0] ||
  session.productUnderstanding?.primaryGoal ||
  'PersonaLab generated a launch-readiness report for this product surface.';

const getLaunchStatus = (score = 0) => {
  if (score >= 80) return 'Ready to Launch';
  if (score >= 60) return 'Launch After Fixes';
  return 'High-Risk Launch';
};

const getMainBlocker = (session) =>
  session.insights?.frictionPoints?.[0] ||
  session.insights?.weaknesses?.[0] ||
  session.productUnderstanding?.potentialUXProblems?.[0] ||
  'No dominant blocker was returned by the analysis.';

const getHighestImpactFix = (session) =>
  session.insights?.uxRecommendations?.find((item) => item.priority === 'High') ||
  session.insights?.uxRecommendations?.[0] ||
  null;

const getReportConfidence = (session) =>
  session.simulation?.summary?.averageConfidence ??
  session.productUnderstanding?.confidence ??
  0;

const getOutcomeCounts = (simulation) => ({
  converted: simulation?.summary?.converted || 0,
  hesitated: simulation?.summary?.hesitated || 0,
  abandoned: simulation?.summary?.abandoned || 0,
  exited: simulation?.summary?.exited || 0,
  total: simulation?.summary?.totalPersonas || 0,
});

const getExpectedImpact = (recommendation) => {
  if (recommendation.priority === 'High') return 'Can materially improve conversion confidence.';
  if (recommendation.priority === 'Medium') return 'Can reduce hesitation in the main journey.';
  return 'Can polish the experience for edge-case users.';
};

const truncate = (value = '', max = 120) =>
  value.length > max ? `${value.slice(0, max - 1).trim()}...` : value;

const circledNumber = (index) => ['①', '②', '③', '④', '⑤', '⑥'][index] || String(index + 1);

const includesAny = (value = '', terms = []) => {
  const normalizedValue = value.toLowerCase();
  return terms.some((term) => normalizedValue.includes(term));
};

const getRecommendationText = (recommendation) =>
  [recommendation?.recommendation, recommendation?.rationale].filter(Boolean).join(' ');

const findMatchingRecommendation = (recommendations = [], sourceText = '') => {
  const normalizedSource = sourceText.toLowerCase();
  const terms = normalizedSource
    .split(/[^a-z0-9]+/)
    .filter((term) => term.length > 4);

  return recommendations.find((recommendation) => {
    const recommendationText = getRecommendationText(recommendation).toLowerCase();
    return terms.some((term) => recommendationText.includes(term));
  }) || recommendations[0];
};

const highestFrictionJourneyStep = (simulation) =>
  (simulation?.personaJourneys || [])
    .flatMap((journey) => journey.steps || [])
    .sort((first, second) => (second.friction || 0) - (first.friction || 0))[0];

const buildDerivedOverlay = (session) => {
  const productUnderstanding = session.productUnderstanding || {};
  const insights = session.insights || {};
  const recommendations = insights.uxRecommendations || [];
  const frictionPoints = insights.frictionPoints || [];
  const weaknesses = insights.weaknesses || [];
  const topFrictionStep = highestFrictionJourneyStep(session.simulation);
  const regions = [];

  if (productUnderstanding.navigationStructure?.length) {
    regions.push({
      id: 'navigation-attention',
      type: 'attention',
      label: 'Navigation scanned',
      evidence: `${productUnderstanding.navigationStructure.length} navigation items identified by Product Understanding.`,
      x: 0.04,
      y: 0.04,
      width: 0.92,
      height: 0.12,
    });
  }

  if (productUnderstanding.mainCTA) {
    regions.push({
      id: 'main-cta-attention',
      type: 'attention',
      label: productUnderstanding.mainCTA,
      evidence: 'Product Understanding identified this as the primary CTA.',
      x: 0.08,
      y: 0.23,
      width: 0.34,
      height: 0.16,
    });
  }

  const hesitationEvidence = frictionPoints[0] || topFrictionStep?.observation;
  if (hesitationEvidence) {
    regions.push({
      id: 'top-hesitation',
      type: 'hesitation',
      label: truncate(frictionPoints[0] || topFrictionStep.action || 'User hesitation', 54),
      evidence: hesitationEvidence,
      x: 0.44,
      y: 0.28,
      width: 0.34,
      height: 0.2,
    });
  }

  const highPriority = recommendations.find((item) => item.priority === 'High') || recommendations[0];
  if (highPriority) {
    regions.push({
      id: 'recommendation-friction',
      type: 'friction',
      label: truncate(highPriority.recommendation, 54),
      evidence: highPriority.rationale,
      x: 0.5,
      y: 0.54,
      width: 0.36,
      height: 0.18,
    });
  }

  const trustText = [...weaknesses, ...recommendations.map(getRecommendationText)].join(' ');
  if (includesAny(trustText, ['trust', 'proof', 'testimonial', 'credibility', 'security'])) {
    regions.push({
      id: 'trust-friction',
      type: 'friction',
      label: 'Trust signal gap',
      evidence: weaknesses.find((item) => includesAny(item, ['trust', 'proof', 'credibility'])) ||
        highPriority?.rationale ||
        'Engine 4 identified a trust-related improvement.',
      x: 0.1,
      y: 0.62,
      width: 0.34,
      height: 0.18,
    });
  } else if (productUnderstanding.trustSignals?.length) {
    regions.push({
      id: 'trust-attention',
      type: 'attention',
      label: 'Trust signals present',
      evidence: productUnderstanding.trustSignals.slice(0, 3).join(', '),
      x: 0.1,
      y: 0.62,
      width: 0.34,
      height: 0.18,
    });
  }

  if (productUnderstanding.secondaryCTA || productUnderstanding.forms?.length) {
    regions.push({
      id: 'secondary-ignored',
      type: 'ignored',
      label: productUnderstanding.secondaryCTA || 'Secondary interaction',
      evidence: productUnderstanding.secondaryCTA
        ? 'Product Understanding found a secondary CTA; no direct attention evidence was returned.'
        : 'Forms were detected; no direct attention evidence was returned.',
      x: 0.62,
      y: 0.18,
      width: 0.26,
      height: 0.14,
    });
  }

  const pinSources = [
    ...frictionPoints,
    ...weaknesses,
    ...recommendations.map((item) => item.recommendation),
  ]
    .filter(Boolean)
    .filter((item, index, array) => array.indexOf(item) === index)
    .slice(0, 4);

  const pinPositions = [
    { x: 64, y: 34 },
    { x: 31, y: 48 },
    { x: 72, y: 62 },
    { x: 22, y: 70 },
  ];

  const pins = pinSources.map((source, index) => ({
    id: `pin-${index}`,
    number: index + 1,
    label: truncate(source, 42),
    evidence: source,
    recommendation: findMatchingRecommendation(recommendations, source),
    ...pinPositions[index],
  }));

  return { regions, pins };
};

function SectionHeading({ eyebrow, title, action }) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">{eyebrow}</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-normal text-white sm:text-3xl">
          {title}
        </h2>
      </div>
      {action}
    </div>
  );
}

SectionHeading.propTypes = {
  eyebrow: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  action: PropTypes.node,
};

function RunHeader({ onRunAgain }) {
  return (
    <header className="flex h-14 items-center justify-between">
      <a href="#" className="flex items-center gap-3" aria-label="PersonaLab home">
        <span className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white text-sm font-semibold text-black shadow-lg shadow-white/10">
          P
        </span>
        <span className="text-sm font-medium text-white">PersonaLab</span>
      </a>
      <button
        type="button"
        onClick={onRunAgain}
        className="h-10 rounded-lg border border-white/10 bg-white/[0.04] px-4 text-sm font-medium text-zinc-200 shadow-lg shadow-black/20 transition hover:border-white/20 hover:bg-white/[0.08]"
      >
        Run Again
      </button>
    </header>
  );
}

RunHeader.propTypes = {
  onRunAgain: PropTypes.func.isRequired,
};

function HeroSummary({ session }) {
  const insights = session.insights || {};
  const productUnderstanding = session.productUnderstanding || {};
  const score = insights.launchScore || 0;
  const tone = scoreTone(score);
  const mainBlocker = getMainBlocker(session);
  const highestImpactFix = getHighestImpactFix(session);
  const confidence = formatConfidence(getReportConfidence(session));
  const launchStatus = recommendationLabels[insights.recommendation] || getLaunchStatus(score);

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0b0b0d] p-6 shadow-2xl shadow-black/40 sm:p-8 lg:p-10"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(34,211,238,0.18),transparent_28rem),radial-gradient(circle_at_85%_10%,rgba(250,204,21,0.12),transparent_24rem)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />

      <div className="relative grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-medium text-zinc-300">
              {formatLabel(productUnderstanding.pageIntent || 'Website')}
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-medium text-zinc-300">
              {productUnderstanding.industry || 'Industry unknown'}
            </span>
            <span className="rounded-full border border-cyan-300/15 bg-cyan-300/10 px-3 py-1 text-xs font-medium text-cyan-100">
              Derived from AI-simulated user journeys
            </span>
          </div>

          <p className="mt-7 text-xs font-medium uppercase tracking-[0.22em] text-zinc-500">
            PersonaLab Verdict
          </p>
          <h1 className="mt-3 max-w-4xl text-4xl font-semibold tracking-normal text-white sm:text-5xl lg:text-6xl">
            {launchStatus}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-500">
            {getWebsiteName(session)} · Predictive pre-launch UX simulation, not real visitor analytics.
          </p>

          <div className="mt-8 grid gap-3 lg:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-black/25 p-4 backdrop-blur">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
                Main Blocker
              </p>
              <p className="mt-2 text-lg leading-7 text-white">{mainBlocker}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/25 p-4 backdrop-blur">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
                Highest Impact Fix
              </p>
              <p className="mt-2 text-lg leading-7 text-white">
                {highestImpactFix?.recommendation || 'No ranked fix was returned.'}
              </p>
            </div>
          </div>

          <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.035] p-4">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
              Evidence Summary
            </p>
            <p className="mt-2 text-sm leading-6 text-zinc-300">
              {highestImpactFix?.rationale || getHeroSummary(session)}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/30 backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-zinc-400">Launch Score</p>
              <p className="mt-1 text-xs text-zinc-500">Confidence {confidence}</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${tone.soft}`}>
              {launchStatus}
            </span>
          </div>
          <div className="mt-3 flex items-end gap-2">
            <span className={`bg-gradient-to-r ${tone.gradient} bg-clip-text text-6xl font-semibold tracking-normal text-transparent`}>
              {score}
            </span>
            <span className="pb-2 text-xl font-medium text-zinc-500">/ 100</span>
          </div>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/[0.09]">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(3, score)}%` }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className={`h-full rounded-full ${tone.bg}`}
            />
          </div>
          <div className="mt-5 space-y-2">
            {launchScoreLabels.map(([range, label]) => (
              <div key={range} className="flex items-center justify-between gap-3 text-xs">
                <span className="text-zinc-500">{range}</span>
                <span className={label === launchStatus ? 'font-semibold text-white' : 'text-zinc-400'}>
                  {label}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-xl border border-white/10 bg-black/25 p-3">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">
              Score combines
            </p>
            <p className="mt-2 text-xs leading-5 text-zinc-400">
              Persona outcomes, UX friction, trust signals, motivation, navigation, and recommendation severity.
            </p>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

HeroSummary.propTypes = {
  session: PropTypes.object.isRequired,
};

function InsightCard({ icon, title, items, index }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.34, delay: index * 0.05 }}
      className="group rounded-2xl border border-white/10 bg-white/[0.045] p-5 shadow-xl shadow-black/20 transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.065]"
    >
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.07] text-lg font-semibold text-white">
          {icon}
        </span>
        <h3 className="text-base font-semibold text-white">{title}</h3>
      </div>
      <ul className="mt-5 space-y-3">
        {(items.length ? items : ['No signal returned.']).slice(0, 3).map((item) => (
          <li key={item} className="flex gap-3 text-sm leading-6 text-zinc-300">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-white/45" />
            <span>{truncate(item, 105)}</span>
          </li>
        ))}
      </ul>
    </motion.article>
  );
}

InsightCard.propTypes = {
  icon: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  items: PropTypes.arrayOf(PropTypes.string).isRequired,
  index: PropTypes.number.isRequired,
};

function TopInsights({ insights, simulation }) {
  const cards = [
    {
      icon: '+',
      title: 'Positive Signals',
      items: insights?.strengths || [],
    },
    {
      icon: '!',
      title: 'Top Friction',
      items: insights?.frictionPoints || simulation?.summary?.topFrictionPoints || [],
    },
    {
      icon: '1',
      title: 'Highest Priority Fix',
      items: [
        insights?.uxRecommendations?.find((item) => item.priority === 'High')?.recommendation ||
          insights?.uxRecommendations?.[0]?.recommendation,
        insights?.weaknesses?.[0],
      ].filter(Boolean),
    },
  ];

  return (
    <section>
      <SectionHeading eyebrow="Evidence Summary" title="What happened and why" />
      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((card, index) => (
          <InsightCard key={card.title} {...card} index={index} />
        ))}
      </div>
    </section>
  );
}

TopInsights.propTypes = {
  insights: PropTypes.object,
  simulation: PropTypes.object,
};

function PersonaSummaryCard({ persona, journey, insight, index, onSelect }) {
  const outcome = journey?.outcome || insight?.outcome || 'EXITED';
  const confidence = journey?.confidence ?? insight?.confidence ?? persona.confidence;
  const finalReason =
    insight?.summary ||
    journey?.steps?.at(-1)?.reason ||
    persona.expectedJourney ||
    'No final reasoning returned.';

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.34, delay: index * 0.04 }}
      role="button"
      tabIndex={0}
      aria-label={`Open journey details for ${persona.name}`}
      onClick={() => onSelect({ persona, journey, insight })}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect({ persona, journey, insight });
        }
      }}
      className="cursor-pointer rounded-2xl border border-white/10 bg-[#0b0b0d] p-5 shadow-xl shadow-black/20 transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.055]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white text-sm font-semibold text-black">
            {getInitials(persona.name)}
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-white">{persona.name}</h3>
            <p className="mt-1 truncate text-sm text-zinc-500">{persona.occupation}</p>
          </div>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${outcomeStyles[outcome] || outcomeStyles.EXITED}`}>
          {formatLabel(outcome)}
        </span>
      </div>

      <div className="mt-5 grid gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">Goal</p>
          <p className="mt-1 text-sm leading-6 text-zinc-300">{truncate(persona.primaryGoal, 88)}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
            <p className="text-xs text-zinc-500">Final Outcome</p>
            <p className="mt-1 text-sm font-medium text-zinc-100">{formatLabel(outcome)}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
            <p className="text-xs text-zinc-500">Reason</p>
            <p className="mt-1 text-sm leading-5 text-zinc-300">{truncate(finalReason, 92)}</p>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-zinc-500">Simulation confidence</span>
          <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-xs font-medium text-zinc-300">
            {formatConfidence(confidence)}
          </span>
        </div>
      </div>
    </motion.article>
  );
}

PersonaSummaryCard.propTypes = {
  persona: PropTypes.object.isRequired,
  journey: PropTypes.object,
  insight: PropTypes.object,
  index: PropTypes.number.isRequired,
  onSelect: PropTypes.func.isRequired,
};

function PersonaSummary({ personas, simulation, insights, onSelectPersona }) {
  const outcomes = getOutcomeCounts(simulation);

  return (
    <section>
      <SectionHeading
        eyebrow="Simulated Users"
        title="Business outcome by user type"
        action={
          <div className="flex flex-wrap gap-2">
            {[
              ['Simulated', outcomes.total || personas.length, 'text-zinc-300'],
              ['Converted', outcomes.converted, 'text-emerald-200'],
              ['Hesitated', outcomes.hesitated, 'text-amber-100'],
              ['Abandoned', outcomes.abandoned, 'text-red-100'],
              ['Exited', outcomes.exited, 'text-zinc-300'],
            ].map(([label, value, color]) => (
              <span
                key={label}
                className={`rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm ${color}`}
              >
                {label}: {value}
              </span>
            ))}
          </div>
        }
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {personas.map((persona, index) => {
          const journey = getJourneyForPersona(simulation, persona.id);
          const insight = insights?.personaSummary?.find((item) => item.personaId === persona.id);

          return (
            <PersonaSummaryCard
              key={persona.id}
              persona={persona}
              journey={journey}
              insight={insight}
              index={index}
              onSelect={onSelectPersona}
            />
          );
        })}
      </div>
    </section>
  );
}

PersonaSummary.propTypes = {
  personas: PropTypes.arrayOf(PropTypes.object).isRequired,
  simulation: PropTypes.object,
  insights: PropTypes.object,
  onSelectPersona: PropTypes.func.isRequired,
};

function RecommendationCard({ item, index }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.34, delay: index * 0.04 }}
      className="rounded-2xl border border-white/10 bg-[#0b0b0d] p-5 shadow-xl shadow-black/20 transition hover:-translate-y-0.5 hover:border-white/20"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${priorityStyles[item.priority] || priorityStyles.Low}`}>
          {item.priority}
        </span>
        <span className="text-sm font-semibold text-zinc-500">#{index + 1}</span>
      </div>
      <h3 className="mt-4 text-lg font-semibold text-white">{item.recommendation}</h3>
      <p className="mt-3 text-sm leading-6 text-zinc-400">{item.rationale}</p>
      <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.035] p-3">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">
          Expected UX Impact
        </p>
        <p className="mt-2 text-sm text-zinc-200">{getExpectedImpact(item)}</p>
      </div>
    </motion.article>
  );
}

RecommendationCard.propTypes = {
  item: PropTypes.shape({
    priority: PropTypes.string.isRequired,
    recommendation: PropTypes.string.isRequired,
    rationale: PropTypes.string.isRequired,
  }).isRequired,
  index: PropTypes.number.isRequired,
};

function RecommendedImprovements({ recommendations }) {
  const priorityOrder = { High: 0, Medium: 1, Low: 2 };
  const ranked = [...(recommendations || [])].sort(
    (first, second) => (priorityOrder[first.priority] ?? 3) - (priorityOrder[second.priority] ?? 3),
  );

  return (
    <section>
      <SectionHeading eyebrow="Highest Impact Fixes" title="Ranked by launch impact" />
      <div className="grid gap-4 lg:grid-cols-3">
        {ranked.map((item, index) => (
          <RecommendationCard
            key={`${item.priority}-${item.recommendation}`}
            item={item}
            index={index}
          />
        ))}
      </div>
    </section>
  );
}

RecommendedImprovements.propTypes = {
  recommendations: PropTypes.arrayOf(PropTypes.object),
};

function DetailBlock({ title, children }) {
  return (
    <details className="group rounded-2xl border border-white/10 bg-white/[0.035] p-4 open:bg-white/[0.055]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-white">
        {title}
        <span className="grid h-7 w-7 place-items-center rounded-full border border-white/10 text-zinc-400 transition group-open:rotate-45">
          +
        </span>
      </summary>
      <div className="mt-4 text-sm leading-6 text-zinc-400">{children}</div>
    </details>
  );
}

DetailBlock.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

function DetailList({ values }) {
  if (!values?.length) {
    return <p>None returned.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {values.map((value) => (
        <span key={value} className="rounded-full bg-white/[0.06] px-3 py-1 text-zinc-300">
          {value}
        </span>
      ))}
    </div>
  );
}

DetailList.propTypes = {
  values: PropTypes.arrayOf(PropTypes.string),
};

function DetailedAnalysis({ productUnderstanding, insights, personas }) {
  const personaAccessibility = personas.flatMap((persona) => persona.accessibilityNeeds || []);

  return (
    <section>
      <SectionHeading eyebrow="Detailed Analysis" title="Advanced report" />
      <div className="space-y-3">
        <DetailBlock title="Product Understanding">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['Intent', formatLabel(productUnderstanding?.pageIntent || 'Other')],
              ['Product Type', productUnderstanding?.productType],
              ['Audience', productUnderstanding?.targetAudience],
              ['Primary CTA', productUnderstanding?.mainCTA],
              ['Secondary CTA', productUnderstanding?.secondaryCTA],
              ['Pricing', productUnderstanding?.pricingVisible ? 'Visible' : 'Not visible'],
              ['Checkout', productUnderstanding?.checkoutDetected ? 'Detected' : 'Not detected'],
              ['Confidence', formatConfidence(productUnderstanding?.confidence)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-white/10 bg-black/20 p-3">
                <p className="text-xs text-zinc-500">{label}</p>
                <p className="mt-1 text-sm font-medium text-zinc-200">{value || 'None'}</p>
              </div>
            ))}
          </div>
        </DetailBlock>
        <DetailBlock title="Navigation">
          <DetailList values={productUnderstanding?.navigationStructure} />
        </DetailBlock>
        <DetailBlock title="Trust Signals">
          <DetailList values={productUnderstanding?.trustSignals} />
        </DetailBlock>
        <DetailBlock title="Forms">
          <DetailList values={productUnderstanding?.forms} />
        </DetailBlock>
        <DetailBlock title="Accessibility">
          <DetailList values={[...new Set(personaAccessibility)]} />
        </DetailBlock>
        <DetailBlock title="Potential Problems">
          <DetailList values={[...(productUnderstanding?.potentialUXProblems || []), ...(insights?.weaknesses || [])]} />
        </DetailBlock>
        <DetailBlock title="Technical Details">
          <DetailList
            values={[
              `Personas: ${personas.length}`,
              `Recommendations: ${insights?.uxRecommendations?.length || 0}`,
              `Friction points: ${insights?.frictionPoints?.length || 0}`,
            ]}
          />
        </DetailBlock>
      </div>
    </section>
  );
}

DetailedAnalysis.propTypes = {
  productUnderstanding: PropTypes.object,
  insights: PropTypes.object,
  personas: PropTypes.arrayOf(PropTypes.object).isRequired,
};

function SourcePreview({ session }) {
  const [overlayMode, setOverlayMode] = useState('original');
  const overlay = useMemo(() => buildDerivedOverlay(session), [session]);
  const [selectedPin, setSelectedPin] = useState(overlay.pins[0] || null);

  if (!session.screenshotUrl) {
    return (
      <aside className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 shadow-xl shadow-black/20">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-white">Source Website</p>
            <p className="mt-1 break-all text-sm text-zinc-400">
              {session.sourceUrl || session.fileName || 'Website URL'}
            </p>
          </div>
          <span className="w-fit rounded-full bg-white/[0.06] px-3 py-1 text-xs text-zinc-400">
            Captured screenshot
          </span>
        </div>
      </aside>
    );
  }

  return (
    <aside className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 shadow-xl shadow-black/20">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
            AI Attention Estimate
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-normal text-white">
            Visual evidence on the analyzed screen
          </h2>
          <p className="mt-1 max-w-md truncate text-xs text-zinc-500">
            Derived from AI-simulated journeys. Not real visitor analytics.
          </p>
        </div>
        <div className="grid gap-2 rounded-xl border border-white/10 bg-black/35 p-1 sm:grid-cols-3">
          {overlayModes.map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={overlayMode === value}
              onClick={() => {
                setOverlayMode(value);
                if (value === 'friction') {
                  setSelectedPin(overlay.pins[0] || null);
                }
              }}
              className={`h-10 rounded-lg px-3 text-sm font-medium transition ${
                overlayMode === value
                  ? 'bg-white text-black shadow-lg shadow-white/10'
                  : 'text-zinc-400 hover:bg-white/[0.06] hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black">
        <div className="relative">
          <img
            src={session.screenshotUrl}
            alt="Uploaded product screenshot"
            className="block max-h-[54rem] w-full object-contain"
          />

          <AnimatePresence mode="wait">
            {overlayMode !== 'original' ? (
              <motion.div
                key={overlayMode}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.28, ease: 'easeOut' }}
                className="absolute inset-0"
              >
                {overlay.regions
                  .filter((region) =>
                    overlayMode === 'heatmap'
                      ? true
                      : ['friction', 'hesitation', 'ignored'].includes(region.type))
                  .map((region, index) => {
                    const style = heatmapStyles[region.type];

                    return (
                      <motion.div
                        key={region.id}
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.34, delay: index * 0.04, ease: 'easeOut' }}
                        className={`absolute rounded-2xl ring-2 ${style.ring} ${style.color} ${style.glow}`}
                        style={{
                          left: `${region.x * 100}%`,
                          top: `${region.y * 100}%`,
                          width: `${region.width * 100}%`,
                          height: `${region.height * 100}%`,
                        }}
                      >
                        <div className="absolute -top-9 left-0 hidden max-w-64 rounded-lg border border-white/10 bg-black/80 px-2.5 py-1.5 text-xs text-white shadow-xl backdrop-blur lg:block">
                          {style.label}: {region.label}
                        </div>
                      </motion.div>
                    );
                  })}

                {overlayMode === 'friction'
                  ? overlay.pins.map((pin, index) => (
                    <motion.button
                      key={pin.id}
                      type="button"
                      initial={{ opacity: 0, y: 8, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.28, delay: index * 0.05, ease: 'easeOut' }}
                      onClick={() => setSelectedPin(pin)}
                      aria-pressed={selectedPin?.id === pin.id}
                      className={`absolute z-20 grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border text-sm font-semibold shadow-2xl transition hover:scale-110 ${
                        selectedPin?.id === pin.id
                          ? 'border-white bg-white text-black shadow-white/20'
                          : 'border-red-200/70 bg-red-400 text-white shadow-red-500/30'
                      }`}
                      style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                      aria-label={`Open recommendation ${pin.number}: ${pin.label}`}
                    >
                      {circledNumber(index)}
                    </motion.button>
                  ))
                  : null}

                <div className="absolute right-3 top-3 rounded-xl border border-white/10 bg-black/75 p-3 shadow-2xl backdrop-blur">
                  <div className="grid gap-2 text-xs text-zinc-300 sm:grid-cols-2">
                    {[
                      ['attention', 'Green = Attention'],
                      ['hesitation', 'Yellow = Hesitation'],
                      ['friction', 'Red = Friction'],
                      ['ignored', 'Gray = Ignored'],
                    ].map(([type, label]) => (
                      <div key={type} className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${heatmapStyles[type].dot}`} />
                        <span>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {overlayMode === 'friction' && selectedPin ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="absolute bottom-3 left-3 right-3 z-30 rounded-2xl border border-white/10 bg-black/82 p-4 shadow-2xl backdrop-blur-xl lg:left-auto lg:w-[24rem]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">
                          Pin {selectedPin.number}
                        </p>
                        <h3 className="mt-1 text-base font-semibold text-white">
                          {selectedPin.label}
                        </h3>
                      </div>
                      <span className="rounded-full bg-red-400/15 px-2.5 py-1 text-xs font-medium text-red-100 ring-1 ring-red-300/20">
                        Friction
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-zinc-400">
                      {selectedPin.recommendation?.recommendation || selectedPin.evidence}
                    </p>
                    {selectedPin.recommendation?.rationale ? (
                      <p className="mt-2 text-xs leading-5 text-zinc-500">
                        {selectedPin.recommendation.rationale}
                      </p>
                    ) : null}
                  </motion.div>
                ) : null}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_22rem]">
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="text-sm font-semibold text-white">Derived overlay basis</p>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            Approximate regions are derived from existing product understanding,
            simulated journey friction, and launch recommendations. Exact eye-tracking
            coordinates were not returned by the analysis pipeline.
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="text-sm font-semibold text-white">Friction Pins</p>
          <p className="mt-2 text-sm text-zinc-500">
            {overlay.pins.length
              ? `${overlay.pins.length} recommendation-linked pins available.`
              : 'No friction pins available from the existing output.'}
          </p>
        </div>
      </div>
    </aside>
  );
}

SourcePreview.propTypes = {
  session: PropTypes.shape({
    fileName: PropTypes.string,
    screenshotUrl: PropTypes.string,
    sourceUrl: PropTypes.string,
  }).isRequired,
};

export function SimulationWorkspace({ session, onRunAgain }) {
  const [selectedPersona, setSelectedPersona] = useState(null);
  const personas = useMemo(() => session.personas || [], [session.personas]);

  useEffect(() => {
    const screenshotUrl = session.screenshotUrl;

    return () => {
      if (screenshotUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(screenshotUrl);
      }
    };
  }, [session.screenshotUrl]);

  return (
    <main className="min-h-screen overflow-hidden bg-[#050505] px-4 pb-16 text-white sm:px-6 lg:px-8">
      <div className="absolute inset-x-0 top-0 -z-10 h-[36rem] bg-[radial-gradient(circle_at_30%_0%,rgba(45,212,191,0.16),transparent_30rem),radial-gradient(circle_at_80%_10%,rgba(251,191,36,0.11),transparent_24rem)]" />
      <div className="mx-auto max-w-7xl">
        <RunHeader onRunAgain={onRunAgain} />

        <div className="space-y-10 pt-4">
          <HeroSummary session={session} />
          <SourcePreview session={session} />
          <TopInsights insights={session.insights} simulation={session.simulation} />
          <PersonaSummary
            personas={personas}
            simulation={session.simulation}
            insights={session.insights}
            onSelectPersona={setSelectedPersona}
          />
          <RecommendedImprovements recommendations={session.insights?.uxRecommendations} />
          <DetailedAnalysis
            productUnderstanding={session.productUnderstanding}
            insights={session.insights}
            personas={personas}
          />
        </div>
      </div>

      <AnimatePresence>
        {selectedPersona ? (
          <PersonaInterview
            persona={selectedPersona}
            onClose={() => setSelectedPersona(null)}
          />
        ) : null}
      </AnimatePresence>
    </main>
  );
}

SimulationWorkspace.propTypes = {
  session: PropTypes.shape({
    screenshotUrl: PropTypes.string,
    fileName: PropTypes.string,
    sourceUrl: PropTypes.string,
    sourceType: PropTypes.string,
    personas: PropTypes.arrayOf(PropTypes.object),
    simulation: PropTypes.shape({
      summary: PropTypes.object,
      personaJourneys: PropTypes.arrayOf(PropTypes.object),
    }),
    insights: PropTypes.object,
    productUnderstanding: PropTypes.object,
  }).isRequired,
  onRunAgain: PropTypes.func.isRequired,
};
