import getSymmetricDomain from '../Common/getSymmetricDomain';

export default function(data, numBins) {
  var min = d3.min(data, function(d) {
    return d3.min(d.data, function(e) {
      return d3.min(e, function(f) {
        return f;
      });
    });
  });

  var max = d3.max(data, function(d) {
    return d3.max(d.data, function(e) {
      return d3.max(e, function(f) {
        return f;
      });
    });
  });

  return getSymmetricDomain(min, max, numBins);
}
