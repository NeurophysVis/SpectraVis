import networkData from '../Network-View/networkData';
import createSlider from '../UI/createSlider';

var freqSlider = createSlider();
freqSlider.on('sliderChange', function(curFreq) {
  networkData
    .curFreq(curFreq)
    .filterNetworkData();
});

export default freqSlider;
