# TypeScript (`apps/web`)

Activation: files under `apps/web/**/*.{ts,tsx}`

## Layout

- `api/` — typed HTTP helpers (not `services/`)
- `components/` — kebab-case; auth under `components/auth/`
- `hooks/`, `lib/`, `stat/`, `styles/`, `types/`
- Entry: `main.tsx` (ClerkProvider), `app.tsx` (signed-in UI)
- Styles: `styles/index.css` from `main.tsx`, `styles/app.css` from `app.tsx`

## Types

- Strict TS; no implicit `any`
- Prefer `type` for props/DTOs; `import type` for type-only imports
- Extend `src/vite-env.d.ts` when adding `VITE_*` keys
- Alias `@/` → `src/`

## Clerk & App Shell

```tsx
const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
const hasValidClerkKey = Boolean(
  publishableKey &&
  publishableKey !== '<YOUR_CLERK_PUBLISHABLE_KEY>' &&
  import.meta.env.VITE_DEV_OFFLINE !== 'true'
)

function ClerkConnectedApp() {
  const { isLoaded, isSignedIn } = useAuth()
  return (
    <>
      <ClerkTokenBridge />
      <App
        defaultSignedIn={Boolean(isLoaded && isSignedIn)}
        userButtonSlot={isLoaded && isSignedIn ? <UserButton /> : undefined}
      />
    </>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {!hasValidClerkKey ? (
      <DevOfflineShell>
        <App defaultSignedIn={false} />
      </DevOfflineShell>
    ) : (
      <ClerkErrorBoundary fallback={<App defaultSignedIn={false} />}>
        <ClerkProvider publishableKey={publishableKey}>
          <ClerkConnectedApp />
        </ClerkProvider>
      </ClerkErrorBoundary>
    )}
  </StrictMode>,
)
```

Never gate the root React DOM tree behind `<Show when="signed-in">` / `<Show when="signed-out">`. The root `<App />` shell must render immediately in guest mode (`defaultSignedIn={false}`) wrapped in `ClerkErrorBoundary` so DNS propagation or adblockers never render a blank screen. Auth state must bind asynchronously via `useAuth()`.

## API calls

```ts
export async function fetchMe(token: string): Promise<UserDto> {
  const res = await fetch(`${apiBaseUrl()}/api/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`GET /api/me failed: ${res.status}`)
  return res.json() as Promise<UserDto>
}
```

Never hard-code `http://localhost:8000` in components.
