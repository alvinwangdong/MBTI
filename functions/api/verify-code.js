import { json, readJson } from './_utils.js';

export async function onRequestPost({ request, env }) {
    const body = await readJson(request);
    const code = String(body?.code || '').trim().toUpperCase();
    const redbookUsername = String(body?.redbookUsername || '').trim();

    if (!redbookUsername) {
        return json({ ok: false, message: '请先填写小红书用户名。' }, 400);
    }

    if (!code) {
        return json({ ok: false, message: '请输入测试 code。' }, 400);
    }

    const row = await env.DB.prepare(
        'SELECT code, status, used_at FROM access_codes WHERE code = ? LIMIT 1'
    ).bind(code).first();

    if (!row) {
        return json({ ok: false, message: 'code 不存在，请联系我获取新的测试 code。' }, 404);
    }

    if (row.status === 'used' || row.used_at) {
        return json({ ok: false, message: '这个 code 已经使用过，请联系我获取新的测试 code。' }, 409);
    }

    return json({ ok: true, code, redbookUsername });
}
