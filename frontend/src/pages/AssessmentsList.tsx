import React, { useEffect, useState } from 'react';
import { fetchAssessments } from '../api/client';
import type { Assessment } from '../types';
import { StatsSummary } from '../components/StatsSummary';
import { AssessmentTable } from '../components/AssessmentTable';
import { AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';

interface AssessmentsListProps {
  refreshSignal: number;
}

export const AssessmentsList: React.FC<AssessmentsListProps> = ({ refreshSignal }) => {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAssessments();
      setAssessments(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load assessments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [refreshSignal]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 bg-rose-400/10 border border-rose-300/20 rounded-xl text-rose-200 flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-300 shrink-0" />
          <div className="flex-1">{error}</div>
          <Button onClick={loadData} variant="ghost" size="sm" className="text-rose-200 hover:bg-rose-400/10 hover:text-white">
            Retry
          </Button>
        </div>
      )}

      {/* Loading Skeletons */}
      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-white/[0.04] animate-pulse" />
            ))}
          </div>
          <div className="h-64 rounded-xl bg-white/[0.04] animate-pulse" />
        </div>
      ) : (
        <>
          <StatsSummary assessments={assessments} />
          <AssessmentTable assessments={assessments} />
        </>
      )}
    </div>
  );
};
