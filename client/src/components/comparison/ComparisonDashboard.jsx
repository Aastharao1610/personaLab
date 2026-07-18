import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { getDashboardData } from '../../utils/dashboardMetrics.js';

const comparisonMetrics = [
  { label: 'Conversion Score', key: 'Conversion Score', inverse: false },
  { label: 'Trust Score', key: 'Trust Score', inverse: false },
  { label: 'Accessibility', key: 'Accessibility', inverse: false },
  { label: 'Confusion', key: 'Confusion', inverse: true },
  { label: 'Expected Bounce', key: 'Expected Bounce', inverse: true },
  { label: 'Drop Off', key: 'Drop Off', inverse: true },
];

const getMetricValue = (dashboard, label) =>
  dashboard.cards.find((metric) => metric.label === label)?.value || 0;

const getImprovement = (before, after, inverse) =>
  inverse ? before - after : after - before;

function ComparisonMetric({ metric, beforeDashboard, afterDashboard, index }) {
  const beforeValue = getMetricValue(beforeDashboard, metric.key);
  const afterValue = getMetricValue(afterDashboard, metric.key);
  const improvement = getImprovement(beforeValue, afterValue, metric.inverse);
  const improved = improvement >= 0;

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
      className="rounded-lg border border-white/[0.1] bg-[#09090a] p-4 shadow-2xl shadow-black/25"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-zinc-500">{metric.label}</p>
          <p className="mt-3 text-3xl font-semibold text-white">
            {improved ? '+' : ''}
            {improvement}
          </p>
        </div>
        <span
          className={`rounded-md border px-2.5 py-1 text-xs ${
            improved
              ? 'border-emerald-300/20 bg-emerald-300/10 text-emerald-200'
              : 'border-red-300/20 bg-red-300/10 text-red-200'
          }`}
        >
          {improved ? 'Improved' : 'Regressed'}
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {[
          ['Before', beforeValue, 'bg-zinc-500'],
          ['After', afterValue, improved ? 'bg-emerald-300' : 'bg-red-300'],
        ].map(([label, value, className]) => (
          <div key={label}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-zinc-500">{label}</span>
              <span className="text-zinc-400">{value}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/[0.08]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${value}%` }}
                transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
                className={`h-full rounded-full ${className}`}
              />
            </div>
          </div>
        ))}
      </div>
    </motion.article>
  );
}

ComparisonMetric.propTypes = {
  metric: PropTypes.shape({
    label: PropTypes.string.isRequired,
    key: PropTypes.string.isRequired,
    inverse: PropTypes.bool.isRequired,
  }).isRequired,
  beforeDashboard: PropTypes.shape({
    cards: PropTypes.arrayOf(PropTypes.object).isRequired,
  }).isRequired,
  afterDashboard: PropTypes.shape({
    cards: PropTypes.arrayOf(PropTypes.object).isRequired,
  }).isRequired,
  index: PropTypes.number.isRequired,
};

function ScreenshotCompare({ beforeScreenshotUrl, afterScreenshotUrl }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {[
        ['Before', beforeScreenshotUrl],
        ['After', afterScreenshotUrl],
      ].map(([label, url]) => (
        <div
          key={label}
          className="overflow-hidden rounded-lg border border-white/[0.1] bg-[#09090a] p-3"
        >
          <div className="mb-3 flex items-center justify-between px-1">
            <p className="text-sm font-medium text-white">{label}</p>
            <span className="rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-zinc-500">
              Screenshot
            </span>
          </div>
          <div className="overflow-hidden rounded-md border border-white/[0.08] bg-black">
            <img src={url} alt={`${label} screenshot`} className="h-72 w-full object-contain" />
          </div>
        </div>
      ))}
    </div>
  );
}

ScreenshotCompare.propTypes = {
  beforeScreenshotUrl: PropTypes.string.isRequired,
  afterScreenshotUrl: PropTypes.string.isRequired,
};

export function ComparisonDashboard({
  beforeResult,
  afterResult,
  beforeScreenshotUrl,
  afterScreenshotUrl,
}) {
  const beforeDashboard = getDashboardData(beforeResult);
  const afterDashboard = getDashboardData(afterResult);
  const netImprovement = comparisonMetrics.reduce((total, metric) => {
    const beforeValue = getMetricValue(beforeDashboard, metric.key);
    const afterValue = getMetricValue(afterDashboard, metric.key);
    return total + getImprovement(beforeValue, afterValue, metric.inverse);
  }, 0);

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="mt-8 rounded-lg border border-white/[0.1] bg-white/[0.025] p-4 shadow-2xl shadow-black/30"
    >
      <div className="mb-5 flex flex-col gap-4 rounded-lg border border-white/[0.08] bg-black/30 p-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-500">Before / After</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-normal text-white">
            Improvement analysis
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
            Persona simulations are rerun against the second screenshot and compared
            against the original baseline.
          </p>
        </div>
        <div className="rounded-lg border border-white/[0.1] bg-white/[0.04] px-5 py-4">
          <p className="text-xs text-zinc-500">Net Improvement</p>
          <p className="mt-1 text-3xl font-semibold text-white">
            {netImprovement >= 0 ? '+' : ''}
            {Math.round(netImprovement)}
          </p>
        </div>
      </div>

      <ScreenshotCompare
        beforeScreenshotUrl={beforeScreenshotUrl}
        afterScreenshotUrl={afterScreenshotUrl}
      />

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {comparisonMetrics.map((metric, index) => (
          <ComparisonMetric
            key={metric.key}
            metric={metric}
            beforeDashboard={beforeDashboard}
            afterDashboard={afterDashboard}
            index={index}
          />
        ))}
      </div>
    </motion.section>
  );
}

ComparisonDashboard.propTypes = {
  beforeResult: PropTypes.object.isRequired,
  afterResult: PropTypes.object.isRequired,
  beforeScreenshotUrl: PropTypes.string.isRequired,
  afterScreenshotUrl: PropTypes.string.isRequired,
};
