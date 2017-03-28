import { IComponentDefinition } from '../Base/Component';
import { Initialization } from '../Base/Initialization';
import { lazyExport } from '../../GlobalExports';

export function lazyOmnibox() {
  Initialization.registerLazyComponent('Omnibox', () => {
    return new Promise((resolve, reject) => {
      require.ensure(['./Omnibox'], () => {
        let loaded = require<IComponentDefinition>('./Omnibox.ts')['Omnibox'];
        lazyExport(loaded, resolve);
      }, 'Omnibox');
    });
  });
}
