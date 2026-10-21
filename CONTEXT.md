# money-dumb

Personal finance, liquidity, and monthly cash-flow command center built on the `idleAustin` design system.

## Language

### Cash Flow & Accounts

**Safe Balance**:
Liquid cash coverage remaining after subtracting recurring monthly obligations and scheduled debt payments from available account balances and inbound income (`monthlyIncome - monthlyExpenses - monthlyDebtPayments`).
_Avoid_: Free cash, leftover money, disposable income

**Account**:
A user-owned financial asset container (`checking`, `savings`, `investment`) in `accounts` holding a current `balance` and timestamp (`balance_updated_at`).
_Avoid_: Wallet, bucket, pot

**Income Source**:
A recurring paycheck or revenue rule in `income_sources` (`weekly`, `biweekly`, `semimonthly`, `monthly`) prorated to a monthly equivalent (`* 4.33`, `* 2.167`, `* 2`, `* 1`).
_Avoid_: Salary, job, wage

**Income Allocation**:
A percentage or fixed-dollar routing rule (`income_allocations`) that distributes a paycheck from an `Income Source` into a target `Account`.
_Avoid_: Split, transfer rule

**Income Event**:
An actual recorded deposit or one-off windfall (`is_bonus = 1`) in `income_events`.
_Avoid_: Transaction, payment received

### Obligations & Debt Strategy

**Expense**:
A recurring monthly bill (`is_recurring = 1`, `due_day_of_month`) or one-off charge in `expenses`, grouped under an `Expense Category` (`expense_categories`).
_Avoid_: Subscription, charge, item

**Debt**:
An interest-bearing liability in `debts` (`balance`, `interest_rate`, `minimum_payment`, `amount_due_immediately`) governed by a `payment_strategy` (`minimum`, `due_now`, or `payoff_plan`).
_Avoid_: Loan, bill, credit line

**Committed Payoff Plan**:
The user's active amortization schedule (`committed_payoff_plan`) using either `snowball` (`balance ASC`) or `avalanche` (`interest_rate DESC`) ordering plus an optional `extra_payment` boost.
_Avoid_: Debt calculator, simulation

### Budgeting & Planning

**Envelope**:
A monthly category spending cap (`budgeted_amount`, `spent_amount`, `month`, `year` in `envelopes`) with itemized `envelope_transactions`. A **Smart Envelope** is auto-seeded from recurring category expense totals (`/api/envelopes/smart`).
_Avoid_: Category limit, budget jar

**Want**:
A prioritized discretionary wish-list item (`wants`) evaluated against monthly net cash flow (`months_to_save`, `cost_as_percent_of_income`).
_Avoid_: Goal, wishlist item

**Bonus Plan**:
A windfall distribution blueprint (`bonus_plans` and `bonus_plan_allocations`) linked to a bonus `Income Event`.
_Avoid_: Windfall split

**Sandbox Instance (`This Month`)**:
An interactive monthly execution workspace (`sandbox_instances` and `sandbox_items`) tracking bill check-off state (`is_paid`) and `amount_override` values for a given `month` and `year` without mutating master recurring records.
_Avoid_: Monthly worksheet, draft budget

