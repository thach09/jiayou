import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash, randomBytes } from 'node:crypto';
import { isAbsolute } from 'node:path';

let browser;
let phase = 'QA isolation preflight';
try {
  // This digest-pinned record must come from an operator's actual API/database inspection.
  // A URL or a self-declared localhost target cannot establish database isolation.
  assert.ok(!process.env.DEBUG && !process.env.NODE_DEBUG);
  assert.notEqual(process.env.NODE_TLS_REJECT_UNAUTHORIZED, '0');
  assert.ok(process.env.AUDIT_WEB_URL && process.env.AUDIT_API_URL);
  const web = new URL(process.env.AUDIT_WEB_URL);
  const api = new URL(process.env.AUDIT_API_URL);
  for (const target of [web, api]) {
    assert.equal(target.protocol, 'https:');
    assert.ok(!target.username && !target.password && !target.search && !target.hash);
  }
  assert.equal(web.pathname, '/');
  assert.equal(api.origin, web.origin);
  assert.equal(api.pathname, '/api/v1');
  assert.ok(isAbsolute(process.env.AUDIT_ISOLATION_FILE || ''));
  assert.match(process.env.AUDIT_ISOLATION_SHA256 || '', /^[a-f0-9]{64}$/);
  const recordBytes = readFileSync(process.env.AUDIT_ISOLATION_FILE);
  assert.equal(createHash('sha256').update(recordBytes).digest('hex'), process.env.AUDIT_ISOLATION_SHA256);
  const record = JSON.parse(recordBytes.toString('utf8'));
  assert.equal(record.purpose, 'jiayou-disposable-auth-cookie-qa');
  assert.equal(record.mainSha, 'cd5ed256890038dd64511562da5e10d41a5515d9');
  assert.equal(record.webUrl, web.href);
  assert.equal(record.apiUrl, api.href);
  assert.equal(record.disposablePostgresql, true);
  assert.equal(record.productionConnectionsExcluded, true);
  for (const key of ['verifiedBy', 'apiIdentity', 'postgresIdentity', 'apiDatabaseBindingEvidence']) {
    assert.ok(typeof record[key] === 'string' && record[key].trim().length > 0);
  }
  const verifiedAt = Date.parse(record.verifiedAt);
  const expiresAt = Date.parse(record.expiresAt);
  assert.ok(verifiedAt <= Date.now() && Date.now() < expiresAt && expiresAt - verifiedAt <= 86_400_000);

  phase = 'isolated browser startup';
  browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const page = await browser.newPage();
  let pageErrors = 0;
  let blockedRequests = 0;
  page.on('pageerror', () => { pageErrors++; });
  await page.setRequestInterception(true);
  page.on('request', request => {
    const target = new URL(request.url());
    if (['https:', 'http:'].includes(target.protocol) && target.origin !== web.origin) {
      blockedRequests++;
      void request.abort().catch(() => { pageErrors++; });
    } else {
      void request.continue().catch(() => { pageErrors++; });
    }
  });
  const authResponse = (path) => page.waitForResponse(response =>
    response.url() === `${api.href}/auth/${path}` && response.request().method() === 'POST');
  const assertNoPersistedJwt = async () => assert.ok(await page.evaluate(() =>
    !localStorage.getItem('heyganba_access_token') && !localStorage.getItem('heyganba_refresh_token')
    && !/accessToken|refreshToken/.test(localStorage.getItem('heyganba_user') || '')));

  await page.setViewport({ width: 1440, height: 1000 });
  await page.goto(web.href, { waitUntil: 'networkidle0' });
  phase = 'synthetic registration';
  const email = `cookie-browser-${randomBytes(12).toString('hex')}@heyganba.test`;
  const password = randomBytes(24).toString('base64url');
  const registered = await fetch(`${api.href}/auth/register`, {
    method: 'POST', redirect: 'error', signal: AbortSignal.timeout(15_000),
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, fullName: 'Cookie Browser Audit' }),
  });
  assert.equal(registered.status, 201);
  phase = 'cookie-mode login';
  await page.locator('aria/Đăng nhập[role="button"]').click();
  await page.waitForSelector('#auth-email');
  await page.type('#auth-email', email);
  await page.type('#auth-password', password);
  const [response] = await Promise.all([authResponse('login'), page.click('#auth-submit-btn')]);
  assert.equal(response.status(), 200);
  assert.equal(response.request().headers()['x-auth-transport'], 'cookie');
  assert.equal((await response.json()).data.refreshToken, null);
  await page.waitForFunction(() => !document.querySelector('#auth-email'));
  const cookies = await browser.cookies();
  const refresh = cookies.find(c => c.name === 'heyganba_refresh');
  assert.ok(refresh?.httpOnly);
  assert.equal(refresh.secure, true);
  assert.equal(refresh.sameSite, 'Lax');
  assert.equal(refresh.path, '/api/v1/auth');
  assert.ok(await page.evaluate(() => !document.cookie.includes('heyganba_refresh')));
  await assertNoPersistedJwt();

  phase = 'session recovery';
  const [rotated] = await Promise.all([
    authResponse('refresh'),
    page.waitForResponse(response => response.url() === `${api.href}/streak` && response.status() === 200),
    page.reload({ waitUntil: 'domcontentloaded' }),
  ]);
  assert.equal(rotated.status(), 200);
  assert.equal((await rotated.json()).data.refreshToken, null);
  await assertNoPersistedJwt();

  phase = 'responsive layout';
  for (const width of [1440, 390]) {
    await page.setViewport({ width, height: 1000 });
    if (width <= 900) {
      await page.waitForSelector('button[aria-label="Mở thanh điều hướng"]', { visible: true });
      await new Promise(resolve => setTimeout(resolve, 200)); // Let the sidebar and content-margin transitions finish.
      const mobileLayout = await page.evaluate(() => {
        const box = (element) => { const r = element.getBoundingClientRect(); return { x: Math.round(r.x), width: Math.round(r.width) }; };
        const sidebar = document.querySelector('aside[aria-label]');
        const main = document.querySelector('main');
        return { viewport: innerWidth, documentWidth: document.documentElement.scrollWidth, scrollX,
          sidebar: { ...box(sidebar), closed: sidebar.hasAttribute('inert') }, main: box(main), content: box(main.firstElementChild) };
      });
      assert.ok(mobileLayout.sidebar.closed && mobileLayout.sidebar.x <= -mobileLayout.sidebar.width + 1,
        'The mobile drawer must be off-screen after resizing');
      assert.equal(mobileLayout.main.x, 0, 'The dashboard must reclaim the mobile viewport after the drawer closes');
      assert.ok(mobileLayout.documentWidth <= mobileLayout.viewport, 'Mobile dashboard must not overflow horizontally');
    }
    await page.evaluate(() => window.scrollTo({ left: 0, top: 0, behavior: 'instant' }));
    assert.equal(await page.evaluate(() => window.scrollX), 0, `Layout must start at the left edge at ${width}px`);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Dashboard must not overflow horizontally');
  }

  phase = 'account logout';
  await page.goto(new URL('/toi', web).href, { waitUntil: 'networkidle0' });
  const [logout] = await Promise.all([
    authResponse('logout'), page.locator('aria/Đăng xuất[role="button"]').click(),
  ]);
  assert.equal(logout.status(), 200);
  assert.equal(logout.request().headers()['x-auth-transport'], 'cookie');
  assert.equal((await logout.json()).success, true);
  assert.ok(logout.headers()['cache-control']?.includes('no-store'));
  await page.waitForFunction(() => !localStorage.getItem('heyganba_user'));
  await assertNoPersistedJwt();
  assert.ok(!(await browser.cookies()).some(c => c.name === 'heyganba_refresh'));
  assert.equal(pageErrors, 0);
  assert.equal(blockedRequests, 0);
} catch {
  // URLs, response bodies, browser errors and assertion operands may contain secrets.
  console.error(`Cookie browser smoke failed during ${phase}. Sensitive diagnostics suppressed.`);
  process.exitCode = 1;
} finally {
  await browser?.close().catch(() => {
    console.error('Cookie browser smoke failed during browser shutdown. Sensitive diagnostics suppressed.');
    process.exitCode = 1;
  });
}
if (!process.exitCode) {
  console.log('Cookie browser smoke passed on verified HTTPS QA: secure refresh, recovery, layout and logout cleanup.');
}
