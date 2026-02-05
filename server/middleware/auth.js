export function requireAuth(req, res, next) {
  if (req.isAuthenticated?.() && req.user) {
    return next();
  }
  res.status(401).json({ error: 'Authentication required' });
}
