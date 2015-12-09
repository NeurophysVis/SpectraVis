import copyObject from './copyObject';

export default function(edgeData, channel, curTimeInd, curFreqInd) {

  var edges = edgeData.map(function(e) {
    var obj = copyObject(e);
    obj.data = obj.data[curTimeInd][curFreqInd];
    return obj;
  });

  var networkData = {
    nodes: channel,
    edges: edges,
  };
  return networkData;
}
