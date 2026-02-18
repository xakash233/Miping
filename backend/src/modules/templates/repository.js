
const db = require('../../db');

class TemplateRepository {
    async create(tenantId, { name, content, category, language, variables, metaTemplateId, status }) {
        const query = `
      INSERT INTO templates(tenant_id, name, content, category, language, variables, meta_template_id, status)
VALUES($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING *;
`;
        const { rows } = await db.query(query, [tenantId, name, content, category, language, JSON.stringify(variables), metaTemplateId, status || 'PENDING']);
        return rows[0];
    }

    async findById(tenantId, id) {
        const query = `SELECT * FROM templates WHERE tenant_id = $1 AND id = $2`;
        const { rows } = await db.query(query, [tenantId, id]);
        return rows[0];
    }

    async findAll(tenantId) {
        const query = `SELECT * FROM templates WHERE tenant_id = $1`;
        const { rows } = await db.query(query, [tenantId]);
        return rows;
    }

    async delete(tenantId, id) {
        const query = `DELETE FROM templates WHERE tenant_id = $1 AND id = $2`;
        await db.query(query, [tenantId, id]);
    }

    async updateStatus(tenantId, id, status) {
        const query = `UPDATE templates SET status = $3, updated_at = NOW() WHERE tenant_id = $1 AND id = $2 RETURNING *`;
        const { rows } = await db.query(query, [tenantId, id, status]);
        return rows[0];
    }
}

module.exports = new TemplateRepository();
