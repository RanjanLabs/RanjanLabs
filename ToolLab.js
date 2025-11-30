const sidebarToggleButton = document.getElementById('sidebarToggleButton');
const closeSidebarButton = document.getElementById('closeSidebarButton');
const sidebarElement = document.getElementById('sidebar');
const toolSearchInput = document.getElementById('toolSearchInput');
const toolListContainer = document.getElementById('toolListContainer');
const toolDisplayArea = document.getElementById('toolDisplayArea');

const TOOLS_JSON_PATH = './ToolLab/index.json';
const TOOLS_BASE_PATH = './ToolLab/';

let allTools = [];

const openSidebar = () => {
    sidebarElement.classList.add('open');
};

const closeSidebar = () => {
    sidebarElement.classList.remove('open');
};

sidebarToggleButton.addEventListener('click', (event) => {
    event.stopPropagation();
    openSidebar();
});

closeSidebarButton.addEventListener('click', closeSidebar);

const fetchTools = async () => {
    try {
        const response = await fetch(TOOLS_JSON_PATH);
        if (!response.ok) throw new Error('Failed to load tool index');
        const data = await response.json();
        allTools = data;
        renderToolSidebar(allTools);
    } catch (error) {
        console.error("ToolLab Error:", error);
        toolListContainer.innerHTML = `<div style="padding:1rem; color:#ef4444;">Failed to load tools.</div>`;
    }
};

const renderToolSidebar = (tools) => {
    toolListContainer.innerHTML = '';
    
    if (tools.length === 0) {
        toolListContainer.innerHTML = `<div style="padding:1rem; color:#94a3b8;">No tools found.</div>`;
        return;
    }

    tools.forEach(tool => {
        let iconHTML = '';
        
        
        if (tool.iconSVG) {
            iconHTML = tool.iconSVG;
        
        } else if (tool.iconURL) {
             
             iconHTML = `<img src="${tool.iconURL}" alt="${tool.title} icon" style="width: 20px; height: 20px; object-fit: contain; opacity: 0.7;">`;
        } 
        
        if (!iconHTML) {
            iconHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>';
        }

        const link = document.createElement('a');
        link.href = '#';
        link.className = 'nav-item';
        
        link.innerHTML = `${iconHTML} <span>${tool.title}</span>`;
        
        link.addEventListener('click', (e) => {
            e.preventDefault();
            loadTool(tool);
            
            document.querySelectorAll('.nav-item').forEach(el => el.style.background = 'transparent');
            link.style.background = 'var(--bg-card)';
            
            if (window.innerWidth <= 1024) closeSidebar();
        });

        toolListContainer.appendChild(link);
    });
};

const loadTool = async (tool) => {
    toolDisplayArea.innerHTML = `<div style="text-align:center; padding:4rem; color:var(--text-muted);">Loading ${tool.title}...</div>`;
    
    try {
        const response = await fetch(TOOLS_BASE_PATH + tool.fileName);
        if (!response.ok) throw new Error('Tool file not found');
        const htmlContent = await response.text();
        
        toolDisplayArea.innerHTML = htmlContent;
        
        const scripts = toolDisplayArea.getElementsByTagName('script');
        Array.from(scripts).forEach(script => {
            const newScript = document.createElement('script');
            if (script.src) newScript.src = script.src;
            else newScript.textContent = script.textContent;
            document.body.appendChild(newScript);
        });

    } catch (error) {
        toolDisplayArea.innerHTML = `
            <div class="hero-section">
                <h1 class="hero-title" style="font-size: 2rem; color: #f472b6;">Error Loading Tool</h1>
                <p class="hero-subtitle">Could not load ${tool.fileName}. Please check the file path.</p>
            </div>
        `;
    }
};

toolSearchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = allTools.filter(tool => 
        tool.title.toLowerCase().includes(term) || 
        tool.searchableContent.toLowerCase().includes(term)
    );
    renderToolSidebar(filtered);
});

fetchTools();