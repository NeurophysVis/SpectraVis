import networkChart from './Network-View/networkChart';
import processNetworkData from './Network-View/processNetworkData';
import edgeMouseOver from './Network-View/edgeMouseOver';
import edgeMouseOut from './Network-View/edgeMouseOut';
import edgeMouseClick from './Network-View/edgeMouseClick';
import nodeMouseClick from './Network-View/nodeMouseClick';

export function init(params) {
  params.curSubject = 'D';
  params.edgeStatID = 'rawDiff_coh';
  loadData(params);
}

export function loadData(params) {
  var edgeFile = 'edges_' + params.curSubject + '_' + params.edgeStatID + '.json';
  var channelFile = 'channels_' + params.curSubject + '.json';

  // Load subject data
  queue()
    .defer(d3.json, 'DATA/subjects.json')
    .defer(d3.json, 'DATA/visInfo.json')
    .defer(d3.json, 'DATA/edgeTypes.json')
    .defer(d3.json, 'DATA/' + edgeFile)
    .defer(d3.json, 'DATA/' + channelFile)
    .await(function(error, subjects, visInfo, edgeTypes, edgeData, channel) {
      // Preprocess
      channel = channel.map(function(n) {
        n.fixedX = n.x;
        n.fixedY = n.y;
        n.fixed = false;
        return n;
      });

      // Replace source name by source object
      edgeData = edgeData.map(function(e) {
        e.source = channel.filter(function(n) {
          return n.channelID === e.source;
        })[0];

        e.target = channel.filter(function(n) {
          return n.channelID === e.target;
        })[0];

        return e;
      });

      renderApp(subjects, visInfo, edgeTypes, edgeData, channel, params);
    });
}

export function renderApp(subjects, visInfo, edgeTypes, edgeData, channel, params) {

  var networkData = processNetworkData(edgeData, channel, 0, 0);
  var network = networkChart()
    .width(document.getElementById('NetworkPanel').offsetWidth)
    .height(document.getElementById('NetworkPanel').offsetWidth * 0.8)
    .xScaleDomain(subjects.filter(function(s) {return s.subjectID === params.curSubject;})[0].brainXLim)
    .yScaleDomain(subjects.filter(function(s) {return s.subjectID === params.curSubject;})[0].brainYLim);

  network.on('edgeMouseOver', edgeMouseOver);
  network.on('edgeMouseOut', edgeMouseOut);
  network.on('nodeMouseClick', nodeMouseClick);
  network.on('edgeMouseClick', edgeMouseClick);

  d3.select('#NetworkPanel').datum(networkData)
      .call(network);
}

export var params = {};
