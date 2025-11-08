export interface Answer {
  id: string;
  answer: string;
  correct: boolean;
}

export interface Question {
  id: string;
  question: string;
  explanation: string;
  answers: Answer[];
}

export interface Quiz {
  title: string;
  description: string;
  questions: Question[];
}

export enum QuizState {
  SELECTING_TOPIC = 'selecting_topic',
  PREVIEW = 'preview',
  TAKING = 'taking',
  RESULTS = 'results',
  VIEWING_PUBLISHED = 'viewing_published',
}

export type UserAnswers = Record<string, string>; // questionId -> answerId

export interface PublishedQuiz {
  id: number;
  title: string;
  description: string;
  create_date: string;
}

export interface QuizCategory {
  id: number;
  title: string;
}

export interface CategoryWithQuizzes extends QuizCategory {
  quizzes: PublishedQuiz[];
}