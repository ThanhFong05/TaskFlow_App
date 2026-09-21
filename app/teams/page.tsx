import Link from "next/link";

export default function Teams() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-6">
      <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
      </div>
      <h1 className="text-4xl font-extrabold text-gray-900">Teams</h1>
      <p className="text-xl text-gray-500 max-w-lg">
        The team management feature is coming soon in Assignment 2. Stay tuned!
      </p>
      <Link href="/">
        <button className="bg-white border border-gray-300 text-gray-700 px-6 py-2 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors">
          Go Back Home
        </button>
      </Link>
    </div>
  );
}
