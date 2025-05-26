const express = require('express');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
app.use(express.json());

// Налаштування підключення до БД
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// POST /register
app.post('/register', async (req, res) => {
  const { device_name, serial_number } = req.body;
  if (!device_name || !serial_number) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const [existing] = await pool.query('SELECT * FROM devices WHERE serial_number = ?', [serial_number]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Device already exists' });
    }
    await pool.query('INSERT INTO devices (device_name, serial_number) VALUES (?, ?)', [device_name, serial_number]);
    res.status(200).json({ message: 'Device registered successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /devices
app.get('/devices', async (req, res) => {
  try {
    const [devices] = await pool.query('SELECT device_name, serial_number FROM devices');
    res.status(200).json(devices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /take
app.post('/take', async (req, res) => {
  const { user_name, serial_number } = req.body;
  if (!user_name || !serial_number) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const [device] = await pool.query('SELECT * FROM devices WHERE serial_number = ?', [serial_number]);
    if (device.length === 0) {
      return res.status(404).json({ error: 'Device not found' });
    }
    if (device[0].user_name) {
      return res.status(400).json({ error: 'Device is already in use' });
    }
    await pool.query('UPDATE devices SET user_name = ? WHERE serial_number = ?', [user_name, serial_number]);
    res.status(200).json({ message: 'Device taken successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /devices/:serial_number
app.get('/devices/:serial_number', async (req, res) => {
  const { serial_number } = req.params;
  try {
    const [device] = await pool.query('SELECT device_name, user_name FROM devices WHERE serial_number = ?', [serial_number]);
    if (device.length === 0) {
      return res.status(404).json({ error: 'Device not found' });
    }
    res.status(200).json(device[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});