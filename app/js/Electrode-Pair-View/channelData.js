import channelDataManager from './individualChDataManger';
import heatmapChart from './heatmapChart';

var channelData = channelDataManager();
var heatmap = heatmapChart();

channelData.on('channelDataReady', function() {
  if (channelData.channel1ID() === '' || channelData.channel2ID() === '') {
    d3.selectAll('.electrode-pair').style('display', 'none');
  } else {
    var panelWidth = document.getElementById('Ch1Panel').offsetWidth;
    var panelHeight = panelWidth * (4 / 5);

    d3.selectAll('.electrode-pair').style('display', 'block');

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

export default channelData;
