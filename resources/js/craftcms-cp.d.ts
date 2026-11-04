/**
 * The control panel utilities the TypeScript bundle imports through the import
 * map, declared here because the control panel isn’t an npm dependency.
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
