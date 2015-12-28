import timeSlider from './timeSlider';

var resetButton = d3.select('#resetButton');

resetButton.on('click', function() {
  timeSlider.reset();
});
