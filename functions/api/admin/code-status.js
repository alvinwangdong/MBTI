import { json, requireAdmin } from '../_utils.js';

export async function onRequestGet({ request, env }) {
    const adminError = requireAdmin(request, env);

    if (adminError) {
        return adminError;
    }

    const url = new URL(request.url);
    const code = String(url.searchParams.get('code') || '').trim().toUpperCase();

    if (!code) {
        return json({ ok: false, message: '请输入要查询的 code。' }, 400);
    }

    const row = await env.DB.prepare(
        'SELECT code, status, created_at, used_at, redbook_username, result_type FROM access_codes WHERE code = ? LIMIT 1'
    ).bind(code).first();

    if (!row) {
        return json({ ok: false, message: '没有找到这个 code。' }, 404);
    }

    return json({ ok: true, code: row });
}
