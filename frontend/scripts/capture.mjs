import puppeteer from 'puppeteer-core';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const outDir = path.resolve(rootDir, '../docs/Design/screenshots');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function isServerReady(url) {
  try {
    const res = await fetch(url);
    return res.ok;
  } catch {
    return false;
  }
}

async function startViteServer() {
  const isWindows = process.platform === 'win32';
  const npmCmd = isWindows ? 'npm.cmd' : 'npm';
  const proc = spawn(npmCmd, ['run', 'dev', '--', '--port', '5173'], {
    cwd: rootDir,
    stdio: 'pipe',
    shell: true,
  });

  proc.stdout.on('data', (d) => process.stdout.write(d.toString()));
  proc.stderr.on('data', (d) => process.stderr.write(d.toString()));

  const targetUrl = 'http://localhost:5173/';
  console.log('Waiting for Vite dev server...');
  for (let i = 0; i < 30; i++) {
    await wait(500);
    if (await isServerReady(targetUrl)) {
      console.log('Vite dev server is ready at ' + targetUrl);
      return { proc, url: targetUrl };
    }
  }
  proc.kill();
  throw new Error('Vite dev server failed to start within 15s');
}

async function main() {
  const { proc, url } = await startViteServer();

  try {
    const browser = await puppeteer.launch({
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--headless=new'],
    });

    const viewports = [
      { name: 'desktop-1672', width: 1672, height: 941 },
      { name: 'desktop-1440', width: 1440, height: 900 },
      { name: 'mobile-390', width: 390, height: 844, isMobile: true },
    ];

    // 1. Capture Guest views
    for (const vp of viewports) {
      const page = await browser.newPage();
      await page.setViewport({ width: vp.width, height: vp.height, isMobile: !!vp.isMobile });
      await page.setRequestInterception(true);

      page.on('request', (req) => {
        const reqUrl = req.url();
        if (reqUrl.includes('/health')) {
          req.respond({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, data: { status: 'UP' } }),
          });
        } else {
          req.continue();
        }
      });

      // Clear local storage to guarantee guest
      await page.evaluateOnNewDocument(() => {
        localStorage.clear();
      });

      await page.goto(url, { waitUntil: 'networkidle2' });
      await wait(1200); // let animations / ThreeJS render
      const screenshotPath = path.join(outDir, `v3-guest-${vp.name}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: false });
      console.log(`Captured guest screenshot: ${screenshotPath}`);
      const artifactGuestPath = `C:\\Users\\LENOVO\\.gemini\\antigravity\\brain\\0a82715b-8200-44cc-b555-d3e68b315a57\\v3-guest-${vp.name}.png`;
      try { fs.copyFileSync(screenshotPath, artifactGuestPath); } catch {}
      await page.close();
    }

    // 2. Capture Authenticated views with realistic fixtures matching approved reference
    for (const vp of viewports) {
      const page = await browser.newPage();
      await page.setViewport({ width: vp.width, height: vp.height, isMobile: !!vp.isMobile });
      await page.setRequestInterception(true);

      page.on('request', (req) => {
        const reqUrl = req.url();
        if (reqUrl.includes('/users/me')) {
          req.respond({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                id: 1,
                fullName: 'Thạch Đỗ',
                email: 'thach@jiayou.vn',
                role: 'ROLE_USER',
              },
            }),
          });
        } else if (reqUrl.includes('/progress/insights')) {
          req.respond({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                levels: [
                  { level: 1, learnedWords: 86, totalWords: 150, practicedGrammar: 12, totalGrammar: 45 },
                  { level: 2, learnedWords: 0, totalWords: 150, practicedGrammar: 0, totalGrammar: 45 },
                  { level: 3, learnedWords: 0, totalWords: 0, practicedGrammar: 0, totalGrammar: 0 },
                  { level: 4, learnedWords: 0, totalWords: 0, practicedGrammar: 0, totalGrammar: 0 },
                  { level: 5, learnedWords: 0, totalWords: 0, practicedGrammar: 0, totalGrammar: 0 },
                  { level: 6, learnedWords: 0, totalWords: 0, practicedGrammar: 0, totalGrammar: 0 },
                ],
                quests: [
                  {
                    code: 'VOCAB_10',
                    title: 'Học từ vựng',
                    description: 'Học 10 từ vựng mới',
                    route: '/vocabulary?level=HSK1',
                    progress: 10,
                    target: 10,
                    exp: 20,
                    bamboo: 2,
                    claimed: true,
                  },
                  {
                    code: 'LISTEN_5',
                    title: 'Luyện nghe',
                    description: 'Luyện nghe 5 phút',
                    route: '/pinyin',
                    progress: 0,
                    target: 5,
                    exp: 15,
                    bamboo: 2,
                    claimed: false,
                  },
                  {
                    code: 'PRACTICE_1',
                    title: 'Luyện tập',
                    description: 'Luyện tập 1 bài',
                    route: '/grammar',
                    progress: 0,
                    target: 1,
                    exp: 25,
                    bamboo: 3,
                    claimed: false,
                  },
                ],
                wallet: { bamboo: 6, affectionExp: 42 },
              },
            }),
          });
        } else if (reqUrl.includes('/streak/week')) {
          req.respond({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                state: 'ACTIVE',
                currentStreak: 12,
                displayStreak: 12,
                preservedStreak: 12,
                longestStreak: 15,
                todayQualified: true,
                zone: 'Asia/Ho_Chi_Minh',
                today: '2026-11-02',
                weekStart: '2026-11-02',
                days: [
                  { date: '2026-11-02', state: 'TODAY_COMPLETED', qualified: true, restored: false },
                  { date: '2026-11-03', state: 'FUTURE', qualified: false, restored: false },
                  { date: '2026-11-04', state: 'FUTURE', qualified: false, restored: false },
                  { date: '2026-11-05', state: 'FUTURE', qualified: false, restored: false },
                  { date: '2026-11-06', state: 'FUTURE', qualified: false, restored: false },
                  { date: '2026-11-07', state: 'FUTURE', qualified: false, restored: false },
                  { date: '2026-11-08', state: 'FUTURE', qualified: false, restored: false },
                ],
                monthlyLimit: 5,
                usedRestorations: 0,
                remainingRestorations: 5,
                requiredRestorations: 0,
                canRestore: false,
                gapToken: null,
                reason: 'QUALIFIED',
                missedDates: [],
                replayed: false,
              },
            }),
          });
        } else if (reqUrl.endsWith('/streak') || reqUrl.includes('/streak?')) {
          req.respond({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                currentStreak: 12,
                longestStreak: 15,
                todayCompleted: true,
                lastStudyDate: '2026-11-02',
              },
            }),
          });
        } else if (reqUrl.includes('/companion/wallet')) {
          req.respond({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                bamboo: 6,
                affectionExp: 42,
                growthStage: 'infant',
                mood: 'happy',
              },
            }),
          });
        } else if (reqUrl.includes('/health')) {
          req.respond({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, data: { status: 'UP' } }),
          });
        } else {
          req.continue();
        }
      });

      // Inject auth user into localStorage before loading page
      await page.evaluateOnNewDocument(() => {
        localStorage.setItem(
          'heyganba_user',
          JSON.stringify({
            userId: 1,
            fullName: 'Thạch Đỗ',
            email: 'thach@jiayou.vn',
            role: 'ROLE_USER',
          })
        );
      });

      await page.goto(url, { waitUntil: 'networkidle2' });
      await wait(1400); // let 3D canvas and animations settle
      const screenshotPath = path.join(outDir, `v3-auth-${vp.name}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: false });
      console.log(`Captured auth screenshot: ${screenshotPath}`);
      const artifactAuthPath = `C:\\Users\\LENOVO\\.gemini\\antigravity\\brain\\0a82715b-8200-44cc-b555-d3e68b315a57\\v3-auth-${vp.name}.png`;
      try { fs.copyFileSync(screenshotPath, artifactAuthPath); } catch {}
      await page.close();
    }

    await browser.close();
  } finally {
    // Kill vite process
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', proc.pid.toString(), '/f', '/t']);
    } else {
      proc.kill();
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
