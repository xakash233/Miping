const db = require('../../db');

class PlanRepository {
    async create(data) {
        try {
            const query = `
                INSERT INTO plans (name, description, price, message_limit, contact_limit, duration_days, is_active)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *;
            `;
            const { rows } = await db.query(query, [
                data.name,
                data.description,
                parseFloat(data.price),
                parseInt(data.message_limit),
                parseInt(data.contact_limit),
                parseInt(data.duration_days),
                data.is_active !== undefined ? data.is_active : true
            ]);
            return rows[0];
        } catch (error) {
            console.error('Plan Creation DB Error:', error);
            throw error;
        }
    }

    async findAll() {
        const query = `SELECT * FROM plans WHERE is_active = true ORDER BY price ASC`;
        const { rows } = await db.query(query);
        return rows;
    }

    async findById(id) {
        const query = `SELECT * FROM plans WHERE id = $1`;
        const { rows } = await db.query(query, [id]);
        return rows[0];
    }

    async update(id, data) {
        const fields = Object.keys(data).map((key, i) => `${key} = $${i + 2}`).join(', ');
        const values = Object.values(data);
        const query = `UPDATE plans SET ${fields}, updated_at = NOW() WHERE id = $1 RETURNING *`;
        const { rows } = await db.query(query, [id, ...values]);
        return rows[0];
    }

    async delete(id) {
        // Soft delete usually better, but hard delete works for now if unused
        const query = `UPDATE plans SET is_active = false WHERE id = $1 RETURNING *`;
        const { rows } = await db.query(query, [id]);
        return rows[0];
    }
}

module.exports = new PlanRepository();
