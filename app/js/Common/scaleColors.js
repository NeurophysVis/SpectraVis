const NUM_EDGE_COLORS = 11;
const NUM_CHANNEL_COLORS = 11;

// Reverse the colors
var edgeStatColors = [];
colorbrewer.RdBu[NUM_EDGE_COLORS].forEach(function(color) {
  edgeStatColors.unshift(color);
});

var channelStatColors = [];
colorbrewer.PiYG[NUM_CHANNEL_COLORS].forEach(function(color) {
  channelStatColors.unshift(color);
});

var brainRegionColors = colorbrewer.Pastel1[7];

export {edgeStatColors, NUM_EDGE_COLORS, brainRegionColors, channelStatColors, NUM_CHANNEL_COLORS};
