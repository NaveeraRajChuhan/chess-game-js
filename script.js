// Chess Game Implementation
class ChessGame {
    constructor() {
        this.board = this.initBoard();
        this.currentPlayer = 'white';
        this.playerColor = 'white'; // New: Player's chosen color
        this.moveCount = 0;
        this.captureCount = 0;
        this.moveHistory = [];
        this.selectedSquare = null;
        this.validMoves = [];
        this.gameOver = false;
        this.winner = null;
        this.checkStatus = false;
        this.difficulty = 'medium';
        this.waitingForAI = false;
        
        this.init();
    }

    initBoard() {
        const board = Array(8).fill().map(() => Array(8).fill(null));
        
        // Place pawns
        for (let i = 0; i < 8; i++) {
            board[1][i] = { type: 'pawn', color: 'black', hasMoved: false };
            board[6][i] = { type: 'pawn', color: 'white', hasMoved: false };
        }
        
        // Place other pieces
        const pieces = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
        for (let i = 0; i < 8; i++) {
            board[0][i] = { type: pieces[i], color: 'black', hasMoved: false };
            board[7][i] = { type: pieces[i], color: 'white', hasMoved: false };
        }
        
        return board;
    }

    getPieceIcon(piece) {
        if (!piece) return '';
        const icons = {
            king: { white: '<i class="fas fa-chess-king" style="color: #fff; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);"></i>', black: '<i class="fas fa-chess-king" style="color: #333; text-shadow: 2px 2px 4px rgba(255,255,255,0.3);"></i>' },
            queen: { white: '<i class="fas fa-chess-queen" style="color: #fff;"></i>', black: '<i class="fas fa-chess-queen" style="color: #333;"></i>' },
            rook: { white: '<i class="fas fa-chess-rook" style="color: #fff;"></i>', black: '<i class="fas fa-chess-rook" style="color: #333;"></i>' },
            bishop: { white: '<i class="fas fa-chess-bishop" style="color: #fff;"></i>', black: '<i class="fas fa-chess-bishop" style="color: #333;"></i>' },
            knight: { white: '<i class="fas fa-chess-knight" style="color: #fff;"></i>', black: '<i class="fas fa-chess-knight" style="color: #333;"></i>' },
            pawn: { white: '<i class="fas fa-chess-pawn" style="color: #fff;"></i>', black: '<i class="fas fa-chess-pawn" style="color: #333;"></i>' }
        };
        return icons[piece.type][piece.color];
    }

    isValidMove(piece, fromRow, fromCol, toRow, toCol, board = this.board) {
        const targetPiece = board[toRow][toCol];
        
        // Can't capture own piece
        if (targetPiece && targetPiece.color === piece.color) return false;
        
        const deltaRow = toRow - fromRow;
        const deltaCol = toCol - fromCol;
        const absDeltaRow = Math.abs(deltaRow);
        const absDeltaCol = Math.abs(deltaCol);
        
        switch(piece.type) {
            case 'pawn':
                const direction = piece.color === 'white' ? -1 : 1;
                const startRow = piece.color === 'white' ? 6 : 1;
                
                // Move forward one square
                if (deltaCol === 0 && deltaRow === direction && !targetPiece) return true;
                
                // Move forward two squares from start
                if (deltaCol === 0 && deltaRow === 2 * direction && fromRow === startRow && !targetPiece && !board[fromRow + direction][fromCol]) return true;
                
                // Capture diagonally
                if (absDeltaCol === 1 && deltaRow === direction && targetPiece) return true;
                
                return false;
                
            case 'knight':
                return (absDeltaRow === 2 && absDeltaCol === 1) || (absDeltaRow === 1 && absDeltaCol === 2);
                
            case 'bishop':
                if (absDeltaRow !== absDeltaCol) return false;
                return this.isClearPath(fromRow, fromCol, toRow, toCol, board);
                
            case 'rook':
                if (fromRow !== toRow && fromCol !== toCol) return false;
                return this.isClearPath(fromRow, fromCol, toRow, toCol, board);
                
            case 'queen':
                if (fromRow !== toRow && fromCol !== toCol && absDeltaRow !== absDeltaCol) return false;
                return this.isClearPath(fromRow, fromCol, toRow, toCol, board);
                
            case 'king':
                if (absDeltaRow <= 1 && absDeltaCol <= 1) return true;
                
                // Castling
                if (!piece.hasMoved && deltaRow === 0 && absDeltaCol === 2) {
                    const rookCol = deltaCol === 2 ? 7 : 0;
                    const rook = board[fromRow][rookCol];
                    if (rook && rook.type === 'rook' && !rook.hasMoved) {
                        const step = deltaCol === 2 ? 1 : -1;
                        for (let col = fromCol + step; col !== rookCol; col += step) {
                            if (board[fromRow][col]) return false;
                        }
                        // Check if squares between are not under attack
                        const kingPos = { row: fromRow, col: fromCol };
                        for (let col = fromCol; col !== toCol + step; col += step) {
                            if (this.isSquareAttacked(fromRow, col, piece.color, board)) return false;
                        }
                        return true;
                    }
                }
                return false;
                
            default:
                return false;
        }
    }

    isClearPath(fromRow, fromCol, toRow, toCol, board) {
        const rowStep = Math.sign(toRow - fromRow);
        const colStep = Math.sign(toCol - fromCol);
        let row = fromRow + rowStep;
        let col = fromCol + colStep;
        
        while (row !== toRow || col !== toCol) {
            if (board[row][col]) return false;
            row += rowStep;
            col += colStep;
        }
        return true;
    }

    isSquareAttacked(row, col, color, board = this.board) {
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const piece = board[i][j];
                if (piece && piece.color !== color) {
                    if (this.isValidMove(piece, i, j, row, col, board)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    isCheck(color, board = this.board) {
        let kingPos = this.findKing(color, board);
        return this.isSquareAttacked(kingPos.row, kingPos.col, color, board);
    }

    findKing(color, board = this.board) {
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const piece = board[i][j];
                if (piece && piece.type === 'king' && piece.color === color) {
                    return { row: i, col: j };
                }
            }
        }
        return { row: -1, col: -1 };
    }

    isCheckmate(color) {
        if (!this.isCheck(color)) return false;
        
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const piece = this.board[i][j];
                if (piece && piece.color === color) {
                    const moves = this.getValidMovesForPiece(i, j);
                    for (const move of moves) {
                        if (this.tryMove(i, j, move.row, move.col, true)) {
                            return false;
                        }
                    }
                }
            }
        }
        return true;
    }

    getValidMovesForPiece(row, col, board = this.board) {
        const piece = board[row][col];
        if (!piece) return [];
        
        const moves = [];
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                if (this.isValidMove(piece, row, col, i, j, board)) {
                    moves.push({ row: i, col: j });
                }
            }
        }
        return moves;
    }

    tryMove(fromRow, fromCol, toRow, toCol, isSimulation = false) {
        const piece = this.board[fromRow][fromCol];
        if (!piece) return false;
        
        const targetPiece = this.board[toRow][toCol];
        const newBoard = this.copyBoard();
        
        // Make move on temporary board
        newBoard[toRow][toCol] = { ...piece, hasMoved: true };
        newBoard[fromRow][fromCol] = null;
        
        // Handle castling rook move in simulation
        if (piece.type === 'king' && Math.abs(toCol - fromCol) === 2) {
            const rookFromCol = toCol === 6 ? 7 : 0;
            const rookToCol = toCol === 6 ? 5 : 3;
            const rook = newBoard[fromRow][rookFromCol];
            if (rook && rook.type === 'rook') {
                newBoard[fromRow][rookToCol] = { ...rook, hasMoved: true };
                newBoard[fromRow][rookFromCol] = null;
            }
        }
        
        // Check if move leaves/puts king in check
        const kingPos = this.findKing(piece.color, newBoard);
        if (this.isSquareAttacked(kingPos.row, kingPos.col, piece.color, newBoard)) {
            return false;
        }
        
        if (!isSimulation) {
            // Execute actual move
            this.board[toRow][toCol] = { ...piece, hasMoved: true };
            this.board[fromRow][fromCol] = null;
            
            if (targetPiece) {
                this.captureCount++;
                this.addCaptureAnimation(toRow, toCol);
            }
            
            // Handle castling rook move
            if (piece.type === 'king' && Math.abs(toCol - fromCol) === 2) {
                const rookFromCol = toCol === 6 ? 7 : 0;
                const rookToCol = toCol === 6 ? 5 : 3;
                const rook = this.board[fromRow][rookFromCol];
                if (rook && rook.type === 'rook') {
                    this.board[fromRow][rookToCol] = { ...rook, hasMoved: true };
                    this.board[fromRow][rookFromCol] = null;
                }
            }
            
            this.moveCount++;
            this.moveHistory.push({
                piece: piece.type,
                color: piece.color,
                from: this.squareToAlgebraic(fromRow, fromCol),
                to: this.squareToAlgebraic(toRow, toCol),
                capture: !!targetPiece
            });
            
            this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
            this.checkStatus = this.isCheck(this.currentPlayer);
            
            if (this.isCheckmate(this.currentPlayer)) {
                this.gameOver = true;
                this.winner = this.currentPlayer === 'white' ? 'black' : 'white';
                this.showVictory(this.winner);
            }
            
            this.updateUI();
        }
        
        return true;
    }

    copyBoard() {
        return this.board.map(row => 
            row.map(cell => cell ? { ...cell } : null)
        );
    }

    squareToAlgebraic(row, col) {
        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
        return files[col] + ranks[row];
    }

    addCaptureAnimation(row, col) {
        const square = document.querySelector(`[data-row='${row}'][data-col='${col}']`);
        if (square) {
            square.classList.add('capture-flash');
            setTimeout(() => square.classList.remove('capture-flash'), 300);
        }
    }

    getValidMoves(row, col) {
        const piece = this.board[row][col];
        if (!piece || piece.color !== this.currentPlayer || this.gameOver) return [];
        
        const moves = [];
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                if (this.isValidMove(piece, row, col, i, j)) {
                    if (this.tryMove(row, col, i, j, true)) {
                        moves.push({ row: i, col: j });
                    }
                }
            }
        }
        return moves;
    }

    makeMove(fromRow, fromCol, toRow, toCol) {
        if (this.gameOver) return false;
        if (this.waitingForAI) return false;
        
        const piece = this.board[fromRow][fromCol];
        if (!piece || piece.color !== this.currentPlayer) {
            this.showWrongMove(fromRow, fromCol);
            return false;
        }
        
        // If it's AI's turn, don't allow player move
        if (this.currentPlayer !== this.playerColor && this.currentPlayer !== 'white') {
            this.showWrongMove(toRow, toCol);
            return false;
        }
        
        if (this.tryMove(fromRow, fromCol, toRow, toCol)) {
            return true;
        } else {
            this.showWrongMove(toRow, toCol);
            return false;
        }
    }

    showWrongMove(row, col) {
        const square = document.querySelector(`[data-row='${row}'][data-col='${col}']`);
        if (square) {
            square.classList.add('wrong-move');
            setTimeout(() => square.classList.remove('wrong-move'), 300);
        }
    }

    updateUI() {
        this.renderBoard();
        document.getElementById('turnDisplay').textContent = this.currentPlayer === 'white' ? 'White' : 'Black';
        
        const turnIcon = document.getElementById('turnPieceIcon');
        if (this.currentPlayer === 'white') {
            turnIcon.innerHTML = '<i class="fas fa-chess-king" style="color: #fff;"></i>';
        } else {
            turnIcon.innerHTML = '<i class="fas fa-chess-king" style="color: #333;"></i>';
        }
        
        document.getElementById('turnText').textContent = `${this.currentPlayer === 'white' ? 'White' : 'Black'}'s Turn`;
        document.getElementById('moveCount').textContent = this.moveCount;
        document.getElementById('captureCount').textContent = this.captureCount;
        
        const checkStatusSpan = document.getElementById('checkStatus');
        if (this.checkStatus) {
            checkStatusSpan.innerHTML = '<span style="color: #ff6b6b;"><i class="fas fa-exclamation-triangle"></i> CHECK!</span>';
            checkStatusSpan.classList.add('check-glow');
        } else {
            checkStatusSpan.innerHTML = '<i class="fas fa-shield-alt"></i> Safe';
            checkStatusSpan.classList.remove('check-glow');
        }
        
        this.updateMoveHistory();
    }

    updateMoveHistory() {
        const historyDiv = document.getElementById('moveHistory');
        if (this.moveHistory.length === 0) {
            historyDiv.innerHTML = '<div class="text-center text-white-50">No moves yet</div>';
            return;
        }
        
        historyDiv.innerHTML = this.moveHistory.slice().reverse().map((move, index) => {
            const moveNumber = this.moveHistory.length - index;
            const captureIcon = move.capture ? '<i class="fas fa-skull"></i>' : '<i class="fas fa-arrow-right"></i>';
            const pieceIcons = {
                king: '<i class="fas fa-chess-king"></i>',
                queen: '<i class="fas fa-chess-queen"></i>',
                rook: '<i class="fas fa-chess-rook"></i>',
                bishop: '<i class="fas fa-chess-bishop"></i>',
                knight: '<i class="fas fa-chess-knight"></i>',
                pawn: '<i class="fas fa-chess-pawn"></i>'
            };
            return `
                <div class="history-item">
                    <strong>${moveNumber}.</strong>
                    <span style="color: ${move.color === 'white' ? '#ffd700' : '#ff6b6b'}">
                        ${pieceIcons[move.piece]} ${move.piece.toUpperCase()}
                    </span>
                    ${captureIcon}
                    ${move.from} → ${move.to}
                </div>
            `;
        }).join('');
    }

    showVictory(winner) {
        const overlay = document.createElement('div');
        overlay.className = 'overlay';
        const modal = document.createElement('div');
        modal.className = 'victory-modal';
        const winnerIcon = winner === 'white' ? '<i class="fas fa-chess-king" style="color: #ffd700;"></i>' : '<i class="fas fa-chess-king" style="color: #ff6b6b;"></i>';
        modal.innerHTML = `
            <h2><i class="fas fa-trophy"></i> GAME OVER <i class="fas fa-trophy"></i></h2>
            <h3 style="color: ${winner === 'white' ? '#ffd700' : '#ff6b6b'}">
                ${winnerIcon} ${winner.toUpperCase()} WINS! ${winnerIcon}
            </h3>
            <p><i class="fas fa-chart-line"></i> Total Moves: ${this.moveCount}</p>
            <p><i class="fas fa-skull"></i> Captures: ${this.captureCount}</p>
            <button onclick="location.reload()"><i class="fas fa-play"></i> Play Again</button>
        `;
        document.body.appendChild(overlay);
        document.body.appendChild(modal);
    }

    renderBoard() {
        const boardElement = document.getElementById('chessBoard');
        boardElement.innerHTML = '';
        
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const piece = this.board[i][j];
                const isLight = (i + j) % 2 === 0;
                const square = document.createElement('div');
                square.className = `square ${isLight ? 'light' : 'dark'}`;
                square.setAttribute('data-row', i);
                square.setAttribute('data-col', j);
                
                if (piece) {
                    const pieceIcon = this.getPieceIcon(piece);
                    const pieceElement = document.createElement('div');
                    pieceElement.className = 'piece';
                    pieceElement.innerHTML = pieceIcon;
                    pieceElement.style.cursor = 'pointer';
                    square.appendChild(pieceElement);
                }
                
                // Check if king is in check
                if (piece && piece.type === 'king' && piece.color === this.currentPlayer && this.checkStatus) {
                    square.classList.add('check');
                }
                
                // Highlight selected square
                if (this.selectedSquare && this.selectedSquare.row === i && this.selectedSquare.col === j) {
                    square.classList.add('selected');
                }
                
                // Highlight valid moves
                if (this.validMoves.some(move => move.row === i && move.col === j)) {
                    const targetPiece = this.board[i][j];
                    square.classList.add('valid-move');
                    if (targetPiece) square.classList.add('capture-move');
                }
                
                square.addEventListener('click', () => this.handleSquareClick(i, j));
                boardElement.appendChild(square);
            }
        }
    }

    handleSquareClick(row, col) {
        if (this.gameOver) return;
        if (this.waitingForAI) return;
        
        // If it's AI's turn, don't allow player to select
        if (this.currentPlayer !== this.playerColor) {
            return;
        }
        
        if (this.selectedSquare === null) {
            const piece = this.board[row][col];
            if (piece && piece.color === this.currentPlayer) {
                this.selectedSquare = { row, col };
                this.validMoves = this.getValidMoves(row, col);
                this.renderBoard();
            }
        } else {
            const success = this.makeMove(
                this.selectedSquare.row, 
                this.selectedSquare.col, 
                row, 
                col
            );
            
            this.selectedSquare = null;
            this.validMoves = [];
            
            if (success && !this.gameOver) {
                // AI Move after player move
                this.waitingForAI = true;
                setTimeout(() => this.makeAIMove(), 100);
            }
            this.renderBoard();
        }
    }

    makeAIMove() {
        if (this.gameOver) {
            this.waitingForAI = false;
            return;
        }
        if (this.currentPlayer !== 'black' && this.currentPlayer !== 'white') {
            this.waitingForAI = false;
            return;
        }
        // If it's not AI's turn (AI plays the opposite color of player)
        if (this.currentPlayer === this.playerColor) {
            this.waitingForAI = false;
            return;
        }
        
        const allPieces = [];
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const piece = this.board[i][j];
                if (piece && piece.color === this.currentPlayer) {
                    const moves = this.getValidMovesForPiece(i, j);
                    if (moves.length > 0) {
                        allPieces.push({ row: i, col: j, moves });
                    }
                }
            }
        }
        
        if (allPieces.length === 0) {
            this.waitingForAI = false;
            return;
        }
        
        let bestMove = null;
        
        switch(this.difficulty) {
            case 'easy':
                // Random move
                const randomPiece = allPieces[Math.floor(Math.random() * allPieces.length)];
                const randomMove = randomPiece.moves[Math.floor(Math.random() * randomPiece.moves.length)];
                bestMove = { from: randomPiece, to: randomMove };
                break;
                
            case 'medium':
                // Prioritize captures
                for (const piece of allPieces) {
                    for (const move of piece.moves) {
                        if (this.board[move.row][move.col]) {
                            bestMove = { from: piece, to: move };
                            break;
                        }
                    }
                    if (bestMove) break;
                }
                if (!bestMove && allPieces[0]) {
                    bestMove = { from: allPieces[0], to: allPieces[0].moves[0] };
                }
                break;
                
            case 'hard':
                // Prioritize captures and center control
                let bestScore = -Infinity;
                for (const piece of allPieces) {
                    for (const move of piece.moves) {
                        let score = 0;
                        // Capture bonus
                        if (this.board[move.row][move.col]) {
                            const targetPiece = this.board[move.row][move.col];
                            const pieceValues = { queen: 9, rook: 5, bishop: 3, knight: 3, pawn: 1, king: 100 };
                            score += pieceValues[targetPiece.type] || 0;
                        }
                        // Center control bonus
                        const centerDist = Math.abs(move.col - 3.5);
                        score += (4 - centerDist);
                        // Random factor to make it less predictable
                        score += Math.random() * 0.5;
                        if (score > bestScore) {
                            bestScore = score;
                            bestMove = { from: piece, to: move };
                        }
                    }
                }
                break;
        }
        
        if (bestMove) {
            this.makeMove(bestMove.from.row, bestMove.from.col, bestMove.to.row, bestMove.to.col);
            this.renderBoard();
        }
        
        this.waitingForAI = false;
    }

    setDifficulty(level) {
        this.difficulty = level;
    }

    setPlayerColor(color) {
        if (color === 'random') {
            this.playerColor = Math.random() < 0.5 ? 'white' : 'black';
        } else {
            this.playerColor = color;
        }
        this.resetGame();
        
        // If player chose black, AI starts as white
        if (this.playerColor === 'black') {
            setTimeout(() => this.makeAIMove(), 500);
        }
    }

    resetGame() {
        this.board = this.initBoard();
        this.currentPlayer = 'white';
        this.moveCount = 0;
        this.captureCount = 0;
        this.moveHistory = [];
        this.selectedSquare = null;
        this.validMoves = [];
        this.gameOver = false;
        this.winner = null;
        this.checkStatus = false;
        this.waitingForAI = false;
        
        // Remove any existing modals
        const overlay = document.querySelector('.overlay');
        const modal = document.querySelector('.victory-modal');
        if (overlay) overlay.remove();
        if (modal) modal.remove();
        
        this.updateUI();
        this.renderBoard();
        
        // If player chose black, AI makes first move
        if (this.playerColor === 'black' && !this.gameOver) {
            this.waitingForAI = true;
            setTimeout(() => this.makeAIMove(), 500);
        }
    }

    init() {
        this.renderBoard();
        this.updateUI();
        
        // Setup difficulty buttons
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.setDifficulty(btn.dataset.difficulty);
            });
        });
        
        // Setup color choice buttons
        document.querySelectorAll('.color-choice-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.color-choice-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.setPlayerColor(btn.dataset.color);
            });
        });
        
        // Setup restart buttons
        document.getElementById('restartBtn').addEventListener('click', () => {
            this.resetGame();
        });
        
        document.getElementById('resetBoardBtn').addEventListener('click', () => {
            if (confirm('Reset the game? All progress will be lost.')) {
                this.resetGame();
            }
        });
        
        // Set default player color (white)
        this.playerColor = 'white';
    }
}

// Start the game when page loads
window.addEventListener('DOMContentLoaded', () => {
    new ChessGame();
});