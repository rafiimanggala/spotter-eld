export default function Header() {
  return (
    <header className="bg-blue-900 text-white py-4 px-6 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center gap-3">
        <svg
          className="w-10 h-10 text-blue-200 shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25m-2.25 0h-2.25m0 0V5.625c0-.621-.504-1.125-1.125-1.125H4.875c-.621 0-1.125.504-1.125 1.125v12.5m7.5-14.25h4.875c.621 0 1.125.504 1.125 1.125v3.026"
          />
        </svg>
        <div>
          <h1 className="text-xl font-bold leading-tight">
            Spotter ELD Trip Planner
          </h1>
          <p className="text-blue-200 text-sm">
            FMCSA HOS Compliant Route & Log Generator
          </p>
        </div>
      </div>
    </header>
  )
}
