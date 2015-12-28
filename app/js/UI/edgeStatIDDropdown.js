import createDropdown from './createDropdown';
import networkData from '../Network-View/networkData';

var edgeStatIDDropdown = createDropdown().key('edgeStatID').displayName('edgeStatName');
edgeStatIDDropdown.on('click', function() {
  var curEdgeInfo = d3.select(this).data()[0];
  networkData
    .edgeStatID(curEdgeInfo.edgeStatID)
    .isFreq(curEdgeInfo.isFreq)
    .isWeighted(curEdgeInfo.isWeightedNetwork)
    .loadNetworkData();
});

export default edgeStatIDDropdown;
