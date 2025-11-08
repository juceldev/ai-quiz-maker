
import React, { useState, useMemo } from 'react';
import { Quiz, UserAnswers } from '../types';
import QuestionCard from './QuestionCard';

interface QuizDisplayProps {
  quiz: Quiz;
  onSubmit: (answers: UserAnswers) => void;
}

const QuizDisplay: React.FC<QuizDisplayProps> = ({ quiz, onSubmit }) => {
  const [userAnswers, setUserAnswers] = useState<UserAnswers>({});
  
  const handleAnswerChange = (questionId: string, answerId: string) => {
    setUserAnswers(prev => ({ ...prev, [questionId]: answerId }));
  };

  const allQuestionsAnswered = useMemo(() => {
    return quiz.questions.length === Object.keys(userAnswers).length;
  }, [quiz.questions.length, userAnswers]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (allQuestionsAnswered) {
      onSubmit(userAnswers);
    }
  };

  return (
    <div className="animate-fade-in">
      <h2 className="text-3xl font-extrabold text-center text-gray-900 dark:text-white mb-2">{quiz.title}</h2>
      <p className="text-center text-gray-600 dark:text-gray-400 mb-8">{quiz.description}</p>
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {quiz.questions.map((question, index) => (
            <QuestionCard 
              key={question.id}
              question={question}
              questionNumber={index + 1}
              selectedAnswer={userAnswers[question.id] || null}
              onAnswerChange={handleAnswerChange}
            />
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <button 
            type="submit" 
            disabled={!allQuestionsAnswered}
            className="px-8 py-3 bg-green-600 text-white font-bold rounded-lg shadow-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-800 transition-all transform hover:scale-105 disabled:bg-gray-400 disabled:dark:bg-gray-600 disabled:cursor-not-allowed disabled:scale-100"
          >
            {allQuestionsAnswered ? 'See Your Results' : 'Answer all questions to see results'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default QuizDisplay;
