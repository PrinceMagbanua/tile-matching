// gameLogic.js
import cloneDeep from 'lodash/cloneDeep'

// Function to check for available moves
function checkForAvailableMoves(_tiles) {
  const tiles = cloneDeep(_tiles)
  const rows = tiles.length
  const cols = tiles[0].length
  let movesAvailable = false

  // Function to temporarily swap tiles for checking
  const tempSwapTiles = (tile1, tile2) => {
    const row1 = tile1.getData('row')
    const col1 = tile1.getData('col')
    const row2 = tile2.getData('row')
    const col2 = tile2.getData('col')

    // Swap tile data temporarily
    tiles[row1][col1] = tile2
    tiles[row2][col2] = tile1

    tile1.setData('row', row2)
    tile1.setData('col', col2)
    tile2.setData('row', row1)
    tile2.setData('col', col1)
  }

  // Function to revert temporary changes
  const revertTempChanges = (tile1, tile2) => {
    const row1 = tile1.getData('row')
    const col1 = tile1.getData('col')
    const row2 = tile2.getData('row')
    const col2 = tile2.getData('col')

    // Revert tile data
    tiles[row1][col1] = tile1
    tiles[row2][col2] = tile2

    tile1.setData('row', row1)
    tile1.setData('col', col1)
    tile2.setData('row', row2)
    tile2.setData('col', col2)
  }

  // Function to check for matches without visually updating
  const checkMatchesWithoutVisualUpdate = (tile1, tile2) => {
    const row1 = tile1.getData('row')
    const col1 = tile1.getData('col')
    const row2 = tile2.getData('row')
    const col2 = tile2.getData('col')

    // Temporarily swap tiles
    tempSwapTiles(tile1, tile2)

    // Check for matches
    const matches = getUniqueMatches(tiles)

    // Revert temporary changes
    revertTempChanges(tile1, tile2)

    // If matches are found, moves are available
    if (matches.length > 0) {
      movesAvailable = true
    }
  }

  // Iterate through all tiles and check potential moves
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      // Check right neighbor
      if (col < cols - 1) {
        checkMatchesWithoutVisualUpdate(tiles[row][col], tiles[row][col + 1])
      }

      // Check left neighbor
      if (col > 0) {
        checkMatchesWithoutVisualUpdate(tiles[row][col], tiles[row][col - 1])
      }

      // Check lower neighbor
      if (row < rows - 1) {
        checkMatchesWithoutVisualUpdate(tiles[row][col], tiles[row + 1][col])
      }

      // Check upper neighbor
      if (row > 0) {
        checkMatchesWithoutVisualUpdate(tiles[row][col], tiles[row - 1][col])
      }
    }
  }

  // After checking all possibilities, return whether moves are available
  return movesAvailable
}

function getUniqueMatches(tiles) {
  // const tiles = cloneDeep(tiles)
  const rows = tiles.length
  const cols = tiles[0].length
  const matches = []

  // Function to find matches in a given direction
  const findMatchesInDirection = (startRow, startCol, rowIncrement, colIncrement) => {
    const matchesFound = []
    let currentRow = startRow
    let currentCol = startCol
    let matchLength = 1

    while (currentRow >= 0 && currentRow < rows && currentCol >= 0 && currentCol < cols) {
      const currentTile = tiles[currentRow][currentCol]
      const nextRow = currentRow + rowIncrement
      const nextCol = currentCol + colIncrement

      if (
        nextRow < 0 ||
        nextRow >= rows ||
        nextCol < 0 ||
        nextCol >= cols ||
        currentTile.getData('type') !== tiles[nextRow][nextCol].getData('type')
      ) {
        if (matchLength >= 3) {
          for (let i = 0; i < matchLength; i++) {
            matchesFound.push(tiles[currentRow - i * rowIncrement][currentCol - i * colIncrement])
          }
        }
        matchLength = 1
      } else {
        matchLength++
      }

      currentRow = nextRow
      currentCol = nextCol
    }

    return matchesFound
  }

  // Check for horizontal and vertical matches
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      // Horizontal match check
      if (col < cols - 2) {
        const horizontalMatches = findMatchesInDirection(row, col, 0, 1)
        if (horizontalMatches.length > 0) {
          matches.push(...horizontalMatches)
        }
      }

      // Vertical match check
      if (row < rows - 2) {
        const verticalMatches = findMatchesInDirection(row, col, 1, 0)
        if (verticalMatches.length > 0) {
          matches.push(...verticalMatches)
        }
      }
    }
  }

  // Remove duplicate matches
  const uniqueMatches = [...new Set(matches)]

  return uniqueMatches
}
// Export the function to be used in other files
export default {
  checkForAvailableMoves,
  getUniqueMatches
}
