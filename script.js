const IMAGE_PATH = "Cards/";
const drawPileElement = document.getElementById("draw-pile");
const discardPileElement = document.getElementById("discard-pile");
const currentCardElement = document.getElementById("current-card");
const player1GridElement = document.querySelector(".player1-grid");
const player2GridElement = document.querySelector(".player2-grid");
const player1ScoreElement = document.querySelector(".player1-score");
const player2ScoreElement = document.querySelector(".player2-score");
const turnIndicatorElement = document.getElementById("turn-indicator");
const endingScreenElement = document.getElementById("ending-screen");
const playAgainButton = document.getElementById("play-again");

// Define the deck template with the correct card counts (total 150 cards)
const deckTemplate = [
    ...Array(5).fill(-2),   // 5 cards of -2
    ...Array(10).fill(-1),  // 10 cards of -1
    ...Array(15).fill(0),   // 15 cards of 0
    ...Array(10).fill(1),   // 10 cards of 1
    ...Array(10).fill(2),   // 10 cards of 2
    ...Array(10).fill(3),   // 10 cards of 3
    ...Array(10).fill(4),   // 10 cards of 4
    ...Array(10).fill(5),   // 10 cards of 5
    ...Array(10).fill(6),   // 10 cards of 6
    ...Array(10).fill(7),   // 10 cards of 7
    ...Array(10).fill(8),   // 10 cards of 8
    ...Array(10).fill(9),   // 10 cards of 9
    ...Array(10).fill(10),  // 10 cards of 10
    ...Array(10).fill(11),  // 10 cards of 11
    ...Array(10).fill(12)   // 10 cards of 12
];

let drawPile = [];
let discardPile = [];
let player1GridCards = []; // 2D array for Player 1's grid
let player2GridCards = []; // 2D array for Player 2's grid
let gameState = {
    turnPhase: "chooseAction",
    currentPlayer: 1, // Will be set dynamically
    currentCard: null,
    finalTurnPlayer: null,
    gameEnding: false, // Flag to manage endgame
    startingPlayer: null // Will store the starting player
};

// **Fisher-Yates shuffle algorithm for fair randomization**
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// **Calculate the score of revealed cards for a player**
function calculateRevealedScore(gridCards) {
    if (gridCards.length === 0) return 0;
    return gridCards.flat().reduce((sum, card) => sum + (card.revealed ? card.value : 0), 0);
}

// **Create a card element for the grid**
function createCardElement(card) {
    const cardElement = document.createElement("div");
    cardElement.classList.add("card");
    const img = document.createElement("img");
    img.classList.add("card-image");
    img.src = card.revealed ? `${IMAGE_PATH}card_${card.value}.png` : `${IMAGE_PATH}card_back.png`;
    img.alt = card.revealed ? `Card ${card.value}` : "Card Back";
    cardElement.appendChild(img);
    return cardElement;
}

// **Render the grid dynamically based on the current size**
function renderGrid(gridElement, gridCards) {
    gridElement.innerHTML = "";
    if (gridCards.length === 0 || gridCards[0].length === 0) return; // Empty grid
    const numCols = gridCards[0].length;
    gridElement.style.gridTemplateColumns = `repeat(${numCols}, 80px)`; // Adjust 80px as needed
    gridCards.forEach((row, rowIndex) => {
        row.forEach((card, colIndex) => {
            const cardElement = createCardElement(card);
            cardElement.setAttribute("data-row", rowIndex);
            cardElement.setAttribute("data-col", colIndex);
            gridElement.appendChild(cardElement);
        });
    });
}

// **Deal a 3x4 grid as a 2D array**
function dealGrid() {
    const rows = 3;
    const cols = 4;
    const grid = [];
    for (let r = 0; r < rows; r++) {
        const row = [];
        for (let c = 0; c < cols; c++) {
            const value = drawPile.pop();
            row.push({ value, revealed: false });
        }
        grid.push(row);
    }
    return grid;
}

// **Reveal two initial cards randomly**
function revealInitialCards(gridCards, gridElement) {
    const numRows = gridCards.length;
    const numCols = gridCards[0].length;
    const indicesToReveal = [];
    while (indicesToReveal.length < 2) {
        const row = Math.floor(Math.random() * numRows);
        const col = Math.floor(Math.random() * numCols);
        if (!gridCards[row][col].revealed) {
            indicesToReveal.push({ row, col });
            gridCards[row][col].revealed = true;
        }
    }
    renderGrid(gridElement, gridCards);
}

// **Initialize the deck**
function initializeDeck() {
    let deck = [...deckTemplate]; // Copy the template
    drawPile = shuffle(deck); // Shuffle using Fisher-Yates
    discardPile = [drawPile.pop()]; // Start with one card in discard pile
    updateDiscardPile();
}

// **Update the discard pile display**
function updateDiscardPile() {
    discardPileElement.innerHTML = discardPile.length > 0
        ? `<div class="card"><img class="card-image" src="${IMAGE_PATH}card_${discardPile[discardPile.length - 1]}.png" alt="Card ${discardPile[discardPile.length - 1]}"></div>`
        : "";
}

// **Update a player's score**
function updateScore(player) {
    const gridCards = player === 1 ? player1GridCards : player2GridCards;
    const score = gridCards.length === 0 ? 0 : gridCards.flat().reduce((sum, card) => sum + (card.revealed ? card.value : 0), 0);
    (player === 1 ? player1ScoreElement : player2ScoreElement).textContent = score;
}

// **Update the turn indicator**
function updateTurnIndicator() {
    turnIndicatorElement.textContent = `Player ${gameState.currentPlayer}'s turn`;
}

// **Hide draw pile if empty**
function checkDrawPile() {
    if (drawPile.length === 0) drawPileElement.style.display = "none";
}

// **Check and remove columns or rows with all identical revealed cards**
function checkAndRemoveLines(gridCards) {
    // Check columns only if there are exactly 3 rows
    if (gridCards.length === 3) {
        const numCols = gridCards[0].length;
        const columnsToRemove = [];
        for (let c = 0; c < numCols; c++) {
            const column = [];
            for (let r = 0; r < 3; r++) {
                column.push(gridCards[r][c]);
            }
            if (column.every(card => card.revealed && card.value === column[0].value)) {
                columnsToRemove.push(c);
            }
        }
        columnsToRemove.sort((a, b) => b - a);
        columnsToRemove.forEach(c => {
            gridCards.forEach(row => row.splice(c, 1));
        });
    }

    // Check rows only if there are exactly 4 columns
    const numColsAfter = gridCards[0] ? gridCards[0].length : 0;
    if (numColsAfter === 4) {
        const rowsToRemove = [];
        gridCards.forEach((row, r) => {
            if (row.length === 4 && row.every(card => card.revealed && card.value === row[0].value)) {
                rowsToRemove.push(r);
            }
        });
        rowsToRemove.sort((a, b) => b - a);
        rowsToRemove.forEach(r => {
            gridCards.splice(r, 1);
        });
    }
}

// **Reset the turn and handle endgame logic**
function resetTurn() {
    if (gameState.gameEnding) {
        endGame();
        return;
    }

    const currentGrid = gameState.currentPlayer === 1 ? player1GridCards : player2GridCards;
    const allRevealed = currentGrid.length === 0 || currentGrid.flat().every(card => card.revealed);

    if (allRevealed) {
        if (gameState.currentPlayer === gameState.startingPlayer) {
            gameState.gameEnding = true; // Allow the other player one last turn
        } else {
            endGame(); // End immediately if non-starting player finishes
            return;
        }
    }

    gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
    gameState.turnPhase = "chooseAction";
    gameState.currentCard = null;
    currentCardElement.innerHTML = "";
    drawPileElement.style.display = "flex";
    player1GridElement.classList.remove("clickable");
    player2GridElement.classList.remove("clickable");
    checkDrawPile();
    updateTurnIndicator();
}

// **End the game and calculate final scores**
function endGame() {
    // Reveal all remaining unrevealed cards
    [player1GridCards, player2GridCards].forEach(grid => {
        grid.forEach(row => {
            row.forEach(card => {
                if (!card.revealed) card.revealed = true;
            });
        });
    });

    renderGrid(player1GridElement, player1GridCards);
    renderGrid(player2GridElement, player2GridCards);

    updateScore(1);
    updateScore(2);
    const player1Score = parseInt(player1ScoreElement.textContent);
    const player2Score = parseInt(player2ScoreElement.textContent);
    document.getElementById("player1-final-score").textContent = player1Score;
    document.getElementById("player2-final-score").textContent = player2Score;

    const winnerText = player1Score < player2Score ? "Player 1 wins!" : 
                      player2Score < player1Score ? "Player 2 wins!" : 
                      "It's a tie!";
    document.getElementById("winner-text").textContent = winnerText;

    endingScreenElement.classList.remove("hidden");
}

// **Event Listeners**
drawPileElement.addEventListener("click", () => {
    if (gameState.turnPhase !== "chooseAction" || drawPile.length === 0) return;
    const drawnValue = drawPile.pop();
    gameState.currentCard = drawnValue;
    gameState.turnPhase = "decideDrawnCard";
    drawPileElement.style.display = "none";
    currentCardElement.innerHTML = `<div class="card"><img class="card-image" src="${IMAGE_PATH}card_${drawnValue}.png" alt="Card ${drawnValue}"></div>`;
    (gameState.currentPlayer === 1 ? player1GridElement : player2GridElement).classList.add("clickable");
});

discardPileElement.addEventListener("click", () => {
    if (gameState.turnPhase !== "chooseAction" || discardPile.length === 0) return;
    gameState.currentCard = discardPile.pop();
    gameState.turnPhase = "swapCard";
    updateDiscardPile();
    currentCardElement.innerHTML = `<div class="card"><img class="card-image" src="${IMAGE_PATH}card_${gameState.currentCard}.png" alt="Card ${gameState.currentCard}"></div>`;
    (gameState.currentPlayer === 1 ? player1GridElement : player2GridElement).classList.add("clickable");
});

currentCardElement.addEventListener("dblclick", () => {
    if (gameState.turnPhase !== "decideDrawnCard" || gameState.currentCard === null) return;
    discardPile.push(gameState.currentCard);
    updateDiscardPile();
    gameState.turnPhase = "revealCard";
    currentCardElement.innerHTML = "";
    (gameState.currentPlayer === 1 ? player1GridElement : player2GridElement).classList.add("clickable");
});

player1GridElement.addEventListener("click", (e) => {
    if (gameState.currentPlayer !== 1 || !player1GridElement.classList.contains("clickable")) return;
    const cardElement = e.target.closest(".card");
    if (!cardElement) return;
    const row = parseInt(cardElement.getAttribute("data-row"));
    const col = parseInt(cardElement.getAttribute("data-col"));
    const cardData = player1GridCards[row][col];

    if (gameState.turnPhase === "decideDrawnCard" || gameState.turnPhase === "swapCard") {
        const oldValue = cardData.value;
        cardData.value = gameState.currentCard;
        cardData.revealed = true;
        discardPile.push(oldValue);
        updateDiscardPile();
        checkAndRemoveLines(player1GridCards);
        renderGrid(player1GridElement, player1GridCards);
        updateScore(1);
        resetTurn();
    } else if (gameState.turnPhase === "revealCard" && !cardData.revealed) {
        cardData.revealed = true;
        checkAndRemoveLines(player1GridCards);
        renderGrid(player1GridElement, player1GridCards);
        updateScore(1);
        resetTurn();
    }
});

player2GridElement.addEventListener("click", (e) => {
    if (gameState.currentPlayer !== 2 || !player2GridElement.classList.contains("clickable")) return;
    const cardElement = e.target.closest(".card");
    if (!cardElement) return;
    const row = parseInt(cardElement.getAttribute("data-row"));
    const col = parseInt(cardElement.getAttribute("data-col"));
    const cardData = player2GridCards[row][col];

    if (gameState.turnPhase === "decideDrawnCard" || gameState.turnPhase === "swapCard") {
        const oldValue = cardData.value;
        cardData.value = gameState.currentCard;
        cardData.revealed = true;
        discardPile.push(oldValue);
        updateDiscardPile();
        checkAndRemoveLines(player2GridCards);
        renderGrid(player2GridElement, player2GridCards);
        updateScore(2);
        resetTurn();
    } else if (gameState.turnPhase === "revealCard" && !cardData.revealed) {
        cardData.revealed = true;
        checkAndRemoveLines(player2GridCards);
        renderGrid(player2GridElement, player2GridCards);
        updateScore(2);
        resetTurn();
    }
});

playAgainButton.addEventListener("click", () => {
    endingScreenElement.classList.add("hidden");
    startGame();
});

// **Start the game**
function startGame() {
    initializeDeck();
    player1GridCards = dealGrid();
    player2GridCards = dealGrid();
    renderGrid(player1GridElement, player1GridCards);
    renderGrid(player2GridElement, player2GridCards);
    revealInitialCards(player1GridCards, player1GridElement);
    revealInitialCards(player2GridCards, player2GridElement);

    // Determine the starting player based on initial revealed cards
    const player1InitialScore = calculateRevealedScore(player1GridCards);
    const player2InitialScore = calculateRevealedScore(player2GridCards);
    let startingPlayer = (player1InitialScore > player2InitialScore) ? 1 :
                         (player2InitialScore > player1InitialScore) ? 2 : 1; // Player 1 starts if tied

    gameState = {
        turnPhase: "chooseAction",
        currentPlayer: startingPlayer,
        currentCard: null,
        finalTurnPlayer: null,
        gameEnding: false,
        startingPlayer: startingPlayer
    };

    updateScore(1);
    updateScore(2);
    updateTurnIndicator();
}

startGame();