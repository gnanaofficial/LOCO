import React from 'react';
import { Link } from 'react-router-dom';
import type { Assessment } from '../types';
import { MapPin, Calendar, ArrowUpRight } from 'lucide-react';
import { ButtonLink } from './ui/button';
import { AssessmentStatusBadge } from './AssessmentStatusBadge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

interface AssessmentTableProps {
  assessments: Assessment[];
}

export const AssessmentTable: React.FC<AssessmentTableProps> = ({ assessments }) => {
  if (assessments.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-12 text-center max-w-lg mx-auto my-8">
        <div className="w-12 h-12 bg-white/[0.06] text-zinc-200 rounded-full flex items-center justify-center mx-auto mb-4">
          <MapPin className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-semibold text-slate-100 mb-1">No assessments yet</h3>
        <p className="text-sm text-slate-400 leading-relaxed">
          Use the New Assessment action above to retrieve public location data and calculate a score.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="glass-panel hidden overflow-hidden rounded-2xl lg:block">
        <Table className="min-w-[900px]">
          <TableHeader className="bg-white/[0.035]">
            <tr>
              <TableHead>Location</TableHead>
              <TableHead>Address / Coords</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Factors</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </tr>
          </TableHeader>
          <TableBody className="text-slate-300">
            {assessments.map((item) => {
              const availableFactors = item.factors.filter((f) => f.status === 'available').length;
              const totalFactors = item.factors.length;
              const isAllAvailable = availableFactors === totalFactors && totalFactors > 0;
              const formattedDate = new Date(item.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });

              return (
                <TableRow key={item.id}>
                  <TableCell className="font-medium text-slate-100 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{item.label}</span>
                    </div>
                  </TableCell>

                  <TableCell className="max-w-xs break-words leading-snug text-slate-300/90">
                    {item.address ? (
                      item.address
                    ) : (
                      <span className="font-mono text-xs text-slate-400">
                        {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
                      </span>
                    )}
                  </TableCell>

                  <TableCell className="whitespace-nowrap">
                    {item.total_score !== null ? (
                      <div className="flex items-baseline gap-1">
                        <span className="font-bold text-slate-100 text-base">
                          {item.total_score}
                        </span>
                        <span className="text-slate-400 text-xs">/ 100</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-xs">Unavailable</span>
                    )}
                  </TableCell>

                  <TableCell className="whitespace-nowrap text-xs text-slate-300/90">
                    <span className="font-medium text-slate-100">
                      {availableFactors} / {totalFactors}
                    </span>{' '}
                    available
                  </TableCell>

                  <TableCell className="whitespace-nowrap text-xs text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formattedDate}</span>
                    </div>
                  </TableCell>

                  <TableCell className="whitespace-nowrap">
                    <AssessmentStatusBadge complete={isAllAvailable} />
                  </TableCell>

                  <TableCell className="whitespace-nowrap text-right">
                    <ButtonLink
                      to={`/assessments/${item.id}`}
                      variant="glass"
                      size="icon"
                      className="size-9 rounded-lg"
                      title="View assessment"
                      aria-label={`View ${item.label}`}
                    >
                      <ArrowUpRight className="size-4" aria-hidden="true" />
                    </ButtonLink>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <div className="grid gap-3 lg:hidden">
        {assessments.map((item) => {
          const availableFactors = item.factors.filter((factor) => factor.status === 'available').length;
          const complete = availableFactors === item.factors.length && item.factors.length > 0;
          const createdDate = new Date(item.created_at).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
          });

          return (
            <Link
              key={item.id}
              to={`/assessments/${item.id}`}
              className="glass-panel rounded-2xl p-4 transition-colors hover:border-white/20"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 font-semibold text-zinc-100">
                    <MapPin className="size-4 shrink-0 text-zinc-400" />
                    <span className="truncate">{item.label}</span>
                  </div>
                  <p className="mt-1 truncate pl-6 text-xs text-zinc-400">
                    {item.address || `${item.latitude.toFixed(4)}, ${item.longitude.toFixed(4)}`}
                  </p>
                </div>
                <ArrowUpRight className="size-4 shrink-0 text-zinc-400" aria-hidden="true" />
              </div>
              <div className="mt-4 flex items-end justify-between gap-3 border-t border-white/[0.07] pt-3">
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">Score</p>
                  <p className="mt-0.5 text-lg font-semibold text-zinc-100">
                    {item.total_score ?? 'N/A'} <span className="text-xs font-normal text-zinc-500">/ 100</span>
                  </p>
                  <p className="mt-1 text-[11px] text-zinc-400">{createdDate} · {availableFactors}/{item.factors.length} factors</p>
                </div>
                <AssessmentStatusBadge complete={complete} />
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
};
