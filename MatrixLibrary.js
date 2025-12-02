const marketSearchInput = document.getElementById('marketSearchInput');
const marketGrid = document.getElementById('marketGrid');
const marketGridSection = document.getElementById('marketGridSection');
const marketViewer = document.getElementById('marketViewer');
const heroHeader = document.getElementById('heroHeader');
const scrollToTopButton = document.getElementById("scrollToTopBtn");
const mainContentElement = document.getElementById('mainContent');

const MARKET_JSON_PATH = './MatrixLibrary/index.json';

let allAssets = [];

mainContentElement.addEventListener("scroll", () => {
    scrollToTopButton.style.display = mainContentElement.scrollTop > 300 ? "block" : "none";
});

scrollToTopButton.addEventListener("click", () => {
    mainContentElement.scrollTo({ top: 0, behavior: "smooth" });
});

document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        marketSearchInput.focus();
    }
});

const fetchMarket = async () => {
    try {
        const response = await fetch(MARKET_JSON_PATH);
        if (!response.ok) throw new Error('Failed to load market index');
        const data = await response.json();
        allAssets = data;
        renderMarketGrid(allAssets);
    } catch (error) {
        console.error("CodeMarket Error:", error);
        marketGrid.innerHTML = `<div style="padding:1rem; color:#ef4444;">Exchange offline.</div>`;
    }
};

const renderMarketGrid = (assets) => {
    marketGrid.innerHTML = '';
    
    if (assets.length === 0) {
        marketGrid.innerHTML = `<div style="padding:1rem; color:#94a3b8;">No assets found.</div>`;
        return;
    }

    assets.forEach((asset, index) => {
        const item = document.createElement('li');
        item.style.animationDelay = `${index * 50}ms`;

        
        let priceColor = '#fbbf24'; 
        if (asset.price === 'Open Source' || asset.price === 'Free') {
            priceColor = '#34d399'; 
        } else if (asset.price.includes('$')) {
            priceColor = '#f472b6'; 
        }
        
        item.innerHTML = `
            <a href="#" style="padding: 2rem; height: 100%; display: flex; flex-direction: column; justify-content: space-between; text-decoration: none;">
                <div>
                    <div style="margin-bottom: 1rem; display: flex; align-items: center; justify-content: space-between;">
                        <span style="font-family: var(--font-mono); font-size: 0.75rem; background: rgba(245, 158, 11, 0.1); color: #fbbf24; padding: 4px 8px; border-radius: 4px; border: 1px solid rgba(245, 158, 11, 0.3);">
                            ${asset.category}
                        </span>
                        <span style="font-family: var(--font-mono); font-size: 0.75rem; color: ${priceColor}; background: ${priceColor}20; padding: 4px 8px; border-radius: 4px;">
                            ${asset.price}
                        </span>
                    </div>
                    <h3 style="font-size: 1.4rem; margin-bottom: 0.75rem; color: var(--text-main); font-weight: 700;">${asset.title}</h3>
                    <p style="font-size: 0.9rem; color: var(--text-muted); line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                        ${asset.description}
                    </p>
                </div>
                
                <div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: space-between; color: var(--text-muted); font-size: 0.85rem; font-weight: 500;">
                    <span style="font-family: var(--font-mono);">${asset.releaseDate}</span>
                    <div style="display: flex; align-items: center; gap: 0.5rem; color: #fbbf24;">
                        <span>Inspect Asset</span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </div>
                </div>
            </a>
        `;
        
        item.querySelector('a').addEventListener('click', (e) => {
            e.preventDefault();
            loadAssetDetails(asset);
        });

        marketGrid.appendChild(item);
    });
};

const loadAssetDetails = (asset) => {
    marketGridSection.style.display = 'none';
    heroHeader.style.display = 'none';
    marketViewer.classList.remove('visible');
    mainContentElement.scrollTo({ top: 0, behavior: "auto" });

    
    const isFree = asset.price === 'Open Source' || asset.price === 'Free';
    const buttonBg = isFree ? '#34d399' : '#f59e0b';
    const buttonTextColor = isFree ? '#000' : '#000'; 
    const launchText = isFree ? 'Access Source' : 'Launch Project';

    const contentHTML = `
        <div style="margin-bottom: 2rem;">
            <button id="backBtn" style="background: none; border: none; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; gap: 0.5rem; font-family: var(--font-mono); margin-bottom: 2rem;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px;"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                RETURN TO EXCHANGE
            </button>
            
            <div style="max-width: 800px;">
                <div style="display: flex; gap: 1rem; align-items: center; margin-bottom: 0.5rem;">
                    <span style="font-family: var(--font-mono); font-size: 0.8rem; color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.4); padding: 4px 8px; border-radius: 4px;">${asset.category}</span>
                    <span style="font-family: var(--font-mono); font-size: 0.8rem; color: #fbbf24;">
                </div>
                
                <h1 style="font-size: 3rem; line-height: 1.1; margin-bottom: 1rem;">${asset.title}</h1>
                <p style="font-size: 1.2rem; line-height: 1.7; color: #cbd5e1; margin-bottom: 3rem;">
                    ${asset.description}
                </p>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 3rem; padding-bottom: 1.5rem; border-bottom: 1px solid var(--border-subtle);">
                    <div><span style="color:var(--text-muted)">RELEASE:</span> <span style="font-family: var(--font-mono);">${asset.releaseDate}</span></div>
                    <div><span style="color:var(--text-muted)">STACK:</span> <span style="font-family: var(--font-mono);">${asset.stack}</span></div>
                </div>
                

                <a href="${asset.link}" target="_blank" rel="noopener noreferrer" style="display: inline-flex; align-items: center; gap: 0.75rem; background: ${buttonBg}; color: ${buttonTextColor}; text-decoration: none; padding: 1rem 2.5rem; border-radius: 30px; font-weight: 700; font-size: 1.1rem; transition: transform 0.2s; box-shadow: 0 4px 15px ${buttonBg}50;">
                    ${launchText}
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
                </a>
            </div>
        </div>
    `;

    marketViewer.innerHTML = contentHTML;
    document.getElementById('backBtn').addEventListener('click', closeAssetDetails);
    
    setTimeout(() => {
        marketViewer.classList.add('visible');
    }, 50);
};

const closeAssetDetails = () => {
    marketViewer.classList.remove('visible');
    marketViewer.innerHTML = '';
    
    heroHeader.style.display = 'block';
    marketGridSection.style.display = 'block';
    
    mainContentElement.scrollTo({ top: 0, behavior: "smooth" });
};

marketSearchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    
    if (!term) {
        renderMarketGrid(allAssets);
        return;
    }

    const filtered = allAssets.filter(asset => 
        asset.title.toLowerCase().includes(term) || 
        asset.description.toLowerCase().includes(term) ||
        asset.stack.toLowerCase().includes(term) ||
        asset.category.toLowerCase().includes(term)
    );
    renderMarketGrid(filtered);
});

fetchMarket();