export default function() {

  var step;
  var domain;
  var maxStepInd;
  var units;
  var curValue;
  var dispatch = d3.dispatch('sliderChange');

  function slider(selection) {
    selection.each(function(value) {
      var input = d3.select(this).selectAll('input');
      var output = d3.select(this).selectAll('output');
      step = d3.round(domain[1] - domain[0], 4);
      maxStepInd = domain.length - 1;
      curValue = value;

      input.property('min', d3.min(domain));
      input.property('max', d3.max(domain));
      input.property('step', step);
      input.property('value', value);
      input.on('input', function() {
        dispatch.sliderChange(+this.value);
      });

      output.text(value + ' ' + units);
    });
  };

  slider.step = function(value) {
    if (!arguments.length) return step;
    step = value;
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

  d3.rebind(slider, dispatch, 'on');

  return slider;

}
