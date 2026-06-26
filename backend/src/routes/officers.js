import express from 'express';
import { query } from '../config/db.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

const officerSelect = `
  SELECT u.id, u.name, u.role, u.department_id, d.name AS department_name,
         u.ward, u.pincode_coverage, u.area_coverage, u.availability_status,
         u.response_rate, u.resolved_cases
  FROM users u
  LEFT JOIN departments d ON d.id = u.department_id
  WHERE u.role = 'officer'
`;

function buildCoverageLabel(officer) {
  const parts = [
    officer.ward ? `Ward ${officer.ward}` : null,
    officer.area_coverage?.length ? officer.area_coverage.join(', ') : null,
    officer.pincode_coverage?.length ? `PIN ${officer.pincode_coverage.join(', ')}` : null
  ].filter(Boolean);
  return parts.join(' · ') || 'City-wide';
}

router.get('/public', async (req, res, next) => {
  try {
    const { pincode, ward, area } = req.query;
    let sql = `${officerSelect}`;
    const params = [];
    const filters = [];

    if (pincode) {
      params.push(pincode);
      filters.push(`($${params.length} = ANY(u.pincode_coverage) OR u.pincode_coverage = '{}' OR u.pincode_coverage IS NULL)`);
    }
    if (ward) {
      params.push(ward);
      filters.push(`(u.ward = $${params.length} OR u.ward IS NULL)`);
    }
    if (area) {
      params.push(`%${area}%`);
      filters.push(`(EXISTS (SELECT 1 FROM unnest(u.area_coverage) ac WHERE ac ILIKE $${params.length}) OR u.area_coverage = '{}' OR u.area_coverage IS NULL)`);
    }

    if (filters.length) sql += ` AND (${filters.join(' OR ')})`;
    sql += ` ORDER BY u.response_rate DESC NULLS LAST, u.name ASC`;

    const { rows } = await query(sql, params);
    res.json(rows.map((o) => ({ ...o, coverage_label: buildCoverageLabel(o) })));
  } catch (error) {
    next(error);
  }
});

router.get('/for-issue', authenticate, async (req, res, next) => {
  try {
    const { pincode, ward, area } = req.query;
    if (!pincode && !ward) {
      return res.status(400).json({ message: 'Pincode or ward is required' });
    }
    let sql = `${officerSelect}`;
    const params = [];
    const filters = [];
    if (pincode) {
      params.push(pincode);
      filters.push(`($${params.length} = ANY(u.pincode_coverage) OR u.pincode_coverage = '{}' OR u.pincode_coverage IS NULL)`);
    }
    if (ward) {
      params.push(ward);
      filters.push(`(u.ward = $${params.length} OR u.ward IS NULL)`);
    }
    if (area) {
      params.push(`%${area}%`);
      filters.push(`(EXISTS (SELECT 1 FROM unnest(u.area_coverage) ac WHERE ac ILIKE $${params.length}) OR u.area_coverage = '{}' OR u.area_coverage IS NULL)`);
    }
    if (filters.length) sql += ` AND (${filters.join(' OR ')})`;
    sql += ` ORDER BY u.availability_status ASC, u.response_rate DESC NULLS LAST`;
    const { rows } = await query(sql, params);
    res.json(rows.map((o) => ({ ...o, coverage_label: buildCoverageLabel(o) })));
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await query(`${officerSelect} AND u.id = $1`, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ message: 'Officer not found' });
    res.json({ ...rows[0], coverage_label: buildCoverageLabel(rows[0]) });
  } catch (error) {
    next(error);
  }
});

router.patch('/me/availability', authenticate, authorize('officer'), async (req, res, next) => {
  try {
    const { availability_status } = req.body;
    if (!['Available', 'Busy', 'On Leave'].includes(availability_status)) {
      return res.status(400).json({ message: 'Invalid availability status' });
    }
    const { rows } = await query(
      `UPDATE users SET availability_status = $1 WHERE id = $2 RETURNING id, availability_status`,
      [availability_status, req.user.id]
    );
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

router.get('/me/metrics', authenticate, authorize('officer'), async (req, res, next) => {
  try {
    const [assigned, completed, avgTime] = await Promise.all([
      query(
        `SELECT COUNT(*)::int AS count FROM issues
         WHERE assigned_officer = $1 AND status NOT IN ('Closed', 'Citizen Verified')`,
        [req.user.id]
      ),
      query(
        `SELECT COUNT(*)::int AS count FROM issues
         WHERE assigned_officer = $1 AND status IN ('Resolved', 'Citizen Verified', 'Closed')`,
        [req.user.id]
      ),
      query(
        `SELECT ROUND(AVG(EXTRACT(EPOCH FROM (COALESCE(completion_date, updated_at) - created_at))) / 86400, 1) AS avg_days
         FROM issues
         WHERE assigned_officer = $1 AND status IN ('Resolved', 'Citizen Verified', 'Closed')`,
        [req.user.id]
      )
    ]);
    res.json({
      assigned: assigned.rows[0].count,
      completed: completed.rows[0].count,
      avgResolutionDays: avgTime.rows[0].avg_days || 0
    });
  } catch (error) {
    next(error);
  }
});

export default router;
