/**
 * Automated Mobile Browser Responsiveness E2E Test Suite
 * Verifies public mobile responsiveness contracts across moneydumb/app/**:
 * 1. Viewport & Safe Areas (app/layout.tsx, responsive.css, thismonth.css)
 * 2. Mobile Navigation Drawer & Header (DashboardSidebar.tsx, DashboardShell.tsx, responsive.css)
 * 3. This Month Operational Workspace Mobile Reformatting (thismonth.css & TSX components)
 * 4. Data Table Column Alignment, Touch Targets & iOS Auto-Zoom Prevention
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '../..');
const APP_DIR = path.join(PROJECT_ROOT, 'app');

const PATHS = {
  layout: path.join(APP_DIR, 'layout.tsx'),
  loginPage: path.join(APP_DIR, 'page.tsx'),
  registerPage: path.join(APP_DIR, 'register/page.tsx'),
  responsiveCss: path.join(APP_DIR, 'dashboard/responsive.css'),
  utilitiesCss: path.join(APP_DIR, 'dashboard/utilities.css'),
  thismonthCss: path.join(APP_DIR, 'dashboard/thismonth.css'),
  sidebarTsx: path.join(APP_DIR, 'dashboard/components/DashboardSidebar.tsx'),
  shellTsx: path.join(APP_DIR, 'dashboard/components/DashboardShell.tsx'),
  topBarTsx: path.join(APP_DIR, 'dashboard/this-month/components/TopBarOptions.tsx'),
  acctMatrixTsx: path.join(APP_DIR, 'dashboard/this-month/components/AccountSafeBalanceOptions.tsx'),
  variantATsx: path.join(APP_DIR, 'dashboard/this-month/variants/VariantALedger.tsx'),
  ledgerRowsTsx: path.join(APP_DIR, 'dashboard/this-month/components/MasterLedgerExtraOptions.tsx'),
  inboundModalTsx: path.join(APP_DIR, 'dashboard/this-month/components/InboundCapitalModal.tsx'),
  dailyChartTsx: path.join(APP_DIR, 'dashboard/this-month/components/DailyCashFlowChart.tsx'),
  obligationDrawerTsx: path.join(APP_DIR, 'dashboard/this-month/components/ObligationDrawer.tsx'),
  workspaceTsx: path.join(APP_DIR, 'dashboard/this-month/components/ThisMonthWorkspace.tsx'),
};

function readFileSafe(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return '';
  }
}

function stripCssComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

function registerMobileResponsiveTests(harness) {
  // 1. Viewport & Safe Areas (app/layout.tsx, responsive.css)
  harness.register(2, 'MR-1.1', 'Viewport configuration in app/layout.tsx enables viewportFit: "cover" and device-width scaling', ({ assert }) => {
    const layout = readFileSafe(PATHS.layout);
    assert(layout.length > 0, 'app/layout.tsx could not be read');
    assert(/export\s+const\s+viewport\s*:\s*Viewport\s*=/.test(layout), 'app/layout.tsx must export a typed Next.js Viewport object');
    assert(/viewportFit\s*:\s*["']cover["']/.test(layout), 'viewportFit: "cover" must be configured in app/layout.tsx');
    assert(
      /width\s*:\s*["']device-width["']/.test(layout) && /initialScale\s*:\s*1\b/.test(layout),
      'width: "device-width" and initialScale: 1 must be configured in app/layout.tsx'
    );
  });

  harness.register(2, 'MR-1.2', 'Pinch-to-zoom is not blocked in app/layout.tsx (no userScalable: false or maximumScale: 1)', ({ assert }) => {
    const layout = readFileSafe(PATHS.layout);
    assert(
      !/userScalable\s*:\s*false/i.test(layout) && !/user-scalable\s*=\s*no/i.test(layout),
      'app/layout.tsx must not disable pinch-to-zoom via userScalable: false'
    );
    assert(
      !/maximumScale\s*:\s*1\b/i.test(layout) && !/maximum-scale\s*=\s*1(\.0)?\b/i.test(layout),
      'app/layout.tsx must not cap zoom at maximumScale: 1'
    );
  });

  harness.register(2, 'MR-1.3', 'iOS notch and home-indicator env(safe-area-inset-*) rules applied across header, drawer, content, and toast', ({ assert }) => {
    const responsive = stripCssComments(readFileSafe(PATHS.responsiveCss));
    const thismonth = stripCssComments(readFileSafe(PATHS.thismonthCss));
    const drawer = readFileSafe(PATHS.obligationDrawerTsx);

    assert(/\.mobile-header\s*\{[^}]*env\(safe-area-inset-top/.test(responsive), '.mobile-header in responsive.css must account for env(safe-area-inset-top)');
    assert(/\.sidebar\s*\{[^}]*env\(safe-area-inset-bottom/.test(responsive), 'Mobile .sidebar in responsive.css must account for env(safe-area-inset-bottom)');
    assert(
      /\.main-content\s*\{[^}]*env\(safe-area-inset-top[\s\S]*?env\(safe-area-inset-bottom/.test(responsive),
      'Mobile .main-content in responsive.css must account for safe-area-inset-top and safe-area-inset-bottom'
    );
    assert(/\.tm-toast\s*\{[^}]*env\(safe-area-inset-bottom/.test(thismonth), '.tm-toast in thismonth.css must offset bottom by env(safe-area-inset-bottom)');
    assert(drawer.includes('env(safe-area-inset-bottom'), 'ObligationDrawer.tsx must pad bottom for env(safe-area-inset-bottom)');
  });

  // 2. Mobile Navigation Drawer & Header (DashboardSidebar.tsx, DashboardShell.tsx, responsive.css)
  harness.register(2, 'MR-2.1', 'Mobile drawer computes isCollapsed = sidebarCollapsed && !mobileMenuOpen so labels and Log Out stay mounted', ({ assert }) => {
    const sidebar = readFileSafe(PATHS.sidebarTsx);
    assert(
      /const\s+isCollapsed\s*=\s*sidebarCollapsed\s*&&\s*!mobileMenuOpen\s*;/.test(sidebar),
      'DashboardSidebar.tsx must compute isCollapsed = sidebarCollapsed && !mobileMenuOpen'
    );
    assert(!sidebar.includes('{!sidebarCollapsed &&'), 'DashboardSidebar.tsx must gate child elements on !isCollapsed rather than raw !sidebarCollapsed');
    assert(
      sidebar.includes('{!isCollapsed && <span className="nav-label">{item.label}</span>}') &&
        sidebar.includes('<span className="nav-label">Log Out</span>'),
      'Navigation labels and Log Out action must remain mounted when !isCollapsed'
    );
  });

  harness.register(2, 'MR-2.2', 'Mobile header renders 44x44 menu toggle and command palette search trigger with explicit aria-labels', ({ assert }) => {
    const sidebar = readFileSafe(PATHS.sidebarTsx);
    const shell = readFileSafe(PATHS.shellTsx);
    const responsive = stripCssComments(readFileSafe(PATHS.responsiveCss));

    assert(/\.mobile-menu-btn\s*\{[^}]*width:\s*44px;[^}]*height:\s*44px;/.test(responsive), '.mobile-menu-btn in responsive.css must define a 44px x 44px touch target');
    assert(
      sidebar.includes("aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}"),
      'Mobile menu toggle button must have explicit open/close aria-label'
    );
    assert(
      sidebar.includes('onClick={onOpenCommandPalette}') && sidebar.includes('aria-label="Open command palette"'),
      'Mobile header must include a command palette search trigger button with aria-label="Open command palette"'
    );
    assert(shell.includes('onOpenCommandPalette={() => {'), 'DashboardShell.tsx must wire onOpenCommandPalette into DashboardSidebar');
  });

  harness.register(2, 'MR-2.3', 'Mobile drawer in responsive.css uses 100dvh, vertical touch scroll, and reveals labels when open', ({ assert }) => {
    const responsive = stripCssComments(readFileSafe(PATHS.responsiveCss));
    assert(
      responsive.includes('height: 100dvh') && responsive.includes('overflow-y: auto'),
      'Mobile .sidebar in responsive.css must set height: 100dvh and overflow-y: auto'
    );
    assert(
      responsive.includes('.sidebar-mobile-open .nav-label') && responsive.includes('.sidebar-mobile-open .sidebar-logo'),
      'responsive.css must ensure .nav-label and .sidebar-logo display inside .sidebar-mobile-open'
    );
  });

  // 3. This Month Operational Workspace Mobile Reformatting
  harness.register(2, 'MR-3.1', 'Zero hardcoded multi-column inline gridTemplateColumns remain in This Month operational TSX components', ({ assertZeroMatches }) => {
    const targetFiles = [PATHS.topBarTsx, PATHS.acctMatrixTsx, PATHS.variantATsx, PATHS.ledgerRowsTsx, PATHS.inboundModalTsx];
    const violations = [];
    for (const file of targetFiles) {
      readFileSafe(file).split('\n').forEach((line, idx) => {
        if (/gridTemplateColumns\s*:/.test(line)) {
          violations.push({ file: path.relative(PROJECT_ROOT, file), line: idx + 1, content: line.trim() });
        }
      });
    }
    assertZeroMatches(violations, 'inline gridTemplateColumns in This Month operational components');
  });

  harness.register(2, 'MR-3.2', 'All required responsive This Month classes (.tm-*) are defined in thismonth.css and applied in TSX', ({ assert }) => {
    const thismonthCss = stripCssComments(readFileSafe(PATHS.thismonthCss));
    const combinedTsx = [
      PATHS.topBarTsx,
      PATHS.acctMatrixTsx,
      PATHS.variantATsx,
      PATHS.ledgerRowsTsx,
      PATHS.inboundModalTsx,
      PATHS.dailyChartTsx,
      PATHS.workspaceTsx,
    ].map(readFileSafe).join('\n');

    const requiredClasses = [
      'tm-top-burn-grid',
      'tm-acct-matrix-row',
      'tm-mobile-label',
      'tm-ledger-split',
      'tm-bill-row',
      'tm-debt-row',
      'tm-inbound-row',
      'tm-heatmap-grid',
    ];
    for (const cls of requiredClasses) {
      assert(new RegExp(`\\.${cls}\\b`).test(thismonthCss), `Class .${cls} must be defined in app/dashboard/thismonth.css`);
      assert(combinedTsx.includes(cls), `Class ${cls} must be applied in This Month TSX components`);
    }
    for (const bp of ['1024px', '860px', '640px', '400px']) {
      assert(thismonthCss.includes(`@media (max-width: ${bp})`), `thismonth.css must include ${bp} breakpoint`);
    }
  });

  harness.register(2, 'MR-3.3', 'AccountSafeBalanceOptions matrix reformats to 2-column mobile card grid with .tm-mobile-label descriptors', ({ assert }) => {
    const acctTsx = readFileSafe(PATHS.acctMatrixTsx);
    const thismonthCss = stripCssComments(readFileSafe(PATHS.thismonthCss));

    for (const label of ['OPENING BAL', '+ INBOUND', '− CLEARED', '− STILL DUE', '= SAFE NOW', '= END BUFFER']) {
      assert(acctTsx.includes(`<span className="tm-mobile-label">${label}</span>`), `AccountSafeBalanceOptions.tsx must include mobile label "${label}"`);
    }
    assert(
      /@media\s*\(max-width:\s*860px\)\s*\{[\s\S]*?\.tm-acct-matrix-header[\s\S]*?display:\s*none/.test(thismonthCss),
      'thismonth.css must hide .tm-acct-matrix-header at <= 860px'
    );
    assert(
      /@media\s*\(max-width:\s*860px\)\s*\{[\s\S]*?\.tm-acct-matrix-row,\s*\.tm-acct-matrix-footer\s*\{\s*grid-template-columns:\s*1fr\s+1fr/.test(thismonthCss),
      'thismonth.css must reformat .tm-acct-matrix-row and .tm-acct-matrix-footer to 1fr 1fr at <= 860px'
    );
  });

  harness.register(2, 'MR-3.4', 'Mobile bill rows, debt rows, inbound modal rows, and 7-column cash-burn heatmap strip reformat at <= 640px', ({ assert }) => {
    const rowsTsx = readFileSafe(PATHS.ledgerRowsTsx);
    const inboundTsx = readFileSafe(PATHS.inboundModalTsx);
    const chartTsx = readFileSafe(PATHS.dailyChartTsx);
    const thismonthCss = stripCssComments(readFileSafe(PATHS.thismonthCss));

    for (const cellClass of ['tm-bill-cell-check', 'tm-bill-cell-name', 'tm-bill-cell-due', 'tm-bill-cell-acct', 'tm-bill-cell-amt']) {
      assert(rowsTsx.includes(cellClass), `FixedBillRow must apply ${cellClass}`);
    }
    for (const cellClass of ['tm-debt-cell-check', 'tm-debt-cell-name', 'tm-debt-cell-due', 'tm-debt-cell-acct', 'tm-debt-cell-tier']) {
      assert(rowsTsx.includes(cellClass), `DebtObligationRow must apply ${cellClass}`);
    }
    assert(inboundTsx.includes('tm-inbound-cell-full') && inboundTsx.includes('tm-inbound-input'), 'InboundCapitalModal.tsx must apply .tm-inbound-cell-full and .tm-inbound-input');
    assert(chartTsx.includes('className="tm-heatmap-grid"'), 'DailyCashFlowChart.tsx must use className="tm-heatmap-grid"');
    assert(
      /\.tm-heatmap-grid\s*\{\s*grid-template-columns:\s*repeat\(7,\s*minmax\(0,\s*1fr\)\)/.test(thismonthCss),
      'thismonth.css must collapse .tm-heatmap-grid to repeat(7, minmax(0, 1fr)) on mobile'
    );
  });

  // 4. Data Table Column Alignment & Touch Targets
  harness.register(2, 'MR-4.1', 'responsive.css preserves .data-table column alignment by not forcing display: table on .data-table tr', ({ assert }) => {
    const responsive = stripCssComments(readFileSafe(PATHS.responsiveCss));
    assert(
      !/\.data-table\s+tr\s*\{[^}]*display\s*:\s*table/i.test(responsive),
      'responsive.css must NOT apply display: table to .data-table tr (breaks column alignment between thead and tbody)'
    );
    assert(/\.data-table\s*\{[^}]*overflow-x\s*:\s*auto/i.test(responsive), 'responsive.css must preserve horizontal scroll on .data-table');
  });

  harness.register(2, 'MR-4.2', 'utilities.css scopes 44px touch targets to interactive classes without bare button and wraps tooltip hover in @media (hover: hover)', ({ assert }) => {
    const utilities = stripCssComments(readFileSafe(PATHS.utilitiesCss));
    const media640Match = utilities.match(/@media\s*\(max-width:\s*640px\)\s*\{([\s\S]*)\}/);
    assert(media640Match !== null, 'utilities.css must contain @media (max-width: 640px) block');

    const media640Body = media640Match[1];
    assert(media640Body.includes('min-height: 44px'), 'utilities.css @media (max-width: 640px) must enforce min-height: 44px');
    for (const selector of ['.btn', '.btn-icon', '.icon-action-btn', '.mobile-menu-btn', '.cmd-trigger-btn', '.cmd-item', 'input', 'select', 'textarea']) {
      assert(media640Body.includes(selector), `utilities.css @media (max-width: 640px) touch target rule must include ${selector}`);
    }

    const minHeightRuleMatch = media640Body.match(/([^{]+)\{\s*min-height:\s*44px;\s*\}/);
    assert(minHeightRuleMatch !== null, 'Could not locate min-height: 44px rule in utilities.css');
    const selectors = minHeightRuleMatch[1].split(',').map((s) => s.trim());
    assert(!selectors.includes('button'), 'utilities.css must not apply min-height: 44px to bare button elements');

    assert(
      /@media\s*\(hover:\s*hover\)\s*\{\s*\.tooltip-wrapper:hover\s+\.tooltip-bubble/.test(utilities),
      'utilities.css must scope .tooltip-wrapper:hover .tooltip-bubble inside @media (hover: hover)'
    );
  });

  harness.register(2, 'MR-4.3', 'Mobile text, search, and auth inputs enforce 16px (1rem) font size and 44x44 password toggles to prevent iOS auto-zoom', ({ assert }) => {
    const responsive = stripCssComments(readFileSafe(PATHS.responsiveCss));
    const utilities = stripCssComments(readFileSafe(PATHS.utilitiesCss));
    const thismonth = stripCssComments(readFileSafe(PATHS.thismonthCss));
    const loginPage = readFileSafe(PATHS.loginPage);
    const registerPage = readFileSafe(PATHS.registerPage);

    assert(
      /\.form-group\s+input[\s\S]*?font-size:\s*16px/.test(responsive) &&
        /\.table-search-popup\s+input\s*\{\s*font-size:\s*16px/.test(responsive),
      'responsive.css must enforce 16px font-size on .form-group inputs and .table-search-popup input'
    );
    assert(/\.float-group\s+input[\s\S]*?font-size:\s*16px/.test(utilities), 'utilities.css must enforce 16px font-size on .float-group inputs on mobile');
    assert(
      /\.tm-search-input\s*\{[^}]*font-size:\s*16px/.test(thismonth) &&
        /\.tm-edit-input\s*\{[^}]*font-size:\s*16px/.test(thismonth) &&
        /\.tm-inbound-input\s*\{[^}]*font-size:\s*16px/.test(thismonth),
      'thismonth.css must enforce 16px font-size on .tm-search-input, .tm-edit-input, and .tm-inbound-input on mobile'
    );

    for (const [name, content] of [['app/page.tsx', loginPage], ['app/register/page.tsx', registerPage]]) {
      const inputTags = content.match(/<input[\s\S]*?\/>/g) || [];
      assert(inputTags.length >= 2, `${name} must render username and password input elements`);
      for (const inputTag of inputTags) {
        assert(inputTag.includes("fontSize: '1rem'"), `${name} input elements must use fontSize: '1rem' (16px) to prevent iOS Safari zoom`);
      }
      assert(
        content.includes("width: '44px'") && content.includes("height: '44px'"),
        `${name} password visibility toggle button must provide a 44px x 44px touch target`
      );
      assert(content.includes('clamp(20px, 5vw, 40px)'), `${name} auth card must use responsive clamp(20px, 5vw, 40px) padding`);
    }
  });
}

module.exports = { registerMobileResponsiveTests };

if (require.main === module) {
  const { TestSuiteHarness } = require('./runner');
  const standaloneHarness = new TestSuiteHarness();
  registerMobileResponsiveTests(standaloneHarness);
  standaloneHarness.run().then((allPassed) => {
    process.exit(allPassed ? 0 : 1);
  });
}
