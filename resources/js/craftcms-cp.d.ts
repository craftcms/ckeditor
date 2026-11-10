/**
 * The control panel utilities the TypeScript bundle imports through the import
 * map, declared here because the control panel isn’t an npm dependency.
 *
 * Keep in sync with `cpSharedModuleExports` in `vite.config.mts`: a name
 * declared here but missing there is `undefined` under the dev server.
 */
declare module '@craftcms/cp' {
  export function t(
    message: string,
    params?: Record<string, unknown>,
    category?: string,
  ): string;

  export const actionClient: {
    post<T = any>(
      url: string,
      data?: unknown,
      config?: Record<string, any>,
    ): Promise<{data: T}>;
  };
}
