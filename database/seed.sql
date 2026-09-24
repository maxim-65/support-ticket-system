USE support_tickets;

INSERT INTO users (id, name, email, password_hash, role)
VALUES
  (
    1,
    'Asha Customer',
    'asha.customer@example.com',
    '$2b$10$0HoKvhFpTzFBrKvYFbSCJe4cCkjPip1.tWo7VY6yqBlgHjznv.QNC',
    'customer'
  ),
  (
    2,
    'Ravi Support Agent',
    'ravi.agent@example.com',
    '$2b$10$FxW0OqfRbymoV9qM5O86sOlIW3/TRi3HHqE7X/ik4Y/GxPGhAMMvu',
    'agent'
  );

INSERT INTO tickets (
  id,
  user_id,
  subject,
  description,
  priority,
  status,
  assigned_to
)
VALUES (
  1,
  1,
  'Unable to download monthly invoice',
  'The invoice download link returns an error for the latest billing period.',
  'medium',
  'open',
  2
);

INSERT INTO ticket_comments (ticket_id, user_id, comment)
VALUES (
  1,
  2,
  'Thanks for reporting this. I am checking the invoice service now.'
);
