// UI Controller for Jigsaw Puzzles
document.addEventListener('DOMContentLoaded', () => {
    // Splash Screen Delay
    setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        splash.style.opacity = '0';
        setTimeout(() => {
            splash.style.display = 'none';
        }, 500);
    }, 2000);

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
function initHomeSlider() {
    const slider = document.getElementById('home-slider');
    const dots = document.querySelectorAll('.slider-dots .dot');
    const slideCards = document.querySelectorAll('.featured-slider .featured-card');

    if (slider && slideCards.length > 0) {
        let currentSlide = 0;
        const updateActiveSlide = (idx) => {
            currentSlide = idx;
            dots.forEach((dot, j) => dot.classList.toggle('active', j === idx));
            slideCards.forEach((card, j) => card.classList.toggle('active-slide', j === idx));
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
                    const idx = Array.from(slideCards).indexOf(entry.target);
                    updateActiveSlide(idx);
                }
            });
        }, { root: slider, threshold: 0.5 });

        slideCards.forEach(card => observer.observe(card));

        let autoScrollInterval = setInterval(() => {
            let nextSlide = (currentSlide + 1) % slideCards.length;
            const targetCard = slideCards[nextSlide];
            if (targetCard) {
                const scrollPos = targetCard.offsetLeft - (slider.clientWidth / 2) + (targetCard.clientWidth / 2);
                slider.scrollTo({ left: scrollPos, behavior: 'smooth' });
            }
        }, 4500);

        slider.addEventListener('touchstart', () => clearInterval(autoScrollInterval), { passive: true });
        slider.addEventListener('mousedown', () => clearInterval(autoScrollInterval), { passive: true });
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
        const isMatch = (text === screenId.toLowerCase()) ||
            (screenId === 'library' && text === 'home');

        if (isMatch) {
            item.classList.add('active');
        }
    });

    // Update Header
    if (screenId === 'library') titleEl.textContent = 'MonuPuzzle';
    else if (screenId === 'daily') titleEl.textContent = 'Daily Puzzles';
    else if (screenId === 'journey') titleEl.textContent = 'Journey';
    else if (screenId === 'mypuzzles') titleEl.textContent = 'My Puzzles';
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
const modal = document.getElementById('category-modal-overlay');
const menuBtn = document.querySelector('.category-menu-btn');

if (menuBtn) {
    menuBtn.addEventListener('click', () => {
        modal.style.display = 'flex';
    });
}

if (modal) {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}

document.querySelectorAll('.category-item').forEach(item => {
    item.addEventListener('click', () => {
        document.querySelectorAll('.category-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        modal.style.display = 'none';

        // Fix: Use span text or innerText to avoid capturing hidden characters/images
        const category = item.querySelector('span') ? item.querySelector('span').textContent.trim() : item.innerText.trim();
        filterCategory(category);
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
                ${isFuture ? '<div class="daily-lock-overlay">🔒</div>' : ''}
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

// Global Back Navigation
function goBack() {
    if (window.previousScreen && window.previousScreen !== window.currentScreen) {
        switchScreen(window.previousScreen);
    } else {
        switchScreen('library');
    }
}
