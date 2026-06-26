import express from 'express';
import { query } from '../config/db.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { emitIssueUpdate } from '../socket.js';
import { resolveImageUrl } from '../utils/uploads.js';
import { createNotification, notifyIssueStakeholders } from '../utils/notifications.js';

const router = express.Router();
const ISSUE_STATUSES = ['Reported', 'Assigned', 'Accepted', 'In Progress', 'Resolved', 'Citizen Verified', 'Closed'];
const CLOSING_STATUSES = ['Resolved', 'Citizen Verified', 'Closed'];
const EMERGENCY_CATEGORIES = ['Accident', 'Fire', 'Crime', 'Conflict', 'Medical Emergency'];

const issueSelect = `
  SELECT i.*, u.name AS citizen_name, d.name AS department_name, officer.name AS assigned_officer_name,
    (SELECT row_to_json(t) FROM (
      SELECT event_type, status, notes, created_at FROM issue_timeline
      WHERE issue_id = i.id ORDER BY created_at DESC LIMIT 1
    ) t) AS last_timeline_event
  FROM issues i
  JOIN users u ON u.id = i.created_by
  LEFT JOIN departments d ON d.id = i.assigned_department
  LEFT JOIN users officer ON officer.id = i.assigned_officer
`;

function approximateCoords(issue) {
  if (issue.latitude && issue.longitude) {
    return [Number(issue.latitude), Number(issue.longitude)];
  }
  const pin = String(issue.pincode || '');
  const regional = {
    '11': [28.6139, 77.209],
    '20': [26.8467, 80.9462],
    '22': [26.8467, 80.9462],
    '30': [26.9124, 75.7873],
    '38': [23.0225, 72.5714],
    '40': [19.076, 72.8777],
    '41': [18.5204, 73.8567],
    '50': [17.385, 78.4867],
    '56': [12.9716, 77.5946],
    '60': [13.0827, 80.2707],
    '68': [9.9312, 76.2673],
    '70': [22.5726, 88.3639],
    '80': [25.5941, 85.1376]
  };
  const prefix = pin.slice(0, 2);
  const [baseLat, baseLng] = regional[prefix] || [20.5937, 78.9629];
  const seed = String(issue.ward || issue.id || pin || '0');
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) % 10000;
  const lat = baseLat + ((hash % 200) - 100) * 0.0012;
  const lng = baseLng + (((hash / 200) | 0) % 200 - 100) * 0.0012;
  return [lat, lng];
}

async function addTimeline(issueId, actor, eventType, status, notes, proofUrl = null) {
  await query(
    `INSERT INTO issue_timeline (issue_id, actor_id, actor_name, event_type, status, notes, proof_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [issueId, actor?.id || null, actor?.name || 'System', eventType, status || null, notes || null, proofUrl]
  );
}

async function findDuplicates({ latitude, longitude, pincode, ward, category, description }) {
  const params = [];
  let sql = `
    SELECT id, title, status, category, pincode, ward, address,
      CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL
        THEN (ABS(latitude::numeric - $1::numeric) + ABS(longitude::numeric - $2::numeric))
        ELSE 999 END AS distance_score
    FROM issues
    WHERE status NOT IN ('Closed')
  `;
  params.push(latitude || 0, longitude || 0);

  const locationFilters = [];
  if (pincode) {
    params.push(pincode);
    locationFilters.push(`pincode = $${params.length}`);
  }
  if (ward) {
    params.push(ward);
    locationFilters.push(`ward = $${params.length}`);
  }
  if (latitude && longitude) {
    locationFilters.push(`(ABS(latitude::numeric - $1::numeric) < 0.003 AND ABS(longitude::numeric - $2::numeric) < 0.003)`);
  }

  if (locationFilters.length) {
    sql += ` AND (${locationFilters.join(' OR ')})`;
  }

  if (category) {
    params.push(category);
    sql += ` AND category ILIKE $${params.length}`;
  }

  sql += ` ORDER BY distance_score ASC, created_at DESC LIMIT 8`;

  const { rows } = await query(sql, params);
  const words = new Set(String(description || '').toLowerCase().split(/\W+/).filter((w) => w.length > 4));
  return rows.filter((row) => {
    const titleWords = String(row.title || '').toLowerCase().split(/\W+/);
    return titleWords.some((w) => words.has(w)) || row.category === category;
  }).slice(0, 5);
}

async function notifyEmergencyOfficers(issue, actor) {
  const { rows } = await query(
    `SELECT u.id FROM users u
     WHERE u.role = 'officer'
       AND (
         ($1::text IS NOT NULL AND $1 = ANY(u.pincode_coverage))
         OR ($2::text IS NOT NULL AND u.ward = $2)
         OR u.pincode_coverage = '{}' OR u.pincode_coverage IS NULL
       )`,
    [issue.pincode || null, issue.ward || null]
  );
  await Promise.all(rows.map((o) =>
    createNotification(o.id, {
      issueId: issue.id,
      type: 'emergency',
      title: 'Emergency report received',
      body: `${issue.title} — immediate attention required.`
    })
  ));
  await notifyIssueStakeholders(issue, {
    type: 'emergency',
    title: 'Emergency escalation',
    body: issue.emergency_notes || 'Emergency report flagged for priority response.',
    excludeUserId: actor?.id
  });
}

async function loadTaggedOfficers(issueId) {
  const { rows } = await query(
    `SELECT u.id, u.name, d.name AS department_name, u.availability_status
     FROM issue_tagged_officers t
     JOIN users u ON u.id = t.officer_id
     LEFT JOIN departments d ON d.id = u.department_id
     WHERE t.issue_id = $1`,
    [issueId]
  );
  return rows;
}

router.get('/', authenticate, async (req, res, next) => {
  try {
    let sql = `${issueSelect}`;
    const params = [];

    if (req.user.role === 'citizen') {
      params.push(req.user.id);
      sql += ` WHERE i.created_by = $1`;
    } else if (req.user.role === 'officer') {
      params.push(req.user.department_id, req.user.id);
      sql += ` WHERE (i.assigned_department = $1 OR EXISTS (
        SELECT 1 FROM issue_tagged_officers t WHERE t.issue_id = i.id AND t.officer_id = $2
      ))`;
    }

    sql += ` ORDER BY
      CASE WHEN i.priority_level = 'Emergency' THEN 0 ELSE 1 END,
      i.created_at DESC`;
    const { rows } = await query(sql, params);
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.get('/followed', authenticate, authorize('citizen'), async (req, res, next) => {
  try {
    const { rows } = await query(
      `${issueSelect}
       JOIN issue_followers f ON f.issue_id = i.id AND f.user_id = $1
       ORDER BY i.updated_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.get('/public/recent-resolved', async (req, res, next) => {
  try {
    const { rows } = await query(
      `${issueSelect}
       WHERE i.status IN ('Resolved', 'Citizen Verified', 'Closed')
       ORDER BY COALESCE(i.completion_date, i.resolution_timestamp, i.updated_at) DESC
       LIMIT 8`
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.get('/public/map', async (req, res, next) => {
  try {
    const { pincode, ward, landmark } = req.query;
    let sql = `${issueSelect}`;
    const params = [];
    const filters = [];

    if (pincode) {
      params.push(pincode);
      filters.push(`i.pincode = $${params.length}`);
    }
    if (ward) {
      params.push(ward);
      filters.push(`i.ward ILIKE $${params.length}`);
    }
    if (landmark) {
      params.push(`%${landmark}%`);
      filters.push(`(i.landmark ILIKE $${params.length} OR i.address ILIKE $${params.length})`);
    }

    if (filters.length) sql += ` WHERE ${filters.join(' AND ')}`;

    sql += ` ORDER BY i.created_at DESC LIMIT 250`;
    const { rows } = await query(sql, params);
    res.json(rows.map((row) => {
      const [lat, lng] = approximateCoords(row);
      return {
        ...row,
        latitude: row.latitude ?? lat,
        longitude: row.longitude ?? lng,
        approximated_location: !(row.latitude && row.longitude)
      };
    }));
  } catch (error) {
    next(error);
  }
});

router.get('/public/track', async (req, res, next) => {
  try {
    const { pincode, ward, q, status } = req.query;
    let sql = `${issueSelect}`;
    const params = [];
    const filters = [];

    if (pincode) {
      params.push(pincode);
      filters.push(`i.pincode = $${params.length}`);
    }
    if (ward) {
      params.push(`%${ward}%`);
      filters.push(`i.ward ILIKE $${params.length}`);
    }
    if (status) {
      params.push(status);
      filters.push(`i.status = $${params.length}`);
    }
    if (q) {
      params.push(`%${q}%`);
      filters.push(`(
        i.title ILIKE $${params.length}
        OR i.description ILIKE $${params.length}
        OR i.area ILIKE $${params.length}
        OR i.landmark ILIKE $${params.length}
        OR i.id::text ILIKE $${params.length}
      )`);
    }

    if (filters.length) sql += ` WHERE ${filters.join(' AND ')}`;
    sql += ` ORDER BY i.updated_at DESC LIMIT 50`;

    const { rows } = await query(sql, params);
    res.json(rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      category: row.category,
      status: row.status,
      area: row.area,
      ward: row.ward,
      pincode: row.pincode,
      landmark: row.landmark,
      address: row.address,
      image_url: row.image_url || row.before_image_url,
      before_image_url: row.before_image_url,
      after_image_url: row.after_image_url,
      department_name: row.department_name,
      assigned_officer_name: row.assigned_officer_name,
      priority_level: row.priority_level,
      votes_count: row.votes_count,
      followers_count: row.followers_count,
      created_at: row.created_at,
      updated_at: row.updated_at,
      completion_date: row.completion_date,
      last_timeline_event: row.last_timeline_event
    })));
  } catch (error) {
    next(error);
  }
});

router.get('/public/:id', async (req, res, next) => {
  try {
    const { rows } = await query(`${issueSelect} WHERE i.id = $1`, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ message: 'Issue not found' });

    const { rows: timeline } = await query(
      `SELECT actor_name, event_type, status, notes, created_at
       FROM issue_timeline WHERE issue_id = $1 ORDER BY created_at ASC`,
      [req.params.id]
    );

    const issue = rows[0];
    res.json({
      ...issue,
      image_url: issue.image_url || issue.before_image_url,
      timeline,
      approximated_location: !(issue.latitude && issue.longitude),
      latitude: issue.latitude ?? approximateCoords(issue)[0],
      longitude: issue.longitude ?? approximateCoords(issue)[1]
    });
  } catch (error) {
    next(error);
  }
});

router.get('/check-duplicates', authenticate, async (req, res, next) => {
  try {
    const { latitude, longitude, pincode, ward, category, description } = req.query;
    const duplicates = await findDuplicates({
      latitude: latitude ? Number(latitude) : null,
      longitude: longitude ? Number(longitude) : null,
      pincode,
      ward,
      category,
      description
    });
    res.json(duplicates);
  } catch (error) {
    next(error);
  }
});

router.post('/check-duplicates', authenticate, async (req, res, next) => {
  try {
    const { latitude, longitude, pincode, ward, category, description } = req.body;
    const duplicates = await findDuplicates({
      latitude: latitude ? Number(latitude) : null,
      longitude: longitude ? Number(longitude) : null,
      pincode,
      ward,
      category,
      description
    });
    res.json(duplicates);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { rows } = await query(`${issueSelect} WHERE i.id = $1`, [req.params.id]);
    const issue = rows[0];
    if (!issue) return res.status(404).json({ message: 'Issue not found' });

    const isTagged = await query(
      `SELECT 1 FROM issue_tagged_officers WHERE issue_id = $1 AND officer_id = $2`,
      [req.params.id, req.user.id]
    );

    if (req.user.role === 'citizen' && issue.created_by !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    if (req.user.role === 'officer' &&
        issue.assigned_department !== req.user.department_id &&
        !isTagged.rows.length) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const [remarks, timeline, evidence, nearby, taggedOfficers, userVoted, userFollowing] = await Promise.all([
      query(
        `SELECT r.*, u.name AS officer_name FROM issue_remarks r
         JOIN users u ON u.id = r.officer_id WHERE r.issue_id = $1 ORDER BY r.created_at DESC`,
        [req.params.id]
      ),
      query(`SELECT * FROM issue_timeline WHERE issue_id = $1 ORDER BY created_at ASC`, [req.params.id]),
      query(
        `SELECT proof_url, remark, status, created_at FROM issue_remarks
         WHERE issue_id = $1 AND proof_url IS NOT NULL ORDER BY created_at ASC`,
        [req.params.id]
      ),
      query(
        `SELECT id, title, status, latitude, longitude, pincode, ward FROM issues
         WHERE id <> $1 AND status NOT IN ('Closed')
           AND (
             ($2::text IS NOT NULL AND pincode = $2)
             OR ($3::text IS NOT NULL AND ward = $3)
             OR (latitude IS NOT NULL AND ABS(latitude::numeric - $4::numeric) < 0.003)
           )
         ORDER BY created_at DESC LIMIT 5`,
        [req.params.id, issue.pincode, issue.ward, issue.latitude || 0]
      ),
      loadTaggedOfficers(req.params.id),
      query(`SELECT 1 FROM issue_votes WHERE issue_id = $1 AND user_id = $2`, [req.params.id, req.user.id]),
      query(`SELECT 1 FROM issue_followers WHERE issue_id = $1 AND user_id = $2`, [req.params.id, req.user.id])
    ]);

    res.json({
      ...issue,
      remarks: remarks.rows,
      timeline: timeline.rows,
      evidence: evidence.rows,
      nearbyIssues: nearby.rows,
      taggedOfficers,
      userVoted: Boolean(userVoted.rows.length),
      userFollowing: Boolean(userFollowing.rows.length)
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticate, authorize('citizen'), upload.single('image'), async (req, res, next) => {
  try {
    const {
      title, description, category, latitude, longitude,
      address, area, ward, pincode, landmark,
      assigned_department, predicted_category, confidence_score,
      suggested_department, priority_level, severity_level,
      emergency_category, tagged_officers
    } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({ message: 'Title, description, and category are required' });
    }
    if (!address && !pincode) {
      return res.status(400).json({ message: 'Address or pincode is required' });
    }

    const isEmergency = severity_level === 'Emergency' || priority_level === 'Emergency';
    const imageUrl = await resolveImageUrl(req, req.file, 'community-reports/issues');
    const duplicate = await findDuplicates({
      latitude: latitude ? Number(latitude) : null,
      longitude: longitude ? Number(longitude) : null,
      pincode, ward, category, description
    });

    const { rows } = await query(
      `INSERT INTO issues
        (title, description, category, image_url, latitude, longitude, address, area, ward, pincode, landmark,
         created_by, assigned_department, predicted_category, confidence_score, suggested_department,
         priority_level, severity_level, emergency_category, emergency_escalated, duplicate_of, before_image_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
       RETURNING *`,
      [
        title, description, category, imageUrl,
        latitude || null, longitude || null,
        address || null, area || null, ward || null, pincode || null, landmark || null,
        req.user.id, assigned_department || null,
        predicted_category || category, confidence_score || null, suggested_department || null,
        priority_level || 'Medium', severity_level || priority_level || 'Medium',
        isEmergency ? (emergency_category || 'Medical Emergency') : null,
        isEmergency,
        duplicate[0]?.id || null,
        imageUrl
      ]
    );

    const issue = rows[0];
    let officerIds = [];
    try {
      officerIds = tagged_officers ? JSON.parse(tagged_officers) : [];
    } catch { officerIds = []; }

    for (const officerId of officerIds) {
      await query(
        `INSERT INTO issue_tagged_officers (issue_id, officer_id, tagged_by) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
        [issue.id, officerId, req.user.id]
      );
      await createNotification(officerId, {
        issueId: issue.id,
        type: 'tagged',
        title: 'You were tagged on a new issue',
        body: `${title} — citizen tagged you for this report.`
      });
    }

    await addTimeline(
      issue.id, req.user,
      duplicate.length ? 'duplicate_suggested' : 'reported', 'Reported',
      duplicate.length
        ? `Reported. Possible duplicate of "${duplicate[0].title}".`
        : 'Citizen submitted the issue with address and evidence.',
      imageUrl
    );

    if (isEmergency) {
      await notifyEmergencyOfficers(issue, req.user);
    }

    emitIssueUpdate(issue);
    res.status(201).json({ ...issue, possibleDuplicates: duplicate });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/assign', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { department_id, officer_id } = req.body;
    const { rows } = await query(
      `UPDATE issues SET assigned_department = $1, assigned_officer = $2, assigned_at = NOW(),
       status = 'Assigned', updated_at = NOW() WHERE id = $3 RETURNING *`,
      [department_id || null, officer_id || null, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ message: 'Issue not found' });
    await addTimeline(req.params.id, req.user, 'assigned', 'Assigned', 'Issue assigned for departmental action.');
    await notifyIssueStakeholders(rows[0], {
      type: 'assigned', title: 'Issue assigned', body: 'Your report has been assigned to a department.',
      excludeUserId: req.user.id
    });
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/accept', authenticate, authorize('officer'), async (req, res, next) => {
  try {
    const current = await query(`SELECT * FROM issues WHERE id = $1`, [req.params.id]);
    const issue = current.rows[0];
    if (!issue) return res.status(404).json({ message: 'Issue not found' });
    if (issue.status !== 'Assigned') return res.status(400).json({ message: 'Only assigned issues can be accepted' });
    if (issue.assigned_department !== req.user.department_id) {
      return res.status(403).json({ message: 'Issue is not in your department' });
    }

    const { rows } = await query(
      `UPDATE issues SET status = 'Accepted', assigned_officer = $1, accepted_at = NOW(), updated_at = NOW()
       WHERE id = $2 RETURNING *`,
      [req.user.id, req.params.id]
    );
    await addTimeline(req.params.id, req.user, 'accepted', 'Accepted', 'Officer accepted the issue.');
    await notifyIssueStakeholders(rows[0], {
      type: 'accepted', title: 'Issue accepted', body: 'An officer has accepted your report.',
      excludeUserId: req.user.id
    });
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/status', authenticate, authorize('officer', 'admin'), upload.single('proof'), async (req, res, next) => {
  try {
    const { status, remark, resolution_timestamp } = req.body;
    if (!ISSUE_STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const current = await query(`SELECT * FROM issues WHERE id = $1`, [req.params.id]);
    const issue = current.rows[0];
    if (!issue) return res.status(404).json({ message: 'Issue not found' });
    if (req.user.role === 'officer' && issue.assigned_department !== req.user.department_id) {
      return res.status(403).json({ message: 'Issue is not assigned to your department' });
    }

    const proofUrl = await resolveImageUrl(req, req.file, 'community-reports/proofs');

    if (status === 'Resolved' && (!proofUrl || !remark || !resolution_timestamp)) {
      return res.status(400).json({ message: 'Resolution photo, notes, and timestamp are required before resolving' });
    }

    const updated = await query(
      `UPDATE issues SET status = $1,
         resolution_notes = COALESCE($2, resolution_notes),
         resolution_timestamp = COALESCE($3::timestamptz, resolution_timestamp),
         after_image_url = COALESCE($4, after_image_url),
         resolution_photo = COALESCE($4, resolution_photo),
         completion_date = CASE WHEN $1 IN ('Resolved','Citizen Verified','Closed') THEN COALESCE($3::timestamptz, NOW()) ELSE completion_date END,
         updated_at = NOW()
       WHERE id = $5 RETURNING *`,
      [status, remark || null, resolution_timestamp || null, proofUrl, req.params.id]
    );

    if (status === 'Resolved') {
      await query(
        `UPDATE users SET resolved_cases = resolved_cases + 1 WHERE id = $1`,
        [req.user.id]
      );
    }

    await query(
      `INSERT INTO issue_remarks (issue_id, officer_id, remark, proof_url, status) VALUES ($1,$2,$3,$4,$5)`,
      [req.params.id, req.user.id, remark || `Status changed to ${status}`, proofUrl, status]
    );
    await addTimeline(req.params.id, req.user, 'status_update', status, remark || `Status changed to ${status}`, proofUrl);
    await notifyIssueStakeholders(updated.rows[0], {
      type: 'status_update',
      title: `Issue ${status}`,
      body: remark || `Status updated to ${status}.`,
      excludeUserId: req.user.id
    });
    res.json(updated.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/progress', authenticate, authorize('officer', 'admin'), upload.single('proof'), async (req, res, next) => {
  try {
    const { remark } = req.body;
    const current = await query(`SELECT * FROM issues WHERE id = $1`, [req.params.id]);
    const issue = current.rows[0];
    if (!issue) return res.status(404).json({ message: 'Issue not found' });
    if (req.user.role === 'officer' && issue.assigned_department !== req.user.department_id) {
      return res.status(403).json({ message: 'Issue is not assigned to your department' });
    }

    const proofUrl = await resolveImageUrl(req, req.file, 'community-reports/proofs');
    if (!proofUrl) {
      return res.status(400).json({ message: 'Progress photo is required' });
    }

    const nextStatus = ['Reported', 'Assigned', 'Accepted'].includes(issue.status) ? 'Accepted' : 'In Progress';
    const { rows } = await query(
      `UPDATE issues SET status = $1, progress_photo_url = $2, updated_at = NOW() WHERE id = $3 RETURNING *`,
      [nextStatus, proofUrl, req.params.id]
    );

    await query(
      `INSERT INTO issue_remarks (issue_id, officer_id, remark, proof_url, status) VALUES ($1,$2,$3,$4,$5)`,
      [req.params.id, req.user.id, remark || 'Progress photo uploaded.', proofUrl, nextStatus]
    );
    await addTimeline(req.params.id, req.user, 'progress_update', nextStatus, remark || 'Officer uploaded progress photo.', proofUrl);
    await notifyIssueStakeholders(rows[0], {
      type: 'progress_update',
      title: 'Progress update',
      body: remark || 'Officer uploaded a progress photo.',
      excludeUserId: req.user.id
    });
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/tag-officer', authenticate, authorize('citizen', 'admin'), async (req, res, next) => {
  try {
    const { officer_ids: officerIdsRaw } = req.body;
    const officerIds = Array.isArray(officerIdsRaw) ? officerIdsRaw : [];
    if (!officerIds.length) {
      return res.status(400).json({ message: 'At least one officer_id is required' });
    }

    const current = await query(`SELECT * FROM issues WHERE id = $1`, [req.params.id]);
    const issue = current.rows[0];
    if (!issue) return res.status(404).json({ message: 'Issue not found' });
    if (req.user.role === 'citizen' && issue.created_by !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    for (const officerId of officerIds) {
      await query(
        `INSERT INTO issue_tagged_officers (issue_id, officer_id, tagged_by) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
        [req.params.id, officerId, req.user.id]
      );
      await createNotification(officerId, {
        issueId: issue.id,
        type: 'tagged',
        title: 'You were tagged on an issue',
        body: `${issue.title} — tagged for your attention.`
      });
    }

    await addTimeline(req.params.id, req.user, 'officer_tagged', issue.status, `Tagged ${officerIds.length} officer(s).`);
    const taggedOfficers = await loadTaggedOfficers(req.params.id);
    res.json({ taggedOfficers });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/vote', authenticate, authorize('citizen'), async (req, res, next) => {
  try {
    await query(`INSERT INTO issue_votes (issue_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [req.params.id, req.user.id]);
    const { rows } = await query(
      `UPDATE issues SET votes_count = (SELECT COUNT(*) FROM issue_votes WHERE issue_id = $1), updated_at = NOW()
       WHERE id = $1 RETURNING votes_count`, [req.params.id]
    );
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

router.post('/:id/follow', authenticate, authorize('citizen'), async (req, res, next) => {
  try {
    await query(`INSERT INTO issue_followers (issue_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [req.params.id, req.user.id]);
    const { rows } = await query(
      `UPDATE issues SET followers_count = (SELECT COUNT(*) FROM issue_followers WHERE issue_id = $1), updated_at = NOW()
       WHERE id = $1 RETURNING followers_count`, [req.params.id]
    );
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/verify', authenticate, authorize('citizen'), async (req, res, next) => {
  try {
    const { rating, notes } = req.body;
    const current = await query(`SELECT * FROM issues WHERE id = $1 AND created_by = $2`, [req.params.id, req.user.id]);
    if (!current.rows[0]) return res.status(404).json({ message: 'Issue not found' });
    if (current.rows[0].status !== 'Resolved') {
      return res.status(400).json({ message: 'Only resolved issues can be verified' });
    }

    const { rows } = await query(
      `UPDATE issues SET status = 'Citizen Verified', citizen_verified = TRUE, verified_at = NOW(),
       satisfaction_rating = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [rating || 5, req.params.id]
    );
    await addTimeline(req.params.id, req.user, 'citizen_verified', 'Citizen Verified', notes || 'Citizen confirmed the issue is fixed.');
    await notifyIssueStakeholders(rows[0], {
      type: 'verified', title: 'Citizen verified resolution', body: notes || 'Citizen confirmed the fix.',
      excludeUserId: req.user.id
    });
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/reject-verification', authenticate, authorize('citizen'), async (req, res, next) => {
  try {
    const { notes } = req.body;
    const current = await query(`SELECT * FROM issues WHERE id = $1 AND created_by = $2`, [req.params.id, req.user.id]);
    if (!current.rows[0]) return res.status(404).json({ message: 'Issue not found' });
    if (current.rows[0].status !== 'Resolved') {
      return res.status(400).json({ message: 'Only resolved issues can be rejected' });
    }

    const { rows } = await query(
      `UPDATE issues SET status = 'In Progress', citizen_verified = FALSE, updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    await addTimeline(req.params.id, req.user, 'verification_rejected', 'In Progress', notes || 'Citizen reported the issue is still not fixed.');
    await notifyIssueStakeholders(rows[0], {
      type: 'verification_rejected',
      title: 'Verification rejected',
      body: notes || 'Citizen reported the issue is still not fixed.',
      excludeUserId: req.user.id
    });
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/escalate', authenticate, authorize('citizen', 'officer', 'admin'), async (req, res, next) => {
  try {
    const { notes, emergency_category } = req.body;
    const category = EMERGENCY_CATEGORIES.includes(emergency_category) ? emergency_category : 'Medical Emergency';
    const { rows } = await query(
      `UPDATE issues SET emergency_escalated = TRUE, emergency_notes = $1,
       emergency_category = $2, priority_level = 'Emergency', severity_level = 'Emergency', updated_at = NOW()
       WHERE id = $3 RETURNING *`,
      [notes || 'Emergency escalation requested.', category, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ message: 'Issue not found' });
    await addTimeline(req.params.id, req.user, 'emergency_escalated', rows[0].status, notes || 'Emergency escalation requested.');
    await notifyEmergencyOfficers(rows[0], req.user);
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

export default router;
