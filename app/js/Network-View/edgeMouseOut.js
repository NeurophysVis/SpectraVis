export default function(e) {

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
