import { getCrystal, isValidType, json, readJson } from './_utils.js';

export async function onRequestPost({ request, env }) {
    const body = await readJson(request);
    const code = String(body?.code || '').trim().toUpperCase();
    const redbookUsername = String(body?.redbookUsername || '').trim();
    const phone = String(body?.phone || '').trim();
    const resultType = String(body?.resultType || '').trim().toUpperCase();
    const scores = body?.scores && typeof body.scores === 'object' ? body.scores : {};

    if (!redbookUsername) {
        return json({ ok: false, message: '缺少小红书用户名。' }, 400);
    }

    if (!code) {
        return json({ ok: false, message: '缺少测试 code。' }, 400);
    }

    if (!isValidType(resultType)) {
        return json({ ok: false, message: '测试结果类型无效。' }, 400);
    }

    const accessCode = await env.DB.prepare(
        'SELECT code, status, used_at FROM access_codes WHERE code = ? LIMIT 1'
    ).bind(code).first();

    if (!accessCode) {
        return json({ ok: false, message: 'code 不存在，请联系我获取新的测试 code。' }, 404);
    }

    if (accessCode.status === 'used' || accessCode.used_at) {
        return json({ ok: false, message: '这个 code 已经使用过，请联系我获取新的测试 code。' }, 409);
    }

    const crystal = getCrystal(resultType);
    const now = new Date().toISOString();

    const updateResult = await env.DB.prepare(
        'UPDATE access_codes SET status = ?, used_at = ?, redbook_username = ?, result_type = ? WHERE code = ? AND status = ?'
    ).bind('used', now, redbookUsername, resultType, code, 'unused').run();

    if (!updateResult.meta || updateResult.meta.changes !== 1) {
        return json({ ok: false, message: '这个 code 已经使用过，请联系我获取新的测试 code。' }, 409);
    }

    await env.DB.prepare(
        'INSERT INTO test_results (redbook_username, phone, code, result_type, scores_json, crystal_name, crystal_color, crystal_reason, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(
        redbookUsername,
        phone,
        code,
        resultType,
        JSON.stringify(scores),
        crystal.crystal,
        crystal.color,
        crystal.reason,
        now
    ).run();

    return json({
        ok: true,
        resultType,
        crystal
    });
}
