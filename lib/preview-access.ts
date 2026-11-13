export function allowPreview(mode: string | undefined, host: string | null, forwarded: boolean) {
  return mode === 'development' && !forwarded && !!host && /^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/.test(host);
}
