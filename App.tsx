import React, { useState, useCallback, useEffect } from 'react';
import { Quiz, QuizState, UserAnswers, CategoryWithQuizzes, QuizCategory } from './types';
import { generateQuiz } from './services/geminiService';
import { getPublishedContent, getQuizById, getCategories, addCategory } from './services/apiService';
import QuizGenerator from './components/QuizGenerator';
import QuizDisplay from './components/QuizDisplay';
import QuizResults from './components/QuizResults';
import LoadingIndicator from './components/LoadingIndicator';
import PublishedQuizzes from './components/PublishedQuizzes';
import SparklesIcon from './components/icons/SparklesIcon';

const App: React.FC = () => {
  const [quizState, setQuizState] = useState<QuizState>(QuizState.SELECTING_TOPIC);
  const [quizData, setQuizData] = useState<Quiz | null>(null);
  const [userAnswers, setUserAnswers] = useState<UserAnswers>({});
  const [publishedContent, setPublishedContent] = useState<CategoryWithQuizzes[]>([]);
  const [categories, setCategories] = useState<QuizCategory[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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
      setQuizState(QuizState.TAKING);
      setUserAnswers({});
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
      setQuizState(QuizState.SELECTING_TOPIC);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleAddNewCategory = useCallback(async (title: string): Promise<QuizCategory> => {
    setError(null);
    try {
        const newCategory = await addCategory(title);
        setCategories(prev => [...prev, newCategory].sort((a, b) => a.title.localeCompare(b.title)));
        return newCategory;
    } catch (err: any) {
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
    setQuizState(QuizState.SELECTING_TOPIC);
  }, []);

  const renderContent = () => {
    if (isLoading) {
      return <LoadingIndicator />;
    }

    switch (quizState) {
      case QuizState.SELECTING_TOPIC:
        return <QuizGenerator categories={categories} onGenerate={handleGenerateQuiz} onAddCategory={handleAddNewCategory} onViewPublished={handleViewPublished} error={error} />;
      case QuizState.TAKING:
        if (quizData) {
          return <QuizDisplay quiz={quizData} onSubmit={handleSubmitQuiz} />;
        }
        return <p>Something went wrong. Please try again.</p>;
      case QuizState.RESULTS:
        if (quizData) {
          return <QuizResults quiz={quizData} userAnswers={userAnswers} onReset={handleReset} />;
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