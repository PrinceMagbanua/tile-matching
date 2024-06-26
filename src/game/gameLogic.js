// gameLogic.js
function cloneTiles(tiles) {
  return tiles.map(row =>
    row.map(tile => ({
      type: tile.getData('type'),
      row: tile.getData('row'),
      col: tile.getData('col'),
      sprite: tile // Reference to the original Phaser sprite
    }))
  );
}
function checkForPossibleMatches(_tiles) {
  const tiles = cloneTiles(_tiles);
  const rows = tiles.length;
  const cols = tiles[0].length;
  let movesAvailable = false;

  const tempSwapTiles = (tile1, tile2) => {
    const row1 = tile1.row;
    const col1 = tile1.col;
    const row2 = tile2.row;
    const col2 = tile2.col;

    [tiles[row1][col1], tiles[row2][col2]] = [tiles[row2][col2], tiles[row1][col1]];

    tiles[row1][col1].row = row1;
    tiles[row1][col1].col = col1;
    tiles[row2][col2].row = row2;
    tiles[row2][col2].col = col2;
  };

  const revertTempChanges = (tile1, tile2) => {
    tempSwapTiles(tile1, tile2);
  };

  const checkMatchesWithoutVisualUpdate = (tile1, tile2) => {
    tempSwapTiles(tile1, tile2);
    const { ungrouped: matches } = getUniqueMatches(tiles, false);
    revertTempChanges(tile1, tile2);
    if (matches.length > 0) {
      movesAvailable = matches.map(match => match.sprite);
    }
  };

  for (let row = 0; row < rows && !movesAvailable; row++) {
    for (let col = 0; col < cols && !movesAvailable; col++) {
      if (col < cols - 1 && !movesAvailable) {
        checkMatchesWithoutVisualUpdate(tiles[row][col], tiles[row][col + 1]);
      }
      if (col > 0 && !movesAvailable) {
        checkMatchesWithoutVisualUpdate(tiles[row][col], tiles[row][col - 1]);
      }
      if (row < rows - 1 && !movesAvailable) {
        checkMatchesWithoutVisualUpdate(tiles[row][col], tiles[row + 1][col]);
      }
      if (row > 0 && !movesAvailable) {
        checkMatchesWithoutVisualUpdate(tiles[row][col], tiles[row - 1][col]);
      }
    }
  }
  return movesAvailable;
}
// gameLogic.js

function getUniqueMatches(tiles, isSprite = true) {
  const rows = tiles.length;
  const cols = tiles[0].length;
  const matchedTiles = new Set(); // Track unique tiles
  let longestMatch = []; // Track the longest match found
  const matches = []; // Track unique match groups

  const getTileType = (tile) => {
    return isSprite ? tile.getData('type') : tile.type;
  };

  const findMatchesInDirection = (startRow, startCol, rowIncrement, colIncrement) => {
    const matchesFound = [];
    let currentRow = startRow;
    let currentCol = startCol;
    let matchLength = 1;

    while (currentRow >= 0 && currentRow < rows && currentCol >= 0 && currentCol < cols) {
      const currentTile = tiles[currentRow][currentCol];
      const nextRow = currentRow + rowIncrement;
      const nextCol = currentCol + colIncrement;

      if (
        nextRow < 0 ||
        nextRow >= rows ||
        nextCol < 0 ||
        nextCol >= cols ||
        getTileType(currentTile) !== getTileType(tiles[nextRow][nextCol])
      ) {
        if (matchLength >= 3) {
          const matchGroup = [];
          for (let i = 0; i < matchLength; i++) {
            const matchedTile = tiles[currentRow - i * rowIncrement][currentCol - i * colIncrement];
            matchGroup.push(matchedTile);
            matchedTiles.add(matchedTile); // Add each tile to the Set
          }

          // Check if this match group is longer than the current longest match
          if (matchGroup.length > longestMatch.length) {
            longestMatch = matchGroup; // Update the longest match found
          }
        }
        matchLength = 1;
      } else {
        matchLength++;
        const matchedTile = tiles[currentRow][currentCol];
        if (matchLength === 3) {
          matchedTiles.add(matchedTile); // Add the first tile of the match to the Set
        }
      }

      currentRow = nextRow;
      currentCol = nextCol;
    }

    return matchesFound;
  };

  // Iterate over each tile to find matches in both horizontal and vertical directions
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (col < cols - 2) {
        const horizontalMatches = findMatchesInDirection(row, col, 0, 1);
        if (horizontalMatches.length > 0) {
          matches.push(...horizontalMatches); // Spread the matches into the main matches array
        }
      }
      if (row < rows - 2) {
        const verticalMatches = findMatchesInDirection(row, col, 1, 0);
        if (verticalMatches.length > 0) {
          matches.push(...verticalMatches); // Spread the matches into the main matches array
        }
      }
    }
  }

  // Check if there is a longest match found and replace matches with only the longest one
  if (longestMatch.length > 0) {
    return { grouped: [longestMatch], ungrouped: [...matchedTiles] };
  } else {
    return { grouped: [], ungrouped: [...matchedTiles] };
  }
}




async function checkPossibleMoves(_tiles, signal) {
  if (signal.aborted) return;

  const hasMoves = checkForPossibleMatches(_tiles);

  if (signal.aborted) return;
  
  return hasMoves;
}

// Export the functions to be used in other files
export default {
  checkPossibleMoves,
  getUniqueMatches
};
