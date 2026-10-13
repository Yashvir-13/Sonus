export default function App() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-10">
      <div className="space-y-2">
        <p className="font-brand text-sm font-bold tracking-[0.05em] text-muted-foreground">
          Sonus
        </p>
        <h1 className="font-display text-4xl font-light tracking-tight text-foreground md:text-5xl">
          Adaptive Music Practice
        </h1>
        <p className="max-w-xl text-base text-muted-foreground">
          Real-time intonation analysis and adaptive rehearsal system for monophonic instruments.
        </p>
      </div>

      <div className="rounded-[20px] border border-border bg-card p-6 text-card-foreground shadow-none">
        <p className="text-sm text-muted-foreground">
          Clean blueprint foundation ready for feature development.
        </p>
      </div>
    </main>
  )
}
