import { AnimatePresence, motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';

const pipelineStages = [
  {
    icon: '🧠',
    label: 'Understanding Product',
    detail: 'Analyze layout, navigation and page intent.',
  },
  {
    icon: '👥',
    label: 'Creating Simulated Users',
    detail: 'Generate realistic user types for this product.',
  },
  {
    icon: '🎭',
    label: 'Simulating User Behaviour',
    detail: 'Run AI journeys through the interface.',
  },
  {
    icon: '📊',
    label: 'Calculating UX Intelligence',
    detail: 'Compute friction, trust, conversion and launch score.',
  },
  {
    icon: '✨',
    label: 'Building Final Report',
    detail: 'Prepare recommendations.',
  },
];

export function AnalysisLoadingSequence({
  activeStageIndex,
  progress,
  isComplete = false,
}) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const clampedProgress = Math.min(100, Math.max(0, progress || 0));
  const activeStage = pipelineStages[activeStageIndex];
  const isSlowStage = !isComplete && elapsedSeconds >= 18;

  useEffect(() => {
    if (isComplete) return undefined;

    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      className="absolute inset-0 z-20 flex flex-col justify-between bg-[#050505]/90 p-5 backdrop-blur-2xl"
    >
      <div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
              AI Workflow
            </p>
            <AnimatePresence mode="wait">
              <motion.p
                key={activeStage?.label || 'Complete'}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.24, ease: 'easeOut' }}
                className="mt-2 text-xl font-semibold tracking-normal text-white"
              >
                {isComplete ? 'Report ready' : activeStage?.label}
              </motion.p>
            </AnimatePresence>
            <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-500">
              {isSlowStage
                ? 'Still working. Larger screenshots and AI rate limits can make this stage take longer.'
                : activeStage?.detail}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-zinc-300">{Math.round(clampedProgress)}%</p>
            <p className="mt-1 text-xs text-zinc-600">{elapsedSeconds}s elapsed</p>
          </div>
        </div>

        <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/[0.1]">
          <motion.div
            animate={{ width: `${clampedProgress}%` }}
            transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
            className="h-full rounded-full bg-gradient-to-r from-emerald-300 via-cyan-200 to-amber-200 shadow-[0_0_24px_rgba(45,212,191,0.28)]"
          />
        </div>
      </div>

      <div className="space-y-3 py-5">
        {pipelineStages.map((stage, index) => {
          const isStageComplete = isComplete || index < activeStageIndex;
          const isActive = !isComplete && index === activeStageIndex;

          return (
            <motion.div
              key={stage.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{
                opacity: index <= activeStageIndex || isComplete ? 1 : 0.46,
                y: isActive ? -2 : 0,
                scale: isActive ? 1.01 : 1,
              }}
              transition={{ duration: 0.28, ease: 'easeOut', delay: index * 0.025 }}
              className={`relative overflow-hidden rounded-2xl border p-4 ${
                isActive
                  ? 'border-white/20 bg-white/[0.08] shadow-xl shadow-black/30'
                  : 'border-white/10 bg-white/[0.035]'
              }`}
            >
              {isActive ? (
                <motion.div
                  aria-hidden="true"
                  animate={{ x: ['-120%', '120%'] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent"
                />
              ) : null}

              <div className="relative flex items-start gap-3">
                <span
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-lg ${
                    isStageComplete
                      ? 'bg-emerald-300 text-black'
                      : 'bg-white/[0.08] text-white'
                  }`}
                >
                  {isStageComplete ? '✓' : stage.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-base font-semibold text-white">{stage.label}</p>
                    {isActive ? (
                      <motion.span
                        animate={{ opacity: [0.42, 1, 0.42] }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                        className="h-2 w-2 rounded-full bg-cyan-200"
                      />
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm leading-6 text-zinc-400">{stage.detail}</p>

                  <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/[0.08]">
                    <motion.div
                      animate={{
                        width: isStageComplete ? '100%' : isActive ? '64%' : '0%',
                      }}
                      transition={{
                        duration: isActive ? 1.4 : 0.34,
                        repeat: isActive ? Infinity : 0,
                        repeatType: 'reverse',
                        ease: 'easeInOut',
                      }}
                      className={`h-full rounded-full ${
                        isStageComplete ? 'bg-emerald-300' : 'bg-white'
                      }`}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-5 gap-2">
        {pipelineStages.map((stage, index) => (
          <motion.div
            key={stage.label}
            animate={{
              opacity: isComplete || index <= activeStageIndex ? 1 : 0.35,
            }}
            className={`h-1.5 rounded-full ${
              isComplete || index < activeStageIndex ? 'bg-emerald-300' : 'bg-white/[0.14]'
            }`}
          />
        ))}
      </div>
    </motion.div>
  );
}

AnalysisLoadingSequence.propTypes = {
  activeStageIndex: PropTypes.number.isRequired,
  progress: PropTypes.number.isRequired,
  isComplete: PropTypes.bool,
};
