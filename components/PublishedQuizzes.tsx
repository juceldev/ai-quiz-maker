import React, { useState } from 'react';
import { CategoryWithQuizzes } from '../types';

interface PublishedQuizzesProps {
  categories: CategoryWithQuizzes[];
  onTakeQuiz: (id: number) => void;
  onGoBack: () => void;
}

const ChevronDownIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
  );

const PublishedQuizzes: React.FC<PublishedQuizzesProps> = ({ categories, onTakeQuiz, onGoBack }) => {
  const [openCategoryId, setOpenCategoryId] = useState<number | null>(categories.length > 0 ? categories[0].id : null);

  const handleToggleCategory = (categoryId: number) => {
    setOpenCategoryId(prevId => (prevId === categoryId ? null : categoryId));
  };
    
  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">Published Quizzes</h2>
        <button 
          onClick={onGoBack}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          &larr; Back to Generator
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No quizzes have been published yet.</p>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Generate and publish a quiz to see it here!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {categories.map((category) => (
            <div key={category.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <button 
                    onClick={() => handleToggleCategory(category.id)}
                    className="w-full flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-colors"
                    aria-expanded={openCategoryId === category.id}
                >
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{category.title}</h3>
                    <ChevronDownIcon className={`w-6 h-6 text-gray-500 dark:text-gray-400 transition-transform duration-300 ${openCategoryId === category.id ? 'rotate-180' : ''}`} />
                </button>
                {openCategoryId === category.id && (
                    <div className="p-4 bg-white dark:bg-gray-800/30 space-y-4 animate-fade-in">
                        {category.quizzes.map(quiz => (
                            <div key={quiz.id} className="bg-white dark:bg-gray-800/50 p-5 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div className="flex-grow">
                                    <h4 className="text-lg font-bold text-gray-800 dark:text-gray-100">{quiz.title}</h4>
                                    <p className="text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{quiz.description}</p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                                        Published on: {new Date(quiz.create_date).toLocaleDateString()}
                                    </p>
                                </div>
                                <button 
                                    onClick={() => onTakeQuiz(quiz.id)}
                                    className="w-full sm:w-auto flex-shrink-0 px-5 py-2 bg-green-600 text-white font-bold rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-800 transition-transform transform hover:scale-105"
                                >
                                    Take Quiz
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PublishedQuizzes;
