import networkDataManager from './Network-View/networkDataManager';
import networkChart from './Network-View/networkChart';
import edgeMouseOver from './Network-View/edgeMouseOver';
import edgeMouseOut from './Network-View/edgeMouseOut';
import edgeMouseClick from './Network-View/edgeMouseClick';
import nodeMouseClick from './Network-View/nodeMouseClick';
import createSlider from './UI/createSlider';
import createDropdown from './UI/createDropdown';
import filterTypes from './UI/filterTypes';

var networkData = networkDataManager();
var networkView = networkChart();
var timeSlider = createSlider();
var freqSlider = createSlider();
var subjectDropdown = createDropdown().key('subjectID');
var edgeStatIDDropdown = createDropdown().key('edgeStatID').displayName('edgeStatName');
var edgeFilterDropdown = createDropdown().key('filterType').displayName('filterName').options(filterTypes);

export function init(passedParams) {
  passedParams.curTime = +passedParams.curTime;
  passedParams.curFreq = +passedParams.curFreq;
  passedParams.curCh1 = passedParams.curCh1 || '';
  passedParams.curCh2 = passedParams.curCh2 || '';
  passedParams.networkView = passedParams.networkView || 'Anatomical';
  passedParams.edgeFilter = passedParams.edgeFilter || 'All';
  queue()
    .defer(d3.json, 'DATA/subjects.json')
    .defer(d3.json, 'DATA/visInfo.json')
    .defer(d3.json, 'DATA/edgeTypes.json')
    .await(function(error, subjects, visInfo, edgeTypes) {
      subjectDropdown.options(subjects);
      edgeStatIDDropdown.options(edgeTypes);
      var curSubject = passedParams.curSubject || subjects[0].subjectID;
      var curEdgeStatID = passedParams.edgeStatID || edgeTypes[0].edgeStatID;
      var curSubjectInfo = subjects.filter(function(s) {return s.subjectID === curSubject;})[0];

      var curEdgeInfo = edgeTypes.filter(function(s) {return s.edgeStatID === curEdgeStatID;})[0];

      networkData
        .times(visInfo.tax)
        .frequencies(visInfo.fax)
        .networkView(passedParams.networkView)
        .edgeStatID(curEdgeStatID)
        .subjectID(curSubject)
        .brainRegions(visInfo.brainRegions)
        .curTime(passedParams.curTime)
        .curFreq(passedParams.curFreq)
        .isFreq(curEdgeInfo.isFreq)
        .isWeighted(curEdgeInfo.isWeightedNetwork)
        .aspectRatio(curSubjectInfo.brainXpixels / curSubjectInfo.brainYpixels)
        .brainXLim(curSubjectInfo.brainXLim)
        .brainYLim(curSubjectInfo.brainYLim)
        .edgeFilterType(passedParams.edgeFilter);

      timeSlider
        .domain(visInfo.tax)
        .units(visInfo.tunits);

      freqSlider
        .domain(visInfo.fax)
        .units(visInfo.funits);

      networkData.loadNetworkData();
    });

}

networkView.on('edgeMouseOver', edgeMouseOver);
networkView.on('edgeMouseOut', edgeMouseOut);
networkView.on('nodeMouseClick', nodeMouseClick);
networkView.on('edgeMouseClick', edgeMouseClick);
timeSlider.on('sliderChange', function(curTime) {
  networkData.curTime(curTime);
  networkData.filterNetworkData();
});

freqSlider.on('sliderChange', function(curFreq) {
  networkData
    .curFreq(curFreq)
    .filterNetworkData();
});

networkData.on('dataReady', function() {
  console.log('dataReady');
});

subjectDropdown.on('click', function() {
  var curSubjectInfo = d3.select(this).data()[0];
  networkData
    .subjectID(curSubjectInfo.subjectID)
    .aspectRatio(curSubjectInfo.brainXpixels / curSubjectInfo.brainYpixels)
    .brainXLim(curSubjectInfo.brainXLim)
    .brainYLim(curSubjectInfo.brainYLim)
    .loadNetworkData();
});

edgeStatIDDropdown.on('click', function() {
  var curEdgeInfo = d3.select(this).data()[0];
  networkData
    .edgeStatID(curEdgeInfo.edgeStatID)
    .isFreq(curEdgeInfo.isFreq)
    .isWeighted(curEdgeInfo.isWeightedNetwork)
    .loadNetworkData();
});

edgeFilterDropdown.on('click', function() {
  var edgeFilter = d3.select(this).data()[0];
  networkData
    .edgeFilterType(edgeFilter.filterType)
    .loadNetworkData();
});

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

var stopAnimation = true;
d3.select('#playButton').on('click', function() {
  var playButton = d3.select('#playButton');
  var slider = d3.select('#TimeSliderPanel').selectAll('input');
  playButton.text('Stop');
  stopAnimation = !stopAnimation;
  var stepSize = +slider.property('step');
  var maxValue = +slider.property('max');
  var curValue = +slider.property('value');
  d3.timer(function() {
    if (curValue < maxValue && !stopAnimation) {
      curValue += stepSize;
      networkData
        .curTime(curValue)
        .filterNetworkData();
    } else {
      playButton.text('Start');
      stopAnimation = true;
      return true;
    }
  }, 500);

});
