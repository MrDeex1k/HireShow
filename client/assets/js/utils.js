function isMobile() {
    return window.innerWidth <= 480;
}

function isTablet() {
    return window.innerWidth > 480 && window.innerWidth <= 768;
}

function isDesktop() {
    return window.innerWidth > 768;
}

function getDeviceType() {
    if (isMobile()) return 'mobile';
    if (isTablet()) return 'tablet';
    return 'desktop';
}

window.addEventListener('resize', function() {
    console.log('Window resized:', {
        width: window.innerWidth,
        height: window.innerHeight,
        device: getDeviceType()
    });
});
