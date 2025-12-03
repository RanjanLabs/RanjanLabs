const newsSearchInput = document.getElementById('newsSearchInput');
const newsGrid = document.getElementById('newsGrid');
const newsGridSection = document.getElementById('newsGridSection');
const newsViewer = document.getElementById('newsViewer');
const heroHeader = document.getElementById('heroHeader');
const scrollToTopButton = document.getElementById("scrollToTopBtn");
const mainContentElement = document.getElementById('mainContent');

const NEWS_JSON_PATH = './Insights/index.json';
const NEWS_BASE_PATH = './Insights/';

let allNews = [];
let newsContentCache = {};

mainContentElement.addEventListener("scroll", () => {
    scrollToTopButton.style.display = mainContentElement.scrollTop > 300 ? "block" : "none";
});

scrollToTopButton.addEventListener("click", () => {
    mainContentElement.scrollTo({ top: 0, behavior: "smooth" });
});

document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        newsSearchInput.focus();
    }
});

const fetchNews = async () => {
    try {
        const response = await fetch(NEWS_JSON_PATH);
        if (!response.ok) throw new Error('Failed to load news index');
        const data = await response.json();
        allNews = data;
        renderNewsGrid(allNews);
    } catch (error) {
        console.error("News Error:", error);
        newsGrid.innerHTML = `<div style="padding:1rem; color:#ef4444;">Signal lost. Unable to retrieve feed.</div>`;
    }
};

const renderNewsGrid = (articles) => {
    newsGrid.innerHTML = '';
    
    if (articles.length === 0) {
        newsGrid.innerHTML = `<div style="padding:1rem; color:#94a3b8;">No analysis found.</div>`;
        return;
    }

    articles.forEach((article, index) => {
        const item = document.createElement('li');
        item.style.animationDelay = `${index * 50}ms`;
        
        let impactColor = '#fb7185'; // Default Crimson
        if (article.impactLevel === 'Strategic') impactColor = '#a855f7'; // Purple
        else if (article.impactLevel === 'Critical') impactColor = '#facc15'; // Yellow/Gold
        
        item.innerHTML = `
            <a href="#" style="padding: 2rem; height: 100%; display: flex; flex-direction: column; justify-content: space-between; text-decoration: none;">
                <div>
                    <div style="margin-bottom: 1rem; display: flex; align-items: center; justify-content: space-between;">
                        <span style="font-family: var(--font-mono); font-size: 0.75rem; background: ${impactColor}15; color: ${impactColor}; padding: 4px 8px; border-radius: 4px; border: 1px solid ${impactColor}40; text-transform: uppercase;">
                            ${article.impactLevel}
                        </span>
                        <span style="font-size: 0.8rem; color: var(--text-muted); font-family: var(--font-mono);">${article.date}</span>
                    </div>
                    <h3 style="font-size: 1.5rem; margin-bottom: 1rem; color: var(--text-main); font-weight: 700; line-height: 1.3;">${article.title}</h3>
                    <p style="font-size: 1rem; color: var(--text-muted); line-height: 1.6; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">
                        ${article.summary}
                    </p>
                </div>
                
                <div style="margin-top: 2rem; display: flex; align-items: center; gap: 0.5rem; color: #fb7185; font-size: 0.9rem; font-weight: 600;">
                    <span>Read Analysis</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                </div>
            </a>
        `;
        
        item.querySelector('a').addEventListener('click', (e) => {
            e.preventDefault();
            loadArticle(article);
        });

        newsGrid.appendChild(item);
    });
};

const loadArticle = async (article) => {
    newsGridSection.style.display = 'none';
    heroHeader.style.display = 'none';
    newsViewer.classList.remove('visible');
    mainContentElement.scrollTo({ top: 0, behavior: "auto" });

    let impactColor = '#fb7185';
    if (article.impactLevel === 'Strategic') impactColor = '#a855f7';
    else if (article.impactLevel === 'Critical') impactColor = '#facc15';

    const headerHTML = `
        <div style="margin-bottom: 3rem;">
            <button id="backBtn" style="background: none; border: none; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; gap: 0.5rem; font-family: var(--font-mono); margin-bottom: 2rem;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px;"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                RETURN TO FEED
            </button>
            
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem;">
                <span style="font-family: var(--font-mono); font-size: 0.9rem; color: ${impactColor}; text-transform: uppercase; letter-spacing: 1px;">
                    // IMPACT: ${article.impactLevel} //
                </span>
                <span style="font-family: var(--font-mono); font-size: 0.9rem; color: var(--text-muted);">
                    PUBLISHED: ${article.date}
                </span>
            </div>
            
            <h1 style="font-size: 3rem; line-height: 1.1; margin-top: 1rem; margin-bottom: 1.5rem;">${article.title}</h1>
            <div style="display: flex; justify-content: space-between; font-size: 0.95rem; color: var(--text-muted); border-bottom: 1px solid var(--border-subtle); padding-bottom: 1rem; margin-bottom: 2rem;">
                <span>CATEGORY: ${article.category}</span>
                <span>AUTHOR: ${article.author || 'RanjanLabs Editorial'}</span>
            </div>
            
            <p style="font-size: 1.25rem; line-height: 1.6; color: #cbd5e1; max-width: 800px; border-left: 4px solid #e11d48; padding-left: 1.5rem; margin-bottom: 2rem;">
                ${article.summary}
            </p>
            <div style="height: 1px; background: var(--border-subtle); margin: 3rem 0;"></div>
        </div>
    `;

    if (newsContentCache[article.fileName]) {
        renderMarkdown(headerHTML, newsContentCache[article.fileName]);
        return;
    }

    newsViewer.innerHTML = `${headerHTML}<div style="padding:1rem; color:var(--text-muted);">Downloading article data...</div>`;
    document.getElementById('backBtn').addEventListener('click', closeArticle);

    try {
        const response = await fetch(NEWS_BASE_PATH + article.fileName);
        if (!response.ok) throw new Error('Article missing');
        const text = await response.text();
        
        newsContentCache[article.fileName] = text;
        renderMarkdown(headerHTML, text);

    } catch (error) {
        newsViewer.innerHTML = `${headerHTML}<h2 style="color:#ef4444;">Error 404</h2><p>Article file not found.</p>`;
        document.getElementById('backBtn').addEventListener('click', closeArticle);
        newsViewer.classList.add('visible');
    }
};

const closeArticle = () => {
    newsViewer.classList.remove('visible');
    newsViewer.innerHTML = '';
    
    heroHeader.style.display = 'block';
    newsGridSection.style.display = 'block';
    
    mainContentElement.scrollTo({ top: 0, behavior: "smooth" });
};

const renderMarkdown = (header, markdown) => {
    let contentHTML = '';
    if (window.marked) {
        contentHTML = window.marked.parse(markdown);
    } else {
        contentHTML = `<pre>${markdown}</pre>`;
    }
    
    newsViewer.innerHTML = header + contentHTML;
    document.getElementById('backBtn').addEventListener('click', closeArticle);
    
    setTimeout(() => {
        newsViewer.classList.add('visible');
    }, 50);
};

newsSearchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    
    if (!term) {
        renderNewsGrid(allNews);
        return;
    }

    const filtered = allNews.filter(art => 
        art.title.toLowerCase().includes(term) || 
        art.summary.toLowerCase().includes(term) ||
        art.category.toLowerCase().includes(term) ||
        art.author.toLowerCase().includes(term) ||
        art.impactLevel.toLowerCase().includes(term)
    );
    renderNewsGrid(filtered);
});

fetchNews();