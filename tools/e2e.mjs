/**
 * 通过 CDP 驱动页面交互并截图。
 * 用法：node tools/e2e.mjs
 * 前置：Chrome 以 --remote-debugging-port=9222 启动，Expo web 在 8081，后端在 8000。
 */

import { writeFileSync } from 'node:fs';

const BASE = 'http://localhost:8081';
const OUT = '/tmp';

const version = await (await fetch('http://127.0.0.1:9222/json/version')).json();
const ws = new WebSocket(version.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
let sessionId = null;

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const msgId = ++id;
    pending.set(msgId, { resolve, reject });
    const msg = { id: msgId, method, params };
    if (sessionId) msg.sessionId = sessionId;
    ws.send(JSON.stringify(msg));
  });
}

ws.addEventListener('message', (event) => {
  const data = JSON.parse(event.data);
  if (data.id && pending.has(data.id)) {
    const { resolve, reject } = pending.get(data.id);
    pending.delete(data.id);
    data.error ? reject(new Error(JSON.stringify(data.error))) : resolve(data.result);
  }
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function evaluate(expression, awaitPromise = false) {
  const result = await send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise,
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.exception?.description ?? 'eval failed');
  }
  return result.result.value;
}

async function shot(name) {
  const data = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(`${OUT}/${name}.png`, Buffer.from(data.data, 'base64'));
  console.log('shot', name);
}

async function clickText(text) {
  const ok = await evaluate(`(() => {
    const nodes = [...document.querySelectorAll('[role="button"],[role="tab"],[role="checkbox"],[role="radio"],button,a')];
    const target = nodes.find((n) => (n.innerText || n.textContent || '').trim().includes(${JSON.stringify(text)}));
    if (!target) return false;
    target.scrollIntoView({ block: 'center' });
    target.click();
    return true;
  })()`);
  if (!ok) throw new Error(`找不到可点击元素：${text}`);
  await sleep(700);
}

async function clickSelector(selector) {
  const ok = await evaluate(`(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) return false;
    el.scrollIntoView({ block: 'center' });
    el.click();
    return true;
  })()`);
  if (!ok) throw new Error(`找不到元素：${selector}`);
  await sleep(700);
}

async function typeInto(labelText, value) {
  const ok = await evaluate(`(() => {
    const inputs = [...document.querySelectorAll('input,textarea')];
    const withLabel = inputs.filter((i) => (i.getAttribute('aria-label') || '').includes(${JSON.stringify(labelText)}));
    const target = withLabel[0] || inputs[${JSON.stringify(labelText)} === '手机号' ? 0 : 1];
    if (!target) return false;
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(target, ${JSON.stringify(value)});
    target.dispatchEvent(new Event('input', { bubbles: true }));
    target.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  })()`);
  if (!ok) throw new Error(`找不到输入框：${labelText}`);
  await sleep(300);
}

async function main() {
  await new Promise((resolve) => ws.addEventListener('open', resolve));
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const attached = await send('Target.attachToTarget', { targetId, flatten: true });
  sessionId = attached.sessionId;
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Network.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true,
  });

  const errors = [];
  ws.addEventListener('message', (event) => {
    const data = JSON.parse(event.data);
    if (data.method === 'Runtime.exceptionThrown') {
      errors.push(data.params.exceptionDetails.text);
    }
    if (data.method === 'Runtime.consoleAPICalled' && data.params.type === 'error') {
      errors.push(data.params.args.map((a) => a.value ?? a.description).join(' '));
    }
  });

  await send('Page.navigate', { url: BASE });
  await sleep(9000);
  await shot('e2e-01-login');

  await evaluate('localStorage.clear()');
  await send('Page.reload');
  await sleep(7000);

  await clickText('我已阅读并同意');
  await typeInto('手机号', '13900001111');
  await clickText('获取验证码');
  await sleep(1200);
  await shot('e2e-02-code-sent');

  await typeInto('验证码', '123456');
  await sleep(300);
  await shot('e2e-03-filled');

  await clickText('登录');
  await sleep(4000);
  await shot('e2e-04-after-login');

  const path = await evaluate('location.pathname');
  console.log('path after login:', path);

  for (const [name, testId] of [
    ['e2e-05-tryon', 'tab-tryon'],
    ['e2e-06-stylist', 'tab-stylist'],
    ['e2e-07-profile', 'tab-profile'],
  ]) {
    await clickSelector(`[data-testid="${testId}"]`);
    await sleep(1500);
    await shot(name);
  }

  await clickText('外观');
  await sleep(1500);
  await shot('e2e-08-appearance-plain');

  await clickText('玫瑰');
  await sleep(1200);
  await shot('e2e-09-appearance-rose');

  await evaluate('window.history.back()');
  await sleep(1500);
  await shot('e2e-10-profile-rose');

  await clickSelector('[data-testid="tab-wardrobe"]');
  await sleep(1500);
  await shot('e2e-11-wardrobe-rose');

  console.log('errors:', errors.length ? errors : 'none');
  await send('Target.closeTarget', { targetId });
  ws.close();
}

await main();
