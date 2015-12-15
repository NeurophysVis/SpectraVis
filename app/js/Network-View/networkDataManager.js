import copyObject from './copyObject';
import edgeFilterWithin from './edgeFilterWithin';
import edgeFilterBetween from './edgeFilterBetween';
import binaryNetworkFilter from './binaryNetworkFilter';
import createEdgeScale from './createEdgeScale';
import {brainRegionColors} from '../Common/scaleColors';

export default function() {

  var edgeData;
  var channelData;
  var networkData;
  var isWeighted;
  var aspectRatio;
  var isFixed;
  var isFreq;
  var imageLink;
  var curTimeInd;
  var curFreqInd;
  var edgeStatID;
  var subjectID;
  var networkView;
  var times;
  var frequencies;
  var curTime;
  var curFreq;
  var edgeStatScale;
  var edgeFilterType;
  var edges;
  var nodes;
  var brainXLim;
  var brainYLim;
  var brainRegionScale;
  var brainRegions;
  var dispatch = d3.dispatch('dataReady', 'networkChange');
  var dataManager = {};

  dataManager.loadNetworkData = function() {
    var edgeFile = 'edges_' + subjectID + '_' + edgeStatID + '.json';
    var channelFile = 'channels_' + subjectID + '.json';

    // Load subject data
    queue()
      .defer(d3.json, 'DATA/' + edgeFile)
      .defer(d3.json, 'DATA/' + channelFile)
      .await(function(error, edge, channel) {
        // Preprocess
        channelData = channel.map(function(n) {
          n.fixedX = n.x;
          n.fixedY = n.y;
          n.x = undefined;
          n.y = undefined;
          n.fixed = false;
          return n;
        });

        nodes = channelData.map(function(n) {
          var obj = copyObject(n);
          return obj;
        });

        // Replace source name by source object
        edgeData = edge.map(function(e) {
          e.source = nodes.filter(function(n) {
            return n.channelID === e.source;
          })[0];

          e.target = nodes.filter(function(n) {
            return n.channelID === e.target;
          })[0];

          return e;
        });

        edgeStatScale = createEdgeScale(edgeData, isWeighted);
        brainRegionScale = d3.scale.ordinal()
          .domain(brainRegions)
          .range(brainRegionColors);

        dataManager.filterNetworkData();
      });

    dispatch.dataReady();

    return dataManager;
  };

  dataManager.filterNetworkData = function() {

    isFixed = (networkView.toUpperCase() === 'ANATOMICAL');
    imageLink = isFixed ? 'DATA/brainImages/brainImage_' + subjectID + '.png' : '';
    curTimeInd = times.indexOf(curTime);
    curTimeInd = (curTimeInd === -1) ? 0 : curTimeInd;
    curTime = times[curTimeInd];
    curFreqInd = frequencies.indexOf(curFreq);
    curFreqInd = (curFreqInd === -1 || !isFreq) ? 0 : curFreqInd;
    curFreq = frequencies[curFreqInd];

    // Get the network for the current time and frequency
    edges = edgeData.map(function(e) {
      var obj = copyObject(e);
      obj.data = e.data[curTimeInd][curFreqInd];
      return obj;
    });

    // Filter by connections within or between brain regions
    var edgeFilterByConnection = {
      Within: edgeFilterWithin,
      Between: edgeFilterBetween,
      All: function() {return true;},

      undefined: function() {return true;},
    };

    // For binary networks, don't display edges equal to zero
    var networkTypeFilter = isWeighted ? function() {return true;} : binaryNetworkFilter;

    edges = edges.filter(networkTypeFilter);

    // Add in any missing edges
    edges = edges.filter(edgeFilterByConnection[edgeFilterType]);

    if (isFixed) {
      nodes.forEach(function(n) {
        n.x = undefined;
        n.y = undefined;
        n.px = undefined;
        n.py = undefined;
        n.fixed = true;
      });
    } else {
      var nodesData = d3.selectAll('.gnode').data();
      nodes.forEach(function(n) {
        var correspondingNode = nodesData.filter(function(m) {
          return m.channelID === n.channelID;
        })[0];

        if (typeof correspondingNode === 'undefined') {
          n.x = undefined;
          n.y = undefined;
          n.px = undefined;
          n.py = undefined;
        } else {
          n.x = correspondingNode.x;
          n.y = correspondingNode.y;
          n.px = correspondingNode.px;
          n.py = correspondingNode.py;
        }

        n.fixed = false;
      });
    };

    networkData = {
      nodes: nodes,
      edges: edges,
    };

    dispatch.networkChange();

    return dataManager;
  };

  dataManager.isWeighted = function(value) {
    if (!arguments.length) return isWeighted;
    isWeighted = value;
    return dataManager;
  };

  dataManager.aspectRatio = function(value) {
    if (!arguments.length) return aspectRatio;
    aspectRatio = value;
    return dataManager;
  };

  dataManager.brainXLim = function(value) {
    if (!arguments.length) return brainXLim;
    brainXLim = value;
    return dataManager;
  };

  dataManager.brainYLim = function(value) {
    if (!arguments.length) return brainYLim;
    brainYLim = value;
    return dataManager;
  };

  dataManager.isFixed = function(value) {
    if (!arguments.length) return isFixed;
    isFixed = value;
    return dataManager;
  };

  dataManager.imageLink = function(value) {
    if (!arguments.length) return imageLink;
    imageLink = value;
    return dataManager;
  };

  dataManager.curTimeInd = function(value) {
    if (!arguments.length) return curTimeInd;
    curTimeInd = value;
    return dataManager;
  };

  dataManager.curFreqInd = function(value) {
    if (!arguments.length) return curFreqInd;
    curFreqInd = value;
    return dataManager;
  };

  dataManager.edgeStatID = function(value) {
    if (!arguments.length) return edgeStatID;
    edgeStatID = value;
    return dataManager;
  };

  dataManager.subjectID = function(value) {
    if (!arguments.length) return subjectID;
    subjectID = value;
    return dataManager;
  };

  dataManager.networkView = function(value) {
    if (!arguments.length) return networkView;
    networkView = value;
    return dataManager;
  };

  dataManager.times = function(value) {
    if (!arguments.length) return times;
    times = value;
    return dataManager;
  };

  dataManager.frequencies = function(value) {
    if (!arguments.length) return frequencies;
    frequencies = value;
    return dataManager;
  };

  dataManager.curTime = function(value) {
    if (!arguments.length) return curTime;
    curTime = value;
    return dataManager;
  };

  dataManager.curFreq = function(value) {
    if (!arguments.length) return curFreq;
    curFreq = value;
    return dataManager;
  };

  dataManager.edgeStatScale = function(value) {
    if (!arguments.length) return edgeStatScale;
    edgeStatScale = value;
    return dataManager;
  };

  dataManager.edgeFilterType = function(value) {
    if (!arguments.length) return edgeFilterType;
    edgeFilterType = value;
    return dataManager;
  };

  dataManager.edges = function(value) {
    if (!arguments.length) return edges;
    edges = value;
    return dataManager;
  };

  dataManager.networkData = function(value) {
    if (!arguments.length) return networkData;
    networkData = value;
    return dataManager;
  };

  dataManager.brainRegionScale = function(value) {
    if (!arguments.length) return brainRegionScale;
    brainRegionScale = value;
    return dataManager;
  };

  dataManager.brainRegions = function(value) {
    if (!arguments.length) return brainRegions;
    brainRegions = value;
    return dataManager;
  };

  dataManager.isFreq = function(value) {
    if (!arguments.length) return isFreq;
    isFreq = value;
    return dataManager;
  };

  d3.rebind(dataManager, dispatch, 'on');

  return dataManager;

}
