/**
 * @param {{ development?: boolean, configuredValue?: string }} [options]
 */
export function isPoseDevToolsEnabled({ development = false, configuredValue } = {}) {
  return development === true && configuredValue?.trim().toLowerCase() === 'true';
}
