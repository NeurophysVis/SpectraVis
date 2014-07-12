// This is a test comment for github learning
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

// Load Channel 1 data, make heatmap
