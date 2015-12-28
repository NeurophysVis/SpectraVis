import networkView from '../Network-View/networkView';

var networkViewRadio = d3.select('#NetworkLayoutPanel');
networkViewRadio.selectAll('input').on('click', function() {
    networkViewRadio.selectAll('input')
      .property('checked', false);
    d3.select(this).property('checked', true);
    networkView.networkLayout(this.value);
    d3.selectAll('#NetworkPanel')
        .call(networkView);
  });
