import copyObject from './copyObject';
import edgeFilterByConnection from './edgeFilterByConnection';
import binaryNetworkFilter from './binaryNetworkFilter';
import createEdgeScale from './createEdgeScale';
import {brainRegionColors} from '../Common/scaleColors';

export default function() {

  var edgeData;
  var channelData;
  var edgeInd;
  var networkData = {
        nodes: [],
        edges: [],
      };
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
  var brainXLim;
  var brainYLim;
  var brainRegionScale;
  var brainRegions;
  var dispatch = d3.dispatch('dataReady', 'networkChange');
  var isLoaded = false;
  var allNodesMap = d3.map();
  var filteredNodesMap = d3.map();
  var allEdgesMap = d3.map();
  var filteredEdgesMap = d3.map();
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

        networkData.nodes = channelData.map(function(n) {
          var obj = copyObject(n);
          allNodesMap.set(obj.channelID, obj);
          return obj;
        });

        // Replace source name by source object
        edgeData = edge.map(function(e) {
          allEdgesMap.set(e.source + '_' + e.target, e);
          e.source = allNodesMap.get(e.source);
          e.target = allNodesMap.get(e.target);
          networkData.edges.push(copyObject(e));
          return e;
        });

        filteredEdgesMap = d3.map();
        networkData.edges.forEach(function(e) {
          filteredEdgesMap.set(e.source.channelID + '_' + e.target.channelID, e);
        });

        edgeStatScale = createEdgeScale(edgeData, isWeighted);
        brainRegionScale = d3.scale.ordinal()
          .domain(brainRegions)
          .range(brainRegionColors);

        imageLink = 'DATA/brainImages/brainImage_' + subjectID + '.png';

        isLoaded = true;

        dataManager.filterNetworkData();
      });

    dispatch.dataReady();

    return dataManager;
  };

  // Get the network for the current time and frequency
  function changeTimeFreq() {
    curTimeInd = times.indexOf(curTime);
    curTimeInd = (curTimeInd === -1) ? 0 : curTimeInd;
    curTime = times[curTimeInd];
    curFreqInd = frequencies.indexOf(curFreq);
    curFreqInd = (curFreqInd === -1 || !isFreq) ? 0 : curFreqInd;
    curFreq = frequencies[curFreqInd];

    networkData.edges.forEach(function(e) {
      var edgeKey = e.source.channelID + '_' + e.target.channelID;
      e.data = allEdgesMap.get(edgeKey).data[curTimeInd][curFreqInd];
    });

  };

  // Map the filtered edges to the edge name
  function setFilteredMaps() {
    filteredEdgesMap = d3.map();
    networkData.edges.forEach(function(e) {
      filteredEdgesMap.set(e.source.channelID + '_' + e.target.channelID, e);
    });
  }

  // If it is a binary network, only return non-zero edges
  function filterWeightedNetworks() {
    var networkTypeFilter = isWeighted ? function() {return true;} : binaryNetworkFilter;

    networkData.edges = networkData.edges.filter(networkTypeFilter);
  }

  dataManager.filterNetworkData = function() {
    // Filter by connections within or between brain regions
    networkData.edges = edgeData
      .filter(edgeFilterByConnection[edgeFilterType])
      .map(function(e) {
        var edgeKey = e.source.channelID + '_' + e.target.channelID;
        if (filteredEdgesMap.has(edgeKey)) {
          // If object already exists in filtered edges, just return the object
          return filteredEdgesMap.get(edgeKey);
        } else {
          // Else push a shallow copy of the object to the edge array
          var obj = copyObject(e);
          return obj;
        };

      });

    changeTimeFreq();
    filterWeightedNetworks();
    setFilteredMaps();

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
