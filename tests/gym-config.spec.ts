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
