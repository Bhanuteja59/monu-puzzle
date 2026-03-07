/**
 * Jigsaw Puzzle Game Engine - Core Logic
 */

class JigsawPuzzle {
    constructor(canvasId, trayId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.tray = document.getElementById(trayId);
        this.image = new Image();
        this.pieces = [];
        this.trayPieces = [];
        this.selectedPiece = null;
        this.offset = { x: 0, y: 0 };
        this.difficulty = 64; // Default
        this.isGameOver = false;
        this.backgroundColor = '#0f172a'; // Default background

        this.initEvents();
    }

    init(imageUrl, difficulty = 64) {
        this.difficulty = difficulty;
        this.image.src = imageUrl;
        this.image.onload = () => {
            this.resizeCanvas();
            this.createPieces();
            this.shuffleTray();
            this.render();
        };
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;

        // Target drawing size (centered with padding)
        const padding = 20;
        const maxWidth = this.canvas.width - padding * 2;
        const maxHeight = this.canvas.height - padding * 2;

        const ratio = Math.min(maxWidth / this.image.width, maxHeight / this.image.height);
        this.renderWidth = this.image.width * ratio;
        this.renderHeight = this.image.height * ratio;
        this.renderX = (this.canvas.width - this.renderWidth) / 2;
        this.renderY = (this.canvas.height - this.renderHeight) / 2;
    }

    createPieces() {
        this.pieces = [];
        this.trayPieces = [];

        const cols = Math.sqrt(this.difficulty);
        const rows = this.difficulty / cols;

        const pieceWidth = this.renderWidth / cols;
        const pieceHeight = this.renderHeight / rows;

        // Matrices for tab orientations
        // hTabs[r][c] defines the tab between row r-1 and row r at column c
        const hTabs = [];
        for (let r = 0; r <= rows; r++) {
            hTabs[r] = [];
            for (let c = 0; c < cols; c++) {
                hTabs[r][c] = (r === 0 || r === rows) ? 0 : (Math.random() < 0.5 ? 1 : -1);
            }
        }

        // vTabs[r][c] defines the tab between column c-1 and column c at row r
        const vTabs = [];
        for (let r = 0; r < rows; r++) {
            vTabs[r] = [];
            for (let c = 0; c <= cols; c++) {
                vTabs[r][c] = (c === 0 || c === cols) ? 0 : (Math.random() < 0.5 ? 1 : -1);
            }
        }

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const x = this.renderX + c * pieceWidth;
                const y = this.renderY + r * pieceHeight;

                const piece = {
                    id: `${r}-${c}`,
                    correctRow: r,
                    correctCol: c,
                    targetX: x,
                    targetY: y,
                    width: pieceWidth,
                    height: pieceHeight,
                    currentX: 0,
                    currentY: 0,
                    isPlaced: false,
                    isDragging: false,
                    tabs: {
                        top: hTabs[r][c],
                        right: vTabs[r][c + 1],
                        bottom: hTabs[r + 1][c],
                        left: vTabs[r][c]
                    },
                    cropX: (c * this.image.width) / cols,
                    cropY: (r * this.image.height) / rows,
                    cropW: this.image.width / cols,
                    cropH: this.image.height / rows
                };

                this.trayPieces.push(piece);
            }
        }

        this.updateTrayUI();
    }

    updateTrayUI() {
        this.tray.innerHTML = '';

        let displayPieces = [...this.trayPieces];
        if (this.onlyEdges) {
            displayPieces = displayPieces.filter(p =>
                p.tabs.top === 0 || p.tabs.right === 0 || p.tabs.bottom === 0 || p.tabs.left === 0
            );
        }

        displayPieces.forEach(piece => {
            const el = document.createElement('div');
            el.className = 'tray-piece';

            const tempCanvas = document.createElement('canvas');
            const tCtx = tempCanvas.getContext('2d');

            // Scaled down piece for tray
            const scale = 1.2;
            const tW = piece.width * scale;
            const tH = piece.height * scale;
            const padding = tW * 0.4; // allowance for tabs

            tempCanvas.width = tW + padding * 2;
            tempCanvas.height = tH + padding * 2;

            // Draw piece snippet on tray
            const p = {
                currentX: padding,
                currentY: padding,
                width: tW,
                height: tH,
                tabs: piece.tabs,
                cropX: piece.cropX,
                cropY: piece.cropY,
                cropW: piece.cropW,
                cropH: piece.cropH,
                isPlaced: false
            };

            // Reuse draw logic but on temp canvas
            this.drawPieceOnCanvas(tCtx, this.image, p);

            el.style.backgroundImage = `url(${tempCanvas.toDataURL()})`;
            el.style.width = '80px';
            el.style.height = '80px';

            el.addEventListener('mousedown', (e) => this.startDraggingFromTray(e, piece));
            el.addEventListener('touchstart', (e) => this.startDraggingFromTray(e, piece), { passive: false });
            this.tray.appendChild(el);
        });
    }

    drawPieceOnCanvas(ctx, image, p) {
        ctx.save();
        const x = p.currentX;
        const y = p.currentY;
        const w = p.width;
        const h = p.height;
        const r = Math.min(w, h) * 0.2;

        ctx.beginPath();
        ctx.moveTo(x, y);
        if (p.tabs.top !== 0) { ctx.lineTo(x + w * 0.35, y); ctx.bezierCurveTo(x + w * 0.35, y - p.tabs.top * r, x + w * 0.65, y - p.tabs.top * r, x + w * 0.65, y); }
        ctx.lineTo(x + w, y);
        if (p.tabs.right !== 0) { ctx.lineTo(x + w, y + h * 0.35); ctx.bezierCurveTo(x + w + p.tabs.right * r, y + h * 0.35, x + w + p.tabs.right * r, y + h * 0.65, x + w, y + h * 0.65); }
        ctx.lineTo(x + w, y + h);
        if (p.tabs.bottom !== 0) { ctx.lineTo(x + w * 0.65, y + h); ctx.bezierCurveTo(x + w * 0.65, y + h + p.tabs.bottom * r, x + w * 0.35, y + h + p.tabs.bottom * r, x + w * 0.35, y + h); }
        ctx.lineTo(x, y + h);
        if (p.tabs.left !== 0) { ctx.lineTo(x, y + h * 0.65); ctx.bezierCurveTo(x - p.tabs.left * r, y + h * 0.65, x - p.tabs.left * r, y + h * 0.35, x, y + h * 0.35); }
        ctx.lineTo(x, y);
        ctx.closePath();

        ctx.clip();
        ctx.drawImage(image, p.cropX, p.cropY, p.cropW, p.cropH, x, y, w, h);

        ctx.restore();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }

    shuffleTray() {
        for (let i = this.trayPieces.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.trayPieces[i], this.trayPieces[j]] = [this.trayPieces[j], this.trayPieces[i]];
        }
    }

    startDraggingFromTray(e, piece) {
        if (e.cancelable) e.preventDefault();

        const touch = e.touches ? e.touches[0] : e;
        const rect = this.canvas.getBoundingClientRect();

        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;

        // Remove from tray, add to active pieces
        this.trayPieces = this.trayPieces.filter(p => p !== piece);
        this.updateTrayUI();

        piece.isPlaced = false;
        piece.isDragging = true;

        // Pick-up coordinate calculation
        const xRaw = (touch.clientX - rect.left) * scaleX;
        const yRaw = (touch.clientY - rect.top) * scaleY;

        // Clamp Y so piece is visible at bottom of board if starting from tray
        piece.currentX = xRaw - piece.width / 2;
        piece.currentY = Math.min(yRaw - piece.height / 2, this.canvas.height - piece.height * 0.8);

        this.selectedPiece = piece;
        this.offset.x = piece.width / 2;
        this.offset.y = piece.height / 2;
        this.pieces.push(piece);

        this.render();
    }

    initEvents() {
        // Core interaction events
        this.canvas.addEventListener('mousedown', (e) => this.handleDown(e));

        window.addEventListener('mousemove', (e) => this.handleMove(e));
        window.addEventListener('mouseup', () => this.handleUp());

        this.canvas.addEventListener('touchstart', (e) => this.handleDown(e), { passive: false });
        window.addEventListener('touchmove', (e) => this.handleMove(e), { passive: false });
        window.addEventListener('touchend', () => this.handleUp(), { passive: false });

        // Handle window resize
        window.addEventListener('resize', () => {
            if (this.image.complete) {
                this.resizeCanvas();
                this.render();
            }
        });
    }

    handleDown(e) {
        if (e.cancelable) e.preventDefault();
        const touch = e.touches ? e.touches[0] : e;
        const rect = this.canvas.getBoundingClientRect();

        // Scale mouse coordinates to internal canvas resolution
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const mouseX = (touch.clientX - rect.left) * scaleX;
        const mouseY = (touch.clientY - rect.top) * scaleY;

        const hitPadding = 15;

        // Check active pieces from top to bottom
        for (let i = this.pieces.length - 1; i >= 0; i--) {
            const p = this.pieces[i];
            if (!p.isPlaced &&
                mouseX >= p.currentX - hitPadding && mouseX <= p.currentX + p.width + hitPadding &&
                mouseY >= p.currentY - hitPadding && mouseY <= p.currentY + p.height + hitPadding) {

                this.selectedPiece = p;
                p.isDragging = true;
                this.offset.x = mouseX - p.currentX;
                this.offset.y = mouseY - p.currentY;

                // Move to top of stack
                this.pieces.splice(i, 1);
                this.pieces.push(p);
                break;
            }
        }
    }

    handleMove(e) {
        if (!this.selectedPiece) return;

        if (e.type === 'touchmove' && e.cancelable) {
            e.preventDefault();
        }

        const touch = e.touches ? e.touches[0] : e;
        const rect = this.canvas.getBoundingClientRect();

        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;

        const mouseX = (touch.clientX - rect.left) * scaleX;
        const mouseY = (touch.clientY - rect.top) * scaleY;

        this.selectedPiece.currentX = mouseX - this.offset.x;
        // Clamp Y so that while dragging below the board (tray area), piece stays at the edge
        this.selectedPiece.currentY = Math.min(mouseY - this.offset.y, this.canvas.height - this.selectedPiece.height * 0.8);

        this.render();
    }

    handleUp() {
        if (!this.selectedPiece) return;

        // Check for snapping
        const p = this.selectedPiece;
        const snapThreshold = p.width * 0.3; // Responsive snap threshold

        const dist = Math.sqrt(
            Math.pow(p.currentX - p.targetX, 2) +
            Math.pow(p.currentY - p.targetY, 2)
        );

        if (dist < snapThreshold) {
            p.currentX = p.targetX;
            p.currentY = p.targetY;
            p.isPlaced = true;
            p.isDragging = false;

            if (window.triggerPointsOverlay) window.triggerPointsOverlay();
        }

        p.isDragging = false;
        this.selectedPiece = null;
        this.render();
        this.checkWin();
    }

    checkWin() {
        const placedCount = this.pieces.filter(p => p.isPlaced).length;
        const total = this.difficulty;

        // Update UI counter
        const counter = document.getElementById('game-piece-count');
        if (counter) counter.textContent = total - placedCount;

        if (placedCount === total) {
            const winOverlay = document.getElementById('win-overlay');
            if (winOverlay) winOverlay.style.display = 'flex';
        }
    }

    render() {
        // Clear with background color instead of transparency
        this.ctx.fillStyle = this.backgroundColor || '#0f172a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 1. Draw Preview Image (Hint guide)
        if (this.showPreview) {
            this.ctx.save();
            this.ctx.globalAlpha = 0.2;
            this.ctx.drawImage(this.image, this.renderX, this.renderY, this.renderWidth, this.renderHeight);
            this.ctx.restore();
        }

        // Draw Guide Box
        const isLight = (hex) => {
            const h = hex.startsWith('#') ? hex.slice(1) : hex;
            const r = parseInt(h.substring(0, 2), 16);
            const g = parseInt(h.substring(2, 4), 16);
            const b = parseInt(h.substring(4, 6), 16);
            return (r * 299 + g * 587 + b * 114) / 1000 > 155;
        };

        this.ctx.strokeStyle = isLight(this.backgroundColor || '#0f172a')
            ? 'rgba(0, 0, 0, 0.5)'
            : 'rgba(255, 255, 255, 0.15)';

        this.ctx.setLineDash([5, 5]);
        this.ctx.strokeRect(this.renderX, this.renderY, this.renderWidth, this.renderHeight);
        this.ctx.setLineDash([]);

        // Draw already placed pieces first (bottom layer)
        this.pieces.filter(p => p.isPlaced).forEach(p => this.drawPiece(p));

        // Draw free floating pieces
        this.pieces.filter(p => !p.isPlaced).forEach(p => this.drawPiece(p));
    }

    drawPiece(p) {
        this.ctx.save();
        this.drawPieceOnCanvas(this.ctx, this.image, p, true);
        this.ctx.restore();
    }

    drawPieceOnCanvas(ctx, image, p, includeShadow = false) {
        const x = p.currentX;
        const y = p.currentY;
        const w = p.width;
        const h = p.height;
        const r = Math.min(w, h) * 0.2; // tab size

        // 1. Establish the jigsaw clipping path
        ctx.beginPath();
        ctx.moveTo(x, y);

        // Top Side
        if (p.tabs && p.tabs.top !== 0) {
            ctx.lineTo(x + w * 0.35, y);
            ctx.bezierCurveTo(x + w * 0.35, y - p.tabs.top * r, x + w * 0.65, y - p.tabs.top * r, x + w * 0.65, y);
        }
        ctx.lineTo(x + w, y);

        // Right Side
        if (p.tabs && p.tabs.right !== 0) {
            ctx.lineTo(x + w, y + h * 0.35);
            ctx.bezierCurveTo(x + w + p.tabs.right * r, y + h * 0.35, x + w + p.tabs.right * r, y + h * 0.65, x + w, y + h * 0.65);
        }
        ctx.lineTo(x + w, y + h);

        // Bottom Side
        if (p.tabs && p.tabs.bottom !== 0) {
            ctx.lineTo(x + w * 0.65, y + h);
            ctx.bezierCurveTo(x + w * 0.65, y + h + p.tabs.bottom * r, x + w * 0.35, y + h + p.tabs.bottom * r, x + w * 0.35, y + h);
        }
        ctx.lineTo(x, y + h);

        // Left Side
        if (p.tabs && p.tabs.left !== 0) {
            ctx.lineTo(x, y + h * 0.65);
            ctx.bezierCurveTo(x - p.tabs.left * r, y + h * 0.65, x - p.tabs.left * r, y + h * 0.35, x, y + h * 0.35);
        }
        ctx.lineTo(x, y);
        ctx.closePath();

        // 2. Shadows/Glow for unplaced pieces
        if (includeShadow && !p.isPlaced) {
            ctx.save();
            ctx.shadowBlur = 10;
            ctx.shadowColor = 'rgba(0,0,0,0.3)';
            ctx.fillStyle = '#fff';
            ctx.fill();
            ctx.restore();
        }

        ctx.save();
        ctx.clip();

        // 3. Draw image into clipped area
        // We expand the draw region so outward tabs have image content
        // Proportionally scale the crop expansion
        const imgScale = image.width / this.renderWidth;
        const pad = r;
        const imgPad = r * imgScale;

        ctx.drawImage(
            image,
            p.cropX - imgPad, p.cropY - imgPad, p.cropW + imgPad * 2, p.cropH + imgPad * 2,
            x - pad, y - pad, w + pad * 2, h + pad * 2
        );
        ctx.restore();

        // 4. Draw Stroke
        if (p.isPlaced) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 1;
        } else {
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1.2;
        }
        ctx.stroke();
    }

    // --- TOOL ACTIONS ---

    togglePreview() {
        this.showPreview = !this.showPreview;
        this.render();
    }

    useHint() {
        const gemEl = document.getElementById('gem-count');
        let currentGems = parseInt(gemEl ? gemEl.textContent : 0);
        const hintCost = 15;

        if (currentGems < hintCost) {
            alert("Not enough gems! Collect more by completing puzzles.");
            return;
        }

        const remainingInTray = this.trayPieces.length;
        if (remainingInTray === 0) return;

        // Deduct gems
        currentGems -= hintCost;
        if (gemEl) gemEl.textContent = currentGems;

        // Update hint counter (visual only for now)
        const hintBadge = document.querySelector('.game-header-tools .tool-icon span');
        if (hintBadge) {
            let count = parseInt(hintBadge.textContent);
            if (count > 0) hintBadge.textContent = count - 1;
            else hintBadge.style.display = 'none';
        }

        // Pick the first piece from tray
        const piece = this.trayPieces[0];
        this.trayPieces.splice(0, 1);
        this.updateTrayUI();

        // Place it correctly
        piece.currentX = piece.targetX;
        piece.currentY = piece.targetY;
        piece.isPlaced = true;
        this.pieces.push(piece);

        this.render();
        this.checkWin();

        // Trigger animation
        if (window.triggerPointsOverlay) window.triggerPointsOverlay();
    }

    shuffleTray() {
        for (let i = this.trayPieces.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.trayPieces[i], this.trayPieces[j]] = [this.trayPieces[j], this.trayPieces[i]];
        }
        this.updateTrayUI();
    }

    toggleEdges() {
        this.onlyEdges = !this.onlyEdges;
        this.updateTrayUI();
    }
}

// Global instance
window.gameEngine = new JigsawPuzzle('game-puzzle-canvas', 'tray-area');
