const CRYSTALS = {
    INTJ: ['黑发晶', '黑色/透明带黑发丝', '强目标、强规划型人格，黑发晶适合强化边界感、专注力和决策稳定感'],
    INTP: ['白水晶', '透明/白色', '理性、分析、思维发散，白水晶适合净化杂念、提升清晰度和逻辑感'],
    ENTJ: ['钛晶', '金色/透明带金发丝', '领导型、行动力强，钛晶适合强化气场、目标感和事业推进力'],
    ENTP: ['黄水晶', '黄色', '创意强、机会感强，黄水晶适合增强表达、自信和财富吸引感'],
    INFJ: ['紫水晶', '紫色', '洞察力强、敏感细腻，紫水晶适合稳定情绪、增强直觉和内在平衡'],
    INFP: ['粉水晶', '粉色', '感性、浪漫、重视内心世界，粉水晶适合温柔疗愈、提升爱与安全感'],
    ENFJ: ['粉水晶', '粉色', '共情力强、擅长照顾他人，粉水晶适合增强柔和力，也提醒自己被爱'],
    ENFP: ['紫黄晶', '紫色+黄色', '热情、灵感多、情绪能量强，紫黄晶适合兼顾灵感、表达与行动落地'],
    ISTJ: ['茶水晶', '茶色/烟灰色', '稳定、务实、有责任感，茶水晶适合增强安全感、耐力和现实落地力'],
    ISFJ: ['白水晶', '透明/白色', '温和、照顾型、容易内耗，白水晶适合净化负面情绪、保持内在平衡'],
    ESTJ: ['黄水晶', '黄色', '执行力强、重效率和结果，黄水晶适合提升自信、行动力和财富能量'],
    ESFJ: ['草莓晶', '粉红/红粉色', '重视关系、人缘和氛围，草莓晶适合增强人际魅力、亲和力和桃花感'],
    ISTP: ['茶水晶', '茶色/烟灰色', '冷静、独立、实用主义，茶水晶适合增强定力、抗干扰能力和稳定感'],
    ISFP: ['草莓晶', '粉红/红粉色', '审美强、感受细腻，草莓晶适合提升魅力、温柔表达和自我欣赏'],
    ESTP: ['红发晶', '红色/透明带红发丝', '行动力强、喜欢挑战和即时反馈，红发晶适合增强活力、勇气和热情'],
    ESFP: ['黄水晶', '黄色', '外向、快乐、感染力强，黄水晶适合放大个人魅力、自信和丰盛感']
};

const VALID_TYPES = new Set(Object.keys(CRYSTALS));

export function json(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'content-type': 'application/json; charset=utf-8'
        }
    });
}

export async function readJson(request) {
    try {
        return await request.json();
    } catch (error) {
        return null;
    }
}

export function getCrystal(type) {
    const item = CRYSTALS[type];

    if (!item) {
        return null;
    }

    return {
        type,
        crystal: item[0],
        color: item[1],
        reason: item[2]
    };
}

export function isValidType(type) {
    return VALID_TYPES.has(type);
}

export function requireAdmin(request, env) {
    const password = request.headers.get('x-admin-password') || '';

    if (!env.ADMIN_PASSWORD) {
        return json({ ok: false, message: 'ADMIN_PASSWORD is not configured.' }, 500);
    }

    if (password !== env.ADMIN_PASSWORD) {
        return json({ ok: false, message: '管理密码不正确。' }, 401);
    }

    return null;
}

export function csvEscape(value) {
    const text = value == null ? '' : String(value);
    return '"' + text.replace(/"/g, '""') + '"';
}

export function csvResponse(filename, headers, rows) {
    const body = '\ufeff' + [
        headers.map(csvEscape).join(','),
        ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(','))
    ].join('\n');

    return new Response(body, {
        headers: {
            'content-type': 'text/csv; charset=utf-8',
            'content-disposition': `attachment; filename="${filename}"`
        }
    });
}

export function makeCode() {
    const bytes = new Uint8Array(6);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('').toUpperCase();
}
