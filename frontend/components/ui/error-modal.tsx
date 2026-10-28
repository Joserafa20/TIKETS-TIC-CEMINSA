'use client';

import { useErrorStore } from '@/store/error.store';

export function ErrorModal() {
  const { error, clear } = useErrorStore();

  if (!error) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-red-50 border-b border-red-100 px-6 py-4 flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-xl">
            ⚠️
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-red-800 text-base leading-snug">
              {error.title}
            </h2>
            {error.code && (
              <span className="inline-block mt-0.5 text-xs font-mono text-red-400">
                Error {error.code}
              </span>
            )}
          </div>
          <button
            onClick={clear}
            className="flex-shrink-0 text-red-300 hover:text-red-500 transition text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <p className="text-slate-600 text-sm leading-relaxed">{error.message}</p>

          {error.solution && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
              <p className="text-xs font-semibold text-blue-700 mb-1">💡 Qué podés hacer</p>
              <p className="text-sm text-blue-600 leading-relaxed">{error.solution}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5">
          <button
            onClick={clear}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-xl transition"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
