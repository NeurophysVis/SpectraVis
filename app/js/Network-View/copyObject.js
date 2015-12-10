export default function(obj) {
  var newObj = {};
  for (var key in obj) {
    // Copy all the fields
    newObj[key] = obj[key];
  }

  return newObj;
}
