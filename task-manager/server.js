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

// Fetch all tasks
app.get('/tasks', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM tasks');
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add task
app.post('/tasks', async (req, res) => {
    const { name, executor, date, time, color, attachment, completed } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO tasks (name, executor, date, time, color, attachment, completed) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [name, executor, date, time, color, attachment, completed]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Edit task
app.put('/tasks/:id', async (req, res) => {
    const { name, executor, date, time, color, attachment, completed } = req.body;
    const { id } = req.params;
    try {
        const result = await pool.query(
            'UPDATE tasks SET name = $1, executor = $2, date = $3, time = $4, color = $5, attachment = $6, completed = $7 WHERE id = $8 RETURNING *',
            [name, executor, date, time, color, attachment, completed, id]
        );
        res.status(200).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete task
app.delete('/tasks/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
        res.status(200).send();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});