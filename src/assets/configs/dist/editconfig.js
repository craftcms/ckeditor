(($) => {
  Ckeditor.ToolbarBuilder = Garnish.Base.extend({
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

    init: function(id) {
      this.$sourceContainer = $(`#${id} .ckeditor-tb--source .ck-toolbar__items`);
      this.$targetContainer = $(`#${id} .ckeditor-tb--target .ck-toolbar__items`);
      this.$input = $(`#${id} input`);
      this.value = JSON.parse(this.$input.val());

      const editorContainer = document.createElement('DIV');
      const editorElement = document.createElement('DIV');
      editorContainer.appendChild(editorElement);

      Ckeditor.create(editorElement, {
        linkOptions: [{elementType: 'craft\\elements\\Asset'}],
      }).then((editor) => {
        const cf = editor.ui.componentFactory;
        const names = Array.from(cf.names());
        this.components = {};
        for (const name of names) {
          this.components[name] = cf.create(name);
        }

        const items = [
          'heading',
          'alignment',
          'bold',
          'italic',
          'underline',
          'strikethrough',
          'subscript',
          'superscript',
          'code',
          'link',
          'insertImage',
          'mediaEmbed',
          'htmlEmbed',
          'blockQuote',
          'insertTable',
          'codeBlock',
          'bulletedList',
          'numberedList',
          'todoList',
          ['outdent', 'indent'],
          'horizontalLine',
          'pageBreak',
          'style',
          'selectAll',
          'findAndReplace',
          ['undo', 'redo'],
          'sourceEditing',
        ];

        // Normalize the groups, and flatten any groups that are only partially selected
        for (let i = 0; i < items.length; i++) {
          if (typeof items[i] === 'string') {
            items[i] = [items[i]];
          }
          const group = items[i];
          if (group.length > 1) {
            const index = this.value.findIndex((name) => group.includes(name));
            if (index !== -1) {
              for (let j = 0; j < group.length; j++) {
                if (this.value[index + j] !== group[j]) {
                  items.splice(i, 1, ...group.map((name) => [name]));
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
            const $outerContainer = $('<div class="offset-drag-helper ck ck-reset_all ck-editor ck-rounded-corners"/>');
            const $innerContainer = $('<div class="ck ck-toolbar"/>').appendTo($outerContainer);
            $item.appendTo($innerContainer);
            return $outerContainer;
          },
          moveHelperToCursor: true,
          onDragStart: () => {
            Garnish.$bod.addClass('dragging');
            const $draggee = this.drag.$draggee;
            this.draggingSourceItem = $.contains(this.$sourceContainer[0], $draggee[0]);
            this.draggingSeparator = $draggee.hasClass('ckeditor-tb--separator');
            this.$insertion = $('<div class="ckeditor-tb--insertion"/>').css({
              width: $draggee.outerWidth(),
            });
            if (this.draggingSourceItem) {
              if (this.draggingSeparator) {
                // don't hide the draggee as we're just going to duplicate it
                $draggee.css('visibility', '');
              } else {
                const property = Craft.orientation === 'ltr' ? 'margin-right' : 'margin-left';
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
                  $item = this.renderComponentGroup($draggee.data('componentNames'));
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
              }
              if (!this.draggingSeparator) {
                $draggee.removeClass('hidden');
                const property = Craft.orientation === 'ltr' ? 'margin-right' : 'margin-left';
                const currentMargin = $draggee.css(property);
                $draggee.css(property, '');
                const targetMargin = $draggee.css(property);
                $draggee.css(property, currentMargin);
                $draggee.stop().velocity({[property]: targetMargin}, 200, () => {
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
          const $item = this.renderComponentGroup(group).appendTo(this.$sourceContainer);
          sourceItems[group.join(',')] = $item[0];

          if (this.value.includes(group[0])) {
            // $item.clone().appendTo(this.$targetContainer);
            $item.addClass('hidden');
          }
        }

        sourceItems['|'] = this.renderSeparator().appendTo(this.$sourceContainer)[0];

        this.$items = $();

        for (let i = 0; i < this.value.length; i++) {
          const name = this.value[i];
          let $item, key;
          if (name === '|') {
            $item = this.renderSeparator().appendTo(this.$targetContainer);
            key = '|';
          } else {
            const group = items.find((group) => group.includes(name));
            if (!group) {
              // must no longer be a valid item
              continue;
            }
            $item = this.renderComponentGroup(group).appendTo(this.$targetContainer);
            key = group.join(',');
            i += group.length - 1;
          }
          $item.data('sourceItem', sourceItems[key]);
          this.$items = this.$items.add($item);
        }
      });
    },

    renderSeparator: function() {
      const $separator = $('<div class="ckeditor-tb--item ckeditor-tb--separator" data-cke-tooltip-text="Separator"><span class="ck ck-toolbar__separator"/></div>');
      this.drag.addItems($separator);
      return $separator;
    },

    renderComponentGroup: function(group) {
      const tooltips = [];
      const $item = $('<div class="ckeditor-tb--item"/>');
      for (const name of group) {
        const $element = this.renderComponent(name).appendTo($item);
        const tooltip = ($element.is('[data-cke-tooltip-text]') ? $element : $element.find('[data-cke-tooltip-text]')).attr('data-cke-tooltip-text');
        tooltips.push(tooltip ? tooltip.replace(/ \(.*\)$/, '') : `${name[0].toUpperCase()}${name.slice(1)}`);
      }
      $item.attr('data-cke-tooltip-text', tooltips.join(', '));
      $item.data('componentNames', group);
      this.drag.addItems($item);
      return $item;
    },

    renderComponent: function(name) {
      const component = this.components[name];
      if (!component) {
        throw `Missing component ${name}`;
      }
      if (!component.isRendered) {
        component.render();
      }
      const $element = $(component.element.outerHTML);
      $element.data('componentName', name);
      return $element;
    },

    getClosestItem: function () {
      if (!Garnish.hitTest(this.drag.mouseX, this.drag.mouseY, this.$targetContainer)) {
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
        return Garnish.getDist(midpoint.left, midpoint.top, this.drag.mouseX, this.drag.mouseY);
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

    setMidpoints: function() {
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
    }
  });
})(jQuery);
