const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
const { email, password } = req.body;

const adminEmail = (process.env.ADMIN_EMAIL || '').trim();
const adminPass  = (process.env.ADMIN_PASS  || '').trim();

if (email !== adminEmail || password !== adminPass) {
  return res.status(401).json({ message: 'Invalid credentials' });
}

  const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token });
});

module.exports = router;