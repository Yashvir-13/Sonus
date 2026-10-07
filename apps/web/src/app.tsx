import { LivePracticeView } from '@/components/live-practice-view'
import {
  SpatialProvider,
  SpatialContainer,
  FolioNavAnchors,
  CelestialCompass,
} from '@/components/spatial'
import {
  ComposerProfileScreen,
  PracticeHistoryScreen,
  DeviceSetupScreen,
} from '@/components/screens'

export interface AppProps {
  isGuest?: boolean
  onExitGuest?: () => void
}

function PracticeStandView({ isGuest, onExitGuest }: AppProps) {
  return (
    <div className="w-full h-full flex flex-col justify-between p-8 select-none">
      <header className="w-full flex justify-between items-baseline z-10 px-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif text-[#2C2A29] tracking-tight">
            Sonus
          </h1>
          <p className="font-mono text-xs text-[#7E7570] tracking-widest uppercase mt-1">
            Adaptive Practice System • Stand (0, 0)
          </p>
        </div>
        {isGuest && (
          <button
            onClick={onExitGuest}
            className="font-mono text-xs border border-[#2C2A29] px-3 py-1.5 hover:border-[#9A2A2A] hover:bg-[#E9E4DA] hover:text-[#9A2A2A] transition-colors shadow-none cursor-pointer"
            aria-label="Exit Guest Mode"
          >
            Exit Guest Mode
          </button>
        )}
      </header>

      <div className="flex-1 w-full flex items-center justify-center">
        <LivePracticeView />
      </div>
    </div>
  )
}

function AppCanvas({ isGuest, onExitGuest }: AppProps) {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-[#F4F1EA] text-[#2C2A29] select-none">
      <SpatialContainer
        practiceScreen={
          <PracticeStandView isGuest={isGuest} onExitGuest={onExitGuest} />
        }
        profileScreen={
          <ComposerProfileScreen isGuest={isGuest} onExitGuest={onExitGuest} />
        }
        historyScreen={<PracticeHistoryScreen />}
        tuningScreen={<DeviceSetupScreen />}
      />

      <FolioNavAnchors />
      <CelestialCompass />
    </div>
  )
}

export default function App(props: AppProps) {
  return (
    <SpatialProvider>
      <AppCanvas {...props} />
    </SpatialProvider>
  )
}
