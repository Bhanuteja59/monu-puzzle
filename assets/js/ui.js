// UI Controller for Jigsaw Puzzles
document.addEventListener('DOMContentLoaded', () => {
    // Splash Screen Initial Reveal
    triggerPremiumSplash();

    // Initial Screen
    window.currentScreen = 'library';
    window.previousScreen = null;
    switchScreen('library');

    // Initialize Home Slider and Sub-Heading Cycles
    if (typeof initHomeSlider === 'function') initHomeSlider();
    initSubHeadingCycle();

    // Hook game win logic
    hookWin();

    // Fix: Trigger initial tab indicator and filtering visuals for the default "All" state
    const triggerInitialTab = () => {
        const activeTab = document.querySelector('.tab.active');
        if (activeTab && window.updateTabIndicator) {
            window.updateTabIndicator(activeTab);
        }
    };

    // Run multiple times to ensure layout settle (especially on mobile)
    setTimeout(triggerInitialTab, 100);
    setTimeout(triggerInitialTab, 500);
    setTimeout(triggerInitialTab, 1500);

    // Also force the initial filter logic to settle UI
    if (typeof window.filterCategory === 'function') {
        const initialTab = document.querySelector('.tab[onclick*="\'All\'"]');
        window.filterCategory('All', initialTab);
    }

    // Populate Daily Puzzles
    populateDailyPuzzles();
});

// HOME SLIDER ENGINE
function populateHomeSlider(folder = "assets/slide", carouselItems = ["slide1a.jpeg", "slide2a.jpeg", "slide3a.jpeg", "slide4a.jpeg"]) {
    const homeSlider = document.getElementById("home-slider");
    const sliderDots = document.querySelector(".slider-dots");

    if (homeSlider && typeof puzzleImageFiles !== 'undefined') {
        homeSlider.innerHTML = "";
        if (sliderDots) sliderDots.innerHTML = "";
        
        carouselItems.forEach((imgName, idx) => {
            const slide = document.createElement("div");
            slide.className = "featured-card";
            slide.innerHTML = `
                <div class="featured-img-container">
                    <img src="${folder}/${imgName}" alt="Featured Slide ${idx + 1}" class="w-100 h-100" style="object-fit: contain; background: #eaebed;">
                </div>
            `;
            homeSlider.appendChild(slide);

            if (sliderDots) {
                const dot = document.createElement("div");
                dot.className = `dot ${idx === 0 ? 'active' : ''}`;
                sliderDots.appendChild(dot);
            }
        });
    }

    // After populating, initialize the slider behavior
    initHomeSlider();
}

function initHomeSlider() {
    const slider = document.getElementById('home-slider');
    const slideCards = document.querySelectorAll('.featured-slider .featured-card');
    
    // If the slider exists but has no slides, populate it first
    if (slider && slideCards.length === 0) {
        populateHomeSlider();
        return;
    }

    const dots = document.querySelectorAll('.slider-dots .dot');
    if (slider && slideCards.length > 0) {
        // Clear existing interval if it exists on the element
        if (slider._autoScrollInterval) {
            clearInterval(slider._autoScrollInterval);
        }

        let currentSlide = 0;
        const updateActiveSlide = (idx) => {
            if (idx === -1) return;
            currentSlide = idx;
            dots.forEach((dot, j) => dot.classList.toggle('active', j === idx));
            slideCards.forEach((card, j) => card.classList.toggle('active-slide', j === idx));
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
                    const idx = Array.from(slideCards).indexOf(entry.target);
                    if (idx !== -1) updateActiveSlide(idx);
                }
            });
        }, { root: slider, threshold: 0.5 });

        slideCards.forEach(card => observer.observe(card));

        const startAutoScroll = () => {
            slider._autoScrollInterval = setInterval(() => {
                let nextSlide = (currentSlide + 1) % slideCards.length;
                const targetCard = slideCards[nextSlide];
                if (targetCard) {
                    // Fix: Use horizontal-only scroll on the slider container 
                    // to avoid triggering vertical scroll of the main page (coming up issue)
                    slider.scrollTo({
                        left: targetCard.offsetLeft - slider.offsetLeft,
                        behavior: 'smooth'
                    });
                }
            }, 5000);
        };

        // User interaction stops auto-scroll
        const stopAutoScroll = () => {
            if (slider._autoScrollInterval) {
                clearInterval(slider._autoScrollInterval);
                slider._autoScrollInterval = null;
            }
        };

        slider.addEventListener('touchstart', stopAutoScroll, { passive: true });
        slider.addEventListener('mousedown', stopAutoScroll, { passive: true });
        
        startAutoScroll();
        updateActiveSlide(0);
    }
}

// GAME WIN HOOK
function hookWin() {
    if (window.gameEngine) {
        window.gameEngine.checkWin = function () {
            const placedCount = this.pieces.filter(p => p.isPlaced).length;
            const total = this.difficulty;
            const counter = document.getElementById('game-piece-count');
            if (counter) counter.textContent = total - placedCount;

            if (placedCount === total && !this.isGameOver) {
                this.isGameOver = true;
                const winOverlay = document.getElementById('win-overlay');
                if (winOverlay) {
                    winOverlay.style.display = 'flex';
                    if (typeof createConfetti === 'function') createConfetti();
                    let seconds = 5;
                    const timerEl = document.querySelector('.next-timer');
                    if (timerEl) {
                        const interval = setInterval(() => {
                            seconds--;
                            timerEl.textContent = `Next puzzle in ${seconds}s`;
                            if (seconds <= 0) clearInterval(interval);
                        }, 1000);
                    }
                }
            }
        };
    } else {
        setTimeout(hookWin, 100);
    }
}

// SUB-HEADING CONTINUOUS CYCLE ENGINE
const cyclingTexts = ["MONUMENTS", "TEMPLES", "UNESCO SITES", "INDIAN DANCE", "ANCIENT CULTURE"];
let currentTextIndex = 0;

function initSubHeadingCycle() {
    const subHeading = document.querySelector('.slider-sub-heading');
    if (!subHeading) return;

    // First appearance
    animateLetters("EXPLORE INDIA'S ANCIENT WONDERS", subHeading);

    // Continuous 4.5s cycle
    setInterval(() => {
        const text = `DISCOVER INDIA'S ${cyclingTexts[currentTextIndex]} WONDERS`;
        animateLetters(text, subHeading);
        currentTextIndex = (currentTextIndex + 1) % cyclingTexts.length;
    }, 4500);
}

function animateLetters(text, element) {
    if (!element) return;
    element.innerHTML = '';
    const chars = text.split('');
    chars.forEach((char, i) => {
        const span = document.createElement('span');
        span.className = 'char-span';
        span.textContent = char === ' ' ? '\u00A0' : char;
        // Magnetic letter flip animation
        span.style.animation = `letterFlip 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards`;
        span.style.animationDelay = `${i * 0.035}s`;
        element.appendChild(span);
    });
}

function switchScreen(screenId) {
    const screens = document.querySelectorAll('.screen');
    const navItems = document.querySelectorAll('.nav-item');
    const titleEl = document.getElementById('current-screen-title');
    const fullHeader = document.querySelector('.top-header');
    const bottomNav = document.querySelector('.bottom-nav');

    // Record history
    if (window.currentScreen !== screenId) {
        window.previousScreen = window.currentScreen;
        window.currentScreen = screenId;
    }

    // PREMIUM SPLASH TRANSITION FOR CERTAIN SCREENS
    if (screenId === 'game') {
        triggerPremiumSplash(() => executeSwitchScreen(screenId));
        return;
    }

    executeSwitchScreen(screenId);
}

// Data for Journey Levels
const jigsawLevels = {
    10: { name: "Hampi Ruins", type: "Expert", img: "shutterstock_1182334075.jpg" },
    9: { name: "Ganesh Pol", type: "Expert", img: "shutterstock_140474848 Ganesh Pol.jpg" },
    8: { name: "Ajanta Caves", type: "Master", img: "shutterstock_1048124914.jpg" },
    7: { name: "Sas Bahu", type: "Master", img: "shutterstock_1430024843 Sas Bahu Temple.jpg" },
    6: { name: "Sultan House", type: "Hard", img: "shutterstock_89576581 Sultana’s House (1).jpg" },
    5: { name: "Taj Morning", type: "Hard", img: "shutterstock_1101562826.jpg" },
    4: { name: "Qutub Minar", type: "Casual", img: "shutterstock_1073481062.jpg" },
    3: { name: "Sun Temple", type: "Casual", img: "Konarka_Temple (4).jpg" },
    2: { name: "Kathak Arts", type: "Casual", img: "dreamstime_xxl_223512537.jpg" },
    1: { name: "Vittala Wheel", type: "Casual", img: "VittalaC.jpg" }
};

const boxLevels = {
    10: { name: "Hampi Ruins", type: "Expert", img: "shutterstock_1182334075.jpg" },
    9: { name: "Ganesh Pol", type: "Expert", img: "shutterstock_140474848 Ganesh Pol.jpg" },
    8: { name: "Ajanta Caves", type: "Master", img: "shutterstock_1048124914.jpg" },
    7: { name: "Sas Bahu", type: "Master", img: "shutterstock_1430024843 Sas Bahu Temple.jpg" },
    6: { name: "Sultan House", type: "Hard", img: "shutterstock_89576581 Sultana’s House (1).jpg" },
    5: { name: "Taj Morning", type: "Hard", img: "shutterstock_1101562826.jpg" },
    4: { name: "Qutub Minar", type: "Casual", img: "shutterstock_1073481062.jpg" },
    3: { name: "Sun Temple", type: "Casual", img: "Konarka_Temple (4).jpg" },
    2: { name: "Kathak Arts", type: "Casual", img: "dreamstime_xxl_223512537.jpg" },
    1: { name: "Vittala Wheel", type: "Casual", img: "VittalaC.jpg" }
};

// Population Functions
function updateJourneyFooter(currentMax) {
    const footerBtn = document.querySelector('.journey-play-btn');
    const rewardBadge = document.querySelector('.journey-reward-badge');
    if (footerBtn) footerBtn.textContent = `Play Level ${currentMax}`;
    if (rewardBadge) rewardBadge.innerHTML = `<span class="coin-icon">🟡</span> Unlock 150 Monu Coins in Level ${currentMax}`;
}

function populateJourney() {
    const isBoxMode = document.body.classList.contains('is-box-mode');
    const journeyMap = document.getElementById(isBoxMode ? 'journey-map-box' : 'journey-map-jigsaw');
    if (!journeyMap) return;

    // Hide others
    document.querySelectorAll('.journey-map').forEach(m => m.style.display = 'none');
    journeyMap.style.display = 'block';

    const levels = isBoxMode ? boxLevels : jigsawLevels;
    const currentMax = 3; // Demo progress: Level 3 is active, 1-2 are completed
    
    // Always update footer
    updateJourneyFooter(currentMax);

    // For Jigsaw, we use the static template provided in index.html
    // so we don't clear or rebuild innerHTML unless specific dynamic updates are needed. 
    if (!isBoxMode) return;

    journeyMap.innerHTML = "";
    const levelIds = Object.keys(levels).sort((a, b) => b - a);
    
    levelIds.forEach(i => {
        let levelData = levels[i];
        let iNum = parseInt(i);
        let isLocked = iNum > currentMax;
        let isCurrent = iNum === currentMax;
        let isCompleted = iNum < currentMax;

        let stateClass = isLocked ? 'locked' : (isCurrent ? 'current' : 'completed');

        // Add Loot Bonus for milestones (after 10, 5)
        if (iNum === 10 || iNum === 5) {
            let lootHtml = `
            <div class="loot-bonus-node milestone" data-aos="zoom-in">
                <div class="loot-milestone-divider">
                    <div class="milestone-line"></div>
                    <div class="milestone-star">⭐</div>
                    <div class="milestone-line"></div>
                </div>
                <div class="loot-badge">Loot Unlocked</div>
                <div class="loot-box">
                    <div class="loot-mystery-img image-ready">
                        <img src="assets/images/shutterstock_1182334075.jpg" alt="Loot" onload="handleImageLoad(this)" class="loaded">
                        <div class="loot-overlay-text">?</div>
                    </div>
                    <div class="loot-text-content">
                        <h4>Level ${iNum} Cleared!</h4>
                        <p>Grab your loot of 200 Monu coins</p>
                    </div>
                </div>
            </div>`;
            journeyMap.innerHTML += lootHtml;
        }

        let html = `
        <div class="journey-node ${stateClass}" data-aos="zoom-in">
            <div class="node-container" ${!isLocked ? `onclick="handleNodeClick('${levelData.name}', 'assets/images/${levelData.img}')"` : ''}>
                <div class="node-image-frame image-ready">
                    <img src="assets/images/${levelData.img}" alt="${levelData.name}" class="node-thumb loaded" onload="handleImageLoad(this)">
                    <div class="node-circle">
                        ${isLocked ? '🔒' : (isCompleted ? '✓' : iNum)}
                    </div>
                </div>
                <div class="node-info-box">
                    <div class="node-header-row">
                        <span class="node-level-tag">LEVEL ${iNum}</span>
                        ${isCompleted ? `
                        <div class="node-stars">
                            <span class="star filled">★</span>
                            <span class="star filled">★</span>
                            <span class="star">★</span>
                        </div>` : ''}
                    </div>
                    <span class="node-name">${levelData.name}</span>
                    <div class="node-meta">
                        <span class="node-type">${levelData.type}</span>
                        <span class="node-reward">💎 20</span>
                    </div>
                </div>
                ${isCurrent ? '<div class="node-current-status">ACTIVE</div>' : ''}
            </div>
        </div>`;
        journeyMap.innerHTML += html;
    });
}

function handleNodeClick(name, imgSrc) {
    const setupImg = document.getElementById('setup-puzzle-img');
    if (setupImg) setupImg.src = imgSrc;
    switchScreen('setup');
}

function populateMyPuzzles() {
    const isBoxMode = document.body.classList.contains('is-box-mode');
    
    const myPuzzlesData = isBoxMode ? {
        inProgress: [
            { name: "Sun Temple", img: "Konarka_Temple (4).jpg", progress: 0 }
        ],
        completed: [
            { name: "Kathak Arts", img: "dreamstime_xxl_223512537.jpg" },
            { name: "Vittala Wheel", img: "VittalaC.jpg" }
        ]
    } : {
        inProgress: [
            { name: "Sanchi Stupa", img: "sanchi-stupa.jpg", progress: 65 }
        ],
        completed: [
            { name: "Panna Meena Kund", img: "shutterstock_1477532126 Panna Meena ka Kund.jpg" },
            { name: "Ajanta Caves", img: "shutterstock_1048124914.jpg" }
        ]
    };

    const ipGridId = isBoxMode ? 'box-in-progress-grid' : 'in-progress-grid';
    const cGridId = isBoxMode ? 'box-completed-grid' : 'completed-grid';
    const ipCountId = isBoxMode ? 'box-progress-count' : 'progress-count';
    const cCountId = isBoxMode ? 'box-completed-count' : 'completed-count';

    const inProgressGrid = document.getElementById(ipGridId);
    const completedGrid = document.getElementById(cGridId);
    const inProgressCount = document.getElementById(ipCountId);
    const completedCount = document.getElementById(cCountId);

    if (inProgressCount) inProgressCount.textContent = `${myPuzzlesData.inProgress.length} ACTIVE`;
    if (completedCount) completedCount.textContent = `${myPuzzlesData.completed.length} ${isBoxMode ? 'DONE' : 'PUZZLES'}`;

    const renderGrid = (grid, items, type) => {
        if (!grid) return;
        if (items.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">${type === 'progress' ? '📂' : '✨'}</div>
                    <h3>${type === 'progress' ? 'No Puzzles Yet' : 'Empty History'}</h3>
                    <p>${type === 'progress' ? 'Start your first journey to see them here!' : 'Your completed puzzles will appear here.'}</p>
                </div>`;
            return;
        }
        grid.innerHTML = items.map(p => {
            const imgSrc = p.img.startsWith('assets') ? p.img : 'assets/images/' + p.img;
            if (type === 'progress') {
                return `
                <div class="puzzle-card progress-card" data-aos="zoom-in" onclick="openWelcomeModal('${p.name}', '${imgSrc}', ${p.progress})">
                    <div class="skeleton-box card-loader"></div>
                    <img src="${imgSrc}" alt="${p.name}" class="loaded" onload="handleImageLoad(this)">
                    <div class="card-action-overlay"><button class="resume-btn">Continue</button></div>
                    <div class="card-footer">
                        <div class="footer-top-row">
                            <h5 class="card-title">${p.name}</h5>
                            <span class="card-progress-badge">${p.progress}%</span>
                        </div>
                        <div class="progress-bar-container"><div class="progress-bar-fill" style="width: ${p.progress}%;"></div></div>
                    </div>
                </div>`;
            } else {
                return `
                <div class="puzzle-card completed-card" data-aos="zoom-in">
                    <div class="skeleton-box card-loader"></div>
                    <img src="${imgSrc}" alt="${p.name}" class="loaded" onload="handleImageLoad(this)">
                    <div class="completion-seal">✓</div>
                    <div class="card-footer">
                        <div class="footer-top-row">
                            <h5 class="card-title">${p.name}</h5>
                            <span class="card-verified-badge">${isBoxMode ? 'SOLVED' : 'DONE'}</span>
                        </div>
                    </div>
                </div>`;
            }
        }).join('');
    };

    renderGrid(inProgressGrid, myPuzzlesData.inProgress, 'progress');
    renderGrid(completedGrid, myPuzzlesData.completed, 'completed');
}

function executeSwitchScreen(screenId) {
    const screens = document.querySelectorAll('.screen');
    const navItems = document.querySelectorAll('.nav-item');
    const titleEl = document.getElementById('current-screen-title');
    const fullHeader = document.querySelector('.top-header');
    const bottomNav = document.querySelector('.bottom-nav');

    // Reset common UI
    if (fullHeader) fullHeader.style.display = 'flex';
    if (bottomNav) bottomNav.style.display = 'flex';

    // Global back button visibility (Hide on home/library)
    const globalBack = document.getElementById('global-back-btn');
    if (globalBack) {
        globalBack.style.display = (screenId === 'library') ? 'none' : 'flex';
    }

    // Hide all screens and previews
    screens.forEach(s => s.style.display = 'none');
    const preview = document.getElementById('game-image-preview');
    if (preview) preview.style.display = 'none';
    const eyeIcon = document.getElementById('preview-eye-icon');
    if (eyeIcon) eyeIcon.style.opacity = '1';

    // Refresh content for specific screens
    if (screenId === 'journey') {
        populateJourney();
    }
    if (screenId === 'mypuzzles') {
        populateMyPuzzles();
    }

    // Show target screen
    const target = document.getElementById(`${screenId}-screen`);
    if (target) {
        target.style.display = (screenId === 'game') ? 'flex' : 'block';
        target.scrollTop = 0; // Reset scroll position for the new screen

        // Auto-scroll to current level in Journey (Above the footer)
        if (screenId === 'journey') {
            setTimeout(() => {
                const currentNode = target.querySelector('.journey-node.current');
                if (currentNode) {
                    // Using start ensures it's above the footer area
                    currentNode.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 100);
        }

        // Refresh AOS to ensure scroll layout recalculates natively
        setTimeout(() => {
            if (window.AOS) AOS.refresh();
        }, 50);
    }

    // Screen specific UI adjustments
    if (screenId === 'game') {
        if (fullHeader) fullHeader.style.display = 'none';
        if (bottomNav) bottomNav.style.display = 'none';
        triggerPointsOverlay();

        // Initialize puzzle engine after layout settle
        setTimeout(() => {
            const setupImg = document.getElementById('setup-puzzle-img');
            const activeOption = document.querySelector('.piece-option.active .count');
            const count = activeOption ? parseInt(activeOption.textContent) : 64;

            if (setupImg && window.gameEngine) {
                window.gameEngine.init(setupImg.src, count);
            }
        }, 100);
    }

    if (screenId === 'setup') {
        if (bottomNav) bottomNav.style.display = 'none';
    }

    // Update Nav
    navItems.forEach(item => {
        item.classList.remove('active');
        // Remove spaces to match 'my puzzles' text to 'mypuzzles' screenId
        const text = item.textContent.trim().toLowerCase().replace(/\s+/g, '');

        // Handle name mismatch between screenId 'library' and text 'home'
        // Also handle 'myboxpuzzles' which still targets the 'mypuzzles' screen
        const isMatch = (text === screenId.toLowerCase()) ||
            (screenId === 'library' && text === 'home') ||
            (screenId === 'mypuzzles' && text === 'myboxpuzzles');

        if (isMatch) {
            item.classList.add('active');
        }
    });

    // Update Header
    const isBoxMode = document.body.classList.contains('is-box-mode');

    if (screenId === 'library') titleEl.textContent = isBoxMode ? 'MonuBox' : 'MonuPuzzle';
    else if (screenId === 'daily') titleEl.textContent = 'Daily Puzzles';
    else if (screenId === 'journey') titleEl.textContent = isBoxMode ? 'Box Quest' : 'Journey';
    else if (screenId === 'mypuzzles') titleEl.textContent = isBoxMode ? 'My BoxPuzzles' : 'My Puzzles';
}

// Helper to update the magnetic tab indicator visually
window.updateTabIndicator = function (activeTab) {
    const pill = document.getElementById('tab-active-pill');
    if (!pill || !activeTab) return;

    pill.style.width = `${activeTab.offsetWidth}px`;
    pill.style.left = `${activeTab.offsetLeft}px`;
    pill.style.height = `${activeTab.offsetHeight}px`;
    pill.style.top = `${activeTab.offsetTop}px`;
}

// Category filtering logic
window.filterCategory = function (category, element) {
    console.log("Filtering category:", category);
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(t => t.classList.remove('active'));

    // Find matching tab if only name was passed (from modal)
    if (!element) {
        tabs.forEach(t => {
            if (t.textContent.trim().includes(category)) {
                element = t;
            }
        });
    }

    if (element) {
        element.classList.add('active');
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        updateTabIndicator(element);
    }

    // Sync the Category Modal items as well
    document.querySelectorAll('.category-item').forEach(item => {
        let catItemVal = item.getAttribute('data-value');
        if (!catItemVal) {
            catItemVal = item.querySelector('span') ? item.querySelector('span').textContent.trim() : item.innerText.trim();
        }
        
        if (catItemVal === category || (category === 'Temple' && catItemVal === 'Temples')) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // Only filter cards in the main library grid, not daily or other screens
    const grid = document.getElementById('main-puzzle-grid');
    if (!grid) return;

    const cards = grid.querySelectorAll('.puzzle-card');
    let count = 0;

    cards.forEach(card => {
        const itemCat = card.getAttribute('data-category') || '';
        const categories = itemCat.split(' ');

        if (category === 'All' || categories.includes(category)) {
            if (card.style.display === 'none' || card.classList.contains('hidden-card')) {
                card.style.display = 'block';
                card.classList.remove('hidden-card');
            }
            count++;
        } else {
            card.style.display = 'none';
            card.classList.add('hidden-card');
        }
    });

    // Refresh AOS layout so cards animate back into place natively
    setTimeout(() => {
        if (window.AOS) AOS.refresh();
    }, 50);

    // Note: Carousel update removed as per user request to not effect cursoral things

    // Update the dynamic sub-heading with high-end character animation
    const subHeading = document.querySelector('.slider-sub-heading');
    if (subHeading) {
        // Pause the auto-cycle temporarily on manual filter if needed, 
        // or just let it override the text once.
        let subText = "INDIA'S ANCIENT WONDERS";
        if (category !== 'All') {
            subText = `INDIA'S ${category.toUpperCase()} WONDERS`;
        }
        animateLetters(subText, subHeading);
    }

    console.log(`Showing ${count} puzzles for category: ${category}`);
}

// Modal Logic
window.openCategoryModal = function() {
    const modal = document.getElementById('category-modal-overlay');
    if (modal) {
        modal.style.display = 'flex';
    }
};

// Also attach listener to any statically named generic buttons
const menuBtn = document.querySelector('.category-menu-btn');
if (menuBtn) {
    menuBtn.addEventListener('click', window.openCategoryModal);
}

// Attach overlay click to close
const modalOverlay = document.getElementById('category-modal-overlay');
if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            modalOverlay.style.display = 'none';
        }
    });
}

document.querySelectorAll('.category-item').forEach(item => {
    item.addEventListener('click', () => {
        document.querySelectorAll('.category-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        const modalOverlayRef = document.getElementById('category-modal-overlay');
        if (modalOverlayRef) {
            modalOverlayRef.style.display = 'none';
        }

        // Use data-value if available to prevent pluralization bugs (e.g. Temples -> Temple)
        let category = item.getAttribute('data-value');
        if (!category) {
            category = item.querySelector('span') ? item.querySelector('span').textContent.trim() : item.innerText.trim();
        }
        
        if (typeof filterCategory === 'function') {
            filterCategory(category);
        }
    });
});

// Auto-hide progress card after 5 seconds
setTimeout(() => {
    const progressCard = document.getElementById('global-progress-card');
    if (progressCard) progressCard.style.display = 'none';
}, 8000);

// Puzzle Card Click Handler
document.addEventListener('click', (e) => {
    // Check if we clicked "Play Now" button on a featured card or the card itself
    const featuredPlayBtn = e.target.closest('.featured-play-btn');
    const card = e.target.closest('.puzzle-card, .progress-card, .featured-card');

    // Support either clicking the button or a non-locked card
    const targetCard = featuredPlayBtn ? featuredPlayBtn.closest('.featured-card') : card;

    if (targetCard && !targetCard.classList.contains('locked')) {
        const img = targetCard.querySelector('img');
        if (img) {
            const setupImg = document.getElementById('setup-puzzle-img');
            if (setupImg) setupImg.src = img.src;

            // Update tray pieces to match selected image
            const trayPieces = document.querySelectorAll('.tray-piece');
            trayPieces.forEach(p => p.style.backgroundImage = `url('${img.src}')`);

            switchScreen('setup');
        }
    }
});

// Difficulty Selection
function selectDifficulty(count) {
    document.querySelectorAll('.piece-option').forEach(opt => {
        opt.classList.remove('active');
        const optCount = opt.querySelector('.count');
        if (optCount && optCount.textContent == count) {
            opt.classList.add('active');
        }
    });
    const counter = document.getElementById('game-piece-count');
    if (counter) counter.textContent = count;
}

// Show +20 animation
function triggerPointsOverlay() {
    const overlay = document.getElementById('points-overlay');
    if (!overlay) return;

    overlay.style.transition = 'none';
    overlay.style.opacity = '1';
    overlay.style.transform = 'translateY(0)';

    // Force reflow
    overlay.offsetHeight;

    overlay.style.transition = 'opacity 1.5s ease-out, transform 1.5s ease-out';
    setTimeout(() => {
        overlay.style.opacity = '0';
        overlay.style.transform = 'translateY(-30px)';
    }, 100);
}

// Background Selection Modal Logic
function toggleBackgroundModal() {
    const modal = document.getElementById('background-modal-overlay');
    if (modal) {
        const isShowing = modal.style.display === 'flex';
        modal.style.display = isShowing ? 'none' : 'flex';

        // Add one-time listener for overlay click if opening
        if (!isShowing) {
            const closeHandler = (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                    modal.removeEventListener('click', closeHandler);
                }
            };
            modal.addEventListener('click', closeHandler);
        }
    }
}

function changeBoardBackground(color) {
    console.log("Changing background to:", color);
    const board = document.getElementById('game-canvas-container');
    if (board) {
        board.style.backgroundColor = color;
    }

    if (window.gameEngine) {
        window.gameEngine.backgroundColor = color;
        window.gameEngine.render();
    }

    // Update swatch active state using a more reliable check
    document.querySelectorAll('.color-swatch').forEach(swatch => {
        swatch.classList.remove('active');
        // Match by style or by the color string in the onclick attribute
        if (swatch.getAttribute('onclick').includes(`'${color}'`)) {
            swatch.classList.add('active');
        }
    });
}
// Confetti Generator for Victory Screen
function createConfetti() {
    const container = document.getElementById('confetti');
    if (!container) return;

    container.innerHTML = '';
    const colors = ['#a78bfa', '#f59e0b', '#10b981', '#3b82f6', '#ec4899'];

    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.style.position = 'absolute';
        particle.style.width = Math.random() * 8 + 4 + 'px';
        particle.style.height = Math.random() * 8 + 4 + 'px';
        particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = '-10%';
        particle.style.opacity = Math.random();
        particle.style.transform = `rotate(${Math.random() * 360}deg)`;

        container.appendChild(particle);

        const animation = particle.animate([
            { top: '-10%', transform: `rotate(0deg) translateX(0)` },
            { top: '110%', transform: `rotate(${Math.random() * 1000}deg) translateX(${Math.random() * 100 - 50}px)` }
        ], {
            duration: Math.random() * 3000 + 2000,
            easing: 'cubic-bezier(0, .9, .57, 1)',
            delay: Math.random() * 2000
        });

        animation.onfinish = () => particle.remove();
    }
}


function toggleImagePreview() {
    const preview = document.getElementById('game-image-preview');
    const eyeIcon = document.getElementById('preview-eye-icon');
    const previewImg = document.getElementById('game-preview-img');

    if (!preview || !window.gameEngine) return;

    const isVisible = preview.style.display === 'block';

    if (!isVisible) {
        // Sync with engine image
        if (previewImg) previewImg.src = window.gameEngine.image.src;
        preview.style.display = 'block';
        if (eyeIcon) eyeIcon.style.opacity = '0.5';
    } else {
        preview.style.display = 'none';
        if (eyeIcon) eyeIcon.style.opacity = '1';
    }
}
// Populate Daily Puzzles Logic
function populateDailyPuzzles() {
    const dailyGrid = document.querySelector('#daily-screen .puzzle-grid');
    if (!dailyGrid) return;

    dailyGrid.innerHTML = '';
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const puzzleImages = ["shutterstock_1034530156.jpg", "shutterstock_1115766713 (1).jpg", "shutterstock_1182334075.jpg", "shutterstock_1101562826.jpg", "VittalaC.jpg", "sanchi-stupa.jpg"];

    // Generate cards for the month
    const todayDay = 6;
    const todayImg = `assets/images/${puzzleImages[todayDay % puzzleImages.length]}`;
    
    // Synchronize the header "Featured" image with today's puzzle
    const dailyHeaderImg = document.querySelector('#daily-screen .featured-card img');
    if (dailyHeaderImg) dailyHeaderImg.src = todayImg;

    const dailyHeaderDay = document.querySelector('#daily-screen .date-badge .day');
    if (dailyHeaderDay) dailyHeaderDay.textContent = String(todayDay).padStart(2, '0');

    for (let i = 1; i <= 31; i++) {
        const date = new Date(2026, 2, i); // March 2026
        const dayName = days[date.getDay()];
        const isPast = i < todayDay;
        const isCurrent = i === todayDay;
        const isFuture = i > todayDay;

        const card = document.createElement('div');
        card.className = `daily-puzzle-card ${isFuture ? 'locked' : ''}`;
        
        // Random image for demo
        const imgPath = `assets/js/${puzzleImages[i % puzzleImages.length]}`; 
        // Note: Real path might be assets/images/ if data.js refers to that, but data.js in this env had some weirdness. 
        // I'll assume assets/images/ based on standard practice but I'll use placeholders if needed.
        // Actually I'll use the ones I saw in data.js
        const finalImgPath = `assets/images/${puzzleImages[i % puzzleImages.length]}`;

        card.innerHTML = `
            <div class="img-container">
                <img src="${finalImgPath}" alt="Day ${i}">
                ${isFuture ? `<div class="daily-lock-overlay">
                    <div class="daily-lock-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                    </div>
                </div>` : ''}
            </div>
            <div class="daily-card-info">
                <div class="daily-card-date">
                    <span class="num">${String(i).padStart(2, '0')}</span>
                    <span class="day-name">${dayName}</span>
                </div>
                ${isPast ? '<div class="card-status-icon solved">✓</div>' : isCurrent ? '<div class="card-status-icon current" style="border: 2px solid var(--primary); color: var(--primary);">•</div>' : '<div class="card-status-icon locked">?</div>'}
            </div>
        `;

        if (!isFuture) {
            card.addEventListener('click', () => {
                const setupImg = document.getElementById('setup-puzzle-img');
                if (setupImg) setupImg.src = finalImgPath;
                switchScreen('setup');
            });
        }

        dailyGrid.appendChild(card);
    }
}

function switchMyPuzzlesTab(tab, btn) {
    // Update button states
    const buttons = document.querySelectorAll('#mypuzzles-screen .toggle-btn');
    buttons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // Determine target ID
    const isBoxMode = document.body.classList.contains('is-box-mode');
    let targetId = `tab-${tab}`;
    
    // Resolve mode-specific tab IDs
    if (isBoxMode) {
        if (tab === 'status') targetId = 'tab-box-status';
        if (tab === 'settings') targetId = 'tab-box-settings';
        if (tab === 'profile') targetId = 'tab-box-profile';
    }

    // Update visibility
    const contents = document.querySelectorAll('#mypuzzles-screen .mypuzzles-tab-content');
    contents.forEach(c => {
        if (c.id === targetId) {
            c.classList.add('active');
            c.style.display = 'block';
        } else {
            c.classList.remove('active');
            c.style.display = 'none';
        }
    });

    // Special case for mode-specific UI elements inside profile
    updateNavigationForMode(isBoxMode ? 'box' : 'jigsaw');
}

function switchLibraryTab(tab, btn) {
    // Update button states
    const buttons = document.querySelectorAll('#library-screen .toggle-btn');
    buttons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // Update tab content visibility
    const contents = document.querySelectorAll('#library-screen .library-tab-content');
    contents.forEach(c => c.classList.remove('active'));
    
    const targetTab = document.getElementById(`tab-${tab}`);
    if (targetTab) targetTab.classList.add('active');

    // Handle Bottom Navigation switching based on mode
    updateNavigationForMode(tab);
}

function updateNavigationForMode(mode) {
    const splash = document.getElementById('splash-screen');
    const isAlreadyInMode = (mode === 'box' && document.body.classList.contains('is-box-mode')) || 
                           (mode === 'jigsaw' && !document.body.classList.contains('is-box-mode'));

    // Only trigger splash if actually changing mode
    if (splash && !isAlreadyInMode) {
        triggerPremiumSplash(() => applyNavigationChanges(mode));
    } else {
        applyNavigationChanges(mode);
    }
}

// UNIVERSAL PREMIUM TRANSITION ENGINE
function triggerPremiumSplash(callback) {
    const splash = document.getElementById('splash-screen');
    if (!splash) {
        if (callback) callback();
        return;
    }

    // Reset splash animations by re-inserting content
    const content = splash.innerHTML;
    splash.innerHTML = '';
    splash.style.display = 'flex';
    splash.classList.remove('fade-out');
    
    // Force reflow
    void splash.offsetWidth;
    splash.innerHTML = content;

    // Perform navigation changes half-way if needed
    if (callback) {
        setTimeout(callback, 2000); // Trigger callback behind the scenes
    }

    // Hide splash after consistent premium duration (3.5s total)
    setTimeout(() => {
        splash.classList.add('fade-out');
        setTimeout(() => {
            splash.style.display = 'none';
        }, 800);
    }, 3500);
}

function applyNavigationChanges(mode) {
    const dailyTab = document.getElementById('nav-daily');
    const myPuzzlesLabel = document.getElementById('mypuzzles-tab-label');
    const myPuzzlesStatusLabel = document.getElementById('mypuzzles-status-label');
    
    if (mode === 'box') {
        if (dailyTab) dailyTab.style.display = 'none';
        if (myPuzzlesLabel) myPuzzlesLabel.textContent = 'My BoxPuzzles';
        document.body.classList.add('is-box-mode');
        if (myPuzzlesStatusLabel) myPuzzlesStatusLabel.textContent = 'Box Status';
        if (window.currentScreen === 'journey') populateJourney();
        if (window.currentScreen === 'mypuzzles') populateMyPuzzles();
        const journeyScreen = document.getElementById('journey-screen');
        if (journeyScreen) journeyScreen.classList.add('box-mode');
    } else {
        if (dailyTab) dailyTab.style.display = 'flex';
        if (myPuzzlesLabel) myPuzzlesLabel.textContent = 'My Puzzles';
        document.body.classList.remove('is-box-mode');
        if (myPuzzlesStatusLabel) myPuzzlesStatusLabel.textContent = 'Status';
        if (window.currentScreen === 'journey') populateJourney();
        if (window.currentScreen === 'mypuzzles') populateMyPuzzles();
        const journeyScreen = document.getElementById('journey-screen');
        if (journeyScreen) journeyScreen.classList.remove('box-mode');
    }
}

// Global Back Navigation
function goBack() {
    if (window.previousScreen && window.previousScreen !== window.currentScreen) {
        switchScreen(window.previousScreen);
    } else {
        switchScreen('library');
    }
}

// Welcome Modal Functions
function openWelcomeModal(name = 'Sanchi Stupa', imgSrc = 'assets/images/sanchi-stupa.jpg', progress = 65) {
    const modal = document.getElementById('welcome-modal');
    if (modal) {
        // Update Modal Content
        const modalImg = modal.querySelector('.welcome-image img');
        const modalName = modal.querySelector('.puzzle-name');
        if (modalImg) modalImg.src = imgSrc;
        if (modalName) modalName.textContent = name;

        modal.style.display = 'flex';
        // Force a reflow
        void modal.offsetWidth;
        modal.classList.add('active');
        
        // Animate Progress from 0 to target progress
        const progBar = document.getElementById('welcome-progress-bar');
        const percentText = document.getElementById('welcome-percentage');
        if (progBar && percentText) {
            // Initial Reset
            progBar.style.width = '0%';
            percentText.textContent = '0%';
            
            // Trigger Animation after modal settles
            setTimeout(() => {
                progBar.style.transition = 'width 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
                progBar.style.width = progress + '%';
                
                let count = 0;
                const target = progress;
                const duration = 1500;
                const increment = target / (duration / 16); // 60fps
                
                const updateCount = () => {
                    count += increment;
                    if (count >= target) {
                        percentText.textContent = target + '%';
                    } else {
                        percentText.textContent = Math.floor(count) + '%';
                        requestAnimationFrame(updateCount);
                    }
                };
                requestAnimationFrame(updateCount);
            }, 600); // Slightly longer delay for smoother feel
        }
    }
}

function handleResumeJourney() {
    const modal = document.getElementById('welcome-modal');
    const modalImg = modal.querySelector('.welcome-image img').src;
    const setupImg = document.getElementById('setup-puzzle-img');
    
    // Set the setup image so the engine knows what to load
    if (setupImg) setupImg.src = modalImg;
    
    closeWelcomeModal();
    // Switch to game with premium transition
    switchScreen('game');
}

function closeWelcomeModal() {
    const modal = document.getElementById('welcome-modal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 400);
    }
}
