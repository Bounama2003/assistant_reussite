import { motion } from 'framer-motion';

export function TypingDots() {
  return (
    <div className="flex items-center gap-1 py-1">
      <span className="w-2 h-2 rounded-full bg-emeraude-400 animate-bounce" style={{ animationDelay: '0ms', animationDuration: '600ms' }} />
      <span className="w-2 h-2 rounded-full bg-emeraude-400 animate-bounce" style={{ animationDelay: '150ms', animationDuration: '600ms' }} />
      <span className="w-2 h-2 rounded-full bg-emeraude-400 animate-bounce" style={{ animationDelay: '300ms', animationDuration: '600ms' }} />
    </div>
  );
}

export function MessageSkeleton() {
  return (
    <div className="flex gap-2.5">
      <div className="w-8 h-8 rounded-full bg-nuit-700 shrink-0 skeleton" />
      <div className="flex-1 max-w-[78%]">
        <div className="glass-light rounded-2xl p-4 space-y-2.5">
          <div className="h-3 bg-nuit-600 rounded skeleton w-full" />
          <div className="h-3 bg-nuit-600 rounded skeleton w-[85%]" />
          <div className="h-3 bg-nuit-600 rounded skeleton w-[60%]" />
        </div>
      </div>
    </div>
  );
}

export function StreamingSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-2.5"
    >
      <div className="w-8 h-8 rounded-full bg-nuit-700 flex items-center justify-center shrink-0 self-start mt-1">
        <svg className="w-4 h-4 text-nuit-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
        </svg>
      </div>
      <div className="flex-1 max-w-[78%]">
        <div className="glass-light rounded-2xl p-4 md:p-5 space-y-3">
          <div className="h-3 bg-nuit-600/50 rounded skeleton w-full" />
          <div className="h-3 bg-nuit-600/50 rounded skeleton w-[90%]" />
          <div className="h-3 bg-nuit-600/50 rounded skeleton w-[75%]" />
          <div className="h-3 bg-nuit-600/50 rounded skeleton w-[45%]" />
          <div className="flex items-center gap-2 pt-1">
            <TypingDots />
            <span className="text-xs text-nuit-200 ml-1">Génération en cours...</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
