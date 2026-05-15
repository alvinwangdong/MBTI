import { csvResponse, requireAdmin } from '../_utils.js';

export async function onRequestGet({ request, env }) {
    const adminError = requireAdmin(request, env);

    if (adminError) {
        return adminError;
    }

    const { results } = await env.DB.prepare(
        'SELECT code, status, created_at, used_at, redbook_username, result_type FROM access_codes ORDER BY created_at DESC, id DESC'
    ).all();

    return csvResponse(
        `all-codes-${new Date().toISOString().slice(0, 10)}.csv`,
        ['code', 'status', 'created_at', 'used_at', 'redbook_username', 'result_type'],
        results || []
    );
}
