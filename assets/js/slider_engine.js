/**
 * Monu Slider Puzzle Engine
 * Handles logic for sliding tile puzzles (N-puzzle)
 */
window.sliderEngine = {
    imgSrc: '',
    tiles: [], // Current board state [0, 1, 2, ..., count-1] where count-1 is empty
    count: 16, // Default 4x4
    side: 4,
    moves: 0,
    startTime: null,
    isSolved: false,
    emptyIndex: 15, // Index of the empty slot
    backgroundColor: '#f3f4f6',

    init(imgSrc, count) {
        this.imgSrc = imgSrc;
        this.count = count;
        this.side = Math.sqrt(count);
        this.moves = 0;
        this.isSolved = false;
        this.emptyIndex = count - 1;
        this.tiles = Array.from({ length: count }, (_, i) => i);
        
        this.shuffle();
        this.render();
        
        // Update moves count in UI
        const movesEl = document.getElementById('moves-count');
        if (movesEl) movesEl.textContent = 'Moves: 0';
    },

    shuffle() {
        // To ensure solvability, we'll perform a series of random valid moves
        // instead of a truly random permutation.
        let shuffleMoves = this.count * 20; 
        for (let i = 0; i < shuffleMoves; i++) {
            const neighbors = this.getValidMoves();
            const randomMove = neighbors[Math.floor(Math.random() * neighbors.length)];
            this.swap(randomMove, false);
        }
        this.moves = 0; // Reset moves after shuffling
    },

    getValidMoves() {
        const moves = [];
        const r = Math.floor(this.emptyIndex / this.side);
        const c = this.emptyIndex % this.side;

        if (r > 0) moves.push(this.emptyIndex - this.side); // Up
        if (r < this.side - 1) moves.push(this.emptyIndex + this.side); // Down
        if (c > 0) moves.push(this.emptyIndex - 1); // Left
        if (c < this.side - 1) moves.push(this.emptyIndex + 1); // Right

        return moves;
    },

    swap(index, incrementMoves = true) {
        const temp = this.tiles[index];
        this.tiles[index] = this.tiles[this.emptyIndex];
        this.tiles[this.emptyIndex] = temp;
        this.emptyIndex = index;
        
        if (incrementMoves) {
            this.moves++;
            const movesEl = document.getElementById('moves-count');
            if (movesEl) movesEl.textContent = `Moves: ${this.moves}`;
            if (typeof window.playMoveSound === 'function') window.playMoveSound();
            
            this.checkWin();
        }
    },

    checkWin() {
        const isWin = this.tiles.every((tile, i) => tile === i);
        if (isWin && this.moves > 0) {
            this.isSolved = true;
            this.onWin();
        }
    },

    onWin() {
        if (typeof window.playWinSound === 'function') window.playWinSound();
        const winOverlay = document.getElementById('win-overlay');
        if (winOverlay) {
            winOverlay.style.display = 'flex';
            setTimeout(() => winOverlay.classList.add('active'), 10);
            if (typeof window.createConfetti === 'function') window.createConfetti();
        }
    },

    handleTileClick(index) {
        if (this.isSolved) return;
        
        const neighbors = this.getValidMoves();
        if (neighbors.includes(index)) {
            this.swap(index);
            this.render();
        }
    },

    render() {
        const board = document.getElementById('slider-board');
        if (!board) return;

        board.style.gridTemplateColumns = `repeat(${this.side}, 1fr)`;
        board.style.gridTemplateRows = `repeat(${this.side}, 1fr)`;
        board.innerHTML = '';

        this.tiles.forEach((tileIndex, i) => {
            const tile = document.createElement('div');
            tile.className = 'slider-tile';
            
            if (tileIndex === this.count - 1) {
                // Empty tile
                tile.classList.add('empty');
                tile.style.backgroundColor = 'transparent';
            } else {
                tile.style.backgroundImage = `url(${this.imgSrc})`;
                tile.style.backgroundSize = `${this.side * 100}% ${this.side * 100}%`;
                
                const r = Math.floor(tileIndex / this.side);
                const c = tileIndex % this.side;
                tile.style.backgroundPosition = `${(c / (this.side - 1)) * 100}% ${(r / (this.side - 1)) * 100}%`;
                
                tile.onclick = () => this.handleTileClick(i);
            }
            
            board.appendChild(tile);
        });
    }
};
