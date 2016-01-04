(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define('spectraVis', ['exports'], factory) :
  (factory((global.spectraVis = {})));
}(this, function (exports) { 'use strict';

  function copyObject(obj) {
    var newObj = {};
    for (var key in obj) {
      // Copy all the fields
      newObj[key] = obj[key];
    }

    return newObj;
  }

  function edgeFilterBetween(e) {
    var showEdge = (e.source.region !== e.target.region);
    return showEdge;
  }

  function edgeFilterWithin(e) {
    var showEdge = (e.source.region === e.target.region);
    return showEdge;
  }

  var edgeFilterByConnection = {
    Within: edgeFilterWithin,
    Between: edgeFilterBetween,
    All: function() {return true;},
  };

  function binaryNetworkFilter(e) {
    return e.data !== 0;
  }

  const NUM_EDGE_COLORS = 11;
  const NUM_CHANNEL_COLORS = 11;

  // Reverse the colors
  var edgeStatColors = [];
  colorbrewer.RdBu[NUM_EDGE_COLORS].forEach(function(color) {
    edgeStatColors.unshift(color);
  });

  var channelStatColors = [];
  colorbrewer.PiYG[NUM_CHANNEL_COLORS].forEach(function(color) {
    channelStatColors.unshift(color);
  });

  var brainRegionColors = colorbrewer.Pastel1[7];

  function getSymmetricDomain(min, max, numBins) {
    if (Math.abs(min) >= Math.abs(max)) {
      max = Math.abs(min);
    } else {
      min = -1 * max;
    }

    return linspace(min, max, numBins);
  }

  // from https://github.com/sloisel/numeric
  function linspace(a, b, n) {
    if (typeof n === 'undefined') {
      n = Math.max(Math.round(b - a) + 1, 1);
    };

    if (n < 2) {
      return n === 1 ? [a] : [];
    }

    var i;
    var ret = Array(n);
    n--;
    for (i = n; i >= 0; i--) {
      ret[i] = (i * b + (n - i) * a) / n;
    }

    return ret;
  }

  function getDomain(data, numBins) {
    var min = d3.min(data, function(d) {
      return d3.min(d.data, function(e) {
        return d3.min(e, function(f) {
          return f;
        });
      });
    });

    var max = d3.max(data, function(d) {
      return d3.max(d.data, function(e) {
        return d3.max(e, function(f) {
          return f;
        });
      });
    });

    return getSymmetricDomain(min, max, numBins);
  }

  function createEdgeScale(edgeData, isWeighted) {
    if (isWeighted) {
      var edgeStatScale = d3.scale.linear()
        .domain(getDomain(edgeData, NUM_EDGE_COLORS))
        .range(edgeStatColors);
    } else {
      var edgeStatBinaryColors = [0, (NUM_EDGE_COLORS - 1) / 2, NUM_EDGE_COLORS - 1].map(function(n) { return edgeStatColors[n];});

      edgeStatScale = d3.scale.ordinal()
        .domain([-1, 0, 1])
        .range(edgeStatBinaryColors);
    }

    return edgeStatScale;
  }

  function networkDataManager() {

    var edgeData = {};
    var channelData = {};
    var edgeInd;
    var networkData = {
          nodes: [],
          edges: [],
        };
    var isWeighted = false;
    var aspectRatio;
    var isFixed = false;
    var isFreq = false;
    var imageLink = '';
    var curTimeInd;
    var curFreqInd;
    var edgeStatID = '';
    var subjectID = '';
    var networkLayout = '';
    var times = [];
    var frequencies = [];
    var curTime = '';
    var curFreq = '';
    var edgeStatScale;
    var edgeFilterType = '';
    var brainXLim;
    var brainYLim;
    var brainRegionScale = {};
    var brainRegions = [];
    var dispatch = d3.dispatch('dataReady', 'networkChange');
    var isLoaded = false;
    var allNodesMap = d3.map();
    var filteredNodesMap = {};
    var allEdgesMap = {};
    var filteredEdgesMap = {};
    var dataManager = {};

    dataManager.loadNetworkData = function() {
      var edgeFile = 'edges_' + subjectID + '_' + edgeStatID + '.json';
      var channelFile = 'channels_' + subjectID + '.json';

      allEdgesMap = d3.map();
      filteredEdgesMap = d3.map();
      allNodesMap = d3.map();
      filteredNodesMap = d3.map();

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
            allNodesMap.set(subjectID + '_' + obj.channelID, n);
            filteredNodesMap.set(subjectID + '_' + obj.channelID, obj);
            return obj;
          });

          // Replace source name by source object
          edgeData = edge.map(function(e) {
            allEdgesMap.set(subjectID + '_' + e.source + '_' + e.target, e);
            e.source = filteredNodesMap.get(subjectID + '_' + e.source);
            e.target = filteredNodesMap.get(subjectID + '_' + e.target);
            networkData.edges.push(copyObject(e));
            return e;
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
        var edgeKey = subjectID + '_' + e.source.channelID + '_' + e.target.channelID;
        e.data = allEdgesMap.get(edgeKey).data[curTimeInd][curFreqInd];
      });

    };

    // Map the filtered edges to the edge name
    function setFilteredMaps() {
      filteredEdgesMap = d3.map();
      filteredNodesMap = d3.map();
      networkData.edges.forEach(function(e) {
        filteredEdgesMap.set(subjectID + '_' + e.source.channelID + '_' + e.target.channelID, e);
      });

      networkData.nodes.forEach(function(n) {
        filteredNodesMap.set(subjectID + '_' + n.channelID, n);
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
          var edgeKey = subjectID + '_' + e.source.channelID + '_' + e.target.channelID;
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

    dataManager.networkLayout = function(value) {
      if (!arguments.length) return networkLayout;
      networkLayout = value;
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

  function drawNodes () {

    var nodeColor = function() {return '#888888';};

    var nodeRadius = 10;

    function chart(selection) {
      selection.each(function(data) {
        var nodeCircle = d3.select(this).selectAll('circle.node').data([data]);

        nodeCircle.enter()
          .append('circle')
          .attr('class', 'node')
          .attr('opacity', 1);
        nodeCircle
          .attr('r', nodeRadius)
          .attr('fill', function(d) {
            return nodeColor(d.region);
          })
          .style('stroke', 'white');

        var nodeText = d3.select(this).selectAll('text.nodeLabel').data([data]);

        nodeText.enter()
          .append('text')
          .attr('class', 'nodeLabel');
        nodeText
          .text(function(d) {
            return d.channelID;
          });
      });
    };

    chart.nodeColor = function(value) {
      if (!arguments.length) return nodeColor;
      nodeColor = value;
      return chart;
    };

    chart.nodeRadius = function(value) {
      if (!arguments.length) return nodeRadius;
      nodeRadius = value;
      return chart;
    };

    return chart;
  }

  function insertImage(imageLink, imageSelection) {
    if (imageLink === '' || imageSelection[0][0] === null) return;
    getImageBase64(imageLink, function(error, d) {
      imageSelection
        .attr('xlink:href', 'data:image/png;base64,' + d);
    });
  }

  function converterEngine(input) { // fn BLOB => Binary => Base64 ?
    var uInt8Array = new Uint8Array(input);
    var i = uInt8Array.length;
    var biStr = []; //new Array(i);
    while (i--) {
      biStr[i] = String.fromCharCode(uInt8Array[i]);
    }

    var base64 = window.btoa(biStr.join(''));
    return base64;
  };

  function getImageBase64(url, callback) {
    var xhr = new XMLHttpRequest(url);
    var img64;
    xhr.open('GET', url, true); // url is the url of a PNG/JPG image.
    xhr.responseType = 'arraybuffer';
    xhr.callback = callback;
    xhr.onload = function() {
      img64 = converterEngine(this.response); // convert BLOB to base64
      this.callback(null, img64); // callback : err, data
    };

    xhr.onerror = function() {
      callback('B64 ERROR', null);
    };

    xhr.send();
  };

  function networkChart () {
    // Defaults
    var margin = {top: 0, right: 0, bottom: 0, left: 0};
    var outerWidth = 960;
    var outerHeight = 500;
    var xScale = d3.scale.linear();
    var yScale = d3.scale.linear();
    var xScaleDomain;
    var yScaleDomain;
    var edgeStatScale = function() {return '#cccccc';};

    var nodeColorScale = function() {return '#888888';};

    var edgeWidth = 2;
    var nodeRadius = 10;
    var imageLink = '';
    var force = d3.layout.force();
    var networkLayout = '';

    var chartDispatcher = d3.dispatch('nodeMouseClick', 'edgeMouseClick', 'edgeMouseOver', 'edgeMouseOut');

    function chart(selection) {
      var innerWidth = outerWidth - margin.left - margin.right;
      var innerHeight = outerHeight - margin.top - margin.bottom;

      selection.each(function(data) {
        var svg = d3.select(this).selectAll('svg').data([data]);

        force.stop();

        (networkLayout.toUpperCase() === 'ANATOMICAL') ? fixNodes() : unfixNodes();
        var imageLinkFiltered = (networkLayout.toUpperCase() === 'ANATOMICAL') ? imageLink : '';

        // Initialize the chart
        var enterG = svg.enter()
          .append('svg')
            .append('g');
        enterG
          .append('g')
            .attr('class', 'networkBackgroundImage');
        enterG
          .append('g')
          .attr('class', 'networkEdges');
        enterG
          .append('g')
          .attr('class', 'networkNodes');

        // Update svg size, drawing area, and scales
        svg
          .attr('width', innerWidth + margin.left + margin.right)
          .attr('height', innerHeight + margin.top + margin.bottom);
        svg.select('g')
          .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

        xScale
          .domain(xScaleDomain)
          .range([0, innerWidth]);
        yScale
          .domain(yScaleDomain)
          .range([innerHeight, 0]);

        // Append background image link
        var imageSelection = svg.select('.networkBackgroundImage').selectAll('image').data([imageLinkFiltered], function(d) {return d;});

        var imageEnter = imageSelection.enter()
          .append('image')
          .attr('width', innerWidth)
          .attr('height', innerHeight);

        imageSelection.exit().remove();
        insertImage(imageLinkFiltered, imageEnter);

        // Initialize edges
        var edgeLine = svg.select('g.networkEdges').selectAll('line.edge').data(data.edges);

        edgeLine.enter()
          .append('line')
            .attr('class', 'edge')
            .style('stroke-width', edgeWidth)
            .attr('x1', function(d) {
              return xPos(d.source);
            })
            .attr('y1', function(d) {
              return yPos(d.source);
            })
            .attr('x2', function(d) {
              return xPos(d.target);
            })
            .attr('y2', function(d) {
              return yPos(d.target);
            });

        edgeLine.exit()
          .remove();
        edgeLine
          .style('stroke', function(d) {
            return edgeStatScale(d.data);
          })
          .on('mouseover', chartDispatcher.edgeMouseOver)
          .on('mouseout', chartDispatcher.edgeMouseOut)
          .on('click', chartDispatcher.edgeMouseClick);

        // Initialize nodes
        var nodeG = svg.select('g.networkNodes').selectAll('g.gnode').data(data.nodes);

        nodeG.enter()
          .append('g')
          .attr('class', 'gnode')
          .attr('transform', function(d) {
            return 'translate(' + [xPos(d), yPos(d)] + ')';
          })
          .on('click', chartDispatcher.nodeMouseClick);

        nodeG.exit().remove();

        var nodes = drawNodes()
          .nodeColor(nodeColorScale);

        nodeG.call(nodes);

        force = d3.layout.force()
            .nodes(data.nodes)
            .links(data.edges)
            .charge(-375)
            .linkDistance(innerHeight / 3)
            .size([innerWidth, innerHeight])
            .start();

        // For every iteration of force simulation 'tick'
        force.on('tick', function() {

          if (nodeG.data()[0].fixed) force.stop();

          // Translate the groups
          nodeG.attr('transform', function(d) {
            return 'translate(' + [xPos(d), yPos(d)] + ')';
          });

          edgeLine.attr('x1', function(d) {
              return xPos(d.source);
            })
            .attr('y1', function(d) {
              return yPos(d.source);
            })
            .attr('x2', function(d) {
              return xPos(d.target);
            })
            .attr('y2', function(d) {
              return yPos(d.target);
            });
        });

        function xPos(d) {
          if (typeof d.x === 'undefined' || d.fixed) {
            d.x = xScale(d.fixedX);
            d.px = xScale(d.fixedX);
            return d.x;
          } else {
            return Math.max(nodeRadius, Math.min(innerWidth - nodeRadius, d.x));
          }

        }

        function yPos(d) {
          if (typeof d.y === 'undefined' || d.fixed) {
            d.y = yScale(d.fixedY);
            d.py = yScale(d.fixedY);
            return d.y;
          } else {
            return Math.max(nodeRadius, Math.min(innerHeight - nodeRadius, d.y));
          }

        }

        function fixNodes() {
          data.nodes.forEach(function(n) {
            n.fixed = true;
            n.x = undefined;
            n.y = undefined;
            n.px = undefined;
            n.py = undefined;
          });
        }

        function unfixNodes() {
          data.nodes.forEach(function(n) {
            n.fixed = false;
          });
        }

      });
    }

    chart.width = function(value) {
      if (!arguments.length) return outerWidth;
      outerWidth = value;
      return chart;
    };

    chart.height = function(value) {
      if (!arguments.length) return outerHeight;
      outerHeight = value;
      return chart;
    };

    chart.margin = function(value) {
      if (!arguments.length) return margin;
      margin = value;
      return chart;
    };

    chart.xScaleDomain = function(value) {
      if (!arguments.length) return xScaleDomain;
      xScaleDomain = value;
      return chart;
    };

    chart.yScaleDomain = function(value) {
      if (!arguments.length) return yScaleDomain;
      yScaleDomain = value;
      return chart;
    };

    chart.yScaleDomain = function(value) {
      if (!arguments.length) return yScaleDomain;
      yScaleDomain = value;
      return chart;
    };

    chart.nodeRadius = function(value) {
      if (!arguments.length) return nodeRadius;
      nodeRadius = value;
      return chart;
    };

    chart.edgeWidth = function(value) {
      if (!arguments.length) return edgeWidth;
      edgeWidth = value;
      return chart;
    };

    chart.edgeStatScale = function(value) {
      if (!arguments.length) return edgeStatScale;
      edgeStatScale = value;
      return chart;
    };

    chart.nodeColorScale = function(value) {
      if (!arguments.length) return nodeColorScale;
      nodeColorScale = value;
      return chart;
    };

    chart.imageLink = function(value) {
      if (!arguments.length) return imageLink;
      imageLink = value;
      return chart;
    };

    chart.networkLayout = function(value) {
      if (!arguments.length) return networkLayout;
      networkLayout = value;
      return chart;
    };

    d3.rebind(chart, chartDispatcher, 'on');

    return chart;
  }

  function edgeMouseOver(e) {

    var curEdge = d3.select(this);
    var strokeStyle = curEdge.style('stroke');
    var strokeWidth = +/\d+/.exec(curEdge.style('stroke-width'));
    var strokeWidthUnits = /[a-z]+/.exec(curEdge.style('stroke-width'));
    curEdge
      .style('stroke-width', (2 * strokeWidth) + strokeWidthUnits);

    var curNodes = d3.selectAll('circle.node')
      .filter(function(n) {
        return (n.channelID === e.source.channelID) || (n.channelID === e.target.channelID);
      })
      .attr('transform', 'scale(1.2)');
  }

  function edgeMouseOut(e) {

    var curEdge = d3.select(this);
    var strokeWidth = +/\d+/.exec(curEdge.style('stroke-width'));
    var strokeWidthUnits = /[a-z]+/.exec(curEdge.style('stroke-width'));
    curEdge
      .style('stroke-width', (0.5 * strokeWidth) + strokeWidthUnits);

    var curNodes = d3.selectAll('circle.node')
      .filter(function(n) {
        return (n.channelID === e.source.channelID) || (n.channelID === e.target.channelID);
      })
      .attr('transform', 'scale(1)');
  }

  function createChannelScale(channel1Data, channel2Data) {

    var domain = getDomain([channel1Data, channel2Data], NUM_CHANNEL_COLORS);

    var channelStatScale = d3.scale.linear()
      .domain(domain)
      .range(channelStatColors);

    return channelStatScale;
  }

  function channelDataManager() {

    var subjectID = '';
    var channel1ID = '';
    var channel2ID = '';
    var channel1Data = [];
    var channel2Data = [];
    var isFreq = true;
    var channelStatScale = {};
    var times = [];
    var frequencies = [];
    var dispatch = d3.dispatch('channelDataReady');
    var dataManager = {};

    dataManager.loadChannelData = function() {
      if (channel1ID === '' || channel2ID === '' || subjectID === '') {
        dispatch.channelDataReady();
        return;
      }

      var channel1File = 'spectrogram_' + subjectID + '_' + channel1ID + '.json';
      var channel2File = 'spectrogram_' + subjectID + '_' + channel2ID + '.json';

      queue()
        .defer(d3.json, 'DATA/' + channel1File)
        .defer(d3.json, 'DATA/' + channel2File)
        .await(function(error, channel1, channel2) {
          channel1Data = channel1.data;
          channel2Data = channel2.data;
          channelStatScale = createChannelScale(channel1, channel2);
          dispatch.channelDataReady();
        });
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

    dataManager.channelStatScale = function(value) {
      if (!arguments.length) return channelStatScale;
      channelStatScale = value;
      return dataManager;
    };

    dataManager.channel1Data = function(value) {
      if (!arguments.length) return channel1Data;
      channel1Data = value;
      return dataManager;
    };

    dataManager.channel2Data = function(value) {
      if (!arguments.length) return channel2Data;
      channel2Data = value;
      return dataManager;
    };

    dataManager.isFreq = function(value) {
      if (!arguments.length) return isFreq;
      isFreq = value;
      return dataManager;
    };

    dataManager.subjectID = function(value) {
      if (!arguments.length) return subjectID;
      subjectID = value;
      return dataManager;
    };

    dataManager.channel1ID = function(value) {
      if (!arguments.length) return channel1ID;
      channel1ID = value;
      return dataManager;
    };

    dataManager.channel2ID = function(value) {
      if (!arguments.length) return channel2ID;
      channel2ID = value;
      return dataManager;
    };

    d3.rebind(dataManager, dispatch, 'on');

    return dataManager;
  }

  function heatmapChart() {
    var colorScale = function() {return '#888888';};

    var margin = {top: 30, right: 30, bottom: 30, left: 30};
    var outerWidth = 500;
    var outerHeight = 500;

    var xScaleDomain = [];
    var yScaleDomain = [];
    var xScale = d3.scale.ordinal();
    var yScale = d3.scale.ordinal();
    var xLabel = '';
    var yLabel = '';
    var chartDispatcher = d3.dispatch('rectMouseOver', 'rectMouseClick');

    function chart(selection) {

      var innerWidth = outerWidth - margin.left - margin.right;
      var innerHeight = outerHeight - margin.top - margin.bottom;

      selection.each(function(data) {
        var heatmapG;
        var heatmapRect;
        var xAxis;
        var yAxis;
        var zeroG;
        var xAxisG;
        var yAxisG;
        var zeroLine;

        var svg = d3.select(this).selectAll('svg').data([data]);

        // Initialize the chart
        svg.enter()
          .append('svg')
            .append('g');

        var curPlot = svg.select('g');

        // Update svg size, drawing area, and scales
        svg
          .attr('width', innerWidth + margin.left + margin.right)
          .attr('height', innerHeight + margin.top + margin.bottom);
        curPlot
          .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

        xScale.domain(xScaleDomain);
        xScale.rangeBands([0, innerWidth]);

        yScale.domain(yScaleDomain);
        yScale.rangeBands([innerHeight, 0]);

        heatmapG = curPlot.selectAll('g.heatmapX').data(data);
        heatmapG.enter()
          .append('g')
          .attr('transform', function(d, i) {
            return 'translate(' + xScale(xScale.domain()[i]) + ', 0)';
          })
          .attr('class', 'heatmapX');
        heatmapG.exit()
          .remove();
        heatmapRect = heatmapG.selectAll('rect').data(function(d) {
          return d;
        });

        heatmapRect.enter()
          .append('rect')
          .attr('x', 0)
          .attr('y', function(d, i) {
            return yScale(yScale.domain()[i]);
          })
          .attr('height', yScale.rangeBand())
          .attr('width', xScale.rangeBand())
          .style('fill', 'white');
        heatmapRect
          .style('fill', function(d) {
            return colorScale(d);
          })
          .style('stroke', function(d) {
            return colorScale(d);
          })
          .on('mouseover', chartDispatcher.rectMouseOver)
          .on('click', chartDispatcher.rectMouseClick);
        heatmapRect.exit()
          .remove();

        xAxis = d3.svg.axis()
          .scale(xScale)
          .orient('bottom')
          .ticks(3)
          .tickValues([d3.min(xScale.domain()), 0, d3.max(xScale.domain())])
          .tickSize(0, 0, 0);
        yAxis = d3.svg.axis()
          .scale(yScale)
          .orient('left')
          .tickValues(['10', '20', '40', '60', '90', '150', '200'])
          .tickSize(0, 0, 0);

        xAxisG = curPlot.selectAll('g.axis#x').data([{}]);
        xAxisG.enter()
          .append('g')
          .attr('class', 'axis')
          .attr('id', 'x')
          .attr('transform', 'translate(0,' + innerHeight + ')')
          .append('text')
          .attr('x', xScale(0))
          .attr('y', 0)
          .attr('text-anchor', 'middle')
          .attr('dy', 2 + 'em')
          .text(xLabel);
        xAxisG.call(xAxis);

        yAxisG = curPlot.selectAll('g.axis#y').data([{}]);
        yAxisG.enter()
          .append('g')
          .attr('class', 'axis')
          .attr('id', 'y')
          .append('text')
          .attr('x', -innerHeight / 2)
          .attr('dy', -2 + 'em')
          .attr('transform', 'rotate(-90)')
          .attr('text-anchor', 'middle')
          .text(yLabel);
        yAxisG.call(yAxis);

        zeroG = curPlot.selectAll('g.zeroLine').data([
          [
            [0, innerHeight],
          ],
        ]);
        zeroG.enter()
          .append('g')
          .attr('class', 'zeroLine');
        zeroLine = zeroG.selectAll('path').data(function(d) {
          return d;
        });

        zeroLine.enter()
          .append('path');
        zeroLine
          .attr('d', d3.svg.line()
            .x(xScale(0))
            .y(function(d) {
              return d;
            })
            .interpolate('linear'))
          .attr('stroke', 'black')
          .attr('stroke-width', 2)
          .attr('fill', 'none')
          .style('opacity', 0.7);
      });
    }

    chart.colorScale = function(scale) {
      if (!arguments.length) return colorScale;
      colorScale = scale;
      return chart;
    };

    chart.xScaleDomain = function(scale) {
      if (!arguments.length) return xScaleDomain;
      xScaleDomain = scale;
      return chart;
    };

    chart.yScaleDomain = function(scale) {
      if (!arguments.length) return yScaleDomain;
      yScaleDomain = scale;
      return chart;
    };

    chart.width = function(value) {
      if (!arguments.length) return outerWidth;
      outerWidth = value;
      return chart;
    };

    chart.height = function(value) {
      if (!arguments.length) return outerHeight;
      outerHeight = value;
      return chart;
    };

    chart.yLabel = function(value) {
      if (!arguments.length) return yLabel;
      yLabel = value;
      return chart;
    };

    chart.xLabel = function(value) {
      if (!arguments.length) return xLabel;
      xLabel = value;
      return chart;
    };

    d3.rebind(chart, chartDispatcher, 'on');

    return chart;
  }

  var channelData = channelDataManager();
  var heatmap = heatmapChart();

  channelData.on('channelDataReady', function() {
    if (channelData.channel1ID() === '' || channelData.channel2ID() === '') {
      d3.selectAll('.electrode-pair').style('display', 'none');
    } else {
      d3.selectAll('.electrode-pair').style('display', 'block');
      var panelWidth = document.getElementById('Ch1Panel').offsetWidth;
      var panelHeight = panelWidth * (4 / 5);

      heatmap
        .width(panelWidth)
        .height(panelHeight)
        .xScaleDomain(channelData.times())
        .yScaleDomain(channelData.frequencies())
        .colorScale(channelData.channelStatScale());

      d3.selectAll('.individual')
        .data([channelData.channel1Data(), channelData.channel2Data()])
        .call(heatmap);
    };

  });

  function highlightElectrodePair() {
    // Highlight selected electrode pair
    d3.selectAll('circle.node').style('stroke', 'white');
    d3.selectAll('circle.node').filter(function(n) {
        return (n.channelID === channelData.channel1ID()) || (n.channelID === channelData.channel2ID());
      })
      .style('stroke', 'black');
  }

  function nodeMouseClick(n) {
    var curNode = d3.select(this);
    curNode.classed('node-clicked', !curNode.classed('node-clicked'));
    d3.selectAll('.gnode').selectAll('circle').attr('transform', 'scale(1)');
    d3.selectAll('.node-clicked').selectAll('circle').attr('transform', 'scale(1.2)');

    var numClicked = d3.selectAll('.node-clicked')[0].length;
    if (numClicked >= 2) {
      var channelIDs = d3.selectAll('.node-clicked').data().map(function(d) {return d.channelID;});

      var curCh1 = channelIDs[0];
      var curCh2 = channelIDs[1];
      channelData
        .channel1ID(curCh1)
        .channel2ID(curCh2)
        .loadChannelData();

      highlightElectrodePair();

      d3.selectAll('.node-clicked').classed('node-clicked', false);
      d3.selectAll('.gnode').selectAll('circle').attr('transform', 'scale(1)');
    }
  }

  function edgeMouseClick(e) {
    var re = /\d+/;
    var curCh1 = re.exec(e.source.channelID)[0];
    var curCh2 = re.exec(e.target.channelID)[0];
    channelData
      .channel1ID(curCh1)
      .channel2ID(curCh2)
      .loadChannelData();

    highlightElectrodePair();

    // mouseFlag = true;
    // svgNetworkMap.select('text#HOLD').remove();
  }

  var networkView = networkChart();

  networkView.on('edgeMouseOver', edgeMouseOver);
  networkView.on('edgeMouseOut', edgeMouseOut);
  networkView.on('nodeMouseClick', nodeMouseClick);
  networkView.on('edgeMouseClick', edgeMouseClick);

  function createSlider() {

    var stepSize;
    var domain;
    var maxStepInd;
    var units;
    var curValue;
    var minValue;
    var maxValue;
    var running = false;
    var delay = 200;
    var dispatch = d3.dispatch('sliderChange', 'start', 'stop');

    function slider(selection) {
      selection.each(function(value) {
        var input = d3.select(this).selectAll('input');
        var output = d3.select(this).selectAll('output');
        stepSize = d3.round(domain[1] - domain[0], 4);
        maxStepInd = domain.length - 1;
        curValue = value;
        minValue = d3.min(domain);
        maxValue = d3.max(domain);

        input.property('min', minValue);
        input.property('max', maxValue);
        input.property('step', stepSize);
        input.property('value', value);
        input.on('input', function() {
          dispatch.sliderChange(+this.value);
        });

        output.text(value + ' ' + units);
      });
    };

    slider.stepSize = function(value) {
      if (!arguments.length) return stepSize;
      stepSize = value;
      return slider;
    };

    slider.running = function(value) {
      if (!arguments.length) return running;
      running = value;
      return slider;
    };

    slider.delay = function(value) {
      if (!arguments.length) return delay;
      delay = value;
      return slider;
    };

    slider.domain = function(value) {
      if (!arguments.length) return domain;
      domain = value;
      return slider;
    };

    slider.units = function(value) {
      if (!arguments.length) return units;
      units = value;
      return slider;
    };

    slider.maxStepInd = function(value) {
      if (!arguments.length) return maxStepInd;
      maxStepInd = value;
      return slider;
    };

    slider.curValue = function(value) {
      if (!arguments.length) return curValue;
      curValue = value;
      return slider;
    };

    slider.play = function() {
      running = true;
      dispatch.start();

      var t = setInterval(step, delay);

      function step() {
        if (curValue < maxValue && running) {
          curValue += stepSize;
          dispatch.sliderChange(curValue);
        } else {
          dispatch.stop();
          running = false;
          clearInterval(t);
        }
      }
    };

    slider.stop = function() {
      running = false;
      dispatch.stop();
    };

    slider.reset = function() {
      running = false;
      dispatch.sliderChange(minValue);
      dispatch.stop();
    };

    d3.rebind(slider, dispatch, 'on');

    return slider;

  }

  var freqSlider = createSlider();
  freqSlider.on('sliderChange', function(curFreq) {
    networkData
      .curFreq(curFreq)
      .filterNetworkData();
  });

  var timeSlider = createSlider();
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

  function createDropdown() {
    var key;
    var displayName;
    var options;
    var dispatch = d3.dispatch('click');

    function button(selection) {
      selection.each(function(data) {
        var menu = d3.select(this).selectAll('ul').selectAll('li').data(options, function(d) {
          return d[key];
        });

        displayName = (typeof displayName === 'undefined') ? key : displayName;

        menu.enter()
          .append('li')
            .attr('id', function(d) {
              return d[key];
            })
            .attr('role', 'presentation')
            .append('a')
              .attr('role', 'menuitem')
              .attr('tabindex', -1)
              .text(function(d) {
                return d[displayName];
              });

        menu.on('click', dispatch.click);

        menu.exit().remove();

        var curText = options.filter(function(d) {return d[key] === data;})
          .map(function(d) {return d[displayName];})[0];

        d3.select(this).selectAll('button')
          .text(curText)
          .append('span')
          .attr('class', 'caret');
      });

    }

    button.key = function(value) {
      if (!arguments.length) return key;
      key = value;
      return button;
    };

    button.options = function(value) {
      if (!arguments.length) return options;
      options = value;
      return button;
    };

    button.displayName = function(value) {
      if (!arguments.length) return displayName;
      displayName = value;
      return button;
    };

    d3.rebind(button, dispatch, 'on');

    return button;

  }

  var subjectDropdown = createDropdown().key('subjectID');
  subjectDropdown.on('click', function() {
    var curSubjectInfo = d3.select(this).data()[0];
    channelData
      .subjectID(curSubjectInfo.subjectID)
      .channel1ID('')
      .channel2ID('')
      .loadChannelData();

    networkData
      .subjectID(curSubjectInfo.subjectID)
      .aspectRatio(curSubjectInfo.brainXpixels / curSubjectInfo.brainYpixels)
      .brainXLim(curSubjectInfo.brainXLim)
      .brainYLim(curSubjectInfo.brainYLim)
      .loadNetworkData();
  });

  var edgeStatIDDropdown = createDropdown().key('edgeStatID').displayName('edgeStatName');
  edgeStatIDDropdown.on('click', function() {
    var curEdgeInfo = d3.select(this).data()[0];
    networkData
      .edgeStatID(curEdgeInfo.edgeStatID)
      .isFreq(curEdgeInfo.isFreq)
      .isWeighted(curEdgeInfo.isWeightedNetwork)
      .loadNetworkData();
  });

  var filterTypes = [
  	{
      filterName: 'All Edges',
      filterType: 'All',
    },
    {
      filterName: 'Within Area Edges',
      filterType: 'Within',
    },
    {
      filterName: 'Between Area Edges',
      filterType: 'Between',
    },
  ];

  var edgeFilterDropdown = createDropdown()
    .key('filterType')
    .displayName('filterName')
    .options(filterTypes);

  edgeFilterDropdown.on('click', function() {
    var edgeFilter = d3.select(this).data()[0];
    networkData
      .edgeFilterType(edgeFilter.filterType)
      .filterNetworkData();
  });

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

    highlightElectrodePair();
  });

  var playButton = d3.select('#playButton');
  playButton.on('click', function() {
    timeSlider.running() ? timeSlider.stop() : timeSlider.play();
  });

  var resetButton = d3.select('#resetButton');

  resetButton.on('click', function() {
    timeSlider.reset();
  });

  var networkViewRadio = d3.select('#NetworkLayoutPanel');
  networkViewRadio.selectAll('input').on('click', function() {
      networkViewRadio.selectAll('input')
        .property('checked', false);
      d3.select(this).property('checked', true);
      networkView.networkLayout(this.value);
      d3.selectAll('#NetworkPanel')
          .call(networkView);
    });

  function download (svgInfo, filename) {
    window.URL = (window.URL || window.webkitURL);
    var blob = new Blob(svgInfo.source, {type: 'text\/xml'});
    var url = window.URL.createObjectURL(blob);
    var body = document.body;
    var a = document.createElement('a');

    body.appendChild(a);
    a.setAttribute('download', filename + '.svg');
    a.setAttribute('href', url);
    a.style.display = 'none';
    a.click();
    a.parentNode.removeChild(a);

    setTimeout(function() {
      window.URL.revokeObjectURL(url);
    }, 10);
  }

  var prefix = {
    svg: 'http://www.w3.org/2000/svg',
    xhtml: 'http://www.w3.org/1999/xhtml',
    xlink: 'http://www.w3.org/1999/xlink',
    xml: 'http://www.w3.org/XML/1998/namespace',
    xmlns: 'http://www.w3.org/2000/xmlns/',
  };

  function setInlineStyles (svg) {

    // add empty svg element
    var emptySvg = window.document.createElementNS(prefix.svg, 'svg');
    window.document.body.appendChild(emptySvg);
    var emptySvgDeclarationComputed = window.getComputedStyle(emptySvg);

    // hardcode computed css styles inside svg
    var allElements = traverse(svg);
    var i = allElements.length;
    while (i--) {
      explicitlySetStyle(allElements[i]);
    }

    emptySvg.parentNode.removeChild(emptySvg);

    function explicitlySetStyle(element) {
      var cSSStyleDeclarationComputed = window.getComputedStyle(element);
      var i;
      var len;
      var key;
      var value;
      var computedStyleStr = '';

      for (i = 0, len = cSSStyleDeclarationComputed.length; i < len; i++) {
        key = cSSStyleDeclarationComputed[i];
        value = cSSStyleDeclarationComputed.getPropertyValue(key);
        if (value !== emptySvgDeclarationComputed.getPropertyValue(key)) {
          // Don't set computed style of width and height. Makes SVG elmements disappear.
          if ((key !== 'height') && (key !== 'width')) {
            computedStyleStr += key + ':' + value + ';';
          }

        }
      }

      element.setAttribute('style', computedStyleStr);
    }

    function traverse(obj) {
      var tree = [];
      tree.push(obj);
      visit(obj);
      function visit(node) {
        if (node && node.hasChildNodes()) {
          var child = node.firstChild;
          while (child) {
            if (child.nodeType === 1 && child.nodeName != 'SCRIPT') {
              tree.push(child);
              visit(child);
            }

            child = child.nextSibling;
          }
        }
      }

      return tree;
    }
  }

  function preprocess (svg) {
    svg.setAttribute('version', '1.1');

    // removing attributes so they aren't doubled up
    svg.removeAttribute('xmlns');
    svg.removeAttribute('xlink');

    // These are needed for the svg
    if (!svg.hasAttributeNS(prefix.xmlns, 'xmlns')) {
      svg.setAttributeNS(prefix.xmlns, 'xmlns', prefix.svg);
    }

    if (!svg.hasAttributeNS(prefix.xmlns, 'xmlns:xlink')) {
      svg.setAttributeNS(prefix.xmlns, 'xmlns:xlink', prefix.xlink);
    }

    setInlineStyles(svg);

    var xmls = new XMLSerializer();
    var source = xmls.serializeToString(svg);
    var doctype = '<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">';
    var rect = svg.getBoundingClientRect();
    var svgInfo = {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      class: svg.getAttribute('class'),
      id: svg.getAttribute('id'),
      childElementCount: svg.childElementCount,
      source: [doctype + source],
    };

    return svgInfo;
  }

  function save(svgElement, config) {
    if (svgElement.nodeName !== 'svg' || svgElement.nodeType !== 1) {
      throw 'Need an svg element input';
    }

    var config = config || {};
    var svgInfo = preprocess(svgElement, config);
    var defaultFileName = getDefaultFileName(svgInfo);
    var filename = config.filename || defaultFileName;
    var svgInfo = preprocess(svgElement);
    download(svgInfo, filename);
  }

  function getDefaultFileName(svgInfo) {
    var defaultFileName = 'untitled';
    if (svgInfo.id) {
      defaultFileName = svgInfo.id;
    } else if (svgInfo.class) {
      defaultFileName = svgInfo.class;
    } else if (window.document.title) {
      defaultFileName = window.document.title.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    }

    return defaultFileName;
  }

  var exportButton = d3.select('button#export');

  var curCh1 = ''; // dummy to be removed later
  var curCh2 = ''; // dummy to be removed later

  exportButton
    .on('click', function() {
      var networkSVG = d3.select('#NetworkPanel').select('svg').node();
      var networkSaveName = 'Network' + '_' +
        networkData.subjectID() + '_' +
        networkData.edgeStatID() + '_' +
        networkView.networkLayout() + '_' +
        networkData.curTime() + timeSlider.units() + '_' +
        networkData.curFreq() + freqSlider.units();

      save(networkSVG, {filename: networkSaveName});

      var ch1SaveName = 'Spectra' + '_' +
        networkData.subjectID() + '_' +
        'Ch' + curCh1;

      var ch1SVG = d3.select('#SpectraCh1Panel').select('svg').node();
      save(ch1SVG, {filename: ch1SaveName});

      var ch2SaveName = 'Spectra' + '_' +
        networkData.subjectID() + '_' +
        'Ch' + curCh2;

      var ch2SVG = d3.select('#SpectraCh2Panel').select('svg').node();
      save(ch2SVG, {filename: ch2SaveName});

      var edgeSaveName = networkData.edgeStatID() + '_' +
        networkData.subjectID() + '_' +
        'Ch' + curCh1 + '_' +
        'Ch' + curCh2;

      var edgeSVG = d3.select('#EdgeStatPanel').select('svg').node();
      save(edgeSVG, {filename: edgeSaveName});

      d3.selectAll('circle.node')[0]
        .forEach(function(n) {n.setAttribute('style', '');
      });
    });

  // dummy placeholder to be removed when spectra are implemented
  var curCh1$1 = '';
  var curCh2$1 = '';

  var permalinkBox = d3.select('#permalink');
  var permalinkButton = d3.select('button#link');
  permalinkButton
    .on('click', function() {
      permalinkBox
        .style('display', 'block');
      var linkString = window.location.origin + window.location.pathname + '?' +
        'curSubject=' + networkData.subjectID() +
        '&edgeStatID=' + networkData.edgeStatID() +
        '&edgeFilter=' + networkData.edgeFilterType() +
        '&networkLayout=' + networkView.networkLayout() +
        '&curTime=' + networkData.curTime() +
        '&curFreq=' + networkData.curFreq() +
        '&curCh1=' + curCh1$1 +
        '&curCh2=' + curCh2$1;
      permalinkBox.selectAll('textarea').html(linkString);
      permalinkBox.selectAll('.bookmark').attr('href', linkString);
    });

  permalinkBox.selectAll('.close')
    .on('click', function() {
      permalinkBox.style('display', 'none');
    });

  // Set up help overlay
  var overlay = d3.select('#overlay');
  var helpButton = d3.select('button#help-button');
  overlay.selectAll('.close')
    .on('click', function() {
      overlay.style('display', 'none');
    });

  helpButton
    .on('click', function() {
      overlay
        .style('display', 'block');
    });

  function init(passedParams) {
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

  exports.init = init;

}));