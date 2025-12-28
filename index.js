
const POSTS_JSON_PATH = './Content/index.json';
const CONTENT_BASE_PATH = './Content/';
const RECENT_POST_FOLDER = 'blog'; 

const blogContentCache = {};
let allLoadedBlogPosts = [];
let advertisementContent = null;

console.log("%cRANJAN LABS SYSTEM ONLINE", "color: #a855f7; font-size: 20px; font-weight: bold;");



const sidebarElement = document.getElementById('sidebar');
const sidebarToggleButton = document.getElementById('sidebarToggleButton');
const closeSidebarButton = document.getElementById('closeSidebarButton');
const topNavigationElement = document.getElementById('topNav');
const scrollToTopButton = document.getElementById("scrollToTopBtn");
const mainContentElement = document.getElementById('mainContent');


const heroSection = document.querySelector('.hero-section');
const gridSection = document.querySelector('.grid-section');
const blogViewerElement = document.getElementById('blog-viewer');


const searchInput = document.getElementById('searchInput');
const recentPostsList = document.getElementById('recent-posts');
const blogViewerTitleElement = document.getElementById('blog-title');




const toggleTopNav = () => {
    topNavigationElement.classList.toggle('show');
    if (sidebarElement.classList.contains('open')) closeSidebar();
};

const openSidebar = () => {
    sidebarElement.classList.add('open');
};

const closeSidebar = () => {
    sidebarElement.classList.remove('open');
};


let startX = 0;
let currentX = 0;
let isSwiping = false;

sidebarElement.addEventListener('touchstart', (e) => {
    if (sidebarElement.classList.contains('open')) {
        startX = e.touches[0].clientX;
        isSwiping = true;
    }
});

sidebarElement.addEventListener('touchmove', (e) => {
    if (!isSwiping || !sidebarElement.classList.contains('open')) return;
    currentX = e.touches[0].clientX;
    const deltaX = currentX - startX; 
    if (deltaX < 0) sidebarElement.style.transform = `translateX(${deltaX}px)`;
});

sidebarElement.addEventListener('touchend', () => {
    if (!isSwiping) return;
    isSwiping = false;
    const deltaX = currentX - startX;
    
    sidebarElement.style.transition = 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)'; 
    if (deltaX < -50) { 
        closeSidebar();
    } else if (sidebarElement.classList.contains('open')) {
        sidebarElement.style.transform = 'translateX(0)';
    } else {
        sidebarElement.style.transform = 'translateX(-100%)';
    }
    
    setTimeout(() => {
        sidebarElement.style.transition = '';
        sidebarElement.style.transform = '';
    }, 400); 
});


sidebarToggleButton.addEventListener('click', (event) => {
    event.stopPropagation();
    openSidebar();
});

closeSidebarButton.addEventListener('click', closeSidebar);

document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInput.focus();
    }
});

mainContentElement.addEventListener("scroll", () => {
    scrollToTopButton.style.display = mainContentElement.scrollTop > 300 ? "block" : "none";
});

scrollToTopButton.addEventListener("click", () => {
    mainContentElement.scrollTo({ top: 0, behavior: "smooth" });
});





window.closeReaderMode = () => {
    
    blogViewerElement.classList.remove('visible');
    
    
    heroSection.style.display = 'block';
    gridSection.style.display = 'block';
    
    
    mainContentElement.scrollTo({ top: 0, behavior: "smooth" });
    
    
    setTimeout(() => {
        blogViewerElement.innerHTML = '';
        blogViewerElement.style.display = 'none'; 
    }, 500);
};

const openReaderMode = () => {
    
    heroSection.style.display = 'none';
    gridSection.style.display = 'none';
    
    
    blogViewerElement.style.display = 'block';
    
    setTimeout(() => {
        blogViewerElement.classList.add('visible');
    }, 10);
    
    mainContentElement.scrollTo({ top: 0, behavior: "smooth" });
};

const loadBlogPostIntoViewer = async (postMetadata) => {
    
    openReaderMode();
    
    
    blogViewerElement.innerHTML = `
        <div style="font-family: var(--font-mono); color: var(--color-primary); margin-bottom: 2rem;">
            
        </div>
    `;

    
    const contentPath = CONTENT_BASE_PATH + postMetadata.fileName;
    let rawContent = blogContentCache[contentPath];

    if (!rawContent) {
        try {
            const response = await fetch(contentPath);
            if (!response.ok) throw new Error(`Failed to load: ${response.statusText}`);
            rawContent = await response.text();
            blogContentCache[contentPath] = rawContent;
        } catch (error) {
            console.error(`Error fetching post:`, error);
            blogViewerElement.innerHTML = `
                <button onclick="window.closeReaderMode()" style="background:none; border:1px solid var(--text-muted); color:var(--text-main); padding:10px 20px; cursor:pointer; margin-bottom:2rem; font-family:var(--font-mono);">← ABORT</button>
                <p style="color:#f472b6">Error 404: Signal Lost.</p>
            `;
            return;
        }
    }
    
    
    let renderedHTML = '';
    if (postMetadata.fileType === 'md') {
        if (window.marked && typeof window.marked.parse === 'function') {
            renderedHTML = window.marked.parse(rawContent);
        } else {
            renderedHTML = `<pre>Markdown engine offline. Raw content:\n${rawContent}</pre>`;
        }
    } else {
        renderedHTML = rawContent;
    }

    
    
    const backButtonHTML = `
        <button onclick="window.closeReaderMode()" 
            style="
                background: rgba(255,255,255,0.05); 
                border: 1px solid var(--border-subtle); 
                color: var(--text-muted); 
                padding: 10px 20px; 
                border-radius: var(--radius-md);
                cursor: pointer; 
                margin-bottom: 3rem; 
                font-family: var(--font-mono);
                font-size: 0.85rem;
                transition: all 0.2s;
            "
            onmouseover="this.style.color='var(--color-primary)'; this.style.borderColor='var(--color-primary)'"
            onmouseout="this.style.color='var(--text-muted)'; this.style.borderColor='var(--border-subtle)'"
        >
            ← RETURN_TO_BASE
        </button>
    `;

    blogViewerElement.innerHTML = backButtonHTML + renderedHTML;
};




const fetchPostMetadata = async () => {
    try {
        const response = await fetch(POSTS_JSON_PATH);
        if (!response.ok) throw new Error(`Failed to load metadata`);
        const data = await response.json(); 
        
        return data.map(post => ({
            ...post,
            searchableContent: (post.searchableContent || '').toLowerCase(),
            fileType: (post.fileType || 'html').toLowerCase()
        }));

    } catch (error) {
        console.error("Init Error:", error);
        return [];
    }
};

const filterAndDisplayPosts = (searchTerm) => {
    
    if (blogViewerElement.classList.contains('visible')) {
        window.closeReaderMode();
    }

    let filteredResults = [];
    
    if (searchTerm) {
        filteredResults = allLoadedBlogPosts.filter(post => 
            post.searchableContent.includes(searchTerm)
        );
        blogViewerTitleElement.textContent = `Search Results: ${filteredResults.length} found`;
    } else {
        filteredResults = allLoadedBlogPosts.filter(post => 
            post.folder === RECENT_POST_FOLDER
        );
        filteredResults = filteredResults.slice(0, 10); 
        blogViewerTitleElement.textContent = 'Recent Transmissions';
    }
    
    displayPostLinks(filteredResults);
};

const displayPostLinks = (postsToShow) => {
    recentPostsList.innerHTML = '';
    
    if (!postsToShow || postsToShow.length === 0) {
        recentPostsList.innerHTML = '<li style="background:none; border:none; color:var(--text-muted); padding:1rem;">No results found.</li>';
        return;
    }

    postsToShow.forEach((post, index) => {
        const listItem = document.createElement('li');
        listItem.style.animationDelay = `${index * 50}ms`;
        
        
        listItem.innerHTML = `
            <a href="#" data-id="${post.id}">
                <div style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--color-primary); margin-bottom: 0.5rem; opacity: 0.8;">${post.date || 'DATE UNKNOWN'}</div>
                <h3 style="font-size: 1.3rem; margin-bottom: 0.5rem; color: var(--text-main); font-weight: 700;">${post.title}</h3>
                <p style="font-size: 0.95rem; color: var(--text-muted); line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">
                    ${post.summary || 'Click to read full transmission...'}
                </p>
            </a>
        `;
        
        
        const link = listItem.querySelector('a');
        link.addEventListener('click', (event) => {
            event.preventDefault();
            
            const fullPostData = allLoadedBlogPosts.find(p => p.id === post.id); 
            loadBlogPostIntoViewer(fullPostData);
        });
        
        recentPostsList.appendChild(listItem);
    });
};

searchInput.addEventListener('input', () => {
    const searchTerm = searchInput.value.toLowerCase().trim();
    filterAndDisplayPosts(searchTerm);
});

(async () => {
    allLoadedBlogPosts = await fetchPostMetadata(); 

    if (allLoadedBlogPosts.length === 0) return; 

    
    const initialPosts = allLoadedBlogPosts.filter(post => 
        post.folder === RECENT_POST_FOLDER
    ).slice(0, 10);
    
    displayPostLinks(initialPosts);
    
    const adPostMetadata = allLoadedBlogPosts.find(p => p.folder === 'ad');
    if (adPostMetadata) {  
    }
})();
