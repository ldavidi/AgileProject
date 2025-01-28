const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors'); 
const { Pool } = require('pg');

const app = express();
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'Miluim Family DB',
    password: '12345678',
    port: 5432,
});

app.use(bodyParser.json());
app.use(cors());

app.get('/tasks', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id, 
                   name, 
                   executor, 
                   TO_CHAR(date, 'YYYY-MM-DD') AS date, 
                   TO_CHAR(time, 'HH24:MI') AS time, 
                   color, 
                   attachment, 
                   completed 
            FROM tasks
        `);
        const tasks = result.rows;
        console.log("Tasks fetched from DB:", tasks); // Debugging statement
        res.status(200).json(tasks);
    } catch (err) {
        console.error("Error fetching tasks:", err); // Debugging
        res.status(500).json({ error: err.message });
    }
});

app.post('/tasks', async (req, res) => {
    const { name, executor, date, time, color, attachment = null, completed = false } = req.body;
    console.log("Task to be added:", { name, executor, date, time, color, attachment, completed }); // Debugging
    try {
        const result = await pool.query(
            `
            INSERT INTO tasks (name, executor, date, time, color, attachment, completed) 
            VALUES ($1, $2, $3, $4, $5, $6, $7) 
            RETURNING id, name, executor, TO_CHAR(date, 'YYYY-MM-DD') AS date, TO_CHAR(time, 'HH24:MI:SS') AS time, color, attachment, completed
            `,
            [name, executor, date, time, color, attachment, completed]
        );
        console.log("Task added to DB:", result.rows[0]); // Debugging
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error("Error adding task:", err); // Debugging
        res.status(500).json({ error: err.message });
    }
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});