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

  function edgeFilterWithin(e) {
    var showEdge = (e.source.region === e.target.region);
    return showEdge;
  }

  function edgeFilterBetween(e) {
    var showEdge = (e.source.region !== e.target.region);
    return showEdge;
  }

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
    if (imageLink === '') return;
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
    var isFixed = true;
    var imageLink = '';
    var force = d3.layout.force();

    var chartDispatcher = d3.dispatch('nodeMouseClick', 'edgeMouseClick', 'edgeMouseOver', 'edgeMouseOut');

    function chart(selection) {
      var innerWidth = outerWidth - margin.left - margin.right;
      var innerHeight = outerHeight - margin.top - margin.bottom;

      selection.each(function(data) {
        var svg = d3.select(this).selectAll('svg').data([data]);

        force.stop();

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
        var imageSelection = svg.select('.networkBackgroundImage').selectAll('image').data([imageLink], function(d) {return d;});

        var imageEnter = imageSelection.enter()
          .append('image')
          .attr('width', innerWidth)
          .attr('height', innerHeight);

        imageSelection.exit().remove();
        insertImage(imageLink, imageEnter);

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
            return d.x;
          } else {
            return Math.max(nodeRadius, Math.min(innerWidth - nodeRadius, d.x));
          }

        }

        function yPos(d) {
          if (typeof d.y === 'undefined' || d.fixed) {
            d.y = yScale(d.fixedY);
            return d.y;
          } else {
            return Math.max(nodeRadius, Math.min(innerHeight - nodeRadius, d.y));
          }

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

    d3.rebind(chart, chartDispatcher, 'on');

    return chart;
  }

  function createSlider() {

    var step;
    var domain;
    var maxStepInd;
    var units;
    var curValue;
    var dispatch = d3.dispatch('sliderChange');

    function slider(selection) {
      selection.each(function(value) {
        var input = d3.select(this).selectAll('input');
        var output = d3.select(this).selectAll('output');
        step = d3.round(domain[1] - domain[0], 4);
        maxStepInd = domain.length - 1;
        curValue = value;

        input.property('min', d3.min(domain));
        input.property('max', d3.max(domain));
        input.property('step', step);
        input.property('value', value);
        input.on('input', function() {
          dispatch.sliderChange(+this.value);
        });

        output.text(value + ' ' + units);
      });
    };

    slider.step = function(value) {
      if (!arguments.length) return step;
      step = value;
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

    d3.rebind(slider, dispatch, 'on');

    return slider;

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
    edgeMouseOut.call(this, e);
  }

  var networkData = networkDataManager();
  var networkView = networkChart();
  var timeSlider = createSlider();
  var freqSlider = createSlider();
  var subjectInfo;
  var edgeTypesInfo;

  function init(passedParams) {
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
        subjectInfo = subjects;
        edgeTypesInfo = edgeTypes;
        var curSubject = passedParams.curSubject || subjectInfo[0].subjectID;
        var curEdgeStatID = passedParams.edgeStatID || edgeTypesInfo[0].edgeStatID;
        var curSubjectInfo = subjectInfo.filter(function(s) {return s.subjectID === curSubject;})[0];

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
    networkData.curFreq(curFreq);
    networkData.filterNetworkData();
  });

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
      .edgeStatScale(networkData.edgeStatScale())
      .imageLink(networkData.imageLink())
      .nodeColorScale(networkData.brainRegionScale());

    d3.select('#NetworkPanel').datum(networkData.networkData())
        .call(networkView);

    d3.select('#TimeSliderPanel').datum(networkData.curTime()).call(timeSlider);
    d3.select('#FreqSliderPanel').datum(networkData.curFreq()).call(freqSlider);
  });

  exports.init = init;

}));