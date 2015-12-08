(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define('spectraVis', ['exports'], factory) :
	factory((global.spectraVis = {}));
}(this, function (exports) { 'use strict';

	var networkWidth;
	var networkHeight;
	var svgNetworkMap;
	var subjectObject;
	var curSubject;
	var edgeStatID;
	var NUM_COLORS = 11;
	var NODE_RADIUS = 10;
	var EDGE_WIDTH = 2;
	var stopAnimation = true;
	var curCh1;
	var curCh2;
	var curFreqInd;
	var curTimeInd;
	var mouseFlag = true;
	var edgeFilter;
	var networkView;
	var svgCh1;
	var svgEdgeStat;
	var svgCh2;
	var svgSpectraLegend;
	var svgEdgeStatLegend;
	var edgeStatLegendTitle;
	var svgAnatomicalLegend;
	var svgTimeSlice;
	var edgeFilterDropdown;
	var networkSpinner;
	var spect1Spinner;
	var spect2Spinner;
	var edgeSpinner;
	var panelWidth;
	var panelHeight;
	var legendWidth;
	var timeSliceWidth;
	var timeSliceHeight;
	var edgeInfo;
	var subjectData;
	var visInfo;
	var margin;
	var edgeStatName;
	var channel;
	var edgeData;
	var time;
	var freq;

	function init(params) {

	}

	exports.networkWidth = networkWidth;
	exports.networkHeight = networkHeight;
	exports.svgNetworkMap = svgNetworkMap;
	exports.subjectObject = subjectObject;
	exports.curSubject = curSubject;
	exports.edgeStatID = edgeStatID;
	exports.NUM_COLORS = NUM_COLORS;
	exports.NODE_RADIUS = NODE_RADIUS;
	exports.EDGE_WIDTH = EDGE_WIDTH;
	exports.stopAnimation = stopAnimation;
	exports.curCh1 = curCh1;
	exports.curCh2 = curCh2;
	exports.curFreqInd = curFreqInd;
	exports.curTimeInd = curTimeInd;
	exports.mouseFlag = mouseFlag;
	exports.edgeFilter = edgeFilter;
	exports.networkView = networkView;
	exports.svgCh1 = svgCh1;
	exports.svgEdgeStat = svgEdgeStat;
	exports.svgCh2 = svgCh2;
	exports.svgSpectraLegend = svgSpectraLegend;
	exports.svgEdgeStatLegend = svgEdgeStatLegend;
	exports.edgeStatLegendTitle = edgeStatLegendTitle;
	exports.svgAnatomicalLegend = svgAnatomicalLegend;
	exports.svgTimeSlice = svgTimeSlice;
	exports.panelWidth = panelWidth;
	exports.edgeFilterDropdown = edgeFilterDropdown;
	exports.networkSpinner = networkSpinner;
	exports.spect1Spinner = spect1Spinner;
	exports.spect2Spinner = spect2Spinner;
	exports.edgeSpinner = edgeSpinner;
	exports.panelHeight = panelHeight;
	exports.legendWidth = legendWidth;
	exports.timeSliceWidth = timeSliceWidth;
	exports.timeSliceHeight = timeSliceHeight;
	exports.edgeInfo = edgeInfo;
	exports.subjectData = subjectData;
	exports.visInfo = visInfo;
	exports.margin = margin;
	exports.edgeStatName = edgeStatName;
	exports.channel = channel;
	exports.edgeData = edgeData;
	exports.time = time;
	exports.freq = freq;
	exports.init = init;

}));