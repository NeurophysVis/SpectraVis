export default function(n) {
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
