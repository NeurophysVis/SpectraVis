import createDropdown from './createDropdown';
import networkData from '../Network-View/networkData';
import channelData from '../Electrode-Pair-View/channelData';

var subjectDropdown = createDropdown().key('subjectID');
subjectDropdown.on('click', function() {
  var curSubjectInfo = d3.select(this).data()[0];
  channelData
    .subjectID(curSubjectInfo.subjectID)
    .channel1ID('')
    .channel2ID('')
    .loadChannelData();

  networkData
    .subjectID(curSubjectInfo.subjectID)
    .aspectRatio(curSubjectInfo.brainXpixels / curSubjectInfo.brainYpixels)
    .brainXLim(curSubjectInfo.brainXLim)
    .brainYLim(curSubjectInfo.brainYLim)
    .loadNetworkData();
});

export default subjectDropdown;
