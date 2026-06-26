import express from 'express';
import { query } from '../config/db.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT d.*, COUNT(u.id)::int AS officer_count
       FROM departments d
       LEFT JOIN users u ON u.department_id = d.id AND u.role = 'officer'
       GROUP BY d.id
       ORDER BY d.name`
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const { rows } = await query(
      `INSERT INTO departments (name, description) VALUES ($1, $2) RETURNING *`,
      [name, description || null]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const { rows } = await query(
      `UPDATE departments SET name = $1, description = $2 WHERE id = $3 RETURNING *`,
      [name, description || null, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ message: 'Department not found' });
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    await query(`DELETE FROM departments WHERE id = $1`, [req.params.id]);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
