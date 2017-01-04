import {Template} from './Template';
import {UnderscoreTemplate} from './UnderscoreTemplate';
import {TemplateCache} from './TemplateCache';
import {IQueryResult} from '../../rest/QueryResult';
import {Assert} from '../../misc/Assert';
import {$$} from '../../utils/Dom';


export class DefaultResultTemplate extends Template {

  constructor() {
    super();
  }

  instantiateToString(queryResult?: IQueryResult): string {
    Assert.exists(queryResult);
    queryResult = _.extend({}, queryResult, UnderscoreTemplate.templateHelpers);

    var defaultTemplates = _.map(TemplateCache.getDefaultTemplates(), (name) => TemplateCache.getTemplate(name));

    // We want to put templates with conditions first
    defaultTemplates.sort((a, b) => {
      if (a.condition == null && b.condition != null) {
        return 1;
      } else if (a.condition != null && b.condition == null) {
        return -1;
      }
      return 0;
    });

    for (var i = 0; i < defaultTemplates.length; i++) {
      var result = defaultTemplates[i].instantiateToString(queryResult);
      if (result != null) {
        return result;
      }
    }

    return this.getFallbackTemplate();
  }

  instantiateToElement(queryResult?: IQueryResult): HTMLElement {
    var div = document.createElement('div');
    div.innerHTML = this.instantiateToString(queryResult);
    return div;
  }


  getFields() {
    var defaultTemplates = _.map(TemplateCache.getDefaultTemplates(), (name) => TemplateCache.getTemplate(name));
    return _.flatten(_.map(defaultTemplates, (template: Template) => template.getFields()));
  }

  getType() {
    return 'DefaultResultTemplate';
  }

  getFallbackTemplate(): string {
    let titleContainer = $$('div', {
      className: 'coveo-title'
    });

    let resultLink = $$('a', {
      className: 'CoveoResultLink'
    });

    titleContainer.append(resultLink.el);

    let excerpt = $$('div', {
      className: 'CoveoExcerpt'
    });

    let resultContainer = $$('div');
    resultContainer.append(titleContainer.el);
    resultContainer.append(excerpt.el);
    return resultContainer.el.outerHTML;
  }
}
