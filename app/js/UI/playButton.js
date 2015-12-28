import timeSlider from './timeSlider';

var playButton = d3.select('#playButton');
playButton.on('click', function() {
  timeSlider.running() ? timeSlider.stop() : timeSlider.play();
});

export default playButton;
