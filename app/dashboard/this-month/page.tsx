// Locked-in This Month operational workspace (/dashboard/this-month) with Execute Bills and Forecast & Flow tabs.
'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import ThisMonthWorkspace from './components/ThisMonthWorkspace';

export default function ThisMonthPage() {
  return (
    <Suspense
      fallback={
        <div className="empty-state fade-in">
          <div className="empty-icon">
            <Loader2 className="animate-spin" size={24} strokeWidth={2.0} aria-hidden="true" focusable="false" />
          </div>
          <h3>Loading sandbox workspace.</h3>
        </div>
      }
    >
      <ThisMonthWorkspace defaultMemoryOnly={false} />
    </Suspense>
  );
}
