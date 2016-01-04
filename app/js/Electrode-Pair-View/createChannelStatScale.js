import {channelStatColors, NUM_CHANNEL_COLORS} from '../Common/scaleColors';
import getDomain from '../Common/getDomain';

export default function(channel1Data, channel2Data) {

  var domain = getDomain([channel1Data, channel2Data], NUM_CHANNEL_COLORS);

  var channelStatScale = d3.scale.linear()
    .domain(domain)
    .range(channelStatColors);

  return channelStatScale;
}
