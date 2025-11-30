const courseGrid = document.getElementById('courseGrid');
const courseGridSection = document.getElementById('courseGridSection');
const courseViewer = document.getElementById('courseViewer');
const heroHeader = document.getElementById('heroHeader');
const scrollToTopButton = document.getElementById("scrollToTopBtn");
const mainContentElement = document.getElementById('mainContent');

const COURSES_JSON_PATH = './TechStack/index.json';
const COURSES_BASE_PATH = './TechStack/';

let allCourses = [];
let courseContentCache = {};
let currentIndex = 0;
const ITEMS_PER_LOAD = 4; 
let observer = null;

mainContentElement.addEventListener("scroll", () => {
    scrollToTopButton.style.display = mainContentElement.scrollTop > 300 ? "block" : "none";
});

scrollToTopButton.addEventListener("click", () => {
    mainContentElement.scrollTo({ top: 0, behavior: "smooth" });
});

const fetchCourses = async () => {
    try {
        const response = await fetch(COURSES_JSON_PATH);
        if (!response.ok) throw new Error('Failed to load courses index');
        const data = await response.json();
        allCourses = data;
        
        
        allCourses.sort((a, b) => new Date(b.date) - new Date(a.date));

        initInfiniteScroll();
    } catch (error) {
        console.error("TechStack Error:", error);
        courseGrid.innerHTML = `<div style="padding:1rem; color:#ef4444;">System Error: Course manifest missing.</div>`;
    }
};

const createCourseCard = (course, index) => {
    const item = document.createElement('li');
    item.className = 'course-card-item'; 
    item.style.animationDelay = `${index * 50}ms`;

    const icon = course.iconSVG || '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px;"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>';

    item.innerHTML = `
        <a href="#" style="padding: 2rem; height: 100%; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
                <div style="margin-bottom: 0.75rem; display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-family: var(--font-mono); font-size: 0.75rem; background: #60a5fa30; color: #60a5fa; padding: 4px 8px; border-radius: 4px; border: 1px solid #60a5fa50; text-transform: uppercase;">
                        ${course.language}
                    </span>
                    <span style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-muted); opacity: 0.7;">
                        ${course.date || 'DATE UNKNOWN'}
                    </span>
                </div>
                <h3 style="font-size: 1.4rem; margin-bottom: 0.75rem; color: var(--text-main); font-weight: 700;">${course.title}</h3>
                <p style="font-size: 0.9rem; color: var(--text-muted); line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                    ${course.summary}
                </p>
            </div>
            <div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 0.5rem; color: #34d399; font-size: 0.9rem;">
                    ${icon}
                    <span>View Snippet</span>
                </div>
                <span style="font-weight: 600; color: var(--color-secondary);">ACCESS →</span>
            </div>
        </a>
    `;

    item.querySelector('a').addEventListener('click', (e) => {
        e.preventDefault();
        loadCourse(course);
    });

    return item;
};


const renderNextBatch = () => {
    if (currentIndex >= allCourses.length) {
        if (observer) observer.unobserve(document.querySelector('.course-card-item:last-child'));
        return; 
    }
    
    const endIndex = Math.min(currentIndex + ITEMS_PER_LOAD, allCourses.length);
    const fragment = document.createDocumentFragment();
    
    for (let i = currentIndex; i < endIndex; i++) {
        fragment.appendChild(createCourseCard(allCourses[i], i));
    }

    courseGrid.appendChild(fragment);

    currentIndex = endIndex;
    
    if (observer) {
        const lastItem = courseGrid.querySelector('.course-card-item:last-child');
        if (lastItem) {
            observer.unobserve(lastItem); 
            observer.observe(lastItem); 
        }
    }
};

const initInfiniteScroll = () => {
    if (observer) observer.disconnect();
    
    courseGrid.innerHTML = '';
    currentIndex = 0; 

    observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                renderNextBatch();
            }
        });
    }, {
        root: mainContentElement, 
        rootMargin: '0px 0px 200px 0px', 
        threshold: 0.1
    });

    renderNextBatch();
};


const loadCourse = async (course) => {
    courseGridSection.style.display = 'none';
    heroHeader.style.display = 'none';
    courseViewer.classList.remove('visible');
    mainContentElement.scrollTo({ top: 0, behavior: "auto" });

    const headerHTML = `
        <div style="margin-bottom: 2rem; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-subtle); padding-bottom: 1rem;">
            <button id="backBtn" style="background: none; border: none; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; gap: 0.5rem; font-family: var(--font-mono);">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px;"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                RETURN TO PATHS
            </button>
            <span style="font-family: var(--font-mono); color: #34d399; font-size: 0.8rem;">LANGUAGE: ${course.language}</span>
        </div>
    `;

    if (courseContentCache[course.fileName]) {
        renderMarkdown(headerHTML, courseContentCache[course.fileName]);
        return;
    }

    courseViewer.innerHTML = `${headerHTML}<div style="padding:2rem; color:var(--text-muted);">Initializing data stream...</div>`;
    document.getElementById('backBtn').addEventListener('click', closeCourse);

    try {
        const response = await fetch(COURSES_BASE_PATH + course.fileName);
        if (!response.ok) throw new Error('Course module missing');
        const text = await response.text();
        
        courseContentCache[course.fileName] = text;
        renderMarkdown(headerHTML, text);

    } catch (error) {
        courseViewer.innerHTML = `${headerHTML}<h2 style="color:#ef4444;">Error 404</h2><p>Course file not found.</p>`;
        document.getElementById('backBtn').addEventListener('click', closeCourse);
        courseViewer.classList.add('visible');
    }
};

const closeCourse = () => {
    courseViewer.classList.remove('visible');
    courseViewer.innerHTML = '';
    
    heroHeader.style.display = 'block';
    courseGridSection.style.display = 'block';
    
    mainContentElement.scrollTo({ top: 0, behavior: "smooth" });
};

const renderMarkdown = (header, markdown) => {
    let contentHTML = '';
    if (window.marked) {
        contentHTML = window.marked.parse(markdown);
    } else {
        contentHTML = `<pre>${markdown}</pre>`;
    }
    
    courseViewer.innerHTML = header + contentHTML;
    
    document.getElementById('backBtn').addEventListener('click', closeCourse);
    
    setTimeout(() => {
        courseViewer.classList.add('visible');
    }, 50);
};


fetchCourses();