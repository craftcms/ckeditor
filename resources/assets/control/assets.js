/**
 * Shared asset-loading helpers for the CKEditor UI controls.
 */
const loadedAssets = new Map();

function loadOnce(key, factory) {
  if (!loadedAssets.has(key)) {
    loadedAssets.set(key, factory());
  }
  return loadedAssets.get(key);
}

export function loadStyle(url) {
  return loadOnce(`css:${url}`, () => {
    if (
      document.querySelector(
        `link[rel="stylesheet"][href="${CSS.escape(url)}"]`,
      )
    ) {
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      link.onload = link.onerror = () => resolve();
      document.head.appendChild(link);
    });
  });
}

export function loadScript(url, type = null) {
  return loadOnce(`js:${url}`, () => {
    if (document.querySelector(`script[src="${CSS.escape(url)}"]`)) {
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      if (type) {
        script.type = type;
      }
      script.src = url;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Couldn’t load ${url}`));
      document.head.appendChild(script);
    });
  });
}

export function applyGlobals(globals) {
  window.CKE_LOCALIZED_REF_HANDLES = globals.localizedRefHandles ?? [];
  window.Craft = window.Craft || {};
  window.Craft.showCkeditorInspector = !!globals.showInspector;
  window.Craft.revAssetUrls = !!globals.revAssetUrls;
}

export async function importModule(source) {
  const url = URL.createObjectURL(
    new Blob([source], {type: 'text/javascript'}),
  );
  try {
    return await import(/* @vite-ignore */ url);
  } finally {
    URL.revokeObjectURL(url);
  }
}
