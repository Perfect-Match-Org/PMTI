"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useSurvey } from "./survey-provider";
import { QuestionType } from "@/lib/constants/questions";
import { MultipleChoice } from "./questions/multiple-choice";
import { CooperativeMultipleChoice } from "./questions/cooperative-multiple-choice";

export function SurveyRenderer() {
  const { currentQuestion, surveyState, isLoading, error, actions } = useSurvey();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading survey...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500 mb-4">Error loading survey: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">No question available</p>
        </div>
      </div>
    );
  }

  const renderQuestion = () => {
    switch (currentQuestion.type) {
      case QuestionType.Individual:
        return (
          <MultipleChoice
            question={currentQuestion}
            onSubmit={(optionId) => actions.submitResponse(currentQuestion.questionId, optionId)}
            onSelectionChange={(optionId) => actions.updateSelection(optionId)}
          />
        );
      case QuestionType.Cooperative:
      case QuestionType.CooperativeFlexible:
        return (
          <CooperativeMultipleChoice
            question={currentQuestion}
            onSubmit={(optionId) => actions.submitResponse(currentQuestion.questionId, optionId)}
            onSelectionChange={(optionId) => actions.updateSelection(optionId)}
          />
        );
      default:
        return (
          <MultipleChoice
            question={currentQuestion}
            onSubmit={(optionId) => actions.submitResponse(currentQuestion.questionId, optionId)}
          />
        );
    }
  };

  return (
    <div className="min-h-[calc(100vh-6rem)] bg-background flex items-center justify-center p-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={`question-${surveyState.currentQuestionIndex}`}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="w-full"
        >
          {renderQuestion()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
