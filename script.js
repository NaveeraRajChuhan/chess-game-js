// Chess Game Implementation
class ChessGame {
    constructor() {
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
        this.difficulty = 'medium';
        
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

    getPieceSymbol(piece) {
        if (!piece) return '';
        const symbols = {
            king: { white: '♔', black: '♚' },
            queen: { white: '♕', black: '♛' },
            rook: { white: '♖', black: '♜' },
            bishop: { white: '♗', black: '♝' },
            knight: { white: '♘', black: '♞' },
            pawn: { white: '♙', black: '♟' }
        };
        return symbols[piece.type][piece.color];
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

    algebraicToSquare(algebraic) {
        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        const col = files.indexOf(algebraic[0]);
        const row = 8 - parseInt(algebraic[1]);
        return { row, col };
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
        
        const piece = this.board[fromRow][fromCol];
        if (!piece || piece.color !== this.currentPlayer) {
            this.showWrongMove(fromRow, fromCol);
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
        document.getElementById('turnPieceIcon').innerHTML = this.currentPlayer === 'white' ? '♔' : '♚';
        document.getElementById('turnText').textContent = `${this.currentPlayer === 'white' ? 'White' : 'Black'}'s Turn`;
        document.getElementById('moveCount').textContent = this.moveCount;
        document.getElementById('captureCount').textContent = this.captureCount;
        
        const checkStatusSpan = document.getElementById('checkStatus');
        if (this.checkStatus) {
            checkStatusSpan.innerHTML = '<span style="color: #ff6b6b;">⚠CHECK⚠</span>';
            checkStatusSpan.classList.add('check-glow');
        } else {
            checkStatusSpan.textContent = 'Safe';
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
            const captureIcon = move.capture ? '⚔️' : '→';
            return `
                <div class="history-item">
                    <strong>${moveNumber}.</strong>
                    <span style="color: ${move.color === 'white' ? '#ffd700' : '#ff6b6b'}">
                        ${move.piece.toUpperCase()}
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
        modal.innerHTML = `
            <h2>🏆 GAME OVER 🏆</h2>
            <h3 style="color: ${winner === 'white' ? '#ffd700' : '#ff6b6b'}">
                ${winner === 'white' ? '♔ WHITE WINS! ♔' : '♚ BLACK WINS! ♚'}
            </h3>
            <p>Total Moves: ${this.moveCount}</p>
            <p>Captures: ${this.captureCount}</p>
            <button onclick="location.reload()">Play Again</button>
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
                    const pieceSymbol = this.getPieceSymbol(piece);
                    const pieceElement = document.createElement('div');
                    pieceElement.className = 'piece';
                    pieceElement.textContent = pieceSymbol;
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
            
            if (success) {
                // AI Move after player move
                setTimeout(() => this.makeAIMove(), 100);
            }
            this.renderBoard();
        }
    }

    makeAIMove() {
        if (this.gameOver || this.currentPlayer !== 'black') return;
        
        const allPieces = [];
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const piece = this.board[i][j];
                if (piece && piece.color === 'black') {
                    const moves = this.getValidMovesForPiece(i, j);
                    if (moves.length > 0) {
                        allPieces.push({ row: i, col: j, moves });
                    }
                }
            }
        }
        
        if (allPieces.length === 0) return;
        
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
                            score += 10;
                        }
                        // Center control bonus
                        const centerDist = Math.abs(move.col - 3.5);
                        score += (4 - centerDist);
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
    }

    setDifficulty(level) {
        this.difficulty = level;
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
        this.updateUI();
        this.renderBoard();
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
        
        // Setup restart buttons
        document.getElementById('restartBtn').addEventListener('click', () => {
            this.resetGame();
        });
        
        document.getElementById('resetBoardBtn').addEventListener('click', () => {
            if (confirm('Reset the game? All progress will be lost.')) {
                this.resetGame();
            }
        });
    }
}

// Start the game when page loads
window.addEventListener('DOMContentLoaded', () => {
    new ChessGame();
});