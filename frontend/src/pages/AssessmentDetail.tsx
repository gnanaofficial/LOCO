import React, { useCallback, useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { fetchAssessmentById } from '../api/client';
import type { Assessment } from '../types';
import { ScoreCard } from '../components/ScoreCard';
import { FactorCard } from '../components/FactorCard';
import { ScoreBreakdown } from '../components/ScoreBreakdown';
import { ArrowLeft, MapPin, Calendar, Globe, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { AssessmentLoading } from '../components/AssessmentLoading';

export const AssessmentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const passedAssessment = (location.state as { assessment?: Assessment } | null)?.assessment;
  const initialAssessment: Assessment | null = (passedAssessment && passedAssessment.id === id) ? passedAssessment : null;

  const [assessment, setAssessment] = useState<Assessment | null>(initialAssessment);
  const [loading, setLoading] = useState<boolean>(!initialAssessment);
  const [error, setError] = useState<string | null>(null);

  const loadAssessment = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAssessmentById(id);
      setAssessment(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load assessment details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (initialAssessment) {
      setAssessment(initialAssessment);
      setError(null);
      setLoading(false);
    } else {
      loadAssessment();
    }
  }, [id, initialAssessment, loadAssessment]);

  if (loading) {
    return <AssessmentLoading />;
  }

  if (error || !assessment) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="mb-6 flex items-center justify-center gap-3 rounded-xl border border-rose-300/20 bg-rose-400/10 p-4 text-sm text-rose-200">
          <AlertCircle className="w-5 h-5 text-rose-300 shrink-0" />
          <span>{error || 'Assessment not found.'}</span>
        </div>
        <Link
          to="/assessments"
          className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-300 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Assessments
        </Link>
      </div>
    );
  }

  const formattedDate = new Date(assessment.created_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      {/* Back button & Page Header */}
      <div>
        <Link
          to="/assessments"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-100 transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Assessments
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
              {assessment.label}
            </h1>
            <p className="mt-1 flex items-center gap-2 text-sm text-slate-400">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{assessment.address || 'Direct Coordinate Input'}</span>
            </p>
          </div>

          <Button
            onClick={loadAssessment}
            variant="glass"
            size="sm"
            className="self-start sm:self-auto"
          >
            <RefreshCw /> Refresh
          </Button>
        </div>
      </div>

      {/* Top Section: Score Card + Location Details */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <ScoreCard assessment={assessment} />
        </div>

        <Card className="p-4 sm:p-5 lg:col-span-8">
          <div>
            <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              Location Details
            </h3>

            <div className="grid grid-cols-1 gap-2.5 text-xs sm:grid-cols-2">
              <div className="glass-inset min-w-0 rounded-xl px-3.5 py-3">
                <span className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-slate-500">
                  Address
                </span>
                <span className="block truncate text-sm font-semibold text-slate-100">
                  {assessment.address || 'N/A (Coordinates provided)'}
                </span>
              </div>

              <div className="glass-inset min-w-0 rounded-xl px-3.5 py-3">
                <span className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-slate-500">
                  Coordinates
                </span>
                <span className="flex items-center gap-1.5 font-mono text-sm font-semibold text-slate-100">
                  <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  {assessment.latitude.toFixed(4)}, {assessment.longitude.toFixed(4)}
                </span>
              </div>

              <div className="flex min-w-0 items-center justify-between gap-3 px-1 pt-1 sm:col-span-2">
                <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Assessed</span>
                <span className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-slate-300">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{formattedDate}</span>
                </span>
              </div>
            </div>
          </div>
          <ScoreBreakdown compact factors={assessment.factors} totalScore={assessment.total_score} />
        </Card>
      </div>

      {/* Factor Breakdown Section */}
      <div>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-100">
            Assessment Breakdown
            </h2>
            <p className="text-xs text-slate-400">Live conditions and the points each one earned.</p>
          </div>
          <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-slate-500">{assessment.factors.length} factors</span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {assessment.factors.map((factor) => (
            <FactorCard key={factor.id} factor={factor} />
          ))}
        </div>
      </div>
    </div>
  );
};
