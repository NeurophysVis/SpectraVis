import channelDataManager from './individualChDataManger';
import heatmapChart from './heatmapChart';
import rectMouseOver from './rectMouseOver';

var channelData = channelDataManager();
var heatmap = heatmapChart();

channelData.on('channelDataReady', function() {
  if (channelData.channel1ID() === '' || channelData.channel2ID() === '') {
    d3.selectAll('.electrode-pair').style('display', 'none');
  } else {
    d3.selectAll('.electrode-pair').style('display', 'block');
    var panelWidth = document.getElementById('Ch1Panel').offsetWidth;
    var panelHeight = panelWidth * (4 / 5);

    heatmap
      .width(panelWidth)
      .height(panelHeight)
      .xScaleDomain(channelData.times())
      .yScaleDomain(channelData.frequencies())
      .colorScale(channelData.channelStatScale());

    d3.selectAll('.individual')
      .data([channelData.channel1Data(), channelData.channel2Data()])
      .call(heatmap);
  };

});

heatmap.on('rectMouseOver', rectMouseOver);

export default channelData;
