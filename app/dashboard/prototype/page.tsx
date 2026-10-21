// Sandbox prototype route (/dashboard/prototype) defaulting to safe in-memory benchmark mode.
'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import ThisMonthWorkspace from '../this-month/components/ThisMonthWorkspace';

export default function PrototypePage() {
  return (
    <Suspense
      fallback={
        <div className="empty-state fade-in">
          <div className="empty-icon">
            <Loader2 className="animate-spin" size={24} strokeWidth={2.0} aria-hidden="true" focusable="false" />
          </div>
          <h3>Loading sandbox prototype workspace.</h3>
        </div>
      }
    >
      <ThisMonthWorkspace defaultMemoryOnly={true} />
    </Suspense>
  );
}
