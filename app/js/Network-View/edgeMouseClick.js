import edgeMouseOut from './edgeMouseOut';
import channelData from '../Electrode-Pair-View/channelData';
import highlightElectrodePair from './highlightElectrodePair';

export default function(e) {
  var re = /\d+/;
  var curCh1 = re.exec(e.source.channelID)[0];
  var curCh2 = re.exec(e.target.channelID)[0];
  channelData
    .channel1ID(curCh1)
    .channel2ID(curCh2)
    .loadChannelData();

  highlightElectrodePair();

  // mouseFlag = true;
  // svgNetworkMap.select('text#HOLD').remove();
}
