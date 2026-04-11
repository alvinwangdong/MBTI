(function (global) {
    // MBTI 四个维度对应的合法答案值，后续会用它做输入校验。
    var VALID_TYPES = ['E', 'I', 'S', 'N', 'T', 'F', 'J', 'P'];
    // 每两个字母构成一个对立维度，最终结果从每组里选出现次数更多的一项。
    var TYPE_PAIRS = [['E', 'I'], ['S', 'N'], ['T', 'F'], ['J', 'P']];

    function validateAnswers(answerList) {
        if (!Array.isArray(answerList) || answerList.length === 0) {
            throw new Error('answer list is empty');
        }

        answerList.forEach(function (item) {
            if (VALID_TYPES.indexOf(item) === -1) {
                throw new Error('answer type is not in supported types');
            }
        });
    }

    function calculatePersonalityType(answerList) {
        // 先确保答案列表结构合法，再进入统计逻辑。
        validateAnswers(answerList);

        var counts = answerList.reduce(function (accumulator, current) {
            accumulator[current] = (accumulator[current] || 0) + 1;
            return accumulator;
        }, {});

        // 每个维度都选择出现次数更多的那一边，并拼成四位人格代码。
        return TYPE_PAIRS.map(function (pair) {
            return (counts[pair[0]] || 0) > (counts[pair[1]] || 0) ? pair[0] : pair[1];
        }).join('');
    }

    // 挂到 window 上，方便答题页直接调用而不依赖模块系统。
    global.MBTIScoring = {
        calculatePersonalityType: calculatePersonalityType,
        validateAnswers: validateAnswers
    };
})(window);