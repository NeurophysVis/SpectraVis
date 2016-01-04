export default function() {
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
