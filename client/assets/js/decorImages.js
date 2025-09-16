(function () {
    var isHome = document.body.classList.contains('page-home');
    var leftTop = document.querySelector('.decor-image.left.stack-top');
    var leftBottom = document.querySelector('.decor-image.left.stack-bottom');
    var rightTop = document.querySelector('.decor-image.right.stack-top');
    var rightBottom = document.querySelector('.decor-image.right.stack-bottom');
    var leftImg = document.querySelector('.decor-image.left');
    var rightImg = document.querySelector('.decor-image.right');
    if (isHome) {
        if (!leftTop || !leftBottom || !rightTop || !rightBottom) return;
    } else {
        if (!leftImg || !rightImg) return;
    }

    var photos = [
        'girl-1.png',
        'girl-2.png',
        'girl-3.png',
        'girl-4.png',
        'men-1.png',
        'men-2.png'
    ];

    function pickTwoDistinct(arr) {
        var firstIndex = Math.floor(Math.random() * arr.length);
        var secondIndex = Math.floor(Math.random() * (arr.length - 1));
        if (secondIndex >= firstIndex) secondIndex += 1;
        return [arr[firstIndex], arr[secondIndex]];
    }

    var isInViews = window.location.pathname.indexOf('/views/') !== -1;
    var basePath = isInViews ? '../assets/images/photos/' : 'assets/images/photos/';

    if (isHome) {
        var pool = photos.slice();
        function drawOne() { return pool.splice(Math.floor(Math.random() * pool.length), 1)[0]; }
        leftTop.src = basePath + drawOne();
        leftBottom.src = basePath + drawOne();
        rightTop.src = basePath + drawOne();
        rightBottom.src = basePath + drawOne();
    } else {
        var picked = pickTwoDistinct(photos);
        leftImg.src = basePath + picked[0];
        rightImg.src = basePath + picked[1];
    }
})();


