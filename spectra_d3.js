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

  var timeScale, freqScale, powerScale, cohScale, tAx, fAx, heatmapColor;

  tAx = spect1_data.tax;
  fAx = spect1_data.fax;

  setupScales();

  drawSpect(svgCh1, spect1_data);
  drawCoh(svgCoh, coh_data);
  drawSpect(svgCh2, spect2_data);

  function setupScales() {
    var powerMin, powerMax, cohMax, cohMin, colors;

    colors = ["#6363FF", "#6373FF", "#63A3FF", "#63E3FF", "#63FFFB", "#63FFCB",
    "#63FF9B", "#63FF6B", "#7BFF63", "#BBFF63", "#DBFF63", "#FBFF63",
    "#FFD363", "#FFB363", "#FF8363", "#FF7363", "#FF6364"];

    heatmapColor = d3.scale.linear()
      .domain(d3.range(0, 1, 1.0 / (colors.length - 1)))
      .range(colors);

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

    timeScale = d3.scale.ordinal()
      .domain(tAx)
      .rangeBands([width, 0]);

    freqScale = d3.scale.ordinal()
      .domain(fAx)
      .rangeBands([0, height]);

    powerScale = d3.scale.linear()
      .domain([powerMin, powerMax])
      .range([0, 1])
      .nice();

    cohScale = d3.scale.linear()
      .domain([cohMin, cohMax])
      .range([0,1])
      .nice;

  }
  function drawSpect(spectG, spect_data) {
    var heatmapG = spectG.selectAll("g.time").data(spect_data.data);
    heatmapG.enter()
      .append("g")
        .attr("transform", function(d, i) {
            return "translate(" + timeScale(tAx[i]) + ",0)";
          })
        .attr("class", "time");
    var heatmapRect = heatmapG.selectAll("rect").data(function(d) {return d;});
    heatmapRect.enter()
      .append("rect")
      .attr("x", freqScale.rangeBand() / 2)
      .attr("y", function(d, i) {return freqScale(fAx[i]);})
      .attr("height", freqScale.rangeBand() )
      .attr("width", timeScale.rangeBand() )
      .style("fill", "black");
    heatmapRect
      .style("fill", function(d) {
          return heatmapColor(powerScale(d));
        })
      .style("stroke", function(d) {
          return heatmapColor(powerScale(d));
        })
  }
  function drawCoh(cohGroup, coh_data) {

  }

}
