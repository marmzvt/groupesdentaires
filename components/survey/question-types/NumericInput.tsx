'use client';

import { motion } from 'framer-motion';

interface NumericInputProps {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  placeholder?: string;
  min?: number;
  max?: number;
  unit?: string;
}

export default function NumericInput({
  value,
  onChange,
  placeholder = 'Entrez un nombre',
  min = 0,
  max = 9999,
  unit,
}: NumericInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
      onChange(undefined);
    } else {
      const num = parseInt(val, 10);
      if (!isNaN(num)) {
        // Allow typing any number, validation happens on submit
        onChange(num);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-xs"
    >
      <div className="relative">
        <input
          type="number"
          value={value ?? ''}
          onChange={handleChange}
          placeholder={placeholder}
          min={min}
          max={max}
          className="w-full px-6 py-4 text-2xl font-semibold text-center border-2 border-gray-200 rounded-xl
            focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 outline-none transition-all
            placeholder:text-gray-300 placeholder:font-normal placeholder:text-lg"
        />
        {unit && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
            {unit}
          </span>
        )}
      </div>
    </motion.div>
  );
}
