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

function validateRegistrationInput(body, requireConfirmation = false) {
  const { name, email, password, confirmPassword } = body || {};

  if (
    typeof name !== 'string' ||
    !name.trim() ||
    typeof email !== 'string' ||
    !email.trim() ||
    typeof password !== 'string' ||
    !password
  ) {
    throw validationError('Name, email, and password are required');
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!emailPattern.test(normalizedEmail)) {
    throw validationError('A valid email address is required');
  }

  if (password.length < minimumPasswordLength) {
    throw validationError(
      `Password must be at least ${minimumPasswordLength} characters long`
    );
  }

  if (requireConfirmation && password !== confirmPassword) {
    throw validationError('Passwords do not match');
  }

  return {
    name: name.trim(),
    email: normalizedEmail,
    password,
  };
}

async function createUser(res, next, details, role) {
  try {
    const passwordHash = await bcrypt.hash(details.password, 10);
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [details.name, details.email, passwordHash, role]
    );

    return res.status(201).json({
      id: result.insertId,
      name: details.name,
      email: details.email,
      role,
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'An account with that email already exists' });
    }

    return next(error);
  }
}

router.post('/register', async (req, res, next) => {
  try {
    const details = validateRegistrationInput(req.body);
    return await createUser(res, next, details, 'customer');
  } catch (error) {
    return next(error);
  }
});

router.post('/register/agent', async (req, res, next) => {
  try {
    const details = validateRegistrationInput(req.body, true);
    return await createUser(res, next, details, 'agent');
  } catch (error) {
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
