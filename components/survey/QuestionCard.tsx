'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Question, sectionTitles } from '@/lib/questions';
import {
  SingleChoice,
  MultipleChoice,
  NumericInput,
  TextInput,
  ScaleSlider,
  PercentageDistribution,
} from './question-types';

interface QuestionCardProps {
  question: Question;
  value: any;
  onChange: (value: any) => void;
  onAutoAdvance?: () => void;
  direction: number;
}

export default function QuestionCard({
  question,
  value,
  onChange,
  onAutoAdvance,
  direction,
}: QuestionCardProps) {
  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 100 : -100,
      opacity: 0,
    }),
  };

  const renderInput = () => {
    switch (question.type) {
      case 'single':
        return (
          <SingleChoice
            options={question.options || []}
            value={value}
            onChange={onChange}
            onAutoAdvance={onAutoAdvance}
          />
        );
      case 'multiple':
        return (
          <MultipleChoice
            options={question.options || []}
            value={value}
            onChange={onChange}
            questionId={question.id}
          />
        );
      case 'multiple_exclusive':
        return (
          <MultipleChoice
            options={question.options || []}
            value={value}
            onChange={onChange}
            questionId={question.id}
            hasExclusiveOption={true}
          />
        );
      case 'numeric':
        return (
          <NumericInput
            value={value}
            onChange={onChange}
            placeholder={question.placeholder}
            min={question.min}
            max={question.max}
            unit={question.unit}
          />
        );
      case 'text':
        return (
          <TextInput
            value={value}
            onChange={onChange}
            placeholder={question.placeholder}
            multiline={false}
            maxLength={question.max}
          />
        );
      case 'scale':
        return (
          <ScaleSlider
            value={value}
            onChange={onChange}
            min={question.min}
            max={question.max}
            minLabel={question.scaleLabels?.min}
            maxLabel={question.scaleLabels?.max}
          />
        );
      case 'percentage_distribution':
        return (
          <PercentageDistribution
            options={question.options || []}
            value={value}
            onChange={onChange}
          />
        );
      default:
        return null;
    }
  };

  return (
    <AnimatePresence mode="wait" custom={direction}>
      <motion.div
        key={question.id}
        custom={direction}
        variants={variants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{
          x: { type: 'spring', stiffness: 300, damping: 30 },
          opacity: { duration: 0.2 },
        }}
        className="w-full max-w-2xl mx-auto px-4"
      >
        <div className="mb-2">
          <span className="inline-block px-3 py-1 text-xs font-medium text-primary-600 bg-primary-50 rounded-full">
            {sectionTitles[question.section]}
          </span>
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
          {question.question}
          {question.required && <span className="text-red-500 ml-1">*</span>}
        </h2>

        {question.subtitle && (
          <p className="text-gray-500 mb-6">{question.subtitle}</p>
        )}

        <div className="mt-6">{renderInput()}</div>
      </motion.div>
    </AnimatePresence>
  );
}
