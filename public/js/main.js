(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define('spectraVis', ['exports'], factory) :
  factory((global.spectraVis = {}));
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

  var NUM_EDGE_COLORS = 11;

  // Reverse the colors
  var edgeStatColors = [];
  colorbrewer.RdBu[NUM_EDGE_COLORS].forEach(function(color) {
    edgeStatColors.unshift(color);
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

  function getEdgeDomain(edgeData, numBins) {
    var edgeStatMin = d3.min(edgeData, function(d) {
      return d3.min(d.data, function(e) {
        return d3.min(e, function(f) {
          return f;
        });
      });
    });

    var edgeStatMax = d3.max(edgeData, function(d) {
      return d3.max(d.data, function(e) {
        return d3.max(e, function(f) {
          return f;
        });
      });
    });

    return getSymmetricDomain(edgeStatMin, edgeStatMax, numBins);
  }

  function createEdgeScale(edgeData, isWeighted) {
    if (isWeighted) {
      var edgeStatScale = d3.scale.linear()
        .domain(getEdgeDomain(edgeData, NUM_EDGE_COLORS))
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
            allNodesMap.set(subjectID + '_' + obj.channelID, obj);
            return obj;
          });

          // Replace source name by source object
          edgeData = edge.map(function(e) {
            allEdgesMap.set(subjectID + '_' + e.source + '_' + e.target, e);
            e.source = allNodesMap.get(subjectID + '_' + e.source);
            e.target = allNodesMap.get(subjectID + '_' + e.target);
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
      networkData.edges.forEach(function(e) {
        filteredEdgesMap.set(subjectID + '_' + e.source.channelID + '_' + e.target.channelID, e);
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
      console.log('load spectra: Ch' + curCh1 + ', Ch' + curCh2);

      d3.selectAll('.node-clicked').classed('node-clicked', false);
      d3.selectAll('.gnode').selectAll('circle').attr('transform', 'scale(1)');
    }
  }

  function edgeMouseClick(e) {
    var re = /\d+/;
    var curCh1 = re.exec(e.source.channelID)[0];
    var curCh2 = re.exec(e.target.channelID)[0];
    console.log('load spectra: Ch' + curCh1 + ', Ch' + curCh2);

    // mouseFlag = true;
    // svgNetworkMap.select('text#HOLD').remove();
    // loadSpectra();
  }

  var networkData = networkDataManager();
  var networkView = networkChart();
  var timeSlider = createSlider();
  var freqSlider = createSlider();
  var subjectDropdown = createDropdown().key('subjectID');
  var edgeStatIDDropdown = createDropdown().key('edgeStatID').displayName('edgeStatName');
  var edgeFilterDropdown = createDropdown().key('filterType').displayName('filterName').options(filterTypes);

  function init(passedParams) {
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

  exports.init = init;

}));