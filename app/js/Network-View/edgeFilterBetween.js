export default function(e) {
  var showEdge = (e.source.region !== e.target.region);
  return showEdge;
}
