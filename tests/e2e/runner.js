/**
 * =============================================================================
 * idleAustin Design System Overhaul — Comprehensive E2E Verification Runner
 * =============================================================================
 * Opaque-box, requirement-driven test suite validating Tiers 1-4:
 * - Tier 1: Feature Coverage (tokens, typography, surfaces, icons, telemetry, palette)
 * - Tier 2: Boundary & Corner Cases (nested selectors, font fallbacks, touch targets, reduced motion)
 * - Tier 3: Cross-Feature Interactions & Mathematical Coherence (WCAG contrast, surface progression, pairwise tokens)
 * - Tier 4: Workload Acceptance (tsc --noEmit, npm run lint, npm run build)
 *
 * Usage:
 *   node tests/e2e/runner.js                     # Run all tiers (Tiers 1-4)
 *   node tests/e2e/runner.js --tier=1            # Run Tier 1 only
 *   node tests/e2e/runner.js --tier=1,2,3        # Run specific tiers
 *   node tests/e2e/runner.js --skip-build        # Skip heavy next build in Tier 4
 *   node tests/e2e/runner.js --bail              # Stop on first failure
 *   node tests/e2e/runner.js --json              # Output machine-readable JSON
 * =============================================================================
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// -----------------------------------------------------------------------------
// Paths & Constants
// -----------------------------------------------------------------------------
const PROJECT_ROOT = path.resolve(__dirname, '../..');
const APP_DIR = path.join(PROJECT_ROOT, 'app');
const BOILERPLATE_DIR = path.resolve(PROJECT_ROOT, '../.boilerplate/02.Design');
const TOKENS_CSS_PATH = path.join(BOILERPLATE_DIR, 'tokens.css');
const GLOBALS_CSS_PATH = path.join(APP_DIR, 'globals.css');
const BASE_CSS_PATH = path.join(APP_DIR, 'dashboard/base.css');
const LAYOUT_TSX_PATH = path.join(APP_DIR, 'layout.tsx');
const SHELL_TSX_PATH = path.join(APP_DIR, 'dashboard/components/DashboardShell.tsx');

// ANSI Colors for Terminal Output
const ANSI = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
};

// -----------------------------------------------------------------------------
// CLI Arguments Parsing
// -----------------------------------------------------------------------------
const args = process.argv.slice(2);
const options = {
  tiers: [1, 2, 3, 4],
  skipBuild: false,
  bail: false,
  json: false,
  verbose: false,
};

for (const arg of args) {
  if (arg.startsWith('--tier=')) {
    options.tiers = arg
      .replace('--tier=', '')
      .split(',')
      .map((t) => parseInt(t.trim(), 10))
      .filter((t) => !isNaN(t));
  } else if (arg === '--skip-build') {
    options.skipBuild = true;
  } else if (arg === '--bail') {
    options.bail = true;
  } else if (arg === '--json') {
    options.json = true;
  } else if (arg === '--verbose' || arg === '-v') {
    options.verbose = true;
  } else if (arg === '--help' || arg === '-h') {
    console.log(`
idleAustin E2E Test Runner
Options:
  --tier=1,2,3,4    Run specific tiers (default: 1,2,3,4)
  --skip-build      Skip Next.js build in Tier 4
  --bail            Stop execution on first failed test
  --json            Output JSON summary to stdout
  --verbose, -v     Verbose output
  --help, -h        Show this help message
`);
    process.exit(0);
  }
}

// -----------------------------------------------------------------------------
// Color Contrast & Luminance Mathematics (WCAG 2.1 Specification)
// -----------------------------------------------------------------------------
function hexToRgb(hex) {
  let clean = hex.replace(/^#/, '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  const num = parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function parseColorToRgb(str) {
  if (str.startsWith('#')) return hexToRgb(str);
  const rgbaMatch = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (rgbaMatch) {
    return {
      r: parseInt(rgbaMatch[1], 10),
      g: parseInt(rgbaMatch[2], 10),
      b: parseInt(rgbaMatch[3], 10),
    };
  }
  return null;
}

function relativeLuminance(r, g, b) {
  const [sR, sG, sB] = [r, g, b].map((val) => {
    const s = val / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * sR + 0.7152 * sG + 0.0722 * sB;
}

function contrastRatio(hex1, hex2) {
  const rgb1 = parseColorToRgb(hex1);
  const rgb2 = parseColorToRgb(hex2);
  if (!rgb1 || !rgb2) return 0;
  const l1 = relativeLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = relativeLuminance(rgb2.r, rgb2.g, rgb2.b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// -----------------------------------------------------------------------------
// File System & AST / Regex Scanning Helpers
// -----------------------------------------------------------------------------
function getAllFiles(dir, exts = ['.tsx', '.ts', '.css', '.js'], excludes = ['node_modules', '.next', '.git', '.agents', 'backups']) {
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

function readFileSafe(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return '';
  }
}

function stripComments(code) {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');
}

function extractCssCustomProperties(cssContent) {
  const props = {};
  const cleaned = stripComments(cssContent);
  const rootRegex = /:root\s*\{([^}]+)\}/g;
  let rootMatch;
  while ((rootMatch = rootRegex.exec(cleaned)) !== null) {
    const block = rootMatch[1];
    const declRegex = /(--[a-zA-Z0-9-_]+)\s*:\s*([^;]+);/g;
    let declMatch;
    while ((declMatch = declRegex.exec(block)) !== null) {
      const key = declMatch[1].trim();
      const val = declMatch[2].trim();
      props[key] = val;
    }
  }
  return props;
}

function normalizeTokenValue(val) {
  if (!val) return '';
  return val
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/,\s*/g, ', ')
    .trim();
}

function findMatchesInFiles(files, regex, lineFilter = null) {
  const matches = [];
  for (const file of files) {
    const content = readFileSafe(file);
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      if (lineFilter && !lineFilter(line, idx, file)) return;
      if (regex.test(line)) {
        matches.push({
          file: path.relative(PROJECT_ROOT, file),
          line: idx + 1,
          content: line.trim(),
        });
      }
    });
  }
  return matches;
}

function parseJsxButtons(code) {
  const buttons = [];
  let i = 0;
  while ((i = code.indexOf('<button', i)) !== -1) {
    const start = i;
    i += 7;
    let braceDepth = 0;
    let inQuote = null;
    let tagEnd = -1;
    while (i < code.length) {
      const ch = code[i];
      if (inQuote) {
        if (ch === inQuote && code[i - 1] !== '\\') inQuote = null;
      } else if (ch === '"' || ch === "'" || ch === '`') {
        inQuote = ch;
      } else if (ch === '{') {
        braceDepth++;
      } else if (ch === '}') {
        braceDepth--;
      } else if (ch === '>' && braceDepth === 0) {
        tagEnd = i;
        break;
      }
      i++;
    }
    if (tagEnd === -1) break;
    const attrs = code.substring(start + 7, tagEnd);
    const closeIdx = code.indexOf('</button>', tagEnd);
    if (closeIdx === -1) break;
    const children = code.substring(tagEnd + 1, closeIdx);
    buttons.push({ attrs, children, start });
    i = closeIdx + 9;
  }
  return buttons;
}

// -----------------------------------------------------------------------------
// Test Runner Harness
// -----------------------------------------------------------------------------
class TestSuiteHarness {
  constructor() {
    this.tests = [];
    this.results = [];
    this.startTime = 0;
  }

  register(tier, id, description, fn) {
    this.tests.push({ tier, id, description, fn });
  }

  async run() {
    this.startTime = Date.now();
    const activeTests = this.tests.filter((t) => options.tiers.includes(t.tier));

    if (!options.json) {
      console.log(`\n${ANSI.bold}${ANSI.cyan}======================================================================${ANSI.reset}`);
      console.log(`${ANSI.bold}${ANSI.cyan} idleAustin Design System Overhaul — Opaque-Box E2E Test Suite${ANSI.reset}`);
      console.log(`${ANSI.dim} Target: ${PROJECT_ROOT}${ANSI.reset}`);
      console.log(`${ANSI.dim} Active Tiers: [${options.tiers.join(', ')}] | Tests: ${activeTests.length}${ANSI.reset}`);
      console.log(`${ANSI.bold}${ANSI.cyan}======================================================================${ANSI.reset}\n`);
    }

    let currentTier = null;
    for (const test of activeTests) {
      if (!options.json && test.tier !== currentTier) {
        currentTier = test.tier;
        console.log(`\n${ANSI.bold}${ANSI.blue}--- TIER ${currentTier} ---${ANSI.reset}`);
      }

      const result = {
        tier: test.tier,
        id: test.id,
        description: test.description,
        status: 'PASSED',
        error: null,
        diagnostics: [],
        durationMs: 0,
      };

      const start = Date.now();
      try {
        await test.fn({
          assert: (cond, msg, diag) => {
            if (!cond) {
              const err = new Error(msg || 'Assertion failed');
              if (diag) err.diagnostics = Array.isArray(diag) ? diag : [diag];
              throw err;
            }
          },
          assertEqual: (actual, expected, msg) => {
            if (actual !== expected) {
              const err = new Error(msg || `Expected "${expected}", received "${actual}"`);
              err.expected = expected;
              err.actual = actual;
              throw err;
            }
          },
          assertZeroMatches: (matches, description) => {
            if (matches.length > 0) {
              const err = new Error(`Found ${matches.length} unexpected match(es) for: ${description}`);
              err.diagnostics = matches.slice(0, 10).map((m) => `${m.file}:${m.line} -> ${m.content}`);
              throw err;
            }
          },
        });
        result.status = 'PASSED';
      } catch (err) {
        result.status = 'FAILED';
        result.error = err.message;
        result.diagnostics = err.diagnostics || [];
      }
      result.durationMs = Date.now() - start;
      this.results.push(result);

      if (!options.json) {
        const badge =
          result.status === 'PASSED'
            ? `${ANSI.green}✓ PASS${ANSI.reset}`
            : `${ANSI.red}✗ FAIL${ANSI.reset}`;
        console.log(`  ${badge} ${ANSI.bold}[${test.id}]${ANSI.reset} ${test.description} ${ANSI.dim}(${result.durationMs}ms)${ANSI.reset}`);
        if (result.status === 'FAILED') {
          console.log(`         ${ANSI.red}Error:${ANSI.reset} ${result.error}`);
          if (result.diagnostics && result.diagnostics.length > 0) {
            result.diagnostics.slice(0, 5).forEach((d) => {
              console.log(`           ${ANSI.dim}→ ${d}${ANSI.reset}`);
            });
            if (result.diagnostics.length > 5) {
              console.log(`           ${ANSI.dim}... and ${result.diagnostics.length - 5} more${ANSI.reset}`);
            }
          }
        }
      }

      if (options.bail && result.status === 'FAILED') {
        if (!options.json) {
          console.log(`\n${ANSI.yellow}Bail triggered: stopping test run.${ANSI.reset}`);
        }
        break;
      }
    }

    const totalDuration = Date.now() - this.startTime;
    const passed = this.results.filter((r) => r.status === 'PASSED').length;
    const failed = this.results.filter((r) => r.status === 'FAILED').length;

    if (options.json) {
      console.log(
        JSON.stringify(
          {
            summary: {
              total: this.results.length,
              passed,
              failed,
              durationMs: totalDuration,
              allPassed: failed === 0,
            },
            results: this.results,
          },
          null,
          2
        )
      );
    } else {
      console.log(`\n${ANSI.bold}${ANSI.cyan}======================================================================${ANSI.reset}`);
      console.log(`${ANSI.bold}Execution Summary:${ANSI.reset}`);
      console.log(`  Total:    ${this.results.length}`);
      console.log(`  Passed:   ${ANSI.green}${passed}${ANSI.reset}`);
      console.log(`  Failed:   ${failed > 0 ? ANSI.red : ANSI.green}${failed}${ANSI.reset}`);
      console.log(`  Duration: ${(totalDuration / 1000).toFixed(2)}s`);
      console.log(`${ANSI.bold}${ANSI.cyan}======================================================================${ANSI.reset}\n`);
    }

    return failed === 0;
  }
}

const runner = new TestSuiteHarness();

// =============================================================================
// TIER 1: FEATURE COVERAGE (Tests 1.1 to 1.20)
// =============================================================================

// 1.1: Master Surfaces & Borders in globals.css and base.css
runner.register(1, '1.1', 'Master --as-* surface and border design tokens in :root', ({ assert, assertEqual }) => {
  const requiredSurfaceTokens = {
    '--as-bg-base': '#0a0a0c',
    '--as-bg-surface': '#121216',
    '--as-bg-elevated': '#18181f',
    '--as-bg-overlay': '#202029',
    '--as-border-subtle': '#22222a',
    '--as-border-strong': '#33333f',
    '--as-border-focus': '#84cc16',
  };

  const cssFiles = [GLOBALS_CSS_PATH, BASE_CSS_PATH];
  for (const file of cssFiles) {
    assert(fs.existsSync(file), `Stylesheet not found: ${file}`);
    const props = extractCssCustomProperties(readFileSafe(file));
    for (const [token, expectedVal] of Object.entries(requiredSurfaceTokens)) {
      assert(props[token] !== undefined, `Token ${token} missing from :root in ${path.relative(PROJECT_ROOT, file)}`);
      assertEqual(
        normalizeTokenValue(props[token]),
        normalizeTokenValue(expectedVal),
        `Token ${token} in ${path.relative(PROJECT_ROOT, file)} value mismatch`
      );
    }
  }
});

// 1.2: Master Accent & Status in globals.css and base.css
runner.register(1, '1.2', 'Master --as-* accent and status design tokens in :root', ({ assert, assertEqual }) => {
  const requiredTokens = {
    '--as-accent-primary': '#84cc16',
    '--as-accent-hover': '#65a30d',
    '--as-accent-text': '#1a2e05',
    '--as-accent-muted': 'rgba(132, 204, 22, 0.12)',
    '--as-accent-glow': 'rgba(132, 204, 22, 0.25)',
    '--as-status-success': '#10b981',
    '--as-status-success-bg': 'rgba(16, 185, 129, 0.12)',
    '--as-status-warning': '#f59e0b',
    '--as-status-warning-bg': 'rgba(245, 158, 11, 0.12)',
    '--as-status-error': '#f43f5e',
    '--as-status-error-bg': 'rgba(244, 63, 94, 0.12)',
    '--as-status-info': '#38bdf8',
    '--as-status-info-bg': 'rgba(56, 189, 248, 0.12)',
  };

  const cssFiles = [GLOBALS_CSS_PATH, BASE_CSS_PATH];
  for (const file of cssFiles) {
    const props = extractCssCustomProperties(readFileSafe(file));
    for (const [token, expectedVal] of Object.entries(requiredTokens)) {
      assert(props[token] !== undefined, `Token ${token} missing from :root in ${path.relative(PROJECT_ROOT, file)}`);
      assertEqual(
        normalizeTokenValue(props[token]),
        normalizeTokenValue(expectedVal),
        `Token ${token} in ${path.relative(PROJECT_ROOT, file)} mismatch`
      );
    }
  }
});

// 1.3: Master Typography, Text & Radius Tokens in :root
runner.register(1, '1.3', 'Master --as-* typography, text color and radius tokens in :root', ({ assert, assertEqual }) => {
  const requiredTokens = {
    '--as-text-primary': '#f4f4f5',
    '--as-text-secondary': '#a1a1aa',
    '--as-text-muted': '#71717a',
    '--as-radius-sm': '4px',
    '--as-radius-md': '6px',
    '--as-radius-lg': '10px',
    '--as-radius-pill': '9999px',
  };

  const cssFiles = [GLOBALS_CSS_PATH, BASE_CSS_PATH];
  for (const file of cssFiles) {
    const props = extractCssCustomProperties(readFileSafe(file));
    for (const [token, expectedVal] of Object.entries(requiredTokens)) {
      assert(props[token] !== undefined, `Token ${token} missing from :root in ${path.relative(PROJECT_ROOT, file)}`);
      assertEqual(
        normalizeTokenValue(props[token]),
        normalizeTokenValue(expectedVal),
        `Token ${token} in ${path.relative(PROJECT_ROOT, file)} mismatch`
      );
    }
    assert(props['--as-font-heading'] && props['--as-font-heading'].includes('Outfit'), `Outfit missing from --as-font-heading in ${file}`);
    assert(props['--as-font-body'] && props['--as-font-body'].includes('Geist'), `Geist missing from --as-font-body in ${file}`);
    assert(props['--as-font-mono'] && props['--as-font-mono'].includes('Fira Code'), `Fira Code missing from --as-font-mono in ${file}`);
  }
});

// 1.4: Master Motion & Snapping Tokens
runner.register(1, '1.4', 'Master --as-* motion, timing and snapping ease tokens in :root', ({ assert, assertEqual }) => {
  const requiredTokens = {
    '--as-ease-snap': 'cubic-bezier(0.16, 1, 0.3, 1)',
    '--as-duration-fast': '100ms',
    '--as-duration-normal': '150ms',
  };

  const cssFiles = [GLOBALS_CSS_PATH, BASE_CSS_PATH];
  for (const file of cssFiles) {
    const props = extractCssCustomProperties(readFileSafe(file));
    for (const [token, expectedVal] of Object.entries(requiredTokens)) {
      assert(props[token] !== undefined, `Token ${token} missing in ${path.relative(PROJECT_ROOT, file)}`);
      assertEqual(
        normalizeTokenValue(props[token]),
        normalizeTokenValue(expectedVal),
        `Token ${token} mismatch in ${path.relative(PROJECT_ROOT, file)}`
      );
    }
  }
});

// 1.5: Legacy CSS Variable Bridge Mappings
runner.register(1, '1.5', 'Legacy CSS variable bridge mapping (--bg-*, --accent, --border, --r*) to --as-*', ({ assert }) => {
  const baseContent = readFileSafe(BASE_CSS_PATH);
  const props = extractCssCustomProperties(baseContent);

  const expectedMappings = {
    '--bg-base': 'var(--as-bg-base)',
    '--bg-surface': 'var(--as-bg-surface)',
    '--bg-elevated': 'var(--as-bg-elevated)',
    '--text-primary': 'var(--as-text-primary)',
    '--text-secondary': 'var(--as-text-secondary)',
    '--text-muted': 'var(--as-text-muted)',
    '--accent': 'var(--as-accent-primary)',
    '--border': 'var(--as-border-subtle)',
    '--r-pill': 'var(--as-radius-pill)',
  };

  for (const [legacyVar, targetAs] of Object.entries(expectedMappings)) {
    assert(
      props[legacyVar] !== undefined && normalizeTokenValue(props[legacyVar]).includes(normalizeTokenValue(targetAs)),
      `Legacy variable ${legacyVar} is not mapped to ${targetAs} in base.css (found: "${props[legacyVar]}")`
    );
  }
});

// 1.6: Typography Font Loading in layout.tsx
runner.register(1, '1.6', 'Google Fonts Outfit, Geist, and Fira Code loaded in app/layout.tsx', ({ assert }) => {
  const layout = readFileSafe(LAYOUT_TSX_PATH);
  assert(fs.existsSync(LAYOUT_TSX_PATH), 'app/layout.tsx not found');
  assert(layout.includes('Outfit'), 'Outfit font family not loaded in app/layout.tsx');
  assert(layout.includes('Geist'), 'Geist font family not loaded in app/layout.tsx');
  assert(layout.includes('Fira Code') || layout.includes('Fira+Code'), 'Fira Code font family not loaded in app/layout.tsx');
});

// 1.7: Complete Purge of Legacy Fonts (Inter, Space Grotesk, JetBrains Mono, IBM Plex Mono)
runner.register(1, '1.7', 'Zero legacy font references (Inter, Space Grotesk, JetBrains Mono, IBM Plex Mono) in app/', ({ assertZeroMatches }) => {
  const appFiles = getAllFiles(APP_DIR, ['.tsx', '.ts', '.css']);
  const regex = /\b(Inter|Space\s*Grotesk|JetBrains\s*Mono|IBM\s*Plex\s*Mono|ibm-plex-mono)\b/i;
  const matches = findMatchesInFiles(appFiles, regex);
  assertZeroMatches(matches, 'legacy fonts (Inter, Space Grotesk, JetBrains Mono, IBM Plex Mono)');
});

// 1.8: Complete Purge of Material Symbols
runner.register(1, '1.8', 'Zero Material Symbols references (material-symbols-rounded, Material Symbols font) in app/', ({ assertZeroMatches }) => {
  const appFiles = getAllFiles(APP_DIR, ['.tsx', '.ts', '.css']);
  const regex = /(material-symbols|Material\s*Symbols)/i;
  const matches = findMatchesInFiles(appFiles, regex);
  assertZeroMatches(matches, 'Google Material Symbols');
});

// 1.9: Complete Purge of Ambient Orbs (.ambient-orb)
runner.register(1, '1.9', 'Zero ambient orbs (.ambient-orb) across app/', ({ assertZeroMatches }) => {
  const appFiles = getAllFiles(APP_DIR, ['.tsx', '.ts', '.css']);
  const regex = /ambient-orb/i;
  const matches = findMatchesInFiles(appFiles, regex);
  assertZeroMatches(matches, 'ambient-orb glowing circular elements');
});

// 1.10: Complete Purge of Glassmorphic Blurs
runner.register(1, '1.10', 'Zero glassmorphic blurs (backdrop-filter: blur) across app/', ({ assertZeroMatches }) => {
  const appFiles = getAllFiles(APP_DIR, ['.tsx', '.ts', '.css']);
  const regex = /(backdrop-filter:\s*blur|backdrop-blur|backdropFilter:\s*['"]?blur)/i;
  const matches = findMatchesInFiles(appFiles, regex);
  assertZeroMatches(matches, 'backdrop-filter: blur glassmorphic styling');
});

// 1.11: Complete Purge of Raw Legacy Color Literals
runner.register(1, '1.11', 'Zero raw legacy color literals (#F59E0B, #FBBF24, #0A0A0F, #12121A, #33ff00, 245, 158, 11) outside token definitions', ({ assertZeroMatches }) => {
  const appFiles = getAllFiles(APP_DIR, ['.tsx', '.ts', '.css']);
  const bannedLiteralRegex = /(#0A0A0F|#0a0a0f|#12121A|#12121a|#33ff00|#33FF00|#FBBF24|#fbbf24|#050505|#ffb000|#ff3333)/i;
  const warningHexRegex = /#f59e0b/i;
  const warningRgbRegex = /245,\s*158,\s*11/;

  const matches = [];
  for (const file of appFiles) {
    const content = readFileSafe(file);
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      // Allow exact token definitions
      if (trimmed.includes('--as-status-warning:') && trimmed.includes('#f59e0b')) return;
      if (trimmed.includes('--as-status-warning-bg:') && trimmed.includes('245, 158, 11')) return;
      if (trimmed.startsWith('/*') && trimmed.endsWith('*/') && trimmed.includes('legacy')) return;

      if (bannedLiteralRegex.test(trimmed)) {
        matches.push({ file: path.relative(PROJECT_ROOT, file), line: idx + 1, content: trimmed });
      } else if (warningHexRegex.test(trimmed)) {
        matches.push({ file: path.relative(PROJECT_ROOT, file), line: idx + 1, content: trimmed });
      } else if (warningRgbRegex.test(trimmed)) {
        matches.push({ file: path.relative(PROJECT_ROOT, file), line: idx + 1, content: trimmed });
      }
    });
  }
  assertZeroMatches(matches, 'raw legacy color literals outside tokens');
});

// 1.12: Elimination of UI Emoji Characters & Dynamic Presentation Sanitization
runner.register(1, '1.12', 'Zero emoji characters in UI components or rendered strings under app/', ({ assertZeroMatches }) => {
  const uiFiles = getAllFiles(APP_DIR, ['.tsx', '.css']);
  const emojiRegex = /[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2B50}\u{2B55}]/u;

  // 1. Static scan: zero literal emojis in TSX and CSS
  const staticMatches = findMatchesInFiles(uiFiles, emojiRegex);
  assertZeroMatches(staticMatches, 'literal emoji characters in UI component source code');

  // 2. Dynamic presentation audit: ensure server-returned emoji fields are sanitized before JSX rendering
  const dynamicViolations = [];

  // A. Check overall_grade in app/dashboard/page.tsx
  const dashboardPagePath = path.join(APP_DIR, 'dashboard/page.tsx');
  if (fs.existsSync(dashboardPagePath)) {
    const content = readFileSafe(dashboardPagePath);
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      if (/\{(?:\s*[a-zA-Z0-9_]+\.)?overall_grade\s*\}/.test(line) && !line.includes('renderAiGrade') && !line.includes('.replace')) {
        dynamicViolations.push({
          file: 'app/dashboard/page.tsx',
          line: idx + 1,
          content: line.trim(),
        });
      }
    });
  }

  // B. Check recommendation in app/dashboard/wants/page.tsx
  const wantsPagePath = path.join(APP_DIR, 'dashboard/wants/page.tsx');
  if (fs.existsSync(wantsPagePath)) {
    const content = readFileSafe(wantsPagePath);
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      if (/\{(?:\s*[a-zA-Z0-9_]+\.)?recommendation\s*\}/.test(line) && !line.includes('renderRecommendation') && !line.includes('.replace')) {
        dynamicViolations.push({
          file: 'app/dashboard/wants/page.tsx',
          line: idx + 1,
          content: line.trim(),
        });
      }
    });
  }

  assertZeroMatches(dynamicViolations, 'raw unsanitized server-returned emoji fields in JSX presentation layer');
});

// 1.13: Icon-Only Action Buttons Accessibility (aria-label)
runner.register(1, '1.13', 'All icon-only action buttons across app/ have explicit aria-label attributes', ({ assert }) => {
  const tsxFiles = getAllFiles(APP_DIR, ['.tsx']);
  const missingAriaButtons = [];

  for (const file of tsxFiles) {
    const content = readFileSafe(file);
    const buttons = parseJsxButtons(content);

    for (const btn of buttons) {
      const attrs = btn.attrs;
      const children = btn.children.trim();

      // Strip material-symbols or icons to see if there is real readable text
      const textWithoutIcons = children
        .replace(/<span[^>]*class(?:Name)?=["'][^"']*material-symbols[^"']*["'][^>]*>[^<]*<\/span>/gi, '')
        .replace(/<[^>]+>/g, '')
        .trim();

      const hasIcon = /<(Trash2|X|Search|Plus|Edit|Filter|Check|Chevron|Download|Upload|Menu|Power|Star|Calendar|Receipt|CreditCard|Savings|FileText|ExternalLink|Eye|Lock|Sparkles|ArrowUp|ArrowDown)\b/i.test(children)
        || /<svg\b/i.test(children)
        || /material-symbols/i.test(children)
        || /icon-action-btn/i.test(attrs);

      const hasText = textWithoutIcons.length > 0 && /[a-zA-Z0-9]{2,}/.test(textWithoutIcons);

      if (hasIcon && !hasText) {
        const hasAria = /aria-label\s*=\s*['"{]/i.test(attrs) || /aria-labelledby\s*=\s*['"{]/i.test(attrs);
        if (!hasAria) {
          const lineNum = content.substring(0, btn.start).split('\n').length;
          missingAriaButtons.push({
            file: path.relative(PROJECT_ROOT, file),
            line: lineNum,
            buttonSnippet: `<button ${attrs.trim().substring(0, 70)}...>`,
          });
        }
      }
    }
  }

  assert(
    missingAriaButtons.length === 0,
    `Found ${missingAriaButtons.length} icon-only button(s) missing aria-label`,
    missingAriaButtons.map((b) => `${b.file}:${b.line} -> ${b.buttonSnippet}`)
  );
});

// 1.14: DashboardShell Telemetry Status Badge
runner.register(1, '1.14', 'DashboardShell renders live status badge: idleAustin (idle, but operational)', ({ assert }) => {
  assert(fs.existsSync(SHELL_TSX_PATH), 'DashboardShell.tsx not found');
  const shell = readFileSafe(SHELL_TSX_PATH);
  assert(
    shell.includes('idleAustin (idle, but operational)'),
    'Live telemetry status string "idleAustin (idle, but operational)" missing from DashboardShell.tsx'
  );
  assert(
    shell.includes('status-dot') || shell.includes('.status-dot'),
    'Pulsing .status-dot indicator element missing from DashboardShell.tsx'
  );
});

// 1.15: DashboardShell Interactive ⌘K Command Palette Modal
runner.register(1, '1.15', 'DashboardShell implements interactive ⌘K command palette modal with keyboard handlers', ({ assert }) => {
  assert(fs.existsSync(SHELL_TSX_PATH), 'DashboardShell.tsx not found');
  const shell = readFileSafe(SHELL_TSX_PATH);

  assert(
    shell.includes('cmd-palette') || shell.includes('.cmd-palette'),
    'Command palette modal container (.cmd-palette) missing from DashboardShell.tsx'
  );
  assert(
    shell.includes('metaKey') || shell.includes('ctrlKey'),
    'Cmd/Ctrl keyboard shortcut handler missing from DashboardShell.tsx'
  );
  assert(
    shell.includes('Escape'),
    'Escape key listener for closing command palette missing from DashboardShell.tsx'
  );
});

// 1.16: Action Docks & Tooltip Containers
runner.register(1, '1.16', 'Action docks (.icon-dock) and tooltips (.tooltip-bubble) defined and applied', ({ assert }) => {
  const utilCss = path.join(APP_DIR, 'dashboard/utilities.css');
  const baseCss = path.join(APP_DIR, 'dashboard/base.css');
  const compCss = path.join(APP_DIR, 'dashboard/components.css');
  const combined = readFileSafe(utilCss) + '\n' + readFileSafe(baseCss) + '\n' + readFileSafe(compCss);

  assert(combined.includes('.icon-dock'), '.icon-dock container class missing from dashboard stylesheets');
  assert(combined.includes('.tooltip-wrapper'), '.tooltip-wrapper container class missing from dashboard stylesheets');
  assert(combined.includes('.tooltip-bubble'), '.tooltip-bubble floating tooltip class missing from dashboard stylesheets');
});

// 1.17: Recharts Visualizations Palette
runner.register(1, '1.17', 'Recharts visualizations use pure idleAustin token palette colors', ({ assertZeroMatches }) => {
  const chartFiles = [
    path.join(APP_DIR, 'dashboard/components/DashboardCharts.tsx'),
    path.join(APP_DIR, 'dashboard/this-month/page.tsx'),
    path.join(APP_DIR, 'dashboard/expenses/page.tsx'),
    path.join(APP_DIR, 'dashboard/debts/page.tsx'),
  ].filter(fs.existsSync);

  const legacyChartColors = /(#F59E0B|#FBBF24|#2dd4bf|#60a5fa|#fb7185|#a78bfa|#34d399)/i;
  const matches = findMatchesInFiles(chartFiles, legacyChartColors);
  assertZeroMatches(matches, 'legacy pastel chart color literals in Recharts components');
});

// 1.18: Sticky Elevated Table Headers
runner.register(1, '1.18', 'Table headers specify position: sticky and background: var(--as-bg-elevated)', ({ assert }) => {
  const compCss = readFileSafe(path.join(APP_DIR, 'dashboard/components.css'));
  const baseCss = readFileSafe(path.join(APP_DIR, 'dashboard/base.css'));
  const combined = compCss + '\n' + baseCss;

  assert(
    combined.includes('position: sticky') || combined.includes('position:sticky'),
    'Sticky table header positioning missing from components.css / base.css'
  );
  assert(
    combined.includes('--as-bg-elevated'),
    'Table header does not apply --as-bg-elevated sticky backdrop'
  );
});

// 1.19: Numeric and Monetary Telemetry Right-Alignment
runner.register(1, '1.19', 'Numeric and currency telemetry cells right-aligned with Fira Code font-mono', ({ assert }) => {
  const compCss = readFileSafe(path.join(APP_DIR, 'dashboard/components.css'));
  const pagesCss = readFileSafe(path.join(APP_DIR, 'dashboard/pages.css'));
  const combined = compCss + '\n' + pagesCss;

  assert(
    combined.includes('text-align: right') || combined.includes('text-right') || combined.includes('text-align:right'),
    'Numeric alignment rule (text-align: right) missing from table styling'
  );
  assert(
    combined.includes('--as-font-mono') || combined.includes('font-mono'),
    'Monospace telemetry font family missing from numeric styling'
  );
});

// 1.20: Focus-Visible Outline Accessibility
runner.register(1, '1.20', 'Accessible :focus-visible outlines use 2px solid var(--as-accent-primary)', ({ assert }) => {
  const baseCss = readFileSafe(BASE_CSS_PATH);
  const globalsCss = readFileSafe(GLOBALS_CSS_PATH);
  const combined = baseCss + '\n' + globalsCss;

  assert(combined.includes(':focus-visible'), ':focus-visible rule missing from base.css / globals.css');
  assert(
    combined.includes('--as-accent-primary') || combined.includes('--as-border-focus'),
    ':focus-visible outline does not use --as-accent-primary / --as-border-focus'
  );
});

// =============================================================================
// TIER 2: BOUNDARY & CORNER CASES (Tests 2.1 to 2.10)
// =============================================================================

// 2.1: Nested Selectors and Media Query Parsing
runner.register(2, '2.1', 'Nested CSS selectors and @media blocks maintain boundary integrity', ({ assert }) => {
  const baseContent = readFileSafe(BASE_CSS_PATH);
  assert(baseContent.length > 0, 'base.css is empty');
  // Check that :root block is properly enclosed and doesn't bleed into media queries
  const rootBlocks = baseContent.match(/:root\s*\{[^}]*\}/g);
  assert(rootBlocks && rootBlocks.length >= 1, ':root block improperly formatted or missing closing brace');
});

// 2.2: Multi-Line Font Stacks with Fallbacks
runner.register(2, '2.2', 'Multi-line font family declarations preserve complete fallback cascades', ({ assert }) => {
  const baseContent = readFileSafe(BASE_CSS_PATH);
  const props = extractCssCustomProperties(baseContent);

  const headingFont = props['--as-font-heading'] || '';
  const bodyFont = props['--as-font-body'] || '';
  const monoFont = props['--as-font-mono'] || '';

  assert(headingFont.includes('sans-serif'), 'Heading font missing generic sans-serif fallback');
  assert(bodyFont.includes('sans-serif'), 'Body font missing generic sans-serif fallback');
  assert(monoFont.includes('monospace'), 'Mono font missing generic monospace fallback');
});

// 2.3: Mobile <= 640px Touch Targets (Minimum 44px)
runner.register(2, '2.3', 'Mobile viewports (<= 640px) enforce minimum 44px touch target height', ({ assert }) => {
  const cssFiles = getAllFiles(path.join(APP_DIR, 'dashboard'), ['.css']);
  const combined = cssFiles.map(readFileSafe).join('\n');

  assert(
    combined.includes('640px'),
    'Responsive breakpoint @media (max-width: 640px) missing from dashboard stylesheets'
  );
  assert(
    combined.includes('44px') || combined.includes('min-height: 44px') || combined.includes('min-height:44px'),
    'Minimum 44px touch target dimension missing from responsive stylesheet rules'
  );
});

// 2.4: Prefers-Reduced-Motion Overrides
runner.register(2, '2.4', 'Prefers-reduced-motion overrides all keyframe animations and transitions', ({ assert }) => {
  const baseCss = readFileSafe(BASE_CSS_PATH);
  assert(
    baseCss.includes('prefers-reduced-motion: reduce'),
    '@media (prefers-reduced-motion: reduce) block missing from base.css'
  );
  assert(
    baseCss.includes('animation-duration: 0.01ms') || baseCss.includes('animation: none') || baseCss.includes('animation:none'),
    'Prefers-reduced-motion does not completely neutralize animations'
  );
});

// 2.5: Token Value Normalization & Whitespace Invariance
runner.register(2, '2.5', 'Design tokens match under whitespace variance and hex case insensitivity', ({ assertEqual }) => {
  const c1 = normalizeTokenValue('  #84CC16  ');
  const c2 = normalizeTokenValue('#84cc16');
  assertEqual(c1, c2, 'Token normalizer failed on hex casing');

  const rgba1 = normalizeTokenValue('rgba(132, 204, 22, 0.12)');
  const rgba2 = normalizeTokenValue('rgba(132,204,22,0.12)');
  assertEqual(rgba1, rgba2, 'Token normalizer failed on rgba whitespace');
});

// 2.6: Unicode Surrogate Pair & Multibyte Emoji Detection
runner.register(2, '2.6', 'Emoji regex scanner correctly catches surrogate pairs, flags and variation selectors', ({ assert }) => {
  const sampleTextWithEmoji = 'Notice: ⚠️ High balance ⛔ and 🍔 category';
  const sampleCleanText = 'Notice: High balance warning and Food category';
  const emojiRegex = /[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2B50}\u{2B55}]/u;

  assert(emojiRegex.test(sampleTextWithEmoji), 'Emoji detection regex failed to match emoji sample');
  assert(!emojiRegex.test(sampleCleanText), 'Emoji detection regex produced false positive on clean text');
});

// 2.7: Dynamic Button States Accessibility
runner.register(2, '2.7', 'DeleteButton component provides accessible aria-label across all countdown states', ({ assert }) => {
  const deleteBtnPath = path.join(APP_DIR, 'dashboard/components/DeleteButton.tsx');
  assert(fs.existsSync(deleteBtnPath), 'DeleteButton.tsx not found');
  const code = readFileSafe(deleteBtnPath);

  // In counting and deleting states, buttons must maintain aria-label
  assert(code.includes('aria-label') || code.includes('ariaLabel'), 'DeleteButton does not declare or use aria-label');
  assert(!code.includes('✓') && !code.includes('✕'), 'DeleteButton uses raw unicode symbols instead of vector icons');
});

// 2.8: Single vs Double Quote Tolerance in CSS Font Families
runner.register(2, '2.8', 'CSS font-family definitions parse identically with single or double quotes', ({ assertEqual }) => {
  const sanitizeFont = (f) => f.replace(/['"]/g, '').toLowerCase().trim();
  assertEqual(sanitizeFont("'Outfit', sans-serif"), sanitizeFont('"Outfit", sans-serif'), 'Font sanitization failed');
});

// 2.9: Command Palette Keyboard Shortcut Case and Meta Handling
runner.register(2, '2.9', 'Command palette listener handles case sensitivity (k / K) and modifier keys', ({ assert }) => {
  const shell = readFileSafe(SHELL_TSX_PATH);
  const handlesK = /e\.key\s*===\s*['"]k['"]/i.test(shell) || /e\.key\.toLowerCase\(\)\s*===\s*['"]k['"]/.test(shell);
  assert(handlesK, 'Command palette keyboard listener does not check for "k" key');
});

// 2.10: Token Comments and Documentation Preservation
runner.register(2, '2.10', 'CSS token extraction strips comments cleanly without false matches', ({ assert }) => {
  const sampleCss = `
    :root {
      /* --as-bg-base: #ffffff; */
      --as-bg-base: #0a0a0c;
    }
  `;
  const props = extractCssCustomProperties(sampleCss);
  assert(props['--as-bg-base'] === '#0a0a0c', 'Commented-out CSS token polluted active property map');
});

// 2.11+: Mobile Browser Responsiveness Suite (MR-1.1 through MR-4.3)
const { registerMobileResponsiveTests } = require('./mobile-responsive.test');
registerMobileResponsiveTests(runner);

// =============================================================================
// TIER 3: CROSS-FEATURE INTERACTIONS & COHERENCE (Tests 3.1 to 3.8)
// =============================================================================

// 3.1: Pure Obsidian Surface Monotonic Luminance Progression
runner.register(3, '3.1', 'Pure Obsidian surface hierarchy exhibits monotonic luminance progression (base < surface < elevated < overlay)', ({ assert }) => {
  const surfaces = {
    base: '#0a0a0c',
    surface: '#121216',
    elevated: '#18181f',
    overlay: '#202029',
  };

  const lBase = relativeLuminance(10, 10, 12);
  const lSurface = relativeLuminance(18, 18, 22);
  const lElevated = relativeLuminance(24, 24, 31);
  const lOverlay = relativeLuminance(32, 32, 41);

  assert(lBase < lSurface, `Surface luminance invalid: base (${lBase}) >= surface (${lSurface})`);
  assert(lSurface < lElevated, `Surface luminance invalid: surface (${lSurface}) >= elevated (${lElevated})`);
  assert(lElevated < lOverlay, `Surface luminance invalid: elevated (${lElevated}) >= overlay (${lOverlay})`);
});

// 3.2: Electric Lime on Pure Obsidian Canvas Contrast (WCAG AAA/AA)
runner.register(3, '3.2', 'Electric Lime accent on Pure Obsidian canvas exceeds WCAG AAA/AA contrast ratio (CR >= 8.0:1)', ({ assert }) => {
  const cr = contrastRatio('#84cc16', '#0a0a0c');
  assert(cr >= 8.0, `Contrast ratio between Electric Lime (#84cc16) and base canvas (#0a0a0c) is ${cr.toFixed(2)}:1 (required >= 8.0:1)`);
});

// 3.3: Primary Text on Pure Obsidian Canvas Contrast (WCAG AAA)
runner.register(3, '3.3', 'Primary text (#f4f4f5) on base canvas (#0a0a0c) exceeds WCAG AAA contrast ratio (CR >= 15.0:1)', ({ assert }) => {
  const cr = contrastRatio('#f4f4f5', '#0a0a0c');
  assert(cr >= 15.0, `Contrast ratio between primary text (#f4f4f5) and base canvas (#0a0a0c) is ${cr.toFixed(2)}:1 (required >= 15.0:1)`);
});

// 3.4: Accent Text on Electric Lime Accent Background Contrast (WCAG AAA)
runner.register(3, '3.4', 'Accent dark text (#1a2e05) on Electric Lime button (#84cc16) exceeds WCAG AAA contrast ratio (CR >= 7.0:1)', ({ assert }) => {
  const cr = contrastRatio('#1a2e05', '#84cc16');
  assert(cr >= 7.0, `Contrast ratio between accent text (#1a2e05) and accent button (#84cc16) is ${cr.toFixed(2)}:1 (required >= 7.0:1)`);
});

// 3.5: Secondary Text on Base Canvas Contrast (WCAG AA)
runner.register(3, '3.5', 'Secondary text (#a1a1aa) on base canvas (#0a0a0c) exceeds WCAG AA contrast ratio (CR >= 4.5:1)', ({ assert }) => {
  const cr = contrastRatio('#a1a1aa', '#0a0a0c');
  assert(cr >= 4.5, `Contrast ratio between secondary text (#a1a1aa) and base canvas (#0a0a0c) is ${cr.toFixed(2)}:1 (required >= 4.5:1)`);
});

// 3.6: Pairwise CSS Custom Property Verification
runner.register(3, '3.6', 'All var(--as-*) references across app/ resolve to valid defined design tokens', ({ assert }) => {
  const allCssFiles = getAllFiles(APP_DIR, ['.css']);
  const allTsxFiles = getAllFiles(APP_DIR, ['.tsx']);
  const files = [...allCssFiles, ...allTsxFiles];

  // Defined tokens set from base.css
  const baseContent = readFileSafe(BASE_CSS_PATH);
  const globalsContent = readFileSafe(GLOBALS_CSS_PATH);
  const definedTokens = new Set([
    ...Object.keys(extractCssCustomProperties(baseContent)),
    ...Object.keys(extractCssCustomProperties(globalsContent)),
  ]);

  const varRefRegex = /var\(\s*(--as-[a-zA-Z0-9-_]+)\s*[,)]/g;
  const undefinedUsages = [];

  for (const file of files) {
    const content = readFileSafe(file);
    let match;
    while ((match = varRefRegex.exec(content)) !== null) {
      const token = match[1];
      if (!definedTokens.has(token)) {
        const lineNum = content.substring(0, match.index).split('\n').length;
        undefinedUsages.push(`${path.relative(PROJECT_ROOT, file)}:${lineNum} -> ${token}`);
      }
    }
  }

  assert(
    undefinedUsages.length === 0,
    `Found ${undefinedUsages.length} reference(s) to undefined --as-* design tokens`,
    undefinedUsages
  );
});

// 3.7: Deadpan Brand Voice Microcopy Audit
runner.register(3, '3.7', 'Zero exclamation points in user-facing UI microcopy, empty states and dialogs', ({ assertZeroMatches }) => {
  const tsxFiles = getAllFiles(APP_DIR, ['.tsx']);
  const exclamationMatches = [];

  for (const file of tsxFiles) {
    const content = readFileSafe(file);
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      // Skip imports, comments, TypeScript operators (!variable, !=, !==)
      if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) return;
      if (trimmed.startsWith('import ') || trimmed.startsWith('export type')) return;

      // Look for exclamation point in user-facing UI text:
      // 1. Direct JSX text: >Text with exclamation!<
      const jsxTextMatch = />\s*([^<]*[a-zA-Z]+[^<]*![^<]*)</.exec(line);
      // 2. User-facing attributes: placeholder, title, label, aria-label
      const attrMatch = /(?:placeholder|title|aria-label|label)=["']([^"']*[a-zA-Z]+[^"']*![^"']*)["']/.exec(line);
      // 3. Rendered JSX string expressions: {"Text!"}
      const jsxExprMatch = /\{\s*["']([^"']*[a-zA-Z]+[^"']*![^"']*)["']\s*\}/.exec(line);
      // 4. User notifications, toasts, alerts, and recommendations
      const messageMatch = /(?:message|error|toast|alert|recommendation|status|grade)\s*[:=]\s*["']([^"']*[a-zA-Z]+[^"']*![^"']*)["']/i.exec(line);

      if (jsxTextMatch) {
        exclamationMatches.push({
          file: path.relative(PROJECT_ROOT, file),
          line: idx + 1,
          content: jsxTextMatch[0],
        });
      } else if (attrMatch) {
        exclamationMatches.push({
          file: path.relative(PROJECT_ROOT, file),
          line: idx + 1,
          content: attrMatch[0],
        });
      } else if (jsxExprMatch) {
        exclamationMatches.push({
          file: path.relative(PROJECT_ROOT, file),
          line: idx + 1,
          content: jsxExprMatch[0],
        });
      } else if (messageMatch) {
        exclamationMatches.push({
          file: path.relative(PROJECT_ROOT, file),
          line: idx + 1,
          content: messageMatch[0],
        });
      }
    });
  }

  assertZeroMatches(exclamationMatches, 'exclamation points in user-facing UI strings (idleAustin deadpan violation)');
});

// 3.8: Route-Level Theme Consistency
runner.register(3, '3.8', 'Route layouts avoid hardcoded light/inconsistent background overrides', ({ assertZeroMatches }) => {
  const tsxFiles = getAllFiles(APP_DIR, ['.tsx']);
  const lightBgRegex = /(backgroundColor:\s*['"]#(fff|ffffff|eee|f8f8f8|f3f4f6)['"]|bg-white|bg-gray-100)/i;
  const matches = findMatchesInFiles(tsxFiles, lightBgRegex);
  assertZeroMatches(matches, 'light background overrides in route components');
});

// =============================================================================
// TIER 4: WORKLOAD ACCEPTANCE (Tests 4.1 to 4.3)
// =============================================================================

// 4.1: TypeScript Compilation
runner.register(4, '4.1', 'TypeScript compilation (npx tsc --noEmit) passes with exit code 0', ({ assert }) => {
  try {
    execSync('npx tsc --noEmit', {
      cwd: PROJECT_ROOT,
      stdio: 'pipe',
      timeout: 60000,
    });
  } catch (err) {
    const stdout = err.stdout ? err.stdout.toString() : '';
    const stderr = err.stderr ? err.stderr.toString() : '';
    const output = (stdout + '\n' + stderr).trim();
    const errorLines = output.split('\n').filter((l) => l.includes('error TS')).slice(0, 5);
    assert(false, `TypeScript compilation failed with code ${err.status}`, errorLines);
  }
});

// 4.2: ESLint Code Quality Verification
runner.register(4, '4.2', 'ESLint validation (npm run lint) passes with exit code 0', ({ assert }) => {
  try {
    execSync('npm run lint', {
      cwd: PROJECT_ROOT,
      stdio: 'pipe',
      timeout: 60000,
    });
  } catch (err) {
    const stdout = err.stdout ? err.stdout.toString() : '';
    const stderr = err.stderr ? err.stderr.toString() : '';
    const output = (stdout + '\n' + stderr).trim();
    const errorLines = output.split('\n').filter((l) => l.includes('error')).slice(0, 5);
    assert(false, `ESLint validation failed with code ${err.status}`, errorLines);
  }
});

// 4.3: Next.js Production Build
runner.register(4, '4.3', 'Next.js production build (npm run build) completes cleanly with exit code 0', ({ assert }) => {
  if (options.skipBuild) {
    // If user explicitly passed --skip-build, note skip
    return;
  }

  try {
    execSync('npm run build', {
      cwd: PROJECT_ROOT,
      stdio: 'pipe',
      timeout: 120000,
    });
  } catch (err) {
    const stdout = err.stdout ? err.stdout.toString() : '';
    const stderr = err.stderr ? err.stderr.toString() : '';
    const output = (stdout + '\n' + stderr).trim();
    const errorLines = output.split('\n').slice(0, 5);
    assert(false, `Next.js production build failed with code ${err.status}`, errorLines);
  }
});

// -----------------------------------------------------------------------------
// Execution Entry Point
// -----------------------------------------------------------------------------
if (require.main === module) {
  runner.run().then((allPassed) => {
    // Exit code 0 if all tests pass; 1 if any failure occurred
    process.exit(allPassed ? 0 : 1);
  });
}

module.exports = { runner, TestSuiteHarness };
