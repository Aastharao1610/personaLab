import { motion } from 'framer-motion';
import { AnimatedSection } from './AnimatedSection.jsx';
import { SectionHeader } from './SectionHeader.jsx';

const paths = [
  {
    name: 'Mia',
    color: 'bg-emerald-300',
    route: ['Landing', 'Search', 'Product', 'Cart', 'Success'],
  },
  {
    name: 'Owen',
    color: 'bg-amber-300',
    route: ['Landing', 'Product', 'Cart', 'Exit'],
  },
  {
    name: 'Nora',
    color: 'bg-fuchsia-300',
    route: ['Landing', 'Search', 'Product', 'Exit'],
  },
];

const attentionRegions = [
  ['1', 'CTA noticed', 'left-[9%] top-[40%] h-12 w-36 bg-emerald-300/20 ring-emerald-300/60'],
  ['2', 'Pricing hesitation', 'left-[48%] top-[25%] h-24 w-36 bg-amber-300/20 ring-amber-300/60'],
  ['3', 'Trust gap', 'right-[10%] bottom-[21%] h-20 w-44 bg-red-300/20 ring-red-300/60'],
  ['4', 'Ignored area', 'left-[28%] bottom-[21%] h-16 w-32 bg-zinc-200/16 ring-zinc-200/45'],
];

const attentionLegend = [
  ['bg-emerald-300', 'Attention'],
  ['bg-amber-300', 'Hesitation'],
  ['bg-red-300', 'Friction'],
  ['bg-zinc-300', 'Ignored'],
];

const attentionFindings = [
  ['Main Blocker', 'Users notice the CTA but hesitate before they understand pricing.'],
  ['Highest Fix', 'Move proof and pricing closer to the primary action.'],
  ['Confidence', 'Derived from simulated journeys, not live analytics.'],
];

export function HowItWorks() {
  return (
    <>
      <AnimatedSection
        id="simulation"
        className="border-t border-white/[0.08] px-6 py-24 sm:py-28"
      >
        <div className="mx-auto max-w-6xl">
          <SectionHeader
            eyebrow="Simulation"
            title="Watch different users take different paths through the same product."
            description="Some reach the cart. Some loop on search. Some leave because the next step never becomes obvious."
          />

          <div className="mt-14 rounded-lg border border-white/[0.1] bg-[#09090a] p-5">
            <div className="grid gap-4 lg:grid-cols-5">
              {['Landing', 'Search', 'Product', 'Cart', 'Exit'].map((step, index) => (
                <div key={step} className="relative rounded-md border border-white/[0.08] bg-black/45 p-4">
                  <p className="text-sm font-medium text-white">{step}</p>
                  <p className="mt-2 text-xs text-zinc-500">screen {index + 1}</p>
                  {index < 4 ? (
                    <span className="absolute -right-3 top-1/2 hidden h-px w-6 bg-white/20 lg:block" />
                  ) : null}
                </div>
              ))}
            </div>

            <div className="mt-8 space-y-4">
              {paths.map((path, index) => (
                <div key={path.name} className="rounded-md border border-white/[0.08] bg-white/[0.025] p-3">
                  <div className="mb-3 flex items-center gap-3">
                    <span className={`grid h-7 w-7 place-items-center rounded-full ${path.color} text-xs font-semibold text-black`}>
                      {path.name[0]}
                    </span>
                    <span className="text-sm text-zinc-300">{path.name}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {path.route.map((step, stepIndex) => (
                      <motion.div
                        key={`${path.name}-${step}`}
                        initial={{ opacity: 0, x: -8 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.3, delay: index * 0.1 + stepIndex * 0.08 }}
                        className={`rounded-md px-3 py-2 text-xs ${
                          step === 'Exit'
                            ? 'bg-red-300/10 text-red-200 ring-1 ring-red-300/20'
                            : step === 'Success'
                              ? 'bg-emerald-300/10 text-emerald-200 ring-1 ring-emerald-300/20'
                              : 'bg-white/[0.04] text-zinc-300 ring-1 ring-white/10'
                        }`}
                      >
                        {step}
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection
        id="heatmap-story"
        className="border-t border-white/[0.08] px-6 py-24 sm:py-28"
      >
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.86fr_1.14fr] lg:items-center">
          <SectionHeader
            eyebrow="Attention Map"
            title="Turn the screenshot into evidence, not guesswork."
            description="PersonaLab marks where simulated users focus, hesitate, and lose confidence so the next fix is obvious."
          />

          <div className="rounded-2xl border border-white/[0.1] bg-[#09090a] p-3 shadow-2xl shadow-black/30">
            <div className="flex flex-col gap-3 border-b border-white/[0.08] px-2 pb-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-white">Simulated Attention Estimate</p>
                <p className="mt-1 text-xs text-zinc-500">Visual evidence linked to launch fixes</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {attentionLegend.map(([color, label]) => (
                  <span key={label} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-zinc-300">
                    <span className={`h-2 w-2 rounded-full ${color}`} />
                    {label}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid gap-3 pt-3 lg:grid-cols-[1fr_16rem]">
              <div className="relative min-h-[26rem] overflow-hidden rounded-xl border border-white/[0.08] bg-black p-5">
                <div className="absolute inset-x-5 top-5 flex h-9 items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.035] px-3">
                  <span className="h-2 w-2 rounded-full bg-red-400/60" />
                  <span className="h-2 w-2 rounded-full bg-amber-300/60" />
                  <span className="h-2 w-2 rounded-full bg-emerald-300/60" />
                  <span className="ml-2 h-2 w-32 rounded-full bg-white/10" />
                </div>

                <div className="absolute left-[8%] top-[21%] h-16 w-56 rounded-lg border border-white/[0.08] bg-white/[0.045]" />
                <div className="absolute left-[8%] top-[38%] h-2 w-64 rounded-full bg-white/35" />
                <div className="absolute left-[8%] top-[44%] h-2 w-48 rounded-full bg-white/16" />
                <div className="absolute left-[8%] top-[54%] h-11 w-36 rounded-lg bg-white" />
                <div className="absolute left-[8%] top-[69%] grid w-64 grid-cols-3 gap-2">
                  <div className="h-16 rounded-lg border border-white/[0.08] bg-white/[0.035]" />
                  <div className="h-16 rounded-lg border border-white/[0.08] bg-white/[0.035]" />
                  <div className="h-16 rounded-lg border border-white/[0.08] bg-white/[0.035]" />
                </div>
                <div className="absolute right-[8%] top-[22%] grid w-44 gap-3">
                  <div className="h-24 rounded-lg border border-white/[0.08] bg-white/[0.045]" />
                  <div className="h-24 rounded-lg border border-white/[0.08] bg-white/[0.03]" />
                  <div className="h-20 rounded-lg border border-white/[0.08] bg-white/[0.025]" />
                </div>

                {attentionRegions.map(([number, label, className], index) => (
                  <motion.div
                    key={label}
                    animate={{ opacity: [0.48, 0.95, 0.48], scale: [1, 1.035, 1] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', delay: index * 0.18 }}
                    className={`absolute rounded-xl ring-2 ${className}`}
                  >
                    <span className="absolute -left-3 -top-3 grid h-7 w-7 place-items-center rounded-full bg-white text-xs font-semibold text-black shadow-lg shadow-black/30">
                      {number}
                    </span>
                    <span className="absolute -bottom-8 left-0 whitespace-nowrap rounded-lg border border-white/10 bg-black/85 px-2.5 py-1.5 text-xs font-medium text-white shadow-xl">
                      {label}
                    </span>
                  </motion.div>
                ))}
              </div>

              <div className="grid gap-3">
                {attentionFindings.map(([label, value], index) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: index * 0.08 }}
                    className="rounded-xl border border-white/[0.08] bg-white/[0.035] p-4"
                  >
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">
                      {label}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-zinc-200">{value}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </AnimatedSection>
    </>
  );
}
