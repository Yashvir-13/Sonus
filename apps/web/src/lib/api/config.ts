/** Public API base URL for browser fetch helpers. */
export function apiBaseUrl(): string {
  const value =
    import.meta.env.VITE_API_BASE_URL ||
    (import.meta.env.DEV ? 'http://127.0.0.1:8000' : '')
  if (!value) {
    throw new Error(
      'Missing VITE_API_BASE_URL. Copy apps/web/.env.example to apps/web/.env.',
    )
  }
  return value.replace(/\/$/, '')
}
