import bcrypt from 'bcryptjs';
import express from 'express';
import { query } from '../config/db.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT u.id, u.name, u.email, u.role, u.department_id, d.name AS department_name,
              u.ward, u.pincode_coverage, u.area_coverage, u.availability_status,
              u.response_rate, u.resolved_cases, u.created_at
       FROM users u
       LEFT JOIN departments d ON d.id = u.department_id
       ORDER BY u.created_at DESC`
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { name, email, password, role, department_id, ward, pincode_coverage, area_coverage, availability_status } = req.body;
    const passwordHash = await bcrypt.hash(password || 'password123', 10);
    const { rows } = await query(
      `INSERT INTO users (name, email, password_hash, role, department_id, ward, pincode_coverage, area_coverage, availability_status)
       VALUES ($1, LOWER($2), $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, name, email, role, department_id, ward, pincode_coverage, area_coverage, availability_status, created_at`,
      [
        name, email, passwordHash, role || 'citizen', department_id || null,
        ward || null,
        Array.isArray(pincode_coverage) ? pincode_coverage : (pincode_coverage ? String(pincode_coverage).split(',').map((s) => s.trim()) : []),
        Array.isArray(area_coverage) ? area_coverage : (area_coverage ? String(area_coverage).split(',').map((s) => s.trim()) : []),
        availability_status || 'Available'
      ]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { name, role, department_id, ward, pincode_coverage, area_coverage, availability_status } = req.body;
    const { rows } = await query(
      `UPDATE users
       SET name = COALESCE($1, name),
           role = COALESCE($2, role),
           department_id = $3,
           ward = COALESCE($4, ward),
           pincode_coverage = COALESCE($5, pincode_coverage),
           area_coverage = COALESCE($6, area_coverage),
           availability_status = COALESCE($7, availability_status)
       WHERE id = $8
       RETURNING id, name, email, role, department_id, ward, pincode_coverage, area_coverage, availability_status, created_at`,
      [
        name || null, role || null, department_id || null,
        ward || null,
        pincode_coverage ? (Array.isArray(pincode_coverage) ? pincode_coverage : String(pincode_coverage).split(',').map((s) => s.trim())) : null,
        area_coverage ? (Array.isArray(area_coverage) ? area_coverage : String(area_coverage).split(',').map((s) => s.trim())) : null,
        availability_status || null,
        req.params.id
      ]
    );
    if (!rows[0]) return res.status(404).json({ message: 'User not found' });
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: 'Admins cannot delete their own account' });
    }
    await query(`DELETE FROM users WHERE id = $1`, [req.params.id]);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
