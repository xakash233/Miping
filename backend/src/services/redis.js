const Redis = require('ioredis');

// Connect to Redis (defaults to localhost:6379)
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    retryStrategy: (times) => Math.min(times * 50, 2000)
});

// Lua Script for Rolling Window Rate Limit
// KEYS[1]: tenant:id:tier:phone_id:rolling24h
// ARGV[1]: max_limit
// ARGV[2]: current_timestamp
// ARGV[3]: window_size (seconds, e.g. 86400)
const RATE_LIMIT_SCRIPT = `
    local key = KEYS[1]
    local limit = tonumber(ARGV[1])
    local now = tonumber(ARGV[2])
    local window = tonumber(ARGV[3])

    -- Clean up old entries (sliding window)
    redis.call('ZREMRANGEBYSCORE', key, '-inf', now - window)

    -- Count current usage within window
    local current_usage = redis.call('ZCARD', key)

    if current_usage < limit then
        -- Add current request timestamp
        redis.call('ZADD', key, now, now)
        redis.call('EXPIRE', key, window) -- Refresh TTL
        return 1 -- OK
    else
        return 0 -- BLOCKED
    end
`;

// Register script
redis.defineCommand('checkRateLimit', {
    numberOfKeys: 1,
    lua: RATE_LIMIT_SCRIPT
});

/**
 * Check if tenant has exceeded messaging tier limit
 * @param {string} tenantId 
 * @param {string} phoneNumberId 
 * @param {number} limit Max messages allowed in window
 * @param {number} windowSeconds Window size (default 24h = 86400)
 * @returns {Promise<boolean>} true if allowed, false if blocked
 */
async function checkRateLimit(tenantId, phoneNumberId, limit, windowSeconds = 86400) {
    const key = `tenant:${tenantId}:tier:${phoneNumberId}:rolling24h`;
    const now = Date.now(); // Milliseconds, but ZSET usually uses seconds or fine-grained.
    // Using milliseconds for finer granularity if needed, but seconds is simpler for TTL. Let's use milliseconds in ZSET score.

    // Script uses 'now' as score. If using milliseconds, windowSeconds needs to be millisecond equivalent in ZREMRANGE check logic?
    // Wait, script says: 'now - window'. If window is seconds (86400), now should be seconds.
    // Let's use SECONDS for score to keep numbers smaller and aligned with TTL.
    const nowSeconds = Math.floor(Date.now() / 1000);

    const result = await redis.checkRateLimit(
        key,
        limit,
        nowSeconds,
        windowSeconds
    );

    return result === 1; // 1 = OK, 0 = BLOCKED
}

module.exports = {
    redis,
    checkRateLimit
};
