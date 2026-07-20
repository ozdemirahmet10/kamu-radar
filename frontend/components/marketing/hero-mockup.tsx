export function HeroMockup() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl shadow-brand-900/10">
      <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2">
        <span className="h-2.5 w-2.5 rounded-full bg-danger-100" />
        <span className="h-2.5 w-2.5 rounded-full bg-warning-100" />
        <span className="h-2.5 w-2.5 rounded-full bg-success-100" />
      </div>
      <div className="mt-3 flex gap-3">
        <div className="w-1/5 space-y-2 rounded-lg bg-slate-50 p-2">
          <div className="h-2 w-3/4 rounded bg-brand-200" />
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-2 w-full rounded bg-slate-200" />
          ))}
        </div>
        <div className="flex-1 space-y-3">
          <div className="h-4 w-2/3 rounded bg-slate-200" />
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-12 rounded-lg bg-slate-100" />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2 h-24 rounded-lg bg-slate-50" />
            <div className="h-24 rounded-lg bg-success-50" />
          </div>
        </div>
      </div>
    </div>
  );
}
