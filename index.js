// --- 1. CONFIGURATION ---
const POSTS_JSON_PATH = './Content/index.json';
const CONTENT_BASE_PATH = './Content/';

// --- 2. GLOBAL VARIABLES ---
let allLoadedBlogPosts = [];

// --- 3. DOM ELEMENTS ---
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
const homeView = document.getElementById('home-view');
const blogViewer = document.getElementById('blog-viewer');
const contentRender = document.getElementById('content-render');
const recentPostsContainer = document.getElementById('recent-posts');
const searchInput = document.getElementById('searchInput');
const viewport = document.getElementById('viewport');
const scrollTopBtn = document.getElementById('scrollTopBtn');

// --- 4. THEME MANAGER ---
window.toggleTheme = function() {
    const body = document.body;
    const isDark = body.getAttribute('data-theme') === 'dark';
    // Switch attribute
    if (isDark) {
        body.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
    } else {
        body.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
    }
};

// Apply saved theme on load
if (localStorage.getItem('theme') === 'dark') {
    document.body.setAttribute('data-theme', 'dark');
}

// --- 5. UI INTERACTION (Sidebar & Scroll) ---
window.toggleSidebar = function() {
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
};
if(overlay) overlay.onclick = window.toggleSidebar;

// Scroll to Top Logic (If button exists in HTML)
window.scrollToTop = function() {
    viewport.scrollTo({ top: 0, behavior: "smooth" });
};
viewport.addEventListener('scroll', () => {
    if (scrollTopBtn) {
        if (viewport.scrollTop > 300) scrollTopBtn.classList.add('visible');
        else scrollTopBtn.classList.remove('visible');
    }
});


// --- 6. ROUTER ENGINE (Permalinks & Navigation) ---

async function handleRouting() {
    const params = new URLSearchParams(window.location.search);
    const permalinkFile = params.get('post');

    if (permalinkFile) {
        // URL has ?post=filename -> Open Reader
        const post = allLoadedBlogPosts.find(p => p.fileName === permalinkFile);
        if (post) {
            renderReaderView(post);
        } else {
            renderHomeView(); // File not found, go home
        }
    } else {
        // No params -> Show Home
        renderHomeView();
    }
}

// Listen for Browser Back/Forward buttons
window.addEventListener('popstate', handleRouting);

// UI Action: Close Blog
window.closeBlog = function() {
    const url = new URL(window.location);
    url.searchParams.delete('post');
    window.history.pushState({}, '', url);
    handleRouting();
};

// UI Action: Open Blog (Called when card is clicked)
function triggerPostOpen(postId) {
    const post = allLoadedBlogPosts.find(p => p.id === postId);
    if (!post) return;

    const url = new URL(window.location);
    url.searchParams.set('post', post.fileName);
    window.history.pushState({}, '', url);
    handleRouting();
}


// --- 7. RENDERING LOGIC ---

function renderHomeView() {
    blogViewer.style.display = 'none';
    homeView.style.display = 'block';
    contentRender.innerHTML = ''; // Clear memory
    viewport.scrollTo({ top: 0, behavior: 'smooth' });
}

async function renderReaderView(post) {
    homeView.style.display = 'none';
    blogViewer.style.display = 'block';
    viewport.scrollTo({ top: 0, behavior: 'smooth' });

    contentRender.innerHTML = '<p style="color:var(--text-dim); font-family:monospace">// LOADING DATA STREAM...</p>';

    try {
        // ENGINE A: HTML FILES (Use Iframe for isolation)
        if (post.fileType === 'html') {
            const iframeSrc = CONTENT_BASE_PATH + post.fileName;
            contentRender.innerHTML = `
                <iframe src="${iframeSrc}" 
                    style="width: 100%; height: 80vh; border: none; background: #fff; border-radius: 12px;">
                </iframe>
                <p style="font-size:0.75rem; color:var(--text-muted); margin-top:10px; font-family:var(--font-mono);">
                    * External document loaded.
                </p>
            `;
            return;
        }

        // ENGINE B: MARKDOWN FILES (Use Marked.js)
        const response = await fetch(CONTENT_BASE_PATH + post.fileName);
        if (!response.ok) throw new Error("File not found");
        const text = await response.text();

        if (window.marked) {
            marked.setOptions({ gfm: true, breaks: true });
            contentRender.innerHTML = marked.parse(text);
        } else {
            // Fallback if marked library fails
            contentRender.innerHTML = `<pre>${text}</pre>`;
        }

    } catch (err) {
        contentRender.innerHTML = `<p style="color:red">ERROR: Could not load ${post.fileName}</p>`;
    }
}


// --- 8. INITIALIZATION ---

async function initSystem() {
    try {
        const response = await fetch(POSTS_JSON_PATH);
        allLoadedBlogPosts = await response.json();
        
        // Render Initial List
        renderPostList(allLoadedBlogPosts);

        // Search Listener
        if(searchInput) {
            searchInput.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase();
                const filtered = allLoadedBlogPosts.filter(p => 
                    p.title.toLowerCase().includes(term)
                );
                renderPostList(filtered);
            });
        }

        // Check URL for direct link
        handleRouting();

    } catch (err) {
        console.error("System Error:", err);
        recentPostsContainer.innerHTML = '<p style="color:red; padding:1rem;">SYSTEM ERROR: Metadata not found.</p>';
    }
}

function renderPostList(posts) {
    recentPostsContainer.innerHTML = '';
    if (posts.length === 0) {
        recentPostsContainer.innerHTML = '<p style="color:var(--text-muted)">No transmissions found.</p>';
        return;
    }
    posts.forEach(post => {
        // Only show items in the 'blog' folder
        if (post.folder !== 'blog') return;

        const card = document.createElement('div');
        card.className = 'item-card';
        card.innerHTML = `
            <span class="card-meta">${post.date}</span>
            <h3 class="card-title">${post.title}</h3>
            <p class="card-body">${post.summary}</p>
        `;
        card.onclick = () => triggerPostOpen(post.id);
        recentPostsContainer.appendChild(card);
    });
}

// Start
initSystem();
