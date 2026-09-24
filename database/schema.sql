CREATE DATABASE IF NOT EXISTS support_tickets
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE support_tickets;

DROP TABLE IF EXISTS ticket_comments;
DROP TABLE IF EXISTS tickets;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('customer', 'agent') NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE tickets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  subject VARCHAR(200) NOT NULL,
  description TEXT,
  priority ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium',
  status ENUM('open', 'in_progress', 'closed') NOT NULL DEFAULT 'open',
  assigned_to INT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_tickets_customer
    FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_tickets_agent
    FOREIGN KEY (assigned_to) REFERENCES users(id)
    ON DELETE SET NULL,
  INDEX idx_status (status),
  INDEX idx_tickets_user_id (user_id),
  INDEX idx_tickets_assigned_to (assigned_to),
  INDEX idx_tickets_created_at (created_at)
) ENGINE=InnoDB;

CREATE TABLE ticket_comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ticket_id INT NOT NULL,
  user_id INT NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_comments_ticket
    FOREIGN KEY (ticket_id) REFERENCES tickets(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_comments_user
    FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_comments_ticket_id (ticket_id),
  INDEX idx_comments_user_id (user_id),
  INDEX idx_comments_created_at (created_at)
) ENGINE=InnoDB;

-- Required query: return open tickets with the customer name and email.
-- SELECT tickets.id, tickets.subject, tickets.status,
--        users.name AS customer_name, users.email
-- FROM tickets
-- JOIN users ON tickets.user_id = users.id
-- WHERE tickets.status = 'open';
