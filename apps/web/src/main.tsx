import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider, SignedIn, SignedOut } from '@clerk/react'
import App from './app.tsx'
import './styles/index.css'

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!publishableKey) {
  throw new Error('Missing Publishable Key')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider publishableKey={publishableKey}>
      <SignedOut>
        <div className="min-h-screen flex items-center justify-center p-8">
          <div className="text-center space-y-4 max-w-md w-full bg-white p-8 rounded-xl shadow border">
            <h1 className="text-2xl font-bold">Please Sign In</h1>
            <p className="text-gray-500">The frontend has been reset. Authenticate to proceed.</p>
          </div>
        </div>
      </SignedOut>
      <SignedIn>
        <App />
      </SignedIn>
    </ClerkProvider>
  </StrictMode>
)
