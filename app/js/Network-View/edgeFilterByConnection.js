import edgeFilterWithin from './edgeFilterWithin';
import edgeFilterBetween from './edgeFilterBetween';

var edgeFilterByConnection = {
  Within: edgeFilterWithin,
  Between: edgeFilterBetween,
  All: function() {return true;},
};

export default edgeFilterByConnection;
