/**
 * 通过 CDP 截图（手机视口）。用法：node tools/shot.mjs <url> <out.png> [宽] [高] [等待毫秒] [点击序列]
 * 依赖已启动的 Chrome：--remote-debugging-port=9222
 */

const [, , url, out, w = '390', h = '844', waitMs = '4000'] = process.argv;

const version = await (await fetch('http://127.0.0.1:9222/json/version')).json();
const ws = new WebSocket(version.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();

function send(method, params = {}, sessionId) {
  return new Promise((resolve, reject) => {
    const msgId = ++id;
    pending.set(msgId, { resolve, reject });
    ws.send(JSON.stringify({ id: msgId, method, params, sessionId }));
  });
}

let sessionId = null;

ws.addEventListener('message', (event) => {
  const data = JSON.parse(event.data);
  if (data.id && pending.has(data.id)) {
    const { resolve, reject } = pending.get(data.id);
    pending.delete(data.id);
    data.error ? reject(new Error(JSON.stringify(data.error))) : resolve(data.result);
  }
});

await new Promise((r) => ws.addEventListener('open', r));

const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
const attached = await send('Target.attachToTarget', { targetId, flatten: true });
sessionId = attached.sessionId;

await send('Page.enable', {}, sessionId);
await send('Runtime.enable', {}, sessionId);
await send('Emulation.setDeviceMetricsOverride', {
  width: Number(w),
  height: Number(h),
  deviceScaleFactor: 2,
  mobile: true,
}, sessionId);
await send('Emulation.setUserAgentOverride', {
  userAgent:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
}, sessionId);

await send('Page.navigate', { url }, sessionId);
await new Promise((r) => setTimeout(r, Number(waitMs)));

const shot = await send('Page.captureScreenshot', { format: 'png' }, sessionId);
const { writeFileSync } = await import('node:fs');
writeFileSync(out, Buffer.from(shot.data, 'base64'));
console.log('saved', out);
await send('Target.closeTarget', { targetId });
ws.close();
