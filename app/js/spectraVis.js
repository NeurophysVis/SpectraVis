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
  passedParams.networkLayout = passedParams.networkLayout || 'Anatomical';
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

      networkView.networkLayout(passedParams.networkLayout);

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

timeSlider.on('stop', function() {
  d3.select('#playButton').text('Play');
});

timeSlider.on('start', function() {
  d3.select('#playButton').text('Stop');
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
    .filterNetworkData();
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

d3.select('#playButton').on('click', function() {
  timeSlider.running() ? timeSlider.stop() : timeSlider.play();
});

d3.select('#resetButton').on('click', function() {
  timeSlider.reset();
});

var networkViewRadio = d3.select('#NetworkLayoutPanel');
networkViewRadio.selectAll('input')
  .on('click', function() {
    networkViewRadio.selectAll('input')
      .property('checked', false);
    d3.select(this).property('checked', true);
    networkView.networkLayout(this.value);
    d3.select('#NetworkPanel').datum(networkData.networkData())
        .call(networkView);
  });
