const clamp = (value) => Math.max(0, Math.min(100, Math.round(value)));

const average = (values) => {
  if (!values.length) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
};

const regionTypeLabels = {
  ignored_cta: 'Ignored CTA',
  confusion: 'Confusion',
  repeated_click: 'Repeated Clicks',
  dead_end: 'Dead Ends',
  exit_point: 'Exit Points',
};

export const getDashboardData = (result) => {
  const simulations = result?.simulations || [];
  const regions = result?.heatmap?.regions || [];
  const avgPurchase = average(simulations.map((simulation) => simulation.purchaseProbability));
  const avgConfidence = average(simulations.map((simulation) => simulation.confidence));
  const confusionCount = simulations.reduce(
    (total, simulation) => total + simulation.confusion.length,
    0,
  );
  const exitCount = simulations.filter(
    (simulation) => simulation.exitReason && simulation.exitReason.toLowerCase() !== 'none',
  ).length;
  const deadEndIntensity = regions
    .filter((region) => region.type === 'dead_end' || region.type === 'exit_point')
    .reduce((total, region) => total + region.intensity, 0);
  const ctaIgnored = regions
    .filter((region) => region.type === 'ignored_cta')
    .reduce((total, region) => total + region.intensity, 0);

  const conversionScore = clamp(avgPurchase * 100);
  const trustScore = clamp(avgConfidence * 78 + conversionScore * 0.22 - ctaIgnored * 12);
  const accessibility = clamp(88 - confusionCount * 4 - deadEndIntensity * 8);
  const confusion = clamp((confusionCount / Math.max(simulations.length, 1)) * 38 + ctaIgnored * 24);
  const expectedBounce = clamp(100 - conversionScore + confusion * 0.35 + exitCount * 3);
  const dropOff = clamp(deadEndIntensity * 22 + exitCount * 7 + (100 - trustScore) * 0.22);

  const regionBreakdown = Object.entries(regionTypeLabels).map(([type, label]) => {
    const matchingRegions = regions.filter((region) => region.type === type);
    return {
      type,
      label,
      value: clamp(average(matchingRegions.map((region) => region.intensity)) * 100),
      count: matchingRegions.length,
    };
  });

  const recommendations = [
    {
      title: 'Make the primary CTA harder to miss',
      detail:
        ctaIgnored > 0
          ? 'Heatmap activity suggests the main action is being overlooked by part of the audience.'
          : 'Keep the primary action visible across the hero and decision points.',
      priority: ctaIgnored > 0 ? 'High' : 'Medium',
    },
    {
      title: 'Reduce hesitation around proof',
      detail:
        trustScore < 72
          ? 'Add customer proof, measurable outcomes, or security cues near the first conversion moment.'
          : 'Trust cues are viable; keep proof close to the conversion path.',
      priority: trustScore < 72 ? 'High' : 'Medium',
    },
    {
      title: 'Remove dead-end paths',
      detail:
        dropOff > 45
          ? 'Simulated users are finding paths that do not clearly resolve their intent.'
          : 'Preserve clear next steps after exploratory clicks.',
      priority: dropOff > 45 ? 'High' : 'Low',
    },
    {
      title: 'Clarify post-click expectations',
      detail:
        confusion > 35
          ? 'Set clearer expectations for what happens after upload, signup, or CTA engagement.'
          : 'The flow is understandable; reinforce the outcome in CTA-adjacent copy.',
      priority: confusion > 35 ? 'High' : 'Medium',
    },
  ];

  return {
    cards: [
      { label: 'Conversion Score', value: conversionScore, tone: 'emerald' },
      { label: 'Trust Score', value: trustScore, tone: 'sky' },
      { label: 'Accessibility', value: accessibility, tone: 'violet' },
      { label: 'Confusion', value: confusion, tone: 'amber', inverse: true },
      { label: 'Expected Bounce', value: expectedBounce, tone: 'red', inverse: true },
      { label: 'Drop Off', value: dropOff, tone: 'fuchsia', inverse: true },
    ],
    regionBreakdown,
    recommendations,
    conversionScore,
    expectedBounce,
  };
};

export const clampPercentage = clamp;
