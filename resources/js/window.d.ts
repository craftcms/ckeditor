/**
 * The control panel globals the CKEditor UI controls use.
 */
export {};

declare global {
  interface Window {
    Cp: any;
    Craft: any;
    CKE_LOCALIZED_REF_HANDLES: string[];
    codeEditorBaseAssetsUrl?: string;
    makeMonacoEditor: (...args: any[]) => void;
    monaco?: any;
    monacoEditorInstances?: Record<string, any>;
  }

  const Craft: any;
}
