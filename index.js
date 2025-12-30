// --- 1. CONFIGURATION ---
const POSTS_JSON_PATH = './Content/index.json';
const CONTENT_BASE_PATH = './Content/';

// --- 2. STATE MANAGEMENT ---
let allLoadedBlogPosts = []; // Global store for data

// --- 3. SELECTORS ---
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
const homeView = document.getElementById('home-view');
const blogViewer = document.getElementById('blog-viewer');
const contentRender = document.getElementById('content-render');
const recentPostsContainer = document.getElementById('recent-posts');
const searchInput = document.getElementById('searchInput');
const viewport = document.getElementById('viewport');

// --- 4. THEME MANAGER ---
function toggleTheme() {
    const body = document.body;
    const isDark = body.getAttribute('data-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    
    body.setAttribute('data-theme', isDark ? '' : 'dark');
    localStorage.setItem('theme', newTheme);
}

if (localStorage.getItem('theme') === 'dark') {
    document.body.setAttribute('data-theme', 'dark');
}
window.toggleTheme = toggleTheme;

// --- 5. SIDEBAR LOGIC ---
window.toggleSidebar = function() {
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
};
if(overlay) overlay.onclick = window.toggleSidebar;


// --- 6. ROUTER ENGINE (The Fix) ---

// A. Central Function to decide what to show based on URL
async function handleRouting() {
    const params = new URLSearchParams(window.location.search);
    const permalinkFile = params.get('post');

    if (permalinkFile) {
        // 1. URL says: Show a Post
        const post = allLoadedBlogPosts.find(p => p.fileName === permalinkFile);
        if (post) {
            renderReaderView(post);
        } else {
            // File not found in JSON? Go home.
            renderHomeView();
        }
    } else {
        // 2. URL says: No post param? Show Home.
        renderHomeView();
    }
}

// B. Listen for Browser Back/Forward buttons
window.addEventListener('popstate', handleRouting);

// C. UI Actions (Buttons call these)
window.closeBlog = function() {
    // Update URL to remove ?post=...
    const url = new URL(window.location);
    url.searchParams.delete('post');
    window.history.pushState({}, '', url);
    
    // Trigger Router
    handleRouting();
};

function triggerPostOpen(postId) {
    const post = allLoadedBlogPosts.find(p => p.id === postId);
    if (!post) return;

    // Update URL to include ?post=...
    const url = new URL(window.location);
    url.searchParams.set('post', post.fileName);
    window.history.pushState({}, '', url);

    // Trigger Router
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
    // Switch UI
    homeView.style.display = 'none';
    blogViewer.style.display = 'block';
    viewport.scrollTo({ top: 0, behavior: 'smooth' });

    // Show Loading
    contentRender.innerHTML = '<p style="color:var(--text-dim); font-family:monospace">// DECRYPTING DATA STREAM...</p>';

    try {
        // ENGINE A: HTML FILES (Iframe)
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
            marked.setOptions({ gfm: true, breaks: true });
            contentRender.innerHTML = marked.parse(text);
        } else {
            contentRender.innerHTML = `<pre>${text}</pre>`;
        }

    } catch (err) {
        contentRender.innerHTML = `<p style="color:red">ERROR: Could not load ${post.fileName}</p>`;
    }
}


// --- 8. INITIALIZATION ---

async function initSystem() {
    try {
        // 1. Fetch Metadata
        const response = await fetch(POSTS_JSON_PATH);
        allLoadedBlogPosts = await response.json(); // Save to global var
        
        // 2. Render List
        renderPostList(allLoadedBlogPosts);

        // 3. Setup Search
        if(searchInput) {
            searchInput.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase();
                const filtered = allLoadedBlogPosts.filter(p => 
                    p.title.toLowerCase().includes(term)
                );
                renderPostList(filtered);
            });
        }

        // 4. CHECK URL (Run Router for the first time)
        handleRouting();

    } catch (err) {
        console.error(err);
        recentPostsContainer.innerHTML = '<p style="color:red">SYSTEM ERROR: Metadata not found.</p>';
    }
}

function renderPostList(posts) {
    recentPostsContainer.innerHTML = '';
    if (posts.length === 0) {
        recentPostsContainer.innerHTML = '<p style="color:var(--text-muted)">No transmissions found.</p>';
        return;
    }
    posts.forEach(post => {
        if (post.folder !== 'blog') return;
        const card = document.createElement('div');
        card.className = 'item-card';
        card.innerHTML = `
            <span class="card-meta">${post.date}</span>
            <h3 class="card-title">${post.title}</h3>
            <p class="card-body">${post.summary}</p>
        `;
        // Click triggers the URL update
        card.onclick = () => triggerPostOpen(post.id);
        recentPostsContainer.appendChild(card);
    });
}

// Start Engine
initSystem();
