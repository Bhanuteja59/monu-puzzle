// UI Controller for Slider Puzzles (MonuSlider)
let currentPuzzleMode = 'slider';

document.addEventListener('DOMContentLoaded', () => {
    // Splash Screen Initial Reveal
    if (typeof triggerPremiumSplash === 'function') {
        triggerPremiumSplash();
    } else {
        // Fallback if not using a unified ui.js
        setTimeout(() => {
            const splash = document.getElementById('splash-screen');
            if (splash) {
                splash.classList.add('fade-out');
                setTimeout(() => splash.style.display = 'none', 1000);
            }
        }, 3500);
    }

    // Initial Screen
    switchScreen('library');

    // Home Slider Logic (Handled by shared populateHomeSlider in ui.js if calling it)
    // No redundant interval here if populateHomeSlider is used.
});

// Sound Wrappers
window.playMoveSound = function () {
    const snd = document.getElementById('moveSound');
    if (snd && window.settings && window.settings.sfx) { 
        snd.currentTime = 0; 
        snd.play().catch(() => { }); 
    }
};

window.playWinSound = function () {
    const snd = document.getElementById('winMusic');
    if (snd && window.settings && window.settings.sfx) { 
        snd.currentTime = 0; 
        snd.play().catch(() => { }); 
    }
};

function switchScreen(screenId) {
    const screens = document.querySelectorAll('.screen');
    const navItems = document.querySelectorAll('.nav-item');
    const titleEl = document.getElementById('current-screen-title');
    const fullHeader = document.querySelector('.top-header');
    const bottomNav = document.querySelector('.bottom-nav');
    const progressCard = document.getElementById('global-progress-card');

    // Handle splash transitions for major screens
    if (screenId === 'journey' || screenId === 'game') {
        if (typeof triggerPremiumSplash === 'function') {
            triggerPremiumSplash(() => executeSwitchScreen(screenId));
            return;
        }
    }

    executeSwitchScreen(screenId);

    function executeSwitchScreen(sid) {
        // Reset common UI
        if (fullHeader) fullHeader.style.display = 'flex';
        if (bottomNav) bottomNav.style.display = 'flex';
        if (progressCard) progressCard.style.display = (sid === 'library') ? 'flex' : 'none';

        // Hide all screens
        screens.forEach(s => s.style.display = 'none');
        
        // Hide preview and background modal bits
        const preview = document.getElementById('game-image-preview');
        if (preview) preview.style.display = 'none';
        const eyeIcon = document.getElementById('preview-eye-icon');
        if (eyeIcon) eyeIcon.style.opacity = '1';

        // Show target screen
        const target = document.getElementById(`${sid}-screen`);
        if (target) {
            target.style.display = (sid === 'game') ? 'flex' : 'block';
            target.scrollTop = 0;

            // JOURNEY AUTO-SCROLL
            if (sid === 'journey') {
                setTimeout(() => {
                    const currentNode = target.querySelector('.journey-node.current');
                    if (currentNode) {
                        currentNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }, 100);
            }
        }

        // Screen specific UI adjustments
        if (sid === 'game') {
            if (fullHeader) fullHeader.style.display = 'none';
            if (bottomNav) bottomNav.style.display = 'none';
            
            triggerPointsOverlay();

            // Initialize puzzle engine
            setTimeout(() => {
                const setupImg = document.getElementById('setup-puzzle-img');
                const activeOption = document.querySelector('.piece-option.active .count');
                const count = activeOption ? parseInt(activeOption.textContent.trim()) : 16;
                if (setupImg && window.sliderEngine) {
                    window.sliderEngine.init(setupImg.src, count);
                }
            }, 100);
        }

        if (sid === 'setup' || sid === 'settings') {
            if (bottomNav) bottomNav.style.display = 'none';
        }

        // Update Nav
        navItems.forEach(item => {
            item.classList.remove('active');
            const textArea = item.querySelector('span');
            const text = textArea ? textArea.textContent.trim().toLowerCase() : '';
            const screenMap = { 'library': 'home', 'daily': 'daily', 'journey': 'journey', 'mypuzzles': 'profile' };
            if (text === screenMap[sid]) item.classList.add('active');
        });

        // Update Header
        if (titleEl) {
            const titles = {
                'library': 'MonuSlider',
                'daily': 'Daily Puzzles',
                'journey': 'Journey Map',
                'mypuzzles': 'My Puzzles',
                'settings': 'Settings'
            };
            titleEl.textContent = titles[sid] || 'MonuSlider';
        }
    }
}

// Category filtering logic (Adapted to handle data-category system)
window.filterCategory = function (category, element) {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(t => t.classList.remove('active'));

    if (element) {
        element.classList.add('active');
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }

    const grid = document.getElementById('main-puzzle-grid');
    if (!grid) return;

    const cards = grid.querySelectorAll('.puzzle-card');
    cards.forEach(card => {
        const itemCat = card.getAttribute('data-category') || '';
        const categories = itemCat.split(' ');
        if (category === 'All' || categories.includes(category)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Puzzle Card Click Handler
document.addEventListener('click', (e) => {
    const card = e.target.closest('.puzzle-card');
    if (card && card.querySelector('img')) {
        const img = card.querySelector('img');
        const setupImg = document.getElementById('setup-puzzle-img');
        if (setupImg) setupImg.src = img.src;
        switchScreen('setup');
    }
});

// Difficulty Selection
function selectDifficulty(count) {
    const options = document.querySelectorAll('.piece-option');
    options.forEach(opt => {
        opt.classList.remove('active');
        const optCount = opt.querySelector('.count');
        if (optCount && parseInt(optCount.textContent.trim()) === count) {
            opt.classList.add('active');
            opt.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    });

    const gridOverlay = document.getElementById('grid-overlay-preview');
    if (gridOverlay) {
        const side = Math.sqrt(count);
        gridOverlay.style.gridTemplateColumns = `repeat(${side}, 1fr)`;
        gridOverlay.style.gridTemplateRows = `repeat(${side}, 1fr)`;
        gridOverlay.innerHTML = '';
        for (let i = 0; i < count; i++) {
            const cell = document.createElement('div');
            cell.style.borderRight = '1px solid rgba(255,255,255,0.2)';
            cell.style.borderBottom = '1px solid rgba(255,255,255,0.2)';
            gridOverlay.appendChild(cell);
        }
    }
}

// UI Animations
function triggerPointsOverlay() {
    const overlay = document.getElementById('points-overlay');
    if (!overlay) return;
    overlay.style.transition = 'none';
    overlay.style.opacity = '1';
    overlay.style.transform = 'translateY(0)';
    overlay.offsetHeight;
    overlay.style.transition = 'opacity 1.5s ease-out, transform 1.5s ease-out';
    setTimeout(() => {
        overlay.style.opacity = '0';
        overlay.style.transform = 'translateY(-30px)';
    }, 1000);
}

// Background Selection Modal Logic
function toggleBackgroundModal() {
    const modal = document.getElementById('background-modal-overlay');
    if (modal) {
        const isShowing = modal.style.display === 'flex';
        modal.style.display = isShowing ? 'none' : 'flex';
    }
}

function changeBoardBackground(color) {
    const board = document.getElementById('game-canvas-container');
    if (board) board.style.backgroundColor = color;
    if (window.sliderEngine) {
        window.sliderEngine.backgroundColor = color;
        window.sliderEngine.render();
    }
    document.querySelectorAll('.color-swatch').forEach(swatch => {
        swatch.classList.remove('active');
        if (swatch.style.backgroundColor === color) swatch.classList.add('active');
    });
}

// Confetti Generator
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
        particle.animate([
            { top: '-10%', transform: `rotate(0deg) translateX(0)` },
            { top: '110%', transform: `rotate(${Math.random() * 1000}deg) translateX(${Math.random() * 100 - 50}px)` }
        ], {
            duration: Math.random() * 3000 + 2000,
            easing: 'cubic-bezier(0, .9, .57, 1)',
            delay: Math.random() * 2000
        }).onfinish = () => particle.remove();
    }
}

function toggleImagePreview() {
    const preview = document.getElementById('game-image-preview');
    const eyeIcon = document.getElementById('preview-eye-icon');
    const previewImg = document.getElementById('game-preview-img');
    if (!preview) return;
    const isVisible = preview.style.display === 'block';
    if (!isVisible) {
        if (previewImg && window.sliderEngine) previewImg.src = window.sliderEngine.imgSrc;
        preview.style.display = 'block';
        if (eyeIcon) eyeIcon.style.opacity = '0.5';
    } else {
        preview.style.display = 'none';
        if (eyeIcon) eyeIcon.style.opacity = '1';
    }
}

window.settings = { sfx: true, haptic: true };
function toggleSetting(type) {
    window.settings[type] = !window.settings[type];
    const toggle = document.getElementById(type + '-toggle');
    if (toggle) toggle.classList.toggle('active', window.settings[type]);
}
