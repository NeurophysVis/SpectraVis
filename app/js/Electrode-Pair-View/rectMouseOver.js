import networkData from '../Network-View/networkData';

export default function(d, freqInd, timeInd) {
  var curTime = networkData.times()[timeInd];
  var curFreq = networkData.frequencies()[freqInd];
  networkData
    .curTime(curTime)
    .curFreq(curFreq)
    .filterNetworkData();
}
