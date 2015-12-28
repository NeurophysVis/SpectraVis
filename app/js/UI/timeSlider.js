import networkData from '../Network-View/networkData';
import createSlider from '../UI/createSlider';
var timeSlider = createSlider();
timeSlider.on('sliderChange', function(curTime) {
  networkData.curTime(curTime);
  networkData.filterNetworkData();
});

timeSlider.on('stop', function() {
  d3.select('#playButton').text('Play');
});

timeSlider.on('start', function() {
  d3.select('#playButton').text('Stop');
});

export default timeSlider;
