const docSearchInput = document.getElementById('docSearchInput');
const docGrid = document.getElementById('docGrid');
const docGridSection = document.getElementById('docGridSection');
const docViewer = document.getElementById('docViewer');
const heroHeader = document.getElementById('heroHeader');
const scrollToTopButton = document.getElementById("scrollToTopBtn");
const mainContentElement = document.getElementById('mainContent');

const DOCS_JSON_PATH = './ResearchLaboratory/index.json';
const DOCS_BASE_PATH = './ResearchLaboratory/';

let allDocs = [];
let docContentCache = {};

document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        docSearchInput.focus();
    }
});

mainContentElement.addEventListener("scroll", () => {
    scrollToTopButton.style.display = mainContentElement.scrollTop > 300 ? "block" : "none";
});

scrollToTopButton.addEventListener("click", () => {
    mainContentElement.scrollTo({ top: 0, behavior: "smooth" });
});

const fetchDocs = async () => {
    try {
        const response = await fetch(DOCS_JSON_PATH);
        if (!response.ok) throw new Error('Failed to load documentation index');
        const data = await response.json();
        allDocs = data;
        renderDocGrid(allDocs);
    } catch (error) {
        console.error("KnowledgeBase Error:", error);
        docGrid.innerHTML = `<div style="padding:1rem; color:#ef4444;">System Error: Database unreachable.</div>`;
    }
};

const renderDocGrid = (docs) => {
    docGrid.innerHTML = '';
    
    if (docs.length === 0) {
        docGrid.innerHTML = `<div style="padding:1rem; color:#94a3b8;">No data modules found.</div>`;
        return;
    }

    docs.forEach((doc, index) => {
        const item = document.createElement('li');
        item.style.animationDelay = `${index * 50}ms`;
        
        
        let accessColor = '#94a3b8'; 
        if (doc.classification === 'Confidential') {
            accessColor = '#f472b6'; 
        } else if (doc.classification === 'Level 3 Access') {
            accessColor = '#06b6d4'; 
        }

        item.innerHTML = `
            <a href="#" style="padding: 2rem; height: 100%; display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                    <div style="margin-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-family: var(--font-mono); font-size: 0.75rem; background: ${accessColor}20; color: ${accessColor}; padding: 3px 8px; border-radius: 4px; border: 1px solid ${accessColor}40; text-transform: uppercase;">
                            ${doc.classification}
                        </span>
                        <span style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-muted); opacity: 0.7;">
                            ${doc.date}
                        </span>
                    </div>
                    <h3 style="font-size: 1.4rem; margin-bottom: 0.75rem;">${doc.title}</h3>
                    <p style="font-size: 0.9rem; color: var(--text-muted); line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                        ${doc.summary}
                    </p>
                </div>
                <div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center; color: var(--color-secondary); font-size: 0.9rem;">
                    <span style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-muted);">${doc.category}</span>
                    <span style="font-weight: 600;">ACCESS →</span>
                </div>
            </a>
        `;
        
        item.querySelector('a').addEventListener('click', (e) => {
            e.preventDefault();
            loadDocument(doc);
        });

        docGrid.appendChild(item);
    });
};

const loadDocument = async (doc) => {
    docGridSection.style.display = 'none';
    heroHeader.style.display = 'none';
    docViewer.classList.remove('visible');
    mainContentElement.scrollTo({ top: 0, behavior: "auto" });

    const headerHTML = `
        <div style="margin-bottom: 2rem;">
            <button id="backBtn" style="background: none; border: none; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; gap: 0.5rem; font-family: var(--font-mono); margin-bottom: 1rem;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px;"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                RETURN TO GRID
            </button>
            <div style="border-left: 4px solid var(--color-secondary); padding-left: 1.5rem;">
                <span style="font-family: var(--font-mono); color: var(--color-secondary); font-size: 0.8rem; text-transform: uppercase;">
                <h1 style="font-size: 2.8rem; margin-top: 0.5rem; margin-bottom: 1rem; line-height: 1.1;">${doc.title}</h1>
                <p style="font-family: var(--font-mono); color: var(--text-muted); font-size: 0.9rem; margin-bottom: 0;">PROTOCOL: ${doc.id} | RELEASED: ${doc.date}</p>
            </div>
        </div>
    `;

    if (docContentCache[doc.fileName]) {
        renderMarkdown(headerHTML, docContentCache[doc.fileName]);
        return;
    }

    docViewer.innerHTML = `${headerHTML}<div style="padding:2rem; color:var(--text-muted);">Initializing data stream...</div>`;
    
    document.getElementById('backBtn').addEventListener('click', closeDocument);

    try {
        const response = await fetch(DOCS_BASE_PATH + doc.fileName);
        if (!response.ok) throw new Error('Document missing');
        const text = await response.text();
        
        docContentCache[doc.fileName] = text;
        renderMarkdown(headerHTML, text);

    } catch (error) {
        docViewer.innerHTML = `${headerHTML}<h2 style="color:#ef4444;">Error 404</h2><p>Data corrupted.</p>`;
        document.getElementById('backBtn').addEventListener('click', closeDocument);
        docViewer.classList.add('visible');
    }
};

const closeDocument = () => {
    docViewer.classList.remove('visible');
    docViewer.innerHTML = ''; 
    
    heroHeader.style.display = 'block';
    docGridSection.style.display = 'block';
    
    mainContentElement.scrollTo({ top: 0, behavior: "smooth" });
};

const renderMarkdown = (header, markdown) => {
    let contentHTML = '';
    if (window.marked) {
        contentHTML = window.marked.parse(markdown);
    } else {
        contentHTML = `<pre>${markdown}</pre>`;
    }
    
    docViewer.innerHTML = header + contentHTML;
    
    document.getElementById('backBtn').addEventListener('click', closeDocument);
    
    setTimeout(() => {
        docViewer.classList.add('visible');
    }, 50);
};

docSearchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    
    if (!term) {
        renderDocGrid(allDocs);
        return;
    }

    const filtered = allDocs.filter(doc => 
        doc.title.toLowerCase().includes(term) || 
        doc.category.toLowerCase().includes(term)
    );
    renderDocGrid(filtered);
});

fetchDocs();