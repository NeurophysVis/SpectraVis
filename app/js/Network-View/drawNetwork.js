import processNetworkData from './processNetworkData';
import networkChart from './networkChart';
import edgeMouseOver from './edgeMouseOver';
import edgeMouseOut from './edgeMouseOut';
import edgeMouseClick from './edgeMouseClick';
import nodeMouseClick from './nodeMouseClick';

export default function(subjects, visInfo, edgeTypes, edgeData, channel, params) {

  var curSubjectInfo = subjects.filter(function(s) {return s.subjectID === params.curSubject;})[0];

  var isWeighted = edgeTypes.filter(function(e) {return e.edgeStatID === params.edgeStatID;})[0].isWeightedNetwork;
  var aspectRatio = curSubjectInfo.brainXpixels / curSubjectInfo.brainYpixels;
  var networkWidth = document.getElementById('NetworkPanel').offsetWidth;
  var networkHeight = networkWidth / aspectRatio;
  var isFixed = (params.networkView === 'Anatomical');
  var imageLink = isFixed ? 'DATA/brainImages/brainImage_' + params.curSubject + '.png' : '';
  var curTimeInd = visInfo.tax.indexOf(params.curTime) || 0;
  var curFreqInd = visInfo.fax.indexOf(params.curFreq) || 0;

  var networkData = processNetworkData(edgeData, channel, curTimeInd, curFreqInd, isWeighted, params.edgeFilter);
  var network = networkChart()
    .width(networkWidth)
    .height(networkHeight)
    .xScaleDomain(curSubjectInfo.brainXLim)
    .yScaleDomain(curSubjectInfo.brainYLim)
    .imageLink(imageLink)
    .isFixed(isFixed);

  network.on('edgeMouseOver', edgeMouseOver);
  network.on('edgeMouseOut', edgeMouseOut);
  network.on('nodeMouseClick', nodeMouseClick);
  network.on('edgeMouseClick', edgeMouseClick);

  d3.select('#NetworkPanel').datum(networkData)
      .call(network);
}
