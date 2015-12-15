var NUM_EDGE_COLORS = 11;

// Reverse the colors
var edgeStatColors = [];
colorbrewer.RdBu[NUM_EDGE_COLORS].forEach(function(color) {
  edgeStatColors.unshift(color);
});

var brainRegionColors = colorbrewer.Pastel1[7];

export {edgeStatColors, NUM_EDGE_COLORS, brainRegionColors};
