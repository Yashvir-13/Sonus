/** Public API base URL for browser fetch helpers. */
export function apiBaseUrl(): string {
  const value = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
  if (
    typeof window !== 'undefined' &&
    (window.location.hostname.endsWith('.run.app') || window.location.hostname.endsWith('.cloud.goog')) &&
    (value === 'http://127.0.0.1:8000' || value === 'http://localhost:8000')
  ) {
    return ''
  }
  return value
}
