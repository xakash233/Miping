const pool = require('../../db');

/**
 * Handles transactional operations for the Dispatcher
 */
class DispatcherRepository {

    /**
     * Phase 1: Debit Credits and Mark Job as Processing (SENT_PENDING_META)
     * Must be atomic.
     */
    async debitAndMarkPending(tenantId, jobId, cost) {
        const client = await pool.getClient();
        try {
            await client.query('BEGIN');

            // 1. Atomic Debit
            // Using logic: balance = balance - cost WHERE balance >= cost
            const debitRes = await client.query(`
                UPDATE tenants 
                SET balance = balance - $2
                WHERE id = $1 AND balance >= $2
                RETURNING balance
            `, [tenantId, cost]);

            if (debitRes.rowCount === 0) {
                // Insufficient funds or tenant not found
                await client.query('ROLLBACK');
                return { success: false, reason: 'INSUFFICIENT_FUNDS' };
            }

            // 2. Ledger Entry (Pending Confirmation)
            await client.query(`
                INSERT INTO credit_transactions (
                    tenant_id, amount, start_balance, end_balance, 
                    type, status, reference_id, reference_type
                ) VALUES (
                    $1, $2, $3, $4, 
                    'DEBIT', 'PENDING_CONFIRMATION', $5, 'MESSAGE_JOB'
                )
            `, [
                tenantId,
                -cost,
                parseFloat(debitRes.rows[0].balance) + parseFloat(cost), // start
                debitRes.rows[0].balance, // end
                jobId
            ]);

            // 3. Update Job Status
            await client.query(`
                UPDATE message_jobs 
                SET status = 'SENT_PENDING_META', updated_at = NOW()
                WHERE id = $1
            `, [jobId]);

            await client.query('COMMIT');
            return { success: true };

        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Debit Transaction Failed:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Phase 2: Confirm Success or Refund Failure
     */
    async finalizeJob(tenantId, jobId, metaMessageId, status, cost, error = null) {
        const client = await pool.getClient();
        try {
            await client.query('BEGIN');

            if (status === 'SENT') {
                // Confirmation
                await client.query(`
                    UPDATE message_jobs SET status = 'SENT', updated_at = NOW() WHERE id = $1
                `, [jobId]);

                // Record actual message entry (State Machine)
                await client.query(`
                    INSERT INTO messages (tenant_id, job_id, meta_message_id, status, cost)
                    VALUES ($1, $2, $3, 'SENT', $4)
                `, [tenantId, jobId, metaMessageId, cost]);

                // Update ledger status
                await client.query(`
                    UPDATE credit_transactions 
                    SET status = 'CONFIRMED' 
                    WHERE reference_id = $1 AND type = 'DEBIT'
                `, [jobId]);

            } else {
                // Failure -> Refund if needed
                // Only refund if we successfully debited previously (PENDING_CONFIRMATION)

                // Refund Logic
                const refundRes = await client.query(`
                    UPDATE tenants SET balance = balance + $2 WHERE id = $1 RETURNING balance
                `, [tenantId, cost]);

                // Ledger Refund
                if (refundRes.rowCount > 0) {
                    await client.query(`
                        INSERT INTO credit_transactions (
                            tenant_id, amount, start_balance, end_balance, 
                            type, status, reference_id, reference_type, description
                        ) VALUES (
                            $1, $2, $3, $4, 
                            'REFUND', 'CONFIRMED', $5, 'MESSAGE_JOB', $6
                        )
                    `, [
                        tenantId,
                        cost,
                        parseFloat(refundRes.rows[0].balance) - parseFloat(cost), // start
                        refundRes.rows[0].balance,
                        jobId,
                        `Refund for failed job: ${error}`
                    ]);
                }

                await client.query(`
                    UPDATE message_jobs SET status = 'FAILED', error_message = $2, updated_at = NOW() WHERE id = $1
                `, [jobId, error]);

                // Mark original debit as FAILED or leave PENDING?
                // Better to mark as FAILED/REVERSED for audit
                await client.query(`
                    UPDATE credit_transactions 
                    SET status = 'FAILED' 
                    WHERE reference_id = $1 AND type = 'DEBIT'
                `, [jobId]);
            }

            await client.query('COMMIT');
        } catch (err) {
            await client.query('ROLLBACK');
            console.error('Finalize Transaction Failed:', err);
            throw err;
        } finally {
            client.release();
        }
    }

    async markJobFailed(jobId, reason) {
        // Simple update without refund (e.g. if skipped before debit)
        const client = await pool.getClient();
        try {
            await client.query(`UPDATE message_jobs SET status = 'FAILED', error_message = $2 WHERE id = $1`, [jobId, reason]);
        } finally {
            client.release();
        }
    }
}

module.exports = new DispatcherRepository();
