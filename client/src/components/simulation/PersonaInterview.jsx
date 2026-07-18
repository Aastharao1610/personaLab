import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { useEffect, useRef } from 'react';

const outcomeStyles = {
  CONVERTED: 'bg-emerald-400/10 text-emerald-200 ring-emerald-300/20',
  HESITATED: 'bg-amber-300/10 text-amber-100 ring-amber-300/20',
  ABANDONED: 'bg-red-400/10 text-red-100 ring-red-300/20',
  EXITED: 'bg-zinc-500/10 text-zinc-300 ring-zinc-400/20',
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

const actionIcon = (action = '') => {
  if (action.includes('CLICK') || action.includes('OPEN')) return '>';
  if (action.includes('READ') || action.includes('SCAN')) return 'r';
  if (action.includes('CHECK') || action.includes('INSPECT')) return '?';
  if (action.includes('EXIT')) return 'x';
  if (action.includes('CONVERT') || action.includes('PURCHASE')) return '+';
  return '.';
};

function MetricPill({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-zinc-100">{value || 'None'}</p>
    </div>
  );
}

MetricPill.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

function TimelineStep({ step, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: index * 0.04 }}
      className="relative pl-12"
    >
      <div className="absolute left-4 top-9 h-[calc(100%+1rem)] w-px bg-white/10 last:hidden" />
      <div className="absolute left-0 top-0 grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-white text-xs font-semibold text-black">
        {actionIcon(step.action)}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-white/[0.07] px-2.5 py-1 text-xs font-medium text-zinc-300">
            Step {step.stepIndex}
          </span>
          <span className="rounded-full bg-white/[0.07] px-2.5 py-1 text-xs font-medium text-zinc-300">
            {formatLabel(step.action)}
          </span>
          <span className="rounded-full bg-white/[0.07] px-2.5 py-1 text-xs font-medium text-zinc-300">
            {step.state}
          </span>
        </div>

        <div className="mt-4 grid gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">
              Observation
            </p>
            <p className="mt-1 text-sm leading-6 text-zinc-200">{step.observation}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">
              Interpretation
            </p>
            <p className="mt-1 text-sm leading-6 text-zinc-300">{step.interpretation}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">
              Action
            </p>
            <p className="mt-1 text-sm leading-6 text-zinc-300">{step.target}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

TimelineStep.propTypes = {
  step: PropTypes.shape({
    stepIndex: PropTypes.number.isRequired,
    state: PropTypes.string.isRequired,
    observation: PropTypes.string.isRequired,
    interpretation: PropTypes.string.isRequired,
    action: PropTypes.string.isRequired,
    target: PropTypes.string.isRequired,
  }).isRequired,
  index: PropTypes.number.isRequired,
};

export function PersonaInterview({ persona: selection, onClose }) {
  const closeButtonRef = useRef(null);

  useEffect(() => {
    if (!selection) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, selection]);

  if (!selection) return null;

  const persona = selection.persona || selection;
  const journey = selection.journey;
  const insight = selection.insight;
  const outcome = journey?.outcome || insight?.outcome || 'EXITED';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="persona-drawer-title"
        initial={{ x: '100%', opacity: 0.8 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0.8 }}
        transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
        onClick={(event) => event.stopPropagation()}
        className="ml-auto flex h-full w-full max-w-2xl flex-col overflow-y-auto border-l border-white/10 bg-[#08080a]/95 p-5 shadow-2xl shadow-black/60 backdrop-blur-2xl sm:p-6"
      >
        <div className="mb-5 flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
            Persona Journey
          </p>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-sm text-zinc-300 transition hover:bg-white/[0.08]"
            aria-label="Close persona drawer"
          >
            x
          </button>
        </div>

        <header className="rounded-2xl border border-white/10 bg-white/[0.045] p-5">
          <div className="flex items-start gap-4">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-white text-lg font-semibold text-black">
              {getInitials(persona.name)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2
                  id="persona-drawer-title"
                  className="text-2xl font-semibold tracking-normal text-white"
                >
                  {persona.name}
                </h2>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${outcomeStyles[outcome] || outcomeStyles.EXITED}`}>
                  {formatLabel(outcome)}
                </span>
              </div>
              <p className="mt-1 text-sm text-zinc-500">
                {persona.occupation} · {persona.country}
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <MetricPill label="Outcome" value={formatLabel(outcome)} />
            <MetricPill label="Confidence" value={formatConfidence(journey?.confidence ?? insight?.confidence)} />
            <MetricPill label="Role" value={persona.occupation} />
          </div>
        </header>

        <section className="mt-4 rounded-2xl border border-white/10 bg-white/[0.035] p-5">
          <p className="text-sm font-semibold text-white">Reason for final outcome</p>
          <p className="mt-3 text-sm leading-6 text-zinc-300">
            {insight?.summary || journey?.steps?.at(-1)?.reason || persona.expectedJourney || 'No final reasoning returned.'}
          </p>
        </section>

        <section className="mt-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
                Journey Timeline
              </p>
              <h3 className="mt-2 text-xl font-semibold text-white">Observation to action</h3>
            </div>
            <span className="rounded-full bg-white/[0.06] px-3 py-1 text-xs text-zinc-400">
              {journey?.steps?.length || 0} steps
            </span>
          </div>

          <div className="space-y-5">
            {journey?.steps?.length ? (
              journey.steps.map((step, index) => (
                <TimelineStep key={`${persona.id}-${step.stepIndex}`} step={step} index={index} />
              ))
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-zinc-400">
                No simulation journey available.
              </div>
            )}
          </div>
        </section>
      </motion.aside>
    </motion.div>
  );
}

PersonaInterview.propTypes = {
  persona: PropTypes.oneOfType([
    PropTypes.shape({
      persona: PropTypes.object.isRequired,
      journey: PropTypes.object,
      insight: PropTypes.object,
    }),
    PropTypes.object,
  ]),
  onClose: PropTypes.func.isRequired,
};
