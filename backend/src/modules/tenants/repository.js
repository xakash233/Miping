const db = require('../../db');

class TenantRepository {
    async create(name, slug, country_code = 'IN', currency = 'INR', timezone = 'Asia/Kolkata') {
        const query = `
      INSERT INTO tenants (name, slug, country_code, currency, timezone)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
        const { rows } = await db.query(query, [name, slug, country_code, currency, timezone]);
        return rows[0];
    }

    async findById(id) {
        const query = `SELECT * FROM tenants WHERE id = $1`;
        const { rows } = await db.query(query, [id]);
        return rows[0];
    }

    async findBySlug(slug) {
        const query = `SELECT * FROM tenants WHERE slug = $1`;
        const { rows } = await db.query(query, [slug]);
        return rows[0];
    }
}

module.exports = new TenantRepository();
