/** global: CKEditor5, Garnish */
import './ckeconfig.css';
import $ from 'jquery';

export default Garnish.Base.extend({
  $sourceContainer: null,
  $targetContainer: null,
  $input: null,
  value: null,
  components: null,
  drag: null,
  $items: null,
  draggingSourceItem: null,
  draggingSeparator: null,
  $insertion: null,
  showingInsertion: false,
  closestItem: null,
  $listPluginRadio_List: null,
  $listPluginRadio_DocumentList: null,

  init: function (id, containerId, configOptions, namespace) {
    this.$sourceContainer = $(`#${id} .ckeditor-tb--source .ck-toolbar__items`);
    this.$targetContainer = $(`#${id} .ckeditor-tb--target .ck-toolbar__items`);
    this.$input = $(`#${id} input`);
    this.value = JSON.parse(this.$input.val());
    this.$listPluginRadio_List = $(`#${containerId} [id$=list-plugin--list]`);
    this.$listPluginRadio_DocumentList = $(
      `#${containerId} [id$=list-plugin--document-list]`,
    );

    const editorContainer = document.createElement('DIV');
    const editorElement = document.createElement('DIV');
    editorContainer.appendChild(editorElement);

    this.addListener(
      this.$listPluginRadio_List.add(this.$listPluginRadio_DocumentList),
      'change',
      'toggleDocumentList',
    );

    // we're including both List and DocumentList in our DLL, but they can't co-exist;
    // we're switching one off based on user's preferences,
    // but those preferences are defined in the CKE config which uses this toolbar builder;
    // so, to allow users to select all possible options,
    // we're removing DocumentList plugins from here; that way user can still drag and drop ordered,
    // unordered and to-do lists to the toolbar
    CKEditor5.craftcms
      .create(editorElement, {
        linkOptions: [{elementType: 'craft\\elements\\Asset'}],
        removePlugins: ['DocumentList', 'DocumentListProperties'],
      })
      .then((editor) => {
        const cf = editor.ui.componentFactory;
        const names = Array.from(cf.names());
        this.components = {};
        for (const name of names) {
          this.components[name] = cf.create(name);
        }

        const items = CKEditor5.craftcms.toolbarItems;

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

        this.drag = new Garnish.DragDrop({
          dropTargets: this.$targetContainer,
          helper: ($item) => {
            const $outerContainer = $(
              '<div class="offset-drag-helper ck ck-reset_all ck-editor ck-rounded-corners"/>',
            );
            const $innerContainer = $('<div class="ck ck-toolbar"/>').appendTo(
              $outerContainer,
            );
            $item.appendTo($innerContainer);
            return $outerContainer;
          },
          moveHelperToCursor: true,
          onDragStart: () => {
            Garnish.$bod.addClass('dragging');
            const $draggee = this.drag.$draggee;
            this.draggingSourceItem = $.contains(
              this.$sourceContainer[0],
              $draggee[0],
            );
            this.draggingSeparator = $draggee.hasClass(
              'ckeditor-tb--separator',
            );
            this.$insertion = $('<div class="ckeditor-tb--insertion"/>').css({
              width: $draggee.outerWidth(),
            });
            if (this.draggingSourceItem) {
              if (this.draggingSeparator) {
                // don't hide the draggee as we're just going to duplicate it
                $draggee.css('visibility', '');
              } else {
                const property =
                  Craft.orientation === 'ltr' ? 'margin-right' : 'margin-left';
                const margin = -1 * $draggee.outerWidth();
                $draggee.stop().velocity({[property]: margin}, 200, () => {
                  $draggee.addClass('hidden');
                });
              }
            } else {
              $draggee.addClass('hidden');
              this.$insertion.insertBefore($draggee);
              this.showingInsertion = true;
            }
            this.setMidpoints();
          },
          onDrag: () => {
            this.checkForNewClosestItem();
          },
          onDragStop: () => {
            Garnish.$bod.removeClass('dragging');
            let $draggee = this.drag.$draggee;
            this.checkForNewClosestItem();
            if (this.showingInsertion) {
              if (this.draggingSourceItem) {
                // clone the source item into the toolbar
                let $item;
                if (this.draggingSeparator) {
                  $item = this.renderSeparator();
                } else {
                  const componentNames = $draggee.data('componentNames');
                  $item = this.renderComponentGroup(componentNames);
                  // add any config settings
                  for (const name of componentNames) {
                    const item = items
                      .flat()
                      .find(({button}) => button === name);
                    if (item && item.configOption) {
                      configOptions.addSetting(item.configOption);
                    }
                  }
                }
                $item.data('sourceItem', $draggee[0]);
                $item.css('visibility', 'hidden');
                this.$insertion.replaceWith($item);
                this.drag.$draggee = $item;
              } else {
                this.$insertion.replaceWith($draggee);
                $draggee.removeClass('hidden');
              }
            } else {
              if (!this.draggingSourceItem) {
                const $sourceItem = $($draggee.data('sourceItem'));
                $draggee.remove();
                this.drag.$draggee = $draggee = $sourceItem;
                if (!this.draggingSeparator) {
                  // remove any config settings
                  for (const name of $sourceItem.data('componentNames')) {
                    const item = items
                      .flat()
                      .find(({button}) => button === name);
                    if (item && item.configOption) {
                      configOptions.removeSetting(item.configOption);
                    }
                  }
                }
              }
              if (!this.draggingSeparator) {
                $draggee.removeClass('hidden');
                const property =
                  Craft.orientation === 'ltr' ? 'margin-right' : 'margin-left';
                const currentMargin = $draggee.css(property);
                $draggee.css(property, '');
                const targetMargin = $draggee.css(property);
                $draggee.css(property, currentMargin);
                $draggee
                  .stop()
                  .velocity({[property]: targetMargin}, 200, () => {
                    $draggee.css(property, '');
                  });
              }
            }
            this.drag.returnHelpersToDraggees();

            // reset the items
            this.$items = this.$targetContainer.children();
            this.value = [];
            for (const item of this.$items.toArray()) {
              const $item = $(item);
              if ($item.hasClass('ckeditor-tb--separator')) {
                this.value.push('|');
              } else {
                this.value.push(...$item.data('componentNames'));
              }
            }
            this.$input.val(JSON.stringify(this.value));
          },
        });

        const sourceItems = {};

        for (let group of items) {
          const $item = this.renderComponentGroup(group);
          if (!$item) {
            continue;
          }
          $item.appendTo(this.$sourceContainer);
          sourceItems[group.map((item) => item.button).join(',')] = $item[0];

          if (this.value.includes(group[0].button)) {
            $item.addClass('hidden');
          }
        }

        sourceItems['|'] = this.renderSeparator().appendTo(
          this.$sourceContainer,
        )[0];

        this.$items = $();

        for (let i = 0; i < this.value.length; i++) {
          const name = this.value[i];
          let $item, key;
          if (name === '|') {
            $item = this.renderSeparator().appendTo(this.$targetContainer);
            key = '|';
          } else {
            const group = items.find((group) =>
              group.some((item) => item.button === name),
            );
            if (!group) {
              // must no longer be a valid item
              continue;
            }
            $item = this.renderComponentGroup(group);
            if (!$item) {
              continue;
            }
            $item.appendTo(this.$targetContainer);
            key = group.map((item) => item.button).join(',');
            i += group.length - 1;
          }
          $item.data('sourceItem', sourceItems[key]);
          this.$items = this.$items.add($item);
        }

        this.$listPluginRadio_List.trigger('change');
      });
  },

  toggleDocumentList: function (evt) {
    let useDocumentList = this.$listPluginRadio_DocumentList.prop('checked');

    if (useDocumentList) {
      // get index of the button to remove
      let buttonIndex = this.value.indexOf('todoList');
      if (buttonIndex >= 0) {
        // remove button from the list of values
        this.value.splice(buttonIndex, 1);
        this.$input.val(JSON.stringify(this.value));

        // get the dom element to remove
        let node = this.$targetContainer.children()[buttonIndex];
        if (node !== undefined) {
          // remove the button from the target container
          this.$targetContainer[0].removeChild(node);
        }
      } else {
        // if the todoList btn is not in the targetContainer (because it's not in values)
        // then we need to hide it in the $sourceContainer
        this.showHideComponentInSourceByName('todoList', 'hide');
      }
    } else {
      this.showHideComponentInSourceByName('todoList', 'show');
    }
  },

  showHideComponentInSourceByName: function (name, action) {
    if (this.components !== null) {
      var $element = this.components['todoList'].element;
      if ($element) {
        var tooltipVal = $($element).data('ckeTooltipText');
        for (const [key, button] of Object.entries(
          this.$sourceContainer.children(),
        )) {
          if ($(button).data('ckeTooltipText') === tooltipVal) {
            if (action == 'show') {
              $(button).removeAttr('style').removeClass('hidden');
            } else {
              $(button).addClass('hidden');
            }
          }
        }
      }
    }
  },

  renderSeparator: function () {
    const $separator = $(
      '<div class="ckeditor-tb--item ckeditor-tb--separator" data-cke-tooltip-text="Separator"><span class="ck ck-toolbar__separator"/></div>',
    );
    this.drag.addItems($separator);
    return $separator;
  },

  renderComponentGroup: function (group) {
    group = group.map((item) =>
      typeof item === 'string' ? item : item.button,
    );
    const elements = [];
    const tooltips = [];

    for (const name of group) {
      let $element;
      try {
        $element = this.renderComponent(name);
      } catch (e) {
        console.warn(e);
        continue;
      }
      elements.push($element);
      const tooltip = (
        $element.is('[data-cke-tooltip-text]')
          ? $element
          : $element.find('[data-cke-tooltip-text]')
      ).attr('data-cke-tooltip-text');
      tooltips.push(
        tooltip
          ? tooltip.replace(/ \(.*\)$/, '')
          : `${name[0].toUpperCase()}${name.slice(1)}`,
      );
    }

    if (!elements.length) {
      return false;
    }

    const $item = $('<div class="ckeditor-tb--item"/>').append(elements);
    $item.attr('data-cke-tooltip-text', tooltips.join(', '));
    $item.data('componentNames', group);
    this.drag.addItems($item);
    return $item;
  },

  renderComponent: function (name) {
    const component = this.components[name];
    if (!component) {
      throw `Missing component: ${name}`;
    }
    if (!component.isRendered) {
      component.render();
    }
    const $element = $(component.element.outerHTML);
    $element.data('componentName', name);
    return $element;
  },

  getClosestItem: function () {
    if (
      !Garnish.hitTest(
        this.drag.mouseX,
        this.drag.mouseY,
        this.$targetContainer,
      )
    ) {
      return false;
    }

    if (!this.$items.length) {
      return null;
    }

    const items = this.$items.toArray();
    if (this.showingInsertion) {
      items.push(this.$insertion[0]);
    }

    const mouseDiffs = items.map((item) => {
      const midpoint = $.data(item, 'midpoint');
      return Garnish.getDist(
        midpoint.left,
        midpoint.top,
        this.drag.mouseX,
        this.drag.mouseY,
      );
    });

    const minMouseDiff = Math.min(...mouseDiffs);
    const index = mouseDiffs.indexOf(minMouseDiff);
    return items[index];
  },

  checkForNewClosestItem: function () {
    // Is there a new closest item?
    const closestItem = this.getClosestItem();

    if (closestItem === false) {
      if (this.showingInsertion) {
        this.$insertion.remove();
        this.showingInsertion = false;
      }
      return;
    }

    if (closestItem === this.$insertion[0]) {
      return;
    }

    if (!closestItem) {
      this.$insertion.appendTo(this.$targetContainer);
    } else if (this.drag.mouseX < $.data(closestItem, 'midpoint').left) {
      this.$insertion.insertBefore(closestItem);
    } else {
      this.$insertion.insertAfter(closestItem);
    }

    this.showingInsertion = true;
    this.setMidpoints();
  },

  setMidpoints: function () {
    const items = this.$items.toArray();
    if (this.showingInsertion) {
      items.push(this.$insertion[0]);
    }

    for (const item of items) {
      const $item = $(item);
      const offset = $item.offset();
      const left = offset.left + $item.outerWidth() / 2;
      const top = offset.top + $item.outerHeight() / 2;
      $item.data('midpoint', {left, top});
    }
  },
});
