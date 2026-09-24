const express = require('express');

const pool = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, requireRole('agent'), async (req, res, next) => {
  try {
    const [users] = await pool.execute(
      `SELECT id, name, email, role, created_at
       FROM users
       WHERE role = ?
       ORDER BY name ASC`,
      ['agent']
    );

    return res.json(users);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
