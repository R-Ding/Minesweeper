/*
 * Starter Code for A2: Minesweeper
 * CS 11 JS Winter 2021
 */
(function () {
  "use strict";
  
  const FLAG_SYMBOL = "&#9873";
  const MINE_SYMBOL = "&#9881";

  let isGameOver = false;
  let moveCount = 0;

  window.addEventListener("load", init);

  /**
   * Initialization for new game on clicking startGame button.
   */
  function init() {
    id("play").addEventListener("click", startGame);
  }

  /**
   * Starts the game, building a grid with the selected dimensions.
   */
  function startGame() {
    let nrows = id("height").value;
    let ncols = id("width").value;
    let nmines = id("mines").value;    
    if (checkInputs(nrows, ncols, nmines)) {
      updateInputs(true);
      for (let i = 0; i < nrows; i++) {
        let rowEl = document.createElement("div");
        rowEl.classList.add("row");
        id("grid").appendChild(rowEl);
        for (let j = 0; j < ncols; j++) {
          let cellEl = initializeCell(i, j);
          rowEl.appendChild(cellEl);
        }
      }
    }
    // debugging
    randomlyAssignMines("1_2");
    let neighbors = calculateNeighborMineCounts("1_2");
  }

  /**
   * Validates user inputs to make sure they are valid values for a new game.
   * If inputs are invalid, shows a helpful message on the page.
   * 
   * @param {int} nrows 
   * @param {int} ncols 
   * @param {int} nmines 
   * @return {boolean} - false if inputs are invalid, otherwise true. 
   */
  function checkInputs(nrows, ncols, nmines) {
    if (nrows < 1 || ncols < 1) {
      showMessage("Values must be positive.");
      return false;
    }
    if (nmines >= (nrows * ncols)) {
      showMessage("Number of mines should be less than total number of cells.");
      return false;
    }
    return true;
  }

  /**
   * Create a cell for the given row and column position. Each
   * cell is assigned a unique id in the format <row>_<col> (e.g. 0_2 for a cell
   * in the first row and 3rd column, using 0-based indexing).
   * 
   * When a cell is left-clicked, the move is processed to determine whether
   * or not the cell was a mine, and whether the game is over.
   * 
   * When a cell is right-clicked, the cell's "flagged" state is toggled to
   * mark whether the player guesses that the cell is a mine. 
   * 
   * @param {int} row - row position for new cell
   * @param {int} col - column position for new cell
   * @return {Object} new cell DOM Object (div.cell)
   */
  function initializeCell(row, col) {
    let cell = document.createElement("div");
    cell.classList.add("cell");
    cell.id = row + '_' + col;

    cell.addEventListener('click', makeMove);
    cell.addEventListener('contextmenu', evt => {
      evt.preventDefault();
      flagCell(cell.id);
    });
    return cell;
  }

  /**
   * Assign mines after first cell is selected. This ensures that a player cannot
   * select a mine on their first move (an implementation requirement of the game).
   *
   * @param {str} firstID - ID of first cell clicked.
   */
  function randomlyAssignMines(firstID) {
    let nrows = id("height").value;
    let ncols = id("width").value;
    let nmines = id("mines").value;
    let numCells = nrows * ncols;
    let mines = [];
    let rc = firstID.split("_");
    let r = parseInt(rc[0]) + 1; 
    let c = parseInt(rc[1]) + 1; 
    let first = r * nrows + c;
    while(mines.length < nmines) {
      let m = randomInt(numCells - 1);
      if(mines.indexOf(m) === -1 && m != first) mines.push(m);
    }
    for (let i = 0; i < mines.length; i++) {
      let index = mines[i];
      let row = Math.floor(index / nrows);
      let col = index % ncols;
      let cell = id(row + "_" + col);
      cell.classList.add("mine");
    }
  }

  /**
   * Returns number of neighboring mines for cell with given id.
   * 
   * @param {str} cellId - id of cell to find neighbors for, in format: <row>_<col>
   * @return {str[]} - list of neighboring mine ids (at most 8 neighbors).
   */
  function calculateNeighborMineCounts(cellId) {
    let nbrMines = [];
    let nbrs = getNeighbors(cellId);
    for (let i = 0; i < nbrs.length; i++) {
      let cell = id(nbrs[i]);
      if (cell.classList.contains("mine") && !cell.classList.contains("opened")) {
        nbrMines.push(cell.id);
      }
    }
    return nbrMines;
  }

  /**
   * Processes a move on a cell.
   * 
   * If the cell was already opened, or the game is over, does nothing.
   * If the move is the first move played in the game, marks the cell
   * as opened and assigns initial mines for the game.
   * If the move otherwise causes the game to finish, updates game appropriately.
   * Otherwise, marks the cell as opened and updates neighbors.
   */
  function makeMove() {
    let cell = this;
    if (!cell.classList.contains("opened") && !isGameOver) {
      moveCount ++;
      checkGameOver(cell);
      if (!isGameOver) {
        displayNeighbors(cell);
      } else {
        removeHandlers();
      }
    }
  }
  /**
   * Removes event handlers for all cells.
   */
  function removeHandlers() {
    let cells = qsa(".cell");
    for (let i = 0; i < cells.length; i++) {
      let cell = cells[i];
      cell.removeEventListener("click", makeMove);
        cell.removeEventListener("contextmenu", evt => {
          evt.preventDefault();
          flagCell(cell.id);
        });
    }
  }

  /**
   * Updates cell to be "opened" if not already opened, and recursively opens all neighbors of cell
   * if given cell does not have neighboring mines. If the cell has neighboring mines,
   * displays the count of mine neighbors in the cell.
   * 
   * @param {Object} cell - DOM object of selected cell.
   */
  function displayNeighbors(cell) {
    cell.classList.add("opened");
    let numMines = calculateNeighborMineCounts(cell.id).length;
    if (numMines != 0) {
      cell.textContent = "" + numMines;
      return;
    } else {
      let nbrs = getNeighbors(cell.id);
      for (let i = 0; i < nbrs.length; i++) {
        setTimeout (() => { displayNeighbors(id(nbrs[i])); }, 200);
      }
    }
  }

  /**
   * Checks to see if the game is over after the given cell is selected. 
   * If the selected cell was a mine, the player loses.
   * If the selected cell was otherwise the last non-mine cell to be opened,
   * the player wins.
   * Otherwise, the game is not yet over.
   * 
   * @param {Object} cell - DOM object of selected cell.
   */
  function checkGameOver(cell) {
    if (cell.classList.contains('mine')) {
      isGameOver = true;
      cell.classList.add("opened");
      id("result").textContent = "Game Over! Total Moves: " + moveCount;
    }
    else if (gameWon()) {
      id("result").textContent = "Victory! Total moves: " + moveCount;
    }
  }

  /**
   * Returns true if the game is won (when all non-mine cells are opened on the board).
   * 
   * @return {boolean} - true if the game is won, otherwise false.
   */
  function gameWon() {
    let cells = qsa(".cell");
    for (let i = 0; i < cells.length; i++) {
      let cell = cells[i];
      if (!cell.classList.contains("opened")) {
        return false;
      }
    }
    return true;
  }

  /**
   * Toggles the flag state for this cell if the game is not over and the cell isn't 
   * opened already.
   * 
   * @param {str} id - ID of clicked cell.
   */
  function flagCell(cellId) {
    if (!isGameOver && !id(cellId).classList.contains("opened")) {
      id(cellId).classList.toggle("flagged");
    }
  }
  /* ------------------------------ Helper Functions ------------------------------ */
  /**
   * Get list of neighboring cell IDs, used for counting mines in neighboring cells
   *
   * @param {str} cellId ID of selected cell
   */
  function getNeighbors(cellId) {
    let ncols = id("width").value; // ncols = width, nrows = height
    let nrows = id("height").value;
    let cellRow = parseInt(cellId.split("_")[0])
    let cellCol = parseInt(cellId.split("_")[1])
    let neighborIds = []
    for (let row = Math.max(cellRow - 1, 0); row <= Math.min(cellRow + 1, nrows - 1); row++) {
      for (let col = Math.max(cellCol - 1, 0); col <= Math.min(cellCol + 1, ncols - 1); col++) {
        let neighborId = row + "_" + col;
        neighborIds.push(neighborId);
      }
    }
    return neighborIds;
  }

  /**
   * Returns a random int from [0, max].
   * @param {int} max - exclusive max value for random range.
   * @return {int} - random int from [0, max]
   */
  function randomInt(max) {
    // Math.floor causes upperbound to be exclusive
    return Math.floor(Math.random() * (max + 1));
  }

  /**
   * Updates the inputs for game options. If disable is true, disables them
   * for a new game. Otherwise re-enables them for a user to provide new values
   * for a new game.
   * 
   * @param {boolean} disable - whether to disable the inputs and play button.
   */
  function updateInputs(disable) {
    id("width").disabled = disable;
    id("height").disabled = disable;
    id("mines").disabled = disable;
    id("play").disabled = disable;
  }

  /**
   * Show message in result paragraph element on main page
   * @param {string} msg input message
   */
  function showMessage(msg) {
    id("result").textContent = msg;
  }

  /**
   * Returns the element that has the ID attribute with the specified value.
   * @param {string} idName - element ID
   * @returns {object} DOM object associated with id.
   */
  function id(idName) {
    return document.getElementById(idName);
  }

  /**
   * Returns the first element that matches the given CSS selector.
   * @param {string} query - CSS query selector.
   * @returns {object[]} array of DOM objects matching the query.
   */
  function qs(query) {
    return document.querySelector(query);
  }

  /**
   * Returns the array of elements that match the given CSS selector.
   * @param {string} query - CSS query selector
   * @returns {object[]} array of DOM objects matching the query.
   */
  function qsa(query) {
    return document.querySelectorAll(query);
  }
})();
