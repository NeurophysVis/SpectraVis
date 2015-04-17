var heatmapPowerColor,
    heatmapCohColor,
    powerColors = colorbrewer.Blues[9],
    cohColors = colorbrewer.Greens[9],
    powerLineFun, cohLineFun, freqSlicePowerScale, freqSliceCohScale,
    spect1Line, spect2Line, cohLine;
var margin = {top: 40, right: 40, bottom: 40, left: 40};
var width = document.getElementById("Ch1Panel").offsetWidth - margin.left - margin.right,
    height = document.getElementById("Ch1Panel").offsetWidth*4/5 - margin.top - margin.bottom;


svgCh1 = d3.select("#Ch1Panel")
    .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

svgCh2 = d3.select("#Ch2Panel")
    .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

svgCoh = d3.select("#CoherencePanel")
    .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var legendWidth = document.getElementById("legendKey").offsetWidth - margin.left - margin.right,
    legendHeight = 180 - margin.top - margin.bottom;

svgLegend = d3.select("#legendKey")
    .append("svg")
      .attr("width", legendWidth + margin.left + margin.right)
      .attr("height", legendHeight + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var freqSliceWidth = document.getElementById("freqSlice").offsetWidth - margin.left - margin.right;
    freqSliceHeight =  180 - margin.top - margin.bottom;

svgFreqSlice = d3.select("#freqSlice")
    .append("svg")
      .attr("width", freqSliceWidth + margin.left + margin.right)
      .attr("height", freqSliceHeight + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var networkWidth = document.getElementById("NetworkPanel").offsetWidth*2/5 - margin.left - margin.right;
    networkHeight =  document.getElementById("NetworkPanel").offsetWidth*2/5 - margin.top - margin.bottom;
svgNetworkMap = d3.select("#NetworkPanel")
    .append("svg")
      .attr("width", networkWidth + margin.left + margin.right)
      .attr("height", networkHeight + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Load data
var curSubject = "SIM03_B0.00T0.63",
    curCh1 = 1,
    curCh2 = 4,
    curFreq_ind = 0,
    curTime_ind = 0
    mouseFlag = true;

// Load Files
function loadData() {

var spectCh1_file = "spectrogram_" + curSubject + "_" + "C" + curCh1 + ".json",
    spectCh2_file = "spectrogram_" + curSubject + "_" + "C" + curCh2 + ".json",
    coh_file = "coherogram_" + curSubject + "_" + "C" + curCh1 + "_C" + curCh2 + ".json",
    channel_file = "channels_" + curSubject + ".json"
    edge_file = "edges_" + curSubject + ".json";

queue()
    .defer(d3.json, "DATA/" + spectCh1_file)
    .defer(d3.json, "DATA/" + spectCh2_file)
    .defer(d3.json, "DATA/" + coh_file)
    .defer(d3.json, "DATA/" + channel_file)
    .defer(d3.json, "DATA/" + edge_file)
    .await(display);
}
loadData();
// Draw
function display(isError, spect1, spect2, coh, channel, edge) {

  var timeScale, timeScaleLinear, freqScale, powerScale, cohScale,
      tAx, fAx, heatmapPowerColor, networkXScale, networkYScale, force, timeSlider,
      freqSlider, timeSliderText, freqSliderText, subjectDropdown;

  tAx = spect1.tax; // Time Axis
  fAx = spect1.fax; // Frequency Axis

  setupScales();
  setupNodesEdges();
  setupSliders();

  drawNetwork();
  drawHeatmap(svgCh1, spect1, powerScale, heatmapPowerColor);
  drawHeatmap(svgCh2, spect2, powerScale, heatmapPowerColor);
  drawHeatmap(svgCoh, coh, cohScale, heatmapCohColor);

  drawTitles();
  drawLegends();
  setupFreqSlice();
  handleSubjectChange()

  function setupSliders() {
    timeSlider = d3.select("#timeSlider");
    timeSliderText = d3.select("#timeSlider-value");
    freqSlider = d3.select("#freqSlider");
    freqSliderText = d3.select("#freqSlider-value");

    timeSlider.property("min", d3.min(tAx));
    timeSlider.property("max", d3.max(tAx));
    timeSlider.property("step", d3.round(tAx[1] - tAx[0], 4));
    timeSlider.property("value", tAx[curTime_ind]);
    timeSlider.on("input", updateTimeSlider);
    timeSliderText.text(tAx[curTime_ind]);

    freqSlider.property("min", d3.min(fAx));
    freqSlider.property("max", d3.max(fAx));
    freqSlider.property("step", fAx[1] - fAx[0]);
    freqSlider.property("value", fAx[curFreq_ind]);
    freqSlider.on("input", updateFreqSlider)
    freqSliderText.text(fAx[curFreq_ind]);

    function updateTimeSlider(){
      curTime_ind = tAx.indexOf(+this.value);
      timeSliderText.text(tAx[curTime_ind]);
      drawNetwork();
    }
    function updateFreqSlider(){
      curFreq_ind = fAx.indexOf(+this.value);
      drawNetwork();
      freqSliderText.text(fAx[curFreq_ind]);
    }
  }
  function setupNodesEdges() {
    // Replace source name by source object
    edge = edge.map(function(e) {
      e.source = channel.filter(function(n) {return n.name === e.source;});
      e.source = e.source[0];
      e.target = channel.filter(function(n) {return n.name === e.target;});
      e.target = e.target[0];
      return e;
    });

    // Replace x and y coordinates of nodes with properly scaled x,y
    channel = channel.map(function(n) {
      n.x = networkXScale(n.x);
      n.y = networkYScale(n.y)
      return n;
    });

    force = d3.layout.force()
      .nodes(channel)
      .links(edge)
      .charge(-200)
      .linkDistance(300)
      .size([networkWidth, networkHeight])
      .start();
  }
  function setupScales() {
    var powerMin, powerMax, cohMax, cohMin, networkXExtent,
        networkYExtent;

    heatmapPowerColor = d3.scale.linear()
      .domain(d3.range(0, 1, 1.0 / (powerColors.length - 1)))
      .range(powerColors);
    heatmapCohColor = d3.scale.linear()
      .domain(d3.range(0, 1, 1.0 / (cohColors.length - 1)))
      .range(cohColors);

    powerMin = d3.min(
      [d3.min(spect1.data, function(d) {
        return d3.min(d, function(e) {return e;});
      }),
      d3.min(spect2.data, function(d) {
        return d3.min(d, function(e) {return e;});
      })]
    );

    powerMax = d3.max(
      [d3.max(spect1.data, function(d) {
        return d3.max(d, function(e) {return e;});
      }),
      d3.max(spect2.data, function(d) {
        return d3.max(d, function(e) {return e;});
      })]
    );

    cohMin = d3.min(coh.data, function(d) {
      return d3.min(d, function(e) {return e;});
    });

    cohMax = d3.max(coh.data, function(d) {
      return d3.max(d, function(e) {return e;});
    });

    networkXExtent = d3.extent(channel, function(c) {return c.x;});
    networkYExtent = d3.extent(channel, function(c) {return c.y;});

    timeScale = d3.scale.ordinal()
      .domain(tAx)
      .rangeBands([0, width]);

    timeScaleLinear = d3.scale.linear()
      .domain(d3.extent(tAx))
      .range([0, width]);

    freqScale = d3.scale.ordinal()
      .domain(fAx)
      .rangeBands([height, 0]);

    powerScale = d3.scale.linear()
      .domain([powerMin, powerMax])
      .range([0, 1]);

    cohScale = d3.scale.linear()
      .domain([cohMin, cohMax])
      .range([0,1]);

    freqSlicePowerScale = d3.scale.linear()
      .domain([powerMin, powerMax])
      .range([freqSliceHeight, 0]);

    freqSliceCohScale = d3.scale.linear()
      .domain([cohMin, cohMax])
      .range([freqSliceHeight, 0]);

    networkXScale = d3.scale.linear()
      .domain(networkXExtent)
      .range([0, networkWidth]);
    networkYScale = d3.scale.linear()
      .domain(networkYExtent)
      .range([networkHeight, 0]);

  }
  function drawNetwork() {
    var nodeG, strokeStyle;

    edgeLine = svgNetworkMap.selectAll(".edge").data(edge, function(e) {return e.source.name + "_" + e.target.name});
    edgeLine.enter()
      .append("line")
        .attr("class", "edge")
        .style("stroke-width", 1);
    edgeLine
      .style("stroke", function(d) {
          return heatmapCohColor(cohScale(d.data[curTime_ind][curFreq_ind]));
        })
    edgeLine
      .on("mouseover", edgeMouseOver)
      .on("mouseout", edgeMouseOut)
      .on("click", edgeMouseClick);

    nodeG = svgNetworkMap.selectAll("g.gnode").data(channel, function(d) {return d.name;});
    nodeG.enter()
      .append("g")
      .attr("class", "gnode")
      .attr("transform", function(d) {
        return 'translate(' + [d.x, d.y] + ')';
      });

    nodeCircle = nodeG.selectAll("circle.node").data(function(d) {return [d];});
    nodeCircle.enter()
      .append("circle")
        .attr("class", "node")
        .attr("r", 20)
        .attr("fill", "#ddd")
        .attr("opacity", 0.9);

    nodeText = nodeG.selectAll("text.nodeLabel").data(function(d) {return [d];});
    nodeText.enter()
      .append('text')
        .attr("class", "nodeLabel")
        .text(function(d) {return d.name;});
    // For every iteration of force simulation "tick"
    force.on("tick", function() {
      edgeLine.attr("x1", function(d) {return (d.source.x); })
          .attr("y1", function(d) { return (d.source.y); })
          .attr("x2", function(d) { return (d.target.x); })
          .attr("y2", function(d) { return(d.target.y); });

       // Translate the groups
      nodeG.attr("transform", function(d) {
        return 'translate(' + [d.x, d.y] + ')';
      });
   });

   function edgeMouseOver(e) {

     var curEdge = d3.select(this);
     strokeStyle = curEdge.style("stroke");
     curEdge
       .style("stroke-width", 3)
       .style("stroke", heatmapCohColor(d3.max(heatmapCohColor.domain())));
    d3.selectAll("circle.node")
      .filter(function(n) {
        return (n.name === e.source.name) || (n.name === e.target.name);
      })
        .attr("fill", "red");
   }
   function edgeMouseOut(e) {
     var curEdge = d3.select(this);
     curEdge
       .style("stroke-width", 1)
       .style("stroke", strokeStyle);
     d3.selectAll("circle.node")
      .filter(function(n) {
        return (n.name === e.source.name) || (n.name === e.target.name);
      })
        .attr("fill", "#ddd");
   }
   function edgeMouseClick(e) {
     var re = /\d+/;
     curCh1 = re.exec(e.source.name)[0];
     curCh2 = re.exec(e.target.name)[0];
     mouseFlag = true;
     loadData();
   }
  };
  function drawHeatmap(curPlot, curData, intensityScale, colorScale) {

    var heatmapG, heatmapRect, timeAxis, freqAxis, zeroG, zeroLine,
        hoverLine, hoverLineG;

    heatmapG = curPlot.selectAll("g.time").data(curData.data);
    heatmapG.enter()
      .append("g")
        .attr("transform", function(d, i) {
            return "translate(" + timeScale(tAx[i]) + ",0)";
          })
        .attr("class", "time");
    heatmapRect = heatmapG.selectAll("rect").data(function(d) {return d;});
    heatmapRect.enter()
      .append("rect")
      .attr("x", 0)
      .attr("y", function(d, i) {return freqScale(fAx[i]);})
      .attr("height", freqScale.rangeBand() )
      .attr("width", timeScale.rangeBand() )
      .style("fill", "white");
    heatmapRect
      .style("fill", function(d) {
          return colorScale(intensityScale(d));
        })
      .style("stroke", function(d) {
          return colorScale(intensityScale(d));
        });
    heatmapRect
      .on("mouseover", rectMouseOver)
      .on("click", rectMouseClick);

    timeAxis = d3.svg.axis()
                  .scale(timeScaleLinear)
                  .orient("bottom")
                  .ticks(3)
                  .tickValues([d3.min(tAx), 0, d3.max(tAx)])
                  .tickSize(0,0,0);
    freqAxis = d3.svg.axis()
                  .scale(freqScale)
                  .orient("left")
                  .tickSize(0,0,0);

    timeAxisG = curPlot.selectAll("g.timeAxis").data([{}]);
    timeAxisG.enter()
        .append("g")
        .attr("class", "timeAxis")
        .attr("transform", "translate(0," + height + ")")
        .append("text")
          .attr("x", timeScaleLinear(0))
          .attr("y", 0)
          .attr("text-anchor", "middle")
          .attr("dy", 2 + "em")
          .text("Time (s)");
    timeAxisG.call(timeAxis);

    freqAxisG = curPlot.selectAll("g.freqAxis").data([{}]);
    freqAxisG.enter()
      .append("g")
      .attr("class", "freqAxis")
      .append("text")
        .attr("x", -height/2)
        .attr("dy", -2 + "em")
        .attr("transform", "rotate(-90)")
        .attr("text-anchor", "middle")
        .text("Frequency (Hz)");
    freqAxisG.call(freqAxis);

    zeroG = curPlot.selectAll("g.zeroLine").data([[[0, height]]]);
    zeroG.enter()
      .append("g")
      .attr("class", "zeroLine");
    zeroLine = zeroG.selectAll("path").data(function(d) {return d;});
    zeroLine.enter()
      .append("path");
    zeroLine
      .attr("d", d3.svg.line()
            .x(timeScaleLinear(0))
            .y(function(d) { return d; })
            .interpolate("linear"))
      .attr("stroke", "black")
      .attr("stroke-width", 2)
      .attr("fill", "none")
      .style("opacity", 0.7);

    // add a 'hover' line that we'll show as a user moves their mouse (or finger)
		// so we can use it to show detailed values of each line
		hoverLineG = curPlot.append("g.hover-line")
							.attr("class", "hover-line");
		// add the line to the group
		hoverLine = hoverLineG
			.append("line")
				.attr("x1", 10).attr("x2", 10) // vertical line so same value on each
				.attr("y1", 0).attr("y2", height); // top to bottom

		// hide it by default
		hoverLine.classed("hide", true);
  }
  function drawTitles() {
    var titleCh1, titleCh2, titleCoh;
    titleCh1 = svgCh1.selectAll("text.title").data(spect1["chLbl"]);
    titleCh1.exit().remove();
    titleCh1.enter()
      .append("text")
        .attr("x", timeScaleLinear(0))
        .attr("y", 0)
        .attr("dy", -0.5 + "em")
        .attr("text-anchor", "middle")
        .attr("class", "title");
    titleCh1
        .text(function(d) {
          return "Spectra: Ch" + d;
        });
    titleCh2 = svgCh2.selectAll("text.title").data(spect2["chLbl"]);
    titleCh2.exit().remove();
    titleCh2.enter()
      .append("text")
        .attr("x", timeScaleLinear(0))
        .attr("y", 0)
        .attr("dy", -0.5 + "em")
        .attr("text-anchor", "middle")
        .attr("class", "title");
    titleCh2
        .text(function(d) {
          return "Spectra: Ch" + d;
        });
    titleCoh = svgCoh.selectAll("text.title").data([coh]);
    titleCoh.exit().remove();
    titleCoh.enter()
      .append("text")
        .attr("x", timeScaleLinear(0))
        .attr("y", 0)
        .attr("dy", -0.5 + "em")
        .attr("text-anchor", "middle")
        .attr("class", "title");
    titleCoh
        .text(function(d) {
          return "Coherence: Ch" + d.chLbl1 + "-Ch" + d.chLbl2;
        });

  }
  function drawLegends() {
    var powerG, powerLegendRect, legendScale, colorInd, powerAxisG, powerAxis, formatter,
        cohG, cohLegendRect, cohAxisG, cohAxis, chartKeyText;

    formatter = d3.format(".2f");
    colorInd = d3.range(0, 1, 1.0 / (powerColors.length - 1));

    chartKeyText = svgLegend.selectAll("g#ChartText").data([{}]);
    chartKeyText.enter()
      .append("text")
        .attr("id", "ChartText")
        .attr("transform", "translate(10," + 9 + ")")
        .attr("x", 0)
        .attr("y", 0)
        .attr("text-anchor", "end")
        .attr("font-size", 10 + "px")
        .attr("font-weight", "700")
        .attr("color", "#333")
        .text("Chart Key");

    legendScale = d3.scale.ordinal()
      .domain(colorInd)
      .rangeBands([0, 175]);
    // Power Legend
    powerG = svgLegend.selectAll("g#powerLegend").data([{}]);
    powerG.enter()
      .append("g")
      .attr("id", "powerLegend")
      .attr("transform", "translate(60, 0)");
    powerLegendRect = powerG.selectAll("rect.power").data(colorInd);
    powerLegendRect.enter()
      .append("rect")
        .attr("class", "power")
        .attr("x", function(d) {return legendScale(d);})
        .attr("y", 0)
        .attr("height", 10)
        .attr("width", legendScale.rangeBand());
    powerLegendRect
      .style("fill", function(d) {return heatmapPowerColor(d);});
    powerAxis = d3.svg.axis()
      .scale(legendScale)
      .orient("bottom")
      .ticks(2)
      .tickValues([colorInd[0], colorInd[colorInd.length-1]])
      .tickFormat(function (d) {
        return formatter(powerScale.invert(+d));
      })
      .tickSize(0,0,0);
    powerAxisG = powerG.selectAll("g.powerAxis").data([{}]);
    powerAxisG.enter()
      .append("g")
        .attr("transform", "translate(0," + 9 + ")")
        .attr("class", "powerAxis")
        .append("text")
          .attr("x", 0)
          .attr("y", 0)
          .attr("text-anchor", "end")
          .text("Power");
    powerAxisG.call(powerAxis);
    // Coh Legend
    cohG = svgLegend.selectAll("g#cohLegend").data([{}]);
    cohG.enter()
      .append("g")
      .attr("id", "cohLegend")
      .attr("transform", "translate(" + 300 + ", 0)");
    cohLegendRect = cohG.selectAll("rect.coh").data(colorInd);
    cohLegendRect.enter()
      .append("rect")
        .attr("class", "coh")
        .attr("x", function(d) {return legendScale(d);})
        .attr("y", 0)
        .attr("height", 10)
        .attr("width", legendScale.rangeBand());
    cohLegendRect
      .style("fill", function(d) {return heatmapCohColor(d);});
    cohAxis = d3.svg.axis()
      .scale(legendScale)
      .orient("bottom")
      .ticks(2)
      .tickValues([colorInd[0], colorInd[colorInd.length-1]])
      .tickFormat(function (d) {
        return formatter(cohScale.invert(+d));
      })
      .tickSize(0,0,0);
    cohAxisG = cohG.selectAll("g.cohAxis").data([{}]);
    cohAxisG.enter()
      .append("g")
        .attr("transform", "translate(0," + 9 + ")")
        .attr("class", "cohAxis")
      .append("text")
        .attr("x", 0)
        .attr("y", 0)
        .attr("text-anchor", "end")
        .text("Coherence");
    cohAxisG.call(cohAxis);

  }
  function setupFreqSlice() {
    var freqAxis, freqG, freqSlicePowerAxis, powerG,
        cohAxis, cohG, freqScale;

    freqScale = d3.scale.ordinal()
        .domain(fAx)
        .rangeBands([0, freqSliceWidth]);

    powerLineFun = d3.svg.line()
        .x(function(d, i) { return freqScale(fAx[i]) + freqScale.rangeBand()/2;})
        .y(function(d) {return freqSlicePowerScale(d);});
    cohLineFun = d3.svg.line()
        .x(function(d, i) { return freqScale(fAx[i]) + freqScale.rangeBand()/2;})
        .y(function(d) {return freqSliceCohScale(d);});

    freqAxis = d3.svg.axis()
        .scale(freqScale)
        .orient("bottom")
        .tickValues(["10", "20", "40", "60", "90"])
        .tickSize(0,0,0);
    cohAxis = d3.svg.axis()
        .scale(freqSliceCohScale)
        .orient("right")
        .ticks(2)
        .tickValues(freqSliceCohScale.domain())
        .tickSize(0,0,0);
    powerAxis = d3.svg.axis()
        .scale(freqSlicePowerScale)
        .orient("left")
        .ticks(2)
        .tickValues(freqSlicePowerScale.domain())
        .tickSize(0,0,0);

    freqG = svgFreqSlice.selectAll("g.freqSliceAxis").data([{}]);
    freqG.enter()
        .append("g")
          .attr("class", "freqSliceAxis")
          .attr("transform", "translate(0," + freqSliceHeight + ")")
        .append("text")
          .attr("x", freqSliceWidth/2)
          .attr("y", 0)
          .attr("text-anchor", "middle")
          .attr("dy", 2 + "em")
          .text("Frequency (Hz)");
     freqG.call(freqAxis);

     cohG = svgFreqSlice.selectAll("g.cohSliceAxis").data([{}]);
     cohG.enter()
        .append("g")
          .attr("class", "cohSliceAxis")
          .attr("transform", "translate(" + freqSliceWidth + ",0)")
        .append("text")
          .attr("x", freqSliceHeight/2)
          .attr("y", 0)
          .attr("dy", -0.5 + "em")
          .attr("transform", "rotate(90)")
          .attr("text-anchor", "middle")
          .text("Coherence (a.u)");
     cohG.call(cohAxis)

     powerG = svgFreqSlice.selectAll("g.powerSliceAxis").data([{}]);
     powerG.enter()
        .append("g")
          .attr("class", "powerSliceAxis")
        .append("text")
          .attr("x", -freqSliceHeight/2)
          .attr("y", 0)
          .attr("dy", -0.5 + "em")
          .attr("transform", "rotate(-90)")
          .attr("text-anchor", "middle")
          .text("Power (a.u)");
    powerG.call(powerAxis);
  }
  function rectMouseOver(d, freqInd, timeInd) {
    curFreq_ind = freqInd;
    curTime_ind = timeInd;

    spect1Line = svgFreqSlice.selectAll("path.spect1").data([spect1.data[timeInd]]);
    spect1Line.enter()
      .append("path")
      .attr("class", "spect1")
      .attr("stroke", "blue")
      .attr("stroke-width", 2)
      .attr("fill", "none");
    spect1Line
      .transition()
        .duration(5)
        .ease("linear")
      .attr("d", powerLineFun);
    spect2Line = svgFreqSlice.selectAll("path.spect2").data([spect2.data[timeInd]]);
    spect2Line.enter()
      .append("path")
      .attr("class", "spect2")
      .attr("stroke", "blue")
      .attr("stroke-width", 2)
      .attr("fill", "none");
    spect2Line
      .transition()
        .duration(5)
        .ease("linear")
      .attr("d", powerLineFun);
    cohLine = svgFreqSlice.selectAll("path.coh").data([coh.data[timeInd]]);
    cohLine.enter()
      .append("path")
        .attr("class", "coh")
        .attr("stroke", "green")
        .attr("stroke-width", 2)
        .attr("fill", "none");
    cohLine
      .transition()
        .duration(5)
        .ease("linear")
      .attr("d", cohLineFun);
    timeTitle = svgFreqSlice.selectAll("text.title").data([tAx[timeInd]]);
    timeTitle.enter()
      .append("text")
      .attr("text-anchor", "middle")
      .attr("class", "title")
      .attr("x", freqSliceWidth/2)
      .attr("y", 0)
      .attr("dy", -1 + "em");
    timeTitle
      .text(function(d) {return "Frequency Slice @ Time " + d + " s";});

    timeSlider.property("value", tAx[curTime_ind]);
    timeSliderText.text(tAx[curTime_ind]);
    freqSlider.property("value", fAx[curFreq_ind]);
    freqSliderText.text(fAx[curFreq_ind]);
    if (mouseFlag) {drawNetwork()};
  }
  function rectMouseClick() {
    mouseFlag = !mouseFlag;
  }
  function handleSubjectChange() {
    subjectDropdown = d3.select("#SubjectDropdown");
    subjectDropdown.selectAll("li")
      .on("click", function() {
        curSubject = this.id;
        loadData();
        })
  }
}
