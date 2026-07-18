import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

const regionStyles = {
  ignored_cta: {
    label: 'Ignored CTA',
    ring: 'ring-zinc-200/70',
    fill: 'bg-zinc-200/20',
    glow: 'shadow-[0_0_48px_rgba(228,228,231,0.35)]',
  },
  confusion: {
    label: 'Confusion',
    ring: 'ring-amber-300/80',
    fill: 'bg-amber-300/20',
    glow: 'shadow-[0_0_48px_rgba(252,211,77,0.34)]',
  },
  repeated_click: {
    label: 'Repeated Clicks',
    ring: 'ring-sky-300/80',
    fill: 'bg-sky-300/20',
    glow: 'shadow-[0_0_48px_rgba(125,211,252,0.34)]',
  },
  dead_end: {
    label: 'Dead Ends',
    ring: 'ring-red-300/80',
    fill: 'bg-red-300/20',
    glow: 'shadow-[0_0_48px_rgba(252,165,165,0.34)]',
  },
  exit_point: {
    label: 'Exit Points',
    ring: 'ring-fuchsia-300/80',
    fill: 'bg-fuchsia-300/20',
    glow: 'shadow-[0_0_48px_rgba(240,171,252,0.34)]',
  },
};

const getRegionStyle = (type) => regionStyles[type] || regionStyles.confusion;

export function HeatmapOverlay({ heatmap, screenshotUrl }) {
  if (!heatmap?.regions?.length || !screenshotUrl) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="mb-5 overflow-hidden rounded-lg border border-white/[0.1] bg-[#09090a] p-3 shadow-2xl shadow-black/30"
    >
      <div className="flex flex-col gap-4 border-b border-white/[0.08] px-2 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-500">Heatmap Overlay</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-normal text-white">
            Behavioral friction map
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
            {heatmap.summary}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(regionStyles).map(([type, style]) => (
            <span
              key={type}
              className={`rounded-md px-2.5 py-1 text-xs text-white ring-1 ${style.ring} ${style.fill}`}
            >
              {style.label}
            </span>
          ))}
        </div>
      </div>

      <div className="relative mt-3 overflow-hidden rounded-md border border-white/[0.08] bg-black">
        <img
          src={screenshotUrl}
          alt="Uploaded screenshot with heatmap overlay"
          className="block max-h-[46rem] w-full object-contain"
        />

        <div className="pointer-events-none absolute inset-0">
          {heatmap.regions.map((region, index) => {
            const style = getRegionStyle(region.type);

            return (
              <motion.div
                key={region.id}
                initial={{ opacity: 0, scale: 0.86 }}
                animate={{
                  opacity: Math.max(region.intensity, 0.35),
                  scale: [1, 1.035, 1],
                }}
                transition={{
                  opacity: { duration: 0.35, delay: index * 0.06 },
                  scale: {
                    duration: 2.4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: index * 0.12,
                  },
                }}
                className={`absolute rounded-lg ring-2 ${style.ring} ${style.fill} ${style.glow}`}
                style={{
                  left: `${region.x * 100}%`,
                  top: `${region.y * 100}%`,
                  width: `${region.width * 100}%`,
                  height: `${region.height * 100}%`,
                }}
              >
                <div className="absolute -top-8 left-0 max-w-56 rounded-md border border-white/10 bg-black/85 px-2.5 py-1.5 text-xs text-white shadow-xl backdrop-blur">
                  {style.label}: {region.label}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-2">
        {heatmap.regions.map((region) => {
          const style = getRegionStyle(region.type);

          return (
            <div
              key={`${region.id}-evidence`}
              className="rounded-md border border-white/[0.08] bg-white/[0.025] p-3"
            >
              <p className="text-xs font-medium text-zinc-400">{style.label}</p>
              <p className="mt-1 text-sm text-white">{region.label}</p>
              <p className="mt-2 text-xs leading-5 text-zinc-500">{region.evidence}</p>
            </div>
          );
        })}
      </div>
    </motion.section>
  );
}

HeatmapOverlay.propTypes = {
  heatmap: PropTypes.shape({
    summary: PropTypes.string.isRequired,
    regions: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        type: PropTypes.oneOf([
          'ignored_cta',
          'confusion',
          'repeated_click',
          'dead_end',
          'exit_point',
        ]).isRequired,
        label: PropTypes.string.isRequired,
        x: PropTypes.number.isRequired,
        y: PropTypes.number.isRequired,
        width: PropTypes.number.isRequired,
        height: PropTypes.number.isRequired,
        intensity: PropTypes.number.isRequired,
        evidence: PropTypes.string.isRequired,
      }),
    ).isRequired,
  }),
  screenshotUrl: PropTypes.string,
};
