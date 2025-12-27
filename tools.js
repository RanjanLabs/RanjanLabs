const TOOLS_JSON_PATH = './ToolLab/index.json';
const TOOLS_CONTENT_BASE = './ToolLab';

let allTools = [];
let displayedCount = 0;
const CHUNK_SIZE = 5; // Load 5 tools at a time while scrolling
let isLoading = false;
let isToolActive = false;

window.toggleSidebar = function() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    if (sidebar && overlay) {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
    }
};

window.scrollToTop = function() {
    const viewport = document.getElementById('viewport');
    if (viewport) viewport.scrollTo({ top: 0, behavior: 'smooth' });
};

async function initToolLab() {
    const sidebarNav = document.getElementById('sidebar-tool-nav');
    const mainDirectory = document.getElementById('tool-directory');

    try {
        const response = await fetch(TOOLS_JSON_PATH);
        if (!response.ok) throw new Error("Metadata Offline");
        allTools = await response.json();

        // 1. Populate Sidebar (Complete list of names)
        if (sidebarNav) {
            sidebarNav.innerHTML = allTools.map(tool => `
                <div class="nav-item" onclick="handleToolSelection('${tool.id}')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line></svg>
                    <span>${tool.name}</span>
                </div>
            `).join('');
        }

        // 2. Load initial chunk of Directory
        renderNextChunk();

    } catch (error) {
        if (mainDirectory) mainDirectory.innerHTML = `<p class="text-red-500">Failed to establish directory link.</p>`;
    }
}

function renderNextChunk() {
    if (isToolActive || isLoading || displayedCount >= allTools.length) return;

    isLoading = true;
    const mainDirectory = document.getElementById('tool-directory');
    const nextChunk = allTools.slice(displayedCount, displayedCount + CHUNK_SIZE);

    nextChunk.forEach(tool => {
        const card = document.createElement('div');
        card.className = 'tool-card';
        card.style.opacity = '0';
        card.style.transform = 'translateY(10px)';
        card.innerHTML = `
            <span class="badge" style="margin-bottom: 0.5rem;">${tool.category.toUpperCase()}</span>
            <h3>${tool.name}</h3>
            <p>${tool.description}</p>
        `;
        card.onclick = () => handleToolSelection(tool.id);
        mainDirectory.appendChild(card);
        
        // Trigger fade in
        setTimeout(() => {
            card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 50);
    });

    displayedCount += CHUNK_SIZE;
    isLoading = false;
}

async function handleToolSelection(toolId) {
    const tool = allTools.find(t => t.id === toolId);
    if (!tool) return;

    isToolActive = true; // Stop infinite scroll rendering
    const workspace = document.getElementById('main-workspace');
    workspace.style.opacity = '0';

    setTimeout(async () => {
        try {
            const response = await fetch(`${TOOLS_CONTENT_BASE}${tool.fileName}`);
            const content = await response.text();

            workspace.innerHTML = `
                <div class="hero" style="margin-bottom: 2rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 2rem;">
                    <span class="badge">${tool.category.toUpperCase()}</span>
                    <h1>${tool.name}</h1>
                    <p class="subtitle" style="color: var(--text-dim);">${tool.description}</p>
                    <button onclick="location.reload()" style="margin-top: 1.5rem; background: var(--bg-elevated); border: none; padding: 8px 20px; border-radius: 8px; font-size: 0.85rem; cursor: pointer; color: var(--text-main); font-weight:600;">← Back to Directory</button>
                </div>
                <div class="item-card">
                    ${content}
                </div>
            `;
        } catch (err) {
            workspace.innerHTML = `<div class="item-card" style="color: red;">Error: Could not load tool.</div>`;
        }
        workspace.style.opacity = '1';
        document.getElementById('viewport').scrollTo(0, 0);

        if (window.innerWidth < 1024) window.toggleSidebar();
    }, 200);
}

window.addEventListener('DOMContentLoaded', () => {
    initToolLab();
    
    const viewport = document.getElementById('viewport');
    const scrollBtn = document.getElementById('scrollTopBtn');

    if (viewport) {
        viewport.addEventListener('scroll', () => {
            // Check for bottom scroll to load more directory items
            if (!isToolActive) {
                const scrollPosition = viewport.scrollTop + viewport.clientHeight;
                const scrollThreshold = viewport.scrollHeight - 100;
                if (scrollPosition >= scrollThreshold) {
                    renderNextChunk();
                }
            }

            // Scroll to Top visibility
            if (scrollBtn) {
                if (viewport.scrollTop > 300) scrollBtn.classList.add('visible');
                else scrollBtn.classList.remove('visible');
            }
        });
    }

});
