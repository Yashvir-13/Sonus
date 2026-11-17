/** Public API base URL for browser fetch helpers. */
export function apiBaseUrl(): string {
  const value =
    import.meta.env.VITE_API_BASE_URL ||
    (import.meta.env.DEV ? 'http://127.0.0.1:8000' : '')
  return value.replace(/\/$/, '')
}
