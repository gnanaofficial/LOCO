import React from 'react';
import { Badge } from './ui/badge';

interface AssessmentStatusBadgeProps {
  complete: boolean;
}

export const AssessmentStatusBadge: React.FC<AssessmentStatusBadgeProps> = ({ complete }) => (
  <Badge
    variant={complete ? 'success' : 'warning'}
    title={complete ? 'All factors are available' : 'Some factors are unavailable'}
  >
    <span
      aria-hidden="true"
      className={`size-1.5 rounded-full ${complete ? 'bg-emerald-400' : 'bg-amber-400'}`}
    />
    {complete ? 'Complete' : 'Partial data'}
  </Badge>
);
