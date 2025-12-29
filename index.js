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
const viewport = document.getElementById('viewport');

// --- 3. THEME MANAGER ---
function toggleTheme() {
    const body = document.body;
    const isDark = body.getAttribute('data-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    
    body.setAttribute('data-theme', isDark ? '' : 'dark');
    localStorage.setItem('theme', newTheme);
}

// Check saved preference
if (localStorage.getItem('theme') === 'dark') {
    document.body.setAttribute('data-theme', 'dark');
}
window.toggleTheme = toggleTheme;

// --- 4. NAVIGATION & ROUTER ---

// Sidebar Logic
window.toggleSidebar = function() {
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
};
if(overlay) overlay.onclick = window.toggleSidebar;

// Router Logic (Permalink System)
window.closeBlog = function() {
    // 1. UI Reset
    blogViewer.style.display = 'none';
    homeView.style.display = 'block';
    contentRender.innerHTML = ''; // Clear memory
    viewport.scrollTo({ top: 0, behavior: 'smooth' });

    // 2. URL Reset (Remove ?post=...)
    const url = new URL(window.location);
    url.searchParams.delete('post');
    window.history.pushState({}, '', url);
};

async function openBlog(postId, allPosts) {
    const post = allPosts.find(p => p.id === postId);
    if (!post) return;

    // 1. UI Switch
    homeView.style.display = 'none';
    blogViewer.style.display = 'block';
    viewport.scrollTo({ top: 0, behavior: 'smooth' });

    // 2. URL Update (Permalink)
    const url = new URL(window.location);
    url.searchParams.set('post', post.fileName);
    window.history.pushState({}, '', url);

    // 3. Render Engine
    contentRender.innerHTML = '<p style="color:var(--text-dim); font-family:monospace">// FETCHING DOCUMENT...</p>';

    try {
        // ENGINE A: HTML FILES (As Documented - Iframe)
        if (post.fileType === 'html') {
            const iframeSrc = CONTENT_BASE_PATH + post.fileName;
            contentRender.innerHTML = `
                <iframe src="${iframeSrc}" 
                    style="width: 100%; height: 80vh; border: none; background: #fff; border-radius: 8px;">
                </iframe>
                <p style="font-size:0.8rem; color:var(--text-muted); margin-top:10px;">
                    * Document loaded in isolation environment.
                </p>
            `;
            return;
        }

        // ENGINE B: MARKDOWN FILES (GitHub Style)
        const response = await fetch(CONTENT_BASE_PATH + post.fileName);
        if (!response.ok) throw new Error("File not found");
        const text = await response.text();

        if (window.marked) {
            marked.setOptions({ gfm: true, breaks: true }); // Enable GitHub Flavor
            contentRender.innerHTML = marked.parse(text);
        } else {
            contentRender.innerHTML = `<pre>${text}</pre>`;
        }

    } catch (err) {
        contentRender.innerHTML = `<p style="color:red">ERROR: Could not load ${post.fileName}</p>`;
    }
}

// --- 5. INITIALIZATION ---

async function initSystem() {
    try {
        // 1. Fetch Metadata
        const response = await fetch(POSTS_JSON_PATH);
        const allPosts = await response.json();
        
        // 2. Render Home List
        renderPosts(allPosts, allPosts);

        // 3. Search Listener
        if(searchInput) {
            searchInput.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase();
                const filtered = allPosts.filter(p => 
                    p.title.toLowerCase().includes(term)
                );
                renderPosts(filtered, allPosts);
            });
        }

        // 4. CHECK URL FOR PERMALINK
        const params = new URLSearchParams(window.location.search);
        const permalinkFile = params.get('post');
        
        if (permalinkFile) {
            const linkedPost = allPosts.find(p => p.fileName === permalinkFile);
            if (linkedPost) {
                openBlog(linkedPost.id, allPosts);
            }
        }

    } catch (err) {
        console.error(err);
        recentPostsContainer.innerHTML = '<p style="color:red">SYSTEM ERROR: Metadata not found.</p>';
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

// Start Engine
initSystem();
