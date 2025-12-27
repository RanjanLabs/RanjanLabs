window.toggleSidebar = function() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    if (sidebar && overlay) {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
    }
};

window.scrollToTop = function() {
    const viewport = document.getElementById('viewport');
    if (viewport) {
        viewport.scrollTo({ top: 0, behavior: 'smooth' });
    }
};

const POSTS_JSON_PATH = './content/index.json';
const RECENT_POST_FOLDER = 'blog'; 
let allLoadedBlogPosts = [];

async function initBlog() {
    const container = document.getElementById('recent-posts');
    if (!container) return;

    try {
        const response = await fetch(POSTS_JSON_PATH);
        const data = await response.json();
        allLoadedBlogPosts = data.filter(p => p.folder === RECENT_POST_FOLDER).slice(0, 10);
        
        container.innerHTML = allLoadedBlogPosts.map(p => `
            <a href="blog.html?post=${p.fileName}" class="item-card">
                <span class="card-meta">${p.date || 'TRANSMISSION'}</span>
                <h3 class="card-title">${p.title}</h3>
                <p class="card-body">${p.summary || 'Click to view...'}</p>
            </a>
        `).join('');
    } catch(e) {
        container.innerHTML = '<p class="p-4 text-muted">Transmissions offline.</p>';
    }
}

window.addEventListener('DOMContentLoaded', () => {
    initBlog();
    
    const viewport = document.getElementById('viewport');
    const scrollBtn = document.getElementById('scrollTopBtn');
    if (viewport && scrollBtn) {
        viewport.addEventListener('scroll', () => {
            if (viewport.scrollTop > 300) scrollBtn.classList.add('visible');
            else scrollBtn.classList.remove('visible');
        });
    }

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase().trim();
            const container = document.getElementById('recent-posts');
            if (!container) return;
            
            const filtered = allLoadedBlogPosts.filter(p => 
                p.title.toLowerCase().includes(term) || p.summary.toLowerCase().includes(term)
            );
            
            container.innerHTML = filtered.map(p => `
                <a href="blog.html?post=${p.fileName}" class="item-card">
                    <span class="card-meta">${p.date || 'TRANSMISSION'}</span>
                    <h3 class="card-title">${p.title}</h3>
                    <p class="card-body">${p.summary || 'Click to view...'}</p>
                </a>
            `).join('');
        });
    }
});