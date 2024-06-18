class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene')
  }

  preload() {
    this.load.spritesheet('tiles', 'assets/spritesheet.png', { frameWidth: 64, frameHeight: 64 })
    this.load.image('selectedTile', 'assets/selectedTileFrame.png')
  }

  create() {
    const rows = 8;
    const cols = 8;
    const tileSize = 64;
    const numTypes = 6;
  
    this.tiles = [];
    this.selectedTile = null;
    this.score = 0;
  
    // Adjust the position of the score text
    this.scoreText = this.add
      .text(10, 10, 'Score: 0', { fontSize: '32px', fill: '#fff' })
      .setDepth(1);
  
    // Adjust the game container to have a space for the score
    this.gameContainer = this.add.container(0, 50); // Adding some padding for the score
  
    for (let row = 0; row < rows; row++) {
      this.tiles[row] = [];
      for (let col = 0; col < cols; col++) {
        const type = Phaser.Math.Between(0, numTypes - 1);
        const tile = this.add.sprite(col * tileSize, row * tileSize, 'tiles', type).setOrigin(0);
        tile.setData('type', type);
        tile.setData('row', row);
        tile.setData('col', col);
        tile.setInteractive();
        this.input.setDraggable(tile);
        this.tiles[row][col] = tile;
        this.gameContainer.add(tile); // Add tile to the container
      }
    }
    
   // Create the selected tile indicator, initially hidden
   this.selectedTileIndicator = this.add.image(0, 0, 'selectedTile').setOrigin(0).setVisible(false);
   this.gameContainer.add(this.selectedTileIndicator);
  
    this.countdownAnimation(() => {
      this.checkMatches();
    });
  
    this.input.on('dragstart', (pointer, tile) => {
      tile.startX = tile.x; // Store initial position
      tile.startY = tile.y; // Store initial position
      this.selectedTileIndicator.setPosition(tile.x, tile.y).setVisible(true);
    });
  
    this.input.on('dragend', (pointer, tile) => {
      this.selectedTileIndicator.setVisible(false);
      const dragThreshold = 32;
      const deltaX = pointer.upX - pointer.downX;
      const deltaY = pointer.upY - pointer.downY;
  
      if (Math.abs(deltaX) > dragThreshold || Math.abs(deltaY) > dragThreshold) {
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          // Horizontal drag
          if (deltaX > dragThreshold) {
            this.handleSwipe(tile, 'right');
          } else if (deltaX < -dragThreshold) {
            this.handleSwipe(tile, 'left');
          }
        } else {
          // Vertical drag
          if (deltaY > dragThreshold) {
            this.handleSwipe(tile, 'down');
          } else if (deltaY < -dragThreshold) {
            this.handleSwipe(tile, 'up');
          }
        }
      } else {
        // If not dragged enough, treat as a click
        this.selectTile(tile);
      }
  
    });
  }

  countdownAnimation(callback) {
     // Countdown text
     const countdownText = this.add.text(this.sys.game.config.width / 2, this.sys.game.config.height / 2, 'Ready!', {
        fontSize: '64px',
        fill: '#fff',
        align: 'center'
    }).setOrigin(0.5).setDepth(1);

    // Countdown animation
    const countdownPhases = ['Ready!', 'Game', 'Start!']
    let countdownPhaseIndex = 0

    const animateCountdown = () => {
      countdownText.setText(countdownPhases[countdownPhaseIndex])
      this.tweens.add({
        targets: countdownText,
        scaleX: 1.5,
        scaleY: 1.5,
        duration: 800,
        ease: countdownPhaseIndex === countdownPhases.length ? 'linear' : 'Power2',
        yoyo: true,
        repeat: 0,
        onComplete: () => {
          countdownPhaseIndex++
          if (countdownPhaseIndex < countdownPhases.length) {
            animateCountdown()
          } else {
            countdownText.destroy()
            callback()
          }
        }
      })
    }
    animateCountdown()
  }

  selectTile(tile) {
    if (this.selectedTile) {
      if (this.selectedTile === tile) {
        this.selectedTile = null; // Deselect the tile if the same tile is clicked again
        this.selectedTileIndicator.setVisible(false); // Hide the indicator
        return;
      }
      if (this.areAdjacent(this.selectedTile, tile)) {
        this.swapTiles(this.selectedTile, tile);
      }
      this.selectedTile = null;
      this.selectedTileIndicator.setVisible(false); // Hide the indicator after swapping
    } else {
      this.selectedTile = tile;
      // Position and show the indicator
      this.selectedTileIndicator.setPosition(tile.x, tile.y).setVisible(true);
    }
  }
  
  // Checks if two tiles are adjacent to each other
  areAdjacent(tile1, tile2) {
    const row1 = tile1.getData('row')
    const col1 = tile1.getData('col')
    const row2 = tile2.getData('row')
    const col2 = tile2.getData('col')

    const isAdjacent =
      (row1 === row2 && Math.abs(col1 - col2) === 1) ||
      (col1 === col2 && Math.abs(row1 - row2) === 1)

    return isAdjacent
  }

  swapTiles(tile1, tile2, revert) {
    const row1 = tile1.getData('row')
    const col1 = tile1.getData('col')
    const row2 = tile2.getData('row')
    const col2 = tile2.getData('col')

    // Swap the data
    tile1.setData('row', row2)
    tile1.setData('col', col2)
    tile2.setData('row', row1)
    tile2.setData('col', col1)

    // Swap the positions in the grid
    this.tiles[row1][col1] = tile2
    this.tiles[row2][col2] = tile1

    // Animate the swap simultaneously
    this.tweens.add({
      targets: [tile1, tile2],
      x: function (target) {
        return target === tile1 ? col2 * 64 : col1 * 64
      },
      y: function (target) {
        return target === tile1 ? row2 * 64 : row1 * 64
      },
      duration: 200,
      onComplete: () => {
        if (!revert) this.checkMatches(tile1, tile2)
      }
    })
  }
  checkMatches(movedTile1, movedTile2) {
    const rows = this.tiles.length
    const cols = this.tiles[0].length
    const matches = []

    // Function to find matches in a given direction
    const findMatchesInDirection = (startRow, startCol, rowIncrement, colIncrement) => {
      const matchesFound = []
      let currentRow = startRow
      let currentCol = startCol
      let matchLength = 1

      while (currentRow >= 0 && currentRow < rows && currentCol >= 0 && currentCol < cols) {
        const currentTile = this.tiles[currentRow][currentCol]
        const nextRow = currentRow + rowIncrement
        const nextCol = currentCol + colIncrement

        if (
          nextRow < 0 ||
          nextRow >= rows ||
          nextCol < 0 ||
          nextCol >= cols ||
          currentTile.getData('type') !== this.tiles[nextRow][nextCol].getData('type')
        ) {
          if (matchLength >= 3) {
            for (let i = 0; i < matchLength; i++) {
              matchesFound.push(
                this.tiles[currentRow - i * rowIncrement][currentCol - i * colIncrement]
              )
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

    if (uniqueMatches.length > 0) {
      this.removeMatches(uniqueMatches)
    } else {
      if (movedTile2 && movedTile1) {
        this.swapTiles(movedTile2, movedTile1, true)
      }
    }
  }

  handleSwipe(tile, direction) {
    const row = tile.getData('row')
    const col = tile.getData('col')
    let targetTile

    if (direction === 'right' && col < this.tiles[0].length - 1) {
      targetTile = this.tiles[row][col + 1]
    } else if (direction === 'left' && col > 0) {
      targetTile = this.tiles[row][col - 1]
    } else if (direction === 'down' && row < this.tiles.length - 1) {
      targetTile = this.tiles[row + 1][col]
    } else if (direction === 'up' && row > 0) {
      targetTile = this.tiles[row - 1][col]
    }

    if (targetTile) {
      this.swapTiles(tile, targetTile)
    }
  }

  removeMatches(matches) {
    this.score += matches.length
    this.scoreText.setText('Score: ' + this.score)

    matches.forEach((tile) => {
      const row = tile.getData('row')
      const col = tile.getData('col')
      this.tiles[row][col] = null
      tile.destroy()
    })
    this.fillEmptySpaces()
  }

  fillEmptySpaces() {
    const rows = this.tiles.length
    const cols = this.tiles[0].length
    const tileSize = 64
    const numTypes = 6

    for (let col = 0; col < cols; col++) {
      let emptyRow = rows - 1
      for (let row = rows - 1; row >= 0; row--) {
        if (this.tiles[row][col]) {
          if (emptyRow !== row) {
            this.tiles[emptyRow][col] = this.tiles[row][col]
            this.tiles[emptyRow][col].setData('row', emptyRow)
            this.animateTileFall(this.tiles[emptyRow][col], emptyRow * tileSize)
            this.tiles[row][col] = null
          }
          emptyRow--
        }
      }
      for (let newRow = emptyRow; newRow >= 0; newRow--) {
        const type = Phaser.Math.Between(0, numTypes - 1)
        const tile = this.add
          .sprite(
            col * tileSize,
            -tileSize, // Start the new tile off-screen at the top
            'tiles',
            type
          )
          .setOrigin(0)

        tile.setData({ type, row: newRow, col }).setInteractive()
        this.input.setDraggable(tile)
        this.tiles[newRow][col] = tile
        this.gameContainer.add(tile)
        this.animateTileFall(tile, newRow * tileSize)
      }
    }

    this.time.delayedCall(500, () => this.checkMatches())
  }

  animateTileFall(tile, targetY) {
    this.tweens.add({
      targets: tile,
      y: targetY,
      duration: 1000,
      ease: 'Bounce'
    })
  }
}

export default function StartGame(containerId) {
  return new Phaser.Game({
    type: Phaser.AUTO,
    width: 512,
    height: 600, // Increase height to accommodate score text
    parent: containerId,
    scene: MainScene
  })
}
