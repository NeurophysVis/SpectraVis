(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define('spectraVis', ['exports'], factory) :
  factory((global.spectraVis = {}));
}(this, function (exports) { 'use strict';

  function drawNodes () {

    var nodeColor = function() {return 'blue';};

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

  function networkChart () {
    // Defaults
    var margin = {top: 0, right: 0, bottom: 0, left: 0};
    var outerWidth = 960;
    var outerHeight = 500;
    var xScale = d3.scale.linear();
    var yScale = d3.scale.linear();
    var xScaleDomain;
    var yScaleDomain;
    var edgeStatScale = function() {};

    var nodeColor;
    var backgroundImage;
    var edgeWidth = 2;
    var nodeRadius = 10;;
    var isFixed;

    var chartDispatcher = d3.dispatch('nodeMouseClick', 'edgeMouseClick', 'edgeMouseOver', 'edgeMouseOut');

    function chart(selection) {
      var innerWidth = outerWidth - margin.left - margin.right;
      var innerHeight = outerHeight - margin.top - margin.bottom;

      selection.each(function(data) {
        var svg = d3.select(this).selectAll('svg').data([data]);

        isFixed ? fixNodes() : unfixNodes();

        // Initialize the chart
        var enterG = svg.enter()
          .append('svg')
            .append('g');
        enterG
          .append('g')
            .attr('class', 'networkBackgroundImage')
            .append('image')
              .attr('width', innerWidth)
              .attr('height', innerHeight);
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
            // Initialze node position to fixed position
            // d.x = xScale(d.fixedX);
            // d.y = yScale(d.fixedY);
            return 'translate(' + [xPos(d), yPos(d)] + ')';
          })
          .on('click', chartDispatcher.nodeMouseClick);

        nodeG.exit().remove();

        var nodes = drawNodes();

        nodeG.call(nodes);

        var force = d3.layout.force()
            .nodes(data.nodes)
            .links(data.edges)
            .charge(-375)
            .linkDistance(innerHeight / 3)
            .size([innerWidth, innerHeight])
            .start();

        // For every iteration of force simulation 'tick'
        force.on('tick', function() {

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
          if (typeof d.x === 'undefined') {
            d.x = xScale(d.fixedX);
            return d.x;
          } else {
            return Math.max(nodeRadius, Math.min(innerWidth - nodeRadius, d.x));
          }

        }

        function yPos(d) {
          if (typeof d.y === 'undefined') {
            d.y = yScale(d.fixedY);
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

    chart.isFixed = function(value) {
      if (!arguments.length) return isFixed;
      isFixed = value;
      return chart;
    };

    d3.rebind(chart, chartDispatcher, 'on');

    return chart;
  }

  function copyObject(obj) {
    var newObj = {};
    for (var key in obj) {
      // Copy all the fields
      newObj[key] = obj[key];
    }

    return newObj;
  }

  function processNetworkData(edgeData, channel, curTimeInd, curFreqInd) {

    var edges = edgeData.map(function(e) {
      var obj = copyObject(e);
      obj.data = obj.data[curTimeInd][curFreqInd];
      return obj;
    });

    var networkData = {
      nodes: channel,
      edges: edges,
    };
    return networkData;
  }

  function init(params) {
    params.curSubject = 'D';
    params.edgeStatID = 'rawDiff_coh';
    loadData(params);
  }

  function loadData(params) {
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
          n.x = undefined;
          n.y = undefined;
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

  function renderApp(subjects, visInfo, edgeTypes, edgeData, channel, params) {

    var networkData = processNetworkData(edgeData, channel, 0, 0);
    var network = networkChart()
    .xScaleDomain(subjects.filter(function(s) {return s.subjectID === params.curSubject;})[0].brainXLim)
    .yScaleDomain(subjects.filter(function(s) {return s.subjectID === params.curSubject;})[0].brainYLim);

    d3.select('#NetworkPanel').datum(networkData)
        .call(network);
  }

  exports.init = init;
  exports.loadData = loadData;
  exports.renderApp = renderApp;

}));