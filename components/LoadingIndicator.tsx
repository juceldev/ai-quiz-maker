
import React from 'react';
import SparklesIcon from './icons/SparklesIcon';

const loadingMessages = [
  "Consulting the digital oracles...",
  "Crafting challenging questions...",
  "Polishing the correct answers...",
  "Warming up the AI brain cells...",
  "Assembling bits of knowledge...",
  "Don't worry, it's not rocket science... or is it?",
  "Generating electrifying questions!",
];

const LoadingIndicator: React.FC = () => {
  const [message, setMessage] = React.useState(loadingMessages[0]);

  React.useEffect(() => {
    const intervalId = setInterval(() => {
      setMessage(prevMessage => {
        const currentIndex = loadingMessages.indexOf(prevMessage);
        const nextIndex = (currentIndex + 1) % loadingMessages.length;
        return loadingMessages[nextIndex];
      });
    }, 2000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-8 min-h-[300px]">
      <SparklesIcon className="w-16 h-16 text-blue-500 animate-pulse" />
      <h2 className="mt-6 text-xl font-semibold text-gray-700 dark:text-gray-300">Generating Your Quiz...</h2>
      <p className="mt-2 text-gray-500 dark:text-gray-400 text-center transition-opacity duration-500">{message}</p>
    </div>
  );
};

export default LoadingIndicator;
