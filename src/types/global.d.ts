// Minimal ambient declarations to satisfy TS language server
declare module 'vite/client' {
  interface ImportMetaEnv {
    readonly VITE_API_BASE_URL?: string;
    readonly VITE_API_KEY?: string;
  }
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

declare module 'react' {
  const React: any;
  export default React;
  export type ReactNode = any;
  export type FC<P = {}> = any;
}

declare module 'react/jsx-runtime' {
  export function jsx(...args: any[]): any;
  export function jsxs(...args: any[]): any;
  export const Fragment: any;
}

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

export {};
