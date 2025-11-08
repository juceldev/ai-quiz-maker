// AI Quiz Maker - Backend Server
// To run this server:
// 1. Install dependencies: npm install express mysql2 cors dotenv
// 2. Create a .env file in the same directory with your database credentials.
// 3. Run the server: node server.js

const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Database Connection ---
// Example .env file:
// DB_HOST=localhost
// DB_USER=your_mysql_user
// DB_PASSWORD=your_mysql_password
// DB_DATABASE=your_quiz_database
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

// --- SQL Table Schemas (for reference) ---
/*
-- Use a tool like MySQL Workbench or the command line to run these queries
-- in your database to create the necessary tables.

CREATE TABLE `wp_quiz_aysquiz_quizcategories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `title` (`title`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `wp_quiz_aysquiz_quizes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `quiz_category_id` int(11) DEFAULT NULL,
  `create_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `quiz_category_id` (`quiz_category_id`),
  CONSTRAINT `wp_quiz_aysquiz_quizes_ibfk_1` FOREIGN KEY (`quiz_category_id`) REFERENCES `wp_quiz_aysquiz_quizcategories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `wp_quiz_aysquiz_questions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `quiz_id` int(11) NOT NULL,
  `question` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `explanation` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `quiz_id` (`quiz_id`),
  CONSTRAINT `wp_quiz_aysquiz_questions_ibfk_1` FOREIGN KEY (`quiz_id`) REFERENCES `wp_quiz_aysquiz_quizes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `wp_quiz_aysquiz_answers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `question_id` int(11) NOT NULL,
  `answer` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `correct` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `question_id` (`question_id`),
  CONSTRAINT `wp_quiz_aysquiz_answers_ibfk_1` FOREIGN KEY (`question_id`) REFERENCES `wp_quiz_aysquiz_questions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
*/

// --- API Routes ---

// GET and POST handlers for /api/categories
app.route('/api/categories')
    .get(async (req, res) => {
        try {
            const query = 'SELECT id, title FROM wp_quiz_aysquiz_quizcategories ORDER BY title ASC';
            const [rows] = await pool.query(query);
            res.json(rows);
        } catch (error) {
            console.error('Failed to fetch categories:', error);
            res.status(500).json({ message: 'Error fetching categories from the database.' });
        }
    })
    .post(async (req, res) => {
        const { title } = req.body;
        if (!title || typeof title !== 'string' || title.trim().length === 0) {
            return res.status(400).json({ message: 'Category title is required.' });
        }
        try {
            const [result] = await pool.execute(
                'INSERT INTO wp_quiz_aysquiz_quizcategories (title) VALUES (?)',
                [title.trim()]
            );
            const newCategory = { id: result.insertId, title: title.trim() };
            res.status(201).json(newCategory);
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ message: 'A category with this title already exists.' });
            }
            console.error('Failed to create category:', error);
            res.status(500).json({ message: 'Error creating category in the database.' });
        }
    });

// GET /api/published-content - Fetches categories with their quizzes
app.get('/api/published-content', async (req, res) => {
    try {
        const query = `
            SELECT 
                cat.id as category_id, 
                cat.title as category_title,
                q.id as quiz_id,
                q.title as quiz_title,
                q.description as quiz_description,
                q.create_date as quiz_create_date
            FROM wp_quiz_aysquiz_quizcategories cat
            LEFT JOIN wp_quiz_aysquiz_quizes q ON cat.id = q.quiz_category_id
            WHERE q.id IS NOT NULL
            ORDER BY cat.title, q.create_date DESC
        `;
        const [rows] = await pool.query(query);

        const categories = {};
        rows.forEach(row => {
            if (!categories[row.category_id]) {
                categories[row.category_id] = {
                    id: row.category_id,
                    title: row.category_title,
                    quizzes: [],
                };
            }
            categories[row.category_id].quizzes.push({
                id: row.quiz_id,
                title: row.quiz_title,
                description: row.quiz_description,
                create_date: row.quiz_create_date,
            });
        });

        res.json(Object.values(categories));
    } catch (error) {
        console.error('Failed to fetch published content:', error);
        res.status(500).json({ message: 'Error fetching content from the database.' });
    }
});


// GET /api/quizzes/:id - Fetches a single quiz with its questions and answers
app.get('/api/quizzes/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [quizRows] = await pool.query('SELECT title, description FROM wp_quiz_aysquiz_quizes WHERE id = ?', [id]);
        if (quizRows.length === 0) {
            return res.status(404).json({ message: 'Quiz not found.' });
        }
        
        const quizData = quizRows[0];
        
        const [questions] = await pool.query('SELECT id, question, explanation FROM wp_quiz_aysquiz_questions WHERE quiz_id = ? ORDER BY id ASC', [id]);

        if (questions.length === 0) {
             return res.json({ title: quizData.title, description: quizData.description, questions: [] });
        }
        
        const questionIds = questions.map(q => q.id);
        const [answers] = await pool.query(`SELECT id, question_id, answer, correct FROM wp_quiz_aysquiz_answers WHERE question_id IN (?)`, [questionIds]);

        const answerMap = {};
        answers.forEach(a => {
            if (!answerMap[a.question_id]) {
                answerMap[a.question_id] = [];
            }
            answerMap[a.question_id].push({ ...a, correct: !!a.correct, id: `a-db-${a.id}` });
        });

        const assembledQuestions = questions.map(q => ({
            ...q,
            id: `q-db-${q.id}`,
            answers: answerMap[q.id] || []
        }));

        res.json({
            title: quizData.title,
            description: quizData.description,
            questions: assembledQuestions,
        });

    } catch (error) {
        console.error(`Failed to fetch quiz ${id}:`, error);
        res.status(500).json({ message: 'Error fetching quiz details.' });
    }
});


// POST /api/quizzes - Creates a new quiz, with its questions and answers
app.post('/api/quizzes', async (req, res) => {
    const { title, description, questions, categoryName } = req.body;
    
    if (!title || !questions || !Array.isArray(questions) || !categoryName) {
        return res.status(400).json({ message: 'Invalid quiz data provided. Title, questions, and categoryName are required.' });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // 1. Find or create the category
        let categoryId;
        const [categoryRows] = await connection.execute('SELECT id FROM wp_quiz_aysquiz_quizcategories WHERE title = ?', [categoryName]);
        
        if (categoryRows.length > 0) {
            categoryId = categoryRows[0].id;
        } else {
            const [categoryResult] = await connection.execute('INSERT INTO wp_quiz_aysquiz_quizcategories (title) VALUES (?)', [categoryName]);
            categoryId = categoryResult.insertId;
        }

        // 2. Insert the main quiz entry
        const [quizResult] = await connection.execute(
            'INSERT INTO wp_quiz_aysquiz_quizes (title, description, quiz_category_id) VALUES (?, ?, ?)',
            [title, description, categoryId]
        );
        const quizId = quizResult.insertId;

        // 3. Loop through questions and insert them with the quizId
        for (const q of questions) {
            const [questionResult] = await connection.execute(
                'INSERT INTO wp_quiz_aysquiz_questions (quiz_id, question, explanation) VALUES (?, ?, ?)',
                [quizId, q.question, q.explanation]
            );
            const questionId = questionResult.insertId;

            // 4. Loop through answers for the current question and insert them
            if (q.answers && q.answers.length > 0) {
                const answerValues = q.answers.map(a => [questionId, a.answer, a.correct]);
                await connection.query(
                    'INSERT INTO wp_quiz_aysquiz_answers (question_id, answer, correct) VALUES ?',
                    [answerValues]
                );
            }
        }

        await connection.commit();
        res.status(201).json({ message: 'Quiz published successfully!', quizId: quizId });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Failed to publish quiz:', error);
        res.status(500).json({ message: 'Database error while publishing quiz.' });
    } finally {
        if (connection) connection.release();
    }
});


// --- Start Server ---
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});