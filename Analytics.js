const statSearchInput = document.getElementById('statSearchInput');
const reportGrid = document.getElementById('reportGrid');
const reportGridSection = document.getElementById('reportGridSection');
const kpiSection = document.getElementById('kpiSection');
const reportViewer = document.getElementById('reportViewer');
const heroHeader = document.getElementById('heroHeader');
const scrollToTopButton = document.getElementById("scrollToTopBtn");
const mainContentElement = document.getElementById('mainContent');

const STATS_JSON_PATH = './Analytics/index.json';
const STATS_BASE_PATH = './Analytics/';

let allReports = [];
let reportContentCache = {};

mainContentElement.addEventListener("scroll", () => {
    scrollToTopButton.style.display = mainContentElement.scrollTop > 300 ? "block" : "none";
});

scrollToTopButton.addEventListener("click", () => {
    mainContentElement.scrollTo({ top: 0, behavior: "smooth" });
});

document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        statSearchInput.focus();
    }
});

const fetchReports = async () => {
    try {
        const response = await fetch(STATS_JSON_PATH);
        if (!response.ok) throw new Error('Failed to load stats index');
        const data = await response.json();
        allReports = data;
        renderReportGrid(allReports);
    } catch (error) {
        console.error("Analytics Error:", error);
        reportGrid.innerHTML = `<div style="padding:1rem; color:#ef4444;">Data link severed.</div>`;
    }
};

const renderReportGrid = (reports) => {
    reportGrid.innerHTML = '';
    
    if (reports.length === 0) {
        reportGrid.innerHTML = `<div style="padding:1rem; color:#94a3b8;">No records found.</div>`;
        return;
    }

    reports.forEach((report, index) => {
        const item = document.createElement('li');
        item.style.animationDelay = `${index * 50}ms`;
        
        // Dynamic badge color based on scope (using existing variables/styles)
        let scopeColor = '#2dd4bf'; // Default Teal
        if (report.scope === 'Security') scopeColor = '#f472b6'; // Pink for security alerts
        else if (report.scope === 'Forecasting') scopeColor = '#facc15'; // Yellow for future data
        
        item.innerHTML = `
            <a href="#" style="padding: 2rem; height: 100%; display: flex; flex-direction: column; justify-content: space-between; text-decoration: none;">
                <div>
                    <div style="margin-bottom: 1rem; display: flex; align-items: center; justify-content: space-between;">
                        <span style="font-family: var(--font-mono); font-size: 0.75rem; background: ${scopeColor}15; color: ${scopeColor}; padding: 4px 8px; border-radius: 4px; border: 1px solid ${scopeColor}40; text-transform: uppercase;">
                            ${report.scope}
                        </span>
                        <span style="font-size: 0.8rem; color: var(--text-muted); font-family: var(--font-mono);">${report.date}</span>
                    </div>
                    <h3 style="font-size: 1.25rem; margin-bottom: 0.75rem; color: var(--text-main); font-weight: 600;">${report.title}</h3>
                    <p style="font-size: 0.9rem; color: var(--text-muted); line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                        ${report.summary}
                    </p>
                </div>
                
                <div style="margin-top: 1.5rem; display: flex; align-items: center; justify-content: flex-end; gap: 0.5rem; color: var(--text-main); font-size: 0.85rem; font-weight: 500; padding-top: 1rem; border-top: 1px solid var(--border-subtle);">
                    <span>View Analysis</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" style="color: #2dd4bf;"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                </div>
            </a>
        `;
        
        item.querySelector('a').addEventListener('click', (e) => {
            e.preventDefault();
            loadReport(report);
        });

        reportGrid.appendChild(item);
    });
};

const loadReport = async (report) => {
    reportGridSection.style.display = 'none';
    kpiSection.style.display = 'none'; 
    heroHeader.style.display = 'none';
    reportViewer.classList.remove('visible');
    mainContentElement.scrollTo({ top: 0, behavior: "auto" });

    const headerHTML = `
        <div style="margin-bottom: 2rem;">
            <button id="backBtn" style="background: none; border: none; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; gap: 0.5rem; font-family: var(--font-mono); margin-bottom: 1.5rem;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px;"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                RETURN TO DASHBOARD
            </button>
            <div style="border-left: 4px solid #2dd4bf; padding-left: 1.5rem;">
                 <h1 style="font-size: 2.25rem; line-height: 1.2; margin-bottom: 0.5rem;">${report.title}</h1>
                 <span style="font-family: var(--font-mono); font-size: 0.9rem; color: #2dd4bf;">SCOPE: ${report.scope} | PUBLISHED: ${report.date}</span>
            </div>
            <div style="height: 1px; background: var(--border-subtle); margin: 2rem 0;"></div>
        </div>
    `;

    if (reportContentCache[report.fileName]) {
        renderMarkdown(headerHTML, reportContentCache[report.fileName]);
        return;
    }

    reportViewer.innerHTML = `${headerHTML}<div style="padding:1rem; color:var(--text-muted);">Decrypting report data...</div>`;
    document.getElementById('backBtn').addEventListener('click', closeReport);

    try {
        const response = await fetch(STATS_BASE_PATH + report.fileName);
        if (!response.ok) throw new Error('Report file missing');
        const text = await response.text();
        
        reportContentCache[report.fileName] = text;
        renderMarkdown(headerHTML, text);

    } catch (error) {
        reportViewer.innerHTML = `${headerHTML}<h2 style="color:#ef4444;">Access Denied</h2><p>Report file not found.</p>`;
        document.getElementById('backBtn').addEventListener('click', closeReport);
        reportViewer.classList.add('visible');
    }
};

const closeReport = () => {
    reportViewer.classList.remove('visible');
    reportViewer.innerHTML = '';
    
    heroHeader.style.display = 'block';
    kpiSection.style.display = 'grid'; 
    reportGridSection.style.display = 'block';
    
    mainContentElement.scrollTo({ top: 0, behavior: "smooth" });
};

const renderMarkdown = (header, markdown) => {
    let contentHTML = '';
    if (window.marked) {
        contentHTML = window.marked.parse(markdown);
    } else {
        contentHTML = `<pre>${markdown}</pre>`;
    }
    
    reportViewer.innerHTML = header + contentHTML;
    document.getElementById('backBtn').addEventListener('click', closeReport);
    
    setTimeout(() => {
        reportViewer.classList.add('visible');
    }, 50);
};

statSearchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    
    if (!term) {
        renderReportGrid(allReports);
        return;
    }

    const filtered = allReports.filter(rep => 
        rep.title.toLowerCase().includes(term) || 
        rep.summary.toLowerCase().includes(term) ||
        rep.scope.toLowerCase().includes(term)
    );
    renderReportGrid(filtered);
});

fetchReports();