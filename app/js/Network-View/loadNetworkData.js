export default function(subjects, visInfo, edgeTypes, params, appDispatcher) {
  params.curSubject = params.curSubject || subjects[0].subjectID;
  params.edgeStatID = params.edgeStatID || edgeTypes[0].edgeStatID;
  var edgeFile = 'edges_' + params.curSubject + '_' + params.edgeStatID + '.json';
  var channelFile = 'channels_' + params.curSubject + '.json';

  // Load subject data
  queue()
    .defer(d3.json, 'DATA/' + edgeFile)
    .defer(d3.json, 'DATA/' + channelFile)
    .await(function(error, edgeData, channel) {
      // Preprocess
      channel = channel.map(function(n) {
        n.fixedX = n.x;
        n.fixedY = n.y;
        n.fixed = false;
        return n;
      });

      // Replace source name by source object
      edgeData = edgeData.map(function(e) {
        e.source = channel.filter(function(n) {
          return n.channelID === e.source;
        })[0];

        e.target = channel.filter(function(n) {
          return n.channelID === e.target;
        })[0];

        return e;
      });

      appDispatcher.loadNetwork(subjects, visInfo, edgeTypes, edgeData, channel, params);
    });
}
