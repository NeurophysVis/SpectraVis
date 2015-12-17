export default function() {

  var stepSize;
  var domain;
  var maxStepInd;
  var units;
  var curValue;
  var minValue;
  var maxValue;
  var running = false;
  var delay = 200;
  var dispatch = d3.dispatch('sliderChange', 'start', 'stop');

  function slider(selection) {
    selection.each(function(value) {
      var input = d3.select(this).selectAll('input');
      var output = d3.select(this).selectAll('output');
      stepSize = d3.round(domain[1] - domain[0], 4);
      maxStepInd = domain.length - 1;
      curValue = value;
      minValue = d3.min(domain);
      maxValue = d3.max(domain);

      input.property('min', minValue);
      input.property('max', maxValue);
      input.property('step', stepSize);
      input.property('value', value);
      input.on('input', function() {
        dispatch.sliderChange(+this.value);
      });

      output.text(value + ' ' + units);
    });
  };

  slider.stepSize = function(value) {
    if (!arguments.length) return stepSize;
    stepSize = value;
    return slider;
  };

  slider.running = function(value) {
    if (!arguments.length) return running;
    running = value;
    return slider;
  };

  slider.delay = function(value) {
    if (!arguments.length) return delay;
    delay = value;
    return slider;
  };

  slider.domain = function(value) {
    if (!arguments.length) return domain;
    domain = value;
    return slider;
  };

  slider.units = function(value) {
    if (!arguments.length) return units;
    units = value;
    return slider;
  };

  slider.maxStepInd = function(value) {
    if (!arguments.length) return maxStepInd;
    maxStepInd = value;
    return slider;
  };

  slider.curValue = function(value) {
    if (!arguments.length) return curValue;
    curValue = value;
    return slider;
  };

  slider.play = function() {
    running = true;
    dispatch.start();

    var t = setInterval(step, delay);

    function step() {
      if (curValue < maxValue && running) {
        curValue += stepSize;
        dispatch.sliderChange(curValue);
      } else {
        dispatch.stop();
        running = false;
        clearInterval(t);
      }
    }
  };

  slider.stop = function() {
    running = false;
    dispatch.stop();
  };

  slider.reset = function() {
    running = false;
    dispatch.sliderChange(minValue);
    dispatch.stop();
  };

  d3.rebind(slider, dispatch, 'on');

  return slider;

}
