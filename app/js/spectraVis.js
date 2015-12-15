import drawNetwork from './Network-View/drawNetwork';
import networkDataManager from './Network-View/networkDataManager';
import networkChart from './Network-View/networkChart';
import edgeMouseOver from './Network-View/edgeMouseOver';
import edgeMouseOut from './Network-View/edgeMouseOut';
import edgeMouseClick from './Network-View/edgeMouseClick';
import nodeMouseClick from './Network-View/nodeMouseClick';

var networkData = networkDataManager();
var networkView = networkChart();

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
      var curSubject = passedParams.curSubject || subjects[0].subjectID;
      var curEdgeStatID = passedParams.edgeStatID || edgeTypes[0].edgeStatID;
      var curSubjectInfo = subjects.filter(function(s) {return s.subjectID === curSubject;})[0];

      networkData
        .times(visInfo.tax)
        .frequencies(visInfo.fax)
        .networkView(passedParams.networkView)
        .edgeStatID(curEdgeStatID)
        .subjectID(curSubject)
        .curTime(passedParams.curTime)
        .curFreq(passedParams.curFreq)
        .aspectRatio(curSubjectInfo.brainXpixels / curSubjectInfo.brainYpixels)
        .brainXLim(curSubjectInfo.brainXLim)
        .brainYLim(curSubjectInfo.brainYLim)
        .edgeFilterType(passedParams.edgeFilter);

      networkData.loadNetworkData();
    });

}

networkView.on('edgeMouseOver', edgeMouseOver);
networkView.on('edgeMouseOut', edgeMouseOut);
networkView.on('nodeMouseClick', nodeMouseClick);
networkView.on('edgeMouseClick', edgeMouseClick);

networkData.on('dataReady', function() {
  console.log('dataReady');
});

networkData.on('networkChange', function() {

  var networkWidth = document.getElementById('NetworkPanel').offsetWidth;
  var networkHeight = networkWidth / networkData.aspectRatio();

  networkView
    .width(networkWidth)
    .height(networkHeight)
    .xScaleDomain(networkData.brainXLim())
    .yScaleDomain(networkData.brainYLim())
    .imageLink(networkData.imageLink());

  d3.select('#NetworkPanel').datum(networkData.networkData())
      .call(networkView);
});
