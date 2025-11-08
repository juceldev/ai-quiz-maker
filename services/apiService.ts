import { Quiz, PublishedQuiz, CategoryWithQuizzes, QuizCategory } from '../types';

// Use environment variable for the backend URL, with a fallback for local development
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api';

const handleResponse = async (response: Response) => {
    if (!response.ok) {
        let errorData;
        try {
            errorData = await response.json();
        } catch (e) {
            const textError = await response.text();
            throw new Error(textError || `HTTP error! status: ${response.status}`);
        }
        throw new Error(errorData.message || `An unknown API error occurred. Status: ${response.status}`);
    }
    return response.json();
};

const handleFetchError = (error: any, context: string): never => {
    console.error(`Network error during ${context}:`, error);
    if (error.message.includes('Failed to fetch')) {
        throw new Error(`Could not connect to the server. Please ensure the backend server is running and accessible at ${API_BASE_URL}`);
    }
    throw error;
};


export const publishQuiz = async (quiz: Quiz, categoryName: string): Promise<any> => {
    try {
        const response = await fetch(`${API_BASE_URL}/quizzes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ...quiz, categoryName }),
        });
        return handleResponse(response);
    } catch (error) {
        return handleFetchError(error, 'publishQuiz');
    }
};

export const getCategories = async (): Promise<QuizCategory[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/categories`);
        return handleResponse(response);
    } catch (error) {
        return handleFetchError(error, 'getCategories');
    }
};

export const addCategory = async (title: string): Promise<QuizCategory> => {
    try {
        const response = await fetch(`${API_BASE_URL}/categories`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title }),
        });
        return handleResponse(response);
    } catch (error) {
        return handleFetchError(error, 'addCategory');
    }
};

export const getPublishedContent = async (): Promise<CategoryWithQuizzes[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/published-content`);
        return handleResponse(response);
    } catch (error) {
        return handleFetchError(error, 'getPublishedContent');
    }
};

export const getQuizById = async (id: number): Promise<Quiz> => {
    try {
        const response = await fetch(`${API_BASE_URL}/quizzes/${id}`);
        return handleResponse(response);
    } catch (error) {
        return handleFetchError(error, 'getQuizById');
    }
};