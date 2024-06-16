class MainScene extends Phaser.Scene {
    constructor() {
        super('MainScene');
    }

    preload() {
        this.load.spritesheet('tiles', 'assets/spritesheet.png', { frameWidth: 64, frameHeight: 64 });
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
        this.scoreText = this.add.text(10, 10, 'Score: 0', { fontSize: '32px', fill: '#fff' }).setDepth(1);

        // Adjust the game container to have a space for the score
        this.gameContainer = this.add.container(0, 50);  // Adding some padding for the score

        for (let row = 0; row < rows; row++) {
            this.tiles[row] = [];
            for (let col = 0; col < cols; col++) {
                const type = Phaser.Math.Between(0, numTypes - 1);
                const tile = this.add.sprite(col * tileSize, row * tileSize, 'tiles', type).setOrigin(0);
                tile.setData('type', type);
                tile.setData('row', row);
                tile.setData('col', col);
                tile.setInteractive();
                tile.on('pointerdown', () => this.selectTile(tile));
                this.tiles[row][col] = tile;
                this.gameContainer.add(tile);  // Add tile to the container
            }
        }
    }

    selectTile(tile) {
        if (this.selectedTile) {
            if (this.selectedTile === tile) {
                this.selectedTile = null;  // Deselect the tile if the same tile is clicked again
                return;
            }
            if (this.areAdjacent(this.selectedTile, tile)) {
                this.swapTiles(this.selectedTile, tile);
            }
            this.selectedTile = null;
        } else {
            this.selectedTile = tile;
        }
    }

    areAdjacent(tile1, tile2) {
        const row1 = tile1.getData('row');
        const col1 = tile1.getData('col');
        const row2 = tile2.getData('row');
        const col2 = tile2.getData('col');

        const isAdjacent =
            (row1 === row2 && Math.abs(col1 - col2) === 1) ||
            (col1 === col2 && Math.abs(row1 - row2) === 1);

        return isAdjacent;
    }

    swapTiles(tile1, tile2) {
        const row1 = tile1.getData('row');
        const col1 = tile1.getData('col');
        const row2 = tile2.getData('row');
        const col2 = tile2.getData('col');

        // Swap the data
        tile1.setData('row', row2);
        tile1.setData('col', col2);
        tile2.setData('row', row1);
        tile2.setData('col', col1);

        // Swap the positions in the grid
        this.tiles[row1][col1] = tile2;
        this.tiles[row2][col2] = tile1;

        // Animate the swap
        this.tweens.add({
            targets: tile1,
            x: col2 * 64,
            y: row2 * 64,
            duration: 200,
            onComplete: () => {
                this.tweens.add({
                    targets: tile2,
                    x: col1 * 64,
                    y: row1 * 64,
                    duration: 200,
                    onComplete: () => {
                        this.checkMatches();
                    }
                });
            }
        });
    }

    checkMatches() {
        const rows = this.tiles.length;
        const cols = this.tiles[0].length;
        const matches = [];

        // Check for horizontal matches
        for (let row = 0; row < rows; row++) {
            let matchLength = 1;
            for (let col = 0; col < cols; col++) {
                if (col === cols - 1 || this.tiles[row][col].getData('type') !== this.tiles[row][col + 1].getData('type')) {
                    if (matchLength >= 3) {
                        for (let i = 0; i < matchLength; i++) {
                            matches.push(this.tiles[row][col - i]);
                        }
                    }
                    matchLength = 1;
                } else {
                    matchLength++;
                }
            }
        }

        // Check for vertical matches
        for (let col = 0; col < cols; col++) {
            let matchLength = 1;
            for (let row = 0; row < rows; row++) {
                if (row === rows - 1 || this.tiles[row][col].getData('type') !== this.tiles[row + 1][col].getData('type')) {
                    if (matchLength >= 3) {
                        for (let i = 0; i < matchLength; i++) {
                            matches.push(this.tiles[row - i][col]);
                        }
                    }
                    matchLength = 1;
                } else {
                    matchLength++;
                }
            }
        }

        if (matches.length > 0) {
            this.removeMatches(matches);
        }
    }

    removeMatches(matches) {
        this.score += matches.length;
        this.scoreText.setText('Score: ' + this.score);

        matches.forEach(tile => {
            const row = tile.getData('row');
            const col = tile.getData('col');
            this.tiles[row][col] = null;
            tile.destroy();
        });
        this.fillEmptySpaces();
    }

    fillEmptySpaces() {
        const rows = this.tiles.length;
        const cols = this.tiles[0].length;
        const tileSize = 64;
        const numTypes = 6;

        for (let col = 0; col < cols; col++) {
            for (let row = rows - 1; row >= 0; row--) {
                if (!this.tiles[row][col]) {
                    let emptyRow = row;
                    for (let rowAbove = row - 1; rowAbove >= 0; rowAbove--) {
                        if (this.tiles[rowAbove][col]) {
                            this.tiles[emptyRow][col] = this.tiles[rowAbove][col];
                            this.tiles[emptyRow][col].setData('row', emptyRow);
                            this.tiles[emptyRow][col].setPosition(col * tileSize, emptyRow * tileSize);
                            this.tiles[rowAbove][col] = null;
                            emptyRow--;
                        }
                    }
                    for (let newRow = emptyRow; newRow >= 0; newRow--) {
                        const type = Phaser.Math.Between(0, numTypes - 1);
                        const tile = this.add.sprite(col * tileSize, newRow * tileSize, 'tiles', type).setOrigin(0);
                        tile.setData('type', type);
                        tile.setData('row', newRow);
                        tile.setData('col', col);
                        tile.setInteractive();
                        tile.on('pointerdown', () => this.selectTile(tile));
                        this.tiles[newRow][col] = tile;
                        this.gameContainer.add(tile);  // Add new tile to the container
                    }
                }
            }
        }

        this.time.delayedCall(500, () => {
            this.checkMatches();
        });
    }
}

export default function StartGame(containerId) {
    return new Phaser.Game({
        type: Phaser.AUTO,
        width: 512,
        height: 600,  // Increase height to accommodate score text
        parent: containerId,
        scene: MainScene,
    });
}
