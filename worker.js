// Get the best item bounds to fit in the container. Param object must have
// width, height, itemCount, aspectRatio, maxRows, and minGap. The itemCount
// must be greater than 0. Result is single object with rowCount, colCount,
// itemWidth, and itemHeight.
// From https://codepen.io/cretz/pen/jObGXLK
function getBestItemBounds(config) {
  const actualRatio = config.width / config.height;
  // Just make up theoretical sizes, we just care about ratio
  const theoreticalHeight = 100;
  const theoreticalWidth = theoreticalHeight * config.aspectRatio;
  // Go over each row count find the row and col count with the closest
  // ratio.
  let best;
  for (let rowCount = 1; rowCount <= config.maxRows; rowCount++) {
    // Row count can't be higher than item count
    if (rowCount > config.itemCount) continue;
    const colCount = Math.ceil(config.itemCount / rowCount);
    // Get the width/height ratio
    const ratio =
      (theoreticalWidth * colCount) / (theoreticalHeight * rowCount);
    if (
      !best ||
      Math.abs(ratio - actualRatio) < Math.abs(best.ratio - actualRatio)
    ) {
      best = { rowCount, colCount, ratio };
    }
  }

  // NOTE getting unhandled runtime error best is undefined?
  // code works but not sure why
  if (best) {
    // Build item height and width. If the best ratio is less than the actual ratio,
    // it's the height that determines the width, otherwise vice versa.
    const result = {
      rowCount: best.rowCount,
      colCount: best.colCount,
      itemHeight: theoreticalHeight,
      itemWidth: theoreticalWidth,
    };
    if (best.ratio < actualRatio) {
      result.itemHeight =
        (config.height - config.minGap * best.rowCount) / best.rowCount;
      result.itemWidth = result.itemHeight * config.aspectRatio;
    } else {
      result.itemWidth =
        (config.width - config.minGap * best.colCount) / best.colCount;
      result.itemHeight = result.itemWidth / config.aspectRatio;
    }
    return result;
  }

  return { rowCount: 1, colCount: 1 };
}

addEventListener('message', (event) => {
  postMessage(getBestItemBounds(event.data));
});
