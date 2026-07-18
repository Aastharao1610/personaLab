import { motion } from 'framer-motion';
import { AnimatedSection } from './AnimatedSection.jsx';
import { Button } from './Button.jsx';

const reasons = [
  'Primary CTA ignored by 37 simulated users',
  'Trust proof appears after hesitation point',
  'Pricing question causes repeated navigation loops',
  'Mobile path creates two dead ends',
];

export function CTA() {
  return (
    <AnimatedSection className="relative border-t border-white/[0.08] px-6 py-24 sm:py-28">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <p className="text-sm font-medium text-zinc-500">Launch Confidence</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-normal text-white sm:text-5xl">
            Would you launch?
          </h2>
          <p className="mt-5 max-w-xl text-base leading-7 text-zinc-400">
            PersonaLab gives you the answer before real customers pay the price
            for unclear flows, weak proof, or hidden conversion blockers.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button href="#upload">Test your screenshot</Button>
            <Button href="#simulation" variant="secondary">
              Review simulation
            </Button>
          </div>
        </div>

        <div className="rounded-lg border border-white/[0.1] bg-[#09090a] p-5 shadow-2xl shadow-black/30">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-zinc-500">Launch Score</p>
              <p className="mt-2 text-6xl font-semibold text-white">42%</p>
            </div>
            <span className="rounded-md border border-red-300/20 bg-red-300/10 px-3 py-1.5 text-sm text-red-200">
              No
            </span>
          </div>
          <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/[0.08]">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: '42%' }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="h-full rounded-full bg-red-300"
            />
          </div>
          <div className="mt-6 space-y-3">
            {reasons.map((reason, index) => (
              <motion.div
                key={reason}
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: index * 0.06 }}
                className="rounded-md border border-white/[0.08] bg-white/[0.025] p-3 text-sm leading-6 text-zinc-300"
              >
                {reason}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
}
