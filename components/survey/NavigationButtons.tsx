'use client';

import { motion } from 'framer-motion';

interface NavigationButtonsProps {
  onPrevious: () => void;
  onNext: () => void;
  canGoBack: boolean;
  canGoNext: boolean;
  isLastQuestion: boolean;
  isSubmitting?: boolean;
}

export default function NavigationButtons({
  onPrevious,
  onNext,
  canGoBack,
  canGoNext,
  isLastQuestion,
  isSubmitting,
}: NavigationButtonsProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-lg border-t border-gray-100 z-40">
      <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
        <motion.button
          whileHover={{ scale: canGoBack ? 1.02 : 1 }}
          whileTap={{ scale: canGoBack ? 0.98 : 1 }}
          onClick={onPrevious}
          disabled={!canGoBack}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all
            ${canGoBack
              ? 'text-gray-700 hover:bg-gray-100 active:bg-gray-200'
              : 'text-gray-300 cursor-not-allowed'
            }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="hidden sm:inline">Précédent</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: canGoNext ? 1.02 : 1 }}
          whileTap={{ scale: canGoNext ? 0.98 : 1 }}
          onClick={onNext}
          disabled={!canGoNext || isSubmitting}
          className={`flex items-center gap-2 px-8 py-3 rounded-xl font-semibold transition-all
            ${canGoNext
              ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30 hover:bg-primary-600'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Envoi...</span>
            </>
          ) : (
            <>
              <span>{isLastQuestion ? 'Terminer' : 'Suivant'}</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </>
          )}
        </motion.button>
      </div>

      <div className="max-w-2xl mx-auto mt-2 text-center text-xs text-gray-400">
        <span className="hidden sm:inline">Utilisez les touches </span>
        <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 font-mono">←</kbd>
        <span className="hidden sm:inline"> et </span>
        <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 font-mono">→</kbd>
        <span className="hidden sm:inline"> pour naviguer</span>
      </div>
    </div>
  );
}
