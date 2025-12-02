const aiSearchInput = document.getElementById('aiSearchInput');
const modelGrid = document.getElementById('modelGrid');
const modelGridSection = document.getElementById('modelGridSection');
const modelViewer = document.getElementById('modelViewer');
const heroHeader = document.getElementById('heroHeader');
const scrollToTopButton = document.getElementById("scrollToTopBtn");
const mainContentElement = document.getElementById('mainContent');

const MODELS_JSON_PATH = './NeuralModels/index.json';
const MODELS_BASE_PATH = './NeuralModels/';

let allModels = [];
let modelContentCache = {};

mainContentElement.addEventListener("scroll", () => {
    scrollToTopButton.style.display = mainContentElement.scrollTop > 300 ? "block" : "none";
});

scrollToTopButton.addEventListener("click", () => {
    mainContentElement.scrollTo({ top: 0, behavior: "smooth" });
});

document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        aiSearchInput.focus();
    }
});

const fetchModels = async () => {
    try {
        const response = await fetch(MODELS_JSON_PATH);
        if (!response.ok) throw new Error('Failed to load model index');
        const data = await response.json();
        allModels = data;
        renderModelGrid(allModels);
    } catch (error) {
        console.error("AI Error:", error);
        modelGrid.innerHTML = `<div style="padding:1rem; color:#ef4444;">Neural Core offline.</div>`;
    }
};

const renderModelGrid = (models) => {
    modelGrid.innerHTML = '';
    
    if (models.length === 0) {
        modelGrid.innerHTML = `<div style="padding:1rem; color:#94a3b8;">No matching models found.</div>`;
        return;
    }

    models.forEach((model, index) => {
        const item = document.createElement('li');
        item.style.animationDelay = `${index * 50}ms`;
        
        
        item.innerHTML = `
            <a href="#" style="padding: 1.5rem; height: 100%; display: flex; flex-direction: column; justify-content: space-between; text-decoration: none;">
                <div>
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                        <span style="font-family: var(--font-mono); font-size: 0.75rem; background: rgba(59, 130, 246, 0.15); color: #60a5fa; padding: 4px 8px; border-radius: 4px; border: 1px solid rgba(59, 130, 246, 0.3);">
                            ${model.type}
                        </span>
                        <span style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-muted);">
                            ${model.version}
                        </span>
                    </div>
                    <h3 style="font-size: 1.25rem; margin-bottom: 0.5rem; color: var(--text-main); font-weight: 700;">${model.name}</h3>
                    <p style="font-size: 0.9rem; color: var(--text-muted); line-height: 1.5;">${model.description}</p>
                </div>
                
                <div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--border-subtle); display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
                    <div>
                        <div style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">Params</div>
                        <div style="font-family: var(--font-mono); color: var(--text-main);">${model.params}</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">Context</div>
                        <div style="font-family: var(--font-mono); color: var(--text-main);">${model.context}</div>
                    </div>
                </div>
            </a>
        `;
        
        item.querySelector('a').addEventListener('click', (e) => {
            e.preventDefault();
            loadModelDetails(model);
        });

        modelGrid.appendChild(item);
    });
};

const loadModelDetails = async (model) => {
    modelGridSection.style.display = 'none';
    heroHeader.style.display = 'none';
    modelViewer.classList.remove('visible');
    mainContentElement.scrollTo({ top: 0, behavior: "auto" });

    const headerHTML = `
        <div style="margin-bottom: 2rem;">
            <button id="backBtn" style="background: none; border: none; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; gap: 0.5rem; font-family: var(--font-mono); margin-bottom: 1.5rem;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px;"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                RETURN TO REGISTRY
            </button>
            <div style="display: flex; gap: 1rem; align-items: center; margin-bottom: 1rem;">
                 <h1 style="font-size: 2.5rem; line-height: 1; margin: 0;">${model.name}</h1>
                 <span style="font-family: var(--font-mono); font-size: 0.8rem; background: rgba(59, 130, 246, 0.15); color: #60a5fa; padding: 4px 8px; border-radius: 4px; border: 1px solid rgba(59, 130, 246, 0.3);">${model.type}</span>
            </div>
            <div style="display: flex; gap: 2rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 1.5rem; margin-bottom: 2rem; font-family: var(--font-mono); font-size: 0.9rem;">
                <div><span style="color:var(--text-muted)">VERSION:</span> ${model.version}</div>
                <div><span style="color:var(--text-muted)">PARAMS:</span> ${model.params}</div>
                <div><span style="color:var(--text-muted)">CONTEXT:</span> ${model.context}</div>
            </div>
        </div>
    `;

    if (modelContentCache[model.fileName]) {
        renderMarkdown(headerHTML, modelContentCache[model.fileName]);
        return;
    }

    modelViewer.innerHTML = `${headerHTML}<div style="padding:1rem; color:var(--text-muted);">Initializing inference documentation...</div>`;
    document.getElementById('backBtn').addEventListener('click', closeModelDetails);

    try {
        const response = await fetch(MODELS_BASE_PATH + model.fileName);
        if (!response.ok) throw new Error('Model specs missing');
        const text = await response.text();
        
        modelContentCache[model.fileName] = text;
        renderMarkdown(headerHTML, text);

    } catch (error) {
        modelViewer.innerHTML = `${headerHTML}<h2 style="color:#ef4444;">Error</h2><p>Spec sheet not found.</p>`;
        document.getElementById('backBtn').addEventListener('click', closeModelDetails);
        modelViewer.classList.add('visible');
    }
};

const closeModelDetails = () => {
    modelViewer.classList.remove('visible');
    modelViewer.innerHTML = '';
    
    heroHeader.style.display = 'block';
    modelGridSection.style.display = 'block';
    
    mainContentElement.scrollTo({ top: 0, behavior: "smooth" });
};

const renderMarkdown = (header, markdown) => {
    let contentHTML = '';
    if (window.marked) {
        contentHTML = window.marked.parse(markdown);
    } else {
        contentHTML = `<pre>${markdown}</pre>`;
    }
    
    modelViewer.innerHTML = header + contentHTML;
    document.getElementById('backBtn').addEventListener('click', closeModelDetails);
    
    setTimeout(() => {
        modelViewer.classList.add('visible');
    }, 50);
};

aiSearchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    
    if (!term) {
        renderModelGrid(allModels);
        return;
    }

    const filtered = allModels.filter(model => 
        model.name.toLowerCase().includes(term) || 
        model.type.toLowerCase().includes(term) ||
        model.description.toLowerCase().includes(term)
    );
    renderModelGrid(filtered);
});

fetchModels();