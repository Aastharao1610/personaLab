import { motion } from 'framer-motion';
import { AnimatedSection } from './AnimatedSection.jsx';
import { SectionHeader } from './SectionHeader.jsx';

const featureCards = [
  {
    name: 'Goal Fit',
    signal: 'User intent',
    first: 'Primary task clarity',
    second: 'Motivation strength',
    third: 'Expected next step',
  },
  {
    name: 'Trust Readiness',
    signal: 'Decision support',
    first: 'Visible proof',
    second: 'Risk reduction',
    third: 'Confidence to proceed',
  },
  {
    name: 'Friction Points',
    signal: 'UX resistance',
    first: 'Unclear paths',
    second: 'Missing details',
    third: 'Likely hesitation',
  },
  {
    name: 'Conversion Path',
    signal: 'Action clarity',
    first: 'CTA relevance',
    second: 'Journey continuity',
    third: 'Readiness to act',
  },
];

export function Features() {
  return (
    <AnimatedSection
      id="thinking"
      className="border-t border-white/[0.08] px-6 py-24 sm:py-28"
    >
      <div className="mx-auto max-w-6xl">
        <SectionHeader
          eyebrow="Simulated Users"
          title="Your product is tested by users with goals, doubts, and decision patterns."
          description="PersonaLab turns the page into evidence: what users notice, what they ignore, what creates hesitation, and why they leave."
        />

        <div className="mt-14 grid gap-4 md:grid-cols-2">
          {featureCards.map((card, index) => (
            <motion.article
              key={card.name}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="rounded-lg border border-white/[0.08] bg-[#09090a] p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-medium text-white">{card.name}</h3>
                  <p className="mt-1 text-sm text-zinc-500">{card.signal}</p>
                </div>
                <motion.div
                  animate={{ scale: [1, 1.08, 1], opacity: [0.75, 1, 0.75] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: index * 0.2 }}
                  className="h-3 w-3 rounded-full bg-white"
                />
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {[
                  ['Input', card.first],
                  ['Signal', card.second],
                  ['Output', card.third],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-md border border-white/[0.08] bg-white/[0.025] p-3 sm:last:col-span-2"
                  >
                    <p className="text-xs text-zinc-500">{label}</p>
                    <p className="mt-2 text-sm leading-6 text-zinc-300">{value}</p>
                  </div>
                ))}
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </AnimatedSection>
  );
}
