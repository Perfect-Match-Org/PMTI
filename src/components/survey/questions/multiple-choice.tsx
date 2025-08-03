"use client";

import React, { useRef, useEffect } from "react";
import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ChoiceRefs, QuestionProps } from "@/types/survey";
import { useSurvey } from "../survey-provider";

interface MultipleChoiceProps extends QuestionProps {
  choiceRefs?: React.RefObject<ChoiceRefs>;
}

// Standard multiple choice component
export function MultipleChoice({
  question,
  choiceRefs,
  onSelectionChange,
  onSubmit = (optionId: string) =>
    console.log("MultipleChoice: Submit triggered for option:", optionId),
  disabled = false,
  selectedOption,
}: MultipleChoiceProps) {
  const { user, partner, isSubmitting, surveyState } = useSurvey();
  const [localSelection, setLocalSelection] = React.useState<string | null>(selectedOption || null);
  const internalChoiceRefs = useRef<ChoiceRefs>({});

  // Use provided choiceRefs or internal refs
  const activeChoiceRefs = choiceRefs || internalChoiceRefs;

  // Get perspective based on user role from context
  const perspective = question.perspectives[user.role];

  // Check if user has already submitted for this question
  const userStatus = surveyState.participantStatus[user.email];
  const hasSubmitted = userStatus?.hasSubmitted || false;
  const partnerStatus = surveyState.participantStatus[partner.id];
  const partnerHasSubmitted = partnerStatus?.hasSubmitted || false;

  // Handle option selection
  const handleSelectionChange = async (optionId: string) => {
    if (disabled || hasSubmitted || isSubmitting) return;

    setLocalSelection(optionId);
    // Call external handler if provided
    onSelectionChange?.(optionId);
  };

  // Set up refs for avatar positioning
  useEffect(() => {
    question.options.forEach((option) => {
      const element = document.getElementById(`choice-${question.questionId}-${option.id}`);
      if (element && activeChoiceRefs.current) {
        activeChoiceRefs.current[option.id] = element;
      }
    });
  }, [question.questionId, question.options, activeChoiceRefs]);

  // Update local selection when external selectedOption changes
  useEffect(() => {
    if (selectedOption) {
      setLocalSelection(selectedOption);
    }
  }, [selectedOption]);

  return (
    <div className="space-y-8">
      {/* Question Content */}
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">{perspective.question}</h2>
        {perspective.context && (
          <p className="text-lg text-muted-foreground">{perspective.context}</p>
        )}
      </div>

      {/* Question Image */}
      {question.graphic?.defaultUrl && (
        <div className="flex justify-center">
          <img
            src={question.graphic.defaultUrl}
            alt="Question illustration"
            className="max-w-md max-h-64 object-contain rounded-lg"
          />
        </div>
      )}

      {/* Options using RadioGroup */}
      <div className="max-w-4xl mx-auto">
        <RadioGroup
          value={localSelection || ""}
          onValueChange={handleSelectionChange}
          disabled={disabled || hasSubmitted}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {question.options.map((option) => {
            const isPartnerSelection = partnerStatus?.currentSelection === option.id;

            return (
              <div key={option.id}>
                <RadioGroupItem
                  value={option.id}
                  id={`choice-${question.questionId}-${option.id}`}
                  className="hidden"
                />
                <Label
                  htmlFor={`choice-${question.questionId}-${option.id}`}
                  className={`
                    flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 min-h-[120px]
                    hover:bg-accent hover:text-accent-foreground transition-all duration-200 h-full
                    ${localSelection === option.id ? "border-primary bg-primary/5" : ""}
                    ${disabled || hasSubmitted ? "cursor-not-allowed opacity-60" : "cursor-pointer"}
                    ${
                      isPartnerSelection && localSelection !== option.id
                        ? "ring-2 ring-blue-400 ring-opacity-50"
                        : ""
                    }
                  `}
                >
                  <CardHeader className="text-center p-2 w-full flex align-middle justify-center">
                    <CardTitle className="text-base font-medium">{option.text}</CardTitle>
                  </CardHeader>

                  {/* Partner indicator */}
                  {isPartnerSelection && localSelection !== option.id && (
                    <CardDescription className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded mt-2">
                      Partner's choice
                    </CardDescription>
                  )}
                </Label>
              </div>
            );
          })}
        </RadioGroup>
      </div>

      {/* Submission Status */}
      {hasSubmitted ? (
        <div className="text-center space-y-2">
          <div className="inline-flex items-center space-x-2 text-green-600 bg-green-50 px-4 py-2 rounded-lg">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-medium">Your answer has been submitted</span>
          </div>

          {!partnerHasSubmitted && (
            <p className="text-sm text-muted-foreground">
              Waiting for your partner to submit their answer...
            </p>
          )}

          {partnerHasSubmitted && (
            <p className="text-sm text-green-600">
              Both answers submitted! Moving to next question...
            </p>
          )}
        </div>
      ) : (
        <div className="text-center">
          <Button
            onClick={() => onSubmit(localSelection!)}
            disabled={!localSelection || isSubmitting || disabled}
            className="px-8 py-2"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Submitting...
              </>
            ) : (
              "Submit Answer"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
