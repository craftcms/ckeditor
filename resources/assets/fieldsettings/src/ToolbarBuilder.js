/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */

import './fieldsettings.css';
import {create} from '@craftcms/ckeditor';
import * as Craft from '@craftcms/cp';
import * as Garnish from '@craftcms/garnish';

/** Per-item state, keyed off the elements it belongs to. */
const componentNames = new WeakMap();
const sourceItems = new WeakMap();
const midpoints = new WeakMap();
const marginAnimations = new WeakMap();

const MARGIN_DURATION = 200;

/** Animates an item’s inline margin, leaving the end value in place. */
function animateMargin(element, property, from, to, onFinish) {
  marginAnimations.get(element)?.cancel();
  const finish = () => {
    element.style.setProperty(property, to);
    onFinish?.();
  };
  if (Garnish.prefersReducedMotion()) {
    finish();
    return;
  }

  element.style.setProperty(property, from);
  const animation = element.animate([{[property]: from}, {[property]: to}], {
    duration: MARGIN_DURATION,
    easing: 'ease-in-out',
  });
  marginAnimations.set(element, animation);
  animation.finished.then(
    () => {
      marginAnimations.delete(element);
      finish();
    },
    () => {},
  );
}

export default class ToolbarBuilder {
  constructor(id, configOptions, plugins = []) {
    this.container = document.getElementById(id);
    this.sourceContainer = this.container.querySelector(
      '.ckeditor-tb--source .ck-toolbar__items',
    );
    this.targetContainer = this.container.querySelector(
      '.ckeditor-tb--target .ck-toolbar__items',
    );
    this.input = this.container.querySelector('input');
    this.value = JSON.parse(this.input.value);
    this.readOnly = this.container.classList.contains('disabled');

    this.components = {};
    this.drag = null;
    this.items = [];
    this.draggingSourceItem = null;
    this.draggingSeparator = null;
    this.insertion = null;
    this.showingInsertion = false;

    const editorContainer = document.createElement('div');
    editorContainer.classList.add('hidden');
    const editorElement = document.createElement('div');
    editorContainer.appendChild(editorElement);
    this.container.append(editorContainer); // CKEditor 48.1+ requires the source element to be on the page

    create(editorElement, {
      linkOptions: [{elementType: 'CraftCms\\Cms\\Asset\\Elements\\Asset'}],
      imageSources: ['*'],
      entryTypeOptions: [{label: 'fake', value: 'fake'}],
      plugins,
    })
      .then((editor) => {
        const cf = editor.ui.componentFactory;

        for (const name of cf.names()) {
          this.components[name] = cf.create(name);
        }

        const items = JSON.parse(
          this.container.getAttribute('data-available-items'),
        );
        const configOptionsByButton = new Map(
          items.flat().map(({button, configOption}) => [button, configOption]),
        );

        // Flatten any groups that are only partially selected
        for (let i = 0; i < items.length; i++) {
          const group = items[i];
          if (group.length > 1) {
            const index = this.value.findIndex((name) =>
              group.some((item) => item.button === name),
            );
            if (index !== -1) {
              for (let j = 0; j < group.length; j++) {
                if (this.value[index + j] !== group[j].button) {
                  items.splice(i, 1, ...group.map((item) => [item]));
                  i += group.length - 1;
                  break;
                }
              }
            }
          }
        }

        if (!this.readOnly) {
          this.drag = new Garnish.DragDrop({
            dropTargets: this.targetContainer,
            helper: (item) => {
              const outerContainer = document.createElement('div');
              outerContainer.className =
                'offset-drag-helper ck ck-reset_all ck-editor ck-rounded-corners';
              const innerContainer = document.createElement('div');
              innerContainer.className = 'ck ck-toolbar';
              innerContainer.append(item);
              outerContainer.append(innerContainer);
              return outerContainer;
            },
            moveHelperToCursor: true,
            onDragStart: () => {
              document.body.classList.add('dragging');
              const [draggee] = this.drag.$draggee;
              this.draggingSourceItem = this.sourceContainer.contains(draggee);
              this.draggingSeparator = draggee.classList.contains(
                'ckeditor-tb--separator',
              );
              this.insertion = document.createElement('div');
              this.insertion.className = 'ckeditor-tb--insertion';
              this.insertion.style.width = `${Garnish.getOuterWidth(draggee)}px`;
              this.insertion.style.height = `${Garnish.getOuterHeight(draggee)}px`;
              if (this.draggingSourceItem) {
                if (this.draggingSeparator) {
                  // don't hide the draggee as we're just going to duplicate it
                  draggee.style.visibility = '';
                } else {
                  const property =
                    Craft.cpConfig().get('orientation') === 'ltr'
                      ? 'margin-right'
                      : 'margin-left';
                  animateMargin(
                    draggee,
                    property,
                    '0px',
                    `${-1 * Garnish.getOuterWidth(draggee)}px`,
                    () => draggee.classList.add('hidden'),
                  );
                }
              } else {
                draggee.classList.add('hidden');
                draggee.before(this.insertion);
                this.showingInsertion = true;
              }
              this.setMidpoints();
            },
            onDrag: () => {
              this.checkForNewClosestItem();
            },
            onDragStop: () => {
              document.body.classList.remove('dragging');
              let [draggee] = this.drag.$draggee;
              this.checkForNewClosestItem();
              if (this.showingInsertion) {
                if (this.draggingSourceItem) {
                  // clone the source item into the toolbar
                  let item;
                  if (this.draggingSeparator) {
                    item = this.renderSeparator();
                  } else {
                    const names = componentNames.get(draggee);
                    item = this.renderComponentGroup(names);
                    // add any config settings
                    for (const name of names) {
                      const configOption = configOptionsByButton.get(name);
                      if (configOption) {
                        configOptions.addSetting(configOption);
                      }
                    }
                  }
                  sourceItems.set(item, draggee);
                  item.style.visibility = 'hidden';
                  this.insertion.replaceWith(item);
                  this.drag.$draggee = [item];
                } else {
                  this.insertion.replaceWith(draggee);
                  draggee.classList.remove('hidden');
                }
              } else {
                if (!this.draggingSourceItem) {
                  const sourceItem = sourceItems.get(draggee);
                  draggee.remove();
                  draggee = sourceItem;
                  this.drag.$draggee = [draggee];
                  if (!this.draggingSeparator) {
                    // remove any config settings
                    for (const name of componentNames.get(sourceItem)) {
                      const configOption = configOptionsByButton.get(name);
                      if (configOption) {
                        configOptions.removeSetting(configOption);
                      }
                    }
                  }
                }
                if (!this.draggingSeparator) {
                  draggee.classList.remove('hidden');
                  const property =
                    Craft.cpConfig().get('orientation') === 'ltr'
                      ? 'margin-right'
                      : 'margin-left';
                  const currentMargin =
                    getComputedStyle(draggee).getPropertyValue(property);
                  draggee.style.removeProperty(property);
                  const targetMargin =
                    getComputedStyle(draggee).getPropertyValue(property);
                  animateMargin(
                    draggee,
                    property,
                    currentMargin,
                    targetMargin,
                    () => draggee.style.removeProperty(property),
                  );
                }
              }
              this.drag.returnHelpersToDraggees();

              // reset the items
              this.items = [...this.targetContainer.children];
              this.value = [];
              for (const item of this.items) {
                if (item.classList.contains('ckeditor-tb--separator')) {
                  this.value.push('|');
                } else {
                  this.value.push(...componentNames.get(item));
                }
              }
              this.input.value = JSON.stringify(this.value);
            },
          });
        }

        const renderedSourceItems = {};

        for (const group of items) {
          const item = this.renderComponentGroup(group);
          if (!item) {
            continue;
          }
          this.sourceContainer.append(item);
          renderedSourceItems[group.map((i) => i.button).join(',')] = item;

          if (this.value.includes(group[0].button)) {
            item.classList.add('hidden');
          }
        }

        const separator = this.renderSeparator();
        this.sourceContainer.append(separator);
        renderedSourceItems['|'] = separator;

        this.items = [];

        for (let i = 0; i < this.value.length; i++) {
          const name = this.value[i];
          let item, key;
          if (name === '|') {
            item = this.renderSeparator();
            this.targetContainer.append(item);
            key = '|';
          } else {
            const group = items.find((g) =>
              g.some((candidate) => candidate.button === name),
            );
            if (!group) {
              // must no longer be a valid item
              continue;
            }
            item = this.renderComponentGroup(group);
            if (!item) {
              continue;
            }
            this.targetContainer.append(item);
            key = group.map((i) => i.button).join(',');
            i += group.length - 1;
          }
          sourceItems.set(item, renderedSourceItems[key]);
          this.items.push(item);
        }
      })
      .catch(console.error);
  }

  renderSeparator() {
    const separator = document.createElement('div');
    separator.className = 'ckeditor-tb--item ckeditor-tb--separator';
    separator.setAttribute('data-cke-tooltip-text', 'Separator');
    const bar = document.createElement('span');
    bar.className = 'ck ck-toolbar__separator';
    separator.append(bar);
    this.drag?.addItems(separator);
    return separator;
  }

  renderComponentGroup(group) {
    const names = group.map((item) =>
      typeof item === 'string' ? item : item.button,
    );
    const elements = [];
    const tooltips = [];

    for (const name of names) {
      let element;
      try {
        element = this.renderComponent(name);
      } catch (e) {
        console.warn(e);
        continue;
      }
      elements.push(element);
      const tooltip = (
        element.matches('[data-cke-tooltip-text]')
          ? element
          : element.querySelector('[data-cke-tooltip-text]')
      )?.getAttribute('data-cke-tooltip-text');
      tooltips.push(
        tooltip
          ? tooltip.replace(/ \(.*\)$/, '')
          : `${name[0].toUpperCase()}${name.slice(1)}`,
      );
    }

    if (!elements.length) {
      return false;
    }

    const item = document.createElement('div');
    item.className = 'ckeditor-tb--item';
    item.append(...elements);
    item.setAttribute('data-cke-tooltip-text', tooltips.join(', '));
    componentNames.set(item, names);
    this.drag?.addItems(item);
    return item;
  }

  renderComponent(name) {
    const component = this.components[name];
    if (!component) {
      throw `Missing component: ${name}`;
    }
    if (!component.isRendered) {
      component.render();
    }
    return component.element.cloneNode(true);
  }

  getClosestItem() {
    if (
      !Garnish.hitTest(this.drag.mouseX, this.drag.mouseY, this.targetContainer)
    ) {
      return false;
    }

    if (!this.items.length) {
      return null;
    }

    const items = [...this.items];
    if (this.showingInsertion) {
      items.push(this.insertion);
    }

    const mouseDiffs = items.map((item) => {
      const midpoint = midpoints.get(item);
      return Garnish.getDist(
        midpoint.left,
        midpoint.top,
        this.drag.mouseX,
        this.drag.mouseY,
      );
    });

    const minMouseDiff = Math.min(...mouseDiffs);
    return items[mouseDiffs.indexOf(minMouseDiff)];
  }

  checkForNewClosestItem() {
    // Is there a new closest item?
    const closestItem = this.getClosestItem();

    if (closestItem === false) {
      if (this.showingInsertion) {
        this.insertion.remove();
        this.showingInsertion = false;
      }
      return;
    }

    if (closestItem === this.insertion) {
      return;
    }

    if (!closestItem) {
      this.targetContainer.append(this.insertion);
    } else if (this.drag.mouseX < midpoints.get(closestItem).left) {
      closestItem.before(this.insertion);
    } else {
      closestItem.after(this.insertion);
    }

    this.showingInsertion = true;
    this.setMidpoints();
  }

  setMidpoints() {
    const items = [...this.items];
    if (this.showingInsertion) {
      items.push(this.insertion);
    }

    for (const item of items) {
      const offset = Garnish.getOffset(item);
      midpoints.set(item, {
        left: offset.left + Garnish.getOuterWidth(item) / 2,
        top: offset.top + Garnish.getOuterHeight(item) / 2,
      });
    }
  }
}
