// Measures how much one DOM insertion costs on an open control panel page, the
// way https://github.com/craftcms/ckeditor/issues/673 was measured.
//
// Usage:
//   node measure-insertion.mjs <cdp-browser-ws-url> <page-url-substring> [--block] [--inject <css | @file>]...
//
// For each --inject (or once without one), it reloads the page with the cache
// disabled, optionally blocks CKEditor's CSS at the network level, injects the
// CSS, waits for transitions to finish, then reports the number of elements
// Chromium restyled for one inserted <div> (UpdateLayoutTree elementCount) and
// the median time of append + getComputedStyle.
//
// Always reload: once a rule has matched, disabling or removing it keeps its
// cost, so toggling rules on a loaded page gives wrong numbers.

import {readFileSync} from 'node:fs';

const args = process.argv.slice(2);
const [browserWs, urlPart] = args;
if (!browserWs || !urlPart) {
  console.error(
    'Usage: node measure-insertion.mjs <cdp-browser-ws-url> <page-url-substring> [--block] [--inject <css | @file>]...',
  );
  process.exit(1);
}
const block = args.includes('--block');
const injects = args
  .flatMap((arg, i) => (arg === '--inject' ? [args[i + 1]] : []))
  .map((css) =>
    css.startsWith('@') ? readFileSync(css.slice(1), 'utf8') : css,
  );
if (!injects.length) {
  injects.push('');
}

const listUrl = browserWs
  .replace('ws://', 'http://')
  .replace(/\/devtools\/browser\/.*/, '/json');
const page = (await (await fetch(listUrl)).json()).find(
  (t) => t.type === 'page' && t.url.includes(urlPart),
);
if (!page) {
  console.error(`No open page has a URL containing ${urlPart}`);
  process.exit(1);
}

const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve) => (ws.onopen = resolve));
let id = 0;
const pending = new Map();
let events = [];
let traceDone;
let loaded;
ws.onmessage = (message) => {
  const data = JSON.parse(message.data);
  if (data.id && pending.has(data.id)) {
    pending.get(data.id)(data);
    pending.delete(data.id);
  } else if (data.method === 'Tracing.dataCollected') {
    events.push(...data.params.value);
  } else if (data.method === 'Tracing.tracingComplete') {
    traceDone();
  } else if (data.method === 'Page.loadEventFired') {
    loaded?.();
  }
};
const send = (method, params = {}) =>
  new Promise((resolve) => {
    const i = ++id;
    pending.set(i, resolve);
    ws.send(JSON.stringify({id: i, method, params}));
  });
const evaluate = async (expression) =>
  (
    await send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    })
  ).result?.result?.value;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const insert = `const d = document.createElement('div'); document.querySelector('main').appendChild(d); getComputedStyle(d).color; d.remove(); document.body.offsetHeight;`;

await send('Page.enable');
await send('Network.enable');
await send('Network.setCacheDisabled', {cacheDisabled: true});
await send('Network.setBlockedURLs', {
  urls: block ? ['*/vendor/craftcms/ckeditor/ckeditor/*.css'] : [],
});

for (const css of injects) {
  const load = new Promise((resolve) => (loaded = resolve));
  await send('Page.reload', {ignoreCache: true});
  await load;
  // let the editors initialize
  await sleep(4000);

  await evaluate(`(() => {
    const style = document.head.appendChild(document.createElement('style'));
    style.textContent = ${JSON.stringify(css)};
    for (let i = 0; i < 2; i++) { ${insert} }
  })()`);
  // let injected transitions finish, or they inflate the count
  await sleep(1500);

  events = [];
  await send('Tracing.start', {
    traceConfig: {includedCategories: ['devtools.timeline']},
  });
  await evaluate(`(() => { ${insert} })()`);
  const done = new Promise((resolve) => (traceDone = resolve));
  await send('Tracing.end');
  await done;
  const restyled = Math.max(
    0,
    ...events
      .filter((e) => e.name === 'UpdateLayoutTree')
      .map((e) => e.args?.elementCount ?? 0),
  );

  const ms = await evaluate(`(() => {
    const runs = [];
    for (let r = 0; r < 5; r++) {
      const t = [];
      for (let i = 0; i < 15; i++) {
        const s = performance.now();
        const d = document.createElement('div');
        document.querySelector('main').appendChild(d);
        getComputedStyle(d).color;
        t.push(performance.now() - s);
        d.remove();
        getComputedStyle(document.body).color;
      }
      t.sort((a, b) => a - b);
      runs.push(t[7]);
    }
    runs.sort((a, b) => a - b);
    return runs[2].toFixed(2);
  })()`);

  const label = css
    ? css.replace(/\s+/g, ' ').slice(0, 100)
    : '(nothing injected)';
  console.log(
    `${String(restyled).padStart(5)} restyled  ${ms.padStart(6)} ms  ${label}`,
  );
}

await send('Network.setBlockedURLs', {urls: []});
ws.close();
