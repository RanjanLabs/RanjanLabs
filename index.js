
const POSTS_JSON_PATH = './Content/index.json';
const CONTENT_BASE_PATH = './Content/';
const RECENT_POST_FOLDER = 'blog'; 


const blogContentCache = {};
let allLoadedBlogPosts = [];



const contentWrap = document.querySelector('.content-wrap');
const heroSection = document.querySelector('.hero');
const blogTitleLabel = document.getElementById('blog-title');
const recentPostsGrid = document.getElementById('recent-posts');


const readerView = document.createElement('div');
readerView.id = 'js-reader-view';
readerView.style.display = 'none';
readerView.style.paddingTop = '1rem';
readerView.innerHTML = `
    <button id="js-back-btn" style="
        display: flex; align-items: center; gap: 8px;
        background: var(--bg-panel); border: 1px solid var(--border-subtle);
        padding: 10px 16px; border-radius: var(--radius-md);
        cursor: pointer; color: var(--text-dim); font-family: var(--font-mono);
        font-size: 0.8rem; margin-bottom: 2rem; transition: 0.2s;
    ">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        <span>RETURN_TO_TERMINAL</span>
    </button>
    <article id="js-content-render" class="markdown-body" style="line-height: 1.7; color: var(--text-main);"></article>
`;

contentWrap.appendChild(readerView);

const contentRender = document.getElementById('js-content-render');
const backBtn = document.getElementById('js-back-btn');



const showReader = () => {
    
    heroSection.style.display = 'none';
    blogTitleLabel.style.display = 'none';
    recentPostsGrid.style.display = 'none';
    
    
    readerView.style.display = 'block';
    window.scrollToTop();
};

const hideReader = () => {
    
    readerView.style.display = 'none';
    
    
    heroSection.style.display = 'block';
    blogTitleLabel.style.display = 'flex'; 
    recentPostsGrid.style.display = 'grid'; 
    window.scrollToTop();
};

backBtn.addEventListener('click', hideReader);



const openPost = async (postId) => {
    const post = allLoadedBlogPosts.find(p => p.id === postId);
    if (!post) return;

    showReader();
    contentRender.innerHTML = '<p style="color:var(--text-muted)">

    const contentPath = CONTENT_BASE_PATH + post.fileName;

    
    if (!blogContentCache[contentPath]) {
        try {
            const response = await fetch(contentPath);
            if (!response.ok) throw new Error("File not found");
            const text = await response.text();
            blogContentCache[contentPath] = text;
        } catch (err) {
            contentRender.innerHTML = `<p style="color:red">
            return;
        }
    }

    
    const rawContent = blogContentCache[contentPath];
    if (post.fileType === 'md' && window.marked) {
        contentRender.innerHTML = marked.parse(rawContent);
    } else {
        contentRender.innerHTML = rawContent;
    }
};

const displayPostLinks = (posts) => {
    recentPostsGrid.innerHTML = '';
    
    if (posts.length === 0) {
        recentPostsGrid.innerHTML = '<div style="color:var(--text-muted)">No transmissions found.</div>';
        return;
    }

    posts.forEach(post => {
        
        const card = document.createElement('div');
        card.className = 'item-card';
        card.innerHTML = `
            <span class="card-meta">${post.date}</span>
            <h3 class="card-title">${post.title}</h3>
            <p class="card-body">${post.summary}</p>
        `;
        
        card.onclick = () => openPost(post.id);
        recentPostsGrid.appendChild(card);
    });
};



(async () => {
    try {
        const response = await fetch(POSTS_JSON_PATH);
        if (!response.ok) throw new Error("Metadata failed");
        allLoadedBlogPosts = await response.json();
        
        
        const blogPosts = allLoadedBlogPosts.filter(p => p.folder === RECENT_POST_FOLDER);
        displayPostLinks(blogPosts);
    } catch (err) {
        console.error("System Failure:", err);
        recentPostsGrid.innerHTML = `<p style="color:red">SYSTEM_FAILURE: ${err.message}</p>`;
    }
})();



const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
const searchInput = document.getElementById('searchInput');


window.toggleSidebar = () => {
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
};


overlay.onclick = window.toggleSidebar;


searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    
    
    if (readerView.style.display === 'block' && term.length > 0) {
        hideReader();
    }

    const filtered = allLoadedBlogPosts.filter(p => 
        (p.title + p.summary + p.searchableContent).toLowerCase().includes(term)
    );
    
    
    blogTitleLabel.textContent = term ? `SEARCH_RESULTS: ${filtered.length}` : 'LATEST_TRANSMISSIONS';
    displayPostLinks(filtered);
});


const scrollBtn = document.getElementById('scrollTopBtn');
const viewport = document.getElementById('viewport');

window.scrollToTop = () => viewport.scrollTo({ top: 0, behavior: "smooth" });

viewport.addEventListener('scroll', () => {
    if (viewport.scrollTop > 300) {
        scrollBtn.classList.add('visible');
    } else {
        scrollBtn.classList.remove('visible');
    }
});
