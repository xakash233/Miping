const db = require('../../db');

class MessageRepository {
  async createJob(tenantId, { idempotencyKey, templateId, contactId, scheduleTimeUtc, cost }) {
    const query = `
      INSERT INTO message_jobs (tenant_id, idempotency_key, template_id, contact_id, schedule_time_utc, cost, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'PENDING')
      RETURNING *;
    `;
    const { rows } = await db.query(query, [tenantId, idempotencyKey, templateId, contactId, scheduleTimeUtc, cost]);
    return rows[0];
  }

  async findPendingJobs(limit = 100) {
    // Polls accessible jobs across all tenants
    const query = `
      SELECT * FROM message_jobs
      WHERE status = 'PENDING' AND schedule_time_utc <= NOW()
      LIMIT $1;
    `;
    const { rows } = await db.query(query, [limit]);
    return rows;
  }

  async updateJobStatus(id, status, errorMessage = null) {
    const query = `
        UPDATE message_jobs
        SET status = $2, error_message = $3, updated_at = NOW()
        WHERE id = $1
        RETURNING *;
      `;
    const { rows } = await db.query(query, [id, status, errorMessage]);
    return rows[0];
  }

  async createMessage(tenantId, { jobId, metaMessageId, status }) {
    const query = `
        INSERT INTO messages (tenant_id, job_id, meta_message_id, status)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
      `;
    const { rows } = await db.query(query, [tenantId, jobId, metaMessageId, status]);
    return rows[0];
  }

  async findByMetaMessageId(metaMessageId) {
    const query = `SELECT * FROM messages WHERE meta_message_id = $1`;
    const { rows } = await db.query(query, [metaMessageId]);
    return rows[0];
  }

  async findAllJobs(tenantId) {
    const query = `
            SELECT j.*, t.name as template_name, c.name as contact_name, c.phone_e164
            FROM message_jobs j
            LEFT JOIN templates t ON j.template_id = t.id
            LEFT JOIN contacts c ON j.contact_id = c.id
            ${tenantId ? 'WHERE j.tenant_id = $1' : ''}
            ORDER BY j.created_at DESC
        `;
    const params = tenantId ? [tenantId] : [];
    const { rows } = await db.query(query, params);
    return rows;
  }
}

module.exports = new MessageRepository();
