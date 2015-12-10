export default function(e) {

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
