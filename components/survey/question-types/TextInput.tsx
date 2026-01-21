'use client';

import { motion } from 'framer-motion';

interface TextInputProps {
  value: string | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  maxLength?: number;
}

export default function TextInput({
  value,
  onChange,
  placeholder = 'Votre réponse...',
  multiline = false,
  maxLength,
}: TextInputProps) {
  // Short input for postal codes etc.
  if (maxLength && maxLength <= 10) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[200px]"
      >
        <input
          type="text"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          className="w-full px-5 py-4 text-lg text-center font-semibold border-2 border-gray-200 rounded-xl
            focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 outline-none transition-all
            placeholder:text-gray-400 placeholder:font-normal"
        />
      </motion.div>
    );
  }

  if (multiline) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full"
      >
        <textarea
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={4}
          maxLength={maxLength}
          className="w-full px-5 py-4 text-lg border-2 border-gray-200 rounded-xl
            focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 outline-none transition-all
            placeholder:text-gray-400 resize-none"
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <input
        type="text"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full px-5 py-4 text-lg border-2 border-gray-200 rounded-xl
          focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 outline-none transition-all
          placeholder:text-gray-400"
      />
    </motion.div>
  );
}
