import { Quiz, PublishedQuiz, CategoryWithQuizzes, QuizCategory } from '../types';

// Use environment variable for the backend URL, with a fallback for local development
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api';

const handleResponse = async (response: Response) => {
    // Read the body as text ONCE to avoid "body already read" errors.
    const text = await response.text();
    let data;

    try {
        // Attempt to parse the text as JSON.
        data = JSON.parse(text);
    } catch (e) {
        // If parsing fails, the response was not JSON.
        if (response.ok) {
            // This is unexpected for a successful response.
            throw new Error("Received a non-JSON response from the server.");
        }
        // For a failed response, the raw text is the error message.
        throw new Error(text || `HTTP error! status: ${response.status}`);
    }

    if (!response.ok) {
        // If it was JSON, throw the message from the server's response.
        throw new Error(data.message || `An unknown API error occurred. Status: ${response.status}`);
    }

    return data;
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