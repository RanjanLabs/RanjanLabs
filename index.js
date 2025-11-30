const sidebarToggleButton = document.getElementById('sidebarToggleButton');
const closeSidebarButton = document.getElementById('closeSidebarButton');
const sidebarElement = document.getElementById('sidebar');
const topNavigationElement = document.getElementById('topNav');
const blogViewerTitleElement = document.getElementById('blog-title');
const blogViewerElement = document.getElementById('blog-viewer');
const mainContentElement = document.getElementById('mainContent');
const searchInput = document.getElementById('searchInput');
const recentPostsList = document.getElementById('recent-posts');
const scrollToTopButton = document.getElementById("scrollToTopBtn");


const POSTS_JSON_PATH = './content/index.json';
const CONTENT_BASE_PATH = './content/';
const RECENT_POST_FOLDER = 'blog'; 

const blogContentCache = {};
let allLoadedBlogPosts = [];
let advertisementContent = null;

console.log("%cRANJAN LABS SYSTEM ONLINE", "color: #a855f7; font-size: 20px; font-weight: bold;");

const toggleTopNav = () => {
    topNavigationElement.classList.toggle('show');
    if (sidebarElement.classList.contains('open')) {
        closeSidebar();
    }
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
    
    if (deltaX < 0) {
        sidebarElement.style.transform = `translateX(${deltaX}px)`;
    }
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

sidebarToggleButton.addEventListener('click', (event) => {
    event.stopPropagation();
    openSidebar();
});

closeSidebarButton.addEventListener('click', closeSidebar);

searchInput.addEventListener('input', () => {
    const searchTerm = searchInput.value.toLowerCase().trim();
    filterAndDisplayPosts(searchTerm);
});

const fetchPostMetadata = async () => {
    try {
        const response = await fetch(POSTS_JSON_PATH);
        if (!response.ok) {
            throw new Error(`Failed to load metadata: ${response.statusText}`);
        }
        const data = await response.json(); 
        
        return data.map(post => ({
            ...post,
            searchableContent: (post.searchableContent || '').toLowerCase(),
            fileType: (post.fileType || 'html').toLowerCase()
        }));

    } catch (error) {
        console.error("Initialization Error: Could not load blog metadata.", error);
        blogViewerElement.innerHTML = `<p style="color:#f472b6;">// SYSTEM ERROR: UNABLE TO ESTABLISH DATA LINK. CHECK CONSOLE.</p>`;
        return [];
    }
};

const filterAndDisplayPosts = (searchTerm) => {
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
        recentPostsList.innerHTML = '<li style="background:none; border:none; color:var(--text-muted); padding:1rem;">// No signals found in this sector.</li>';
        return;
    }

    postsToShow.forEach((post, index) => {
        const fullPostData = allLoadedBlogPosts.find(p => p.id === post.id); 
        const contentPath = CONTENT_BASE_PATH + fullPostData.fileName;
        const listItem = document.createElement('li');
        
        listItem.style.animationDelay = `${index * 50}ms`;
        
        listItem.innerHTML = `
            <a href="#" data-path="${contentPath}" data-id="${post.id}" style="display: flex; flex-direction: column; height: 100%;">
                <div style="font-family: var(--font-mono); font-size: 0.75rem; color: #a855f7; margin-bottom: 0.5rem; opacity: 0.8;">${post.date || 'DATE UNKNOWN'}</div>
                <h3 style="font-size: 1.2rem; margin-bottom: 0.5rem; color: var(--text-main); font-weight: 700;">${post.title}</h3>
                <p style="font-size: 0.9rem; color: var(--text-muted); line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; flex: 1;">
                    ${post.summary || 'Click to read full article...'}
                </p>
                <div style="margin-top: 1rem; color: var(--color-secondary); font-weight: 600;">Read More →</div>
            </a>
        `;
        
        listItem.querySelector('a').addEventListener('click', (event) => {
            event.preventDefault();
            loadBlogPostIntoViewer(fullPostData);
        });
        recentPostsList.appendChild(listItem);
    });
};

const loadBlogPostIntoViewer = async (postMetadata) => {
    blogViewerElement.classList.remove('visible'); 
    blogViewerElement.innerHTML = '';

    const contentPath = CONTENT_BASE_PATH + postMetadata.fileName;
    let rawContent = blogContentCache[contentPath];

    if (!rawContent) {
        try {
            const response = await fetch(contentPath);
            if (!response.ok) {
                throw new Error(`Failed to load content file: ${response.statusText}`);
            }
            rawContent = await response.text();
            blogContentCache[contentPath] = rawContent;
        } catch (error) {
            console.error(`Error fetching post content from ${contentPath}:`, error);
            blogViewerElement.innerHTML = `<p style="color:#f472b6">Error 404: Content data corrupted or missing.</p>`;
            blogViewerElement.classList.add('visible');
            return;
        }
    }
    
    let renderedHTML = '';

    if (postMetadata.fileType === 'md') {
        if (window.marked && typeof window.marked.parse === 'function') {
            renderedHTML = window.marked.parse(rawContent);
        } else {
            renderedHTML = `<pre>ERROR: Markdown engine offline. Raw content:\n${rawContent}</pre>`;
        }
    } else if (postMetadata.fileType === 'html') {
        renderedHTML = rawContent;
    } else {
        renderedHTML = `<p>Error: Unknown file signature <b>${postMetadata.fileType}</b>.</p>`;
    }

    blogViewerElement.innerHTML = renderedHTML;
    blogViewerElement.style.maxHeight = 'none';
    
    setTimeout(() => {
        blogViewerElement.classList.add('visible');
        
        const targetScrollPosition = blogViewerElement.offsetTop;
        mainContentElement.scrollTo({ top: targetScrollPosition, behavior: "smooth" });
        
    }, 50); 
};

(async () => {
    allLoadedBlogPosts = await fetchPostMetadata(); 

    if (allLoadedBlogPosts.length === 0) {
        return; 
    }

    const adPostMetadata = allLoadedBlogPosts.find(p => p.folder === 'ad');
    
    if (adPostMetadata) {
        const adPath = CONTENT_BASE_PATH + adPostMetadata.fileName;
        
        if (!blogContentCache[adPath]) {
             try {
                const response = await fetch(adPath);
                if (response.ok) {
                    advertisementContent = await response.text();
                    blogContentCache[adPath] = advertisementContent;
                }
             } catch (error) {
                 console.error("Failed to load advertisement content.", error);
             }
        } else {
            advertisementContent = blogContentCache[adPath];
        }
    }

    const initialPosts = allLoadedBlogPosts.filter(post => 
        post.folder === RECENT_POST_FOLDER
    ).slice(0, 10);
    
    displayPostLinks(initialPosts);

    if (advertisementContent) {
        if (!blogViewerElement.innerHTML.trim()) { 
             let adContentHTML = advertisementContent;
             if (adPostMetadata.fileType === 'md' && window.marked) {
                 adContentHTML = window.marked.parse(advertisementContent);
             }
             blogViewerElement.innerHTML = adContentHTML;
             blogViewerElement.classList.add('visible');
        }
    }
})();