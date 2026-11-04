/**
 * The control panel utilities the CKEditor bundles import through the import
 * map, declared here because the control panel isn’t an npm dependency.
 */
declare module '@craftcms/cp' {
  export function t(
    message: string,
    params?: Record<string, unknown>,
    category?: string,
  ): string;

  export function escapeHtml(str: unknown): string;

  export function getActionUrl(
    action: string,
    params?: Record<string, unknown> | string,
  ): string;

  export const actionClient: {
    request<T = any>(config: Record<string, any>): Promise<{data: T}>;
    get<T = any>(url: string, config?: Record<string, any>): Promise<{data: T}>;
    post<T = any>(
      url: string,
      data?: unknown,
      config?: Record<string, any>,
    ): Promise<{data: T}>;
  };

  export function appendHeadHtml(html: string): Promise<void>;
  export function appendBodyHtml(html: string): Promise<void>;
  export function appendElementHtml(
    element: Element,
    html: string,
  ): Promise<void>;

  export function showError(message: string): void;
  export function showSuccess(message: string): void;

  export function openSlideout(
    href: string,
    options?: Record<string, any>,
  ): Promise<any>;
  export function createElementEditor(
    elementType: string,
    element?: unknown,
    settings?: Record<string, any>,
  ): any;
  export function createElementSelectorModal(
    elementType: string,
    settings?: Record<string, any>,
  ): any;

  export function addActionsToChip(
    chip: Element | ArrayLike<Element>,
    actions: Record<string, any>[] | null | undefined,
    prepend?: boolean,
  ): void;
  export function loadElementThumbs(
    elements: Element | ArrayLike<Element>,
  ): void;
  export function openAssetImageEditor(
    assetId: number,
    onSave?: (data: any) => void,
  ): Promise<any>;

  export function cpConfig(): {get(key: string, fallback?: unknown): any};

  export class Uploader {
    constructor(element: HTMLElement, settings?: Record<string, any>);
    destroy(): void;
  }

  export const Uploads: Record<string, any>;
}
