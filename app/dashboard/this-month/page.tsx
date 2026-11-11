// Locked-in This Month operational workspace (/dashboard/this-month) with Execute Bills and Forecast & Flow tabs.
'use client';

import { Suspense } from 'react';
import ThisMonthWorkspace, { ThisMonthWorkspaceSkeleton } from './components/ThisMonthWorkspace';

export default function ThisMonthPage() {
  return (
    <Suspense fallback={<ThisMonthWorkspaceSkeleton />}>
      <ThisMonthWorkspace defaultMemoryOnly={false} />
    </Suspense>
  );
}
