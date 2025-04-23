const IMAGE_PATH = "Cards/";
const drawPileElement = document.getElementById("draw-pile");
const discardPileElement = document.getElementById("discard-pile");
const currentCardElement = document.getElementById("current-card");
const player1GridElement = document.querySelector(".player1-grid");
const player2GridElement = document.querySelector(".player2-grid");
const player1ScoreElement = document.querySelector(".player1-score");
const player2ScoreElement = document.querySelector(".player2-score");
const turnIndicatorElement = document.getElementById("turn-indicator");
const actionPromptElement = document.getElementById("action-prompt");
const endingScreenElement = document.getElementById("ending-screen");
const playAgainButton = document.getElementById("play-again");
const newGameButton = document.getElementById("new-game-btn");
const rulesButton = document.getElementById("rules-btn");
const rulesModal = document.getElementById("rules-modal");
const closeRulesButton = document.querySelector(".close");
const aiModeCheckbox = document.getElementById("ai-mode");

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
    currentPlayer: 1,
    currentCard: null,
    finalTurnPlayer: null,
    gameEnding: false,
    startingPlayer: null,
    isAIMode: false,
    cardAnimationInProgress: false
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
    if (!card.revealed) cardElement.classList.add("unrevealed");
    
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
    gridElement.style.gridTemplateColumns = `repeat(${numCols}, 80px)`;
    
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
        const key = `${row}-${col}`;
        
        // Check if this card has already been selected
        if (!indicesToReveal.some(idx => idx.row === row && idx.col === col)) {
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
        : "<div class='card empty'></div>";
}

// **Update a player's score and hidden card count**
function updateScore(player) {
    const gridCards = player === 1 ? player1GridCards : player2GridCards;
    const score = calculateRevealedScore(gridCards);
    
    // Update score display
    (player === 1 ? player1ScoreElement : player2ScoreElement).textContent = score;
    
    // Update hidden card count
    const hiddenCount = gridCards.flat().filter(card => !card.revealed).length;
    document.querySelector(`.player${player} .hidden-count`).textContent = 
        `${hiddenCount} carte${hiddenCount > 1 ? 's' : ''} cachée${hiddenCount > 1 ? 's' : ''}`;
}

// **Update the turn indicator**
function updateTurnIndicator() {
    turnIndicatorElement.textContent = `Tour du joueur ${gameState.currentPlayer}`;
    
    // Add visual indication of active player
    document.querySelector(".player1").classList.toggle("active-player", gameState.currentPlayer === 1);
    document.querySelector(".player2").classList.toggle("active-player", gameState.currentPlayer === 2);
}

// **Update the action prompt**
function updateActionPrompt() {
    let message = "";
    switch(gameState.turnPhase) {
        case "chooseAction":
            message = "Choisissez : piocher une carte ou prendre la défausse";
            break;
        case "decideDrawnCard":
            message = "Double-cliquez pour défausser ou cliquez sur une carte pour l'échanger";
            break;
        case "swapCard":
            message = "Cliquez sur une de vos cartes pour l'échanger";
            break;
        case "revealCard":
            message = "Cliquez sur une carte non révélée pour la retourner";
            break;
    }
    actionPromptElement.textContent = message;
}

// **Hide draw pile if empty**
function checkDrawPile() {
    if (drawPile.length === 0) {
        drawPileElement.style.opacity = "0.3";
        drawPileElement.style.cursor = "not-allowed";
    } else {
        drawPileElement.style.opacity = "1";
        drawPileElement.style.cursor = "pointer";
    }
}

// **Add cards from removed lines to discard pile**
function addCardsToDiscardPile(cards) {
    cards.forEach(card => {
        if (card.revealed) {
            discardPile.push(card.value);
        }
    });
    updateDiscardPile();
}

// **Check and remove columns or rows with all identical revealed cards**
function checkAndRemoveLines(gridCards) {
    let removedCards = [];
    
    // Check columns
    if (gridCards.length === 3) {
        const numCols = gridCards[0].length;
        const columnsToRemove = [];
        
        for (let c = 0; c < numCols; c++) {
            const column = [];
            for (let r = 0; r < 3; r++) {
                column.push(gridCards[r][c]);
            }
            
            // Check if all cards in column are revealed and have same value
            if (column.every(card => card.revealed) && 
                column.every(card => card.value === column[0].value)) {
                columnsToRemove.push(c);
                removedCards = removedCards.concat(column);
            }
        }
        
        // Remove columns in reverse order to maintain indices
        columnsToRemove.sort((a, b) => b - a);
        columnsToRemove.forEach(c => {
            gridCards.forEach(row => row.splice(c, 1));
        });
    }

    // Check rows
    const numColsAfter = gridCards[0] ? gridCards[0].length : 0;
    if (numColsAfter === 4) {
        const rowsToRemove = [];
        
        gridCards.forEach((row, r) => {
            if (row.length === 4 && 
                row.every(card => card.revealed) && 
                row.every(card => card.value === row[0].value)) {
                rowsToRemove.push(r);
                removedCards = removedCards.concat(row);
            }
        });
        
        // Remove rows in reverse order
        rowsToRemove.sort((a, b) => b - a);
        rowsToRemove.forEach(r => {
            gridCards.splice(r, 1);
        });
    }
    
    // Add removed cards to discard pile
    addCardsToDiscardPile(removedCards);
    
    return removedCards.length > 0;
}

// **Check if all cards are revealed for a player**
function allCardsRevealed(gridCards) {
    return gridCards.length === 0 || gridCards.flat().every(card => card.revealed);
}

// **Reset the turn and handle endgame logic**
function resetTurn() {
    if (gameState.gameEnding) {
        endGame();
        return;
    }

    const currentGrid = gameState.currentPlayer === 1 ? player1GridCards : player2GridCards;
    
    if (allCardsRevealed(currentGrid)) {
        if (gameState.finalTurnPlayer === null) {
            // First player to reveal all cards
            gameState.finalTurnPlayer = gameState.currentPlayer;
            gameState.gameEnding = true;
        } else {
            // Second player also revealed all cards
            endGame();
            return;
        }
    }

    // Switch player and reset turn phase
    gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
    gameState.turnPhase = "chooseAction";
    gameState.currentCard = null;
    currentCardElement.innerHTML = "";
    
    // Update UI
    player1GridElement.classList.remove("clickable");
    player2GridElement.classList.remove("clickable");
    checkDrawPile();
    updateTurnIndicator();
    updateActionPrompt();
    saveGameState();
    
    // AI move if needed
    if (gameState.isAIMode && gameState.currentPlayer === 2) {
        setTimeout(makeAIMove, 1000);
    }
}

// **End the game and calculate final scores**
function endGame() {
    // Reveal all remaining unrevealed cards
    [player1GridCards, player2GridCards].forEach(grid => {
        grid.forEach(row => {
            row.forEach(card => {
                card.revealed = true;
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

    const winnerText = player1Score < player2Score ? "Le joueur 1 gagne!" : 
                      player2Score < player1Score ? "Le joueur 2 gagne!" : 
                      "Match nul!";
    document.getElementById("winner-text").textContent = winnerText;

    endingScreenElement.classList.remove("hidden");
    localStorage.removeItem('skyjoGameState'); // Clear saved game
}

// **Make AI move**
function makeAIMove() {
    if (gameState.currentPlayer !== 2 || !gameState.isAIMode) return;
    
    setTimeout(() => {
        // Decision: take discard pile or draw new card
        const topDiscardValue = discardPile.length > 0 ? discardPile[discardPile.length - 1] : null;
        
        // Strategy: Take from discard if value is low (good in Skyjo)
        if (topDiscardValue !== null && topDiscardValue <= 4 && Math.random() > 0.2) {
            discardPileElement.click();
            setTimeout(makeAICardSelection, 800);
        } else {
            drawPileElement.click();
            setTimeout(handleAIDrawnCard, 800);
        }
    }, 1000);
}

// **Handle AI decision after drawing a card**
function handleAIDrawnCard() {
    if (!gameState.currentCard) return;
    
    // If drawn card is good (low value), replace a high value or unrevealed card
    const drawnValue = gameState.currentCard;
    const flatGrid = player2GridCards.flat();
    const unrevealedCards = flatGrid.filter(card => !card.revealed);
    const revealedCards = flatGrid.filter(card => card.revealed);
    
    // Always keep cards <= 2 if possible
    if (drawnValue <= 2) {
        // Find the highest value card to replace
        let highestCard = null;
        let highestValue = -Infinity;
        let cardRow = 0;
        let cardCol = 0;
        
        player2GridCards.forEach((row, r) => {
            row.forEach((card, c) => {
                if (card.revealed && card.value > highestValue) {
                    highestValue = card.value;
                    highestCard = card;
                    cardRow = r;
                    cardCol = c;
                }
            });
        });
        
        // If we found a card with higher value than the drawn card
        if (highestCard && highestValue > drawnValue) {
            // Simulate clicking on the card
            const cardElements = player2GridElement.querySelectorAll('.card');
            const targetCard = Array.from(cardElements).find(el => 
                parseInt(el.dataset.row) === cardRow && parseInt(el.dataset.col) === cardCol
            );
            if (targetCard) {
                setTimeout(() => targetCard.click(), 500);
                return;
            }
        }
    }
    
    // If the drawn card is bad (high value) or we didn't find a higher card to replace
    // Discard it and reveal a random unrevealed card
    setTimeout(() => {
        currentCardElement.dispatchEvent(new MouseEvent('dblclick'));
        
        // After discarding, select a random unrevealed card to reveal
        setTimeout(() => {
            if (unrevealedCards.length > 0) {
                // Find a random unrevealed card position
                let found = false;
                let attempts = 0;
                
                while (!found && attempts < 20) {
                    const randomRow = Math.floor(Math.random() * player2GridCards.length);
                    const randomCol = Math.floor(Math.random() * player2GridCards[0].length);
                    
                    if (!player2GridCards[randomRow][randomCol].revealed) {
// If we found an unrevealed card, simulate clicking it
const cardElements = player2GridElement.querySelectorAll('.card');
const targetCard = Array.from(cardElements).find(el => 
    parseInt(el.dataset.row) === randomRow && parseInt(el.dataset.col) === randomCol
);

if (targetCard) {
    setTimeout(() => targetCard.click(), 500);
    found = true;
}
}
attempts++;
}
}
}, 800);
}, 800);
}

// **Handle AI card selection when taking from discard pile**
function makeAICardSelection() {
if (!gameState.currentCard) return;

const discardValue = gameState.currentCard;
let bestRow = -1;
let bestCol = -1;
let bestDifference = -Infinity;

// Find the card with the highest difference compared to the discard value
player2GridCards.forEach((row, r) => {
row.forEach((card, c) => {
// Prefer revealed high cards or unrevealed cards
if (card.revealed) {
const difference = card.value - discardValue;
if (difference > bestDifference) {
bestDifference = difference;
bestRow = r;
bestCol = c;
}
} else if (bestRow === -1) {
// Fallback to an unrevealed card if no good revealed card is found
bestRow = r;
bestCol = c;
}
});
});

// Simulate clicking the selected card
if (bestRow !== -1 && bestCol !== -1) {
const cardElements = player2GridElement.querySelectorAll('.card');
const targetCard = Array.from(cardElements).find(el => 
parseInt(el.dataset.row) === bestRow && parseInt(el.dataset.col) === bestCol
);

if (targetCard) {
setTimeout(() => targetCard.click(), 500);
}
}
}

// **Save game state to local storage**
function saveGameState() {
const state = {
drawPile,
discardPile,
player1GridCards,
player2GridCards,
gameState
};
localStorage.setItem('skyjoGameState', JSON.stringify(state));
}

// **Load game state from local storage**
function loadGameState() {
const savedState = localStorage.getItem('skyjoGameState');
if (savedState) {
try {
const state = JSON.parse(savedState);
drawPile = state.drawPile;
discardPile = state.discardPile;
player1GridCards = state.player1GridCards;
player2GridCards = state.player2GridCards;
gameState = state.gameState;

renderGrid(player1GridElement, player1GridCards);
renderGrid(player2GridElement, player2GridCards);
updateDiscardPile();
updateScore(1);
updateScore(2);
updateTurnIndicator();
updateActionPrompt();

// Update AI mode checkbox
aiModeCheckbox.checked = gameState.isAIMode;

// If it's AI's turn, schedule move
if (gameState.isAIMode && gameState.currentPlayer === 2) {
setTimeout(makeAIMove, 1500);
}

return true;
} catch (e) {
console.error("Error loading saved game:", e);
return false;
}
}
return false;
}

// **Add animation when a card is flipped**
function animateCardFlip(cardElement, newValue, isRevealing = true) {
gameState.cardAnimationInProgress = true;

cardElement.classList.add("flipping");

setTimeout(() => {
// Change the card image at the midpoint of the animation
const img = cardElement.querySelector(".card-image");
img.src = isRevealing ? 
`${IMAGE_PATH}card_${newValue}.png` : 
`${IMAGE_PATH}card_back.png`;
img.alt = isRevealing ? `Card ${newValue}` : "Card Back";
}, 300); // Half of the animation duration

setTimeout(() => {
cardElement.classList.remove("flipping");
gameState.cardAnimationInProgress = false;
}, 600);
}

// **Event Listeners**
drawPileElement.addEventListener("click", () => {
if (gameState.turnPhase !== "chooseAction" || drawPile.length === 0 || gameState.cardAnimationInProgress) return;

const drawnValue = drawPile.pop();
gameState.currentCard = drawnValue;
gameState.turnPhase = "decideDrawnCard";

// Update UI
currentCardElement.innerHTML = `<div class="card"><img class="card-image" src="${IMAGE_PATH}card_${drawnValue}.png" alt="Card ${drawnValue}"></div>`;
(gameState.currentPlayer === 1 ? player1GridElement : player2GridElement).classList.add("clickable");
checkDrawPile();
updateActionPrompt();
});

discardPileElement.addEventListener("click", () => {
if (gameState.turnPhase !== "chooseAction" || discardPile.length === 0 || gameState.cardAnimationInProgress) return;

gameState.currentCard = discardPile.pop();
gameState.turnPhase = "swapCard";

// Update UI
updateDiscardPile();
currentCardElement.innerHTML = `<div class="card"><img class="card-image" src="${IMAGE_PATH}card_${gameState.currentCard}.png" alt="Card ${gameState.currentCard}"></div>`;
(gameState.currentPlayer === 1 ? player1GridElement : player2GridElement).classList.add("clickable");
updateActionPrompt();
});

currentCardElement.addEventListener("dblclick", () => {
if (gameState.turnPhase !== "decideDrawnCard" || gameState.currentCard === null || gameState.cardAnimationInProgress) return;

discardPile.push(gameState.currentCard);
updateDiscardPile();
gameState.turnPhase = "revealCard";
currentCardElement.innerHTML = "";
(gameState.currentPlayer === 1 ? player1GridElement : player2GridElement).classList.add("clickable");
updateActionPrompt();
});

player1GridElement.addEventListener("click", (e) => {
if (gameState.currentPlayer !== 1 || !player1GridElement.classList.contains("clickable") || gameState.cardAnimationInProgress) return;

const cardElement = e.target.closest(".card");
if (!cardElement) return;

const row = parseInt(cardElement.getAttribute("data-row"));
const col = parseInt(cardElement.getAttribute("data-col"));
const cardData = player1GridCards[row][col];

if (gameState.turnPhase === "decideDrawnCard" || gameState.turnPhase === "swapCard") {
const oldValue = cardData.value;
cardData.value = gameState.currentCard;
cardData.revealed = true;

// Animate card flip
animateCardFlip(cardElement, gameState.currentCard);

discardPile.push(oldValue);
updateDiscardPile();

// Check for identical rows/columns after a short delay
setTimeout(() => {
const linesRemoved = checkAndRemoveLines(player1GridCards);
renderGrid(player1GridElement, player1GridCards);
updateScore(1);

if (linesRemoved) {
// Add small delay to visually process the line removal
setTimeout(() => resetTurn(), 800);
} else {
resetTurn();
}
}, 700);
} else if (gameState.turnPhase === "revealCard" && !cardData.revealed) {
cardData.revealed = true;

// Animate card flip
animateCardFlip(cardElement, cardData.value);

// Check for identical rows/columns after animation completes
setTimeout(() => {
const linesRemoved = checkAndRemoveLines(player1GridCards);
renderGrid(player1GridElement, player1GridCards);
updateScore(1);

if (linesRemoved) {
// Add small delay to visually process the line removal
setTimeout(() => resetTurn(), 800);
} else {
resetTurn();
}
}, 700);
}
});

player2GridElement.addEventListener("click", (e) => {
if (gameState.currentPlayer !== 2 || !player2GridElement.classList.contains("clickable") || gameState.cardAnimationInProgress) return;

const cardElement = e.target.closest(".card");
if (!cardElement) return;

const row = parseInt(cardElement.getAttribute("data-row"));
const col = parseInt(cardElement.getAttribute("data-col"));
const cardData = player2GridCards[row][col];

if (gameState.turnPhase === "decideDrawnCard" || gameState.turnPhase === "swapCard") {
const oldValue = cardData.value;
cardData.value = gameState.currentCard;
cardData.revealed = true;

// Animate card flip
animateCardFlip(cardElement, gameState.currentCard);

discardPile.push(oldValue);
updateDiscardPile();

// Check for identical rows/columns after a short delay
setTimeout(() => {
const linesRemoved = checkAndRemoveLines(player2GridCards);
renderGrid(player2GridElement, player2GridCards);
updateScore(2);

if (linesRemoved) {
// Add small delay to visually process the line removal
setTimeout(() => resetTurn(), 800);
} else {
resetTurn();
}
}, 700);
} else if (gameState.turnPhase === "revealCard" && !cardData.revealed) {
cardData.revealed = true;

// Animate card flip
animateCardFlip(cardElement, cardData.value);

// Check for identical rows/columns after animation completes
setTimeout(() => {
const linesRemoved = checkAndRemoveLines(player2GridCards);
renderGrid(player2GridElement, player2GridCards);
updateScore(2);

if (linesRemoved) {
// Add small delay to visually process the line removal
setTimeout(() => resetTurn(), 800);
} else {
resetTurn();
}
}, 700);
}
});

playAgainButton.addEventListener("click", () => {
endingScreenElement.classList.add("hidden");
startGame();
});

newGameButton.addEventListener("click", () => {
if (confirm("Voulez-vous vraiment commencer une nouvelle partie ?")) {
localStorage.removeItem('skyjoGameState');
startGame();
}
});

rulesButton.addEventListener("click", () => {
rulesModal.style.display = "flex";
});

closeRulesButton.addEventListener("click", () => {
rulesModal.style.display = "none";
});

// Close modal when clicking outside of it
window.addEventListener("click", (e) => {
if (e.target === rulesModal) {
rulesModal.style.display = "none";
}
});

// AI mode toggle
aiModeCheckbox.addEventListener("change", () => {
gameState.isAIMode = aiModeCheckbox.checked;
saveGameState();

// If switching to AI mode and it's already player 2's turn, start AI move
if (gameState.isAIMode && gameState.currentPlayer === 2) {
setTimeout(makeAIMove, 1000);
}
});

// **Start the game**
function startGame() {
// Reset game state
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
 (player2InitialScore > player1InitialScore) ? 2 : 
 Math.floor(Math.random() * 2) + 1; // Random start if tied

gameState = {
turnPhase: "chooseAction",
currentPlayer: startingPlayer,
currentCard: null,
finalTurnPlayer: null,
gameEnding: false,
startingPlayer: startingPlayer,
isAIMode: aiModeCheckbox.checked,
cardAnimationInProgress: false
};

// Update UI
updateScore(1);
updateScore(2);
updateTurnIndicator();
updateActionPrompt();
checkDrawPile();
saveGameState();

// Start AI move if applicable
if (gameState.isAIMode && gameState.currentPlayer === 2) {
setTimeout(makeAIMove, 1500);
}
}

// **Initialize game**
document.addEventListener("DOMContentLoaded", () => {
// Try to load saved game first
if (!loadGameState()) {
startGame();
}
});

// Prevent accidental navigation away from the game
window.addEventListener("beforeunload", (e) => {
// Save current game state before unloading
saveGameState();

// If game is in progress, show confirmation dialog
if (!endingScreenElement.classList.contains("hidden") && 
(player1GridCards.flat().some(card => !card.revealed) || 
player2GridCards.flat().some(card => !card.revealed))) {
e.preventDefault();
e.returnValue = "";
return "";
}
});