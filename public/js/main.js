(function() {
  spectraVis = {};
  params = {};
  var networkWidth;
  var networkHeight;
  var svgNetworkMap;
  var subjectObject;
  var curSubject;
  var edgeStatType;
  var NUM_COLORS = 11;
  var NODE_RADIUS = 10;
  var EDGE_WIDTH = 2;
  var stopAnimation = true;
  var curCh1 = '';
  var curCh2 = '';
  var curFreqInd = 0;
  var curTimeInd = 0;
  var mouseFlag = true;
  var edgeArea = 'All';
  var networkView = 'Anatomical';
  colorbrewer.PiYG[NUM_COLORS].reverse();
  colorbrewer.RdBu[NUM_COLORS].reverse();
  var powerColors = colorbrewer.PiYG[NUM_COLORS];
  var networkColors = colorbrewer.RdBu[NUM_COLORS];
  var margin = {
    top: 40,
    right: 40,
    bottom: 40,
    left: 40,
  };
  var panelWidth = document.getElementById('SpectraCh1Panel').offsetWidth - margin.left - margin.right;
  var panelHeight = document.getElementById('SpectraCh1Panel').offsetWidth * (4 / 5) - margin.top - margin.bottom;
  var legendWidth = document.getElementById('legendKey').offsetWidth - margin.left - margin.right;
  var colorbarLegendHeight = 60 - margin.top - margin.bottom;
  var anatomicalLegendHeight = 100 - margin.top - margin.bottom;
  var timeSliceWidth = panelWidth;
  var timeSliceHeight = 180 - margin.top - margin.bottom;
  var spinner;

  // Heatmap Panels
  var svgCh1 = d3.select('#SpectraCh1Panel')
    .append('svg')
    .attr('width', panelWidth + margin.left + margin.right)
    .attr('height', panelHeight + margin.top + margin.bottom)
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
  var svgEdgeStat = d3.select('#EdgeStatPanel')
    .append('svg')
    .attr('width', panelWidth + margin.left + margin.right)
    .attr('height', panelHeight + margin.top + margin.bottom)
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
  var svgCh2 = d3.select('#SpectraCh2Panel')
    .append('svg')
    .attr('width', panelWidth + margin.left + margin.right)
    .attr('height', panelHeight + margin.top + margin.bottom)
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  // Legend SVG
  var svgSpectraLegend = d3.selectAll('#legendKey').select('#spectraLegend')
    .append('svg')
    .attr('width', legendWidth + margin.left + margin.right)
    .attr('height', colorbarLegendHeight + margin.top + margin.bottom)
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
  svgSpectraLegend.append('text')
    .attr('transform', 'translate(-5, -16)')
    .attr('font-size', 12)
    .attr('font-weight', 700)
    .text('Spectra');
  var svgEdgeStatLegend = d3.selectAll('#legendKey').select('#edgeStatLegend')
    .append('svg')
    .attr('width', legendWidth + margin.left + margin.right)
    .attr('height', colorbarLegendHeight + margin.top + margin.bottom)
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
  svgEdgeStatLegend.append('text')
    .attr('transform', 'translate(-5, -16)')
    .attr('font-size', 12)
    .attr('font-weight', 700)
    .text('Edge Statistic');
  var svgAnatomicalLegend = d3.selectAll('#legendKey').select('#anatomicalLegend')
    .append('svg')
    .attr('width', legendWidth + margin.left + margin.right)
    .attr('height', anatomicalLegendHeight + margin.top + margin.bottom)
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
  svgAnatomicalLegend.append('text')
    .attr('transform', 'translate(-5, -16)')
    .attr('font-size', 12)
    .attr('font-weight', 700)
    .text('Brain Areas');

  // Time Slice SVG
  var svgTimeSlice = d3.select('#timeSlice')
    .append('svg')
    .attr('width', timeSliceWidth + margin.left + margin.right)
    .attr('height', timeSliceHeight + margin.top + margin.bottom)
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  // Set up tool tip
  var toolTip = d3.select('#overlay');
  toolTip.selectAll('#close')
    .on('click', function() {
      toolTip.style('display', 'none');
    });

  d3.select('#help-button')
    .on('click', function() {
      toolTip
        .style('display', '');
    });

  // Set up edge area dropdown menus
  var edgeAreaDropdown = d3.select('#EdgeAreaDropdown');
  edgeAreaDropdown.selectAll('button')
    .text(edgeArea)
    .append('span')
    .attr('class', 'caret');

  // Display loading spinner gif
  spinner = d3.select('#NetworkPanel')
    .append('div')
    .attr('id', 'load')
    .attr('width', panelWidth)
    .attr('height', panelHeight)
    .attr('position', 'relative')
    .html('<img src="img/loader.gif" id="loading">');

  // Load subject data
  queue()
    .defer(d3.json, 'DATA/subjects.json')
    .defer(d3.json, 'DATA/visInfo.json')
    .defer(d3.json, 'DATA/edgeTypes.json')
    .await(createMenu);

  // Functions
  function createMenu(error, subjectData, visInfo, edgeInfo) {
    // Populate dropdown menu with subjects
    params.subjects = subjectData;
    var subjectDropdown = d3.select('#SubjectDropdown');
    var subjectMenu = subjectDropdown.selectAll('.dropdown-menu').selectAll('li').data(subjectData);
    subjectMenu.enter()
      .append('li')
      .attr('id', function(d) {
        return d.subjectID;
      })
      .attr('role', 'presentation')
      .append('a')
      .attr('role', 'menuitem')
      .attr('tabindex', -1)
      .text(function(d) {
        return d.subjectID;
      });

    // Default to the first subject
    curSubject = subjectData[0].subjectID;
    subjectDropdown.selectAll('button')
      .text(curSubject)
      .append('span')
      .attr('class', 'caret');

    // Create dropdown for edge types
    params.edgeInfo = edgeInfo;
    var edgeDropdown = d3.select('#EdgeStatTypeDropdown');
    var edgeOptions = edgeDropdown.select('ul').selectAll('li').data(edgeInfo);
    edgeOptions.enter()
      .append('li')
      .attr('id', function(d) {
        return d.edgeTypeID;
      })
      .append('a')
      .attr('role', 'menuitem')
      .attr('tabindex', -1)
      .text(function(d) {
        return d.edgeTypeName;
      });

    edgeOptions.exit()
      .remove();

    // Default to the first subject
    edgeStatType = edgeInfo[0].edgeTypeID;
    var edgeTypeName = edgeInfo[0].edgeTypeName;
    edgeDropdown.selectAll('button')
      .text(edgeTypeName)
      .append('span')
      .attr('class', 'caret');

    params.visInfo = visInfo;

    // Load channel data
    loadChannelData();
  }

  // Load channel file and set the network svg to be the right aspect ratio for the brain
  function loadChannelData() {
    var channelFile = 'channels_' + curSubject + '.json';

    subjectObject = params.subjects.filter(function(d) {
      return d.subjectID === curSubject;
    })[0];

    var aspectRatio = subjectObject.brainXpixels / subjectObject.brainYpixels;
    networkWidth = document.getElementById('NetworkPanel').offsetWidth - margin.left - margin.right;
    networkHeight = document.getElementById('NetworkPanel').offsetWidth * (1 / aspectRatio) - margin.top - margin.bottom;

    svgNetworkMap = d3.select('#NetworkPanel').selectAll('svg').data([subjectObject], function(d) {
      return d.subjectID;
    });

    svgNetworkMap.exit().remove();
    svgNetworkMap = svgNetworkMap.enter()
      .append('svg')
      .attr('width', networkWidth + margin.left + margin.right)
      .attr('height', networkHeight + margin.top + margin.bottom)
      .append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    d3.json('DATA/' + channelFile, function(isError, channelData) {

      params.channel = channelData;

      // Default to first two channels if no channels are not already specified
      if (curCh1.length === 0 || curCh2.length === 0) {
        curCh1 = params.channel[0].channelID;
        curCh2 = params.channel[1].channelID;
      }

      loadEdges();
    });
  }

  function loadEdges() {
    // Load the edge file for the current subject
    var edgeFile = 'edges_' + curSubject + '_' + edgeStatType + '.json';
    d3.json('DATA/' + edgeFile, function(isError, edgeData) {
      params.edge = edgeData;
      loadSpectra();
    });
  }

  function loadSpectra() {
    var spectCh1File = 'spectrogram_' + curSubject + '_' + curCh1 + '.json';
    var spectCh2File = 'spectrogram_' + curSubject + '_' + curCh2 + '.json';

    // Load the rest of the files in parallel
    queue()
      .defer(d3.json, 'DATA/' + spectCh1File)
      .defer(d3.json, 'DATA/' + spectCh2File)
      .await(display);
  }

  // Draw
  function display(isError, spect1, spect2) {

    var timeScale;
    var timeScaleLinear;
    var freqScale;
    var powerScale;
    var tAx;
    var fAx;
    var heatmapPowerColor;
    var networkXScale;
    var networkYScale;
    var force;
    var timeSlider;
    var freqSlider;
    var timeSliderText;
    var freqSliderText;
    var subjectDropdown;
    var edgeStatScale;
    var edgeStatTypeDropdown;
    var networkColorScale;
    var timeSliderStep;
    var timeMaxStepInd;
    var networkXExtent;
    var networkYExtent;
    var edgeStat;
    var channel;
    var powerLineFun;
    var edgeStatLineFun;
    var timeSlicePowerScale;
    var timeSliceNetworkStatScale;
    var spect1Line;
    var spect2Line;
    var edgeStatLine;
    var heatmapPowerColor;
    var edgeStatColor;
    var isFreq;
    var isWeightedNetwork;
    var corrScale;

    // Remove loading spinner gif
    d3.select('#NetworkPanel').select('#load')
      .transition()
      .duration(5000)
      .attr('opacity', 1e-6)
      .style('display', 'none');

    tAx = params.visInfo.tax; // Time Axis
    fAx = params.visInfo.fax; // Frequency Axis
    // Get the edge statistic corresponding to the selected channels
    edgeStat = params.edge.filter(function(e) {
      return e.source === curCh1 && e.target === curCh2;
    })[0];

    // Get the edge statastic name and units
    var edgeInfo = params.edgeInfo
      .filter(function(e) {
        return e.edgeTypeID === edgeStatType;
      })[0];

    isFreq = edgeInfo.isFreq;
    isWeightedNetwork = edgeInfo.isFreq;

    // Set up scales and slider values
    setupScales();
    setupSliders();

    var powerChart = heatmap()
      .height(panelHeight)
      .width(panelWidth)
      .yScale(freqScale)
      .xScale(timeScale)
      .xLabel('Time (' + params.visInfo.tunits + ')')
      .yLabel('Frequency (' + params.visInfo.funits + ')')
      .intensityScale(powerScale)
      .colorScale(heatmapPowerColor)
      .rectMouseOver(rectMouseOver)
      .rectMouseClick(rectMouseClick);

    var cohChart = heatmap()
      .height(panelHeight)
      .width(panelWidth)
      .yScale(freqScale)
      .xScale(timeScale)
      .xLabel('Time (' + params.visInfo.tunits + ')')
      .yLabel('Frequency (' + params.visInfo.funits + ')')
      .intensityScale(edgeStatScale)
      .colorScale(edgeStatColor)
      .rectMouseOver(rectMouseOver)
      .rectMouseClick(rectMouseClick);

    var corrChart = timeseries()
      .height(panelHeight)
      .width(panelWidth)
      .yScale(corrScale)
      .xScale(timeScale)
      .xLabel('Time (' + params.visInfo.tunits + ')')
      .yLabel(edgeInfo.edgeTypeName)
      .rectMouseOver(rectMouseOver)
      .rectMouseClick(rectMouseClick);

    var cohTimeSlice = timeseries()
      .height(timeSliceHeight)
      .width(timeSliceWidth)
      .yScale(corrScale)
      .xScale(timeScale)
      .yAxisOrientation('left')
      .xLabel('Time (' + params.visInfo.tunits + ')')
      .yLabel(edgeInfo.edgeTypeName);

    var powerTimeSlice = timeseries()
      .height(timeSliceHeight)
      .width(timeSliceWidth)
      .yScale(timeSlicePowerScale)
      .xScale(timeScale)
      .yAxisOrientation('right')
      .xLabel('Time (' + params.visInfo.tunits + ')')
      .yLabel('Power Difference')
      .lineColor('green');

    // Draw data
    drawNetwork();

    svgCh1
      .datum(spect1.data)
      .call(powerChart);
    svgCh2
      .datum(spect2.data)
      .call(powerChart);

    if (isFreq) {
      svgEdgeStat
        .html('');
      svgEdgeStat
        .datum(edgeStat.data)
        .call(cohChart);
      drawTimeSlice();
    } else {
      // Remove coherence and time slice charts
      svgEdgeStat
        .html('');
      svgTimeSlice
        .html('');
      svgEdgeStat
        .datum(edgeStat.data)
        .call(corrChart);
    }

    // Draw legends and titles
    drawTitles();
    drawLegends();

    // Handle buttons
    subjectLoad();
    edgeStatTypeLoad();
    edgeAreaLoad();
    networkViewLoad();
    playButtonStart();
    resetButton();

    function setupSliders() {

      timeSlider = d3.select('#timeSlider');
      timeSliderText = d3.select('#timeSlider-value');
      freqSlider = d3.select('#freqSlider');
      freqSliderText = d3.select('#freqSlider-value');

      timeSliderStep = d3.round(tAx[1] - tAx[0], 4);
      timeMaxStepInd = tAx.length - 1;

      timeSlider.property('min', d3.min(tAx));
      timeSlider.property('max', d3.max(tAx));
      timeSlider.property('step', timeSliderStep);
      timeSlider.property('value', tAx[curTimeInd]);
      timeSlider.on('input', updateTimeSlider);
      timeSliderText.text(tAx[curTimeInd] + ' ms');

      freqSlider.property('min', d3.min(fAx));
      freqSlider.property('max', d3.max(fAx));
      freqSlider.property('step', fAx[1] - fAx[0]);
      freqSlider.property('value', fAx[curFreqInd]);
      freqSlider.on('input', updateFreqSlider);
      freqSliderText.text(fAx[curFreqInd] + ' Hz');
    }

    function setupScales() {
      var powerMin;
      var powerMax;
      var powerExtent;
      var edgeStatMin;
      var edgeStatMax;
      var edgeStatExtent;

      heatmapPowerColor = d3.scale.linear()
        .domain(d3.range(0, 1, 1.0 / (NUM_COLORS - 1)))
        .range(powerColors);
      edgeStatColor = d3.scale.linear()
        .domain(d3.range(0, 1, 1.0 / (NUM_COLORS - 1)))
        .range(networkColors);
      networkColorScale = d3.scale.ordinal()
        .domain(params.visInfo.brainAreas)
        .range(colorbrewer.Pastel1[7]);

      powerMin = d3.min(
        [d3.min(spect1.data, function(d) {
            return d3.min(d, function(e) {
              return e;
            });
          }),

          d3.min(spect2.data, function(d) {
            return d3.min(d, function(e) {
              return e;
            });
          }),
        ]

      );

      powerMax = d3.max(
        [d3.max(spect1.data, function(d) {
            return d3.max(d, function(e) {
              return e;
            });
          }),

          d3.max(spect2.data, function(d) {
            return d3.max(d, function(e) {
              return e;
            });
          }),
        ]
      );

      powerExtent = symmetricExtent(powerMin, powerMax);

      networkXExtent = subjectObject.brainXLim;
      networkYExtent = subjectObject.brainYLim;

      edgeStatMin = d3.min(params.edge, function(d) {
        return d3.min(d.data, function(e) {
          return d3.min(e, function(f) {
            return f;
          });
        });
      });

      edgeStatMax = d3.max(params.edge, function(d) {
        return d3.max(d.data, function(e) {
          return d3.max(e, function(f) {
            return f;
          });
        });
      });

      edgeStatExtent = symmetricExtent(edgeStatMin, edgeStatMax);

      timeScale = d3.scale.ordinal()
        .domain(tAx)
        .rangeBands([0, panelWidth]);

      timeScaleLinear = d3.scale.linear()
        .domain(d3.extent(tAx))
        .range([0, panelWidth]);

      freqScale = d3.scale.ordinal()
        .domain(fAx)
        .rangeBands([panelHeight, 0]);

      powerScale = d3.scale.linear()
        .domain(powerExtent)
        .range([0, 1]);

      timeSlicePowerScale = d3.scale.linear()
        .domain(powerExtent)
        .range([timeSliceHeight, 0]);

      networkXScale = d3.scale.linear()
        .domain(networkXExtent)
        .range([0, networkWidth]);
      networkYScale = d3.scale.linear()
        .domain(networkYExtent)
        .range([networkHeight, 0]);
      edgeStatScale = d3.scale.linear()
        .domain(edgeStatExtent)
        .range([0, 1]);

      corrScale = d3.scale.linear()
        .domain(edgeStatExtent)
        .range([0, panelHeight]);

      function symmetricExtent(min, max) {
        if (Math.abs(min) >= Math.abs(max)) {
          max = Math.abs(min);
        } else {
          min = -1 * max;
        }

        return [min, max];
      }
    }

    function drawNetwork() {
      var nodesGroup;
      var edgesGroup;
      var nodeG;
      var strokeStyle;
      var nodeClickNames = [];
      var brainImage;
      var edge;
      var edgeLine;
      var brainImageG;
      var nodeCircle;
      var nodeText;

      // Display state of application in url
      window.history.pushState({}, '', '?curSubject=' + curSubject +
        '&edgeStat=' + edgeInfo.edgeTypeID +
        '&edgeArea=' + edgeArea +
        '&networkView=' + networkView +
        '&time=' + tAx[curTimeInd] +
        '&freq=' + fAx[curFreqInd] +
        '&curCh1=' + curCh1 +
        '&curCh2=' + curCh2);

      // Replace x and y coordinates of nodes with properly scaled x,y
      if (networkView != 'Topological' || typeof channel === 'undefined') {
        channel = params.channel.map(function(n) {
          var obj = copyObject(n);
          obj.x = networkXScale(n.x);
          obj.y = networkYScale(n.y);
          if (networkView != 'Topological') {
            obj.fixed = true;
          } else {
            obj.fixed = false;
          }

          return obj;
        });
      } else {
        channel.forEach(function(n) {
          n.fixed = false;
        });
      }

      // Replace source name by source object
      edge = params.edge.map(function(e) {
        var obj = copyObject(e);
        obj.source = channel.filter(function(n) {
          return n.channelID === e.source;
        })[0];

        obj.target = channel.filter(function(n) {
          return n.channelID === e.target;
        })[0];

        obj.data = obj.data[curTimeInd][curFreqInd];
        return obj;
      });

      edge = edge.filter(edgeFilter);

      force = d3.layout.force()
        .nodes(channel)
        .links(edge)
        .charge(-375)
        .linkDistance(weights)
        .size([networkWidth, networkHeight])
        .start();

      brainImageG = svgNetworkMap.selectAll('g#BRAIN_IMAGE').data([{}]);
      brainImageG.enter()
        .append('g')
        .attr('id', 'BRAIN_IMAGE');
      edgesGroup = svgNetworkMap.selectAll('g#EDGES').data([{}]);
      edgesGroup.enter()
        .append('g')
        .attr('id', 'EDGES');
      nodesGroup = svgNetworkMap.selectAll('g#NODES').data([{}]);
      nodesGroup.enter()
        .append('g')
        .attr('id', 'NODES');

      edgeLine = edgesGroup.selectAll('.edge').data(edge, function(e) {
        return curSubject + '_' + e.source.channelID + '_' + e.target.channelID;
      });

      edgeLine.enter()
        .append('line')
        .attr('class', 'edge')
        .style('stroke-width', EDGE_WIDTH)
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
          return edgeStatColor(edgeStatScale(d.data));
        })
        .on('mouseover', edgeMouseOver)
        .on('mouseout', edgeMouseOut)
        .on('click', edgeMouseClick);

      nodeG = nodesGroup.selectAll('g.gnode').data(channel, function(d) {
        return curSubject + '_' + d.channelID;
      });

      nodeG.enter()
        .append('g')
        .attr('class', 'gnode')
        .attr('transform', function(d) {
          return 'translate(' + [xPos(d), yPos(d)] + ')';
        })
        .on('click', nodeMouseClick);
      nodeG.exit().remove();

      nodeCircle = nodeG.selectAll('circle.node').data(function(d) {
        return [d];
      });

      nodeCircle.enter()
        .append('circle')
        .attr('class', 'node')
        .attr('r', NODE_RADIUS)
        .attr('fill', '#ddd')
        .attr('opacity', 1);
      nodeCircle
        .attr('fill', function(d) {
          return networkColorScale(d.region);
        });

      nodeText = nodeG.selectAll('text.nodeLabel').data(function(d) {
        return [d];
      });

      nodeText.enter()
        .append('text')
        .attr('class', 'nodeLabel')
        .text(function(d) {
          return d.channelID;
        });

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

        if (networkView != 'Topological') {
          force.stop();
        }

      });

      brainImage = brainImageG.selectAll('image').data([subjectObject], function(d) {
        return d.brainFilename;
      });

      brainImage.enter()
        .append('image')
        .attr('width', networkWidth)
        .attr('height', networkHeight); // replace link by data URI
      if (networkView != 'Topological') {
        getImageBase64('DATA/brainImages/' + subjectObject.brainFilename, function(err, d) {
          brainImage
            .attr('xlink:href', 'data:image/png;base64,' + d);
        });
      }

      brainImage.exit()
        .remove();
      if (networkView === 'Topological') {
        brainImage.remove();
      };

      function xPos(d) {
        return Math.max(NODE_RADIUS, Math.min(networkWidth - NODE_RADIUS, d.x));
      }

      function yPos(d) {
        return Math.max(NODE_RADIUS, Math.min(networkHeight - NODE_RADIUS, d.y));
      }

      function weights(e) {
        var minDistance = 75;
        var distanceRange = 100;
        var initialScaling = (2 * Math.abs(Math.abs(edgeStatScale(e.data) - 0.5) - 0.5) + .01);
        return minDistance + (distanceRange * initialScaling);
      }

      function edgeMouseOver(e) {

        var curEdge = d3.select(this);
        strokeStyle = curEdge.style('stroke');
        curEdge
          .style('stroke-width', 2 * EDGE_WIDTH)
          .style('stroke', function() {
            if (e.data < 0) {
              return edgeStatColor(0);
            } else {
              return edgeStatColor(1);
            }
          });

        var curNodes = d3.selectAll('circle.node')
          .filter(function(n) {
            return (n.channelID === e.source.channelID) || (n.channelID === e.target.channelID);
          })
          .attr('r', NODE_RADIUS * 1.2);
      }

      function edgeMouseOut(e) {
        var curEdge = d3.select(this);
        if (typeof strokeStyle != 'undefined') {
          curEdge
            .style('stroke-width', EDGE_WIDTH)
            .style('stroke', strokeStyle);
          d3.selectAll('circle.node')
            .filter(function(n) {
              return (n.channelID === e.source.channelID) || (n.channelID === e.target.channelID);
            })
            .attr('r', NODE_RADIUS);
        }
      }

      function edgeMouseClick(e) {
        var re = /\d+/;
        curCh1 = re.exec(e.source.channelID)[0];
        curCh2 = re.exec(e.target.channelID)[0];
        mouseFlag = true;
        svgNetworkMap.select('text#HOLD').remove();
        loadSpectra();
        edgeMouseOut.call(this, e);
      }

      function nodeMouseClick(e) {
        var curNode = d3.select(this);
        var nodeInd = nodeClickNames.indexOf(e.channelID);

        if (nodeInd > -1) {
          // If clicked on node is in the array, remove
          curNode.selectAll('circle')
            .attr('r', NODE_RADIUS);
          nodeClickNames.splice(nodeInd, 1);
        } else {
          // Else add to array
          curNode.selectAll('circle')
            .attr('r', 1.2 * NODE_RADIUS);
          nodeClickNames.push(+e.channelID);
        }

        if (nodeClickNames.length === 2) {
          nodeClickNames.sort(d3.ascending);
          var re = /\d+/;
          curCh1 = re.exec(nodeClickNames[0])[0];
          curCh2 = re.exec(nodeClickNames[1])[0];
          mouseFlag = true;
          svgNetworkMap.select('text#HOLD').remove();
          d3.selectAll('circle.node')
            .filter(function(n) {
              return (n.channelID === nodeClickNames[0].toString()) || (n.channelID === nodeClickNames[1].toString());
            })
            .attr('fill', '#ddd')
            .attr('r', NODE_RADIUS);
          nodeClickNames = [];
          loadSpectra();
        }
      }

      function copyObject(obj) {
        var newObj = {};
        for (var key in obj) {
          // Copy all the fields
          newObj[key] = obj[key];
        }

        return newObj;
      }

      function edgeFilter(e) {
        var isEdge;
        switch (edgeStatType) {
          case 'C2s_coh':
          case 'C2s_corr':
            if (e.data === 0) {
              isEdge = false;
            } else {
              isEdge = true;
            }

            break;
          default:
            isEdge = true;
        }
        switch (edgeArea) {
          case 'Within':
            if (e.source.region != e.target.region) {
              isEdge = false;
            } else {
              isEdge = isEdge & true;
            }

            break;
          case 'Between':
            if (e.source.region === e.target.region) {
              isEdge = false;
            } else {
              isEdge = isEdge & true;
            }

            break;
          default:
            isEdge = isEdge & true;
        }

        return isEdge;
      }
    };

    function heatmap() {

      var intensityScale = d3.scale.linear();
      var colorScale = d3.scale.linear();
      var xScale = d3.scale.ordinal();
      var yScale = d3.scale.ordinal();
      var rectMouseOver = function() {};

      var rectMouseClick = function() {};

      var height = 500;
      var width = 500;
      var xLabel = '';
      var yLabel = '';

      function chart(selection) {

        selection.each(function(data) {
          var heatmapG;
          var heatmapRect;
          var xAxis;
          var yAxis;
          var zeroG;
          var xAxisG;
          var yAxisG;
          var zeroLine;
          var curPlot = d3.select(this);

          xScale.rangeBands([0, width]);
          yScale.rangeBands([height, 0]);

          heatmapG = curPlot.selectAll('g.heatmapX').data(data);
          heatmapG.enter()
            .append('g')
            .attr('transform', function(d, i) {
              return 'translate(' + xScale(xScale.domain()[i]) + ',0)';
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
              return colorScale(intensityScale(d));
            })
            .style('stroke', function(d) {
              return colorScale(intensityScale(d));
            })
            .on('mouseover', rectMouseOver)
            .on('click', rectMouseClick);
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
            .attr('transform', 'translate(0,' + height + ')')
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
            .attr('x', -height / 2)
            .attr('dy', -2 + 'em')
            .attr('transform', 'rotate(-90)')
            .attr('text-anchor', 'middle')
            .text(yLabel);
          yAxisG.call(yAxis);

          zeroG = curPlot.selectAll('g.zeroLine').data([
            [
              [0, height],
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

      chart.intensityScale = function(scale) {
        if (!arguments.length) return intensityScale;
        intensityScale = scale;
        return chart;
      };

      chart.colorScale = function(scale) {
        if (!arguments.length) return colorScale;
        colorScale = scale;
        return chart;
      };

      chart.xScale = function(scale) {
        if (!arguments.length) return xScale;
        xScale = scale;
        return chart;
      };

      chart.yScale = function(scale) {
        if (!arguments.length) return yScale;
        yScale = scale;
        return chart;
      };

      chart.rectMouseOver = function(fun) {
        if (!arguments.length) return rectMouseOver;
        rectMouseOver = fun;
        return chart;
      };

      chart.rectMouseClick = function(fun) {
        if (!arguments.length) return rectMouseClick;
        rectMouseClick = fun;
        return chart;
      };

      chart.width = function(value) {
        if (!arguments.length) return width;
        width = value;
        return chart;
      };

      chart.height = function(value) {
        if (!arguments.length) return height;
        height = value;
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

      return chart;
    }

    function drawTitles() {

      spectTitle(svgCh1, curCh1);
      spectTitle(svgCh2, curCh2);
      edgeTitle();

      function edgeTitle() {
        var titleEdge = svgEdgeStat.selectAll('g.title').data([edgeStat], function(d) {
          return edgeInfo.edgeTypeName + '-' + d.source + '-' + d.target;
        });

        titleEdge.exit()
          .remove();
        titleEdge.enter()
          .append('g')
          .attr('transform', 'translate(' + timeScaleLinear(0) + ', -10)')
          .attr('class', 'title');

        var titleLabel = titleEdge.selectAll('text.infoLabel').data(function(d) {
          return [d];
        });

        titleLabel.enter()
          .append('text')
          .attr('class', 'infoLabel')
          .attr('text-anchor', 'middle');
        titleLabel
          .text(function(d) {
            return edgeInfo.edgeTypeName + ': Ch ' + d.source + '-Ch ' + d.target;
          });

        var titleCircleG = titleEdge.selectAll('g').data(
          [
          channel.filter(function(d) {return d.channelID === curCh1;}),

          channel.filter(function(d) {return d.channelID === curCh2;}),
          ]
        );

        titleCircleG.enter()
          .append('g');

        var titleCircle = titleCircleG.selectAll('circle.node').data(function(d, i) {
          return [[d, i]];
        });

        titleCircle.enter()
          .append('circle')
          .attr('class', 'node')
          .attr('r', NODE_RADIUS)
          .attr('transform', function(d) {
            return 'translate(' + (60 + d[1] * 45)  + ', ' + (-NODE_RADIUS / 2) + ')';
          })
          .attr('fill', '#ddd')
          .attr('opacity', 1);

        titleCircle
          .attr('fill', function(d) {
            return networkColorScale(d[0][0].region);
          });

        var titleText = titleCircleG.selectAll('text.nodeLabel').data(function(d, i) {
          return [[d, i]];
        });

        titleText.enter()
          .append('text')
          .attr('class', 'nodeLabel')
          .attr('transform', function(d) {
            return 'translate(' + (60 + d[1] * 45)  + ', ' + (-NODE_RADIUS / 2) + ')';
          });

        titleText
          .text(function(d) {
            return d[0][0].channelID;
          });

      }

      function spectTitle(svgCh, channelID) {
        var titleCh = svgCh.selectAll('g.title')
          .data(channel.filter(function(d) {
            return d.channelID === channelID;
          }), function(d) {

            return d.SubjectID + '_' + d.channelID;
          });

        titleCh.exit().remove();
        titleCh.enter()
          .append('g')
          .attr('transform', 'translate(' + timeScaleLinear(0) + ', -10)')
          .attr('class', 'title');

        titleLabel = titleCh.selectAll('text.infoLabel').data(function(d) {
          return [d];
        });

        titleLabel.enter()
          .append('text')
          .attr('class', 'infoLabel')
          .attr('text-anchor', 'middle')
          .text(function(d) {
            return 'Spectra: Ch ' + d.channelID;
          });

        var titleCircle = titleCh.selectAll('circle.node').data(function(d) {
          return [d];
        });

        titleCircle.enter()
          .append('circle')
          .attr('class', 'node')
          .attr('r', NODE_RADIUS)
          .attr('transform', 'translate(40, ' + (-NODE_RADIUS / 2) + ')')
          .attr('fill', '#ddd')
          .attr('opacity', 1);

        titleCircle
          .attr('fill', function(d) {
            return networkColorScale(d.region);
          });

        var titleText = titleCh.selectAll('text.nodeLabel').data(function(d) {
          return [d];
        });

        titleText.enter()
          .append('text')
          .attr('class', 'nodeLabel')
          .attr('transform', 'translate(40, ' + (-NODE_RADIUS / 2) + ')');
        titleText
          .text(function(d) {
            return d.channelID;
          });

      }
    }

    function drawLegends() {
      var powerG;
      var powerLegendRect;
      var legendScale;
      var powerAxisG;
      var powerAxis;
      var edgeStatG;
      var edgeStatLegendRect;
      var edgeStatAxisG;
      var edgeStatAxis;
      var anatomicalG;
      var anatomicalCircle;
      var anatomicalText;
      var formatter = d3.format('.1f');
      var colorInd = d3.range(0, 1, 1.0 / (NUM_COLORS - 1));
      colorInd.push(1);

      legendScale = d3.scale.ordinal()
        .domain(colorInd)
        .rangeBands([0, legendWidth]);

      // Power Legend
      powerG = svgSpectraLegend.selectAll('g#powerLegend').data([{}]);
      powerG.enter()
        .append('g')
        .attr('id', 'powerLegend');
      powerLegendRect = powerG.selectAll('rect.power').data(colorInd);
      powerLegendRect.enter()
        .append('rect')
        .attr('class', 'power')
        .attr('x', function(d) {
          return legendScale(d);
        })
        .attr('height', 10)
        .attr('width', legendScale.rangeBand());
      powerLegendRect
        .style('fill', function(d) {
          return heatmapPowerColor(d);
        });

      powerAxis = d3.svg.axis()
        .scale(legendScale)
        .orient('bottom')
        .tickValues([colorInd[0], colorInd[((colorInd.length - 1) / 2)], colorInd[colorInd.length - 1]])
        .tickFormat(function(d) {
          return formatter(powerScale.invert(+d));
        })
        .tickSize(0, 0, 0);
      powerAxisG = powerG.selectAll('g.axis.hideAxisLines#power').data([{}]);
      powerAxisG.enter()
        .append('g')
        .attr('transform', 'translate(0,9)')
        .attr('class', 'axis hideAxisLines')
        .attr('id', 'power')
        .append('text')
        .attr('x', legendScale.rangeBand() * NUM_COLORS / 2)
        .attr('y', -10)
        .attr('text-anchor', 'middle')
        .text('Difference in Power');
      powerAxisG.call(powerAxis);

      // Edge Statistic Legend
      edgeStatG = svgEdgeStatLegend.selectAll('g#edgeStatLegend').data([{}]);
      edgeStatG.enter()
        .append('g')
        .attr('id', 'edgeStatLegend');
      edgeStatLegendRect = edgeStatG.selectAll('rect.edgeStat').data(colorInd);
      edgeStatLegendRect.enter()
        .append('rect')
        .attr('class', 'edgeStat')
        .attr('x', function(d) {
          return legendScale(d);
        })
        .attr('height', 10)
        .attr('width', legendScale.rangeBand());
      edgeStatLegendRect
        .style('fill', function(d) {
          return edgeStatColor(d);
        });

      edgeStatAxis = d3.svg.axis()
        .scale(legendScale)
        .orient('bottom')
        .tickValues([colorInd[0], colorInd[((colorInd.length - 1) / 2)], colorInd[colorInd.length - 1]])
        .tickFormat(function(d) {
          return formatter(edgeStatScale.invert(+d));
        })
        .tickSize(0, 0, 0);
      edgeStatAxisG = edgeStatG.selectAll('g.axis.hideAxisLines#edgeStat').data([edgeInfo.edgeTypeName], String);

      edgeStatAxisG.enter()
        .append('g')
        .attr('transform', 'translate(0,9)')
        .attr('class', 'axis hideAxisLines')
        .attr('id', 'edgeStat')
        .append('text')
        .attr('x', legendScale.rangeBand() * NUM_COLORS / 2)
        .attr('y', -10)
        .attr('text-anchor', 'middle')
        .text(edgeInfo.edgeTypeName);
      edgeStatAxisG.exit()
        .remove();
      edgeStatAxisG.call(edgeStatAxis);

      // Anatomical legend
      anatomicalG = svgAnatomicalLegend.selectAll('g.anatomical').data(params.visInfo.brainAreas, String);
      anatomicalG.enter()
        .append('g')
        .attr('class', 'anatomical')
        .attr('transform', function(d, i) {
          return 'translate(0,' + (i * (((NODE_RADIUS / 2) * 2) + 3)) + ')';
        });

      anatomicalG.exit()
        .remove();
      anatomicalCircle = anatomicalG.selectAll('circle').data(function(d) {
        return [d];
      });

      anatomicalCircle.enter()
        .append('circle')
        .attr('r', NODE_RADIUS / 2)
        .attr('fill', function(d) {
          return networkColorScale(d);
        });

      anatomicalText = anatomicalG.selectAll('text').data(function(d) {
        return [d];
      });

      anatomicalText.enter()
        .append('text')
        .attr('x', ((NODE_RADIUS / 2) * 2) + 5)
        .attr('font-size', ((NODE_RADIUS / 2) * 2))
        .attr('alignment-baseline', 'middle')
        .text(String);
    }

    function drawTimeSlice() {

      var cohSlice = svgTimeSlice.selectAll('g#cohSlice')
        .data([edgeStat.data.map(function(d) {
          return d[curFreqInd];
        }),
       ]);

      cohSlice.enter()
        .append('g')
        .attr('id', 'cohSlice');
      cohSlice
        .call(cohTimeSlice);

      var spect1Slice = svgTimeSlice.selectAll('g#spect1Slice')
        .data([spect1.data.map(function(d) {
          return d[curFreqInd];
        }),
       ]);

      spect1Slice.enter()
        .append('g')
        .attr('id', 'spect1Slice');
      spect1Slice
        .call(powerTimeSlice);

      var spect2Slice = svgTimeSlice.selectAll('g#spect2Slice')
        .data([spect2.data.map(function(d) {
          return d[curFreqInd];
        }),
       ]);

      spect2Slice.enter()
        .append('g')
        .attr('id', 'spect2Slice');
      spect2Slice
        .call(powerTimeSlice);

      var timeTitle = svgTimeSlice.selectAll('text.title').data([fAx[curFreqInd]]);
      timeTitle.enter()
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('class', 'title')
        .attr('x', timeSliceWidth / 2)
        .attr('y', 0)
        .attr('dy', -1 + 'em');
      timeTitle
        .text(function(d) {
          return 'Time Slice @ Frequency ' + d + ' ' + params.visInfo.funits;
        });
    }

    function timeseries() {

      var xScale = d3.scale.ordinal();
      var yScale = d3.scale.linear();
      var height = 600;
      var width = 600;
      var rectMouseOver = function() {};

      var rectMouseClick = function() {};

      var xLabel = '';
      var yLabel = '';
      var yAxisOrientation = 'left';
      var lineColor = 'blue';

      function chart(selection) {

        selection.each(function(data) {
          var curPlot = d3.select(this);

          xScale.rangeBands([0, width]);
          yScale.range([height, 0]);

          var orient = (yAxisOrientation === 'right') ? 1 : -1;

          var lineFun = d3.svg.line()
            .x(function(d, i) {
              return xScale(xScale.domain()[i]);
            })
            .y(function(d) {
              return yScale(d);
            })
            .interpolate('linear');

          var line = curPlot.selectAll('path.timeseries').data([data]);
          line.enter()
            .append('path')
            .attr('class', 'timeseries')
            .attr('fill', 'none')
            .attr('stroke', lineColor);
          line
            .transition()
            .duration(5)
            .ease('linear')
            .attr('d', lineFun);

          var yAxis = d3.svg.axis()
            .scale(yScale)
            .orient(yAxisOrientation)
            .ticks(3)
            .tickValues([d3.min(yScale.domain()), 0, d3.max(yScale.domain())])
            .tickSize(0, 0, 0);
          var yAxisG = curPlot.selectAll('g.axis#y').data([{}]);

          yAxisG.enter()
            .append('g')
            .attr('class', 'axis')
            .attr('id', 'y')
            .attr('transform', 'translate(' + (yAxisOrientation === 'right' ? width : 0) + ',0)')
            .append('text')
            .attr('x', orient * height / 2)
            .attr('dy', -2.5 + 'em')
            .attr('transform', 'rotate(' + (orient * 90) + ')')
            .attr('text-anchor', 'middle')
            .text(yLabel);
          yAxisG.call(yAxis);

          var xAxis = d3.svg.axis()
            .scale(xScale)
            .orient('bottom')
            .ticks(3)
            .tickValues([d3.min(xScale.domain()), 0, d3.max(xScale.domain())])
            .tickSize(0, 0, 0);
          var xAxisG = curPlot.selectAll('g.axis#x').data([{}]);
          xAxisG.enter()
            .append('g')
            .attr('class', 'axis')
            .attr('transform', 'translate(0,' + height + ')')
            .attr('id', 'x')
            .append('text')
            .attr('x', xScale(0))
            .attr('y', 0)
            .attr('text-anchor', 'middle')
            .attr('dy', 3 + 'em')
            .text(xLabel);
          xAxisG.call(xAxis);

          var zeroG = curPlot.selectAll('g.zeroLine').data([
            [
              [0, height],
            ],
          ]);
          zeroG.enter()
            .append('g')
            .attr('class', 'zeroLine');
          var zeroLine = zeroG.selectAll('path').data(function(d) {
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

          var heatmapG = curPlot.selectAll('g.heatmapX').data(data);
          heatmapG.enter()
            .append('g')
            .attr('transform', function(d, i) {
              return 'translate(' + xScale(xScale.domain()[i]) + ', 0)';
            })
            .attr('class', 'heatmapX');
          heatmapG.exit()
            .remove();
          var heatmapRect = heatmapG.selectAll('rect').data(function(d) {
            return d;
          });

          heatmapRect.enter()
            .append('rect')
            .attr('opacity', 1e-6)
            .attr('height', height)
            .attr('width', xScale.rangeBand())
            .style('fill', 'white');
          heatmapRect
            .on('mouseover', rectMouseOver)
            .on('click', rectMouseClick);
          heatmapRect.exit()
            .remove();
        });

      }

      chart.xScale = function(scale) {
        if (!arguments.length) return xScale;
        xScale = scale;
        return chart;
      };

      chart.yScale = function(scale) {
        if (!arguments.length) return yScale;
        yScale = scale;
        return chart;
      };

      chart.rectMouseOver = function(fun) {
        if (!arguments.length) return rectMouseOver;
        rectMouseOver = fun;
        return chart;
      };

      chart.rectMouseClick = function(fun) {
        if (!arguments.length) return rectMouseClick;
        rectMouseClick = fun;
        return chart;
      };

      chart.width = function(value) {
        if (!arguments.length) return width;
        width = value;
        return chart;
      };

      chart.height = function(value) {
        if (!arguments.length) return height;
        height = value;
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

      chart.yAxisOrientation = function(value) {
        if (!arguments.length) return yAxisOrientation;
        yAxisOrientation = value;
        return chart;
      };

      chart.lineColor = function(value) {
        if (!arguments.length) return lineColor;
        lineColor = value;
        return chart;
      };

      return chart;

    }

    function subjectLoad() {

      subjectDropdown = d3.select('#SubjectDropdown');
      subjectDropdown.selectAll('li')
        .on('click', function() {

          // Display loading spinner gif
          spinner = d3.select('#NetworkPanel').select('#load')
            .style('display', '');

          subjectDropdown.selectAll('button')
            .text(this.id)
            .append('span')
            .attr('class', 'caret');
          curSubject = this.id;
          curCh1 = [];
          curCh2 = [];
          loadChannelData();
        });
    }

    function edgeStatTypeLoad() {
      edgeStatTypeDropdown = d3.select('#EdgeStatTypeDropdown');
      edgeStatTypeDropdown.selectAll('li')
        .on('click', function() {
          edgeStatTypeDropdown.selectAll('button')
            .text(d3.select(this).select('a').html())
            .append('span')
            .attr('class', 'caret');
          edgeStatType = this.id;

          isFreq = params.edgeInfo
            .filter(function(e) {
              return e.edgeTypeID === edgeStatType;
            })[0]
            .isFreq;
          curFreqInd = isFreq ? curFreqInd : 0;
          freqSlider.property('value', fAx[curFreqInd]);
          freqSliderText.text(fAx[curFreqInd] + ' Hz');

          force.stop();
          loadEdges();
        });
    }

    function edgeAreaLoad() {
      edgeAreaDropdown = d3.select('#EdgeAreaDropdown');
      edgeAreaDropdown.selectAll('li')
        .on('click', function() {
          edgeAreaDropdown.selectAll('button')
            .text(this.id)
            .append('span')
            .attr('class', 'caret');
          edgeArea = this.id;
          force.stop();
          drawNetwork();
        });
    }

    function networkViewLoad() {
      var networkViewRadio = d3.select('#NetworkViewPanel');
      networkViewRadio.selectAll('input')
        .on('click', function() {
          var radioValue = this.value;
          networkViewRadio.selectAll('input')
            .property('checked', false);
          d3.select(this).property('checked', true);
          networkView = radioValue;
          force.stop();
          drawNetwork();
        });
    }

    function playButtonStart() {
      var playButton = d3.select('#playButton');
      playButton.on('click', function() {

        d3.select('#playButton').text('Stop');
        stopAnimation = !stopAnimation;
        var intervalID = setInterval(function() {
          if (curTimeInd < timeMaxStepInd && stopAnimation === false) {
            curTimeInd++;
            updateTimeSlider.call({
              value: tAx[curTimeInd],
            });
          } else {
            d3.select('#playButton').text('Start');
            stopAnimation = true;
            clearInterval(intervalID);
          }
        }, 100);
      });
    }

    function resetButton() {
      var resetButton = d3.select('#resetButton');
      resetButton.on('click', function() {
        curTimeInd = 0;
        stopAnimation = true;
        force.stop();
        updateTimeSlider.call({
          value: tAx[curTimeInd],
        });
      });
    }

    function updateTimeSlider() {
      curTimeInd = tAx.indexOf(+this.value);
      timeSlider.property('value', tAx[curTimeInd]);
      timeSliderText.text(tAx[curTimeInd] + ' ms');
      force.stop();
      if (!this.noUpdate) drawNetwork();
    }

    function updateFreqSlider() {
      curFreqInd = isFreq ? fAx.indexOf(+this.value) : 0;
      freqSlider.property('value', fAx[curFreqInd]);
      freqSliderText.text(fAx[curFreqInd] + ' Hz');
      force.stop();

      if (!this.noUpdate) drawNetwork();

      if (isFreq & !this.noUpdate) drawTimeSlice();
    }

    function rectMouseOver(d, freqInd, timeInd) {
      // Mouse click can freeze visualization in place
      if (mouseFlag) {
        curFreqInd = isFreq ? freqInd : 0;
        curTimeInd = timeInd;
        force.stop();

        updateTimeSlider.call({
          value: tAx[curTimeInd],
          noUpdate: true,
        });
        updateFreqSlider.call({
          value: fAx[curFreqInd],
        });
      };
    }

    function rectMouseClick() {
      mouseFlag = !mouseFlag;
      if (!mouseFlag) {
        svgNetworkMap.append('text')
          .attr('x', networkWidth)
          .attr('y', networkHeight)
          .attr('text-anchor', 'end')
          .attr('id', 'HOLD')
          .text('HOLD');
      } else {
        svgNetworkMap.select('text#HOLD').remove();
      }
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
  }
})();
