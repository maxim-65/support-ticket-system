const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const pool = require('../db');

const router = express.Router();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const minimumPasswordLength = 8;

function validationError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

router.post('/register', async (req, res, next) => {
  const { name, email, password } = req.body || {};

  if (
    typeof name !== 'string' ||
    !name.trim() ||
    typeof email !== 'string' ||
    !email.trim() ||
    typeof password !== 'string' ||
    !password
  ) {
    return next(validationError('Name, email, and password are required'));
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!emailPattern.test(normalizedEmail)) {
    return next(validationError('A valid email address is required'));
  }

  if (password.length < minimumPasswordLength) {
    return next(
      validationError(`Password must be at least ${minimumPasswordLength} characters long`)
    );
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name.trim(), normalizedEmail, passwordHash, 'customer']
    );

    return res.status(201).json({
      id: result.insertId,
      name: name.trim(),
      email: normalizedEmail,
      role: 'customer',
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'An account with that email already exists' });
    }

    return next(error);
  }
});

router.post('/login', async (req, res, next) => {
  const { email, password } = req.body || {};
  const invalidCredentials = { error: 'Invalid email or password' };

  if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
    return res.status(401).json(invalidCredentials);
  }

  try {
    const [users] = await pool.execute(
      'SELECT id, name, email, password_hash, role FROM users WHERE email = ? LIMIT 1',
      [email.trim().toLowerCase()]
    );
    const user = users[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json(invalidCredentials);
    }

    if (!process.env.JWT_SECRET) {
      return next(new Error('JWT_SECRET is not configured'));
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
