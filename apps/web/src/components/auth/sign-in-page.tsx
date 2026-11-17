import { useMemo } from 'react'
import App, { type AppViewMode, parseRouteFromPath } from '@/app'
import { BUILTIN_FULL_SONGS } from '@/lib/music/song-catalog'

/**
 * Renders the full Sonus application in public/guest mode for signed-out visitors.
 * Features the unified persistent navigation header with direct Sign In triggers.
 */
export function SignInPage(): React.JSX.Element {
  const initialRoute = useMemo(() => {
    if (typeof window !== 'undefined' && window.location.pathname && window.location.pathname !== '/') {
      return parseRouteFromPath(window.location.pathname, BUILTIN_FULL_SONGS)
    }
    return { view: 'landing' as AppViewMode }
  }, [])

  return <App defaultSignedIn={false} initialView={initialRoute.view} />
}
