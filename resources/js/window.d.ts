/**
 * The control panel globals the CKEditor UI controls use.
 */
export {};

declare global {
  interface Window {
    Cp: any;
    CKE_LOCALIZED_REF_HANDLES: string[];
    CKE_SHOW_INSPECTOR: boolean;
    CKE_REV_ASSET_URLS: boolean;
    codeEditorBaseAssetsUrl?: string;
    makeMonacoEditor: (...args: any[]) => void;
    monaco?: any;
    monacoEditorInstances?: Record<string, any>;
  }
}
