import drawNetwork from './Network-View/drawNetwork';
import loadNetworkData from './Network-View/loadNetworkData';

var appDispatcher = d3.dispatch('loadNetwork', 'loadElectrodePair', 'networkChange', 'electrodePairChange');
var params = {};

export function init(params) {
  params.curTime = +params.curTime || 0;
  params.curFreq = +params.curFreq || 0;
  params.curCh1 = params.curCh1 || '';
  params.curCh2 = params.curCh2 || '';
  params.networkView = params.networkView || 'Anatomical';
  params.edgeFilter = params.edgeFilter || 'All';
  params.edgeStatID = params.edgeStatID;
  queue()
    .defer(d3.json, 'DATA/subjects.json')
    .defer(d3.json, 'DATA/visInfo.json')
    .defer(d3.json, 'DATA/edgeTypes.json')
    .await(function(error, subjects, visInfo, edgeTypes) {
      loadNetworkData(subjects, visInfo, edgeTypes, params, appDispatcher);
    });

}

appDispatcher.on('loadNetwork', drawNetwork);
