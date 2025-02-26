/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */

import {findAttributeRange, Plugin, Range, ViewElement} from 'ckeditor5';

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
          //console.log('downcast');
          const linkViewElement = writer.createAttributeElement(
            'a',
            {
              [this.conversionData[i].view]: value,
            },
            {priority: 5},
          );

          writer.setCustomProperty('link', true, linkViewElement);

          return linkViewElement;
        },
      });

      // converts data view to a model
      conversion.for('upcast').elementToAttribute({
        view: {
          name: 'a',
          attributes: {
            [this.conversionData[i].view]: true,
          },
        },
        model: {
          key: this.conversionData[i].model,
          value: (viewElement) => {
            //console.log('upcast');
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
        // console.log('link command 1');
        if (linking) {
          linking = false;
          return;
        }

        evt.stop();
        linking = true;

        //console.log('link command2');
        const extraAttributeValues = args[args.length - 1];
        const {model} = editor;
        const {selection} = model.document;

        model.change((writer) => {
          this.editor.execute('link', ...args);

          const firstPosition = selection.getFirstPosition();

          this.conversionData.forEach((item) => {
            if (selection.isCollapsed) {
              const node = firstPosition.textNode || firstPosition.nodeBefore;
              if (extraAttributeValues[item.model]) {
                writer.setAttribute(
                  item.model,
                  extraAttributeValues[item.model],
                  writer.createRangeOn(node),
                );
              } else {
                writer.removeAttribute(item.model, writer.createRangeOn(node));
              }

              writer.removeSelectionAttribute(item.model);
            } else {
              const ranges = model.schema.getValidRanges(
                selection.getRanges(),
                item.model,
              );

              for (const range of ranges) {
                if (extraAttributeValues[item.model]) {
                  writer.setAttribute(
                    item.model,
                    extraAttributeValues[item.model],
                    range,
                  );
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
        //console.log('unlink exec');
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
