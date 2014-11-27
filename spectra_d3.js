var margin = {top: 20, right: 10, bottom: 20, left: 10};
var width = document.getElementById("Ch1Panel").offsetWidth - margin.left - margin.right,
    height = document.getElementById("Ch1Panel").offsetWidth*4/5 - margin.top - margin.bottom;


svgCh1 = d3.select("#Ch1Panel").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

svgCh2 = d3.select("#Ch2Panel").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

svgCoh = d3.select("#CoherencePanel").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Load data
var curSubject = "SIM03_B0.00T0.63",
    curCh1 = "1",
    curCh2 = "2";

var spectCh1_file = "spectrogram_" + curSubject + "_" + "C" + curCh1 + ".json",
    spectCh2_file = "spectrogram_" + curSubject + "_" + "C" + curCh2 + ".json",
    coh_file = "coherogram_" + curSubject + "_" + "C" + curCh1 + "_C" + curCh2 + ".json";

// Wait until files are loaded before drawing heatmaps
queue()
    .defer(d3.json, "DATA/" + spectCh1_file)
    .defer(d3.json, "DATA/" + spectCh2_file)
    .defer(d3.json, "DATA/" + coh_file)
    .await(display);

// Draws heatmaps
function display(isError, spect1_data, spect2_data, coh_data) {

  var timeScale, freqScale, powerScale, cohScale;

  setupScales();

  drawSpect(svgCh1, spect1_data);
  drawCoh(svgCoh, coh_data);
  drawSpect(svgCh2, spect2_data);

  function setupScales() {
    var powerMin, powerMax, cohMax, cohMin;

    powerMin = d3.min(
      [d3.min(spect1_data.data, function(d) {
        return d3.min(d, function(e) {return e;});
      }),
      d3.min(spect2_data.data, function(d) {
        return d3.min(d, function(e) {return e;});
      })]
    );

    powerMax = d3.max(
      [d3.max(spect1_data.data, function(d) {
        return d3.max(d, function(e) {return e;});
      }),
      d3.max(spect2_data.data, function(d) {
        return d3.max(d, function(e) {return e;});
      })]
    );

    cohMin = d3.min(coh_data.data, function(d) {
      return d3.min(d, function(e) {return e;});
    });

    cohMax = d3.max(coh_data.data, function(d) {
      return d3.max(d, function(e) {return e;});
    });

    timeScale = d3.scale.linear()
      .domain(d3.extent(spect1_data.tax))
      .range([width, 0]);

    freqScale = d3.scale.linear()
      .domain(d3.extent(spect1_data.fax))
      .range([0, height]);

    powerScale = d3.scale.linear()
      .domain([powerMin, powerMax]);

    cohScale = d3.scale.linear()
      .domain([cohMin, cohMax]);



  }
  function drawSpect(spectGroup, spect_data) {

  }
  function drawCoh(cohGroup, coh_data) {

  }

}
