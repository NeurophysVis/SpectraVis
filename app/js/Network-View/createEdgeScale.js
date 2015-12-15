import {edgeStatColors, NUM_EDGE_COLORS} from '../Common/scaleColors';
import getEdgeDomain from './getEdgeDomain';

export default function(edgeData, isWeighted) {
  if (isWeighted) {
    var edgeStatScale = d3.scale.linear()
      .domain(getEdgeDomain(edgeData, NUM_EDGE_COLORS))
      .range(edgeStatColors);
  } else {
    var edgeStatBinaryColors = [0, (NUM_EDGE_COLORS - 1) / 2, NUM_EDGE_COLORS - 1].map(function(n) { return edgeStatColors[n];});

    edgeStatScale = d3.scale.ordinal()
      .domain([-1, 0, 1])
      .range(edgeStatBinaryColors);
  }

  return edgeStatScale;
}
