export function deleteEmpty(value: any) {
  if (!(value instanceof Boolean) && !value) {
    value = undefined;
  }
  return value;
}
