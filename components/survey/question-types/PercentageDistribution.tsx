'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Option, segmentGroups } from '@/lib/questions';

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

  // Track which collapsible groups are expanded
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'implants_paro': true,
    'ortho_esth': true,
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

  // Toggle a collapsible group
  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  // Get group subtotal
  const getGroupSubtotal = (segmentKeys: string[]) => {
    return segmentKeys.reduce((sum, key) => sum + (percentages[key] || 0), 0);
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

  // Render a single segment input
  const renderSegmentInput = (option: Option, index: number, isNested: boolean = false) => {
    const key = String(option.value);
    const pct = percentages[key] || 0;

    return (
      <motion.div
        key={option.value}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ delay: index * 0.03 }}
        className={`space-y-2 ${isNested ? 'ml-6 pl-4 border-l-2 border-gray-200' : ''}`}
      >
        <div className="flex items-center justify-between gap-4">
          <span className={`flex-1 text-sm font-medium text-gray-700 ${isNested ? 'text-gray-600' : ''}`}>
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
        <div className={`h-2 bg-gray-100 rounded-full overflow-hidden ${isNested ? 'ml-0' : ''}`}>
          <motion.div
            className="h-full bg-primary-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.2 }}
          />
        </div>
      </motion.div>
    );
  };

  // Render a collapsible group
  const renderCollapsibleGroup = (group: typeof segmentGroups[0], groupIndex: number) => {
    const isExpanded = expandedGroups[group.id] ?? true;
    const subtotal = getGroupSubtotal(group.segments);
    const groupOptions = options.filter(opt => group.segments.includes(String(opt.value)));

    return (
      <motion.div
        key={group.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: groupIndex * 0.05 }}
        className="border-2 border-gray-200 rounded-xl overflow-hidden"
      >
        {/* Group header - clickable to expand/collapse */}
        <button
          onClick={() => toggleGroup(group.id)}
          className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <motion.span
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ duration: 0.2 }}
              className="text-gray-500"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </motion.span>
            <span className="text-sm font-semibold text-gray-700">{group.label}</span>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-bold ${
            subtotal > 0 ? 'bg-primary-100 text-primary-700' : 'bg-gray-200 text-gray-500'
          }`}>
            {subtotal}%
          </div>
        </button>

        {/* Group content - animated expand/collapse */}
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="p-4 space-y-4 bg-white">
                {groupOptions.map((option, idx) => renderSegmentInput(option, idx, true))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  // Build the rendered structure using segment groups
  let globalIndex = 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full space-y-4"
    >
      {segmentGroups.map((group, groupIndex) => {
        if (group.collapsible && group.segments.length > 1) {
          // Render as collapsible group
          return renderCollapsibleGroup(group, groupIndex);
        } else {
          // Render as standalone segment(s)
          const groupOptions = options.filter(opt => group.segments.includes(String(opt.value)));
          return groupOptions.map((option) => {
            const idx = globalIndex++;
            return renderSegmentInput(option, idx, false);
          });
        }
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
              ? `Depassement de ${sum - 100}%`
              : `Il reste ${remaining}% a repartir`
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
            Repartir le reste
          </button>
        )}
        {sum > 0 && (
          <button
            onClick={resetAll}
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Reinitialiser
          </button>
        )}
      </div>
    </motion.div>
  );
}
