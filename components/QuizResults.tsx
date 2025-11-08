import React, { useMemo, useState } from 'react';
import { Quiz, UserAnswers, Answer } from '../types';
import { publishQuiz } from '../services/apiService';

interface QuizResultsProps {
  quiz: Quiz;
  userAnswers: UserAnswers;
  onReset: () => void;
}

const CheckCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);

const XCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
  </svg>
);

const QuizResults: React.FC<QuizResultsProps> = ({ quiz, userAnswers, onReset }) => {
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishStatus, setPublishStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [categoryName, setCategoryName] = useState(quiz.title);

  const { score, total, percentage } = useMemo(() => {
    let correctAnswers = 0;
    quiz.questions.forEach(q => {
      const correctAnswer = q.answers.find(a => a.correct);
      if (correctAnswer && userAnswers[q.id] === correctAnswer.id) {
        correctAnswers++;
      }
    });
    const totalQuestions = quiz.questions.length;
    return {
      score: correctAnswers,
      total: totalQuestions,
      percentage: totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0,
    };
  }, [quiz, userAnswers]);

  const handlePublish = async () => {
    if (!categoryName.trim()) return;
    setIsPublishing(true);
    setPublishStatus('idle');
    try {
      await publishQuiz(quiz, categoryName);
      setPublishStatus('success');
    } catch (error) {
      console.error("Failed to publish quiz:", error);
      setPublishStatus('error');
    } finally {
      setIsPublishing(false);
    }
  };

  const getBorderColor = (isCorrect: boolean, isSelected: boolean) => {
    if (isCorrect) return 'border-green-500 bg-green-50 dark:bg-green-900/30';
    if (isSelected) return 'border-red-500 bg-red-50 dark:bg-red-900/30';
    return 'border-gray-300 dark:border-gray-600';
  };

  return (
    <div className="animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">Quiz Results</h2>
        <p className="mt-4 text-5xl font-bold text-blue-600 dark:text-blue-400">{score} / {total}</p>
        <p className="mt-2 text-2xl text-gray-700 dark:text-gray-300">({percentage}%)</p>
      </div>

      <div className="space-y-6 mb-8">
        {quiz.questions.map((q, index) => {
          const correctAnswer = q.answers.find(a => a.correct) as Answer;
          const userAnswerId = userAnswers[q.id];
          
          return (
            <div key={q.id} className="bg-white dark:bg-gray-800/50 p-5 rounded-xl border border-gray-200 dark:border-gray-700">
              <p className="font-semibold text-gray-800 dark:text-gray-100 mb-4">{index + 1}. {q.question}</p>
              <div className="space-y-2">
                {q.answers.map(a => {
                  const isCorrect = a.correct;
                  const isSelected = userAnswerId === a.id;
                  return (
                    <div key={a.id} className={`flex items-center p-3 rounded-lg border-2 ${getBorderColor(isCorrect, isSelected)}`}>
                      {isCorrect ? <CheckCircleIcon/> : (isSelected ? <XCircleIcon/> : <div className="w-5 h-5"></div>)}
                      <span className="ml-3 text-gray-700 dark:text-gray-300">{a.answer}</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-900/40 rounded-lg">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Explanation:</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{q.explanation}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-center space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button 
            onClick={onReset}
            className="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-transform transform hover:scale-105"
          >
            Create Another Quiz
          </button>
          
          <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2 items-center">
             <input
              type="text"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="Enter a category"
              className="w-full sm:w-auto flex-grow px-4 py-3 bg-gray-100 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              required
            />
            <button 
              onClick={handlePublish}
              disabled={!categoryName.trim() || isPublishing || publishStatus === 'success'}
              className="w-full sm:w-auto px-8 py-3 bg-indigo-600 text-white font-bold rounded-lg shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 transition-all transform hover:scale-105 disabled:bg-gray-400 disabled:dark:bg-gray-600 disabled:cursor-not-allowed disabled:scale-100"
            >
              {isPublishing ? 'Publishing...' : (publishStatus === 'success' ? 'Published!' : 'Publish Quiz')}
            </button>
          </div>
        </div>
        {publishStatus === 'success' && <p className="text-green-600 dark:text-green-400">Quiz saved successfully!</p>}
        {publishStatus === 'error' && <p className="text-red-500 dark:text-red-400">Failed to publish quiz. Please try again.</p>}
      </div>
    </div>
  );
};

export default QuizResults;
