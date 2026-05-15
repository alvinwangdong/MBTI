(function () {
    function getQueryType() {
        // 详情页通过 ?type=INTJ 这样的查询参数决定要读取哪一条人格数据。
        var match = window.location.search.match(/[?&]type=([^&]+)/i);
        return match ? decodeURIComponent(match[1]).toUpperCase() : '';
    }

    function hasSubmittedResult() {
        return /[?&]submitted=1(?:&|$)/i.test(window.location.search);
    }

    function renderCrystalResult(type) {
        var resultElement = document.getElementById('crystal-result');
        var titleElement = document.getElementById('crystal-title');
        var descriptionElement = document.getElementById('crystal-description');

        if (!resultElement || !titleElement || !descriptionElement) {
            return;
        }

        fetch('./data/crystal-recommendations.json')
            .then(function (response) {
                if (!response.ok) {
                    throw new Error('Failed to load crystal recommendations');
                }

                return response.json();
            })
            .then(function (items) {
                var crystal = null;

                for (var index = 0; index < items.length; index += 1) {
                    if (items[index].type === type) {
                        crystal = items[index];
                        break;
                    }
                }

                if (!crystal) {
                    return;
                }

                titleElement.textContent = '恭喜测试成功，您的性格是 ' + type + '，' + crystal.crystal + '非常适合您';
                descriptionElement.textContent = crystal.color + '。' + crystal.reason + '。';
                resultElement.style.display = 'block';
            });
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
        contentElement.innerHTML = '<details class="report-section" open><summary>提示</summary><div class="report-section-body"><p>' + message + '</p></div></details>';
    }

    function groupContentIntoCards(contentElement) {
        var wrapper = document.createElement('div');
        var sections = [];
        var currentSection = null;

        wrapper.innerHTML = contentElement.innerHTML;

        [].slice.call(wrapper.childNodes).forEach(function (node) {
            if (node.nodeType === 1 && node.tagName.toLowerCase() === 'h3') {
                currentSection = document.createElement('details');
                currentSection.className = 'report-section';
                if (sections.length < 2) {
                    currentSection.setAttribute('open', '');
                }

                var summary = document.createElement('summary');
                var body = document.createElement('div');

                body.className = 'report-section-body';
                summary.textContent = node.textContent.trim() || '人格解析';
                currentSection.appendChild(summary);
                currentSection.appendChild(body);
                currentSection.reportBody = body;
                sections.push(currentSection);
                return;
            }

            if (!currentSection) {
                currentSection = document.createElement('details');
                currentSection.className = 'report-section';
                currentSection.setAttribute('open', '');

                var defaultSummary = document.createElement('summary');
                var defaultBody = document.createElement('div');

                defaultBody.className = 'report-section-body';
                defaultSummary.textContent = '核心特质';
                currentSection.appendChild(defaultSummary);
                currentSection.appendChild(defaultBody);
                currentSection.reportBody = defaultBody;
                sections.push(currentSection);
            }

            currentSection.reportBody.appendChild(node.cloneNode(true));
        });

        contentElement.innerHTML = '';
        sections.forEach(function (section) {
            if (section.textContent.trim()) {
                contentElement.appendChild(section);
            }
        });
    }

    function stripText(value, maxLength) {
        var text = (value || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

        if (!maxLength || text.length <= maxLength) {
            return text;
        }

        return text.slice(0, maxLength) + '...';
    }

    function renderSummary(personality) {
        var summaryElement = document.getElementById('report-summary');
        var coreElement = document.getElementById('summary-core');
        var socialElement = document.getElementById('summary-social');
        var growthElement = document.getElementById('summary-growth');

        if (!summaryElement) {
            return;
        }

        if (coreElement) {
            coreElement.textContent = personality.subtitle ? personality.subtitle + '，重视自我理解与内在秩序。' : '重视自我理解与内在秩序。';
        }

        if (socialElement) {
            socialElement.textContent = '在人际中更适合真诚、稳定、被尊重的连接。';
        }

        if (growthElement) {
            growthElement.textContent = '把优势落到行动里，同时保留适度边界与节奏。';
        }

        summaryElement.style.display = 'block';
    }

    function initReportDownload() {
        var button = document.getElementById('download-report');
        var area = document.getElementById('report-download-area');
        var message = document.getElementById('download-message');

        if (!button || !area) {
            return;
        }

        function setMessage(text) {
            if (message) {
                message.textContent = text || '';
            }
        }

        function getPageCss() {
            var css = '';

            [].slice.call(document.styleSheets).forEach(function (sheet) {
                try {
                    [].slice.call(sheet.cssRules || []).forEach(function (rule) {
                        css += rule.cssText + '\n';
                    });
                } catch (error) {
                    // 跨域样式不可读取时跳过，当前页面核心样式均为同源文件。
                }
            });

            return css;
        }

        button.addEventListener('click', function () {
            var width = Math.min(900, Math.max(360, area.scrollWidth));
            var height = area.scrollHeight + 32;
            var clone = area.cloneNode(true);
            var style = document.createElement('style');
            var serialized;
            var svg;
            var image;
            var canvas;
            var context;
            var url;

            button.disabled = true;
            button.textContent = '正在生成...';
            setMessage('正在生成长图，请稍候。');

            clone.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
            clone.style.width = width + 'px';
            clone.style.padding = '16px';
            clone.style.boxSizing = 'border-box';
            style.textContent = getPageCss();
            clone.insertBefore(style, clone.firstChild);

            serialized = new XMLSerializer().serializeToString(clone);
            svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + height + '">' +
                '<foreignObject width="100%" height="100%">' + serialized + '</foreignObject></svg>';
            image = new Image();
            canvas = document.createElement('canvas');
            canvas.width = width * 2;
            canvas.height = height * 2;
            context = canvas.getContext('2d');
            url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));

            image.onload = function () {
                var link = document.createElement('a');

                context.fillStyle = '#FAF9FF';
                context.fillRect(0, 0, canvas.width, canvas.height);
                context.drawImage(image, 0, 0, canvas.width, canvas.height);
                URL.revokeObjectURL(url);

                link.download = 'MBTI人格报告长图.png';
                link.href = canvas.toDataURL('image/png');
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                button.disabled = false;
                button.textContent = '下载长图到手机';
                setMessage('长图已生成，手机浏览器可在下载记录或相册中查看。');
            };

            image.onerror = function () {
                URL.revokeObjectURL(url);
                button.disabled = false;
                button.textContent = '下载长图到手机';
                setMessage('长图生成失败，请截图保存当前报告。');
            };

            image.src = url;
        });
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
            renderSummary(personality);
            groupContentIntoCards(contentElement);

            if (hasSubmittedResult()) {
                renderCrystalResult(personality.type);
            }

            // 页面标题与 meta 描述跟随人格切换，方便搜索结果和分享卡片显示正确信息。
            document.title = personality.type + ' | MBTI 人格详情';
            updateMeta('meta[property="og:title"]', personality.type + ' | MBTI 人格详情');
            updateMeta('meta[property="og:description"]', personality.description || personality.subtitle || '查看 MBTI 各人格类型的详细解析。');
            updateMeta('meta[name="description"]', personality.description || personality.subtitle || '查看 MBTI 各人格类型的详细解析。');
        }).fail(function () {
            renderError('人格数据加载失败，请稍后重试。', subtitleElement, contentElement);
        });

        initReportDownload();
    });
})();
