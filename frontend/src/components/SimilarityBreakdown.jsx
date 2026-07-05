import React from 'react';

export default function SimilarityBreakdown({ breakdown, analytics }) {
  const isAi = !!analytics?.similarityBreakdown;
  const sim = analytics?.similarityBreakdown || {};

  const metrics = isAi ? [
    { label: 'Image Similarity', value: sim.imageSimilarity ?? 0 },
    { label: 'Semantic Similarity', value: sim.semanticSimilarity ?? 0 },
    { label: 'Category Match', value: sim.categoryMatch ?? 0 },
    { label: 'Location Match', value: sim.locationMatch ?? 0 },
    { label: 'Date Match', value: sim.dateMatch ?? 0 },
  ] : [
    { label: 'Category Match', value: breakdown?.category ?? 0 },
    { label: 'Title Similarity', value: breakdown?.title ?? 0 },
    { label: 'Description Similarity', value: breakdown?.description ?? 0 },
    { label: 'Location Similarity', value: breakdown?.location ?? 0 },
    { label: 'Date Similarity', value: breakdown?.date ?? 0 },
  ];

  return (
    <div className="space-y-4">
      {metrics.map((metric) => (
        <div key={metric.label}>
          <div className="flex justify-between text-xs font-medium text-zinc-400 mb-1.5">
            <span>{metric.label}</span>
            <span className="text-white">{metric.value}%</span>
          </div>
          <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-zinc-300 h-full rounded-full" 
              style={{ width: `${metric.value}%` }} 
            />
          </div>
        </div>
      ))}
    </div>
  );
}
