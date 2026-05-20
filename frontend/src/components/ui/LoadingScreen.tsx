import { Brain } from 'lucide-react';

export default function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-nuit-900">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emeraude-400 to-emeraude-600 flex items-center justify-center animate-pulse">
          <Brain className="w-6 h-6 text-white" />
        </div>
        <div className="flex gap-1">
          <div className="w-2 h-2 rounded-full bg-emeraude-500 animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 rounded-full bg-emeraude-400 animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 rounded-full bg-emeraude-300 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}
