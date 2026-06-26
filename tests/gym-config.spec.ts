import { test, expect, Page } from '@playwright/test';
import { loginAsAdmin, resetGymConfig } from './helpers';
import { resetGymDisplayFields } from './utils/gym-reset';

// Next.js 16 + Turbopack dev server compiles routes on first request, and
// the homepage/admin compile takes 10-30s on a cold cache. The Playwright
// default 30s test timeout is right at the boundary — we override it to
// give the slow first-navigation plenty of headroom while keeping the
// default for fast pages.
test.setTimeout(120_000);

/**
 * Phase 5 — Verification E2E tests for the gym-config-admin change.
 *
 * Covers:
 *   5.1  Admin flow — login → /admin/config → edit each field group → save
 *        → verify public pages reflect new values.
 *   5.2  Fallback chain — with DB gym.nombre=null, / shows env var;
 *        with both DB and env unavailable, shows generic "Gimnasio".
 *   5.3  Auth gate — /admin/config while logged out redirects to /admin/login.
 *
 * Test isolation:
 *   - Each test logs in fresh via the existing auth helper (DNI/password).
 *   - Tests that mutate the Gym singleton reset it to a known state before
 *     AND after, so they don't leak data into other tests in the suite.
 *   - Tests that don't need a fresh DB skip the cleanup (read-only tests).
 *
 * Fallback-chain tests (5.2) are written so they pass regardless of the
 * developer's local .env: the test reads NEXT_PUBLIC_GYM_NAME from
 * process.env, and asserts the homepage h1 either contains that value
 * (when the env var is set) or the generic "Gimnasio" (when it isn't).
 */

// Public-facing selectors.
const HOME_H1 = 'main h1';
const SIDEBAR_LOGO = 'aside [class*="font-bold"]';

// ============================================
// T3.4 — 5.2.3 isolation fix
// ============================================
//
// 5.1.1 and 5.2.1 mutate `gym.nombre` to TEST_ values; 5.2.3 asserts
// the fallback chain terminates at the env var or "Gimnasio" (which
// requires `gym.nombre` to be NULL). Without an afterEach reset, 5.2.3
// would see the TEST_ value from 5.1.1/5.2.1 and fail.
//
// Two changes here:
//   1. `test.describe.configure({ mode: 'serial' })` at the file
//      level — eliminates worker race on the singleton write.
//   2. `test.afterEach(resetGymConfig)` at the file level — clears
//      `gym.nombre` to null after every test, so the next test
//      starts from a known state. The next-cache TTL (60s) + the
//      `revalidateTag('gym-config')` fired by the server action mean
//      subsequent reads see the reset value within ~1s.
//
// The `clearGymDisplayFields` no-op in the "Admin flow" describe is
// preserved for backward compatibility (other code may import it) but
// is superseded by the file-level afterEach.
test.describe.configure({ mode: 'serial' });
test.afterEach(async () => {
  await resetGymConfig();
});

// Admin /admin/config selectors. The 5 sub-form groups (Identity,
// Location, Social x2) are rendered as <form> cards; the Schedule
// sub-form is now a composite WeeklyScheduleEditor (7 day cards +
// a single "Guardar horarios" submit) and uses `data-testid`
// selectors instead of form-scoped queries.
//
// IMPORTANT: React 19 / Next 16 `useActionState` renders each form
// TWICE — once visible and once inside a `<div hidden id="S:N">` for
// the server-action POST handler. The hidden copy has the same
// `name="field"` value. We filter to `:visible` to match only the
// visible form.
const IDENTITY_FORM = 'form:visible:has(input[name="field"][value="nombre"])';
const DIRECCION_FORM = 'form:visible:has(input[name="field"][value="direccion"])';
const MAPS_FORM = 'form:visible:has(input[name="field"][value="mapsEmbedUrl"])';
const INSTAGRAM_FORM = 'form:visible:has(input[name="field"][value="socialInstagram"])';
const WHATSAPP_FORM = 'form:visible:has(input[name="field"][value="socialWhatsapp"])';

// WeeklyScheduleEditor selectors — match the data-testid attributes
// documented in src/components/admin/WeeklyScheduleEditor.tsx.
const SCHEDULE_SUBMIT = '[data-testid="submit-schedule"]';
const DAY_TOGGLE = (code: string) => `[data-testid="toggle-${code}"]`;
const DAY_TIME_APERTURA = (code: string) => `[data-testid="time-${code}-apertura"]`;
const DAY_TIME_CIERRE = (code: string) => `[data-testid="time-${code}-cierre"]`;

const PAGE_TITLE = 'Configuración del Gimnasio';

// Unique values used by the admin-flow test. Suffixes are unique per test
// run so reruns don't conflict with persisted state from prior runs.
//
// ⚠️ NOTE: These E2E test values get WRITTEN to the real Gym singleton
// in the dev database. If you run the test suite against a long-lived DB
// (not a freshly-seeded one), the persisted values will be the LAST
// RUN_ID's values until you either:
//   1. Re-run `pnpm db:seed` to restore the defaults (including
//      `nombre: 'Mi Gimnasio'` for the display name).
//   2. Manually clean via `pnpm prisma studio` or a direct SQL update.
//   3. Use a dedicated test database (recommended for CI: set
//      DATABASE_URL to a separate schema and run `pnpm db:push` + seed
//      there before tests).
//
// The 'Gym-E2E-${RUN_ID}' name pattern is intentional (timestamped, so
// successive runs don't collide) but it does NOT auto-restore after the
// test. This is a known limitation of the current setup; a follow-up
// could add a `test.afterAll` hook to capture-and-restore the original
// `gym.nombre` before/after the test runs.
const RUN_ID = Date.now();
const NEW_NOMBRE = `Gym-E2E-${RUN_ID}`;
const NEW_DIRECCION = `Av. E2E ${RUN_ID}, CABA`;
const NEW_MAPS_URL = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1000!2d1000!3d1000!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zM!5e0!3m2!1sen!2sar!4v1700000000000';
const NEW_INSTAGRAM = `https://www.instagram.com/gym_e2e_${RUN_ID}`;
const NEW_WHATSAPP = `https://wa.me/5491100000${String(RUN_ID).slice(-4)}`;

/**
 * Best-effort cleanup after the admin-flow tests. The gym display fields
 * use unique-per-run values (suffixed with RUN_ID) so reruns and parallel
 * runs don't conflict. Now delegates to the real
 * `resetGymDisplayFields()` helper (added in sdd/clear-gym-fields
 * T-015) which uses direct Prisma to set all 4 nullable fields back to
 * `null`. This is the same pattern as `resetGymNombre` — neither the
 * admin form's `updateGymField` nor `/api/gym` PATCH can clear these
 * fields (both reject empty/null via `gymFieldSchema`), so direct DB
 * access is the smallest escape hatch for test isolation.
 */
async function clearGymDisplayFields(_page: Page): Promise<void> {
  await resetGymDisplayFields();
}

// ============================================
// Phase 5.1 — Admin flow (login → edit → save → verify public)
// ============================================

test.describe('Gym Config — Admin flow', () => {
  test.afterEach(async ({ page }) => {
    // Best-effort cleanup. If a test fails before the page reaches
    // /admin/config, the cleanup is a no-op (the function navigates
    // there and we wrap each step to swallow secondary errors).
    try {
      if (page.url().includes('/admin')) {
        await clearGymDisplayFields(page);
      }
    } catch {
      // Cleanup is best-effort — never let it mask the real failure.
    }
  });

  test('5.1.1 - login → /admin/config → all 4 sub-form groups render', async ({ page }) => {
    await loginAsAdmin(page);

    // Navigate to the config page.
    await page.goto('/admin/config');
    await expect(page.getByRole('heading', { name: PAGE_TITLE })).toBeVisible({
      timeout: 10000,
    });

    // The 4 logical sections (Identity, Schedule, Location, Social) and
    // 5 sub-form inputs (nombre, direccion, mapsEmbedUrl,
    // socialInstagram, socialWhatsapp) all render. The Schedule sub-form
    // is now a composite WeeklyScheduleEditor (7 day cards + 1 submit)
    // and does NOT use the single-input FieldConfig pattern.
    // Note: each form is rendered twice (visible + hidden server-action
    // copy), so we use .first() for strict-mode-safe matching.
    await expect(page.getByText('Identidad').first()).toBeVisible();
    await expect(page.getByText('Horarios').first()).toBeVisible();
    await expect(page.getByText('Dirección').first()).toBeVisible();
    await expect(
      page.getByText('Mapa (Google Maps embed)').first()
    ).toBeVisible();
    await expect(page.getByText('Instagram').first()).toBeVisible();
    await expect(page.getByText('WhatsApp').first()).toBeVisible();

    // 5 single-input sub-forms + 1 WeeklyScheduleEditor submit = 6 visible
    // submit buttons (each form renders a submit; the schedule editor's
    // submit is also a button[type=submit]).
    const saveButtons = page.locator('button[type="submit"]:visible');
    expect(await saveButtons.count()).toBe(6);
  });

  test('5.1.2 - edit nombre → save → home and /informacion show new name', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/config');
    await expect(page.getByRole('heading', { name: PAGE_TITLE })).toBeVisible({
      timeout: 10000,
    });

    // Edit the identity (nombre) field and save. clear() first to wipe
    // any residual text from a prior test run.
    const nombreInput = page.locator(`${IDENTITY_FORM} input[name="value"]`);
    await nombreInput.clear();
    await nombreInput.fill(NEW_NOMBRE);
    await page.locator(`${IDENTITY_FORM} button[type="submit"]`).click();

    // The success toast appears (sonner renders [data-sonner-toast] in
    // the DOM) and the form re-syncs. Wait for the input to show the
    // server-returned value.
    await expect(nombreInput).toHaveValue(NEW_NOMBRE, { timeout: 10000 });

    // Wait for the unstable_cache to settle (revalidateTag fires after
    // the action returns; the homepage reader can briefly serve stale
    // data on the dev server).
    await page.waitForTimeout(500);

    // Homepage h1 reflects the new name (revalidatePath('/') has fired).
    await page.goto('/', { waitUntil: 'load' });
    await expect(page.locator(HOME_H1)).toContainText(NEW_NOMBRE, {
      timeout: 30000,
    });

    // /informacion still loads (the new name doesn't have to appear
    // there because the spec doesn't render the gym name on /informacion,
    // but the page must not 500 and the layout metadata must update).
    await page.goto('/informacion', { waitUntil: 'load' });
    await expect(page).toHaveURL(/\/informacion/);
    // Document title is the resolved gym name (set by root layout
    // generateMetadata) — so the new name should appear in <title>.
    await expect(page).toHaveTitle(new RegExp(NEW_NOMBRE, 'i'));
  });

  test('5.1.3 - configure weekly schedule per day → /informacion renders the formatted string', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/config');

    // IMPORTANT: React 19 / Next 16 `useActionState` renders the
    // WeeklyScheduleEditor form TWICE — once visible and once inside
    // a `<div hidden id="S:N">` for the server-action POST handler.
    // Every data-testid selector below uses `:visible` to match only
    // the visible copy. Without this, the test would fail in strict
    // mode with "resolved to 2 elements".

    // Configure a 3-bucket week: Mon-Fri 8-22, Sat 9-14, Sun closed.
    // The default state when initial=null is ALL CLOSED — we need to
    // open each day explicitly. We use `aria-checked` (not `data-checked`)
    // — base-ui Switch sets `aria-checked` as the source-of-truth state
    // attribute; the visual color comes from a Tailwind `data-[checked]:`
    // selector and lags slightly during a state transition.
    const weekdayCodes = ['lun', 'mar', 'mie', 'jue', 'vie'] as const;
    for (const code of weekdayCodes) {
      // The toggle is a base-ui Switch (role=switch).
      const toggle = page.locator(DAY_TOGGLE(code)).locator('visible=true');
      const apertura = page.locator(DAY_TIME_APERTURA(code)).locator('visible=true');
      const cierre = page.locator(DAY_TIME_CIERRE(code)).locator('visible=true');
      // First, ensure the day is open.
      const isChecked = await toggle.getAttribute('aria-checked');
      if (isChecked !== 'true') {
        await toggle.click();
        await expect(toggle).toHaveAttribute('aria-checked', 'true', {
          timeout: 5000,
        });
      }
      // Now the time inputs are visible. Set them.
      await apertura.fill('08:00');
      await cierre.fill('22:00');
    }

    // Saturday: 9-14.
    const sabToggle = page.locator(DAY_TOGGLE('sab')).locator('visible=true');
    const sabApertura = page.locator(DAY_TIME_APERTURA('sab')).locator('visible=true');
    const sabCierre = page.locator(DAY_TIME_CIERRE('sab')).locator('visible=true');
    const sabChecked = await sabToggle.getAttribute('aria-checked');
    if (sabChecked !== 'true') {
      await sabToggle.click();
      await expect(sabToggle).toHaveAttribute('aria-checked', 'true', {
        timeout: 5000,
      });
    }
    await sabApertura.fill('09:00');
    await sabCierre.fill('14:00');

    // Sunday: leave closed (default state).

    // Save the schedule.
    await page.locator(SCHEDULE_SUBMIT).locator('visible=true').click();

    // The success toast appears.
    const toast = page.locator('[data-sonner-toast]');
    await toast
      .first()
      .waitFor({ state: 'visible', timeout: 5000 })
      .catch(() => {
        /* toast may have already appeared and dismissed */
      });
    // Let the unstable_cache + router.refresh() settle.
    await page.waitForTimeout(1500);

    // Set Direccion + Maps so the AddressSection renders (paired with
    // the schedule change to keep both flows exercised in one test).
    async function saveField(
      selector: string,
      value: string,
      isTextarea = false
    ) {
      const field = page.locator(
        `${selector} ${isTextarea ? 'textarea' : 'input'}[name="value"]`
      );
      const submit = page.locator(`${selector} button[type="submit"]`);
      await field.clear();
      await field.fill(value);
      await submit.click();
      await expect(field).toHaveValue(value, { timeout: 15000 });
      const t = page.locator('[data-sonner-toast]');
      await t
        .first()
        .waitFor({ state: 'visible', timeout: 5000 })
        .catch(() => {});
      await page.waitForTimeout(1500);
    }
    await saveField(DIRECCION_FORM, NEW_DIRECCION);
    await saveField(MAPS_FORM, NEW_MAPS_URL);

    // Navigate to /informacion and verify the formatted hours string.
    await page.goto('/informacion', { waitUntil: 'load' });

    // The Horarios section card is present and contains the formatted
    // string. formatHorario output for "Mon-Fri 8-22, Sat 9-14, Sun
    // closed" is "Lun a Vie 8:00 a 22:00 · Sáb 9:00 a 14:00 · Dom
    // cerrado".
    const horasHeading = page.getByRole('heading', { name: 'Horarios' });
    await expect(horasHeading).toBeVisible({ timeout: 15000 });
    await expect(
      page.getByText('Lun a Vie 8:00 a 22:00 · Sáb 9:00 a 14:00 · Dom cerrado').first()
    ).toBeVisible();

    // The Dirección section is present (requires both direccion + maps).
    const direccionHeading = page.getByRole('heading', { name: 'Dirección' });
    await expect(direccionHeading).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(NEW_DIRECCION).first()).toBeVisible();
    // The map iframe has the saved src.
    const iframe = page.locator(`iframe[src="${NEW_MAPS_URL}"]`);
    await expect(iframe).toBeVisible();
  });

  test('5.1.3.1 - all-7-days-closed schedule → /informacion hides the hours section', async ({ page }) => {
    // Set all 7 days to "Cerrado" via the admin form, save, and verify
    // the public /informacion page does NOT render the Horarios section
    // (formatHorario returns null when all days are closed).
    await loginAsAdmin(page);
    await page.goto('/admin/config');

    // If any days are open (from a prior test in this run), toggle them
    // off. The `:visible` filter is required because React 19 / Next 16
    // renders the form twice (visible + hidden server-action copy).
    // We use `aria-checked` (not `data-checked`) — base-ui Switch sets
    // `aria-checked` as the source-of-truth state attribute; the visual
    // color comes from a Tailwind `data-[checked]:` selector.
    for (const code of ['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom'] as const) {
      const toggle = page.locator(DAY_TOGGLE(code)).locator('visible=true');
      const isChecked = await toggle.getAttribute('aria-checked');
      if (isChecked === 'true') {
        await toggle.click();
        // Wait for the state to flip before reading the next toggle.
        await expect(toggle).toHaveAttribute('aria-checked', 'false', {
          timeout: 5000,
        });
      }
    }

    // Save the schedule.
    await page.locator(SCHEDULE_SUBMIT).locator('visible=true').click();
    const toast = page.locator('[data-sonner-toast]');
    await toast
      .first()
      .waitFor({ state: 'visible', timeout: 5000 })
      .catch(() => {});
    await page.waitForTimeout(1500);

    // Navigate to /informacion and verify the Horarios heading is NOT
    // rendered. The HoursSection returns null when formatHorario
    // returns null (all-7-closed).
    await page.goto('/informacion', { waitUntil: 'load' });
    // The page loads (no error). The Horarios heading should be absent.
    const horasHeading = page.getByRole('heading', { name: 'Horarios' });
    await expect(horasHeading).toHaveCount(0);
  });

  test('5.1.3.2 - rejects schedule with apertura >= cierre (per-day toast error)', async ({ page }) => {
    // Mirrors the time-range validation in the feriado creation flow
    // (`feriado-manager.tsx:54`): apertura must be strictly less than
    // cierre. Submitting an inverted range (e.g. lunes 21:00 → 06:00)
    // must block the form and surface a per-day toast.error. The
    // underlying Zod schema is intentionally permissive (the form is
    // the source of consistency — see `tests/unit/gym-field-schema.test.ts`
    // horarioDiaSchema "form is the source of consistency" comment), so
    // this test pins the client-side guard in place. If someone removes
    // the onSubmit handler in WeeklyScheduleEditor, the server would
    // happily accept lunes 21:00 → 06:00, and this test would fail.
    await loginAsAdmin(page);
    await page.goto('/admin/config');

    // Open lunes and set an inverted range. apertura > cierre means
    // the onSubmit guard in WeeklyScheduleEditor must call
    // e.preventDefault() and the server action is NEVER invoked.
    const lunToggle = page.locator(DAY_TOGGLE('lun')).locator('visible=true');
    const lunApertura = page.locator(DAY_TIME_APERTURA('lun')).locator('visible=true');
    const lunCierre = page.locator(DAY_TIME_CIERRE('lun')).locator('visible=true');

    const isChecked = await lunToggle.getAttribute('aria-checked');
    if (isChecked !== 'true') {
      await lunToggle.click();
      await expect(lunToggle).toHaveAttribute('aria-checked', 'true', {
        timeout: 5000,
      });
    }
    await lunApertura.fill('21:00');
    await lunCierre.fill('06:00');

    // Submit. The onSubmit handler must call e.preventDefault() before
    // the form action runs.
    await page.locator(SCHEDULE_SUBMIT).locator('visible=true').click();

    // The per-day error toast appears. Sonner renders
    // `[data-sonner-toast]` and includes the message text. We assert
    // on a stable substring of the error so a copy change to the
    // message wording doesn't break the test, but a logic change (no
    // toast, or a different toast) does.
    const errorToast = page.locator('[data-sonner-toast]', {
      hasText: 'la hora de apertura debe ser menor',
    });
    await expect(errorToast).toBeVisible({ timeout: 5000 });

    // Stronger signal: the success toast does NOT appear. If the form
    // had been submitted successfully, the useEffect on state.success
    // would have fired toast.success("Horarios actualizados"). Wait
    // briefly to let the round-trip complete, then assert absence.
    await page.waitForTimeout(1500);
    const successToast = page.locator('[data-sonner-toast]', {
      hasText: 'Horarios actualizados',
    });
    await expect(successToast).toHaveCount(0);
  });

  test('5.1.4 - edit socialInstagram + socialWhatsapp → /informacion shows both buttons', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/config');

    // Same saveField helper as 5.1.3 — fills, submits, waits for the
    // server action to complete and the unstable_cache to settle.
    async function saveField(selector: string, value: string) {
      const field = page.locator(`${selector} input[name="value"]`);
      const submit = page.locator(`${selector} button[type="submit"]`);
      await field.clear();
      await field.fill(value);
      await submit.click();
      await expect(field).toHaveValue(value, { timeout: 15000 });
      // Wait for the success toast (sonner) to appear or dismiss.
      const toast = page.locator('[data-sonner-toast]');
      await toast
        .first()
        .waitFor({ state: 'visible', timeout: 5000 })
        .catch(() => {
          /* may have already appeared and dismissed */
        });
      await page.waitForTimeout(1500);
    }

    await saveField(INSTAGRAM_FORM, NEW_INSTAGRAM);
    await saveField(WHATSAPP_FORM, NEW_WHATSAPP);

    // /informacion now renders the social section with both buttons.
    await page.goto('/informacion', { waitUntil: 'load' });
    const socialHeading = page.getByRole('heading', { name: 'Redes Sociales' });
    await expect(socialHeading).toBeVisible({ timeout: 15000 });

    const instagramLink = page.locator(`a[href="${NEW_INSTAGRAM}"]`);
    const whatsappLink = page.locator(`a[href="${NEW_WHATSAPP}"]`);
    await expect(instagramLink).toBeVisible();
    await expect(whatsappLink).toBeVisible();
  });

  test('5.1.5 - admin sidebar shows the new gym name after save', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/config');

    // Set a known name. clear() first to wipe residual text.
    const nombreInput = page.locator(`${IDENTITY_FORM} input[name="value"]`);
    await nombreInput.clear();
    await nombreInput.fill(NEW_NOMBRE);
    await page.locator(`${IDENTITY_FORM} button[type="submit"]`).click();
    await expect(nombreInput).toHaveValue(NEW_NOMBRE, { timeout: 10000 });

    // The admin sidebar logo span (rendered in the desktop aside) should
    // show the new name. The GymConfigManager calls router.refresh() in
    // a useEffect on success, which forces the parent layout to re-render.
    // The sidebar logo text is wrapped in CSS `uppercase` — use
    // toContainText to be lenient.
    await expect(page.locator(SIDEBAR_LOGO).first()).toContainText(
      NEW_NOMBRE,
      { timeout: 15000 }
    );
  });

  test('5.1.6 - no duplicate "Configuración actualizada" toast on re-mount', async ({ page }) => {
    // Regression for the double-toast bug: the previous useEffect checked
    // `state.success` on every render, so the toast fired again whenever
    // the GymConfigManager remounted (sidebar navigation, cache revalidation,
    // router.refresh from a sibling sub-form). The fix detects the
    // `pending → done` transition via `useRef`, so the toast must appear
    // exactly once per save — even after navigating away and back.
    await loginAsAdmin(page);
    await page.goto('/admin/config');
    await expect(page.getByRole('heading', { name: PAGE_TITLE })).toBeVisible({
      timeout: 10000,
    });

    // Save a known name — expect one success toast.
    const nombreInput = page.locator(`${IDENTITY_FORM} input[name="value"]`);
    await nombreInput.clear();
    const noToastName = `Gym-NoDoubleToast-${RUN_ID}`;
    await nombreInput.fill(noToastName);
    await page.locator(`${IDENTITY_FORM} button[type="submit"]`).click();
    await expect(nombreInput).toHaveValue(noToastName, { timeout: 10000 });

    // Exactly one toast must appear after the save.
    const successToast = page.locator('[data-sonner-toast]', {
      hasText: 'Configuración actualizada',
    });
    await expect(successToast).toHaveCount(1, { timeout: 5000 });

    // Wait for it to dismiss (sonner default ~4s, give it 10s headroom)
    // so the post-navigation count check is unambiguous.
    await expect(successToast).toHaveCount(0, { timeout: 10000 });

    // Navigate away and back — the bug surfaced specifically on re-mount
    // because useActionState state is rebuilt with `success: false` on a
    // fresh component, but the useEffect ran on the re-mount render too,
    // seeing `success: false` was false on the second check... actually
    // the bug fired on EVERY render where `state.success` was `true` in
    // any saved sub-form — navigation rehydrates the page and re-runs
    // the effect for every sub-form whose last save had succeeded.
    await page.goto('/admin');
    await page.goto('/admin/config');
    await expect(page.getByRole('heading', { name: PAGE_TITLE })).toBeVisible({
      timeout: 10000,
    });

    // Give the (hypothetical) bug a chance to fire the toast on re-mount.
    await page.waitForTimeout(500);

    // The toast must NOT reappear on re-mount.
    const reAppeared = page.locator('[data-sonner-toast]', {
      hasText: 'Configuración actualizada',
    });
    await expect(reAppeared).toHaveCount(0);
  });
});

// ============================================
// Phase 5.2 — Fallback chain
// ============================================
//
// The fallback chain is: `DB → NEXT_PUBLIC_GYM_NAME → "Gimnasio"`.
// These tests are read-only — they only assert what the homepage <h1>
// resolves to given the current DB + env state.
//
// Strategy:
//   5.2.1 — Set a known DB value via the admin form, then assert the
//            homepage h1 contains it. Proves the DB step of the chain
//            works end-to-end (via revalidateTag + revalidatePath).
//   5.2.2 — When the login page renders (Client Component, no DB read),
//            the h1 must be `NEXT_PUBLIC_GYM_NAME` if set, else the
//            generic "Gimnasio". This proves the env → generic chain
//            for unauthenticated surfaces.
//   5.2.3 — The h1 on any rendered page NEVER contains a hardcoded
//            specific brand string (the hard-constraint from the
//            proposal). The grep in 5.4 is the source-of-truth for
//            src/; this is the runtime counterpart.

test.describe('Gym Config — Fallback chain', () => {
  test('5.2.1 - DB step of the chain: setting gym.nombre flows to homepage h1', async ({ page }) => {
    // Save a known value through the admin form, then check the
    // homepage reflects it. This validates that the DB → revalidatePath
    // → public-page flow works end-to-end.
    await loginAsAdmin(page);
    await page.goto('/admin/config');

    const envName = process.env.NEXT_PUBLIC_GYM_NAME?.trim() ?? '';
    const knownValue = envName
      ? `Override-${RUN_ID}`
      : `Gym-E2E-Fallback-${RUN_ID}`;
    // Use a value distinct from the env var so we can prove the DB
    // path wins over the env path.
    const nombreInput = page.locator(`${IDENTITY_FORM} input[name="value"]`);
    await nombreInput.fill(knownValue);
    await page.locator(`${IDENTITY_FORM} button[type="submit"]`).click();
    await expect(nombreInput).toHaveValue(knownValue, { timeout: 10000 });

    // The server action calls revalidateTag("gym-config") +
    // revalidatePath("/"). Wait a beat for the revalidation to settle
    // before fetching the homepage — on the dev server (Turbopack) the
    // unstable_cache reader can briefly serve a stale value while the
    // revalidation propagates.
    await page.waitForTimeout(500);

    // Homepage h1 reflects the DB value (not the env var, not "Gimnasio").
    // Hard-reload the page (bypass any client cache) so the test always
    // reads the latest server-rendered HTML.
    await page.goto('/', { waitUntil: 'load' });
    // The h1 is wrapped in `uppercase` CSS, so the rendered TEXT is
    // uppercase. Use a case-insensitive substring match via toContainText
    // to handle that transformation reliably.
    await expect(page.locator(HOME_H1)).toContainText(knownValue, {
      timeout: 30000,
    });
  });

  test('5.2.2 - login page h1 uses env → generic chain (no DB read)', async ({ page }) => {
    // The login page is a Client Component — it CANNOT read the DB.
    // It must resolve to `NEXT_PUBLIC_GYM_NAME` if set, else the
    // generic "Gimnasio". This is the env-step of the chain.
    await page.context().clearCookies();
    await page.goto('/admin/login');
    await page.waitForSelector('input[id="dni"]', { timeout: 15000 });

    const loginH1 = page.locator('h1').first();
    const envName = process.env.NEXT_PUBLIC_GYM_NAME?.trim() ?? '';

    if (envName) {
      // Dev has set the env var — login h1 should contain it.
      await expect(loginH1).toHaveText(
        new RegExp(escapeRegExp(envName), 'i'),
        { timeout: 10000 }
      );
    } else {
      // Default .env has NEXT_PUBLIC_GYM_NAME="" — chain falls to generic.
      await expect(loginH1).toHaveText(/Gimnasio/i, { timeout: 10000 });
    }
  });

  test('5.2.3 - no rendered page contains a hardcoded specific brand string', async ({ page }) => {
    // The hard-constraint from the proposal: "No specific gym brand name
    // may be hardcoded as a fallback". The grep check in 5.4 is the
    // authoritative source for src/. This test is the runtime counterpart
    // — it asserts that the homepage h1, the document title, and the
    // admin sidebar never leak a specific brand string. We assert on
    // the FULL chain output (the chain must terminate at "Gimnasio" or
    // the env var) by checking that the h1 is exactly one of those
    // values — never some other brand.
    await page.goto('/');
    const homeH1Text = (await page.locator(HOME_H1).textContent()) ?? '';
    // The h1 should match either the env var (if set) or "Gimnasio".
    // We assert it's NOT an empty/whitespace placeholder and matches
    // the documented chain output shape.
    const envName = process.env.NEXT_PUBLIC_GYM_NAME?.trim() ?? '';
    const expected = envName || 'Gimnasio';
    expect(homeH1Text.trim()).toBe(expected);

    const homeTitle = await page.title();
    // The document title follows the same chain — assert it matches
    // the chain's resolved value.
    expect(homeTitle).toBe(expected);

    // Same for the admin sidebar (only meaningful when logged in).
    await loginAsAdmin(page);
    await page.goto('/admin');
    const sidebarText = await page.locator('aside').first().textContent();
    // The sidebar contains "Gimnasio" if the chain falls through, or
    // the env var if set. Either way, NOT some other specific brand.
    expect(sidebarText ?? '').toContain(expected);
  });
});

// ============================================
// Phase 5.3 — Auth gate (unauthenticated /admin/config)
// ============================================

test.describe('Gym Config — Auth gate', () => {
  test('5.3.1 - /admin/config while logged out redirects to /admin/login', async ({ page }) => {
    // Clear any pre-existing session cookies.
    await page.context().clearCookies();

    // Hit /admin/config directly.
    await page.goto('/admin/config');

    // The parent /admin layout's auth check redirects to /admin/login.
    // Note: the layout adds a `?redirect=...` query param so we match a
    // regex on the URL pathname instead of an exact path.
    await page.waitForURL(/\/admin\/login(\?.*)?$/, { timeout: 10000 });

    // The login form is shown.
    await expect(page.locator('input[id="dni"]')).toBeVisible();
  });

  test('5.3.2 - /admin/config while logged out does NOT leak the config page content', async ({ page }) => {
    await page.context().clearCookies();
    const response = await page.goto('/admin/config');

    // Either the page redirects (status 200 on /admin/login) or the
    // server returns 302. Either way, the page should NOT render the
    // "Configuración del Gimnasio" heading (the title would mean the
    // auth guard let us through, which is a security regression).
    await page.waitForURL(/\/admin\/login(\?.*)?$/, { timeout: 10000 });
    const content = await page.content();
    expect(content).not.toContain('Configuración del Gimnasio');
    // Sanity: the response didn't 5xx.
    expect(response?.status() ?? 0).toBeLessThan(500);
  });
});

// ============================================
// Helpers
// ============================================

/** Escape user-provided strings for use in RegExp. */
function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ============================================
// sdd/clear-gym-fields — Phase F: E2E tests for the Vaciar flow.
// ============================================================
//
// Covers T-016 through T-018 (9 new tests, all under
// test.describe.configure({ mode: 'serial' })):
//
//   T-016: 4 clear→null→public tests (one per clearable field):
//     - 16.1 direccion
//     - 16.2 mapa (mapsEmbedUrl)
//     - 16.3 instagram
//     - 16.4 whatsapp
//   T-017: 3 tests:
//     - 17.1 undo within 5s restores value
//     - 17.2 TRAINER blocked from /admin/config (redirect to /)
//     - 17.3 toast-wrapper integration: save renders centralized
//          bg-success toast
//   T-018: 2 tests:
//     - 18.1 AddressSection iframe-only (direccion cleared, mapa set)
//     - 18.2 clear-failure-keeps-value (mock 500, input preserved)
//
// Timing semantics (2nd polish pass — Fix 3): the input clears
// IMMEDIATELY on server success. router.refresh() fires inside
// handleClear as soon as `clearGymDisplayField` resolves. We no
// longer wait >5s before navigating to the public page. The undo
// path still works the same way (Deshacer click re-fires
// updateGymField via the hidden form).

test.describe('Gym Config — Clear to null', () => {
  test.describe.configure({ mode: 'serial' });

  // Pre-test reset — the file-level afterEach runs AFTER each test,
  // but the FIRST test in this describe block has no prior afterEach
  // (the prior describe blocks don't reset display fields). Reset
  // here so every test starts from a known null baseline.
  test.beforeEach(async () => {
    await resetGymDisplayFields();
  });

  // 4× clear→null→public — one per clearable field.
  // Pattern: set value → click Vaciar → assert toast + immediate
  // input clear → navigate to /informacion → assert element hidden.
  const clearCases: Array<{
    field: string;
    formSel: string;
    clearTestId: string;
    publicCheck: (page: Page) => Promise<void>;
  }> = [
    {
      field: 'direccion',
      formSel: DIRECCION_FORM,
      clearTestId: 'clear-direccion',
      publicCheck: async (page: Page) => {
        const addressText = page.locator(
          'section:has(h2:has-text("Dirección")) p',
        );
        await expect(addressText).toHaveCount(0, { timeout: 10000 });
      },
    },
    {
      field: 'mapsEmbedUrl',
      formSel: MAPS_FORM,
      clearTestId: 'clear-mapa',
      publicCheck: async (page: Page) => {
        const iframe = page.locator(
          'section:has(h2:has-text("Dirección")) iframe',
        );
        await expect(iframe).toHaveCount(0, { timeout: 10000 });
      },
    },
    {
      field: 'socialInstagram',
      formSel: INSTAGRAM_FORM,
      clearTestId: 'clear-instagram',
      publicCheck: async (page: Page) => {
        const instagramLink = page.locator(
          `a[href^="https://www.instagram.com/"]`,
        );
        await expect(instagramLink).toHaveCount(0, { timeout: 10000 });
      },
    },
    {
      field: 'socialWhatsapp',
      formSel: WHATSAPP_FORM,
      clearTestId: 'clear-whatsapp',
      publicCheck: async (page: Page) => {
        const whatsappLink = page.locator(`a[href^="https://wa.me/"]`);
        await expect(whatsappLink).toHaveCount(0, { timeout: 10000 });
      },
    },
  ];

  for (const { field, formSel, clearTestId, publicCheck } of clearCases) {
    test(`clear→null→public for ${field}`, async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/config');
      await expect(
        page.getByRole('heading', { name: PAGE_TITLE }),
      ).toBeVisible({ timeout: 10000 });

      // 1. Set a known value via the existing saveField flow.
      const value =
        field === 'direccion'
          ? NEW_DIRECCION
          : field === 'mapsEmbedUrl'
            ? NEW_MAPS_URL
            : field === 'socialInstagram'
              ? NEW_INSTAGRAM
              : NEW_WHATSAPP;
      const fieldInput = page.locator(`${formSel} input[name="value"]`);
      const submit = page.locator(`${formSel} button[type="submit"]`);
      await fieldInput.clear();
      await fieldInput.fill(value);
      await submit.click();
      await expect(fieldInput).toHaveValue(value, { timeout: 15000 });
      await page.waitForTimeout(1000); // settle success toast

      // 2. Click Vaciar — the Trash2 button has data-testid per design #1.
      const clearBtn = page.locator(`[data-testid="${clearTestId}"]`);
      await expect(clearBtn).toBeVisible();
      await expect(clearBtn).toBeEnabled();
      await clearBtn.click();

      // 3. The undoable toast appears with the field-specific Spanish
      //    message + Deshacer button + the progress bar (data-testid
      //    set by ToastWithProgress — the 4th polish pass moved the bar
      //    from CSS to JS-driven requestAnimationFrame inside the
      //    component).
      const toast = page.locator('[data-sonner-toast]').filter({
        hasText: /eliminado/i,
      });
      await expect(toast).toBeVisible({ timeout: 5000 });
      // The Deshacer action button.
      await expect(
        toast.getByRole('button', { name: /deshacer/i }),
      ).toBeVisible();
      // The progress bar element (JS-driven, 4th polish pass).
      await expect(
        toast.locator('[data-testid="undo-toast-progress"]'),
      ).toBeAttached();

      // 4. Fix 3 (2nd polish pass) — the input clears IMMEDIATELY
      //    on server success (no more 5s delay). The uncontrolled
      //    key={displayedValue} re-mounts empty when router.refresh()
      //    lands with the null initial value.
      await expect(fieldInput).toHaveValue('', { timeout: 2000 });

      // 5. Navigate to /informacion — the corresponding public element
      //    is hidden. No need to wait past the 5s undo window anymore.
      await page.goto('/informacion', { waitUntil: 'load' });
      await publicCheck(page);
    });
  }

  // T-017.1: undo within 5s restores value (no refresh fires).
  test('undo within 5s restores value (Deshacer click)', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/config');
    await expect(
      page.getByRole('heading', { name: PAGE_TITLE }),
    ).toBeVisible({ timeout: 10000 });

    // Set a known direccion value first.
    const value = `Av. Undo Test ${RUN_ID}`;
    const fieldInput = page.locator(
      `${DIRECCION_FORM} input[name="value"]`,
    );
    const submit = page.locator(`${DIRECCION_FORM} button[type="submit"]`);
    await fieldInput.clear();
    await fieldInput.fill(value);
    await submit.click();
    await expect(fieldInput).toHaveValue(value, { timeout: 15000 });
    await page.waitForTimeout(1000);

    // Click Vaciar.
    const clearBtn = page.locator('[data-testid="clear-direccion"]');
    await clearBtn.click();

    // Toast appears.
    const toast = page.locator('[data-sonner-toast]').filter({
      hasText: /eliminado/i,
    });
    await expect(toast).toBeVisible({ timeout: 5000 });

    // Click Deshacer IMMEDIATELY (well within the 5s window).
    await toast.getByRole('button', { name: /deshacer/i }).click();

    // Toast dismisses.
    await expect(toast).toBeHidden({ timeout: 5000 });

    // Undo re-fires updateGymField — input shows the restored value.
    await expect(fieldInput).toHaveValue(value, { timeout: 15000 });

    // Wait past the original 5s window to confirm the restored value
    // stays put (Fix 3: undo restores via the hidden form, then the
    // Guardar useEffect calls router.refresh() which re-mounts with
    // the restored value).
    await page.waitForTimeout(5500);
    await expect(fieldInput).toHaveValue(value);

    // Public /informacion still shows the address.
    await page.goto('/informacion', { waitUntil: 'load' });
    await expect(
      page.locator('section:has(h2:has-text("Dirección")) p'),
    ).toHaveText(value, { timeout: 10000 });
  });

  // T-017.2: TRAINER blocked from /admin/config (redirects to /).
  test('TRAINER blocked from /admin/config redirects to /', async ({
    page,
  }) => {
    // Log in as the seeded TRAINER (Leo, DNI 22222222 per prisma/seed.ts).
    await page.goto('/admin/login');
    await page.waitForSelector('input[id="dni"]', { timeout: 15000 });
    await page.getByLabel('DNI').fill('22222222');
    await page.getByLabel('Contraseña').fill('leo123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin', { timeout: 30000 });
    await expect(
      page.getByRole('heading', { name: /Panel de Administraci/i }),
    ).toBeVisible({ timeout: 15000 });

    // Navigate to /admin/config — should redirect to / (NOT /admin/rutinas).
    await page.goto('/admin/config');
    await page.waitForURL('/', { timeout: 10000 });

    // The page must not render the config heading.
    const content = await page.content();
    expect(content).not.toContain('Configuración del Gimnasio');
  });

  // T-017.3: toast-wrapper integration — a save renders the centralized
  // toast with the bg-success class (proves the migration didn't break).
  test('save renders toast with centralized bg-success classes', async ({
    page,
  }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/config');
    await expect(
      page.getByRole('heading', { name: PAGE_TITLE }),
    ).toBeVisible({ timeout: 10000 });

    // Trigger a save — the existing "Configuración actualizada" toast
    // must come from src/lib/toast.ts:showSuccess, which applies the
    // `group-[.toaster]:bg-success` Tailwind token.
    const fieldInput = page.locator(
      `${DIRECCION_FORM} input[name="value"]`,
    );
    const submit = page.locator(`${DIRECCION_FORM} button[type="submit"]`);
    await fieldInput.clear();
    await fieldInput.fill(`Bg-success test ${RUN_ID}`);
    await submit.click();

    const toast = page.locator('[data-sonner-toast]', {
      hasText: /Configuraci.* actualizada/i,
    });
    await expect(toast).toBeVisible({ timeout: 10000 });

    // The classNames.toast from src/lib/toast.ts applies
    // `group-[.toaster]:bg-success`. This proves the wrapper is in
    // the chain (not a raw sonner.success call).
    const toastEl = toast.first();
    const classAttr = (await toastEl.getAttribute('class')) ?? '';
    expect(classAttr).toMatch(/bg-success/);
  });

  // T-018.1: AddressSection iframe-only — clear direccion leaving
  // mapsEmbedUrl set, /informacion shows iframe without text.
  test('AddressSection shows iframe without text when direccion is null', async ({
    page,
  }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/config');
    await expect(
      page.getByRole('heading', { name: PAGE_TITLE }),
    ).toBeVisible({ timeout: 10000 });

    // Set BOTH direccion AND mapsEmbedUrl first.
    const dirInput = page.locator(
      `${DIRECCION_FORM} input[name="value"]`,
    );
    const dirSubmit = page.locator(`${DIRECCION_FORM} button[type="submit"]`);
    await dirInput.clear();
    await dirInput.fill(NEW_DIRECCION);
    await dirSubmit.click();
    await expect(dirInput).toHaveValue(NEW_DIRECCION, { timeout: 15000 });

    const mapInput = page.locator(`${MAPS_FORM} input[name="value"]`);
    const mapSubmit = page.locator(`${MAPS_FORM} button[type="submit"]`);
    await mapInput.clear();
    await mapInput.fill(NEW_MAPS_URL);
    await mapSubmit.click();
    await expect(mapInput).toHaveValue(NEW_MAPS_URL, { timeout: 15000 });
    await page.waitForTimeout(1000);

    // Now clear ONLY direccion (leave mapsEmbedUrl intact).
    await page.locator('[data-testid="clear-direccion"]').click();
    // Fix 3 (2nd polish pass) — refresh fires IMMEDIATELY on server
    // success. Brief settle for the RSC re-fetch to land before we
    // navigate (the input clears within ~100ms; we give it 500ms of
    // headroom for the unstable_cache reader).
    await page.waitForTimeout(500);

    // /informacion renders the AddressSection: iframe visible, NO <p>.
    await page.goto('/informacion', { waitUntil: 'load' });
    const section = page.locator(
      'section:has(h2:has-text("Dirección"))',
    );
    await expect(section).toBeVisible({ timeout: 10000 });
    // iframe is rendered (the mapsEmbedUrl is still set).
    await expect(section.locator('iframe')).toBeVisible();
    // the <p> with the address text is NOT rendered (decoupled check).
    await expect(section.locator('p')).toHaveCount(0);
  });

  // T-018.2: clear-failure-keeps-value (REQ-7).
  test('clear-failure preserves input value (REQ-7)', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/config');
    await expect(
      page.getByRole('heading', { name: PAGE_TITLE }),
    ).toBeVisible({ timeout: 10000 });

    // Set a known direccion value.
    const value = `Av. REQ-7 test ${RUN_ID}`;
    const fieldInput = page.locator(
      `${DIRECCION_FORM} input[name="value"]`,
    );
    const submit = page.locator(`${DIRECCION_FORM} button[type="submit"]`);
    await fieldInput.clear();
    await fieldInput.fill(value);
    await submit.click();
    await expect(fieldInput).toHaveValue(value, { timeout: 15000 });
    await page.waitForTimeout(1000);

    // Intercept the next server action POST and respond with 500.
    // The clearGymDisplayField server action returns a failure result
    // even on HTTP 500 (the server wraps thrown errors as
    // { success: false, message }). The client's catch path shows
    // showError() and preserves the input value (REQ-7).
    await page.route('**/admin/config', (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'simulated DB failure' }),
        });
      }
      return route.continue();
    });

    // Click Vaciar.
    const clearBtn = page.locator('[data-testid="clear-direccion"]');
    await clearBtn.click();

    // The error toast appears (destructive variant).
    const errorToast = page
      .locator('[data-sonner-toast]')
      .filter({ hasText: /Error al eliminar/i });
    await expect(errorToast).toBeVisible({ timeout: 10000 });

    // REQ-7: input value is PRESERVED (not blanked).
    await expect(fieldInput).toHaveValue(value, { timeout: 5000 });

    // Vaciar re-enables because the field is non-empty (isClearPending
    // auto-resets to false on transition completion).
    await expect(clearBtn).toBeEnabled({ timeout: 5000 });
  });

  // ============================================================
  // Regression guard — ultra-fast Guardar → Vaciar → Deshacer
  // ============================================================
  //
  // Pins down the fix for two non-obvious bugs that surfaced during
  // manual exploration of the clear-gym-fields change:
  //   1. `toast.custom()` (the undo toast) and `toast.success()` (the
  //      save toast) cannot replace each other even when sharing an
  //      id in sonner 2.0.7 — fixed by giving the undo toast a unique
  //      per-field id `gym-undo-${config.field}`.
  //   2. The order of `router.refresh()` vs `showSuccess()` matters
  //      for RSC reconciliation — fixed by calling `router.refresh()`
  //      BEFORE `showSuccess()` so the toast survives the re-fetch.
  //
  // Without this test, a future change to the toast id scheme (e.g.
  // introducing a "duplicar config" toast) could silently re-stack
  // the save toast and the undo toast in the DOM, confusing users
  // with two parallel notifications during one interaction.
  //
  // The test monitors `[data-sonner-toast]` count throughout the
  // ultra-fast click sequence (every 30ms via `waitForFunction`
  // polling) and asserts the count never exceeds 1. We also assert
  // the post-settle count is ≤ 1 (everything should resolve to a
  // single toast: either the restored save toast from the hidden
  // undo form's re-submit, or no toast at all if the user dismissed).
  test('ultra-fast Guardar→Vaciar→Deshacer keeps at most 1 toast visible (regression guard)', async ({
    page,
  }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/config');
    await expect(
      page.getByRole('heading', { name: PAGE_TITLE }),
    ).toBeVisible({ timeout: 10000 });

    // Set a known direccion value. We intentionally do NOT click
    // Guardar yet — the click sequence starts below in step 5.
    const value = `Av. UltraFast ${RUN_ID}`;
    const fieldInput = page.locator(`${DIRECCION_FORM} input[name="value"]`);
    const submit = page.locator(`${DIRECCION_FORM} button[type="submit"]`);
    await fieldInput.clear();
    await fieldInput.fill(value);

    // ============================================================
    // DOM polling — start BEFORE the click sequence so we capture
    // every transition (mount/unmount/replace) during the test.
    //
    // Implementation choice: page.waitForFunction with `polling: 30`
    // (the user's spec) plus a 15s timeout (gives plenty of headroom
    // for Next.js dev compilation + 3 server action round-trips on
    // a cold cache). The function pushes a sample per poll and
    // returns `false` so it never resolves on its own — we race the
    // timeout instead. `.catch(() => {})` swallows the TimeoutError.
    // ============================================================
    const monitorPromise = page.waitForFunction(
      () => {
        const w = window as unknown as {
          __samples?: number[];
        };
        if (!w.__samples) w.__samples = [];
        const count = document.querySelectorAll('[data-sonner-toast]').length;
        w.__samples.push(count);
        return false; // never resolve — we stop polling externally
      },
      undefined,
      { polling: 30, timeout: 15000 },
    );

    try {
      // ============================================================
      // ULTRA-FAST click sequence — NO waitForTimeout between clicks.
      // ============================================================
      // Step 5: Click Guardar — useActionState kicks off; on success
      //         the useEffect fires router.refresh() + showSuccess(
      //         "Configuración actualizada", { id: "gym-config" }).
      await submit.click();

      // Step 6: IMMEDIATELY click Vaciar — useTransition kicks off;
      //         on success handleClear fires router.refresh() +
      //         showUndoableToast({ ..., id: "gym-undo-direccion" }).
      await page.locator('[data-testid="clear-direccion"]').click();

      // Step 7: IMMEDIATELY click the Deshacer button inside the
      //         visible toast — ToastWithProgress.onUndo calls
      //         sonnerToast.dismiss(t) + the parent onUndo (which
      //         re-fires updateGymField via the hidden form).
      //         Playwright's auto-wait blocks here if the toast has
      //         not yet rendered — by design, that's the contract:
      //         we click Deshacer as soon as it's actionable.
      await page
        .locator('[data-sonner-toast] button:has-text("Deshacer")')
        .first()
        .click();

      // ============================================================
      // Settle — let all server actions complete + re-fetch land +
      // any toast re-mounts resolve. The undo window is 5s, but
      // clicking Deshacer dismisses the undo toast immediately, so
      // 3s is plenty for the hidden form's save to return and its
      // own showSuccess (id "gym-config", replaces any prior save
      // toast) to fire.
      // ============================================================
      await page.waitForTimeout(3000);
    } finally {
      // Stop polling — the waitForFunction will time out after the
      // configured 15s window, but the .catch in the await below
      // swallows the error. Calling .catch() BEFORE the timeout
      // doesn't actually cancel the polling — sonner's RAF loop
      // continues until the 15s timeout. We read samples via
      // page.evaluate regardless.
      await monitorPromise.catch(() => {
        /* expected: TimeoutError when 15s expires */
      });
    }

    // ============================================================
    // Read the collected samples + assert.
    // ============================================================
    const samples = await page.evaluate(
      () =>
        (window as unknown as { __samples?: number[] }).__samples ?? [],
    );

    // The polling must have actually run (sanity).
    expect(samples.length).toBeGreaterThan(0);

    // CORE INVARIANT: at every single poll, the count was ≤ 1.
    // If ANY sample shows 2 or more, two toasts were simultaneously
    // visible at that moment — the regression we're guarding
    // against has resurfaced.
    const maxCount = samples.reduce((m, v) => (v > m ? v : m), 0);
    expect(maxCount).toBeLessThanOrEqual(1);

    // POST-SETTLE INVARIANT: after everything resolves, the DOM
    // holds at most 1 toast (the restored save toast from the
    // hidden form re-submit, OR no toast if everything dismissed).
    const finalCount = await page.locator('[data-sonner-toast]').count();
    expect(finalCount).toBeLessThanOrEqual(1);

    // Diagnostic context for failures — emit the sample timeline
    // so a future failure shows exactly when the stacking happened.
    if (maxCount > 1 || finalCount > 1) {
      throw new Error(
        `Toast stacking detected. Max during sequence: ${maxCount}, ` +
          `final count: ${finalCount}. Samples (${samples.length}): ` +
          `[${samples.slice(0, 50).join(',')}${samples.length > 50 ? ',...' : ''}]`,
      );
    }
  });
});
