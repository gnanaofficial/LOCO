import React from 'react';
import { Activity, Database, MapPin, Sparkles } from 'lucide-react';
import { Badge } from './ui/badge';
import { GatewayFlow } from './ui/gateway-flow';

const loadingStages = [
  { icon: MapPin, label: 'Location' },
  { icon: Database, label: 'Public data' },
  { icon: Sparkles, label: 'Score' },
];

interface AssessmentLoadingProps {
  title?: string;
  description?: string;
}

export const AssessmentLoading: React.FC<AssessmentLoadingProps> = ({
  title = 'Gathering location data',
  description = 'Collecting available factors and preparing your location score.',
}) => (
  <div className="mx-auto flex min-h-[68vh] max-w-7xl items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
    <section className="glass-panel relative isolate flex min-h-[440px] w-full max-w-4xl items-center overflow-hidden rounded-[2rem]">
      <GatewayFlow className="opacity-70" density={1.05} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(9,9,11,0.28),rgba(9,9,11,0.93)_78%)]" />

        <div className="relative z-10 grid w-full gap-8 px-6 py-10 md:grid-cols-[1fr_0.72fr] md:items-center md:px-12">
        <div>
          <Badge variant="outline" className="mb-5 gap-2 px-3 py-1.5 text-[11px] tracking-[0.12em] text-zinc-300">
            <Activity className="size-3.5 animate-pulse" /> ASSESSMENT IN PROGRESS
          </Badge>
          <h1 className="max-w-lg text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-zinc-400 sm:text-base">
            {description}
          </p>

          <div className="mt-8 grid grid-cols-3 gap-2 sm:gap-3">
            {loadingStages.map(({ icon: Icon, label }, index) => (
              <div key={label} className="glass-inset flex min-w-0 flex-col items-center gap-2 rounded-xl px-2 py-3 text-center sm:flex-row sm:justify-center sm:px-3">
                <Icon className={`size-4 shrink-0 ${index === 1 ? 'animate-pulse text-zinc-100' : 'text-zinc-400'}`} />
                <span className="truncate text-[11px] font-medium text-zinc-300 sm:text-xs">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel relative mx-auto w-full max-w-xs overflow-hidden rounded-2xl p-5 shadow-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Live collection</span>
            <span className="flex size-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-zinc-300">
              <Sparkles className="size-4" />
            </span>
          </div>
          <div className="mt-7 flex items-center gap-3">
            <span className="relative flex size-10 shrink-0 items-center justify-center rounded-full border border-white/[0.12] bg-white/[0.045] text-zinc-200">
              <Activity className="size-4" />
              <span className="absolute -right-0.5 -top-0.5 size-2.5 animate-ping rounded-full bg-zinc-200/70" />
            </span>
            <div>
              <p className="text-sm font-medium text-zinc-100">Collecting location signals</p>
              <p className="mt-1 text-xs text-zinc-500">The score appears as soon as data is ready.</p>
            </div>
          </div>
          <div className="mt-7 border-t border-white/[0.07] pt-4 text-xs leading-5 text-zinc-500">
            Location, elevation, temperature, and weather are being brought together for this assessment.
          </div>
        </div>
      </div>
    </section>
  </div>
);
