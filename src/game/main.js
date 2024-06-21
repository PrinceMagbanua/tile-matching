import GameLogic from './gameLogic'
class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene')
  }

  preload() {
    this.load.spritesheet('tiles', 'assets/spritesheet-1.png', { frameWidth: 64, frameHeight: 64 })
    this.load.spritesheet('pop-anim', 'assets/pop-anim.png', { frameWidth: 64, frameHeight: 64 })
    this.load.image('selectedTile', 'assets/selectedTileFrame.png')

    this.load.audio('pop1', 'assets/sfx/pop1.wav')
    this.load.audio('pop2', 'assets/sfx/pop2.wav')
    this.load.audio('pop3', 'assets/sfx/pop3.wav')
    this.load.audio('pop4', 'assets/sfx/pop4.wav')
  }

  preloadAnimations() {
    this.anims.create({
      key: 'bubblePop',
      frames: this.anims.generateFrameNumbers('pop-anim', { start: 0, end: 4 }), // 5 frames: 0 to 4
      frameRate: 30,
      repeat: 0
    })
  }

  create() {
    this.preloadAnimations()
    const rows = 8
    const cols = 8
    const tileSize = 64
    const numTypes = 6

    this.isMatching = false
    this.tiles = []
    this.selectedTile = null
    this.score = 0
    this.isProcessing = false
    // Adjust the position of the score text
    this.scoreText = this.add
      .text(10, 10, 'Score: 0', { fontSize: '32px', fill: '#fff' })
      .setDepth(1)

    // Adjust the game container to have a space for the score
    this.gameContainer = this.add.container(0, 50) // Adding some padding for the score

    for (let row = 0; row < rows; row++) {
      this.tiles[row] = []
      for (let col = 0; col < cols; col++) {
        const type = Phaser.Math.Between(0, numTypes - 1)
        const tile = this.add.sprite(col * tileSize, row * tileSize, 'tiles', type).setOrigin(0)
        tile.setData('type', type)
        tile.setData('row', row)
        tile.setData('col', col)
        tile.setInteractive()
        this.input.setDraggable(tile)
        this.tiles[row][col] = tile
        this.gameContainer.add(tile) // Add tile to the container
      }
    }

    // Create the selected tile indicator, initially hidden
    this.selectedTileIndicator = this.add.image(0, 0, 'selectedTile').setOrigin(0).setVisible(false)
    this.gameContainer.add(this.selectedTileIndicator)

    this.countdownAnimation(() => {
      this.checkMatches()
    })

    this.input.on('dragstart', (pointer, tile) => {
      if (this.isProcessing) return
      tile.startX = tile.x // Store initial position
      tile.startY = tile.y // Store initial position
      this.selectedTileIndicator.setPosition(tile.x, tile.y).setVisible(true)
    })

    this.input.on('dragend', (pointer, tile) => {
      this.selectedTileIndicator.setVisible(false)
      const dragThreshold = 32
      const deltaX = pointer.upX - pointer.downX
      const deltaY = pointer.upY - pointer.downY

      if (Math.abs(deltaX) > dragThreshold || Math.abs(deltaY) > dragThreshold) {
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          // Horizontal drag
          if (deltaX > dragThreshold) {
            this.handleSwipe(tile, 'right')
          } else if (deltaX < -dragThreshold) {
            this.handleSwipe(tile, 'left')
          }
        } else {
          // Vertical drag
          if (deltaY > dragThreshold) {
            this.handleSwipe(tile, 'down')
          } else if (deltaY < -dragThreshold) {
            this.handleSwipe(tile, 'up')
          }
        }
      } else {
        // If not dragged enough, treat as a click
        this.selectTile(tile)
      }
    })
  }

  countdownAnimation(callback) {
    // Countdown text
    const countdownText = this.add
      .text(this.sys.game.config.width / 2, this.sys.game.config.height / 2, 'Ready!', {
        fontSize: '64px',
        fill: '#fff',
        align: 'center'
      })
      .setOrigin(0.5)
      .setDepth(1)

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
        this.selectedTile = null // Deselect the tile if the same tile is clicked again
        this.selectedTileIndicator.setVisible(false) // Hide the indicator
        return
      }
      if (this.areAdjacent(this.selectedTile, tile)) {
        this.swapTiles(this.selectedTile, tile)
      } else {
        this.shakeTile(this.selectedTile)
        this.shakeTile(tile)
        //TODO: Play SFX here (erroneous tile swap)
      }
      this.selectedTile = null
      this.selectedTileIndicator.setVisible(false) // Hide the indicator after swapping
    } else {
      this.selectedTile = tile
      // Position and show the indicator
      this.selectedTileIndicator.setPosition(tile.x, tile.y).setVisible(true)
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
      duration: 100,
      onComplete: () => {
        if (!revert) this.checkMatches(tile1, tile2)
      }
    })
  }

  async checkMatches(movedTile1, movedTile2) {
    this.isProcessing = true
    //CONTINUE CODING
    const uniqueMatches = GameLogic.getUniqueMatches(this.tiles)
    if (uniqueMatches.length > 0) {
      await this.removeMatches(uniqueMatches)
    } else {
      if (movedTile2 && movedTile1) {
        // swapback
        this.swapTiles(movedTile2, movedTile1, true)
      }

      // const movesAvailable = GameLogic.checkForAvailableMoves(this.tiles)
      // if (!movesAvailable) {
      //   console.log('no more moves!!')
      //   alert('no more moves!!')
      // } else {
      //   console.log('continue gameplay!! moves found:', movesAvailable)
      // }
    }
  }

  async removeMatches(matches) {
    this.score += matches.length
    this.scoreText.setText('Score: ' + this.score)

    const popSounds = ['pop1', 'pop2', 'pop3', 'pop4'] // Array of pop sound keys

    // Promisify the destruction process
    const destroyTile = (tile, index) => {
      return new Promise((resolve) => {
        const row = tile.getData('row')
        const col = tile.getData('col')

        const randomPopSound = Phaser.Math.RND.pick(popSounds) // Random pop sound

        const delay = index * 40 // Delay between each sound (adjust as needed)

        // Play pop sound with delay
        this.time.delayedCall(delay, () => {
          this.sound.play(randomPopSound)
        })

        // Trigger bubble pop animation
        const animSprite = this.add
          .sprite(tile.x + tile.width / 2, tile.y + tile.height / 2, 'pop-anim')
          .setScale(1)
        animSprite.play('bubblePop')
        animSprite.on('animationcomplete', () => {
          animSprite.destroy()
          // Resolve the promise once animation is complete
        })

        this.gameContainer.add(animSprite)

        // Destroy tile after delay
        this.time.delayedCall(delay, () => {
          this.tiles[row][col] = null
          tile.destroy()
          resolve()
        })
      })
    }

    // Map destroyTile to each match and wait for all promises to resolve
    await Promise.all(matches.map((match, index) => destroyTile(match, index)))

    // After all animations and destructions are complete, fill empty spaces
    this.fillEmptySpaces()
  }

  fillEmptySpaces() {
    const rows = this.tiles.length
    const cols = this.tiles[0].length
    const tileSize = 64
    const numTypes = 6

    let promises = [] // Array to store promises for each animation

    for (let col = 0; col < cols; col++) {
      let emptyRow = rows - 1
      for (let row = rows - 1; row >= 0; row--) {
        if (this.tiles[row][col]) {
          if (emptyRow !== row) {
            this.tiles[emptyRow][col] = this.tiles[row][col]
            this.tiles[emptyRow][col].setData('row', emptyRow)
            promises.push(
              new Promise((resolve) => {
                this.animateTileFall(this.tiles[emptyRow][col], emptyRow * tileSize, resolve)
              })
            )
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
        promises.push(
          new Promise((resolve) => {
            this.animateTileFall(tile, newRow * tileSize, resolve)
          })
        )
      }
    }

    // Wait for all promises to resolve before checking matches
    Promise.all(promises).then(() => {
      this.checkMatches()
    })

    this.isProcessing = false
  }

  animateTileFall(tile, targetY, onComplete) {
    return this.tweens.add({
      targets: tile,
      y: targetY,
      duration: 100,
      ease: 'Bounce',
      onComplete: onComplete // Call onComplete when animation is complete
    })
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

  // Method to shake a tile
  shakeTile(tile) {
    this.tweens.add({
      targets: tile,
      x: tile.x + 5, // Shake distance
      duration: 50, // Shake duration
      yoyo: true, // Reverse the animation
      repeat: 1, // Number of shakes
      onComplete: () => {
        tile.x = tile.getData('col') * 64 // Reset tile position
      }
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
