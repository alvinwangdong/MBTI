import { csvResponse, makeCode, requireAdmin } from '../_utils.js';

export async function onRequestPost({ request, env }) {
    const adminError = requireAdmin(request, env);

    if (adminError) {
        return adminError;
    }

    const createdAt = new Date().toISOString();
    const codes = Array.from({ length: 50 }, () => makeCode());
    const statements = codes.map((code) => env.DB.prepare(
        'INSERT INTO access_codes (code, status, created_at) VALUES (?, ?, ?)'
    ).bind(code, 'unused', createdAt));

    await env.DB.batch(statements);

    return csvResponse(
        `codes-${createdAt.slice(0, 10)}.csv`,
        ['code', 'status', 'created_at', 'used_at', 'redbook_username', 'result_type'],
        codes.map((code) => ({
            code,
            status: 'unused',
            created_at: createdAt,
            used_at: '',
            redbook_username: '',
            result_type: ''
        }))
    );
}
