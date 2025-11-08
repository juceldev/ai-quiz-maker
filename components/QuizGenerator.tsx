import React, { useState } from 'react';
import { QuizCategory } from '../types';
import SparklesIcon from './icons/SparklesIcon';

interface QuizGeneratorProps {
  categories: QuizCategory[];
  onGenerate: (category: string, title: string) => void;
  onAddCategory: (title: string) => Promise<QuizCategory>;
  onViewPublished: () => void;
  error: string | null;
}

const QuizGenerator: React.FC<QuizGeneratorProps> = ({ categories, onGenerate, onAddCategory, onViewPublished, error }) => {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [title, setTitle] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value === 'add_new') {
      setIsAddingCategory(true);
      setSelectedCategory('');
    } else {
      setIsAddingCategory(false);
      setSelectedCategory(e.target.value);
    }
  };

  const handleSaveCategory = async () => {
    if (!newCategoryName.trim()) return;
    setIsSavingCategory(true);
    try {
      const newCategory = await onAddCategory(newCategoryName);
      setSelectedCategory(newCategory.id.toString());
      setIsAddingCategory(false);
      setNewCategoryName('');
    } catch (err) {
      // Error is displayed by the parent component
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleCancelAddCategory = () => {
    setIsAddingCategory(false);
    setNewCategoryName('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCategory && title.trim()) {
      const categoryName = categories.find(c => c.id.toString() === selectedCategory)?.title || '';
      if(categoryName) {
        onGenerate(categoryName, title);
      } else {
        alert("Selected category not found. Please try again.");
      }
    }
  };

  return (
    <div className="flex flex-col items-center text-center">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Create a New Quiz</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
        Select a category and enter a title, and our AI will craft a unique quiz for you.
      </p>
      <form onSubmit={handleSubmit} className="w-full max-w-lg space-y-4">
        <div>
            <label htmlFor="category-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-left mb-1">
                Step 1: Choose a Category
            </label>
            <select
                id="category-select"
                value={selectedCategory}
                onChange={handleCategoryChange}
                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
                disabled={isAddingCategory}
            >
                <option value="" disabled>-- Select a category --</option>
                {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.title}</option>
                ))}
                 <option value="add_new" className="font-bold text-blue-600 dark:text-blue-400 bg-gray-200 dark:bg-gray-800">+ Add New Category</option>
            </select>
        </div>

        {isAddingCategory && (
            <div className="p-4 border-2 border-blue-500 rounded-lg bg-blue-50 dark:bg-blue-900/20 space-y-3 animate-fade-in">
                <label htmlFor="new-category-name" className="block text-sm font-medium text-gray-800 dark:text-gray-200 text-left">
                    New Category Name
                </label>
                <input
                    id="new-category-name"
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="e.g., 'World History'"
                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                />
                <div className="flex justify-end gap-2">
                    <button type="button" onClick={handleCancelAddCategory} className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition">Cancel</button>
                    <button type="button" onClick={handleSaveCategory} disabled={!newCategoryName.trim() || isSavingCategory} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 transition">{isSavingCategory ? 'Saving...' : 'Save'}</button>
                </div>
            </div>
        )}

         <div>
            <label htmlFor="quiz-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-left mb-1">
                Step 2: Enter a Specific Title
            </label>
            <input
                id="quiz-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., 'The Solar System'"
                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
                disabled={isAddingCategory}
            />
        </div>
        
        <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!selectedCategory || !title.trim() || isAddingCategory}
        >
            <SparklesIcon className="w-5 h-5" />
            Generate Quiz
        </button>
      </form>

      {error && <p className="mt-4 text-red-500 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 p-3 rounded-lg w-full max-w-lg">{error}</p>}
      
      <div className="mt-8 w-full max-w-lg">
        <div className="relative">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white dark:bg-gray-800 px-2 text-sm text-gray-500 dark:text-gray-400">Or</span>
          </div>
        </div>
      </div>
      
      <div className="mt-8 w-full max-w-lg text-center">
        <button
          onClick={onViewPublished}
          className="px-6 py-2 text-blue-600 dark:text-blue-400 font-semibold bg-blue-100 dark:bg-blue-900/50 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/80 transition-colors"
        >
          View Published Quizzes
        </button>
      </div>
    </div>
  );
};

export default QuizGenerator;