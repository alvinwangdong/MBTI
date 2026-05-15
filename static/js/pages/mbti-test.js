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
            testArea.style.display = 'flex';
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
        var questionContainer = document.getElementById('mbtiquestion');
        var titleElement = document.getElementById('question-title');
        var optionsElement = document.getElementById('question-options');
        var progressText = document.getElementById('progress-text');
        var progressPercent = document.getElementById('progress-percent');
        var progressBar = document.getElementById('progress-bar');
        var prevButton = document.getElementById('prev-question');
        var nextButton = document.getElementById('next-question');
        var messageElement = document.getElementById('quiz-message');

        if (!questionContainer || questionContainer.dataset.loaded === 'true') {
            return;
        }

        questionContainer.dataset.loaded = 'true';

        var questions = [];
        var answers = [];
        var currentIndex = 0;
        var isSubmitting = false;

        function setQuizMessage(message, isError) {
            if (!messageElement) {
                return;
            }

            messageElement.textContent = message || '';
            messageElement.className = isError ? 'quiz-message quiz-message-error' : 'quiz-message';
        }

        function getAnsweredCount() {
            return answers.filter(function (answer) {
                return Boolean(answer);
            }).length;
        }

        function renderQuestion() {
            var item = questions[currentIndex];
            var questionNumber = currentIndex + 1;
            var answeredCount = getAnsweredCount();
            var percent = questions.length ? Math.round((answeredCount / questions.length) * 100) : 0;

            if (!item) {
                return;
            }

            titleElement.textContent = questionNumber + '. ' + item.question;
            progressText.textContent = '第 ' + questionNumber + ' / ' + questions.length + ' 题';
            progressPercent.textContent = percent + '%';
            progressBar.style.width = percent + '%';
            prevButton.disabled = currentIndex === 0 || isSubmitting;
            nextButton.disabled = !answers[currentIndex] || isSubmitting;
            nextButton.textContent = currentIndex === questions.length - 1 ? '查看结果' : '下一题';

            optionsElement.innerHTML = [
                createOptionMarkup(item.choice_a, questionNumber, 'a'),
                createOptionMarkup(item.choice_b, questionNumber, 'b')
            ].join('');

            setQuizMessage('', false);
        }

        function createOptionMarkup(choice, questionNumber, key) {
            var id = 'question-' + questionNumber + '-choice-' + key;
            var checked = answers[currentIndex] === choice.value ? ' checked' : '';

            return [
                '<label class="quiz-option" for="' + id + '">',
                '    <input id="' + id + '" name="answer-' + questionNumber + '" value="' + choice.value + '" type="radio"' + checked + '>',
                '    <span>' + choice.text + '</span>',
                '</label>'
            ].join('');
        }

        function submitResult() {
            var finalAnswers = answers.slice(0, questions.length);

            if (finalAnswers.length !== questions.length || finalAnswers.some(function (answer) { return !answer; })) {
                setQuizMessage('还有题目未完成，请检查后继续。', true);
                return;
            }

            if (!accessInfo || !accessInfo.code || !accessInfo.redbookUsername) {
                alert('请先填写小红书用户名和测试 code。');
                window.location.reload();
                return;
            }

            try {
                var page = window.MBTIScoring.calculatePersonalityType(finalAnswers);
                var scores = window.MBTIScoring.calculateScores(finalAnswers);

                isSubmitting = true;
                prevButton.disabled = true;
                nextButton.disabled = true;
                nextButton.textContent = '提交中...';
                setQuizMessage('正在生成你的专属报告...', false);

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
                        isSubmitting = false;
                        renderQuestion();
                        setQuizMessage(error.message || '结果提交失败，请联系我处理。', true);
                    });
            } catch (error) {
                alert('评分失败，请刷新页面后重试。');
            }
        }

        optionsElement.addEventListener('change', function (event) {
            var target = event.target;

            if (!(target instanceof HTMLInputElement) || target.type !== 'radio') {
                return;
            }

            answers[currentIndex] = target.value;
            renderQuestion();
        });

        prevButton.addEventListener('click', function () {
            if (currentIndex > 0 && !isSubmitting) {
                currentIndex -= 1;
                renderQuestion();
            }
        });

        nextButton.addEventListener('click', function () {
            if (!answers[currentIndex] || isSubmitting) {
                setQuizMessage('请选择一个更符合你的选项。', true);
                return;
            }

            if (currentIndex < questions.length - 1) {
                currentIndex += 1;
                renderQuestion();
                return;
            }

            submitResult();
        });

        fetch('./data/questions.json')
            .then(function (response) {
                if (!response.ok) {
                    throw new Error('Failed to load questions');
                }

                return response.json();
            })
            .then(function (questionList) {
                questions = questionList;
                answers = new Array(questions.length);
                renderQuestion();
            })
            .catch(function () {
                titleElement.textContent = '题库加载失败，请稍后重试。';
                optionsElement.innerHTML = '';
                prevButton.disabled = true;
                nextButton.disabled = true;
            });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAccessGate);
    } else {
        initAccessGate();
    }
})();
