'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Option } from '@/lib/questions';

interface PercentageDistributionProps {
  options: Option[];
  value: Record<string, number> | undefined;
  onChange: (value: Record<string, number>) => void;
}

export default function PercentageDistribution({
  options,
  value,
  onChange,
}: PercentageDistributionProps) {
  // Initialize with zeros or existing values
  const [percentages, setPercentages] = useState<Record<string, number>>(() => {
    if (value && Object.keys(value).length > 0) return value;
    return options.reduce((acc, opt) => ({ ...acc, [String(opt.value)]: 0 }), {});
  });

  // Sync with parent value when it changes externally
  useEffect(() => {
    if (value && Object.keys(value).length > 0) {
      setPercentages(value);
    }
  }, [value]);

  const sum = useMemo(() => {
    return Object.values(percentages).reduce((a, b) => a + b, 0);
  }, [percentages]);

  const isValid = sum === 100;
  const remaining = 100 - sum;

  const handleChange = (key: string, newValue: number) => {
    const clamped = Math.min(100, Math.max(0, newValue || 0));
    const updated = { ...percentages, [key]: clamped };
    setPercentages(updated);
    onChange(updated);
  };

  const handleInputChange = (key: string, inputValue: string) => {
    if (inputValue === '') {
      handleChange(key, 0);
    } else {
      const num = parseInt(inputValue, 10);
      if (!isNaN(num)) {
        handleChange(key, num);
      }
    }
  };

  // Quick distribute remaining evenly
  const distributeRemaining = () => {
    if (remaining <= 0) return;

    const zeroKeys = Object.keys(percentages).filter(k => percentages[k] === 0);
    if (zeroKeys.length === 0) return;

    const perKey = Math.floor(remaining / zeroKeys.length);
    const extra = remaining % zeroKeys.length;

    const updated = { ...percentages };
    zeroKeys.forEach((key, idx) => {
      updated[key] = perKey + (idx < extra ? 1 : 0);
    });
    setPercentages(updated);
    onChange(updated);
  };

  // Reset all to zero
  const resetAll = () => {
    const reset = options.reduce((acc, opt) => ({ ...acc, [String(opt.value)]: 0 }), {});
    setPercentages(reset);
    onChange(reset);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full space-y-4"
    >
      {options.map((option, index) => {
        const key = String(option.value);
        const pct = percentages[key] || 0;

        return (
          <motion.div
            key={option.value}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between gap-4">
              <span className="flex-1 text-sm font-medium text-gray-700">
                {option.label}
              </span>
              <div className="relative w-24">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={pct || ''}
                  onChange={(e) => handleInputChange(key, e.target.value)}
                  className="w-full px-3 py-2 text-center text-lg font-semibold border-2 border-gray-200 rounded-lg
                    focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                  placeholder="0"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
                  %
                </span>
              </div>
            </div>

            {/* Visual bar */}
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.2 }}
              />
            </div>
          </motion.div>
        );
      })}

      {/* Sum indicator */}
      <motion.div
        className={`mt-6 p-4 rounded-xl text-center transition-all ${
          isValid
            ? 'bg-green-50 border-2 border-green-200'
            : sum > 100
              ? 'bg-red-50 border-2 border-red-200'
              : 'bg-amber-50 border-2 border-amber-200'
        }`}
        animate={{ scale: isValid ? [1, 1.02, 1] : 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className={`text-3xl font-bold ${
          isValid ? 'text-green-600' : sum > 100 ? 'text-red-600' : 'text-amber-600'
        }`}>
          {sum}%
        </div>
        <div className={`text-sm mt-1 ${
          isValid ? 'text-green-600' : sum > 100 ? 'text-red-600' : 'text-amber-600'
        }`}>
          {isValid
            ? 'Total correct !'
            : sum > 100
              ? `Dépassement de ${sum - 100}%`
              : `Il reste ${remaining}% à répartir`
          }
        </div>
      </motion.div>

      {/* Helper buttons */}
      <div className="flex gap-2 justify-center">
        {remaining > 0 && (
          <button
            onClick={distributeRemaining}
            className="px-4 py-2 text-sm text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
          >
            Répartir le reste
          </button>
        )}
        {sum > 0 && (
          <button
            onClick={resetAll}
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Réinitialiser
          </button>
        )}
      </div>
    </motion.div>
  );
}
