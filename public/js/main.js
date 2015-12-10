(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define('spectraVis', ['exports'], factory) :
  factory((global.spectraVis = {}));
}(this, function (exports) { 'use strict';

  function drawNodes () {

    var nodeColor = function() {return 'grey';};

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
    var edgeStatScale = function() {return 'black';};

    var nodeColor;
    var edgeWidth = 2;
    var nodeRadius = 10;
    var isFixed = true;
    var imageLink = '';

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
            .append('image')
              .attr('class', 'networkBackgroundImage')
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

        // Append background image link
        insertImage(imageLink, svg.selectAll('.networkBackgroundImage'));

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

    chart.imageLink = function(value) {
      if (!arguments.length) return imageLink;
      imageLink = value;
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

  function init(params) {
    params.curSubject = 'D';
    params.edgeStatID = 'rawDiff_coh';
    params.curTime = 0;
    params.curFreq = 0;
    params.curCh1 = '';
    params.curCh2 = '';
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

    var curSubjectInfo = subjects.filter(function(s) {return s.subjectID === params.curSubject;})[0];

    var aspectRatio = curSubjectInfo.brainXpixels / curSubjectInfo.brainYpixels;
    var networkWidth = document.getElementById('NetworkPanel').offsetWidth;
    var networkHeight = networkWidth / aspectRatio;

    var networkData = processNetworkData(edgeData, channel, 0, 0);
    var network = networkChart()
      .width(networkWidth)
      .height(networkHeight)
      .xScaleDomain(curSubjectInfo.brainXLim)
      .yScaleDomain(curSubjectInfo.brainYLim)
      .imageLink('DATA/brainImages/brainImage_' + params.curSubject + '.png');

    network.on('edgeMouseOver', edgeMouseOver);
    network.on('edgeMouseOut', edgeMouseOut);
    network.on('nodeMouseClick', nodeMouseClick);
    network.on('edgeMouseClick', edgeMouseClick);

    d3.select('#NetworkPanel').datum(networkData)
        .call(network);
  }

  var params = {};

  exports.init = init;
  exports.loadData = loadData;
  exports.renderApp = renderApp;
  exports.params = params;

}));