
const db = require('../../db');

class TemplateRepository {
    async create(tenantId, { name, content, variables, metaTemplateId, status }) {
        const query = `
      INSERT INTO templates(tenant_id, name, content, variables, meta_template_id, status)
VALUES($1, $2, $3, $4, $5, $6)
RETURNING *;
`;
        const { rows } = await db.query(query, [tenantId, name, content, JSON.stringify(variables), metaTemplateId, status || 'PENDING']);
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
}

module.exports = new TemplateRepository();
