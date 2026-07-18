import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

const toneClasses = {
  emerald: 'from-emerald-300/80 to-emerald-300/20 shadow-emerald-500/10',
  sky: 'from-sky-300/80 to-sky-300/20 shadow-sky-500/10',
  violet: 'from-violet-300/80 to-violet-300/20 shadow-violet-500/10',
  amber: 'from-amber-300/80 to-amber-300/20 shadow-amber-500/10',
  red: 'from-red-300/80 to-red-300/20 shadow-red-500/10',
  fuchsia: 'from-fuchsia-300/80 to-fuchsia-300/20 shadow-fuchsia-500/10',
};

const recommendationLabels = {
  READY_TO_LAUNCH: 'Ready to launch',
  IMPROVE_BEFORE_LAUNCH: 'Improve before launch',
  HIGH_RISK: 'High risk',
};

const getRecommendationTone = (recommendation) => {
  if (recommendation === 'READY_TO_LAUNCH') return 'emerald';
  if (recommendation === 'HIGH_RISK') return 'red';
  return 'amber';
};

function MetricCard({ metric, index }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
      className="rounded-lg border border-white/[0.1] bg-[#09090a] p-4 shadow-2xl shadow-black/25"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-zinc-500">{metric.label}</p>
          <p className="mt-3 text-3xl font-semibold text-white">{metric.value}</p>
        </div>
        <span className="rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-zinc-400">
          {metric.status}
        </span>
      </div>
      <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${metric.percent}%` }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className={`h-full rounded-full bg-gradient-to-r ${toneClasses[metric.tone]}`}
        />
      </div>
    </motion.article>
  );
}

MetricCard.propTypes = {
  metric: PropTypes.shape({
    label: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    percent: PropTypes.number.isRequired,
    tone: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
  }).isRequired,
  index: PropTypes.number.isRequired,
};

function ListPanel({ title, items }) {
  return (
    <div className="rounded-lg border border-white/[0.1] bg-[#09090a] p-5 shadow-2xl shadow-black/25">
      <p className="text-sm font-medium text-zinc-400">{title}</p>
      <div className="mt-5 space-y-3">
        {items.length ? items.map((item) => (
          <div key={item} className="border-b border-white/[0.08] pb-3 text-sm leading-6 text-zinc-300 last:border-b-0">
            {item}
          </div>
        )) : (
          <div className="text-sm leading-6 text-zinc-500">None</div>
        )}
      </div>
    </div>
  );
}

ListPanel.propTypes = {
  title: PropTypes.string.isRequired,
  items: PropTypes.arrayOf(PropTypes.string).isRequired,
};

function PersonaOutcomePanel({ personaSummary }) {
  return (
    <div className="rounded-lg border border-white/[0.1] bg-[#09090a] p-5 shadow-2xl shadow-black/25">
      <p className="text-sm font-medium text-zinc-400">Persona Outcome Breakdown</p>
      <div className="mt-5 space-y-4">
        {personaSummary.map((persona) => (
          <div key={persona.personaId} className="rounded-md border border-white/[0.08] bg-white/[0.025] p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-white">{persona.personaName}</p>
                <p className="mt-1 text-xs text-zinc-500">{persona.outcome}</p>
              </div>
              <span className="rounded-md bg-white/[0.06] px-2 py-1 text-xs text-zinc-400">
                {Math.round(persona.confidence * 100)}%
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-zinc-500">{persona.summary}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

PersonaOutcomePanel.propTypes = {
  personaSummary: PropTypes.arrayOf(
    PropTypes.shape({
      personaId: PropTypes.string.isRequired,
      personaName: PropTypes.string.isRequired,
      outcome: PropTypes.string.isRequired,
      confidence: PropTypes.number.isRequired,
      summary: PropTypes.string.isRequired,
    }),
  ).isRequired,
};

export function InsightsDashboard({ result }) {
  if (!result) return null;

  const recommendationTone = getRecommendationTone(result.recommendation);
  const metrics = [
    {
      label: 'Launch Score',
      value: result.launchScore,
      percent: result.launchScore,
      tone: recommendationTone,
      status: recommendationLabels[result.recommendation] || result.recommendation,
    },
    {
      label: 'Strengths',
      value: result.strengths.length,
      percent: Math.min(100, result.strengths.length * 20),
      tone: 'emerald',
      status: 'Positive signals',
    },
    {
      label: 'Weaknesses',
      value: result.weaknesses.length,
      percent: Math.min(100, result.weaknesses.length * 20),
      tone: 'red',
      status: 'Needs work',
    },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="mb-5 mt-4"
    >
      <div className="mb-5 flex flex-col gap-4 rounded-lg border border-white/[0.1] bg-white/[0.035] p-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-500">Dashboard</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-normal text-white">
            Conversion intelligence
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
            Engine 4 launch recommendation, UX signals, friction, and prioritized improvements.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric, index) => (
          <MetricCard key={metric.label} metric={metric} index={index} />
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <ListPanel title="Positive UX Signals" items={result.strengths} />
        <ListPanel title="Biggest UX Problems" items={result.weaknesses} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <ListPanel title="Top Friction Points" items={result.frictionPoints} />
        <PersonaOutcomePanel personaSummary={result.personaSummary} />
      </div>

      <div className="mt-4 rounded-lg border border-white/[0.1] bg-[#09090a] p-5 shadow-2xl shadow-black/25">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-medium text-zinc-400">Recommended Improvements</p>
          <span className="rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-zinc-500">
            Ranked
          </span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {result.uxRecommendations.map((recommendation, index) => (
            <motion.article
              key={`${recommendation.priority}-${recommendation.recommendation}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: index * 0.05 }}
              className="rounded-md border border-white/[0.08] bg-white/[0.025] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <h4 className="text-sm font-medium text-white">{recommendation.recommendation}</h4>
                <span className="rounded-md bg-white/[0.06] px-2 py-1 text-xs text-zinc-400">
                  {recommendation.priority}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-zinc-500">
                {recommendation.rationale}
              </p>
            </motion.article>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

InsightsDashboard.propTypes = {
  result: PropTypes.shape({
    launchScore: PropTypes.number.isRequired,
    recommendation: PropTypes.string.isRequired,
    strengths: PropTypes.arrayOf(PropTypes.string).isRequired,
    weaknesses: PropTypes.arrayOf(PropTypes.string).isRequired,
    frictionPoints: PropTypes.arrayOf(PropTypes.string).isRequired,
    personaSummary: PropTypes.arrayOf(PropTypes.object).isRequired,
    uxRecommendations: PropTypes.arrayOf(
      PropTypes.shape({
        priority: PropTypes.string.isRequired,
        recommendation: PropTypes.string.isRequired,
        rationale: PropTypes.string.isRequired,
      }),
    ).isRequired,
  }),
};
