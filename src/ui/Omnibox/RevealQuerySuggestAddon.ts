///<reference path="Omnibox.ts"/>
import { Omnibox, IPopulateOmniboxSuggestionsEventArgs, IOmniboxSuggestion } from './Omnibox';
import { $$, Dom } from '../../utils/Dom';
import { IRevealQuerySuggestCompletion, IRevealQuerySuggestRequest, IRevealQuerySuggestResponse } from '../../rest/RevealQuerySuggest';
import { ComponentOptionsModel } from '../../models/ComponentOptionsModel';
import { OmniboxEvents } from '../../events/OmniboxEvents';
import { StringUtils } from '../../utils/StringUtils';
import _ = require('underscore');

export class RevealQuerySuggestAddon {

  static INDEX = 60;

  private static suggestiontHtml(suggestion: IRevealQuerySuggestCompletion) {
    return suggestion.highlighted.replace(/\[(.*?)\]|\{(.*?)\}|\((.*?)\)/g, (part, notMatched, matched, corrected) => {
      var className = '';
      if (matched) {
        className = 'coveo-omnibox-hightlight';
      }
      if (corrected) {
        className = 'coveo-omnibox-hightlight2';
      }

      let ret: Dom;
      if (className) {
        ret = $$('span', {
          className: className
        });
      } else {
        ret = $$('span');
      }
      ret.text(notMatched || matched || corrected);
      return ret.el.outerHTML;
    });
  }

  private static isPartialMatch(suggestion: IRevealQuerySuggestCompletion) {
    // groups : 1=notMatched, 2=matched, 3=corrected
    var parts = StringUtils.match(suggestion.highlighted, /\[(.*?)\]|\{(.*?)\}|\((.*?)\)/g);
    var firstFail = _.find(parts, (part: string[]) => part[1] != null);
    // if no fail found, this is a partial or a full match
    if (firstFail == null) {
      return true;
    }
    // if all right parts are notMatched, the right parts is autocomplete
    return _.every(_.last(parts, _.indexOf(parts, firstFail) - parts.length), (part: string[]) => part[1] != null);
  }

  private cache: { [hash: string]: Promise<IOmniboxSuggestion[]> } = {};

  constructor(public omnibox: Omnibox) {
    $$(this.omnibox.element).on(OmniboxEvents.populateOmniboxSuggestions, (e: Event, args: IPopulateOmniboxSuggestionsEventArgs) => {
      args.suggestions.push(this.getSuggestion());
    });
  }

  public getSuggestion(): Promise<IOmniboxSuggestion[]> {

    var text = this.omnibox.magicBox.getText();

    if (text.length == 0) {
      return null;
    }

    if (this.cache[text] != null) {
      return this.cache[text];
    }

    let promise = this.getRevealQuerySuggest(text);
    this.cache[text] = promise;
    promise.catch(() => {
      delete this.cache[text];
    });
    return this.cache[text];
  }

  private getRevealQuerySuggest(text: string): Promise<IOmniboxSuggestion[]> {
    let payload = <IRevealQuerySuggestRequest>{ q: text };
    let language = <string>String['locale'];
    let searchHub = this.omnibox.getBindings().componentOptionsModel.get(ComponentOptionsModel.attributesEnum.searchHub);
    let pipeline = this.omnibox.getBindings().searchInterface.options.pipeline;
    let enableWordCompletion = this.omnibox.options.enableSearchAsYouType;
    let context = this.omnibox.getBindings().queryController.getLastQuery().context;

    if (language) {
      payload.language = language;
    }

    if (searchHub) {
      payload.searchHub = searchHub;
    }

    if (pipeline) {
      payload.pipeline = pipeline;
    }

    if (context) {
      payload.context = context;
    }

    payload.enableWordCompletion = enableWordCompletion;

    return this.omnibox.queryController.getEndpoint()
      .getRevealQuerySuggest(payload)
      .then((result: IRevealQuerySuggestResponse) => {
        var completions = result.completions;
        var results: IOmniboxSuggestion[] = _.map(completions, (completion, i) => {
          return {
            html: RevealQuerySuggestAddon.suggestiontHtml(completion),
            text: completion.expression,
            index: RevealQuerySuggestAddon.INDEX - i / completions.length,
            partial: RevealQuerySuggestAddon.isPartialMatch(completion),
            executableConfidence: completion.executableConfidence
          };
        });
        return results;
      });
  }
}
