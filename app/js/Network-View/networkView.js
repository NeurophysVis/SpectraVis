import networkChart from './networkChart';
import edgeMouseOver from './edgeMouseOver';
import edgeMouseOut from './edgeMouseOut';
import edgeMouseClick from './edgeMouseClick';
import nodeMouseClick from './nodeMouseClick';

var networkView = networkChart();

networkView.on('edgeMouseOver', edgeMouseOver);
networkView.on('edgeMouseOut', edgeMouseOut);
networkView.on('nodeMouseClick', nodeMouseClick);
networkView.on('edgeMouseClick', edgeMouseClick);

export default networkView;
