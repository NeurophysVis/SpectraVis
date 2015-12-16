export default function() {
  var key;
  var displayName;
  var options;
  var dispatch = d3.dispatch('click');

  function button(selection) {
    selection.each(function(data) {
      var menu = d3.select(this).selectAll('ul').selectAll('li').data(options, function(d) {
        return d[key];
      });

      displayName = (typeof displayName === 'undefined') ? key : displayName;

      menu.enter()
        .append('li')
          .attr('id', function(d) {
            return d[key];
          })
          .attr('role', 'presentation')
          .append('a')
            .attr('role', 'menuitem')
            .attr('tabindex', -1)
            .text(function(d) {
              return d[displayName];
            });

      menu.on('click', dispatch.click);

      menu.exit().remove();

      var curText = options.filter(function(d) {return d[key] === data;})
        .map(function(d) {return d[displayName];})[0];

      d3.select(this).selectAll('button')
        .text(curText)
        .append('span')
        .attr('class', 'caret');
    });

  }

  button.key = function(value) {
    if (!arguments.length) return key;
    key = value;
    return button;
  };

  button.options = function(value) {
    if (!arguments.length) return options;
    options = value;
    return button;
  };

  button.displayName = function(value) {
    if (!arguments.length) return displayName;
    displayName = value;
    return button;
  };

  d3.rebind(button, dispatch, 'on');

  return button;

}
