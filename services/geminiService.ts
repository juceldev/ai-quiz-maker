
import { GoogleGenAI, Type } from "@google/genai";
import { Quiz } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const quizSchema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: 'The title of the quiz.'
    },
    description: {
      type: Type.STRING,
      description: 'A brief description of the quiz topic.'
    },
    questions: {
      type: Type.ARRAY,
      description: 'An array of quiz questions.',
      items: {
        type: Type.OBJECT,
        properties: {
          question: {
            type: Type.STRING,
            description: 'The text of the question.'
          },
          explanation: {
            type: Type.STRING,
            description: 'A brief explanation for why the correct answer is right.'
          },
          answers: {
            type: Type.ARRAY,
            description: 'An array of possible answers. Exactly one answer must be correct.',
            items: {
              type: Type.OBJECT,
              properties: {
                answer: {
                  type: Type.STRING,
                  description: 'The text of the answer option.'
                },
                correct: {
                  type: Type.BOOLEAN,
                  description: 'Whether this answer is the correct one.'
                }
              },
              required: ['answer', 'correct']
            }
          }
        },
        required: ['question', 'explanation', 'answers']
      }
    }
  },
  required: ['title', 'description', 'questions']
};

export const generateQuiz = async (prompt: string): Promise<Quiz> => {
    try {
        const fullPrompt = `Generate a multiple-choice quiz based on the following topic: "${prompt}". The quiz should be engaging and informative. Ensure there is only one correct answer per question. Format the output as a JSON object that adheres to the provided schema.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: fullPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: quizSchema,
            },
        });

        const jsonText = response.text.trim();
        const quizData = JSON.parse(jsonText);

        // Add unique IDs to questions and answers for React keys and state management
        const quizWithIds: Quiz = {
            ...quizData,
            questions: quizData.questions.map((q: any, qIndex: number) => ({
                ...q,
                id: `q-${qIndex}-${Date.now()}`,
                answers: q.answers.map((a: any, aIndex: number) => ({
                    ...a,
                    id: `a-${qIndex}-${aIndex}-${Date.now()}`,
                }))
            }))
        };
        
        return quizWithIds;

    } catch (error) {
        console.error("Error generating quiz:", error);
        throw new Error("Failed to generate quiz. The AI may be experiencing high demand. Please try again later.");
    }
};
