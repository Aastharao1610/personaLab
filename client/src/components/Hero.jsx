import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { Button } from './Button.jsx';

const proofPoints = [
  'Understands your product',
  'Creates simulated users',
  'Simulates user journeys',
  'Finds UX blockers before launch',
];

const avatars = [
  {
    name: 'Mia',
    color: 'bg-emerald-300',
    path: [
      { x: '12%', y: '28%' },
      { x: '40%', y: '28%' },
      { x: '72%', y: '34%' },
      { x: '78%', y: '66%' },
    ],
    thought: 'Where does pricing start?',
    status: 'confused',
  },
  {
    name: 'Raj',
    color: 'bg-sky-300',
    path: [
      { x: '10%', y: '70%' },
      { x: '32%', y: '58%' },
      { x: '58%', y: '46%' },
      { x: '78%', y: '28%' },
    ],
    thought: 'This CTA matches my goal.',
    status: 'success',
  },
  {
    name: 'Ava',
    color: 'bg-fuchsia-300',
    path: [
      { x: '84%', y: '24%' },
      { x: '64%', y: '44%' },
      { x: '44%', y: '66%' },
      { x: '18%', y: '72%' },
    ],
    thought: 'I need proof before signup.',
    status: 'hesitating',
  },
];

function LiveSimulationMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 18 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.65, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="relative"
    >
      <div className="rounded-lg border border-white/[0.1] bg-[#0b0b0d] p-3 shadow-2xl shadow-black/60">
        <div className="overflow-hidden rounded-md border border-white/[0.08] bg-black">
          <div className="flex h-11 items-center gap-2 border-b border-white/[0.08] px-4">
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
            <span className="ml-3 text-xs text-zinc-500">Simulation running / 100 AI users</span>
            <span className="ml-auto rounded-md bg-emerald-400/10 px-2 py-1 text-xs text-emerald-300 ring-1 ring-emerald-300/20">
              Live
            </span>
          </div>

          <div className="relative h-[34rem] bg-[#050505] p-4">
            <div className="absolute inset-4 rounded-lg border border-white/[0.08] bg-white/[0.025]" />

            <div className="absolute left-[8%] top-[12%] h-14 w-52 rounded-md border border-white/[0.08] bg-white/[0.06]" />
            <div className="absolute left-[8%] top-[26%] h-2 w-64 rounded-full bg-white/30" />
            <div className="absolute left-[8%] top-[31%] h-2 w-48 rounded-full bg-white/15" />
            <div className="absolute left-[8%] top-[40%] h-10 w-36 rounded-md bg-white" />
            <motion.div
              animate={{ opacity: [0.3, 0.9, 0.3], scale: [1, 1.04, 1] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute left-[8%] top-[40%] h-10 w-36 rounded-md ring-2 ring-zinc-100/70"
            />

            <div className="absolute right-[8%] top-[16%] grid w-40 gap-2">
              <div className="h-20 rounded-md border border-white/[0.08] bg-white/[0.045]" />
              <div className="h-20 rounded-md border border-white/[0.08] bg-white/[0.03]" />
              <div className="h-20 rounded-md border border-white/[0.08] bg-white/[0.025]" />
            </div>

            <motion.div
              animate={{ opacity: [0, 1, 0], y: [0, -4, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute left-[55%] top-[38%] rounded-md border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-xs text-amber-100"
            >
              confusion: pricing hidden
            </motion.div>

            <motion.div
              animate={{ opacity: [0.25, 0.75, 0.25], scale: [1, 1.06, 1] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute bottom-[14%] right-[10%] h-16 w-28 rounded-lg bg-red-300/15 ring-2 ring-red-300/40"
            />

            {avatars.map((avatar, index) => (
              <motion.div
                key={avatar.name}
                className="absolute"
                animate={avatar.path}
                transition={{
                  duration: 7 + index,
                  repeat: Infinity,
                  repeatType: 'reverse',
                  ease: 'easeInOut',
                  delay: index * 0.45,
                }}
              >
                <div className="relative">
                  <div
                    className={`grid h-9 w-9 place-items-center rounded-full ${avatar.color} text-xs font-semibold text-black shadow-[0_0_36px_rgba(255,255,255,0.18)]`}
                  >
                    {avatar.name[0]}
                  </div>
                  <motion.div
                    animate={{ opacity: [0, 1, 1, 0], y: [6, 0, 0, -4] }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: index * 0.7,
                    }}
                    className="absolute -top-14 left-5 w-40 rounded-md border border-white/10 bg-black/85 px-3 py-2 text-xs leading-5 text-zinc-200 backdrop-blur"
                  >
                    {avatar.thought}
                  </motion.div>
                  <span
                    className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full ${
                      avatar.status === 'success'
                        ? 'bg-emerald-300'
                        : avatar.status === 'confused'
                          ? 'bg-amber-300'
                          : 'bg-fuchsia-300'
                    }`}
                  />
                </div>
              </motion.div>
            ))}

            <div className="absolute bottom-4 left-4 right-4 grid grid-cols-4 gap-2">
              {['Landing', 'Search', 'Product', 'Exit'].map((step, index) => (
                <div key={step} className="rounded-md border border-white/[0.08] bg-black/55 p-3">
                  <p className="text-xs text-zinc-500">{step}</p>
                  <motion.div
                    animate={{ width: [`${20 + index * 10}%`, `${70 - index * 5}%`, `${20 + index * 10}%`] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: index * 0.2 }}
                    className="mt-3 h-1.5 rounded-full bg-white"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function Hero({ actionPanel }) {
  return (
    <section className="relative px-6 pt-28 sm:pt-36">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.12),transparent_32rem)]" />
      <div className="absolute inset-x-0 top-16 -z-10 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

      <div className="mx-auto grid max-w-6xl items-center gap-12 pb-16 lg:grid-cols-[0.92fr_1.08fr] lg:pb-20">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="inline-flex rounded-md border border-white/10 bg-white/[0.04] px-3 py-1 text-sm text-zinc-300">
            Predictive pre-launch UX simulation
          </p>
          <h1 className="mt-7 max-w-4xl text-5xl font-semibold tracking-normal text-white sm:text-6xl lg:text-7xl">
            Find why users won&apos;t convert before you launch.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-400">
            PersonaLab analyzes a screenshot or URL, simulates AI user journeys,
            identifies friction points, and generates a launch-readiness report
            before real users ever visit your product.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {proofPoints.map((point) => (
              <div
                key={point}
                className="flex items-center gap-3 rounded-lg border border-white/[0.08] bg-white/[0.025] px-4 py-3 text-sm text-zinc-200"
              >
                <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-300 text-xs font-semibold text-black">
                  ✓
                </span>
                <span>{point}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button href="#upload">Analyze a page</Button>
            <Button href="#simulation" variant="secondary">
              See how it works
            </Button>
          </div>
          <div className="mt-8 rounded-lg border border-white/[0.08] bg-white/[0.025] p-5">
            <p className="text-sm leading-6 text-zinc-300">
              Predictive simulation, not real visitor analytics. Built for the
              moment before your product has traffic.
            </p>
          </div>
        </motion.div>

        {actionPanel || <LiveSimulationMockup />}
      </div>
    </section>
  );
}

Hero.propTypes = {
  actionPanel: PropTypes.node,
};
