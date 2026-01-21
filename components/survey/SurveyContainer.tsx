'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Question, getQuestionFlow, shouldShowQuestion } from '@/lib/questions';
import ProgressBar from './ProgressBar';
import NavigationButtons from './NavigationButtons';
import QuestionCard from './QuestionCard';

export default function SurveyContainer() {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get the current question flow based on answers
  const questionFlow = getQuestionFlow(answers);

  // Filter questions that should be shown based on conditional logic
  const visibleQuestions = questionFlow.filter((q) =>
    shouldShowQuestion(q, answers)
  );

  const currentQuestion = visibleQuestions[currentIndex];
  const totalQuestions = visibleQuestions.length;
  const isLastQuestion = currentIndex === totalQuestions - 1;

  // Check if current answer is valid
  const isCurrentAnswerValid = useCallback(() => {
    if (!currentQuestion) return false;

    const answer = answers[currentQuestion.id];

    // Not required questions can always proceed
    if (!currentQuestion.required) return true;

    // Check based on question type
    switch (currentQuestion.type) {
      case 'single':
        return answer !== undefined && answer !== null;
      case 'multiple':
      case 'multiple_exclusive':
        return Array.isArray(answer) && answer.length > 0;
      case 'numeric':
        if (typeof answer !== 'number') return false;
        // Validate range if min/max specified
        if (currentQuestion.min !== undefined && answer < currentQuestion.min) return false;
        if (currentQuestion.max !== undefined && answer > currentQuestion.max) return false;
        return true;
      case 'text':
        return typeof answer === 'string' && answer.trim().length > 0;
      case 'scale':
        return typeof answer === 'number';
      case 'percentage_distribution':
        if (!answer || typeof answer !== 'object') return false;
        const sum = Object.values(answer as Record<string, number>).reduce((a, b) => a + b, 0);
        return sum === 100;
      default:
        return true;
    }
  }, [currentQuestion, answers]);

  // Handle answer change
  const handleAnswerChange = (value: any) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: value,
    }));
  };

  // Navigate to previous question
  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  // Navigate to next question
  const goToNext = useCallback(async () => {
    if (!isCurrentAnswerValid() && currentQuestion?.required) return;

    if (isLastQuestion) {
      // Submit the survey
      await submitSurvey();
    } else {
      setDirection(1);
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, isLastQuestion, isCurrentAnswerValid, currentQuestion]);

  // Submit survey
  const submitSurvey = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: answers,
          completed: true,
        }),
      });

      if (response.ok) {
        router.push('/survey/complete');
      } else {
        alert('Une erreur est survenue. Veuillez réessayer.');
      }
    } catch (error) {
      console.error('Error submitting survey:', error);
      alert('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        if (e.key === 'Enter') {
          // Don't auto-advance on Enter for text inputs
          const activeElement = document.activeElement;
          if (
            activeElement?.tagName === 'TEXTAREA' ||
            (activeElement?.tagName === 'INPUT' &&
              (activeElement as HTMLInputElement).type !== 'number')
          ) {
            return;
          }
        }
        goToNext();
      } else if (e.key === 'ArrowLeft') {
        goToPrevious();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrevious]);

  // Auto-advance handler for single choice
  const handleAutoAdvance = useCallback(() => {
    if (!isLastQuestion && currentQuestion?.type === 'single') {
      setDirection(1);
      setCurrentIndex((prev) => prev + 1);
    }
  }, [isLastQuestion, currentQuestion]);

  if (!currentQuestion) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-white">
      <ProgressBar current={currentIndex + 1} total={totalQuestions} />

      <main className="flex-1 flex items-start sm:items-center justify-center pt-8 sm:pt-12 pb-32 overflow-y-auto">
        <QuestionCard
          question={currentQuestion}
          value={answers[currentQuestion.id]}
          onChange={handleAnswerChange}
          onAutoAdvance={handleAutoAdvance}
          direction={direction}
        />
      </main>

      <NavigationButtons
        onPrevious={goToPrevious}
        onNext={goToNext}
        canGoBack={currentIndex > 0}
        canGoNext={isCurrentAnswerValid() || !currentQuestion.required}
        isLastQuestion={isLastQuestion}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
