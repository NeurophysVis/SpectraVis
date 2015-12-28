import networkDataManager from './networkDataManager';
import networkView from './networkView';
import freqSlider from '../UI/freqSlider';
import timeSlider from '../UI/timeSlider';
import subjectDropdown from '../UI/subjectDropdown';
import edgeStatIDDropdown from '../UI/edgeStatIDDropdown';
import edgeFilterDropdown from '../UI/edgeFilterDropdown';

var networkData = networkDataManager();

networkData.on('networkChange', function() {
  var networkWidth = document.getElementById('NetworkPanel').offsetWidth;
  var networkHeight = networkWidth / networkData.aspectRatio();

  networkView
    .width(networkWidth)
    .height(networkHeight)
    .xScaleDomain(networkData.brainXLim())
    .yScaleDomain(networkData.brainYLim())
    .edgeStatScale(networkData.edgeStatScale())
    .imageLink(networkData.imageLink())
    .nodeColorScale(networkData.brainRegionScale());

  d3.select('#NetworkPanel').datum(networkData.networkData())
      .call(networkView);

  d3.select('#TimeSliderPanel').datum(networkData.curTime()).call(timeSlider);
  d3.select('#FreqSliderPanel').datum(networkData.curFreq()).call(freqSlider);
  d3.select('#SubjectPanel').datum(networkData.subjectID()).call(subjectDropdown);
  d3.select('#EdgeStatTypePanel').datum(networkData.edgeStatID()).call(edgeStatIDDropdown);
  d3.select('#EdgeFilterPanel').datum(networkData.edgeFilterType()).call(edgeFilterDropdown);
});

networkData.on('dataReady', function() {
  console.log('dataReady');
});

export default networkData;
