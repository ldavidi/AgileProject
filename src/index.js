const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// PostgreSQL connection pool
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'Miluim Family DB',
    password: '12345678',
    port: 5432,
});

// Routes
app.get('/tasks', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM tasks');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/tasks', async (req, res) => {
    const { name, executor, date, time, color, completed } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO tasks (name, executor, date, time, color, completed) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [name, executor, date, time, color, completed]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.put('/tasks/:id', async (req, res) => {
    const { id } = req.params;
    const { name, executor, date, time, color, completed } = req.body;
    try {
        const result = await pool.query(
            'UPDATE tasks SET name = $1, executor = $2, date = $3, time = $4, color = $5, completed = $6 WHERE id = $7 RETURNING *',
            [name, executor, date, time, color, completed, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.delete('/tasks/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});