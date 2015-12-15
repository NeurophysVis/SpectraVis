import getSymmetricDomain from '../Common/getSymmetricDomain';

export default function(edgeData, numBins) {
  var edgeStatMin = d3.min(edgeData, function(d) {
    return d3.min(d.data, function(e) {
      return d3.min(e, function(f) {
        return f;
      });
    });
  });

  var edgeStatMax = d3.max(edgeData, function(d) {
    return d3.max(d.data, function(e) {
      return d3.max(e, function(f) {
        return f;
      });
    });
  });

  return getSymmetricDomain(edgeStatMin, edgeStatMax, numBins);
}
