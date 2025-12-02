// auth.js
// Auth súper simple basada en PIN + tokens en memoria

const crypto = require('crypto');

const sessions = new Map(); // token -> { role, createdAt }

function createSession(role) {
  const token = crypto.randomUUID();
  sessions.set(token, {
    role,
    createdAt: new Date().toISOString()
  });
  return token;
}

function getSessionFromRequest(req) {
  const authHeader = req.headers['authorization'] || '';
  if (!authHeader.startsWith('Bearer ')) return null;

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) return null;

  const session = sessions.get(token);
  if (!session) return null;

  return { ...session, token };
}

// Middleware: mete la sesión (si existe) en req.session
function sessionMiddleware(req, res, next) {
  req.session = getSessionFromRequest(req);
  next();
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.session || req.session.role !== role) {
      return res.status(401).json({ error: 'No autorizado' });
    }
    next();
  };
}

function requireAnyRole(roles) {
  return (req, res, next) => {
    if (!req.session || !roles.includes(req.session.role)) {
      return res.status(401).json({ error: 'No autorizado' });
    }
    next();
  };
}

module.exports = {
  createSession,
  sessionMiddleware,
  requireRole,
  requireAnyRole
};

