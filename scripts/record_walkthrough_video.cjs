const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { chromium } = require('@playwright/test');

const DIST_DIR = path.resolve(__dirname, '../apps/web/dist');
const DEMO_DIR = path.resolve(__dirname, '../docs/assets/demo');
const RAW_VIDEO_DIR = path.resolve(DEMO_DIR, 'raw_video');
const FFMPEG_PATH = 'C:\\Users\\yashv\\AppData\\Local\\Microsoft\\WinGet\\Links\\ffmpeg.EXE';
const CHROME_PATH = 'C:\\Users\\yashv\\AppData\\Local\\ms-playwright\\chromium-1243\\chrome-win64\\chrome.exe';
const PORT = 4174;

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

function startServer() {
  const server = http.createServer((req, res) => {
    let cleanUrl = req.url.split('?')[0];
    let filePath = path.join(DIST_DIR, cleanUrl);

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath);
      res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
      return;
    }

    const indexHtml = path.join(DIST_DIR, 'index.html');
    res.writeHead(200, { 'Content-Type': 'text/html' });
    fs.createReadStream(indexHtml).pipe(res);
  });

  return new Promise((resolve) => {
    server.listen(PORT, '127.0.0.1', () => {
      console.log(`Video capture server running at http://127.0.0.1:${PORT}`);
      resolve(server);
    });
  });
}

async function record() {
  const server = await startServer();
  fs.mkdirSync(RAW_VIDEO_DIR, { recursive: true });

  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: {
      dir: RAW_VIDEO_DIR,
      size: { width: 1280, height: 720 },
    },
  });

  const page = await context.newPage();

  console.log('Scene 1: Landing Page Hero & Flowing Overview (0s - 5s)...');
  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.evaluate(() => window.scrollBy({ top: 400, behavior: 'smooth' }));
  await page.waitForTimeout(1500);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await page.waitForTimeout(1000);

  console.log('Scene 2: Practice Studio Piano - Shostakovich Waltz No. 2 (5s - 11s)...');
  await page.goto(`http://127.0.0.1:${PORT}/practice/waltz-no-2`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.documentElement.classList.remove('dark'));
  await page.waitForTimeout(2000);

  console.log('Scene 3: Studio Setup Popover & Waterfall Mode (11s - 17s)...');
  const setupBtn = page.locator('[data-testid="studio-setup-toggle-btn"]');
  if (await setupBtn.count() > 0) {
    await setupBtn.click();
    await page.waitForTimeout(1500);
    const fallingKeysBtn = page.getByRole('button', { name: /Falling Keys/i });
    if (await fallingKeysBtn.count() > 0) {
      await fallingKeysBtn.click();
      await page.waitForTimeout(1000);
    }
    await page.mouse.click(200, 200); // close menu
    await page.waitForTimeout(2000);
  }

  console.log('Scene 4: Practice Studio Guitar - House of the Rising Sun in Obsidian (17s - 24s)...');
  await page.goto(`http://127.0.0.1:${PORT}/practice/house-of-the-rising-sun`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.documentElement.classList.add('dark'));
  await page.waitForTimeout(3000);

  console.log('Scene 5: Acoustic Guitar Tuner (24s - 28s)...');
  await page.goto(`http://127.0.0.1:${PORT}/tuner`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.documentElement.classList.add('dark'));
  await page.waitForTimeout(2500);

  console.log('Scene 6: Progress & Peer Benchmarks (28s - 34s)...');
  await page.goto(`http://127.0.0.1:${PORT}/progress`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.documentElement.classList.add('dark'));
  await page.waitForTimeout(2500);
  await page.goto(`http://127.0.0.1:${PORT}/community`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.documentElement.classList.remove('dark'));
  await page.waitForTimeout(2500);

  const video = page.video();
  await page.close();
  await context.close();
  await browser.close();
  server.close();

  const videoPath = await video.path();
  console.log(`Raw video recorded to: ${videoPath}`);

  // Mux with audio track using FFmpeg
  const audioPath = path.resolve(DEMO_DIR, 'walkthrough_audio.wav');
  const finalMp4Path = path.resolve(DEMO_DIR, 'sonus-walkthrough.mp4');

  if (fs.existsSync(FFMPEG_PATH) && fs.existsSync(audioPath)) {
    console.log('Muxing video with realistic acoustic synth & metronome audio via FFmpeg...');
    const cmd = `"${FFMPEG_PATH}" -y -i "${videoPath}" -i "${audioPath}" -c:v libx264 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest -movflags +faststart "${finalMp4Path}"`;
    execSync(cmd, { stdio: 'inherit' });
    console.log(`Broadcast-quality walkthrough video created at: ${finalMp4Path}`);
  } else {
    console.warn('FFmpeg or audio track missing; raw video preserved.');
  }
}

record().catch((err) => {
  console.error('Error during video recording:', err);
  process.exit(1);
});
