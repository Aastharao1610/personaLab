import { AnimatePresence, motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { useEffect, useMemo, useState } from 'react';
import { InsightsDashboard } from '../dashboard/InsightsDashboard.jsx';
import { HeatmapOverlay } from './HeatmapOverlay.jsx';

const emotions = ['Curious', 'Focused', 'Doubtful', 'Interested', 'Ready'];

const getCompletion = (currentStep, totalSteps) => {
  if (!totalSteps) return 0;
  return Math.round(((currentStep + 1) / totalSteps) * 100);
};

const getEmotion = (simulation, stepIndex) => {
  if (simulation.confusion.length && stepIndex >= Math.max(simulation.journey.length - 2, 0)) {
    return 'Uncertain';
  }

  if (simulation.purchaseProbability >= 0.72 && stepIndex === simulation.journey.length - 1) {
    return 'Convinced';
  }

  return emotions[stepIndex % emotions.length];
};

const getThought = (simulation, stepIndex) => {
  if (simulation.thinking[stepIndex]) return simulation.thinking[stepIndex];
  if (simulation.thinking[0]) return simulation.thinking[0];
  return 'Evaluating whether this experience matches my intent.';
};

function PersonaSimulationCard({ simulation, index, activeStep }) {
  const step = simulation.journey[activeStep] || simulation.journey.at(-1);
  const completion = getCompletion(activeStep, simulation.journey.length);
  const currentClick = simulation.clicks.find((click) => click.order === activeStep + 1);
  const emotion = getEmotion(simulation, activeStep);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{
        opacity: 1,
        y: [0, -6, 0],
        x: [0, index % 2 === 0 ? 4 : -4, 0],
        scale: 1,
      }}
      transition={{
        opacity: { duration: 0.35, delay: index * 0.04 },
        scale: { duration: 0.35, delay: index * 0.04 },
        x: { duration: 3.6, repeat: Infinity, ease: 'easeInOut', delay: index * 0.12 },
        y: { duration: 3.2, repeat: Infinity, ease: 'easeInOut', delay: index * 0.1 },
      }}
      className="relative overflow-hidden rounded-lg border border-white/[0.1] bg-[#09090a] p-4 shadow-2xl shadow-black/30"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white">{simulation.personaName}</p>
          <p className="mt-1 text-xs text-zinc-500">
            Confidence {Math.round(simulation.confidence * 100)}% · Purchase{' '}
            {Math.round(simulation.purchaseProbability * 100)}%
          </p>
        </div>
        <motion.span
          key={emotion}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-zinc-300"
        >
          {emotion}
        </motion.span>
      </div>

      <div className="mt-5 rounded-md border border-white/[0.08] bg-black/45 p-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-medium uppercase text-zinc-500">
            Current Step {activeStep + 1}
          </p>
          <span className="text-xs text-zinc-500">{completion}%</span>
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={`${simulation.personaName}-${activeStep}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="mt-3"
          >
            <p className="text-sm font-medium leading-6 text-white">{step?.action}</p>
            <p className="mt-2 text-xs leading-5 text-zinc-500">{step?.outcome}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-4 grid gap-3">
        <div className="relative rounded-md border border-white/[0.08] bg-white/[0.035] p-3">
          <div className="absolute -top-1 left-6 h-2 w-2 rotate-45 border-l border-t border-white/[0.08] bg-[#111113]" />
          <p className="text-xs font-medium text-zinc-500">Thought Bubble</p>
          <p className="mt-2 text-sm leading-6 text-zinc-300">
            “{getThought(simulation, activeStep)}”
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-md border border-white/[0.08] bg-white/[0.025] p-3">
            <p className="text-xs text-zinc-500">Current Goal</p>
            <p className="mt-2 text-sm leading-5 text-zinc-300">
              {currentClick?.reason || step?.observation || 'Find the fastest credible next action.'}
            </p>
          </div>
          <div className="rounded-md border border-white/[0.08] bg-white/[0.025] p-3">
            <p className="text-xs text-zinc-500">Current Emotion</p>
            <p className="mt-2 text-sm font-medium text-zinc-200">{emotion}</p>
          </div>
        </div>
      </div>

      <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
        <motion.div
          animate={{ width: `${completion}%` }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="h-full rounded-full bg-white"
        />
      </div>
    </motion.article>
  );
}

PersonaSimulationCard.propTypes = {
  simulation: PropTypes.shape({
    personaName: PropTypes.string.isRequired,
    journey: PropTypes.arrayOf(
      PropTypes.shape({
        action: PropTypes.string.isRequired,
        observation: PropTypes.string.isRequired,
        outcome: PropTypes.string.isRequired,
      }),
    ).isRequired,
    clicks: PropTypes.arrayOf(
      PropTypes.shape({
        reason: PropTypes.string.isRequired,
        order: PropTypes.number.isRequired,
      }),
    ).isRequired,
    thinking: PropTypes.arrayOf(PropTypes.string).isRequired,
    confusion: PropTypes.arrayOf(PropTypes.string).isRequired,
    confidence: PropTypes.number.isRequired,
    purchaseProbability: PropTypes.number.isRequired,
  }).isRequired,
  index: PropTypes.number.isRequired,
  activeStep: PropTypes.number.isRequired,
};

export function SimulationDashboard({ result, screenshotUrl }) {
  const simulations = useMemo(() => result?.simulations || [], [result]);
  const heatmap = result?.heatmap;
  const maxSteps = useMemo(
    () => Math.max(...simulations.map((simulation) => simulation.journey.length), 1),
    [simulations],
  );
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (!simulations.length) return undefined;

    const intervalId = window.setInterval(() => {
      setActiveStep((currentStep) => (currentStep + 1) % maxSteps);
    }, 2600);

    return () => window.clearInterval(intervalId);
  }, [maxSteps, simulations.length]);

  if (!simulations.length) return null;

  const averagePurchase = Math.round(
    (simulations.reduce(
      (total, simulation) => total + simulation.purchaseProbability,
      0,
    ) /
      simulations.length) *
      100,
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="mt-8"
    >
      <div className="mb-5 flex flex-col gap-4 rounded-lg border border-white/[0.1] bg-white/[0.035] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-500">Simulation Engine</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-normal text-white">
            Persona journeys in motion
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:w-64">
          <div className="rounded-md border border-white/[0.08] bg-black/35 p-3">
            <p className="text-xs text-zinc-500">Personas</p>
            <p className="mt-1 text-xl font-semibold text-white">{simulations.length}</p>
          </div>
          <div className="rounded-md border border-white/[0.08] bg-black/35 p-3">
            <p className="text-xs text-zinc-500">Avg Purchase</p>
            <p className="mt-1 text-xl font-semibold text-white">{averagePurchase}%</p>
          </div>
        </div>
      </div>

      <InsightsDashboard result={result} />
      <HeatmapOverlay heatmap={heatmap} screenshotUrl={screenshotUrl} />

      <div className="grid gap-4 lg:grid-cols-2">
        {simulations.map((simulation, index) => (
          <PersonaSimulationCard
            key={simulation.personaName}
            simulation={simulation}
            index={index}
            activeStep={Math.min(activeStep, simulation.journey.length - 1)}
          />
        ))}
      </div>
    </motion.div>
  );
}

SimulationDashboard.propTypes = {
  result: PropTypes.shape({
    simulations: PropTypes.arrayOf(PropTypes.object),
    heatmap: PropTypes.object,
  }),
  screenshotUrl: PropTypes.string,
};
