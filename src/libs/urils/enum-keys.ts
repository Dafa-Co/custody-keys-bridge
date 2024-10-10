
export const getKey = (statusValue: number | string,  targetEnum): any => {
  if(typeof statusValue === 'string') return statusValue;
  return Object.keys(targetEnum).find(key => targetEnum[key] === statusValue);
}