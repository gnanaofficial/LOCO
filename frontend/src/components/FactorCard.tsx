import React from 'react';
import type { Factor } from '../types';
import { CheckCircle2, AlertTriangle, Mountain, Thermometer, Cloud } from 'lucide-react';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { FactorScene } from './FactorScene';

interface FactorCardProps {
  factor: Factor;
}

export const FactorCard: React.FC<FactorCardProps> = ({ factor }) => {
  const isAvailable = factor.status === 'available';

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse') return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((event.clientY - rect.top) / rect.height) * 2 - 1;
    event.currentTarget.style.setProperty('--tilt-x', `${(-y * 2.2).toFixed(2)}deg`);
    event.currentTarget.style.setProperty('--tilt-y', `${(x * 2.8).toFixed(2)}deg`);
    event.currentTarget.style.setProperty('--pointer-x', `${((x + 1) * 50).toFixed(1)}%`);
    event.currentTarget.style.setProperty('--rain-angle', `${(x * 14).toFixed(1)}deg`);
  };

  const handlePointerLeave = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.style.setProperty('--tilt-x', '0deg');
    event.currentTarget.style.setProperty('--tilt-y', '0deg');
    event.currentTarget.style.setProperty('--pointer-x', '50%');
    event.currentTarget.style.setProperty('--rain-angle', '0deg');
  };

  const getFactorIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'elevation':
        return <Mountain className="w-4 h-4 text-zinc-300" />;
      case 'temperature':
        return <Thermometer className="w-4 h-4 text-orange-300" />;
      case 'weather condition':
        return <Cloud className="w-4 h-4 text-zinc-300" />;
      default:
        return null;
    }
  };

  return (
    <Card
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="factor-card flex flex-col justify-between overflow-hidden p-4 transition-[border-color,transform] duration-300 hover:border-white/20 sm:p-5"
    >
      <div>
        {/* Header */}
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.045]">
              {getFactorIcon(factor.factor_name)}
            </div>
            <h4 className="font-semibold text-slate-100 text-sm">{factor.factor_name}</h4>
          </div>

          {isAvailable ? (
            <Badge variant="outline" className="shrink-0 text-[10px] text-zinc-400">
              <CheckCircle2 className="size-3 text-zinc-500" /> Ready
            </Badge>
          ) : (
            <Badge variant="warning">
              <AlertTriangle className="w-3 h-3" /> Unavailable
            </Badge>
          )}
        </div>

        {isAvailable && <FactorScene factorName={factor.factor_name} value={factor.raw_value} />}

        <div className="mt-4 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <span className="mb-1 block text-[10px] font-medium uppercase tracking-[0.12em] text-slate-500">Observed value</span>
            <span className={`block truncate text-base font-semibold tracking-tight ${isAvailable ? 'text-slate-100' : 'text-slate-400 italic'}`}>
              {isAvailable && factor.raw_value !== null ? factor.raw_value : 'Unavailable'}
            </span>
          </div>
          <div className="shrink-0 text-right">
            <span className="mb-1 block text-[10px] font-medium uppercase tracking-[0.12em] text-slate-500">Score</span>
            {isAvailable && factor.points !== null ? (
              <span className="text-base font-semibold tabular-nums text-zinc-100">
                {factor.points}<span className="ml-1 text-xs font-normal text-slate-500">/ {factor.max_points}</span>
              </span>
            ) : (
              <span className="text-xs font-medium text-amber-200">Not scored</span>
            )}
          </div>
        </div>

        {!isAvailable && factor.reason && <p className="mt-3 text-xs leading-5 text-amber-200/80">{factor.reason}</p>}
      </div>

      {/* Footer / Data Source */}
      <div className="mt-4 pt-3 border-t border-white/[0.07] flex items-center justify-between text-[11px] text-slate-400">
        <span>Data Source</span>
        <span className="font-medium text-slate-300 bg-white/[0.055] px-2 py-0.5 rounded-md">
          {factor.source}
        </span>
      </div>
    </Card>
  );
};
