import { WarStackAdapter, AdapterConfig } from './warstack';

export function initializeWarStack(config: AdapterConfig = {}) {
  const warStack = new WarStackAdapter({
    version: '12.6.0',
    ...config,
  });

  return warStack;
}