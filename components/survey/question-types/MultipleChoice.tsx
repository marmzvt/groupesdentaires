'use client';

import { motion } from 'framer-motion';
import { Option } from '@/lib/questions';

interface MultipleChoiceProps {
  options: Option[];
  value: (string | number)[] | undefined;
  onChange: (value: (string | number)[]) => void;
  questionId?: string;
  hasExclusiveOption?: boolean;
}

export default function MultipleChoice({
  options,
  value = [],
  onChange,
  questionId,
  hasExclusiveOption = false,
}: MultipleChoiceProps) {
  const handleToggle = (optionValue: string | number) => {
    const option = options.find(o => o.value === optionValue);

    // Handle exclusive option (e.g., "C'est ma première expérience professionnelle")
    if (option?.exclusive) {
      // If selecting an exclusive option, clear all others and select only this one
      onChange([optionValue]);
      return;
    }

    // If selecting a non-exclusive option, remove any exclusive options first
    const nonExclusiveValues = value.filter(v => {
      const opt = options.find(o => o.value === v);
      return !opt?.exclusive;
    });

    // Toggle the selected option
    if (nonExclusiveValues.includes(optionValue)) {
      onChange(nonExclusiveValues.filter(v => v !== optionValue));
    } else {
      onChange([...nonExclusiveValues, optionValue]);
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
          onClick={() => handleToggle(option.value)}
          className={`w-full p-4 text-left rounded-xl border-2 transition-all touch-feedback
            ${value.includes(option.value)
              ? 'border-primary-500 bg-primary-50 text-primary-700'
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
        >
          <div className="flex items-center gap-4">
            <div
              className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors
                ${value.includes(option.value)
                  ? 'border-primary-500 bg-primary-500'
                  : 'border-gray-300'
                }`}
            >
              {value.includes(option.value) && (
                <motion.svg
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </motion.svg>
              )}
            </div>
            <span className="font-medium">{option.label}</span>
          </div>
        </motion.button>
      ))}
    </div>
  );
}
