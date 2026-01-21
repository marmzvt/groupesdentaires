'use client';

import { motion } from 'framer-motion';
import { Option } from '@/lib/questions';

interface SingleChoiceProps {
  options: Option[];
  value: string | number | undefined;
  onChange: (value: string | number) => void;
  onAutoAdvance?: () => void;
}

export default function SingleChoice({
  options,
  value,
  onChange,
  onAutoAdvance,
}: SingleChoiceProps) {
  const handleSelect = (optionValue: string | number) => {
    onChange(optionValue);
    // Auto-advance after a short delay for single choice
    if (onAutoAdvance) {
      setTimeout(() => {
        onAutoAdvance();
      }, 300);
    }
  };

  return (
    <div className="space-y-3">
      {options.map((option, index) => (
        <motion.button
          key={option.value}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          onClick={() => handleSelect(option.value)}
          className={`w-full p-4 text-left rounded-xl border-2 transition-all touch-feedback
            ${value === option.value
              ? 'border-primary-500 bg-primary-50 text-primary-700'
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
        >
          <div className="flex items-center gap-4">
            <div
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors
                ${value === option.value
                  ? 'border-primary-500 bg-primary-500'
                  : 'border-gray-300'
                }`}
            >
              {value === option.value && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-2 h-2 bg-white rounded-full"
                />
              )}
            </div>
            <span className="font-medium">{option.label}</span>
          </div>
        </motion.button>
      ))}
    </div>
  );
}
