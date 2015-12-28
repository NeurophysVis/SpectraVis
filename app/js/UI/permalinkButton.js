import networkView from '../Network-View/networkView';
import networkData from '../Network-View/networkData';

// dummy placeholder to be removed when spectra are implemented
var curCh1 = '';
var curCh2 = '';

var permalinkBox = d3.select('#permalink');
var permalinkButton = d3.select('button#link');
permalinkButton
  .on('click', function() {
    permalinkBox
      .style('display', 'block');
    var linkString = window.location.origin + window.location.pathname + '?' +
      'curSubject=' + networkData.subjectID() +
      '&edgeStatID=' + networkData.edgeStatID() +
      '&edgeFilter=' + networkData.edgeFilterType() +
      '&networkLayout=' + networkView.networkLayout() +
      '&curTime=' + networkData.curTime() +
      '&curFreq=' + networkData.curFreq() +
      '&curCh1=' + curCh1 +
      '&curCh2=' + curCh2;
    permalinkBox.selectAll('textarea').html(linkString);
    permalinkBox.selectAll('.bookmark').attr('href', linkString);
  });

permalinkBox.selectAll('.close')
  .on('click', function() {
    permalinkBox.style('display', 'none');
  });

export {permalinkBox, permalinkButton};
