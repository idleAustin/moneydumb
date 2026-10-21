/**
 * tests/verify_math_invariants_empirical.js
 * Comprehensive Empirical Stress Harness for Financial Math Invariants
 * Milestone 6 Iteration 2 Challenger 2
 */

const assert = require('assert');

let passedCount = 0;
let failedCount = 0;
const failureDetails = [];

function check(name, fn) {
  try {
    const detail = fn();
    passedCount++;
    console.log(`  ✓ PASS: ${name}${detail ? ` (${detail})` : ''}`);
  } catch (err) {
    failedCount++;
    failureDetails.push({ name, error: err.message, stack: err.stack });
    console.log(`  ✗ FAIL: ${name} -> ${err.message}`);
  }
}

function assertClose(actual, expected, tolerance = 0.01, msg = '') {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`${msg} - expected ${expected} ± ${tolerance}, got ${actual}`);
  }
}

console.log('======================================================================');
console.log('M6 ITERATION 2: EMPIRICAL FINANCIAL MATH INVARIANTS HARNESS');
console.log('======================================================================\n');

// =============================================================================
// INVARIANT 1: PMT AMORTIZATION FORMULA INVARIANTS
// =============================================================================
console.log('--- INVARIANT 1: PMT AMORTIZATION FORMULA INVARIANTS ---');

function calcAmortizedPayment(balance, apr, n) {
  const monthlyRate = apr / 100.0 / 12.0;
  if (monthlyRate === 0.0) {
    return balance / n;
  }
  const factor = Math.pow(1.0 + monthlyRate, n);
  return balance * (monthlyRate * factor) / (factor - 1.0);
}

function calcPaymentWithClamping(balance, apr, n, minPay, extra = 0) {
  const monthlyRate = apr / 100.0 / 12.0;
  let required = minPay;
  if (n) {
    if (monthlyRate > 0.0) {
      const factor = Math.pow(1.0 + monthlyRate, n);
      required = balance * (monthlyRate * factor) / (factor - 1.0);
    } else {
      required = balance / n;
    }
  }
  const basePay = Math.min(Math.max(required, minPay), balance + balance * monthlyRate);
  return Math.min(basePay + extra, balance + balance * monthlyRate);
}

check('PMT Formula: Standard loan amortization benchmarks match textbook precision', () => {
  // Benchmark 1: $10,000 at 12.0% APR for 12 months -> $888.49
  const pmt1 = Math.round(calcAmortizedPayment(10000, 12.0, 12) * 100) / 100;
  assert.strictEqual(pmt1, 888.49, 'Benchmark 1 ($10,000 @ 12% for 12 mo)');

  // Benchmark 2: $10,000 at 6.0% APR for 36 months -> $304.22
  const pmt2 = Math.round(calcAmortizedPayment(10000, 6.0, 36) * 100) / 100;
  assert.strictEqual(pmt2, 304.22, 'Benchmark 2 ($10,000 @ 6% for 36 mo)');

  // Benchmark 3: $25,000 auto loan at 6.5% APR for 60 months -> $489.15
  const pmt3 = Math.round(calcAmortizedPayment(25000, 6.5, 60) * 100) / 100;
  assert.strictEqual(pmt3, 489.15, 'Benchmark 3 ($25,000 @ 6.5% for 60 mo)');

  // Benchmark 4: $300,000 mortgage at 7.0% APR for 360 months -> $1,995.91
  const pmt4 = Math.round(calcAmortizedPayment(300000, 7.0, 360) * 100) / 100;
  assert.strictEqual(pmt4, 1995.91, 'Benchmark 4 ($300,000 @ 7.0% for 360 mo)');

  return '4 standard industry benchmarks verified to the cent';
});

check('PMT Formula: 0% APR linear principal amortization edge cases', () => {
  assert.strictEqual(calcAmortizedPayment(1200, 0.0, 12), 100, '$1,200 @ 0% for 12mo');
  assert.strictEqual(calcAmortizedPayment(6000, 0.0, 24), 250, '$6,000 @ 0% for 24mo');
  assert.strictEqual(calcAmortizedPayment(500, 0.0, 1), 500, '$500 @ 0% for 1mo');
  return '0% APR linear division verified without NaN or division by zero';
});

check('PMT Invariant: Single-month payoff (n=1) equals balance + exactly 1 month interest', () => {
  const balance = 5000;
  const apr = 12.0;
  const monthlyRate = apr / 100.0 / 12.0; // 0.01
  const pmt = calcAmortizedPayment(balance, apr, 1);
  const expected = balance * (1.0 + monthlyRate); // 5050.00
  assertClose(pmt, expected, 0.001, 'Single month payoff must equal balance + 1 month interest');
  return `Payoff for $5,000 @ 12% in 1 month = $${pmt.toFixed(2)}`;
});

check('PMT Invariant: Payment upper bound clamping prevents overpayment beyond total debt obligation', () => {
  // If balance is $100 and APR is 12% (1% monthly), obligation is $101.
  // Even if minimum payment or target asks for $500, payment must clamp to $101.
  const balance = 100;
  const apr = 12.0;
  const clamped = calcPaymentWithClamping(balance, apr, 12, 200, 500);
  assert.strictEqual(clamped, 101.0, 'Payment must clamp to balance + monthly interest');
  return 'Clamping prevents negative balances and overpayment';
});

check('PMT Invariant: Required payment strictly enforces minimum payment floor', () => {
  // If target payoff is 120 months on $1,000 @ 12%, amortized is ~$14.35, but minPay is $50.
  // The system must pay Math.max(required, minPay) = $50.
  const pay = calcPaymentWithClamping(1000, 12.0, 120, 50, 0);
  assert.strictEqual(pay, 50.0, 'Must pay minimum payment floor when amortized payment is lower');
  return 'Minimum payment floor invariant preserved';
});

// =============================================================================
// INVARIANT 2: SNOWBALL VS. AVALANCHE PAYOFF STRATEGY INVARIANTS
// =============================================================================
console.log('\n--- INVARIANT 2: SNOWBALL VS. AVALANCHE STRATEGY INVARIANTS ---');

function simulatePayoffSchedule(debts, strategy, extraPayment = 0) {
  // Clone debts
  const items = debts.map(d => ({
    id: d.id,
    name: d.name,
    balance: d.balance,
    apr: d.apr,
    minPay: d.minPay,
    monthlyRate: d.apr / 100.0 / 12.0,
  }));

  // Sort per strategy
  if (strategy === 'avalanche') {
    items.sort((a, b) => b.apr - a.apr);
  } else {
    items.sort((a, b) => a.balance - b.balance);
  }

  let totalInterest = 0;
  let months = 0;
  const maxMonths = 600;

  while (items.some(d => d.balance > 0.01) && months < maxMonths) {
    months++;
    // Accrue interest
    for (const d of items) {
      if (d.balance > 0.01) {
        const interest = d.balance * d.monthlyRate;
        totalInterest += interest;
        d.balance += interest;
      }
    }

    // Allocate minimum payments
    let availableExtra = extraPayment;
    for (const d of items) {
      if (d.balance <= 0.01) continue;
      const pay = Math.min(d.minPay, d.balance);
      d.balance -= pay;
    }

    // Allocate extra payment to first active debt in strategy order (cascade)
    for (const d of items) {
      if (d.balance > 0.01) {
        const extraPay = Math.min(availableExtra, d.balance);
        d.balance -= extraPay;
        availableExtra -= extraPay;
        if (availableExtra <= 0.001) break;
      }
    }
  }

  return {
    strategy,
    months,
    totalInterest: Math.round(totalInterest * 100) / 100,
    allPaidOff: items.every(d => d.balance <= 0.01),
  };
}

check('Sorting Invariant: Snowball sorts strictly ascending by balance', () => {
  const portfolio = [
    { id: 'A', balance: 4500, apr: 19.99, minPay: 120 },
    { id: 'B', balance: 850, apr: 24.99, minPay: 35 },
    { id: 'C', balance: 12000, apr: 6.5, minPay: 250 },
    { id: 'D', balance: 250, apr: 12.0, minPay: 25 },
  ];
  const sorted = [...portfolio].sort((a, b) => a.balance - b.balance);
  assert.deepStrictEqual(sorted.map(d => d.id), ['D', 'B', 'A', 'C']);
  return 'Order: D ($250) -> B ($850) -> A ($4,500) -> C ($12,000)';
});

check('Sorting Invariant: Avalanche sorts strictly descending by APR', () => {
  const portfolio = [
    { id: 'A', balance: 4500, apr: 19.99, minPay: 120 },
    { id: 'B', balance: 850, apr: 24.99, minPay: 35 },
    { id: 'C', balance: 12000, apr: 6.5, minPay: 250 },
    { id: 'D', balance: 250, apr: 12.0, minPay: 25 },
  ];
  const sorted = [...portfolio].sort((a, b) => b.apr - a.apr);
  assert.deepStrictEqual(sorted.map(d => d.id), ['B', 'A', 'D', 'C']);
  return 'Order: B (24.99%) -> A (19.99%) -> D (12.0%) -> C (6.5%)';
});

check('Mathematical Optimality: Avalanche total interest <= Snowball total interest', () => {
  // Test across 5 diverse debt portfolio profiles
  const testPortfolios = [
    [
      { id: '1', balance: 5000, apr: 22.0, minPay: 150 },
      { id: '2', balance: 1500, apr: 14.0, minPay: 50 },
      { id: '3', balance: 8000, apr: 7.0, minPay: 180 },
    ],
    [
      { id: '1', balance: 3000, apr: 28.99, minPay: 100 },
      { id: '2', balance: 1000, apr: 15.0, minPay: 40 },
      { id: '3', balance: 6000, apr: 5.5, minPay: 120 },
      { id: '4', balance: 500, apr: 19.0, minPay: 25 },
    ],
    [
      { id: '1', balance: 12000, apr: 24.0, minPay: 360 },
      { id: '2', balance: 2000, apr: 9.0, minPay: 60 },
    ],
  ];

  for (let i = 0; i < testPortfolios.length; i++) {
    const p = testPortfolios[i];
    const resSnowball = simulatePayoffSchedule(p, 'snowball', 200);
    const resAvalanche = simulatePayoffSchedule(p, 'avalanche', 200);

    assert(resSnowball.allPaidOff, `Portfolio ${i + 1} Snowball did not pay off`);
    assert(resAvalanche.allPaidOff, `Portfolio ${i + 1} Avalanche did not pay off`);
    assert(
      resAvalanche.totalInterest <= resSnowball.totalInterest,
      `Portfolio ${i + 1}: Avalanche interest ($${resAvalanche.totalInterest}) should be <= Snowball interest ($${resSnowball.totalInterest})`
    );
  }

  return 'Avalanche produces equal or less interest across all tested debt profiles';
});

check('Debt Cascade: Paid-off debts free up allocation until total balance reaches 0', () => {
  const portfolio = [
    { id: '1', balance: 600, apr: 12.0, minPay: 50 },
    { id: '2', balance: 1200, apr: 18.0, minPay: 50 },
  ];
  const res = simulatePayoffSchedule(portfolio, 'snowball', 100);
  assert(res.allPaidOff, 'All debts must reach 0 balance');
  assert(res.months < 24, `Debts paid off in ${res.months} months`);
  return `Successfully cascaded: total payoff in ${res.months} months, total interest $${res.totalInterest}`;
});

// =============================================================================
// INVARIANT 3: BUDGET ROLLOVER & MULTI-MONTH RUNWAY INVARIANTS
// =============================================================================
console.log('\n--- INVARIANT 3: BUDGET ROLLOVER & RUNWAY INVARIANTS ---');

function simulateBudgetProjection(numMonths, startingBalance, monthlyIncome, monthlyExpenses, monthlyDebt, monthlyEnvelopes) {
  const months = [];
  let currentBalance = startingBalance;

  for (let i = 0; i < numMonths; i++) {
    const surplus = monthlyIncome - monthlyExpenses - monthlyDebt - monthlyEnvelopes;
    const ending = currentBalance + surplus;

    months.push({
      monthIndex: i + 1,
      starting_balance: Math.round(currentBalance * 100) / 100,
      total_income: Math.round(monthlyIncome * 100) / 100,
      total_recurring_expenses: Math.round(monthlyExpenses * 100) / 100,
      total_debt_payments: Math.round(monthlyDebt * 100) / 100,
      total_envelope_budgets: Math.round(monthlyEnvelopes * 100) / 100,
      surplus: Math.round(surplus * 100) / 100,
      ending_balance: Math.round(ending * 100) / 100,
    });

    currentBalance = ending;
  }

  return months;
}

check('Rollover Continuity: Month N starting balance strictly equals Month N-1 ending balance', () => {
  const projection = simulateBudgetProjection(12, 10000, 5000, 2500, 600, 800);
  for (let i = 1; i < projection.length; i++) {
    const prev = projection[i - 1];
    const curr = projection[i];
    assert.strictEqual(
      curr.starting_balance,
      prev.ending_balance,
      `Month ${curr.monthIndex} starting balance (${curr.starting_balance}) does not match Month ${prev.monthIndex} ending balance (${prev.ending_balance})`
    );
  }
  return 'Continuity verified across all 12 projected months';
});

check('Surplus Invariant: Ending balance equals starting balance plus surplus', () => {
  const projection = simulateBudgetProjection(6, 4500, 6200, 3100, 950, 750);
  for (const m of projection) {
    const expectedEnding = Math.round((m.starting_balance + m.surplus) * 100) / 100;
    assert.strictEqual(m.ending_balance, expectedEnding, `Month ${m.monthIndex} ending balance mismatch`);
  }
  return 'Ending balance = starting_balance + surplus verified in every month';
});

check('Deficit Invariant: Negative surplus monotonically reduces cash balance without divergence', () => {
  // Income $3,000, Total outflows $3,800 -> -$800 monthly deficit
  const projection = simulateBudgetProjection(6, 5000, 3000, 2000, 1000, 800);
  for (let i = 0; i < projection.length; i++) {
    const m = projection[i];
    assert.strictEqual(m.surplus, -800.0);
    const expectedEnding = 5000 - 800 * (i + 1);
    assert.strictEqual(m.ending_balance, expectedEnding);
  }
  return 'Deficit cleanly decreases balance: Month 6 ending balance = $200';
});

check('Year Transition Invariant: Multi-year calendar boundaries maintain month and year consistency', () => {
  const currentMonth = 11; // November
  const currentYear = 2026;
  const numMonths = 14;

  const sequence = [];
  for (let i = 0; i < numMonths; i++) {
    const projMonth = ((currentMonth - 1 + i) % 12) + 1;
    const projYear = currentYear + Math.floor((currentMonth - 1 + i) / 12);
    sequence.push({ month: projMonth, year: projYear });
  }

  // Month 0: 11/2026
  assert.deepStrictEqual(sequence[0], { month: 11, year: 2026 });
  // Month 1: 12/2026
  assert.deepStrictEqual(sequence[1], { month: 12, year: 2026 });
  // Month 2: 1/2027 (Year roll over!)
  assert.deepStrictEqual(sequence[2], { month: 1, year: 2027 });
  // Month 13: 12/2027
  assert.deepStrictEqual(sequence[13], { month: 12, year: 2027 });

  return 'Dec 2026 -> Jan 2027 wrap verified accurately';
});

// =============================================================================
// INVARIANT 4: PAY DATE GENERATION & BOUNDARY INVARIANTS
// =============================================================================
console.log('\n--- INVARIANT 4: PAY DATE GENERATION & BOUNDARY INVARIANTS ---');

function payDatesInMonth(frequency, nextPayDate, year, month) {
  const firstOfMonth = new Date(year, month - 1, 1);
  const firstOfNext = new Date(year, month, 1);

  if (!nextPayDate) {
    return [firstOfMonth];
  }

  const npd = new Date(nextPayDate);
  if (isNaN(npd.getTime())) {
    return [firstOfMonth];
  }

  const dates = [];

  if (frequency === 'monthly') {
    const day = Math.min(npd.getDate(), 28);
    dates.push(new Date(year, month - 1, day));
  } else if (frequency === 'semimonthly') {
    dates.push(new Date(year, month - 1, 1));
    dates.push(new Date(year, month - 1, 15));
  } else {
    // weekly or biweekly
    const intervalDays = frequency === 'weekly' ? 7 : 14;

    // Walk back to find start date
    const d = new Date(npd);
    while (d >= firstOfNext) {
      d.setDate(d.getDate() - intervalDays);
    }
    while (d >= firstOfMonth) {
      d.setDate(d.getDate() - intervalDays);
    }

    // Walk forward to collect dates inside target month
    d.setDate(d.getDate() + intervalDays);
    while (d < firstOfNext) {
      if (d >= firstOfMonth) {
        dates.push(new Date(d));
      }
      d.setDate(d.getDate() + intervalDays);
    }
  }

  if (dates.length === 0) {
    dates.push(firstOfMonth);
  }

  return dates;
}

check('Pay Date Boundary: 100% of generated dates stay strictly within [firstOfMonth, firstOfNext)', () => {
  const frequencies = ['monthly', 'semimonthly', 'biweekly', 'weekly'];
  const years = [2022, 2023, 2024, 2025, 2026];
  const anchors = [
    '2022-01-01',
    '2024-02-29', // Leap day
    '2025-07-31', // Month end
    '2026-10-15',
    '2021-05-12', // Distant past
    '2030-08-19', // Distant future
    null,
    'garbage-string',
  ];

  let totalEvaluations = 0;
  for (const year of years) {
    for (let month = 1; month <= 12; month++) {
      const firstOfMonth = new Date(year, month - 1, 1);
      const firstOfNext = new Date(year, month, 1);

      for (const freq of frequencies) {
        for (const anchor of anchors) {
          totalEvaluations++;
          const dates = payDatesInMonth(freq, anchor, year, month);
          assert(dates.length >= 1, `Must have at least 1 date for ${freq}`);
          for (const d of dates) {
            assert(
              d >= firstOfMonth && d < firstOfNext,
              `Date ${d.toISOString()} breached month boundary for ${year}-${month} (${freq})`
            );
          }
        }
      }
    }
  }
  return `Checked ${totalEvaluations} month/frequency/anchor combinations; 0 boundary breaches`;
});

check('Pay Date Frequency Counts: Each frequency respects calendar cadence limits', () => {
  const testYears = [2024, 2025, 2026];
  const anchor = '2024-01-05';

  for (const year of testYears) {
    for (let month = 1; month <= 12; month++) {
      // Monthly: exactly 1
      const mDates = payDatesInMonth('monthly', anchor, year, month);
      assert.strictEqual(mDates.length, 1, `Monthly must yield exactly 1 date in ${year}-${month}`);

      // Semimonthly: exactly 2
      const smDates = payDatesInMonth('semimonthly', anchor, year, month);
      assert.strictEqual(smDates.length, 2, `Semimonthly must yield exactly 2 dates in ${year}-${month}`);

      // Biweekly: exactly 2 or 3
      const bwDates = payDatesInMonth('biweekly', anchor, year, month);
      assert(
        bwDates.length === 2 || bwDates.length === 3,
        `Biweekly must yield 2 or 3 dates in ${year}-${month}, got ${bwDates.length}`
      );

      // Weekly: exactly 4 or 5
      const wDates = payDatesInMonth('weekly', anchor, year, month);
      assert(
        wDates.length === 4 || wDates.length === 5,
        `Weekly must yield 4 or 5 dates in ${year}-${month}, got ${wDates.length}`
      );
    }
  }
  return 'Monthly (1), Semimonthly (2), Biweekly (2-3), Weekly (4-5) verified for 36 months';
});

check('Pay Date Spacing: Weekly dates are spaced by 7 days; Biweekly by 14 days', () => {
  const year = 2026;
  const anchor = '2026-01-02';

  for (let month = 1; month <= 12; month++) {
    // Check weekly spacing
    const wDates = payDatesInMonth('weekly', anchor, year, month);
    for (let i = 1; i < wDates.length; i++) {
      const diffDays = Math.round((wDates[i] - wDates[i - 1]) / (1000 * 60 * 60 * 24));
      assert.strictEqual(diffDays, 7, `Weekly spacing must be 7 days, got ${diffDays} in ${year}-${month}`);
    }

    // Check biweekly spacing
    const bwDates = payDatesInMonth('biweekly', anchor, year, month);
    for (let i = 1; i < bwDates.length; i++) {
      const diffDays = Math.round((bwDates[i] - bwDates[i - 1]) / (1000 * 60 * 60 * 24));
      assert.strictEqual(diffDays, 14, `Biweekly spacing must be 14 days, got ${diffDays} in ${year}-${month}`);
    }
  }
  return 'Exact 7-day and 14-day intervals verified across all months of 2026';
});

// =============================================================================
// SUMMARY
// =============================================================================
console.log('\n======================================================================');
console.log(`Execution Summary: Total: ${passedCount + failedCount} | Passed: ${passedCount} | Failed: ${failedCount}`);
if (failedCount > 0) {
  console.log('FAILURES:');
  for (const f of failureDetails) {
    console.log(`- ${f.name}: ${f.error}`);
  }
}
console.log('======================================================================\n');

process.exit(failedCount > 0 ? 1 : 0);
