import { useEffect } from 'react'
import { useAuth, useUser } from '@clerk/react'
import { setAuthTokenProvider, setClerkAuthActive, setClerkUserMetadata } from '@/api/sessions'

/**
 * Bridges Clerk's React auth context into the fetch client so every API call
 * attaches the live Clerk JWT instead of falling back to dev_token.
 * Must only be mounted inside <ClerkProvider>.
 */
export function ClerkTokenBridge(): null {
  const { getToken, isSignedIn } = useAuth()
  const { user } = useUser()

  useEffect(() => {
    setClerkAuthActive(Boolean(isSignedIn))
    setAuthTokenProvider(async () => {
      try {
        return await getToken()
      } catch {
        return null
      }
    })
    return () => {
      setClerkAuthActive(false)
      setAuthTokenProvider(null)
    }
  }, [getToken, isSignedIn])

  useEffect(() => {
    if (user) {
      const email = user.primaryEmailAddress?.emailAddress ?? user.emailAddresses?.[0]?.emailAddress ?? null
      const fullName = user.fullName || [user.firstName, user.lastName].filter(Boolean).join(' ') || null
      const rawUsername = user.username || (email ? email.split('@')[0] : null)
      setClerkUserMetadata({
        name: fullName,
        username: rawUsername,
        email,
      })
    } else {
      setClerkUserMetadata(null)
    }
  }, [user])

  return null
}
