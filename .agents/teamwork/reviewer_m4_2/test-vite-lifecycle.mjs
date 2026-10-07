import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { createServer } from '../../../apps/web/node_modules/vite/dist/node/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webDir = path.resolve(__dirname, '../../../apps/web');

async function isPortOpen(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}`, () => resolve(true));
    req.on('error', () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function testLifecycle() {
  const testPort = 5199;
  console.log(`1. Testing if port ${testPort} is initially closed...`);
  const initialOpen = await isPortOpen(testPort);
  console.log(`Port ${testPort} initial state: ${initialOpen ? 'OPEN' : 'CLOSED'}`);

  console.log(`2. Launching Vite dev server on port ${testPort}...`);
  const server = await createServer({
    root: webDir,
    configFile: path.resolve(webDir, 'vite.config.ts'),
    server: { port: testPort, strictPort: true },
  });
  await server.listen();
  console.log(`Vite dev server listening on port ${testPort}.`);

  const duringOpen = await isPortOpen(testPort);
  console.log(`Port ${testPort} while running: ${duringOpen ? 'OPEN' : 'CLOSED'}`);

  console.log(`3. Closing Vite dev server...`);
  await server.close();
  console.log(`Vite server closed.`);

  await new Promise(r => setTimeout(r, 500));
  const finalOpen = await isPortOpen(testPort);
  console.log(`Port ${testPort} after close: ${finalOpen ? 'OPEN' : 'CLOSED'}`);

  if (!initialOpen && duringOpen && !finalOpen) {
    console.log(`LIFECYCLE VERIFICATION: SUCCESS (clean open and close, 0 leaked ports)`);
    process.exit(0);
  } else {
    console.error(`LIFECYCLE VERIFICATION: FAILED`);
    process.exit(1);
  }
}

testLifecycle().catch(err => {
  console.error(err);
  process.exit(1);
});
