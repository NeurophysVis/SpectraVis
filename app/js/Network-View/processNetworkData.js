import copyObject from './copyObject';
import edgeFilterWithin from './edgeFilterWithin';
import edgeFilterBetween from './edgeFilterBetween';
import binaryNetworkFilter from './binaryNetworkFilter';

export default function(edgeData, channel, curTimeInd, curFreqInd, isWeighted, edgeFilterType) {

  // Get the network for the current time and frequency
  var edges = edgeData.map(function(e) {
    var obj = copyObject(e);
    obj.data = obj.data[curTimeInd][curFreqInd];
    return obj;
  });

  // Filter by connections within or between brain regions
  var edgeFilterByConnection = {
    Within: edgeFilterWithin,
    Between: edgeFilterBetween,
    All: function() {return true;},

    undefined: function() {return true;},
  };

  edges = edges.filter(edgeFilterByConnection[edgeFilterType]);

  // For binary networks, don't display edges equal to zero
  var networkTypeFilter = isWeighted ? function() {return true;} : binaryNetworkFilter;

  edges = edges.filter(networkTypeFilter);

  var networkData = {
    nodes: channel,
    edges: edges,
  };
  return networkData;
}
