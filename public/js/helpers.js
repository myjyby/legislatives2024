export function unique (kwargs = {}) {
	const { key, onkey } = kwargs
  const arr = [];
  this.forEach((d) => {
    if (!key) {
      if (arr.indexOf(d) === -1) arr.push(d);
    } else {
      if (onkey) {
        if (arr.map((c) => c).indexOf(d[key]) === -1) arr.push(d[key]);
      } else {
        if (typeof key === 'function') {
          if (arr.map((c) => key(c)).indexOf(key(d)) === -1) arr.push(d);
        } else {
          if (arr.map((c) => c[key]).indexOf(d[key]) === -1) arr.push(d);
        }
      }
    }
  });
  return arr;
};

export function nest (kwargs = {}) {
  const { key, keep } = kwargs;
  // THIS IS NOT QUITE THE SAME FUNCTION AS IN distances.js, THIS MORE CLOSELY RESEMBLES d3.nest
  const arr = [];
  this.forEach((d) => {
    const groupby = typeof key === 'function' ? key(d) : d[key];
    if (!arr.find((c) => c.key === groupby)) {
      if (keep) {
        const obj = {};
        obj.key = groupby;
        obj.values = [d];
        obj.count = 1;
        if (Array.isArray(keep)) keep.forEach((k) => (obj[k] = d[k]));
        else obj[keep] = d[keep];
        arr.push(obj);
      } else arr.push({ key: groupby, values: [d], count: 1 });
    } else {
      arr.find((c) => c.key === groupby).values.push(d);
      arr.find((c) => c.key === groupby).count++;
    }
  });
  return arr;
};

export function chunk (size) {
  const groups = [];
  for (let i = 0; i < this.length; i += size) {
    groups.push(this.slice(i, i + size));
  }
  return groups;
};