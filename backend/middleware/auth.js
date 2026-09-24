const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
  const authorization = req.get('Authorization');

  if (!authorization || !authorization.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authorization.slice('Bearer '.length).trim();
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (!process.env.JWT_SECRET) {
    return next(new Error('JWT_SECRET is not configured'));
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.user.role !== role) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    return next();
  };
}

module.exports = { authenticate, requireRole };
