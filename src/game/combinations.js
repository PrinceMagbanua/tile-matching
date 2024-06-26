import Phaser from 'phaser'

const spriteSheetMap = {
  HORIZONTAL_GEM: { specialType: 'striped-horizontal', spriteIndex: 0 },
  VERTICAL_GEM: { specialType: 'striped-vertical', spriteIndex: 1 },
  T_SHAPE_GEM: { specialType: 't-shape', spriteIndex: 3 },
  L_SHAPE_GEM: { specialType: 'l-shape', spriteIndex: 4 },
  CROSS_GEM: { specialType: 'cross', spriteIndex: 2 }
}

// function markTile(tile, specialType, spriteIndex) {
//   tile.setData('special', specialType)
//   tile.setTexture('combo-tiles', spriteIndex)
// }
// combinations.js
import GameLogic from './gameLogic';

function checkCombinations(tiles) {
  const { grouped, ungrouped } = GameLogic.getUniqueMatches(tiles);

  grouped.forEach(match => {
    if (match.length > 3) {
      console.log('wow');
    }
  });

  return ungrouped;
}

export default {
  checkCombinations
};
