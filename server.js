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

// --- SQL Table Schemas (for reference based on user provided schema) ---
/*
CREATE TABLE `wp_quiz_aysquiz_categories` (
  `id` int(16) UNSIGNED NOT NULL AUTO_INCREMENT,
  `author_id` int(16) UNSIGNED NOT NULL DEFAULT 0,
  `title` varchar(256) NOT NULL,
  `description` text NOT NULL,
  `published` tinyint(3) UNSIGNED NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

CREATE TABLE `wp_quiz_aysquiz_quizcategories` (
  `id` int(16) UNSIGNED NOT NULL AUTO_INCREMENT,
  `author_id` int(16) UNSIGNED NOT NULL DEFAULT 0,
  `title` varchar(256) NOT NULL,
  `description` text NOT NULL,
  `published` tinyint(1) UNSIGNED NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

CREATE TABLE `wp_quiz_aysquiz_quizes` (
  `id` int(16) UNSIGNED NOT NULL AUTO_INCREMENT,
  `author_id` int(16) UNSIGNED NOT NULL DEFAULT 0,
  `title` varchar(256) NOT NULL,
  `description` text NOT NULL,
  `quiz_image` text DEFAULT NULL,
  `quiz_category_id` int(11) UNSIGNED NOT NULL,
  `question_ids` text NOT NULL,
  `ordering` int(16) NOT NULL,
  `quiz_url` text DEFAULT NULL,
  `published` tinyint(3) UNSIGNED NOT NULL,
  `create_date` datetime DEFAULT NULL,
  `custom_post_id` int(16) UNSIGNED DEFAULT NULL,
  `options` text DEFAULT NULL,
  `intervals` text DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

CREATE TABLE `wp_quiz_aysquiz_questions` (
  `id` int(16) UNSIGNED NOT NULL AUTO_INCREMENT,
  `author_id` int(16) UNSIGNED NOT NULL DEFAULT 0,
  `category_id` int(16) UNSIGNED NOT NULL,
  `question` text NOT NULL,
  `explanation` text DEFAULT NULL,
  `type` varchar(256) NOT NULL,
  `published` tinyint(3) UNSIGNED NOT NULL,
  `create_date` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
  -- Other columns from schema omitted for brevity as they are not used by the app
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

CREATE TABLE `wp_quiz_aysquiz_answers` (
  `id` int(150) UNSIGNED NOT NULL AUTO_INCREMENT,
  `question_id` int(11) UNSIGNED NOT NULL,
  `answer` text NOT NULL,
  `correct` tinyint(1) NOT NULL,
  `ordering` int(11) NOT NULL,
  PRIMARY KEY (`id`)
  -- Other columns from schema omitted for brevity as they are not used by the app
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;
*/

// --- API Routes ---

// GET and POST handlers for /api/categories
app.route('/api/categories')
    .get(async (req, res) => {
        try {
            const query = 'SELECT id, title FROM wp_quiz_aysquiz_quizcategories WHERE published = 1 ORDER BY title ASC';
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

        let connection;
        try {
            connection = await pool.getConnection();
            await connection.beginTransaction();

            const trimmedTitle = title.trim();

            // 1. Insert into quiz categories table
            const [result] = await connection.execute(
                'INSERT INTO wp_quiz_aysquiz_quizcategories (title, published, author_id, description) VALUES (?, ?, ?, ?)',
                [trimmedTitle, 1, 0, '']
            );
            
            // 2. To keep things consistent, also add to the question categories table if it doesn't exist
            const [existingQuestionCat] = await connection.execute('SELECT id FROM wp_quiz_aysquiz_categories WHERE title = ?', [trimmedTitle]);
            if (existingQuestionCat.length === 0) {
                await connection.execute(
                    'INSERT INTO wp_quiz_aysquiz_categories (title, published, author_id, description) VALUES (?, ?, ?, ?)',
                    [trimmedTitle, 1, 0, '']
                );
            }

            await connection.commit();
            
            const newCategory = { id: result.insertId, title: trimmedTitle };
            res.status(201).json(newCategory);

        } catch (error) {
            if (connection) await connection.rollback();
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ message: 'A category with this title already exists.' });
            }
            console.error('Failed to create category:', error);
            res.status(500).json({ message: 'Error creating category in the database.' });
        } finally {
            if (connection) connection.release();
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
            JOIN wp_quiz_aysquiz_quizes q ON cat.id = q.quiz_category_id
            WHERE q.published = 1 AND cat.published = 1
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
        const [quizRows] = await pool.query('SELECT title, description, question_ids FROM wp_quiz_aysquiz_quizes WHERE id = ?', [id]);
        if (quizRows.length === 0) {
            return res.status(404).json({ message: 'Quiz not found.' });
        }
        
        const quizData = quizRows[0];

        if (!quizData.question_ids) {
            return res.json({ title: quizData.title, description: quizData.description, questions: [] });
        }

        const questionIds = quizData.question_ids.split(',').map(idStr => parseInt(idStr.trim(), 10)).filter(idNum => !isNaN(idNum));
        
        if (questionIds.length === 0) {
             return res.json({ title: quizData.title, description: quizData.description, questions: [] });
        }
        
        const [questions] = await pool.query('SELECT id, question, explanation FROM wp_quiz_aysquiz_questions WHERE id IN (?)', [questionIds]);
        const [answers] = await pool.query(`SELECT id, question_id, answer, correct FROM wp_quiz_aysquiz_answers WHERE question_id IN (?)`, [questionIds]);

        const answerMap = {};
        answers.forEach(a => {
            if (!answerMap[a.question_id]) {
                answerMap[a.question_id] = [];
            }
            // Add ordering to make sure answers are displayed consistently, if not provided, use id.
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

        // 1. Find or create the QUIZ category
        let quizCategoryId;
        const [categoryRows] = await connection.execute('SELECT id FROM wp_quiz_aysquiz_quizcategories WHERE title = ?', [categoryName]);
        
        if (categoryRows.length > 0) {
            quizCategoryId = categoryRows[0].id;
        } else {
            const [categoryResult] = await connection.execute(
                'INSERT INTO wp_quiz_aysquiz_quizcategories (title, published, author_id, description) VALUES (?, ?, ?, ?)', 
                [categoryName, 1, 0, '']
            );
            quizCategoryId = categoryResult.insertId;
        }
        
        // 2. Find or create the corresponding QUESTION category
        let questionCategoryId;
        const [questionCategoryRows] = await connection.execute('SELECT id FROM wp_quiz_aysquiz_categories WHERE title = ?', [categoryName]);
        if (questionCategoryRows.length > 0) {
            questionCategoryId = questionCategoryRows[0].id;
        } else {
            // This also handles syncing if a quiz category exists but a question category doesn't
            const [questionCategoryResult] = await connection.execute(
                'INSERT INTO wp_quiz_aysquiz_categories (title, published, author_id, description) VALUES (?, ?, ?, ?)',
                [categoryName, 1, 0, '']
            );
            questionCategoryId = questionCategoryResult.insertId;
        }

        // 3. Insert all questions and collect their new IDs
        const newQuestionIds = [];
        for (const q of questions) {
            const [questionResult] = await connection.execute(
                'INSERT INTO wp_quiz_aysquiz_questions (question, explanation, published, type, category_id, author_id) VALUES (?, ?, ?, ?, ?, ?)',
                [q.question, q.explanation, 1, 'radio', questionCategoryId, 0]
            );
            const questionId = questionResult.insertId;
            newQuestionIds.push(questionId);

            // 4. Loop through answers for the current question and insert them
            if (q.answers && q.answers.length > 0) {
                 const answerValues = q.answers.map((a, index) => [questionId, a.answer, a.correct, index + 1]);
                await connection.query(
                    'INSERT INTO wp_quiz_aysquiz_answers (question_id, answer, correct, ordering) VALUES ?',
                    [answerValues]
                );
            }
        }
        
        // 5. Join the new question IDs into a comma-separated string
        const questionIdsString = newQuestionIds.join(',');
        const createDate = new Date().toISOString().slice(0, 19).replace('T', ' ');


        // 6. Insert the main quiz entry with the string of question IDs
        const [quizResult] = await connection.execute(
            'INSERT INTO wp_quiz_aysquiz_quizes (title, description, quiz_category_id, published, question_ids, ordering, author_id, create_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [title, description, quizCategoryId, 1, questionIdsString, 1, 0, createDate]
        );
        const quizId = quizResult.insertId;


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