const db = require('../../db');

class UserRepository {
    async create(user) {
        const { tenant_id, email, password_hash, role, full_name } = user;
        const query = `
      INSERT INTO users (tenant_id, email, password_hash, role, full_name)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, tenant_id, email, role, full_name, created_at;
    `;
        const { rows } = await db.query(query, [tenant_id, email, password_hash, role, full_name]);
        return rows[0];
    }

    async findByEmail(email) {
        const query = `SELECT * FROM users WHERE email = $1`;
        const { rows } = await db.query(query, [email]);
        return rows[0];
    }

    async findById(id) {
        const query = `SELECT id, tenant_id, email, role, full_name FROM users WHERE id = $1`;
        const { rows } = await db.query(query, [id]);
        return rows[0];
    }
}

module.exports = new UserRepository();
