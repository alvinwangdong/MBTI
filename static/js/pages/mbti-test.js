(function () {
    var accessInfo = null;

    function setGateMessage(message, isError) {
        var messageElement = document.getElementById('gate-message');

        if (!messageElement) {
            return;
        }

        messageElement.textContent = message || '';
        messageElement.className = isError ? 'gate-message gate-message-error' : 'gate-message';
    }

    function setGateLoading(isLoading) {
        var button = document.getElementById('gate-submit');

        if (button) {
            button.disabled = isLoading;
            button.textContent = isLoading ? '校验中...' : '开始测试';
        }
    }

    function showQuestionArea() {
        var gate = document.getElementById('access-gate');
        var testArea = document.getElementById('test-area');

        if (gate) {
            gate.style.display = 'none';
        }

        if (testArea) {
            testArea.style.display = 'block';
        }
    }

    function getAccessInfo() {
        try {
            return JSON.parse(sessionStorage.getItem('mbtiAccessInfo') || 'null');
        } catch (error) {
            return null;
        }
    }

    function saveAccessInfo(info) {
        accessInfo = info;
        sessionStorage.setItem('mbtiAccessInfo', JSON.stringify(info));
    }

    function initAccessGate() {
        var form = document.getElementById('access-form');

        if (!form) {
            return;
        }

        accessInfo = getAccessInfo();

        if (accessInfo && accessInfo.code && accessInfo.redbookUsername) {
            showQuestionArea();
            initMBTIPage();
            return;
        }

        form.addEventListener('submit', function (event) {
            event.preventDefault();

            var usernameInput = document.getElementById('redbook-username');
            var codeInput = document.getElementById('access-code');
            var redbookUsername = usernameInput ? usernameInput.value.trim() : '';
            var code = codeInput ? codeInput.value.trim().toUpperCase() : '';

            if (!redbookUsername || !code) {
                setGateMessage('请填写小红书用户名和测试 code。', true);
                return;
            }

            setGateLoading(true);
            setGateMessage('', false);

            fetch('/api/verify-code', {
                method: 'POST',
                headers: {
                    'content-type': 'application/json'
                },
                body: JSON.stringify({
                    redbookUsername: redbookUsername,
                    code: code
                })
            })
                .then(function (response) {
                    return response.json().then(function (data) {
                        if (!response.ok || !data.ok) {
                            throw new Error(data.message || 'code 校验失败。');
                        }

                        return data;
                    });
                })
                .then(function (data) {
                    saveAccessInfo({
                        redbookUsername: data.redbookUsername,
                        code: data.code
                    });
                    showQuestionArea();
                    initMBTIPage();
                })
                .catch(function (error) {
                    setGateMessage(error.message || 'code 校验失败，请稍后重试。', true);
                })
                .finally(function () {
                    setGateLoading(false);
                });
        });
    }

    function initMBTIPage() {
        // 按作答顺序收集每一题的维度字母，供最终评分使用。
        var answers = [];
        var questionContainer = document.getElementById('mbtiquestion');

        if (!questionContainer || questionContainer.dataset.loaded === 'true') {
            return;
        }

        questionContainer.dataset.loaded = 'true';

        function createQuestionMarkup(item, index) {
            // 每次只显示一道题，减少长表单带来的阅读和滚动负担。
            var display = index === 0 ? 'block' : 'none';
            var questionNumber = index + 1;
            var choiceAId = 'question-' + questionNumber + '-choice-a';
            var choiceBId = 'question-' + questionNumber + '-choice-b';

            return `
                <form class="ac-custom ac-radio ac-circle" autocomplete="off" style="display: ${display}">
                    <fieldset>
                        <legend>${questionNumber}. ${item.question}</legend>
                        <ul>
                            <li>
                                <input id="${choiceAId}" name="answer-${questionNumber}" value="${item.choice_a.value}" type="radio">
                                <label for="${choiceAId}">
                                    ${item.choice_a.text}
                                </label>
                                <svg viewBox="0 0 100 100"></svg>
                                <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"></svg>
                            </li>
                            <li>
                                <input id="${choiceBId}" name="answer-${questionNumber}" value="${item.choice_b.value}" type="radio">
                                <label for="${choiceBId}">
                                    ${item.choice_b.text}
                                </label>
                                <svg viewBox="0 0 100 100"></svg>
                                <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"></svg>
                            </li>
                        </ul>
                    </fieldset>
                </form>`;
        }

        function appendSvgCheckScript() {
            // 旧项目的单选动画依赖单独脚本，这里在题目渲染完后再动态加载。
            var script = document.createElement('script');
            script.src = './static/js/vendor/svgcheckbx.js';
            document.body.appendChild(script);
        }

        // 题库来自静态 JSON，页面本身不写死具体题目内容。
        fetch('./data/questions.json')
            .then(function (response) {
                if (!response.ok) {
                    throw new Error('Failed to load questions');
                }

                return response.json();
            })
            .then(function (questionList) {
                questionList.forEach(function (item, index) {
                    questionContainer.insertAdjacentHTML('beforeend', createQuestionMarkup(item, index));
                });

                appendSvgCheckScript();

                // 整个答题过程复用一个 change 监听器，避免给每个 radio 单独绑事件。
                questionContainer.addEventListener('change', function (event) {
                    var target = event.target;

                    if (!(target instanceof HTMLInputElement) || target.type !== 'radio') {
                        return;
                    }

                    var answer = target.value;
                    answers.push(answer);

                    var form = target.closest('form');
                    var nextForm = form ? form.nextElementSibling : null;

                    // 留出一点动画时间，再移除当前题并显示下一题。
                    setTimeout(function () {
                        if (form) {
                            form.remove();
                        }

                        if (nextForm) {
                            nextForm.style.display = 'block';
                        }
                    }, 520);

                    if (answers.length === questionList.length) {
                        try {
                            // 所有题目答完后，立即计算人格类型并跳转到统一详情页。
                            var page = window.MBTIScoring.calculatePersonalityType(answers);
                            var scores = window.MBTIScoring.calculateScores(answers);

                            if (!accessInfo || !accessInfo.code || !accessInfo.redbookUsername) {
                                alert('请先填写小红书用户名和测试 code。');
                                window.location.reload();
                                return;
                            }

                            fetch('/api/submit-result', {
                                method: 'POST',
                                headers: {
                                    'content-type': 'application/json'
                                },
                                body: JSON.stringify({
                                    redbookUsername: accessInfo.redbookUsername,
                                    code: accessInfo.code,
                                    phone: '',
                                    resultType: page,
                                    scores: scores
                                })
                            })
                                .then(function (response) {
                                    return response.json().then(function (data) {
                                        if (!response.ok || !data.ok) {
                                            throw new Error(data.message || '结果提交失败。');
                                        }

                                        return data;
                                    });
                                })
                                .then(function (data) {
                                    sessionStorage.removeItem('mbtiAccessInfo');
                                    sessionStorage.setItem('mbtiLatestResult', JSON.stringify(data));
                                    window.location.href = './personality-detail.html?type=' + page + '&submitted=1';
                                })
                                .catch(function (error) {
                                    alert(error.message || '结果提交失败，请联系我处理。');
                                });

                            // 也可以把结果提交到后端，记录用户答题数据
                            //$.ajax({
                            //    type: 'post',
                            //    url: 'http://localhost:8080/common/Update/SubmitMBTI.ashx',
                            //    data: {
                            //        "answers": JSON.stringify(answers),
                            //        "result": page
                            //    },
                            //    async: false,
                            //    error: function (XMLHttpRequest, textStatus, errorThrown) {
                            //        alert("Request Failed!");
                            //    },
                            //    success: function (data) {
                            //        if (data == "true") {
                            //            window.location.href = './personality-detail.html?type=' + page;
                            //        } else {
                            //            alert(data)
                            //        }
                            //    }
                            //});
                        } catch (error) {
                            alert('评分失败，请刷新页面后重试。');
                        }
                    }
                });
            })
            .catch(function () {
                // 如果题库请求失败，直接在容器里显示错误提示，避免页面空白。
                questionContainer.innerHTML = '<p>题库加载失败，请稍后重试。</p>';
            });
    }

    // mbti-test.js 在 head 中加载，因此必须等 DOM 建好后再寻找题目容器并开始渲染。
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAccessGate);
    } else {
        initAccessGate();
    }
})();
