(function () {
    // 通过固定顺序控制 16 型人格在列表页中的展示位置。
    var CARD_ORDER = [
        'ENFJ', 'ENFP', 'ENTJ', 'ENTP',
        'ESFJ', 'ESFP', 'ESTJ', 'ESTP',
        'INFJ', 'INFP', 'INTJ', 'INTP',
        'ISFJ', 'ISFP', 'ISTJ', 'ISTP'
    ];

    var CARD_IMAGES = {
        ENFJ: '2.png',
        ENFP: '3.png',
        ENTJ: '4.png',
        ENTP: '5.png',
        ESFJ: '6.png',
        ESFP: '7.png',
        ESTJ: '8.png',
        ESTP: '1.png',
        INFJ: '2.png',
        INFP: '3.png',
        INTJ: '4.png',
        INTP: '5.png',
        ISFJ: '6.png',
        ISFP: '7.png',
        ISTJ: '8.png',
        ISTP: '1.png'
    };

    var HOVER_PATH = 'm 0,0 0,35.7775 c 24.580441,3.12569 55.897012,-8.199417 90,-8.199417 34.10299,0 65.41956,11.325107 90,8.199417 L 180,0 z';
    var DEFAULT_PATH = 'M0,0C0,0,0,171.14385,0,171.14385C24.580441,186.61523,55.897012,195.90157,90,195.90157C124.10299,195.90157,155.41956,186.61523,180,171.14385C180,171.14385,180,0,180,0C180,0,0,0,0,0C0,0,0,0,0,0';

    function createCardMarkup(personality) {
        // 卡片结构把图片、标题、简介和详情页链接统一封装在一个 a 标签里。
        var imageName = CARD_IMAGES[personality.type] || '1.png';

        return [
            '<a href="./personality-detail.html?type=' + personality.type + '" data-path-hover="' + HOVER_PATH + '" aria-label="查看 ' + personality.type + ' 人格详情">',
            '    <figure>',
            '        <img src="./static/img/' + imageName + '" alt="' + personality.type + ' 人格插图">',
            '        <svg viewBox="0 0 180 210" preserveAspectRatio="none">',
            '            <path d="' + DEFAULT_PATH + '"></path>',
            '            <desc>Created with Snap</desc>',
            '            <defs></defs>',
            '        </svg>',
            '        <figcaption>',
            '            <h2>' + personality.type + '</h2>',
            '            <p>' + personality.description + '</p>',
            '            <span class="card-cta">点击查看详细介绍</span>',
            '        </figcaption>',
            '    </figure>',
            '</a>'
        ].join('');
    }

    function initHoverEffect() {
        // 利用 Snap.svg 改写 path，实现卡片蒙版的悬停形变效果。
        [].slice.call(document.querySelectorAll('#grid > a')).forEach(function (element) {
            var snapInstance = Snap(element.querySelector('svg'));
            var path = snapInstance.select('path');
            var pathConfig = {
                from: path.attr('d'),
                to: element.getAttribute('data-path-hover')
            };

            element.addEventListener('mouseenter', function () {
                path.animate({ path: pathConfig.to }, 330, mina.backout);
            });

            element.addEventListener('mouseleave', function () {
                path.animate({ path: pathConfig.from }, 330, mina.backout);
            });
        });
    }

    function renderGrid(personalities) {
        var grid = document.getElementById('grid');
        // 先把数组转成以人格类型为键的映射，便于按 CARD_ORDER 取值。
        var personalityMap = personalities.reduce(function (accumulator, item) {
            accumulator[item.type] = item;
            return accumulator;
        }, {});

        grid.innerHTML = CARD_ORDER.filter(function (type) {
            return Boolean(personalityMap[type]);
        }).map(function (type) {
            return createCardMarkup(personalityMap[type]);
        }).join('');

        initHoverEffect();
    }

    // 列表页同样依赖静态 JSON，方便后续统一维护 16 型人格文案。
    $.getJSON('./data/personality-content.json', function (personalities) {
        renderGrid(personalities);
    }).fail(function () {
        document.getElementById('grid').innerHTML = '<p class="grid-error">人格数据加载失败，请稍后重试。</p>';
    });
})();