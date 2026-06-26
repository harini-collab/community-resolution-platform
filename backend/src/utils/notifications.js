import { query } from '../config/db.js';
import { emitNotification, emitIssueUpdate } from '../socket.js';

export async function createNotification(userId, { issueId, type, title, body }) {
  const { rows } = await query(
    `INSERT INTO notifications (user_id, issue_id, type, title, body)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [userId, issueId || null, type, title, body || null]
  );
  emitNotification(userId, rows[0]);
  return rows[0];
}

export async function notifyIssueStakeholders(issue, { type, title, body, excludeUserId = null }) {
  const userIds = new Set();
  if (issue.created_by && issue.created_by !== excludeUserId) userIds.add(issue.created_by);
  if (issue.assigned_officer && issue.assigned_officer !== excludeUserId) userIds.add(issue.assigned_officer);

  const followers = await query(
    `SELECT user_id FROM issue_followers WHERE issue_id = $1`,
    [issue.id]
  );
  followers.rows.forEach((row) => {
    if (row.user_id !== excludeUserId) userIds.add(row.user_id);
  });

  const tagged = await query(
    `SELECT officer_id FROM issue_tagged_officers WHERE issue_id = $1`,
    [issue.id]
  );
  tagged.rows.forEach((row) => {
    if (row.officer_id !== excludeUserId) userIds.add(row.officer_id);
  });

  await Promise.all(
    [...userIds].map((userId) => createNotification(userId, { issueId: issue.id, type, title, body }))
  );
  emitIssueUpdate(issue);
}
