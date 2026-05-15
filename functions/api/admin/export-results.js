import { csvResponse, requireAdmin } from '../_utils.js';

export async function onRequestGet({ request, env }) {
    const adminError = requireAdmin(request, env);

    if (adminError) {
        return adminError;
    }

    const { results } = await env.DB.prepare(
        'SELECT created_at, redbook_username, phone, code, result_type, crystal_name, crystal_color, crystal_reason FROM test_results ORDER BY created_at DESC, id DESC'
    ).all();

    const rows = (results || []).map((row) => ({
        '测试时间': row.created_at,
        '小红书用户名': row.redbook_username,
        '手机号': row.phone || '',
        'code': row.code,
        'MBTI': row.result_type,
        '推荐水晶': row.crystal_name,
        '颜色': row.crystal_color,
        '推荐文案': row.crystal_reason
    }));

    return csvResponse(
        `test-results-${new Date().toISOString().slice(0, 10)}.csv`,
        ['测试时间', '小红书用户名', '手机号', 'code', 'MBTI', '推荐水晶', '颜色', '推荐文案'],
        rows
    );
}
