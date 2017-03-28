import { IComponentDefinition } from '../Base/Component';
import { Initialization } from '../Base/Initialization';
import { lazyExport } from '../../GlobalExports';
import { Promise } from 'es6-promise';

export function lazyFacet() {
  Initialization.registerLazyComponent('Facet', () => {
    return new Promise((resolve, reject) => {
      require.ensure(['./Facet'], () => {
        let loaded = require<IComponentDefinition>('./Facet.ts')['Facet'];
        lazyExport(loaded, resolve);
      }, 'Facet');
    });
  });
}
