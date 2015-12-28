import networkData from '../Network-View/networkData';
import networkView from '../Network-View/networkView';
import timeSlider from './timeSlider';
import freqSlider from './freqSlider';
import {save as saveSVG} from '../../../node_modules/d3-save-svg/index.js';

var exportButton = d3.select('button#export');

var curCh1 = ''; // dummy to be removed later
var curCh2 = ''; // dummy to be removed later

exportButton
  .on('click', function() {
    var networkSVG = d3.select('#NetworkPanel').select('svg').node();
    var networkSaveName = 'Network' + '_' +
      networkData.subjectID() + '_' +
      networkData.edgeStatID() + '_' +
      networkView.networkLayout() + '_' +
      networkData.curTime() + timeSlider.units() + '_' +
      networkData.curFreq() + freqSlider.units();

    saveSVG(networkSVG, {filename: networkSaveName});

    var ch1SaveName = 'Spectra' + '_' +
      networkData.subjectID() + '_' +
      'Ch' + curCh1;

    var ch1SVG = d3.select('#SpectraCh1Panel').select('svg').node();
    saveSVG(ch1SVG, {filename: ch1SaveName});

    var ch2SaveName = 'Spectra' + '_' +
      networkData.subjectID() + '_' +
      'Ch' + curCh2;

    var ch2SVG = d3.select('#SpectraCh2Panel').select('svg').node();
    saveSVG(ch2SVG, {filename: ch2SaveName});

    var edgeSaveName = networkData.edgeStatID() + '_' +
      networkData.subjectID() + '_' +
      'Ch' + curCh1 + '_' +
      'Ch' + curCh2;

    var edgeSVG = d3.select('#EdgeStatPanel').select('svg').node();
    saveSVG(edgeSVG, {filename: edgeSaveName});

    d3.selectAll('circle.node')[0]
      .forEach(function(n) {n.setAttribute('style', '');
    });
  });

export default exportButton;
