const POSTS_JSON_PATH = './Content/index.json';
const CONTENT_BASE_PATH = './Content/';

const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
const homeView = document.getElementById('home-view');
const blogViewer = document.getElementById('blog-viewer');
const contentRender = document.getElementById('content-render');
const recentPostsContainer = document.getElementById('recent-posts');
const searchInput = document.getElementById('searchInput');

window.toggleSidebar = function() {
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
};

if(overlay) {
    overlay.addEventListener('click', () => {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    });
}


window.closeBlog = function() {
    blogViewer.style.display = 'none';
    homeView.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

async function openBlog(postId, allPosts) {
    const post = allPosts.find(p => p.id === postId);
    if (!post) return;

    // Switch Views
    homeView.style.display = 'none';
    blogViewer.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Show Loading
    contentRender.innerHTML = '<p style="color:gray; font-family:monospace">// DOWNLOADING DATA PACKET...</p>';

    try {
        const response = await fetch(CONTENT_BASE_PATH + post.fileName);
        if (!response.ok) throw new Error("File not found");
        
        const text = await response.text();
        
        // Render Markdown or Text
        if (post.fileType === 'md' && window.marked) {
            contentRender.innerHTML = marked.parse(text);
        } else {
            contentRender.innerHTML = text; 
        }
    } catch (err) {
        contentRender.innerHTML = `<p style="color:red">ERROR: Could not load file. Check if '${post.fileName}' exists in /Content folder.</p>`;
    }
}


async function initSystem() {
    try {
        const response = await fetch(POSTS_JSON_PATH);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const allPosts = await response.json();
        
        // Render the list
        renderPosts(allPosts, allPosts); 

        // Setup Search
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
        console.error(err);
        recentPostsContainer.innerHTML = `
            <div style="color:red; padding:1rem; border:1px solid red; border-radius:8px;">
                <strong>SYSTEM ERROR:</strong> Could not load 'Content/index.json'.<br>
                1. Check if the file exists.<br>
                2. If testing locally, use a local server (VS Code Live Server), not file://.
            </div>
        `;
    }
}

function renderPosts(postsToRender, allPostsReference) {
    recentPostsContainer.innerHTML = '';
    
    if (postsToRender.length === 0) {
        recentPostsContainer.innerHTML = '<p style="color:gray">No transmissions found.</p>';
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
        
        
        card.onclick = () => openBlog(post.id, allPostsReference);
        
        recentPostsContainer.appendChild(card);
    });
}

initSystem();
