export default function(min, max, numBins) {
  if (Math.abs(min) >= Math.abs(max)) {
    max = Math.abs(min);
  } else {
    min = -1 * max;
  }

  return linspace(min, max, numBins);
}

// from https://github.com/sloisel/numeric
function linspace(a, b, n) {
  if (typeof n === 'undefined') {
    n = Math.max(Math.round(b - a) + 1, 1);
  };

  if (n < 2) {
    return n === 1 ? [a] : [];
  }

  var i;
  var ret = Array(n);
  n--;
  for (i = n; i >= 0; i--) {
    ret[i] = (i * b + (n - i) * a) / n;
  }

  return ret;
}
