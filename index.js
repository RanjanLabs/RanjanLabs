// --- 1. CONFIGURATION ---
const POSTS_JSON_PATH = './Content/index.json';
const CONTENT_BASE_PATH = './Content/';

// --- 2. SELECTORS ---
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
const homeView = document.getElementById('home-view');
const blogViewer = document.getElementById('blog-viewer');
const contentRender = document.getElementById('content-render');
const recentPostsContainer = document.getElementById('recent-posts');
const searchInput = document.getElementById('searchInput');
const scrollTopBtn = document.getElementById('scrollTopBtn');
const viewport = document.getElementById('viewport'); // The element that actually scrolls

// --- 3. THEME TOGGLE LOGIC (Dark Mode) ---
window.toggleTheme = function() {
    const body = document.body;
    const isDark = body.getAttribute('data-theme') === 'dark';
    
    if (isDark) {
        body.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
    } else {
        body.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
    }
};

// Check preference on load
if (localStorage.getItem('theme') === 'dark') {
    document.body.setAttribute('data-theme', 'dark');
}

// --- 4. NAVIGATION & SCROLL LOGIC ---

// Sidebar
window.toggleSidebar = function() {
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
};
if(overlay) overlay.onclick = window.toggleSidebar;

// Scroll to Top (Works for both Main Page and Blog)
window.scrollToTop = function() {
    viewport.scrollTo({ top: 0, behavior: "smooth" });
};

// Show/Hide Scroll Button based on scroll position
viewport.addEventListener('scroll', () => {
    if (viewport.scrollTop > 400) {
        scrollTopBtn.classList.add('visible');
    } else {
        scrollTopBtn.classList.remove('visible');
    }
});

// Close Blog / Return Home
window.closeBlog = function() {
    blogViewer.style.display = 'none';
    homeView.style.display = 'block';
    viewport.scrollTo({ top: 0, behavior: 'smooth' }); // Reset scroll
};

// --- 5. BLOG RENDERING LOGIC ---

async function openBlog(postId, allPosts) {
    const post = allPosts.find(p => p.id === postId);
    if (!post) return;

    homeView.style.display = 'none';
    blogViewer.style.display = 'block';
    viewport.scrollTo({ top: 0, behavior: 'smooth' });

    contentRender.innerHTML = '<p style="color:var(--text-dim); font-family:monospace">// DECRYPTING DATA STREAM...</p>';

    try {
        const response = await fetch(CONTENT_BASE_PATH + post.fileName);
        if (!response.ok) throw new Error("404");
        
        const text = await response.text();
        
        // Render Markdown using marked.js
        if (post.fileType === 'md' && window.marked) {
            contentRender.innerHTML = marked.parse(text);
        } else {
            contentRender.innerHTML = text;
        }

        // Add a secondary "Back to Top" link at the bottom of the article for convenience
        const bottomNav = document.createElement('div');
        bottomNav.style.marginTop = "3rem";
        bottomNav.style.paddingTop = "1rem";
        bottomNav.style.borderTop = "1px solid var(--border-subtle)";
        bottomNav.innerHTML = `
            <button onclick="window.scrollToTop()" style="background:none; border:none; color:var(--accent); cursor:pointer; font-family:var(--font-mono);">
                ↑ RETURN_TO_HEADER
            </button>
        `;
        contentRender.appendChild(bottomNav);

    } catch (err) {
        contentRender.innerHTML = `<p style="color:red">ERROR: Data packet lost for ${post.fileName}</p>`;
    }
}

// --- 6. INITIALIZATION ---

async function initSystem() {
    try {
        const response = await fetch(POSTS_JSON_PATH);
        const allPosts = await response.json();
        renderPosts(allPosts, allPosts);

        if(searchInput) {
            searchInput.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase();
                const filtered = allPosts.filter(p => 
                    p.title.toLowerCase().includes(term) || 
                    (p.summary && p.summary.toLowerCase().includes(term))
                );
                renderPosts(filtered, allPosts);
            });
        }
    } catch (err) {
        console.error("System Failure:", err);
        recentPostsContainer.innerHTML = '<p style="color:red">SYSTEM OFFLINE: Metadata missing.</p>';
    }
}

function renderPosts(postsToRender, allPostsRef) {
    recentPostsContainer.innerHTML = '';
    if (postsToRender.length === 0) {
        recentPostsContainer.innerHTML = '<p style="color:var(--text-muted)">No transmissions found.</p>';
        return;
    }
    postsToRender.forEach(post => {
        if (post.folder !== 'blog') return;
        const card = document.createElement('div');
        card.className = 'item-card';
        card.innerHTML = `
            <span class="card-meta">${post.date}</span>
            <h3 class="card-title">${post.title}</h3>
            <p class="card-body">${post.summary}</p>
        `;
        card.onclick = () => openBlog(post.id, allPostsRef);
        recentPostsContainer.appendChild(card);
    });
}

initSystem();
