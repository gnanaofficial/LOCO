import React from 'react';
import type { Factor } from '../types';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface ScoreBreakdownProps {
  factors: Factor[];
  totalScore: number | null;
  compact?: boolean;
}

const ScoreSegments: React.FC<{ percentage: number; label: string }> = ({ percentage, label }) => {
  const filled = Math.round(percentage / 10);
  return (
    <div className="score-segments" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(percentage)}>
      {Array.from({ length: 10 }, (_, index) => (
        <span key={index} className={index < filled ? 'score-segments__cell is-filled' : 'score-segments__cell'} />
      ))}
    </div>
  );
};

export const ScoreBreakdown: React.FC<ScoreBreakdownProps> = ({ factors, totalScore, compact = false }) => {
  if (compact) {
    return (
      <section aria-label="Score calculation" className="mt-4 border-t border-white/[0.07] pt-3">
        <div className="mb-2.5 flex items-center justify-between gap-3">
          <div>
            <h4 className="text-[11px] font-semibold text-zinc-200">Score calculation</h4>
            <p className="text-[10px] text-zinc-500">Points contributed by each factor</p>
          </div>
          {totalScore !== null && (
            <span className="shrink-0 rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-xs font-semibold tabular-nums text-zinc-100">
              {totalScore}<span className="ml-1 text-[10px] font-normal text-zinc-500">/ 100</span>
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {factors.map((factor) => {
            const isAvailable = factor.status === 'available' && factor.points !== null;
            const percentage = isAvailable && factor.max_points > 0 ? (factor.points! / factor.max_points) * 100 : 0;
            return (
              <div key={factor.id} className="glass-inset min-w-0 rounded-lg px-2.5 py-2">
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <span className="truncate text-[10px] font-medium text-zinc-400">{factor.factor_name}</span>
                  <span className="shrink-0 text-[10px] font-semibold tabular-nums text-zinc-200">
                    {isAvailable ? `${factor.points} / ${factor.max_points}` : '—'}
                  </span>
                </div>
                {isAvailable ? <ScoreSegments percentage={percentage} label={`${factor.factor_name} score`} /> : <p className="text-[10px] text-zinc-500">Not scored</p>}
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <Card className="p-0">
      <CardHeader className="flex-row items-end justify-between gap-4 p-5 pb-0 sm:p-6 sm:pb-0">
        <div>
          <CardTitle className="text-base">Score calculation</CardTitle>
          <p className="mt-1 text-xs text-zinc-400">How each factor contributes to the final score.</p>
        </div>
        <span className="hidden rounded-full border border-white/[0.07] bg-white/[0.025] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-zinc-500 sm:inline-flex">Factor points</span>
      </CardHeader>

      <CardContent className="grid gap-3 px-5 pb-5 pt-4 sm:grid-cols-2 sm:px-6 sm:pb-6">
        {factors.map((factor) => {
          const isAvailable = factor.status === 'available' && factor.points !== null;
          const percentage = isAvailable ? (factor.points! / factor.max_points) * 100 : 0;

          return (
            <div key={factor.id} className="glass-inset rounded-xl px-4 py-3">
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="truncate text-sm font-medium text-zinc-200">{factor.factor_name}</span>
                <div className="flex items-center gap-2">
                  {isAvailable ? (
                    <>
                      <span className="text-sm font-semibold tabular-nums text-zinc-100">
                        {factor.points}<span className="ml-1 font-normal text-zinc-500">/ {factor.max_points}</span>
                      </span>
                      <Badge variant="outline" className="px-2 py-0.5 text-[10px] text-zinc-400">{Math.round(percentage)}%</Badge>
                    </>
                  ) : (
                    <Badge variant="warning">Not scored</Badge>
                  )}
                </div>
              </div>
              {isAvailable ? (
                <ScoreSegments percentage={percentage} label={`${factor.factor_name} score`} />
              ) : (
                <p className="text-xs text-zinc-500">No points contributed</p>
              )}
            </div>
          );
        })}

        <div className="flex items-center justify-between gap-4 rounded-xl border border-white/[0.08] bg-white/[0.035] px-4 py-3.5 sm:col-span-2">
          <div>
            <p className="text-sm font-semibold text-zinc-100">Final score</p>
            <p className="mt-0.5 text-[11px] text-zinc-500">Normalized across available factors</p>
          </div>
          {totalScore !== null ? (
            <span className="text-xl font-semibold tabular-nums text-zinc-100">
              {totalScore} <span className="text-sm font-normal text-zinc-500">/ 100</span>
            </span>
          ) : (
            <span className="text-sm text-zinc-400">Not available</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
