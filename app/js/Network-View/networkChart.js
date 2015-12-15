import drawNodes from './drawNodes';
import insertImage from './insertImage';

export default function () {
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
