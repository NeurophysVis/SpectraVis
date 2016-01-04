export default function() {

  var xScale = d3.scale.ordinal();
  var yScale = d3.scale.linear();
  var height = 600;
  var width = 600;
  var chartDispatcher = d3.dispatch('rectMouseOver', 'rectMouseClick');

  var xLabel = '';
  var yLabel = '';
  var yAxisOrientation = 'left';
  var lineColor = 'blue';

  function chart(selection) {

    selection.each(function(data) {
      var curPlot = d3.select(this);

      xScale.rangeBands([0, width]);

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
        .on('mouseover', chartDispatcher.rectMouseOver)
        .on('click', chartDispatcher.rectMouseClick);
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

  d3.rebind(chart, chartDispatcher, 'on');

  return chart;

}
