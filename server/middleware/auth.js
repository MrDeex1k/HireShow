const jwt = require('jsonwebtoken');
const { expressjwt: expressJwt } = require('express-jwt');

const JWT_SECRET = process.env.JWT_SECRET;

// Middleware do weryfikacji JWT
const verifyToken = expressJwt({
  secret: JWT_SECRET,
  algorithms: ['HS256'],
  getToken: (req) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    return null;
  }
});

// Funkcja do generowania JWT
const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: '1h'
  });
};

// Middleware do weryfikacji ról
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.auth) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userRole = req.auth.role;
    if (!roles.includes(userRole)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    next();
  };
};

// Middleware do weryfikacji typu subskrypcji dla klientów
const requireSubscription = (allowedSubscriptions) => {
  return (req, res, next) => {
    if (!req.auth) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.auth.role === 'admin') {
      return next();
    }

    if (req.auth.role !== 'client') {
      return res.status(403).json({ error: 'This endpoint is for clients only' });
    }

    if (!allowedSubscriptions.includes(req.auth.subscription_type)) {
      return res.status(403).json({ 
        error: 'Subscription upgrade required',
        current_subscription: req.auth.subscription_type,
        required_subscription: allowedSubscriptions
      });
    }

    if (req.auth.subscription_expiry && new Date() > new Date(req.auth.subscription_expiry)) {
      return res.status(403).json({ 
        error: 'Subscription expired',
        expired_date: req.auth.subscription_expiry
      });
    }

    next();
  };
};

module.exports = {
  verifyToken,
  generateToken,
  requireRole,
  requireSubscription
};
