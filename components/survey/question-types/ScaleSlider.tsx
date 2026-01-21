'use client';

import { motion } from 'framer-motion';

interface ScaleSliderProps {
  value: number | undefined;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  minLabel?: string;
  maxLabel?: string;
}

export default function ScaleSlider({
  value,
  onChange,
  min = 0,
  max = 10,
  minLabel = 'Pas du tout d\'accord',
  maxLabel = 'Tout à fait d\'accord',
}: ScaleSliderProps) {
  const numbers = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <div className="flex justify-between items-center gap-1 sm:gap-2">
        {numbers.map((num) => (
          <motion.button
            key={num}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onChange(num)}
            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl font-semibold text-sm sm:text-base transition-all touch-feedback
              ${value === num
                ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
          >
            {num}
          </motion.button>
        ))}
      </div>
      <div className="flex justify-between mt-3 text-xs sm:text-sm text-gray-500">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </motion.div>
  );
}
