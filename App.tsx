import React, { useState, useCallback, useEffect } from 'react';
import { Quiz, QuizState, UserAnswers, CategoryWithQuizzes, QuizCategory } from './types';
import { generateQuiz } from './services/geminiService';
import { getPublishedContent, getQuizById, getCategories, addCategory, publishQuiz } from './services/apiService';
import QuizGenerator from './components/QuizGenerator';
import QuizDisplay from './components/QuizDisplay';
import QuizResults from './components/QuizResults';
import LoadingIndicator from './components/LoadingIndicator';
import PublishedQuizzes from './components/PublishedQuizzes';
import SparklesIcon from './components/icons/SparklesIcon';

const CheckCircleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" {...props}>
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
);

const App: React.FC = () => {
  const [quizState, setQuizState] = useState<QuizState>(QuizState.SELECTING_TOPIC);
  const [quizData, setQuizData] = useState<Quiz | null>(null);
  const [userAnswers, setUserAnswers] = useState<UserAnswers>({});
  const [publishedContent, setPublishedContent] = useState<CategoryWithQuizzes[]>([]);
  const [categories, setCategories] = useState<QuizCategory[]>([]);
  const [currentCategoryName, setCurrentCategoryName] = useState<string>('');
  const [publishCategoryName, setPublishCategoryName] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // State for publishing from the preview screen
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishStatus, setPublishStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [lastPublishedDate, setLastPublishedDate] = useState<string | null>(null);

  useEffect(() => {
    // Fetch categories when the app loads for the generator
    const fetchCategories = async () => {
        try {
            const cats = await getCategories();
            setCategories(cats);
        } catch (err: any) {
            console.error("Could not fetch categories", err);
            setError(err.message || "Could not load quiz categories. Is the backend server running?");
        }
    };
    fetchCategories();
  }, []);

  const handleGenerateQuiz = useCallback(async (category: string, title: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const prompt = `Generate a quiz about "${title}" from the topic of "${category}".`;
      const data = await generateQuiz(prompt);
      setQuizData(data);
      setCurrentCategoryName(category);
      setPublishCategoryName(category); // Pre-fill publish input
      setPublishStatus('idle'); // Reset status for the new quiz
      setLastPublishedDate(null); // Reset date
      setQuizState(QuizState.PREVIEW);
      setUserAnswers({});
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
      setQuizState(QuizState.SELECTING_TOPIC);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handlePublishQuizFromPreview = useCallback(async () => {
    if (!quizData || !publishCategoryName.trim()) return;
    setIsPublishing(true);
    setPublishStatus('idle');
    try {
      const response = await publishQuiz(quizData, publishCategoryName);
      setLastPublishedDate(response.createDate);
      setPublishStatus('success');
    } catch (error: any) {
      console.error("Failed to publish quiz:", error);
      setError(error.message || "Failed to publish quiz.");
      setPublishStatus('error');
    } finally {
      setIsPublishing(false);
    }
  }, [quizData, publishCategoryName]);

  const handleStartQuiz = useCallback(() => {
    setQuizState(QuizState.TAKING);
  }, []);

  const handleAddNewCategory = useCallback(async (title: string): Promise<QuizCategory> => {
    setError(null);
    try {
        const newCategory = await addCategory(title);
        setCategories(prev => [...prev, newCategory].sort((a, b) => a.title.localeCompare(b.title)));
        return newCategory;
    } catch (err: any)        {
        setError(err.message || "Failed to add new category.");
        throw err; // Re-throw to be caught in the component
    }
  }, []);
  
  const handleViewPublished = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
        const data = await getPublishedContent();
        setPublishedContent(data);
        setQuizState(QuizState.VIEWING_PUBLISHED);
    } catch (err: any) {
        setError(err.message || "Failed to fetch published quizzes. Make sure the backend server is running.");
        setQuizState(QuizState.SELECTING_TOPIC);
    } finally {
        setIsLoading(false);
    }
  }, []);

  const handleTakePublishedQuiz = useCallback(async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getQuizById(id);
      setQuizData(data);
      setCurrentCategoryName(''); // Reset category when taking a published quiz
      setQuizState(QuizState.TAKING);
      setUserAnswers({});
    } catch (err: any) {
      setError(err.message || "Failed to load the selected quiz.");
      setQuizState(QuizState.VIEWING_PUBLISHED);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSubmitQuiz = useCallback((answers: UserAnswers) => {
    setUserAnswers(answers);
    setQuizState(QuizState.RESULTS);
  }, []);

  const handleReset = useCallback(() => {
    setQuizData(null);
    setUserAnswers({});
    setError(null);
    setCurrentCategoryName('');
    setPublishCategoryName('');
    setLastPublishedDate(null);
    setQuizState(QuizState.SELECTING_TOPIC);
  }, []);

  const renderContent = () => {
    if (isLoading) {
      return <LoadingIndicator />;
    }

    switch (quizState) {
      case QuizState.SELECTING_TOPIC:
        return <QuizGenerator categories={categories} onGenerate={handleGenerateQuiz} onAddCategory={handleAddNewCategory} onViewPublished={handleViewPublished} error={error} />;
      
      case QuizState.PREVIEW:
        if (quizData) {
            return (
                <div className="animate-fade-in">
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">{quizData.title}</h2>
                    <p className="text-center text-gray-600 dark:text-gray-400">{quizData.description}</p>
                  </div>
            
                  <div className="mb-8 p-4 border border-gray-200 dark:border-gray-700 rounded-lg max-h-80 overflow-y-auto bg-gray-50 dark:bg-gray-900/50">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4 sticky top-0 bg-gray-50 dark:bg-gray-900/50 py-2 -mt-4 px-2 -mx-4 border-b border-gray-200 dark:border-gray-700">Quiz Questions</h3>
                    <div className="space-y-6 pt-2">
                      {quizData.questions.map((q, index) => (
                        <div key={q.id} className="p-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                          <p className="font-semibold text-gray-800 dark:text-gray-100 mb-3">
                            <span className="text-blue-600 dark:text-blue-400 font-bold">{index + 1}.</span> {q.question}
                          </p>
                          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                            {q.answers.map(a => (
                              <li key={a.id} className={`flex items-center gap-2 ${a.correct ? 'font-semibold text-green-700 dark:text-green-400' : ''}`}>
                                {a.correct ? <CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0"/> : <div className="w-4 h-4 flex-shrink-0"/>}
                                <span>{a.answer}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
            
                  <div className="p-6 bg-gray-100 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Actions</h3>
                    <div className="space-y-4">
                        {publishStatus === 'success' ? (
                            <div className="flex flex-col items-center justify-center gap-1 p-3 bg-green-100 dark:bg-green-900/50 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <CheckCircleIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                                  <span className="font-semibold text-green-700 dark:text-green-300">Quiz Published Successfully!</span>
                                </div>
                                {lastPublishedDate && (
                                  <p className="text-sm text-green-600 dark:text-green-400">
                                      Published on: {new Date(lastPublishedDate).toLocaleString()}
                                  </p>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col sm:flex-row gap-2 items-center">
                                <input
                                    type="text"
                                    value={publishCategoryName}
                                    onChange={(e) => setPublishCategoryName(e.target.value)}
                                    placeholder="Enter category to publish"
                                    className="w-full sm:w-auto flex-grow px-4 py-3 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    required
                                />
                                <button 
                                    onClick={handlePublishQuizFromPreview}
                                    disabled={!publishCategoryName.trim() || isPublishing}
                                    className="w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 transition-all transform hover:scale-105 disabled:bg-gray-400 disabled:dark:bg-gray-600 disabled:cursor-not-allowed disabled:scale-100"
                                >
                                    {isPublishing ? 'Publishing...' : 'Publish Quiz'}
                                </button>
                            </div>
                        )}
                        {publishStatus === 'error' && <p className="text-red-500 dark:text-red-400 text-center sm:text-left">{error || 'Failed to publish quiz. Please try again.'}</p>}
            
                        <div className="relative my-4">
                          <div className="absolute inset-0 flex items-center" aria-hidden="true"><div className="w-full border-t border-gray-300 dark:border-gray-600"></div></div>
                          <div className="relative flex justify-center"><span className="bg-gray-100 dark:bg-gray-900/50 px-2 text-sm text-gray-500 dark:text-gray-400">Then...</span></div>
                        </div>
            
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <button 
                                onClick={handleStartQuiz}
                                className="w-full sm:w-auto px-8 py-3 bg-green-600 text-white font-bold rounded-lg shadow-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-800 transition-transform transform hover:scale-105"
                            >
                                Start Quiz
                            </button>
                            <button 
                                onClick={handleReset}
                                className="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-transform transform hover:scale-105"
                            >
                                Generate New Quiz
                            </button>
                        </div>
                    </div>
                  </div>
                </div>
              );
        }
        return <p>Something went wrong. Please try again.</p>;

      case QuizState.TAKING:
        if (quizData) {
          return <QuizDisplay quiz={quizData} onSubmit={handleSubmitQuiz} />;
        }
        return <p>Something went wrong. Please try again.</p>;
      case QuizState.RESULTS:
        if (quizData) {
          return <QuizResults quiz={quizData} userAnswers={userAnswers} onReset={handleReset} initialCategoryName={currentCategoryName} />;
        }
        return <p>Something went wrong. Please try again.</p>;
      case QuizState.VIEWING_PUBLISHED:
        return <PublishedQuizzes categories={publishedContent} onTakeQuiz={handleTakePublishedQuiz} onGoBack={handleReset} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 dark:bg-gray-900 dark:text-gray-200 flex flex-col items-center p-4 sm:p-6 lg:p-8 transition-colors duration-300">
      <header className="w-full max-w-4xl mb-8 text-center">
        <div className="flex items-center justify-center gap-3">
          <SparklesIcon className="w-8 h-8 text-blue-500" />
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            AI Quiz Maker
          </h1>
        </div>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
          Generate, publish, and take quizzes on any topic instantly.
        </p>
      </header>
      <main className="w-full max-w-4xl flex-grow">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 sm:p-8 transition-colors duration-300">
          {renderContent()}
        </div>
      </main>
      <footer className="w-full max-w-4xl mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>Powered by Google Gemini API</p>
      </footer>
    </div>
  );
};

export default App;