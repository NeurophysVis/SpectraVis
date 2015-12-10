import edgeMouseOut from './edgeMouseOut';

export default function(e) {
  var re = /\d+/;
  var curCh1 = re.exec(e.source.channelID)[0];
  var curCh2 = re.exec(e.target.channelID)[0];
  console.log('load spectra: Ch' + curCh1 + ', Ch' + curCh2);

  // mouseFlag = true;
  // svgNetworkMap.select('text#HOLD').remove();
  // loadSpectra();
  edgeMouseOut.call(this, e);
}
