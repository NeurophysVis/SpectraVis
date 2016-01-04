import channelData from '../Electrode-Pair-View/channelData';

export default function() {
  // Highlight selected electrode pair
  d3.selectAll('circle.node').style('stroke', 'white');
  d3.selectAll('circle.node').filter(function(n) {
      return (n.channelID === channelData.channel1ID()) || (n.channelID === channelData.channel2ID());
    })
    .style('stroke', 'black');
}
