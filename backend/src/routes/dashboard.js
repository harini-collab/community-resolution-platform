import express from 'express';
import { query } from '../config/db.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/stats', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const [totals, byStatus, byDepartment, byCategory, performance, leaderboard] = await Promise.all([
      query(`SELECT COUNT(*)::int AS total_issues FROM issues`),
      query(`SELECT status, COUNT(*)::int AS count FROM issues GROUP BY status ORDER BY status`),
      query(
        `SELECT COALESCE(d.name, 'Unassigned') AS department, COUNT(i.id)::int AS count
         FROM issues i
         LEFT JOIN departments d ON d.id = i.assigned_department
         GROUP BY d.name
         ORDER BY count DESC`
      ),
      query(`SELECT category, COUNT(*)::int AS count FROM issues GROUP BY category ORDER BY count DESC`),
      query(
        `SELECT
          ROUND((COUNT(*) FILTER (WHERE status IN ('Resolved', 'Citizen Verified', 'Closed'))::numeric / NULLIF(COUNT(*), 0)) * 100, 1) AS resolution_rate,
          ROUND(AVG(EXTRACT(EPOCH FROM (COALESCE(assigned_at, updated_at) - created_at))) FILTER (WHERE assigned_at IS NOT NULL) / 3600, 1) AS avg_response_hours,
          ROUND(AVG(EXTRACT(EPOCH FROM (COALESCE(completion_date, updated_at) - created_at))) FILTER (WHERE status IN ('Resolved', 'Citizen Verified', 'Closed')) / 86400, 1) AS avg_resolution_days
         FROM issues`
      ),
      query(
        `SELECT COALESCE(d.name, 'Unassigned') AS department,
          COUNT(i.id)::int AS total,
          COUNT(*) FILTER (WHERE i.status IN ('Resolved', 'Citizen Verified', 'Closed'))::int AS resolved,
          ROUND((COUNT(*) FILTER (WHERE i.status IN ('Resolved', 'Citizen Verified', 'Closed'))::numeric / NULLIF(COUNT(i.id), 0)) * 100, 1) AS resolution_rate,
          ROUND(AVG(EXTRACT(EPOCH FROM (COALESCE(i.completion_date, i.updated_at) - i.created_at))) FILTER (WHERE i.status IN ('Resolved', 'Citizen Verified', 'Closed')) / 86400, 1) AS avg_resolution_days
         FROM issues i
         LEFT JOIN departments d ON d.id = i.assigned_department
         GROUP BY d.name
         ORDER BY resolution_rate DESC NULLS LAST, resolved DESC`
      )
    ]);

    res.json({
      totalIssues: totals.rows[0].total_issues,
      byStatus: byStatus.rows,
      byDepartment: byDepartment.rows,
      byCategory: byCategory.rows,
      performance: performance.rows[0],
      leaderboard: leaderboard.rows
    });
  } catch (error) {
    next(error);
  }
});

router.get('/public', async (req, res, next) => {
  try {
    const [totals, status, emergency, performance] = await Promise.all([
      query(`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status IN ('Resolved', 'Citizen Verified', 'Closed'))::int AS resolved FROM issues`),
      query(`SELECT status, COUNT(*)::int AS count FROM issues GROUP BY status`),
      query(`SELECT COUNT(*)::int AS escalated FROM issues WHERE emergency_escalated = TRUE`),
      query(
        `SELECT ROUND(AVG(EXTRACT(EPOCH FROM (COALESCE(completion_date, resolution_timestamp, updated_at) - created_at))) FILTER (WHERE status IN ('Resolved', 'Citizen Verified', 'Closed')) / 86400, 1) AS avg_resolution_days,
         ROUND(AVG(satisfaction_rating) FILTER (WHERE satisfaction_rating IS NOT NULL), 1) AS avg_satisfaction
         FROM issues`
      )
    ]);
    const total = totals.rows[0].total || 0;
    const resolved = totals.rows[0].resolved || 0;
    res.json({
      totalIssues: total,
      resolvedIssues: resolved,
      resolutionRate: total ? Math.round((resolved / total) * 100) : 0,
      emergencyEscalations: emergency.rows[0].escalated,
      avgResolutionDays: performance.rows[0].avg_resolution_days || 0,
      avgSatisfaction: performance.rows[0].avg_satisfaction || 0,
      byStatus: status.rows
    });
  } catch (error) {
    next(error);
  }
});

router.get('/emergency-contacts', async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT id, name, phone, category FROM emergency_contacts
       WHERE active = TRUE ORDER BY sort_order ASC, name ASC`
    );
    res.json(rows);
  } catch (error) {
    if (error.message?.includes('emergency_contacts')) {
      return res.json([
        { id: '1', name: 'Police', phone: '112', category: 'Emergency' },
        { id: '2', name: 'Fire', phone: '101', category: 'Emergency' },
        { id: '3', name: 'Ambulance', phone: '108', category: 'Emergency' },
        { id: '4', name: 'Women Helpline', phone: '1091', category: 'Support' }
      ]);
    }
    next(error);
  }
});

export default router;
