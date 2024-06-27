// combinations.js

import GameLogic from './gameLogic';

const spriteSheetMap = {
  VERTICAL_GEM: { specialType: 'striped-vertical', spriteIndex: 0 },
  HORIZONTAL_GEM: { specialType: 'striped-horizontal', spriteIndex: 1 },
  CROSS_GEM: { specialType: 'cross', spriteIndex: 2 },
  T_SHAPE_GEM: { specialType: 't-shape', spriteIndex: 3 },
  L_SHAPE_GEM: { specialType: 'l-shape', spriteIndex: 4 },
};

function markTile(tile, specialType, spriteIndex) {
  tile.setData('special', specialType);
  tile.setTexture('combo-tiles', spriteIndex + ((+tile.getData('type') * 3)));
}

function checkCombinations(tiles) {
  const { grouped, ungrouped: matchedTiles } = GameLogic.getUniqueMatches(tiles);

  grouped.forEach(match => {
    if (match.length > 3) {
      console.log(`Wow, ${match.length} tiles in a straight line!`);

      // Determine if it's a horizontal or vertical gem
      let specialType, spriteIndex;
      if (match.length === 4) {
        specialType = 'striped-horizontal'; // Horizontal gem for 4 tiles
        spriteIndex = spriteSheetMap.HORIZONTAL_GEM.spriteIndex;
      } else if (match.length > 4) {
        specialType = 'striped-vertical'; // Vertical gem for more than 4 tiles
        spriteIndex = spriteSheetMap.VERTICAL_GEM.spriteIndex;
      }

      // Mark the first tile in the match with a special texture
      // const firstTile = match[0];
      markTile( match[0], specialType, spriteIndex);

      // Remove the first tile from matchedTiles array
      const index = matchedTiles.findIndex(tile => tile ==  match[0]);
      if (index !== -1) {
        matchedTiles.splice(index, 1);
      }
    }
  });

  return matchedTiles;
}

export default {
  checkCombinations,
};
