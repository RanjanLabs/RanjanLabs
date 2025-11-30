const appSearchInput = document.getElementById('appSearchInput');
const appGrid = document.getElementById('appGrid');
const appGridSection = document.getElementById('appGridSection');
const appViewer = document.getElementById('appViewer');
const heroHeader = document.getElementById('heroHeader');
const scrollToTopButton = document.getElementById("scrollToTopBtn");
const mainContentElement = document.getElementById('mainContent');

const APPS_JSON_PATH = './AppStore/index.json';
const APPS_BASE_PATH = './AppStore/';

let allApps = [];
let appContentCache = {};

mainContentElement.addEventListener("scroll", () => {
    scrollToTopButton.style.display = mainContentElement.scrollTop > 300 ? "block" : "none";
});

scrollToTopButton.addEventListener("click", () => {
    mainContentElement.scrollTo({ top: 0, behavior: "smooth" });
});

document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        appSearchInput.focus();
    }
});

const fetchApps = async () => {
    try {
        const response = await fetch(APPS_JSON_PATH);
        if (!response.ok) throw new Error('Failed to load apps index');
        const data = await response.json();
        allApps = data;
        renderAppGrid(allApps);
    } catch (error) {
        console.error("AppStore Error:", error);
        appGrid.innerHTML = `<div style="padding:1rem; color:#ef4444;">Store currently unavailable.</div>`;
    }
};

const getIconHtml = (app) => {
    if (app.iconURL) {
        return `<img src="${app.iconURL}" alt="${app.title} icon" style="width: 32px; height: 32px; object-fit: contain; border-radius: 6px;">`;
    }
    if (app.logoSVG) {
        return app.logoSVG;
    }
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width: 32px; height: 32px; color: var(--color-primary);"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect></svg>';
};

const renderAppGrid = (apps) => {
    appGrid.innerHTML = '';
    
    if (apps.length === 0) {
        appGrid.innerHTML = `<div style="padding:1rem; color:#94a3b8;">No matching apps found.</div>`;
        return;
    }

    apps.forEach((app, index) => {
        const item = document.createElement('li');
        item.style.animationDelay = `${index * 50}ms`;
        
        let statusColor = '#94a3b8';
        if (app.status === 'GA') statusColor = '#34d399';
        else if (app.status === 'Beta') statusColor = '#facc15';
        else if (app.status === 'Experimental') statusColor = '#f472b6';

        item.innerHTML = `
            <a href="#" style="padding: 1.5rem; height: 100%; display: flex; align-items: center; gap: 1.5rem; text-decoration: none;">
                <div style="width: 70px; height: 70px; border-radius: 18px; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; border: 1px solid var(--border-subtle); flex-shrink: 0; box-shadow: 0 4px 12px rgba(0,0,0,0.2);">
                    ${getIconHtml(app)}
                </div>
                
                <div style="flex: 1; min-width: 0;">
                    <span style="font-size: 0.75rem; color: ${statusColor}; font-family: var(--font-mono);">${app.status}</span>
                    <h3 style="font-size: 1.1rem; margin-bottom: 0.25rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text-main);">${app.title}</h3>
                    <p style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${app.tagline}</p>
                </div>

                <div style="background: rgba(139, 92, 246, 0.1); color: #a78bfa; padding: 0.5rem 1rem; border-radius: 20px; font-weight: 600; font-size: 0.8rem; white-space: nowrap; border: 1px solid rgba(139, 92, 246, 0.2);">
                    ${app.apkLink ? 'APK' : 'VIEW'}
                </div>
            </a>
        `;
        
        item.querySelector('a').addEventListener('click', (e) => {
            e.preventDefault();
            loadAppDetails(app);
        });

        appGrid.appendChild(item);
    });
};

const loadAppDetails = async (app) => {
    appGridSection.style.display = 'none';
    heroHeader.style.display = 'none';
    appViewer.classList.remove('visible');
    mainContentElement.scrollTo({ top: 0, behavior: "auto" });

    let actionButtonHtml = '';
    if (app.apkLink) {
        actionButtonHtml = `
            <a href="${app.apkLink}" download style="display: inline-flex; align-items: center; gap: 0.75rem; background: #34d399; color: #000; text-decoration: none; padding: 1rem 3rem; border-radius: 30px; font-weight: 700; font-size: 1.1rem; cursor: pointer; box-shadow: 0 4px 15px rgba(52, 211, 153, 0.5);">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20" style="color: #000;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                Download APK
            </a>
        `;
    } else {
        actionButtonHtml = `
            <button style="background: var(--color-primary); color: white; border: none; padding: 0.75rem 2rem; border-radius: 30px; font-weight: 600; font-size: 1rem; cursor: pointer; box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4);">
                Install App
            </button>
        `;
    }

    const headerHTML = `
        <div style="margin-bottom: 2rem;">
            <button id="backBtn" style="background: none; border: none; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; gap: 0.5rem; font-family: var(--font-mono); margin-bottom: 2rem;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px;"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                BACK TO STORE
            </button>
            
            <div style="display: flex; gap: 2rem; align-items: flex-start; flex-wrap: wrap;">
                <div style="width: 100px; height: 100px; border-radius: 24px; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; border: 1px solid var(--border-subtle);">
                     ${getIconHtml(app)}
                </div>
                <div style="flex: 1;">
                    <div style="display: flex; gap: 1rem; align-items: center;">
                        <h1 style="font-size: 2.5rem; line-height: 1; margin: 0;">${app.title}</h1>
                        <span style="font-family: var(--font-mono); font-size: 0.8rem; background: ${statusColor}15; color: ${statusColor}; padding: 4px 8px; border-radius: 4px; border: 1px solid ${statusColor}40;">${app.status}</span>
                    </div>
                    <p style="color: var(--text-muted); font-size: 1.1rem; margin-top: 0.5rem; margin-bottom: 1.5rem;">${app.tagline}</p>
                    ${actionButtonHtml}
                </div>
            </div>
            <div style="height: 1px; background: var(--border-subtle); margin: 3rem 0;"></div>
        </div>
    `;

    if (appContentCache[app.fileName]) {
        renderMarkdown(headerHTML, appContentCache[app.fileName]);
        return;
    }

    appViewer.innerHTML = `${headerHTML}<div style="padding:1rem; color:var(--text-muted);">Loading details...</div>`;
    document.getElementById('backBtn').addEventListener('click', closeAppDetails);

    try {
        const response = await fetch(APPS_BASE_PATH + app.fileName);
        if (!response.ok) throw new Error('App details missing');
        const text = await response.text();
        
        appContentCache[app.fileName] = text;
        renderMarkdown(headerHTML, text);

    } catch (error) {
        appViewer.innerHTML = `${headerHTML}<h2 style="color:#ef4444;">Unavailable</h2><p>Description not found.</p>`;
        document.getElementById('backBtn').addEventListener('click', closeAppDetails);
        appViewer.classList.add('visible');
    }
};

const closeAppDetails = () => {
    appViewer.classList.remove('visible');
    appViewer.innerHTML = '';
    
    heroHeader.style.display = 'block';
    appGridSection.style.display = 'block';
    
    mainContentElement.scrollTo({ top: 0, behavior: "smooth" });
};

const renderMarkdown = (header, markdown) => {
    let contentHTML = '';
    if (window.marked) {
        contentHTML = window.marked.parse(markdown);
    } else {
        contentHTML = `<pre>${markdown}</pre>`;
    }
    
    appViewer.innerHTML = header + contentHTML;
    document.getElementById('backBtn').addEventListener('click', closeAppDetails);
    
    setTimeout(() => {
        appViewer.classList.add('visible');
    }, 50);
};

appSearchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    
    if (!term) {
        renderAppGrid(allApps);
        return;
    }

    const filtered = allApps.filter(app => 
        app.title.toLowerCase().includes(term) || 
        app.description.toLowerCase().includes(term)
    );
    renderAppGrid(filtered);
});

fetchApps();