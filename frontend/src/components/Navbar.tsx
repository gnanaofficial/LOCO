import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MapPin, Plus, List, RefreshCw } from 'lucide-react';
import { Button, ButtonLink } from './ui/button';

interface NavbarProps {
  onRefresh: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onRefresh }) => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#09090b]/75 backdrop-blur-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand */}
        <Link to="/assessments" className="flex items-center space-x-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/25 bg-gradient-to-br from-zinc-100 to-zinc-500 text-zinc-950 shadow-[0_5px_24px_rgba(255,255,255,0.1)] transition-transform group-hover:scale-[1.04]">
            <MapPin className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold leading-none tracking-tight text-slate-100">
              LOCO
            </span>
            <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-400">
              Location Assessment
            </span>
          </div>
        </Link>

        {/* Right: Actions */}
        <nav className="flex items-center gap-2 sm:gap-3">
          <ButtonLink
            to="/assessments"
            variant={isActive('/assessments') ? 'glass' : 'ghost'}
            size="sm"
            className={`gap-2 ${
              isActive('/assessments')
                ? 'text-slate-100'
                : 'text-slate-400'
            }`}
          >
            <List className="w-4 h-4" />
            <span className="hidden sm:inline">Assessments</span>
          </ButtonLink>

          {isActive('/assessments') && (
            <Button
              onClick={onRefresh}
              variant="glass"
              size="icon"
              title="Refresh assessments"
              aria-label="Refresh assessments"
              className="size-9 sm:size-10"
            >
              <RefreshCw />
            </Button>
          )}

          {location.pathname !== '/assessments/new' && (
            <ButtonLink to="/assessments/new" variant="primary" size="sm" className="sm:h-10 sm:px-4">
              <Plus className="stroke-[2.5]" />
              <span>New Assessment</span>
            </ButtonLink>
          )}
        </nav>
      </div>
    </header>
  );
};
