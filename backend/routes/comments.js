const express = require('express');

const pool = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

function isPositiveInteger(value) {
  return Number.isInteger(Number(value)) && Number(value) > 0;
}

async function getAccessibleTicket(ticketId, user) {
  const [tickets] = await pool.execute(
    'SELECT id, user_id FROM tickets WHERE id = ?',
    [ticketId]
  );
  const ticket = tickets[0];

  if (!ticket) {
    return { status: 404, error: 'Ticket not found' };
  }

  if (user.role !== 'agent' && ticket.user_id !== user.id) {
    return { status: 403, error: 'Forbidden' };
  }

  return { ticket };
}

router.get('/:id/comments', authenticate, async (req, res, next) => {
  if (!isPositiveInteger(req.params.id)) {
    return res.status(404).json({ error: 'Ticket not found' });
  }

  try {
    const access = await getAccessibleTicket(req.params.id, req.user);
    if (access.error) {
      return res.status(access.status).json({ error: access.error });
    }

    const [comments] = await pool.execute(
      `SELECT
         c.id,
         c.ticket_id,
         c.user_id,
         c.comment,
         c.created_at,
         u.name AS author_name,
         u.email AS author_email,
         u.role AS author_role
       FROM ticket_comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.ticket_id = ?
       ORDER BY c.created_at ASC, c.id ASC`,
      [req.params.id]
    );

    return res.json(comments);
  } catch (error) {
    return next(error);
  }
});

router.post('/:id/comments', authenticate, async (req, res, next) => {
  const { comment } = req.body || {};

  if (!isPositiveInteger(req.params.id)) {
    return res.status(404).json({ error: 'Ticket not found' });
  }

  if (typeof comment !== 'string' || !comment.trim()) {
    return res.status(400).json({ error: 'Comment text is required' });
  }

  try {
    const access = await getAccessibleTicket(req.params.id, req.user);
    if (access.error) {
      return res.status(access.status).json({ error: access.error });
    }

    const [result] = await pool.execute(
      'INSERT INTO ticket_comments (ticket_id, user_id, comment) VALUES (?, ?, ?)',
      [req.params.id, req.user.id, comment.trim()]
    );

    const [comments] = await pool.execute(
      `SELECT
         c.id,
         c.ticket_id,
         c.user_id,
         c.comment,
         c.created_at,
         u.name AS author_name,
         u.email AS author_email,
         u.role AS author_role
       FROM ticket_comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.id = ?`,
      [result.insertId]
    );

    return res.status(201).json(comments[0]);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
