(function () {
    function getQueryType() {
        // 详情页通过 ?type=INTJ 这样的查询参数决定要读取哪一条人格数据。
        var match = window.location.search.match(/[?&]type=([^&]+)/i);
        return match ? decodeURIComponent(match[1]).toUpperCase() : '';
    }

    function findPersonality(personalities, type) {
        // 数据文件是数组结构，这里按 type 字段顺序查找对应人格。
        for (var index = 0; index < personalities.length; index += 1) {
            if (personalities[index].type === type) {
                return personalities[index];
            }
        }

        return null;
    }

    function updateMeta(selector, content) {
        // 同步更新标题和描述，便于 SEO 与社交分享展示正确的人格信息。
        var element = document.querySelector(selector);

        if (element) {
            element.setAttribute('content', content);
        }
    }

    function renderError(message, subtitleElement, contentElement) {
        // 错误状态下仍保留页面结构，只替换副标题和正文内容。
        subtitleElement.textContent = message;
        contentElement.innerHTML = '<p>' + message + '</p>';
    }

    $(function () {
        // 这些 DOM 节点是详情页渲染的核心出口，任何一个缺失都直接中止执行。
        var typeElement = document.getElementById('personality-type');
        var subtitleElement = document.getElementById('personality-subtitle');
        var contentElement = document.getElementById('personality-content');
        var personalityType = getQueryType();

        if (!typeElement || !subtitleElement || !contentElement) {
            return;
        }

        if (!personalityType) {
            renderError('缺少人格类型参数。', subtitleElement, contentElement);
            return;
        }

        // 统一从 JSON 读取人格正文，保证列表页和详情页使用同一份数据源。
        $.getJSON('./data/personality-content.json', function (personalities) {
            var personality = findPersonality(personalities, personalityType);

            if (!personality) {
                renderError('未找到对应的人格类型。', subtitleElement, contentElement);
                return;
            }

            typeElement.textContent = personality.type;
            subtitleElement.textContent = personality.subtitle || '人格详情';
            contentElement.innerHTML = personality.contentHtml || '<p>暂无人格详情内容。</p>';

            // 页面标题与 meta 描述跟随人格切换，方便搜索结果和分享卡片显示正确信息。
            document.title = personality.type + ' | MBTI 人格详情';
            updateMeta('meta[property="og:title"]', personality.type + ' | MBTI 人格详情');
            updateMeta('meta[property="og:description"]', personality.description || personality.subtitle || '查看 MBTI 各人格类型的详细解析。');
            updateMeta('meta[name="description"]', personality.description || personality.subtitle || '查看 MBTI 各人格类型的详细解析。');
        }).fail(function () {
            renderError('人格数据加载失败，请稍后重试。', subtitleElement, contentElement);
        });
    });
})();
