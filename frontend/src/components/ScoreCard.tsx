import React from 'react';
import type { Assessment } from '../types';
import { Card } from './ui/card';

interface ScoreCardProps {
  assessment: Assessment;
}

export const ScoreCard: React.FC<ScoreCardProps> = ({ assessment }) => {
  const availableCount = assessment.factors.filter((f) => f.status === 'available').length;
  const totalCount = assessment.factors.length;
  const scoreValue = assessment.total_score === null
    ? 0
    : Math.min(100, Math.max(0, assessment.total_score));

  const getScoreColorClass = (score: number | null) => {
    if (score === null) return 'text-slate-400';
    if (score >= 80) return 'text-emerald-300';
    if (score >= 60) return 'text-zinc-200';
    if (score >= 40) return 'text-amber-300';
    return 'text-rose-300';
  };

  return (
    <Card className="relative flex flex-col items-center justify-center overflow-hidden p-6 text-center">
      <span className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
        Location Score
      </span>

      <div
        className="score-gauge"
        role="progressbar"
        aria-label="Location score"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={scoreValue}
        aria-valuetext={assessment.total_score === null ? 'Score unavailable' : `${scoreValue} out of 100`}
        style={{ '--score-progress': `${scoreValue}%` } as React.CSSProperties}
      >
        <div className="score-gauge__inner">
          <span className={`text-4xl font-bold tracking-tight ${getScoreColorClass(assessment.total_score)}`}>
            {assessment.total_score !== null ? assessment.total_score : 'N/A'}
          </span>
          <span className="-mt-1 text-xs font-medium text-slate-400">OUT OF 100</span>
        </div>
      </div>

      <p className="mt-4 text-xs font-medium text-slate-400">
        {availableCount} of {totalCount} factors available
      </p>

      {availableCount < totalCount && (
        <p className="text-[11px] text-amber-300 bg-amber-400/10 px-2.5 py-1 rounded-md mt-3 border border-amber-300/20 font-medium">
          Score scaled across available factors
        </p>
      )}
    </Card>
  );
};
