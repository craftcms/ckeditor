/**
 * Shared asset-loading helpers for the CKEditor UI controls.
 */
export interface ControlAssets {
  styles?: string[];
  scripts?: string[];
  modules?: string[];
}

export interface EditorGlobals {
  localizedRefHandles?: string[];
  showInspector?: boolean;
  revAssetUrls?: boolean;
}

const loadedAssets = new Map<string, Promise<void>>();

function loadOnce(key: string, factory: () => Promise<void>): Promise<void> {
  if (!loadedAssets.has(key)) {
    loadedAssets.set(key, factory());
  }
  return loadedAssets.get(key)!;
}

export function loadStyle(url: string): Promise<void> {
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

export function loadScript(
  url: string,
  type: string | null = null,
): Promise<void> {
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

export function applyGlobals(globals: EditorGlobals): void {
  window.CKE_LOCALIZED_REF_HANDLES = globals.localizedRefHandles ?? [];
  window.Craft = window.Craft || {};
  window.Craft.showCkeditorInspector = !!globals.showInspector;
  window.Craft.revAssetUrls = !!globals.revAssetUrls;
}

/**
 * Imports a JavaScript module from its source.
 *
 * The field generates these modules, as they import the CKEditor packages registered at runtime,
 * and may include the field’s custom config JavaScript.
 */
export async function importModule(source: string): Promise<any> {
  const url = URL.createObjectURL(
    new Blob([source], {type: 'text/javascript'}),
  );
  try {
    return await import(/* @vite-ignore */ url);
  } finally {
    URL.revokeObjectURL(url);
  }
}
