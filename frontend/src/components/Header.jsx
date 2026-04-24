export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-white/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm shadow-blue-600/25">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25m-2.25 0h-2.25m0 0V5.625c0-.621-.504-1.125-1.125-1.125H4.875c-.621 0-1.125.504-1.125 1.125v12.5m7.5-14.25h4.875c.621 0 1.125.504 1.125 1.125v3.026" />
            </svg>
          </div>
          <span className="text-[15px] font-semibold text-stone-900 tracking-tight">Spotter ELD</span>
          <span className="text-stone-200">|</span>
          <span className="text-[13px] text-stone-400 font-medium">Trip Planner</span>
        </div>
        <span className="text-[10px] text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full font-semibold tracking-wide uppercase">
          FMCSA Compliant
        </span>
      </div>
    </header>
  )
}
