import bcrypt from 'bcryptjs';
import express from 'express';
import { query } from '../config/db.js';
import { authenticate } from '../middleware/auth.js';
import { signToken } from '../utils/tokens.js';

const router = express.Router();

async function passwordMatches(plain, hash) {
  if (!plain || !hash) return false;
  try {
    if (await bcrypt.compare(plain, hash)) return true;
  } catch {
    /* bcrypt hash from register */
  }
  const { rows } = await query(
    'SELECT (crypt($1, $2) = $2) AS valid FROM users LIMIT 1',
    [plain, hash]
  );
  return rows[0]?.valid === true;
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    department_id: user.department_id
  };
}

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const { rows } = await query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, LOWER($2), $3, 'citizen')
       RETURNING id, name, email, role, department_id`,
      [name, email, passwordHash]
    );
    const user = rows[0];
    res.status(201).json({ user, token: signToken(user) });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ message: 'Email already registered' });
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { rows } = await query(
      `SELECT id, name, email, password_hash, role, department_id FROM users WHERE email = LOWER($1)`,
      [email]
    );
    const user = rows[0];
    if (!user || !(await passwordMatches(password, user.password_hash))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    res.json({ user: publicUser(user), token: signToken(user) });
  } catch (error) {
    next(error);
  }
});

router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

export default router;
