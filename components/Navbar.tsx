import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="bg-slate-950/60 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/20 flex items-center justify-center mr-3 group-hover:scale-105 group-hover:shadow-indigo-500/40 transition-all duration-300">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
              </div>
              <span className="text-2xl font-black tracking-tight text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-indigo-400 group-hover:to-violet-400 transition-all duration-300">TaskFlow</span>
            </Link>
            <div className="hidden sm:ml-10 sm:flex sm:space-x-8">
              <Link
                href="/"
                className="border-indigo-500 text-slate-100 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-semibold transition-colors"
              >
                Home
              </Link>
              <Link
                href="/teams"
                className="border-transparent text-slate-400 hover:border-slate-700 hover:text-slate-300 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors"
              >
                Teams
              </Link>
            </div>
          </div>
          <div className="flex items-center sm:ml-6">
            <button className="bg-white/10 text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-white/20 border border-white/5 shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 focus:ring-indigo-500 transition-all duration-300">
              Login
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
