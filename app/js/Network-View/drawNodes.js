export default function () {

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
