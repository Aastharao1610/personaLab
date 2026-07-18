import { AnimatePresence, motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { useEffect, useMemo, useState } from 'react';

const getInitials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'AI';

const formatConfidence = (confidence) => `${Math.round((confidence || 0) * 100)}%`;

function PersonaCard({ persona, index }) {
  return (
    <motion.article
      animate={{
        y: [0, index % 2 === 0 ? -5 : 5, 0],
        x: [0, index % 3 === 0 ? 4 : -3, 0],
      }}
      transition={{ duration: 3 + index * 0.12, repeat: Infinity, ease: 'easeInOut' }}
      className="rounded-lg border border-white/[0.1] bg-white/[0.035] p-4"
    >
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-xs font-semibold text-black">
          {getInitials(persona.name)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white">{persona.name}</p>
          <p className="mt-1 text-xs text-zinc-500">
            {persona.occupation} · {persona.country}
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={persona.primaryGoal}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.28 }}
          className="mt-4 rounded-md border border-white/[0.08] bg-black/35 p-3"
        >
          <p className="text-xs text-zinc-500">Primary Goal</p>
          <p className="mt-1 text-sm font-medium text-white">{persona.primaryGoal}</p>
        </motion.div>
      </AnimatePresence>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-md border border-white/[0.08] bg-white/[0.025] p-3">
          <p className="text-xs text-zinc-500">Decision Style</p>
          <p className="mt-1 text-sm text-zinc-300">{persona.decisionStyle}</p>
        </div>
        <div className="rounded-md border border-white/[0.08] bg-white/[0.025] p-3">
          <p className="text-xs text-zinc-500">Confidence</p>
          <p className="mt-1 text-sm text-zinc-300">{formatConfidence(persona.confidence)}</p>
        </div>
      </div>

      <p className="mt-3 text-xs leading-5 text-zinc-500">{persona.expectedJourney}</p>
    </motion.article>
  );
}

PersonaCard.propTypes = {
  persona: PropTypes.shape({
    name: PropTypes.string.isRequired,
    occupation: PropTypes.string.isRequired,
    country: PropTypes.string.isRequired,
    primaryGoal: PropTypes.string.isRequired,
    decisionStyle: PropTypes.string.isRequired,
    expectedJourney: PropTypes.string.isRequired,
    confidence: PropTypes.number.isRequired,
  }).isRequired,
  index: PropTypes.number.isRequired,
};

export function SimulationPage({ session, onReset }) {
  const [tick, setTick] = useState(0);
  const personas = session.personas || [];
  const simulation = session.simulation;
  const visibleEvents = useMemo(
    () => (simulation?.personaJourneys || [])
      .flatMap((journey) =>
        journey.steps.map((step) => `${journey.personaName}: ${step.action} - ${step.observation}`))
      .slice(0, 6),
    [simulation],
  );
  const summaryMetrics = [
    ['Converted', simulation?.summary?.converted || 0, 'bg-emerald-300'],
    ['Abandoned', simulation?.summary?.abandoned || 0, 'bg-red-300'],
    ['Exited', simulation?.summary?.exited || 0, 'bg-amber-300'],
    ['Hesitated', simulation?.summary?.hesitated || 0, 'bg-sky-300'],
    ['Average Confidence', Math.round((simulation?.summary?.averageConfidence || 0) * 100), 'bg-violet-300'],
  ];

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setTick((current) => current + 1);
    }, 2200);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <main className="min-h-screen bg-[#050505] px-4 py-4 text-white sm:px-6">
      <div className="mx-auto max-w-[96rem]">
        <header className="mb-4 flex flex-col gap-3 rounded-lg border border-white/[0.1] bg-white/[0.035] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-zinc-500">Simulation</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-normal text-white">
              100 AI users are testing your product
            </h1>
          </div>
          <button
            type="button"
            onClick={onReset}
            className="h-10 rounded-md border border-white/10 px-4 text-sm text-zinc-300 transition hover:bg-white/[0.06]"
          >
            New screenshot
          </button>
        </header>

        <section className="grid gap-4 xl:grid-cols-[0.9fr_1.25fr_0.85fr]">
          <aside className="rounded-lg border border-white/[0.1] bg-[#09090a] p-3">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium text-white">Uploaded screenshot</p>
              <span className="rounded-md bg-white/[0.05] px-2 py-1 text-xs text-zinc-500">
                source image
              </span>
            </div>
            <div className="relative overflow-hidden rounded-md border border-white/[0.08] bg-black">
              <img
                src={session.screenshotUrl}
                alt="Uploaded product screenshot"
                className="h-[34rem] w-full object-contain"
              />
            </div>
          </aside>

          <section className="rounded-lg border border-white/[0.1] bg-[#09090a] p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Generated Personas</p>
                <p className="mt-1 text-xs text-zinc-500">Real Engine 2 output</p>
              </div>
              <motion.span
                animate={{ opacity: [0.45, 1, 0.45] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                className="rounded-md bg-emerald-300/10 px-2.5 py-1 text-xs text-emerald-200 ring-1 ring-emerald-300/20"
              >
                running
              </motion.span>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {personas.length ? personas.map((persona, index) => (
                <PersonaCard
                  key={persona.id}
                  persona={persona}
                  index={index}
                />
              )) : (
                <div className="rounded-md border border-white/[0.08] bg-white/[0.025] p-4 text-sm text-zinc-400 md:col-span-2">
                  No personas generated yet.
                </div>
              )}
            </div>
          </section>

          <aside className="rounded-lg border border-white/[0.1] bg-[#09090a] p-4">
            <p className="text-sm font-medium text-white">Timeline of events</p>
            <div className="mt-4 space-y-3">
              <AnimatePresence mode="popLayout">
                {visibleEvents.map((event, index) => (
                  <motion.div
                    key={`${event}-${tick}`}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.28, delay: index * 0.04 }}
                    className="rounded-md border border-white/[0.08] bg-white/[0.025] p-3"
                  >
                    <p className="text-sm leading-6 text-zinc-300">{event}</p>
                    <p className="mt-1 text-xs text-zinc-600">T+{tick + index + 1}s</p>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </aside>
        </section>

        <section className="mt-4 grid gap-3 md:grid-cols-5">
              {summaryMetrics.map(([label, value, color], index) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: index * 0.05 }}
              className="rounded-lg border border-white/[0.1] bg-[#09090a] p-4"
            >
              <p className="text-xs text-zinc-500">{label}</p>
              <p className="mt-2 text-3xl font-semibold text-white">{value}%</p>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
                <motion.div
                  animate={{ width: `${value}%` }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  className={`h-full rounded-full ${color}`}
                />
              </div>
            </motion.div>
          ))}
        </section>
      </div>
    </main>
  );
}

SimulationPage.propTypes = {
  session: PropTypes.shape({
    screenshotUrl: PropTypes.string.isRequired,
    personas: PropTypes.arrayOf(PropTypes.object),
    simulation: PropTypes.shape({
      summary: PropTypes.object,
      personaJourneys: PropTypes.arrayOf(PropTypes.object),
    }),
  }).isRequired,
  onReset: PropTypes.func.isRequired,
};
