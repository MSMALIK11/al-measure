export default function Page() {
  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <div className="max-w-xl w-full text-center flex flex-col gap-4">
        <h1 className="text-2xl font-semibold text-pretty">Landscape Measurements</h1>
        <p className="text-sm text-muted-foreground">Choose a workspace to begin.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a
            href="/client"
            className="rounded-md border p-6 hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <div className="font-medium mb-1">Client Dashboard</div>
            <div className="text-xs text-muted-foreground">Draw areas and submit requests.</div>
          </a>
          <a
            href="/admin"
            className="rounded-md border p-6 hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <div className="font-medium mb-1">Admin Dashboard</div>
            <div className="text-xs text-muted-foreground">Review and process tasks.</div>
          </a>
        </div>
      </div>
    </main>
  )
}
