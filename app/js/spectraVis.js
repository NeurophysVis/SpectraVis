import networkData from './Network-View/networkData';
import networkView from './Network-View/networkView';
import freqSlider from './UI/freqSlider';
import timeSlider from './UI/timeSlider';
import subjectDropdown from './UI/subjectDropdown';
import edgeStatIDDropdown from './UI/edgeStatIDDropdown';
import edgeFilterDropdown from './UI/edgeFilterDropdown';
import playButton from './UI/playButton';
import resetButton from './UI/resetButton';
import networkViewRadio from './UI/networkViewRadio';
import exportButton from './UI/exportButton';
import permalinkButton from './UI/permalinkButton';
import helpButton from './UI/helpButton';
import channelData from './Electrode-Pair-View/channelData';

export function init(passedParams) {
  passedParams.curTime = +passedParams.curTime;
  passedParams.curFreq = +passedParams.curFreq;
  passedParams.curCh1 = passedParams.curCh1 || '';
  passedParams.curCh2 = passedParams.curCh2 || '';
  passedParams.networkLayout = passedParams.networkLayout || 'Anatomical';
  passedParams.edgeFilter = passedParams.edgeFilter || 'All';

  channelData
    .channel1ID(passedParams.curCh1)
    .channel2ID(passedParams.curCh2);

  queue()
    .defer(d3.json, 'DATA/subjects.json')
    .defer(d3.json, 'DATA/visInfo.json')
    .defer(d3.json, 'DATA/edgeTypes.json')
    .await(function(error, subjects, visInfo, edgeTypes) {
      subjectDropdown.options(subjects);
      edgeStatIDDropdown.options(edgeTypes);
      var subjectID = passedParams.subjectID || subjects[0].subjectID;
      var curEdgeStatID = passedParams.edgeStatID || edgeTypes[0].edgeStatID;
      var curSubjectInfo = subjects.filter(function(s) {return s.subjectID === subjectID;})[0];

      var curEdgeInfo = edgeTypes.filter(function(s) {return s.edgeStatID === curEdgeStatID;})[0];

      networkData
        .times(visInfo.tax)
        .frequencies(visInfo.fax)
        .edgeStatID(curEdgeStatID)
        .subjectID(subjectID)
        .brainRegions(visInfo.brainRegions)
        .curTime(passedParams.curTime)
        .curFreq(passedParams.curFreq)
        .isFreq(curEdgeInfo.isFreq)
        .isWeighted(curEdgeInfo.isWeightedNetwork)
        .aspectRatio(curSubjectInfo.brainXpixels / curSubjectInfo.brainYpixels)
        .brainXLim(curSubjectInfo.brainXLim)
        .brainYLim(curSubjectInfo.brainYLim)
        .edgeFilterType(passedParams.edgeFilter);

      channelData
        .times(visInfo.tax)
        .frequencies(visInfo.fax)
        .subjectID(subjectID);

      networkView.networkLayout(passedParams.networkLayout);

      timeSlider
        .domain(visInfo.tax)
        .units(visInfo.tunits);

      freqSlider
        .domain(visInfo.fax)
        .units(visInfo.funits);

      networkData.loadNetworkData();
      channelData.loadChannelData();
    });

}
