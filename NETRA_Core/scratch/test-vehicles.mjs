import { spawn } from 'child_process';
import http from 'http';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9222;

async function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function run() {
  console.log('Launching Chrome for Vehicle Search verification...');
  const proc = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    '--disable-gpu',
    '--no-sandbox',
    '--disable-extensions',
    'about:blank'
  ], { stdio: 'ignore' });

  let wsUrl = null;
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 300));
    try {
      const version = await fetchJson(`http://127.0.0.1:${PORT}/json/version`);
      wsUrl = version.webSocketDebuggerUrl;
      if (wsUrl) break;
    } catch (e) {}
  }

  if (!wsUrl) {
    console.error('Failed to connect to CDP');
    proc.kill();
    return;
  }

  const ws = new WebSocket(wsUrl);
  await new Promise((resolve) => {
    if (ws.readyState === WebSocket.OPEN) return resolve();
    ws.addEventListener('open', resolve, { once: true });
  });

  let msgId = 1;
  const callbacks = new Map();
  const send = (method, params = {}) => new Promise((resolve) => {
    const id = msgId++;
    callbacks.set(id, resolve);
    ws.send(JSON.stringify({ id, method, params }));
  });

  const errors = [];
  ws.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && callbacks.has(msg.id)) {
      callbacks.get(msg.id)(msg);
      callbacks.delete(msg.id);
    }
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      const text = msg.params.args.map(a => a.value || a.description).join(' ');
      console.error(`[CONSOLE ERROR]:`, text);
      errors.push(text);
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      console.error('[PAGE EXCEPTION]:', msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text);
      errors.push(msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text);
    }
  });

  const createRes = await send('Target.createTarget', { url: 'http://localhost:5173/vehicles' });
  const targetId = createRes.result.targetId;
  const attachRes = await send('Target.attachToTarget', { targetId, flatten: true });
  const sessionId = attachRes.result.sessionId;

  const sendTarget = (method, params = {}) => new Promise((resolve) => {
    const id = msgId++;
    callbacks.set(id, resolve);
    ws.send(JSON.stringify({ id, sessionId, method, params }));
  });

  await sendTarget('Runtime.enable');
  await sendTarget('Page.enable');

  console.log('\n--- 1. Testing /vehicles initial empty state ---');
  await sendTarget('Page.navigate', { url: 'http://localhost:5173/vehicles' });
  await new Promise(r => setTimeout(r, 1500));

  let dom = (await sendTarget('Runtime.evaluate', {
    expression: 'document.getElementById("root").innerHTML'
  })).result.result.value;

  console.log('Contains Search Vehicle label:', dom.includes('Search Vehicle'));
  console.log('Contains Empty State guidance:', dom.includes('NETRA Vehicle Intelligence Search'));
  console.log('Contains Monitored Vehicle Fleet table:', dom.includes('Monitored Vehicle Fleet'));

  console.log('\n--- 2. Testing search for existing vehicle "MH 01 AV 1234" ---');
  await sendTarget('Runtime.evaluate', {
    expression: `
      const input = document.getElementById("vehicle-plate-search");
      input.value = "MH 01 AV 1234";
      input.dispatchEvent(new Event('input', { bubbles: true }));
      const form = input.closest('form');
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    `
  });
  await new Promise(r => setTimeout(r, 1000));

  dom = (await sendTarget('Runtime.evaluate', {
    expression: 'document.getElementById("root").innerHTML'
  })).result.result.value;

  console.log('Found License Plate "MH 01 AV 1234":', dom.includes('MH 01 AV 1234'));
  console.log('Found "View Trajectory" button:', dom.includes('View Trajectory'));
  console.log('Found "First Seen":', dom.includes('First Seen'));
  console.log('Found "Last Seen":', dom.includes('Last Seen'));
  console.log('Found "Cameras Detected":', dom.includes('Cameras Detected'));
  console.log('Found "Last Known Location":', dom.includes('Last Known Location'));
  console.log('Found Location Coords "19.0270° N":', dom.includes('19.0270° N'));

  console.log('\n--- 3. Testing case-insensitive search with no spaces "mh04bt9876" (flagged vehicle) ---');
  await sendTarget('Runtime.evaluate', {
    expression: `
      const input = document.getElementById("vehicle-plate-search");
      input.value = "mh04bt9876";
      input.dispatchEvent(new Event('input', { bubbles: true }));
      const form = input.closest('form');
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    `
  });
  await new Promise(r => setTimeout(r, 1000));

  dom = (await sendTarget('Runtime.evaluate', {
    expression: 'document.getElementById("root").innerHTML'
  })).result.result.value;

  console.log('Found Flagged vehicle "MH 04 BT 9876":', dom.includes('MH 04 BT 9876'));
  console.log('Found Flag Reason "Suspected stolen vehicle":', dom.includes('Suspected stolen vehicle'));
  console.log('Found "View Trajectory" button:', dom.includes('View Trajectory'));

  console.log('\n--- 4. Testing search for unknown vehicle "KA 05 XY 9999" ---');
  await sendTarget('Runtime.evaluate', {
    expression: `
      const input = document.getElementById("vehicle-plate-search");
      input.value = "KA 05 XY 9999";
      input.dispatchEvent(new Event('input', { bubbles: true }));
      const form = input.closest('form');
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    `
  });
  await new Promise(r => setTimeout(r, 1000));

  dom = (await sendTarget('Runtime.evaluate', {
    expression: 'document.getElementById("root").innerHTML'
  })).result.result.value;

  console.log('Found "Vehicle Not Found" message:', dom.includes('Vehicle Not Found'));
  console.log('Found query reflection "KA 05 XY 9999":', dom.includes('KA 05 XY 9999'));
  console.log('Found search tips:', dom.includes('Search Tips'));

  console.log('\n--- 5. Testing other pages for regressions ---');
  for (const page of ['/login', '/signup', '/dashboard', '/map', '/alerts', '/analytics']) {
    await sendTarget('Page.navigate', { url: `http://localhost:5173${page}` });
    await new Promise(r => setTimeout(r, 1000));
    const len = (await sendTarget('Runtime.evaluate', { expression: 'document.getElementById("root").innerHTML.length' })).result.result.value;
    console.log(`Page ${page} DOM length: ${len} (${len > 0 ? 'OK' : 'EMPTY'})`);
  }

  ws.close();
  proc.kill();

  if (errors.length === 0) {
    console.log('\n🎉 ALL VEHICLE SEARCH CHECKS PASSED WITH ZERO ERRORS!');
  } else {
    console.error('\n❌ ERRORS DETECTED:', errors);
  }
}

run().catch(console.error);
