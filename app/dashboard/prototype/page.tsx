// Sandbox prototype route (/dashboard/prototype) defaulting to safe in-memory benchmark mode.
'use client';

import { Suspense } from 'react';
import ThisMonthWorkspace, { ThisMonthWorkspaceSkeleton } from '../this-month/components/ThisMonthWorkspace';

export default function PrototypePage() {
  return (
    <Suspense fallback={<ThisMonthWorkspaceSkeleton />}>
      <ThisMonthWorkspace defaultMemoryOnly={true} />
    </Suspense>
  );
}
