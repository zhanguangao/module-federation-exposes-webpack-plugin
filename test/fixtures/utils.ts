export function get() {}
export function pick() {}
export function map() {}
export function filter() {}

export type TUtils = {
  get: typeof get;
  pick: typeof pick;
  map: typeof map;
  filter: typeof filter;
};

export default { get, pick, map, filter };
