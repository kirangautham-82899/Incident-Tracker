import { query } from '../config/database.js';

/**
 * Fixed-window rate limiter stored in Postgres, so limits hold across all
 * serverless instances (an in-memory counter would reset per instance).
 * Fails open if the database is unreachable, so outages don't lock users out.
 *
 *   rateLimit({ name: 'login', max: 10, windowSec: 900 })
 */
export const rateLimit = ({ name, max, windowSec, message }) => async (req, res, next) => {
    if (process.env.RATE_LIMIT_DISABLED === 'true') return next();

    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    const key = `${name}:${ip}`;

    try {
        const { rows } = await query(
            `insert into rate_limits (key, window_start, hits) values ($1, now(), 1)
             on conflict (key) do update set
                hits = case when rate_limits.window_start < now() - make_interval(secs => $2)
                            then 1 else rate_limits.hits + 1 end,
                window_start = case when rate_limits.window_start < now() - make_interval(secs => $2)
                                    then now() else rate_limits.window_start end
             returning hits, extract(epoch from (window_start + make_interval(secs => $2) - now())) as reset_in`,
            [key, windowSec]
        );
        const { hits, reset_in: resetIn } = rows[0];

        res.setHeader('RateLimit-Limit', max);
        res.setHeader('RateLimit-Remaining', Math.max(0, max - hits));

        // Occasionally purge expired windows
        if (Math.random() < 0.01) {
            query(`delete from rate_limits where window_start < now() - interval '1 day'`).catch(() => {});
        }

        if (hits > max) {
            res.setHeader('Retry-After', Math.max(1, Math.ceil(resetIn)));
            return res.status(429).json({
                success: false,
                error: message || 'Too many requests. Please wait a few minutes and try again.'
            });
        }
    } catch (error) {
        console.error('Rate limiter unavailable:', error.message);
    }
    next();
};

// Shared limits
export const limits = {
    login: rateLimit({ name: 'login', max: 10, windowSec: 15 * 60, message: 'Too many login attempts. Try again in 15 minutes.' }),
    register: rateLimit({ name: 'register', max: 5, windowSec: 60 * 60, message: 'Too many accounts created from this network. Try again later.' }),
    profile: rateLimit({ name: 'profile', max: 10, windowSec: 15 * 60 }),
    report: rateLimit({ name: 'report', max: 20, windowSec: 60 * 60, message: 'Too many reports from this network. If this is an emergency, call your local emergency number.' }),
    upload: rateLimit({ name: 'upload', max: 40, windowSec: 60 * 60 }),
    comment: rateLimit({ name: 'comment', max: 30, windowSec: 10 * 60 }),
    verify: rateLimit({ name: 'verify', max: 60, windowSec: 60 * 60 })
};
