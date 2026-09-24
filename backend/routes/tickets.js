const express = require('express');

const pool = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();
const priorities = ['low', 'medium', 'high'];
const statuses = ['open', 'in_progress', 'closed'];
const sortFields = {
  created_at: 't.created_at',
  updated_at: 't.updated_at',
  priority: 't.priority',
  status: 't.status',
};
const sortDirections = {
  asc: 'ASC',
  desc: 'DESC',
};

function isPositiveInteger(value) {
  return Number.isInteger(Number(value)) && Number(value) > 0;
}

function ticketSelect() {
  return `
    SELECT
      t.id,
      t.user_id,
      t.subject,
      t.description,
      t.priority,
      t.status,
      t.assigned_to,
      t.created_at,
      t.updated_at,
      customer.name AS customer_name,
      customer.email AS customer_email,
      agent.name AS agent_name
    FROM tickets t
    JOIN users customer ON t.user_id = customer.id
    LEFT JOIN users agent ON t.assigned_to = agent.id
  `;
}

router.post('/', authenticate, async (req, res, next) => {
  const { subject, description, priority } = req.body || {};

  if (
    typeof subject !== 'string' ||
    !subject.trim() ||
    typeof description !== 'string' ||
    !description.trim() ||
    typeof priority !== 'string' ||
    !priorities.includes(priority)
  ) {
    return res.status(400).json({
      error: 'Subject, description, and a valid priority are required',
    });
  }

  try {
    const [result] = await pool.execute(
      `INSERT INTO tickets (user_id, subject, description, priority, status)
       VALUES (?, ?, ?, ?, 'open')`,
      [req.user.id, subject.trim(), description.trim(), priority]
    );

    const [tickets] = await pool.execute(
      `${ticketSelect()} WHERE t.id = ?`,
      [result.insertId]
    );

    return res.status(201).json(tickets[0]);
  } catch (error) {
    return next(error);
  }
});

router.get('/', authenticate, async (req, res, next) => {
  const {
    status,
    priority,
    search,
    sortBy = 'created_at',
    sortOrder = 'desc',
  } = req.query;
  const conditions = [];
  const values = [];

  if (!Object.prototype.hasOwnProperty.call(sortFields, sortBy)) {
    return res.status(400).json({ error: 'Invalid sort field' });
  }

  if (!Object.prototype.hasOwnProperty.call(sortDirections, sortOrder)) {
    return res.status(400).json({ error: 'Invalid sort order' });
  }

  if (req.user.role !== 'agent') {
    conditions.push('t.user_id = ?');
    values.push(req.user.id);
  }

  if (status !== undefined) {
    if (!statuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status filter' });
    }
    conditions.push('t.status = ?');
    values.push(status);
  }

  if (priority !== undefined) {
    if (!priorities.includes(priority)) {
      return res.status(400).json({ error: 'Invalid priority filter' });
    }
    conditions.push('t.priority = ?');
    values.push(priority);
  }

  if (search !== undefined) {
    if (typeof search !== 'string' || !search.trim()) {
      return res.status(400).json({ error: 'Search must not be empty' });
    }
    conditions.push('(t.subject LIKE ? OR t.description LIKE ?)');
    const searchValue = `%${search.trim()}%`;
    values.push(searchValue, searchValue);
  }

  const whereClause = conditions.length ? ` WHERE ${conditions.join(' AND ')}` : '';

  try {
    const [tickets] = await pool.execute(
      `${ticketSelect()}${whereClause} ORDER BY ${sortFields[sortBy]} ${sortDirections[sortOrder]}`,
      values
    );
    return res.json(tickets);
  } catch (error) {
    return next(error);
  }
});

router.get('/:id', authenticate, async (req, res, next) => {
  if (!isPositiveInteger(req.params.id)) {
    return res.status(404).json({ error: 'Ticket not found' });
  }

  try {
    const [tickets] = await pool.execute(
      `${ticketSelect()} WHERE t.id = ?`,
      [req.params.id]
    );
    const ticket = tickets[0];

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    if (req.user.role !== 'agent' && ticket.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    return res.json(ticket);
  } catch (error) {
    return next(error);
  }
});

router.put('/:id', authenticate, requireRole('agent'), async (req, res, next) => {
  const { status, priority, assigned_to: assignedTo } = req.body || {};

  if (!isPositiveInteger(req.params.id)) {
    return res.status(404).json({ error: 'Ticket not found' });
  }

  if (
    status === undefined &&
    priority === undefined &&
    assignedTo === undefined
  ) {
    return res.status(400).json({ error: 'At least one field is required' });
  }

  if (status !== undefined && !statuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  if (priority !== undefined && !priorities.includes(priority)) {
    return res.status(400).json({ error: 'Invalid priority' });
  }

  if (
    assignedTo !== undefined &&
    assignedTo !== null &&
    !isPositiveInteger(assignedTo)
  ) {
    return res.status(400).json({ error: 'assigned_to must be an agent ID or null' });
  }

  try {
    const [existingTickets] = await pool.execute(
      'SELECT id FROM tickets WHERE id = ?',
      [req.params.id]
    );

    if (!existingTickets[0]) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    if (assignedTo !== undefined && assignedTo !== null) {
      const [agents] = await pool.execute(
        'SELECT id FROM users WHERE id = ? AND role = ?',
        [assignedTo, 'agent']
      );
      if (!agents[0]) {
        return res.status(400).json({ error: 'assigned_to must refer to an agent' });
      }
    }

    const updates = [];
    const values = [];
    if (status !== undefined) {
      updates.push('status = ?');
      values.push(status);
    }
    if (priority !== undefined) {
      updates.push('priority = ?');
      values.push(priority);
    }
    if (assignedTo !== undefined) {
      updates.push('assigned_to = ?');
      values.push(assignedTo);
    }
    values.push(req.params.id);

    await pool.execute(
      `UPDATE tickets SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    const [tickets] = await pool.execute(
      `${ticketSelect()} WHERE t.id = ?`,
      [req.params.id]
    );
    return res.json(tickets[0]);
  } catch (error) {
    return next(error);
  }
});

// Deletion is agent-only so customers cannot remove support history or tickets.
router.delete('/:id', authenticate, requireRole('agent'), async (req, res, next) => {
  if (!isPositiveInteger(req.params.id)) {
    return res.status(404).json({ error: 'Ticket not found' });
  }

  try {
    const [result] = await pool.execute(
      'DELETE FROM tickets WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
