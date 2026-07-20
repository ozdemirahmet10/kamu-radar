export function DashboardPreviewMockup() {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm">
      <div className="flex items-center gap-1.5 pb-2">
        <span className="h-2 w-2 rounded-full bg-white/30" />
        <span className="h-2 w-2 rounded-full bg-white/30" />
        <span className="h-2 w-2 rounded-full bg-white/30" />
      </div>
      <div className="flex gap-2">
        <div className="w-1/4 space-y-1.5 rounded-lg bg-white/5 p-2">
          <div className="h-2 w-full rounded bg-white/20" />
          <div className="h-2 w-3/4 rounded bg-white/10" />
          <div className="h-2 w-3/4 rounded bg-white/10" />
          <div className="h-2 w-2/3 rounded bg-white/10" />
        </div>
        <div className="flex-1 space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <div className="h-10 rounded-lg bg-white/10" />
            <div className="h-10 rounded-lg bg-white/10" />
            <div className="h-10 rounded-lg bg-white/15" />
          </div>
          <div className="h-16 rounded-lg bg-white/10" />
          <div className="h-16 rounded-lg bg-white/5" />
        </div>
      </div>
    </div>
  );
}
