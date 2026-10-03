import React from 'react';
import type { Assessment } from '../types';
import { BarChart3, AlertTriangle, MapPin } from 'lucide-react';
import { Card } from './ui/card';

interface StatsSummaryProps {
  assessments: Assessment[];
}

export const StatsSummary: React.FC<StatsSummaryProps> = ({ assessments }) => {
  const totalCount = assessments.length;

  const validScores = assessments
    .map((a) => a.total_score)
    .filter((s): s is number => s !== null);

  const avgScore =
    validScores.length > 0
      ? (validScores.reduce((acc, s) => acc + s, 0) / validScores.length).toFixed(1)
      : 'N/A';

  let unavailableFactorsCount = 0;
  assessments.forEach((a) => {
    a.factors.forEach((f) => {
      if (f.status === 'unavailable') {
        unavailableFactorsCount += 1;
      }
    });
  });

  return (
    <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {/* Total Assessments Card */}
      <Card className="group flex items-center justify-between overflow-hidden p-5 transition-colors hover:border-white/15">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Total Assessments
          </p>
          <p className="text-3xl font-semibold tracking-tight text-slate-100">{totalCount}</p>
        </div>
        <div className="flex size-11 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.045] text-zinc-300 shadow-inner">
          <MapPin className="size-5" />
        </div>
      </Card>

      {/* Average Score Card */}
      <Card className="group flex items-center justify-between overflow-hidden p-5 transition-colors hover:border-white/15">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Average Score
          </p>
          <div className="flex items-baseline gap-1">
            <p className="text-3xl font-semibold tracking-tight text-slate-100">{avgScore}</p>
            {avgScore !== 'N/A' && <span className="text-xs text-slate-400 font-medium">/ 100</span>}
          </div>
        </div>
        <div className="flex size-11 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.045] text-zinc-300 shadow-inner">
          <BarChart3 className="size-5" />
        </div>
      </Card>

      {/* Unavailable Factors Card */}
      <Card className="group flex items-center justify-between overflow-hidden p-5 transition-colors hover:border-white/15">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Unavailable Factors
          </p>
          <p className="text-3xl font-semibold tracking-tight text-slate-100">{unavailableFactorsCount}</p>
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
          unavailableFactorsCount > 0 ? 'bg-amber-400/10 text-amber-300' : 'bg-white/[0.055] text-slate-400'
        }`}>
          <AlertTriangle className="w-5 h-5" />
        </div>
      </Card>
    </div>
  );
};
