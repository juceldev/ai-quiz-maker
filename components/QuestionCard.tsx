
import React from 'react';
import { Question } from '../types';

interface QuestionCardProps {
  question: Question;
  questionNumber: number;
  selectedAnswer: string | null;
  onAnswerChange: (questionId: string, answerId: string) => void;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question, questionNumber, selectedAnswer, onAnswerChange }) => {
  return (
    <div className="bg-white dark:bg-gray-800/50 p-6 rounded-xl border border-gray-200 dark:border-gray-700 transition-shadow hover:shadow-md">
      <p className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
        <span className="text-blue-600 dark:text-blue-400 font-bold">{questionNumber}.</span> {question.question}
      </p>
      <div className="space-y-3">
        {question.answers.map((answer) => (
          <label 
            key={answer.id}
            className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
              selectedAnswer === answer.id 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 ring-2 ring-blue-500' 
                : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
            }`}
          >
            <input 
              type="radio"
              name={question.id}
              value={answer.id}
              checked={selectedAnswer === answer.id}
              onChange={() => onAnswerChange(question.id, answer.id)}
              className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <span className="ml-4 text-gray-700 dark:text-gray-300">{answer.answer}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default QuestionCard;
