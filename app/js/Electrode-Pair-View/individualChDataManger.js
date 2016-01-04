import createChannelScale from './createChannelStatScale';

export default function() {

  var subjectID = '';
  var channel1ID = '';
  var channel2ID = '';
  var channel1Data = [];
  var channel2Data = [];
  var isFreq = true;
  var channelStatScale = {};
  var times = [];
  var frequencies = [];
  var dispatch = d3.dispatch('channelDataReady');
  var dataManager = {};

  dataManager.loadChannelData = function() {
    if (channel1ID === '' || channel2ID === '' || subjectID === '') return;
    var channel1File = 'spectrogram_' + subjectID + '_' + channel1ID + '.json';
    var channel2File = 'spectrogram_' + subjectID + '_' + channel2ID + '.json';

    queue()
      .defer(d3.json, 'DATA/' + channel1File)
      .defer(d3.json, 'DATA/' + channel2File)
      .await(function(error, channel1, channel2) {
        channel1Data = channel1.data;
        channel2Data = channel2.data;
        channelStatScale = createChannelScale(channel1, channel2);
        dispatch.channelDataReady();
      });
  };

  dataManager.times = function(value) {
    if (!arguments.length) return times;
    times = value;
    return dataManager;
  };

  dataManager.frequencies = function(value) {
    if (!arguments.length) return frequencies;
    frequencies = value;
    return dataManager;
  };

  dataManager.channelStatScale = function(value) {
    if (!arguments.length) return channelStatScale;
    channelStatScale = value;
    return dataManager;
  };

  dataManager.channel1Data = function(value) {
    if (!arguments.length) return channel1Data;
    channel1Data = value;
    return dataManager;
  };

  dataManager.channel2Data = function(value) {
    if (!arguments.length) return channel2Data;
    channel2Data = value;
    return dataManager;
  };

  dataManager.isFreq = function(value) {
    if (!arguments.length) return isFreq;
    isFreq = value;
    return dataManager;
  };

  dataManager.subjectID = function(value) {
    if (!arguments.length) return subjectID;
    subjectID = value;
    return dataManager;
  };

  dataManager.channel1ID = function(value) {
    if (!arguments.length) return channel1ID;
    channel1ID = value;
    return dataManager;
  };

  dataManager.channel2ID = function(value) {
    if (!arguments.length) return channel2ID;
    channel2ID = value;
    return dataManager;
  };

  d3.rebind(dataManager, dispatch, 'on');

  return dataManager;
}
