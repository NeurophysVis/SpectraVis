import createDropdown from './createDropdown';
import networkData from '../Network-View/networkData';
import filterTypes from './filterTypes';

var edgeFilterDropdown = createDropdown()
  .key('filterType')
  .displayName('filterName')
  .options(filterTypes);

edgeFilterDropdown.on('click', function() {
  var edgeFilter = d3.select(this).data()[0];
  networkData
    .edgeFilterType(edgeFilter.filterType)
    .filterNetworkData();
});

export default edgeFilterDropdown;
