/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */

import {findAttributeRange, Plugin} from 'ckeditor5';
import {resolveAdvancedFieldAttributeValue} from './linkutils.js';

/**
 * These imports aren't ideal but are necessary for now because the main
 * ckeditor5 package doesn't expose them.
 *
 * @link https://github.com/ckeditor/ckeditor5/issues/17304#issuecomment-2522746556
 */
const LINK_KEYSTROKE = 'Ctrl+K';

export default class CraftLinkEditing extends Plugin {
  static get pluginName() {
    return 'CraftLinkEditing';
  }

  constructor() {
    super(...arguments);
    this.conversionData = [];
    this.editor.config.define('advancedLinkFields', []);
  }

  init() {
    const editor = this.editor;
    const advancedLinkFields = editor.config.get('advancedLinkFields');
    this.conversionData = advancedLinkFields
      .map((field) => field.conversion ?? null)
      .filter((field) => field);

    this._defineSchema();
    this._defineConverters();
    this._adjustLinkCommand();
    this._adjustUnlinkCommand();
  }

  _defineSchema() {
    const schema = this.editor.model.schema;
    let modelAttributes = this.conversionData.map((field) => field.model);

    schema.extend('$text', {
      allowAttributes: modelAttributes,
    });
  }

  _defineConverters() {
    const conversion = this.editor.conversion;

    for (let i = 0; i < this.conversionData.length; i++) {
      // for converting model into view (html)
      conversion.for('downcast').attributeToElement({
        model: this.conversionData[i].model,
        view: (value, {writer}) => {
          const linkViewElement = writer.createAttributeElement(
            'a',
            {[this.conversionData[i].view]: value},
            {priority: 5},
          );

          writer.setCustomProperty('link', true, linkViewElement);

          return linkViewElement;
        },
      });

      // converts data view to a model
      conversion.for('upcast').attributeToAttribute({
        view: {
          name: 'a',
          key: this.conversionData[i].view,
        },
        model: {
          key: this.conversionData[i].model,
          value: (viewElement, conversionApi) => {
            return viewElement.getAttribute(this.conversionData[i].view);
          },
        },
      });
    }
  }

  _adjustLinkCommand() {
    const editor = this.editor;
    const linkCommand = editor.commands.get('link');
    let linking = false;

    linkCommand.on(
      'execute',
      (evt, args) => {
        if (linking) {
          linking = false;
          return;
        }

        evt.stop();
        linking = true;

        // Craft's extra attribute values are always passed as the 4th argument to
        // linkCommand.execute() (see CraftLinkUI for the call sites), regardless of
        // whether CKEditor5's own `manualDecoratorIds`/`displayedText` arguments were
        // also passed. Using a fixed index here - rather than assuming the values are
        // whatever the *last* argument happens to be - means this can't be confused
        // with those unrelated built-in arguments.
        // see https://github.com/craftcms/ckeditor/issues/612 for more info
        const extraAttributeValues = args[3] || {};
        const selection = editor.model.document.selection;

        editor.model.change((writer) => {
          editor.execute('link', ...args);

          const firstPosition = selection.getFirstPosition();

          this.conversionData.forEach((item) => {
            const value = resolveAdvancedFieldAttributeValue(
              item,
              extraAttributeValues[item.model],
            );

            if (selection.isCollapsed) {
              const node = firstPosition.textNode || firstPosition.nodeBefore;
              if (value !== undefined) {
                writer.setAttribute(
                  item.model,
                  value,
                  writer.createRangeOn(node),
                );
              } else {
                writer.removeAttribute(item.model, writer.createRangeOn(node));
              }
            } else {
              // one case where selection is considered not collapsed is when you highlight a text, add a link to it,
              // and then click on the "edit link" icon without closing the balloon that you see after adding a link
              const ranges = editor.model.schema.getValidRanges(
                selection.getRanges(),
                item.model,
              );

              for (const range of ranges) {
                if (value !== undefined) {
                  writer.setAttribute(item.model, value, range);
                } else {
                  writer.removeAttribute(item.model, range);
                }
              }
            }
          });
        });
      },
      {priority: 'high'},
    );
  }

  _adjustUnlinkCommand() {
    const editor = this.editor;
    const unlinkCommand = editor.commands.get('unlink');
    const {model} = editor;
    const {selection} = model.document;
    let unlinking = false;

    unlinkCommand.on(
      'execute',
      (evt) => {
        if (unlinking) {
          return;
        }

        evt.stop();

        model.change(() => {
          unlinking = true;
          editor.execute('unlink');
          unlinking = false;

          // remove extra attributes
          model.change((writer) => {
            let ranges;

            this.conversionData.forEach((item) => {
              if (selection.isCollapsed) {
                ranges = [
                  findAttributeRange(
                    selection.getFirstPosition(),
                    item.model,
                    selection.getAttribute(item.model),
                    model,
                  ),
                ];
              } else {
                ranges = model.schema.getValidRanges(
                  selection.getRanges(),
                  item.model,
                );
              }

              for (const range of ranges) {
                writer.removeAttribute(item.model, range);
              }
            });
          });
        });
      },
      {priority: 'high'},
    );
  }
}
