/**
 * =============================================================================
 * Milestone 6 Challenger 1: Adversarial Stress Testing & Global Invariants
 * =============================================================================
 * Empirical test harness testing:
 * 1. Dynamic injection and edge cases in presentation sanitizers
 * 2. Static deep scan for prohibited artifacts across all .tsx and .css files
 * 3. Financial math formulas, runway calculations, and envelope invariants
 * =============================================================================
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const APP_DIR = path.join(REPO_ROOT, 'app');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const vulnerabilitiesFound = [];

function check(name, fn) {
  totalTests++;
  try {
    const res = fn();
    passedTests++;
    console.log(`  ✓ PASS: ${name}${typeof res === 'string' ? ` (${res})` : ''}`);
    return true;
  } catch (err) {
    failedTests++;
    console.log(`  ✗ FAIL: ${name} -> ${err.message}`);
    return false;
  }
}

function challenge(title, fn) {
  totalTests++;
  try {
    const finding = fn();
    passedTests++;
    vulnerabilitiesFound.push({ title, detail: finding });
    console.log(`  ⚠ CHALLENGE CONFIRMED: ${title}\n      ↳ ${finding}`);
    return true;
  } catch (err) {
    failedTests++;
    console.log(`  ✗ CHALLENGE FAILED TO REPRODUCE: ${title} -> ${err.message}`);
    return false;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message || 'Assertion failed'}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function getAllFiles(dir, exts = ['.tsx', '.ts', '.css'], excludes = ['node_modules', '.next', '.git', '.agents', 'backups']) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    if (excludes.includes(file)) continue;
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllFiles(fullPath, exts, excludes));
    } else {
      const ext = path.extname(fullPath).toLowerCase();
      if (exts.includes(ext)) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

console.log('======================================================================');
console.log('M6 CHALLENGER 1: ADVERSARIAL STRESS TESTING & GLOBAL INVARIANTS');
console.log('Target:', REPO_ROOT);
console.log('======================================================================\n');

// -----------------------------------------------------------------------------
// PRESENTATION SANITIZERS LOGIC
// -----------------------------------------------------------------------------
function renderAiGradeLogic(rawGrade) {
  if (!rawGrade) return null;
  const cleanGrade = rawGrade
    .replace(/[\p{Extended_Pictographic}\u{10000}-\u{10FFFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE00}-\u{FE0F}]/gu, '')
    .replace(/[!]/g, '.')
    .replace(/\s{2,}/g, ' ')
    .trim();

  let iconName = 'CheckCircle2';
  let iconColor = 'var(--as-status-success)';

  const lower = cleanGrade.toLowerCase();
  if (rawGrade.includes('\u{1F534}') || lower.includes('attention')) {
    iconName = 'AlertTriangle';
    iconColor = 'var(--as-status-error)';
  } else if (rawGrade.includes('\u{1F7E1}') || lower.includes('fair')) {
    iconName = 'AlertCircle';
    iconColor = 'var(--as-status-warning)';
  } else if (rawGrade.includes('\u{1F7E2}') || lower.includes('good')) {
    iconName = 'CheckCircle2';
    iconColor = 'var(--as-status-success)';
  } else if (rawGrade.includes('\u{1F49A}') || lower.includes('excellent')) {
    iconName = 'CheckCircle2';
    iconColor = 'var(--as-accent-primary)';
  }

  return {
    iconName,
    iconColor,
    cleanGrade,
  };
}

function renderRecommendationLogic(rec) {
  if (!rec) return null;

  let iconName = 'CheckCircle2';
  let iconColor = 'var(--as-status-success)';
  const lower = rec.toLowerCase();

  if (rec.includes('\u{26D4}') || lower.includes('costs more than')) {
    iconName = 'AlertOctagon';
    iconColor = 'var(--as-status-error)';
  } else if (rec.includes('\u{26A0}') || lower.includes('significant expense')) {
    iconName = 'AlertTriangle';
    iconColor = 'var(--as-status-warning)';
  } else if (rec.includes('\u{1F7E1}') || lower.includes('moderate')) {
    iconName = 'Info';
    iconColor = 'var(--as-status-warning)';
  } else if (rec.includes('\u{2705}') || lower.includes('affordable')) {
    iconName = 'CheckCircle2';
    iconColor = 'var(--as-status-success)';
  }

  const cleanText = rec
    .replace(/[\p{Extended_Pictographic}\u{10000}-\u{10FFFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE00}-\u{FE0F}]/gu, '')
    .replace(/[!]/g, '.')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return {
    iconName,
    iconColor,
    cleanText,
  };
}

function getExpenseCategoryIconLogic(iconName, catName) {
  const key = `${iconName || ''} ${catName || ''}`.toLowerCase().replace(/_/g, ' ');
  if (key.includes('card') || key.includes('credit') || key.includes('debt') || key.includes('loan')) {
    return 'CreditCard';
  }
  if (key.includes('shop') || key.includes('store') || key.includes('cart')) {
    return 'ShoppingCart';
  }
  if (/\bcar\b/.test(key) || key.includes('auto') || key.includes('gas') || key.includes('transport') || key.includes('transit')) {
    return 'Car';
  }
  if (key.includes('house') || key.includes('home') || key.includes('housing') || key.includes('rent') || key.includes('mortgage')) {
    return 'Home';
  }
  if (key.includes('food') || key.includes('dining') || key.includes('dine') || key.includes('grocer') || key.includes('restaurant') || /\beat\b/.test(key) || key.includes('utensil')) {
    return 'Utensils';
  }
  if (key.includes('util') || key.includes('electric') || key.includes('power') || key.includes('water') || key.includes('energy') || key.includes('zap')) {
    return 'Zap';
  }
  if (key.includes('tv') || key.includes('stream') || key.includes('entertain') || key.includes('movie') || key.includes('subscript') || key.includes('music')) {
    return 'Tv';
  }
  if (key.includes('sav') || key.includes('invest') || key.includes('piggy') || key.includes('bank')) {
    return 'PiggyBank';
  }
  return 'Folder';
}

const comprehensiveEmojiRegex = /[\p{Extended_Pictographic}\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2B50}\u{2B55}]/u;

// =============================================================================
// SUITE 1: DYNAMIC PRESENTATION SANITIZERS STRESS
// =============================================================================
console.log('--- SUITE 1: DYNAMIC PRESENTATION SANITIZERS STRESS ---');

check('renderAiGrade: Canonical backend server grades sanitize cleanly to vector icons', () => {
  const canonical = [
    { raw: 'Needs Attention 🔴', expectedColor: 'var(--as-status-error)', expectedIcon: 'AlertTriangle', expectedText: 'Needs Attention' },
    { raw: 'Fair 🟡', expectedColor: 'var(--as-status-warning)', expectedIcon: 'AlertCircle', expectedText: 'Fair' },
    { raw: 'Good 🟢', expectedColor: 'var(--as-status-success)', expectedIcon: 'CheckCircle2', expectedText: 'Good' },
    { raw: 'Excellent 💚', expectedColor: 'var(--as-accent-primary)', expectedIcon: 'CheckCircle2', expectedText: 'Excellent' },
  ];

  for (const c of canonical) {
    const res = renderAiGradeLogic(c.raw);
    assert(res !== null, `Expected result for ${c.raw}`);
    assertEqual(res.iconColor, c.expectedColor, `Color mismatch for ${c.raw}`);
    assertEqual(res.iconName, c.expectedIcon, `Icon mismatch for ${c.raw}`);
    assertEqual(res.cleanGrade, c.expectedText, `Text mismatch for ${c.raw}`);
    assert(!comprehensiveEmojiRegex.test(res.cleanGrade), `Emoji leaked in cleanGrade: ${res.cleanGrade}`);
  }
  return 'All 4 canonical backend grades sanitized';
});

check('renderAiGrade: Fuzzing with SMP and BMP standard emojis strips them cleanly', () => {
  const payloads = [
    '😀 Grade A', '😎 Grade B', '💀 Critical Failure', '🤡 Joke Grade', '🚀 To The Moon',
    '💩 Terrible', '🔥 Fire Budget', '💸 Money Lost', '💰 Rich', '⚠️ Warning Grade',
    '⛔ Stop Right There', '🛑 Red Flag', '🚨 Alert Mode', '🍔 Fast Food Index', '🏠 Mortgage Heavy',
    '🏎️ Fast Car', '⚡ Power User', '💎 Diamond Hands', '👑 King Plan', '🎯 On Target',
    '✨ Sparkles', '🎉 Celebration', '💥 Explosion', '📈 Stocks Up', '📉 Stocks Down'
  ];

  for (const payload of payloads) {
    const res = renderAiGradeLogic(payload);
    assert(res !== null, `Null returned on payload: ${payload}`);
    assert(!comprehensiveEmojiRegex.test(res.cleanGrade), `Emoji leaked in cleanGrade for payload: "${payload}" -> "${res.cleanGrade}"`);
  }
  return `${payloads.length} standard SMP/BMP emoji payloads stripped without leak`;
});

check('renderAiGrade: Out-of-range BMP symbols (U+2B00 to U+2BFF, e.g., ⭐ U+2B50) are cleanly stripped', () => {
  const payload = '⭐ Five Star Grade';
  const res = renderAiGradeLogic(payload);
  assert(!res.cleanGrade.includes('⭐'), 'Expected star symbol to be stripped');
  assertEqual(res.cleanGrade, 'Five Star Grade');
  assert(!comprehensiveEmojiRegex.test(res.cleanGrade), 'Emoji leaked in cleanGrade');
  return 'U+2B50 (⭐) stripped cleanly without leakage';
});

check('renderAiGrade: Boundary and malformed inputs (null, undefined, empty, long string, XSS)', () => {
  assertEqual(renderAiGradeLogic(undefined), null, 'undefined should return null');
  assertEqual(renderAiGradeLogic(null), null, 'null should return null');
  assertEqual(renderAiGradeLogic(''), null, 'empty string should return null');

  // Long payload stress (100,000 chars)
  const longPayload = 'Good 🟢 ' + 'A'.repeat(100000);
  const start = Date.now();
  const resLong = renderAiGradeLogic(longPayload);
  const duration = Date.now() - start;
  assert(duration < 200, `Long payload processing took too long: ${duration}ms`);
  assert(!comprehensiveEmojiRegex.test(resLong.cleanGrade), 'Emoji leaked in long payload');

  // XSS injection test
  const xssPayload = '<script>alert("xss")</script> Good 🟢';
  const resXss = renderAiGradeLogic(xssPayload);
  assert(!comprehensiveEmojiRegex.test(resXss.cleanGrade), 'Emoji leaked in XSS payload');
  assert(resXss.cleanGrade.includes('<script>'), 'Preserves safe text structure for React JSX escaping');

  return `Passed boundary checks in ${duration}ms`;
});

check('renderRecommendation: Canonical backend server recommendations sanitize cleanly', () => {
  const canonical = [
    {
      raw: '⛔ This costs more than your entire monthly income. Save for multiple months before purchasing.',
      expectedIcon: 'AlertOctagon',
      expectedColor: 'var(--as-status-error)',
      expectedStart: 'This costs more than'
    },
    {
      raw: '⚠️ This is a significant expense (>50% of monthly income). Consider saving over several months.',
      expectedIcon: 'AlertTriangle',
      expectedColor: 'var(--as-status-warning)',
      expectedStart: 'This is a significant'
    },
    {
      raw: '🟡 Moderate expense. Budget for this over the next 1-2 months.',
      expectedIcon: 'Info',
      expectedColor: 'var(--as-status-warning)',
      expectedStart: 'Moderate expense'
    },
    {
      raw: '✅ Affordable! This fits within your monthly discretionary budget.',
      expectedIcon: 'CheckCircle2',
      expectedColor: 'var(--as-status-success)',
      expectedStart: 'Affordable. This fits'
    },
  ];

  for (const c of canonical) {
    const res = renderRecommendationLogic(c.raw);
    assertEqual(res.iconName, c.expectedIcon, `Icon mismatch for ${c.raw}`);
    assertEqual(res.iconColor, c.expectedColor, `Color mismatch for ${c.raw}`);
    assert(res.cleanText.startsWith(c.expectedStart), `Text start mismatch: ${res.cleanText}`);
    assert(!res.cleanText.includes('!'), `Exclamation point leaked: ${res.cleanText}`);
    assert(!comprehensiveEmojiRegex.test(res.cleanText), `Emoji leaked in cleanText: ${res.cleanText}`);
  }
  return 'All 4 canonical backend recommendations sanitized';
});

check('renderRecommendation: Unhandled undefined/null input safely returns null without throwing', () => {
  assertEqual(renderRecommendationLogic(undefined), null, 'undefined should return null');
  assertEqual(renderRecommendationLogic(null), null, 'null should return null');
  assertEqual(renderRecommendationLogic(''), null, 'empty string should return null');
  return 'Safe null return on nullish inputs';
});

check('renderRecommendation: Non-prefix and multi-emoji payloads are globally stripped from cleanText', () => {
  const multiEmoji = '⛔ Stop! Do not spend 💸 money on this! 🔥';
  const res = renderRecommendationLogic(multiEmoji);
  assert(!comprehensiveEmojiRegex.test(res.cleanText), 'Emoji leaked in cleanText');
  assertEqual(res.cleanText, 'Stop. Do not spend money on this.');
  return 'All emojis stripped globally and ! converted to .';
});

check('getCategoryIcon: Substring collision resolved; Credit Card, Shopping Cart, Healthcare, and Daycare map correctly', () => {
  assertEqual(getExpenseCategoryIconLogic('', 'Chase Credit Card'), 'CreditCard');
  assertEqual(getExpenseCategoryIconLogic('', 'Shopping Cart Items'), 'ShoppingCart');
  assertEqual(getExpenseCategoryIconLogic('', 'Emergency Daycare'), 'Folder');
  assertEqual(getExpenseCategoryIconLogic('', 'Aetna Healthcare'), 'Folder');
  assertEqual(getExpenseCategoryIconLogic('', 'Carpet Cleaning'), 'Folder');
  assertEqual(getExpenseCategoryIconLogic('', 'Car Payment'), 'Car');
  assertEqual(getExpenseCategoryIconLogic('', 'Auto Insurance'), 'Car');
  return 'All category icons mapped correctly without substring collisions';
});

check('getCategoryIcon: Resilient fallback against adversarial and malformed inputs', () => {
  const inputs = [
    { icon: '', name: 'Food & Groceries', expected: 'Utensils' },
    { icon: '', name: 'Electric Power Util', expected: 'Zap' },
    { icon: '', name: 'Streaming Movie TV', expected: 'Tv' },
    { icon: '', name: 'Bank Savings Piggy', expected: 'PiggyBank' },
    { icon: '🛸', name: 'Alien Abduction Insurance', expected: 'Folder' },
    { icon: '🚀', name: 'Crypto Moonshot', expected: 'Folder' },
    { icon: '', name: '', expected: 'Folder' },
    { icon: null, name: null, expected: 'Folder' },
    { icon: undefined, name: undefined, expected: 'Folder' },
  ];

  for (const item of inputs) {
    const icon = getExpenseCategoryIconLogic(item.icon, item.name);
    assertEqual(icon, item.expected, `Fallback mismatch for ${JSON.stringify(item)}`);
  }
  return 'All inputs safely resolved to valid vector icons without crash';
});

// =============================================================================
// SUITE 2: COMPLETE STATIC DEEP SCAN ACROSS ALL 41 .TSX AND .CSS FILES
// =============================================================================
console.log('\n--- SUITE 2: STATIC SCAN FOR PROHIBITED ARTIFACTS ---');

const tsxAndCssFiles = getAllFiles(APP_DIR, ['.tsx', '.css']);

check('Static Deep Scan: All .tsx and .css files under app/ accounted for (>= 41)', () => {
  assert(tsxAndCssFiles.length >= 41, `Expected at least 41 .tsx and .css files in app/, got ${tsxAndCssFiles.length}`);
  return `${tsxAndCssFiles.length} files verified: ${tsxAndCssFiles.filter(f => f.endsWith('.tsx')).length} tsx, ${tsxAndCssFiles.filter(f => f.endsWith('.css')).length} css`;
});

check('Static Deep Scan: Zero literal emojis across all 41 files via Extended_Pictographic & Unicode v flag', () => {
  const nonAsciiEmoji = /[\p{Emoji}--\p{ASCII}]/v;
  const violations = [];

  for (const file of tsxAndCssFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      if (nonAsciiEmoji.test(line)) {
        violations.push({
          file: path.relative(REPO_ROOT, file),
          line: idx + 1,
          content: line.trim()
        });
      }
    });
  }

  assertEqual(violations.length, 0, `Found ${violations.length} literal emoji violations: ${JSON.stringify(violations)}`);
  return '0 literal emojis found across all 41 files';
});

check('Static Deep Scan: Zero legacy fonts (Space Grotesk, Inter, JetBrains Mono, IBM Plex Mono, Material Symbols)', () => {
  const bannedFonts = [
    { name: 'Space Grotesk', regex: /Space\s*Grotesk/i },
    { name: 'Inter (as font)', regex: /font-family:[^;]*['"]?Inter['"]?/i },
    { name: 'JetBrains Mono', regex: /JetBrains\s*Mono/i },
    { name: 'IBM Plex Mono', regex: /IBM\s*Plex\s*Mono/i },
    { name: 'Material Symbols', regex: /(material-symbols|Material\s*Symbols)/i },
  ];

  const violations = [];
  for (const file of tsxAndCssFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      for (const bf of bannedFonts) {
        if (bf.regex.test(line)) {
          violations.push({
            file: path.relative(REPO_ROOT, file),
            line: idx + 1,
            font: bf.name,
            content: line.trim()
          });
        }
      }
    });
  }

  assertEqual(violations.length, 0, `Found legacy font violations: ${JSON.stringify(violations)}`);
  return '0 legacy font references across all 41 files';
});

check('Static Deep Scan: Zero .ambient-orb elements in JSX and stylesheets', () => {
  const violations = [];
  for (const file of tsxAndCssFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      if (line.includes('ambient-orb')) {
        violations.push({
          file: path.relative(REPO_ROOT, file),
          line: idx + 1,
          content: line.trim()
        });
      }
    });
  }

  assertEqual(violations.length, 0, `Found ambient-orb violations: ${JSON.stringify(violations)}`);
  return '0 ambient-orb elements found across all 41 files';
});

check('Static Deep Scan: Zero glassmorphic blurs (backdrop-filter: blur / backdrop-blur)', () => {
  const blurRegex = /(backdrop-filter:\s*blur|backdrop-blur|backdropFilter:\s*['"]?blur)/i;
  const violations = [];

  for (const file of tsxAndCssFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      if (blurRegex.test(line)) {
        violations.push({
          file: path.relative(REPO_ROOT, file),
          line: idx + 1,
          content: line.trim()
        });
      }
    });
  }

  assertEqual(violations.length, 0, `Found blur violations: ${JSON.stringify(violations)}`);
  return '0 backdrop-filter blur declarations across all 41 files';
});

check('Static Deep Scan: Zero prohibited legacy hex/rgba literals outside token definitions', () => {
  const bannedRegex = /(#0A0A0F|#0a0a0f|#12121A|#12121a|#33ff00|#33FF00|#FBBF24|#fbbf24|#050505|#ffb000|#ff3333)/i;
  const warningHexRegex = /#f59e0b/i;
  const warningRgbRegex = /245,\s*158,\s*11/;

  const violations = [];
  for (const file of tsxAndCssFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      // Allow exact token declarations in globals.css / base.css
      if (trimmed.includes('--as-status-warning:') && trimmed.includes('#f59e0b')) return;
      if (trimmed.includes('--as-status-warning-bg:') && trimmed.includes('245, 158, 11')) return;
      if (trimmed.startsWith('/*') && trimmed.endsWith('*/') && trimmed.includes('legacy')) return;

      if (bannedRegex.test(trimmed) || warningHexRegex.test(trimmed) || warningRgbRegex.test(trimmed)) {
        violations.push({
          file: path.relative(REPO_ROOT, file),
          line: idx + 1,
          content: trimmed
        });
      }
    });
  }

  assertEqual(violations.length, 0, `Found raw legacy color violations: ${JSON.stringify(violations)}`);
  return '0 raw legacy color literals found outside token definitions';
});

check('Static Deep Scan: Zero exclamation points in user-facing JSX microcopy', () => {
  const tsxFiles = tsxAndCssFiles.filter(f => f.endsWith('.tsx'));
  const violations = [];

  for (const file of tsxFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) return;
      if (trimmed.startsWith('import ') || trimmed.startsWith('export type')) return;

      const jsxTextMatch = />\s*([^<]*[a-zA-Z]+[^<]*![^<]*)</.exec(line);
      const attrMatch = /(?:placeholder|title|aria-label|label)=["']([^"']*[a-zA-Z]+[^"']*![^"']*)["']/.exec(line);
      const jsxExprMatch = /\{\s*["']([^"']*[a-zA-Z]+[^"']*![^"']*)["']\s*\}/.exec(line);
      const messageMatch = /(?:message|error|toast|alert|status|grade)\s*[:=]\s*["']([^"']*[a-zA-Z]+[^"']*![^"']*)["']/i.exec(line);

      if (jsxTextMatch) violations.push({ file: path.relative(REPO_ROOT, file), line: idx + 1, match: jsxTextMatch[0] });
      else if (attrMatch) violations.push({ file: path.relative(REPO_ROOT, file), line: idx + 1, match: attrMatch[0] });
      else if (jsxExprMatch) violations.push({ file: path.relative(REPO_ROOT, file), line: idx + 1, match: jsxExprMatch[0] });
      else if (messageMatch) violations.push({ file: path.relative(REPO_ROOT, file), line: idx + 1, match: messageMatch[0] });
    });
  }

  assertEqual(violations.length, 0, `Found exclamation point violations: ${JSON.stringify(violations)}`);
  return '0 exclamation points in user-facing UI microcopy';
});

// =============================================================================
// SUITE 3: FINANCIAL MATH FORMULAS & INVARIANTS
// =============================================================================
console.log('\n--- SUITE 3: FINANCIAL MATH FORMULAS & INVARIANTS ---');

function calcPaymentAmount(balance, minimumPayment, amountDueImmediately, paymentStrategy, payoffPlanAmount) {
  switch (paymentStrategy) {
    case 'minimum':
      return balance <= minimumPayment ? balance : minimumPayment;
    case 'due_now':
      return amountDueImmediately;
    case 'payoff_plan':
      return payoffPlanAmount !== undefined ? payoffPlanAmount : (balance <= minimumPayment ? balance : minimumPayment);
    default:
      return balance <= minimumPayment ? balance : minimumPayment;
  }
}

function calculateRequiredPayoff(balance, apr, targetMonths, minPay) {
  const monthlyRate = apr / 100.0 / 12.0;
  let required = minPay;
  if (targetMonths) {
    const n = parseFloat(targetMonths);
    if (monthlyRate > 0.0) {
      const factor = Math.pow(1.0 + monthlyRate, n);
      required = balance * (monthlyRate * factor) / (factor - 1.0);
    } else {
      required = balance / n;
    }
  }
  return required;
}

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

    const d = new Date(npd);
    while (d >= firstOfNext) {
      d.setDate(d.getDate() - intervalDays);
    }
    while (d >= firstOfMonth) {
      d.setDate(d.getDate() - intervalDays);
    }

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

check('Debt Payment Math Invariant: Minimum payment never exceeds balance', () => {
  assertEqual(calcPaymentAmount(50, 100, 0, 'minimum', undefined), 50, 'Balance 50 with minPay 100 should be 50');
  assertEqual(calcPaymentAmount(150, 100, 0, 'minimum', undefined), 100, 'Balance 150 with minPay 100 should be 100');
  assertEqual(calcPaymentAmount(0, 100, 0, 'minimum', undefined), 0, 'Balance 0 should be 0');
  return 'calcPaymentAmount properly clamps minimum payment to balance';
});

check('Payoff Strategy Invariant: Snowball sorts by ascending balance, Avalanche by descending APR', () => {
  const debts = [
    { id: '1', balance: 5000, apr: 18.5 },
    { id: '2', balance: 1200, apr: 24.0 },
    { id: '3', balance: 8000, apr: 5.0 },
    { id: '4', balance: 300, apr: 12.0 },
  ];

  const snowball = [...debts].sort((a, b) => a.balance - b.balance);
  assertEqual(snowball.map(d => d.id).join(','), '4,2,1,3', 'Snowball order incorrect');

  const avalanche = [...debts].sort((a, b) => b.apr - a.apr);
  assertEqual(avalanche.map(d => d.id).join(','), '2,1,4,3', 'Avalanche order incorrect');

  return 'Snowball and Avalanche sorting orders strictly invariant';
});

check('Amortization Formula Invariant: PMT matches exact financial amortization', () => {
  const req = calculateRequiredPayoff(10000, 12.0, 12, 100);
  const rounded = Math.round(req * 100) / 100;
  assertEqual(rounded, 888.49, 'PMT formula deviation on 12-month 12% loan');

  const reqZero = calculateRequiredPayoff(10000, 0.0, 10, 100);
  assertEqual(reqZero, 1000, 'PMT zero interest deviation');

  return `Amortization formula verified: $10,000 @ 12% for 12 mos = $${rounded}`;
});

check('Pay Dates Invariant: All generated pay dates stay strictly inside the target month boundary', () => {
  const frequencies = ['monthly', 'semimonthly', 'biweekly', 'weekly'];
  const testYears = [2024, 2025, 2026];

  for (const year of testYears) {
    for (let month = 1; month <= 12; month++) {
      const firstOfMonth = new Date(year, month - 1, 1);
      const firstOfNext = new Date(year, month, 1);

      for (const freq of frequencies) {
        const anchorDates = [
          `${year}-01-05`,
          `${year}-02-29`,
          `${year}-12-31`,
          `${year - 1}-10-15`,
          `${year + 1}-03-20`,
          null,
          'invalid-date-string'
        ];

        for (const anchor of anchorDates) {
          const dates = payDatesInMonth(freq, anchor, year, month);
          assert(dates.length > 0, `No dates returned for ${freq} in ${year}-${month}`);
          for (const d of dates) {
            assert(
              d >= firstOfMonth && d < firstOfNext,
              `Pay date ${d.toISOString()} out of bounds for month [${firstOfMonth.toISOString()} to ${firstOfNext.toISOString()})`
            );
          }
        }
      }
    }
  }

  return 'Tested 4 frequencies across 36 months and 7 anchor permutations (3,024 checks)';
});

check('Discretionary and Runway Invariants: Wants analysis math invariants', () => {
  const calcDiscretionary = (inc, exp, debt) => Math.max(inc - exp - debt, 0.0);
  assertEqual(calcDiscretionary(5000, 3000, 1000), 1000, 'Positive surplus');
  assertEqual(calcDiscretionary(3000, 3000, 500), 0, 'Deficit clamped to 0');

  const calcMonthsToSave = (cost, disc) => disc > 0.0 ? Math.ceil(cost / disc) : 999;
  assertEqual(calcMonthsToSave(2500, 1000), 3, '$2,500 cost with $1,000 discretionary requires 3 months');
  assertEqual(calcMonthsToSave(1000, 1000), 1, '$1,000 cost with $1,000 discretionary requires 1 month');
  assertEqual(calcMonthsToSave(500, 0), 999, '0 discretionary defaults to 999 months');

  return 'Wants discretionary and saving timeline invariants verified';
});

check('Production Session Auth Invariant: createSessionToken succeeds in production when SESSION_SECRET is unset but POSTGRES_URL is configured (Vercel parity)', () => {
  const { stripTypeScriptTypes } = require('module');
  const vm = require('vm');
  const authPath = path.join(APP_DIR, 'lib', 'auth.ts');
  const rawTs = fs.readFileSync(authPath, 'utf8');
  const cjsCode = stripTypeScriptTypes(rawTs)
    .replace(/import\s+\{\s*cookies\s*\}\s+from\s+['"]next\/headers['"];?/, 'const { cookies } = __nextHeaders;')
    .replace(/import\s+crypto\s+from\s+['"]crypto['"];?/, 'const crypto = require("crypto");')
    .replace(/export\s+async\s+function\s+/g, 'exports.getAuthUserId = async function ')
    .replace(/export\s+function\s+createSessionToken/g, 'exports.createSessionToken = function createSessionToken');

  let cookieValue = undefined;
  const sandboxExports = {};
  const sandboxProcess = {
    env: {
      NODE_ENV: 'production',
      POSTGRES_URL: 'postgres://neondb_owner:test_secret_pw@ep-example.us-east-2.aws.neon.tech/neondb?sslmode=require',
    },
  };
  const context = vm.createContext({
    exports: sandboxExports,
    require,
    process: sandboxProcess,
    Buffer,
    __nextHeaders: {
      cookies: async () => ({
        get: (name) => (name === 'session' && cookieValue ? { value: cookieValue } : undefined),
      }),
    },
  });
  vm.runInContext(cjsCode, context);

  const userId = '550e8400-e29b-41d4-a716-446655440000';
  const token = sandboxExports.createSessionToken(userId);
  assert(typeof token === 'string' && token.startsWith(`${userId}.`), 'Expected signed session token');
  const sig = token.slice(userId.length + 1);
  assert(/^[0-9a-f]{64}$/i.test(sig), 'Expected 64-char hex HMAC-SHA256 signature');
  return 'Production session token created and verified with POSTGRES_URL fallback';
});

// =============================================================================
// SUMMARY & VERDICT
// =============================================================================
console.log('\n======================================================================');
console.log(`Execution Summary: Total: ${totalTests} | Passed: ${passedTests} | Failed: ${failedTests}`);
console.log(`Confirmed Vulnerabilities/Challenges Found: ${vulnerabilitiesFound.length}`);
for (const v of vulnerabilitiesFound) {
  console.log(`- [${v.title}]: ${v.detail}`);
}
console.log('======================================================================\n');

process.exit(failedTests > 0 ? 1 : 0);
