async function initCkeditor(id, init) {
  if (typeof CKEDITOR !== 'undefined') {
    // CKEditor 4
    const realInit = async function () {
      const editor = await init();
      // Keep the source element updated with changes
      editor.on('change', () => {
        editor.updateElement();
      });

      // Keep the source element updated with changes when in source mode too;
      // change event only fires in wysiwyg mode:
      // https://ckeditor.com/docs/ckeditor4/latest/api/CKEDITOR_editor.html#event-change
      editor.on('mode', function() {
        if (this.mode === 'source') {
          const editable = editor.editable();
          editable.attachListener(editable, 'input', function() {
            editor.updateElement();
          });
        }
      });
    };
    const deinit = function () {
      if (typeof CKEDITOR.instances[id] !== 'undefined') {
        CKEDITOR.instances[id].updateElement();
        CKEDITOR.instances[id].destroy();
        CKEDITOR.remove(id);
      }
    };
    await realInit();
    // Deinitialize the editor whenever it's being moved
    // https://ckeditor.com/old/comment/126522#comment-126522
    Garnish.on(Craft.Preview, 'beforeOpen beforeClose', deinit);
    Garnish.on(Craft.Preview, 'open close', realInit);
    Garnish.on(Craft.LivePreview, 'beforeEnter beforeExit', deinit);
    Garnish.on(Craft.LivePreview, 'enter exit', realInit);

    // https://github.com/craftcms/ckeditor/issues/23
    // for when using "move up" and "move down" menu options
    Garnish.on(Craft.MatrixInput, 'beforeMoveBlockUp beforeMoveBlockDown', deinit);
    Garnish.on(Craft.MatrixInput, 'moveBlockUp moveBlockDown', realInit);
    // for when dragging and dropping
    Garnish.on(Craft.MatrixInput, 'blockSortDragStop', null, function() {
      deinit();
      realInit();
    });
  } else {
    // CKEditor 5
    try {
      const editor = await init();
      // Keep the source element updated with changes
      editor.model.document.on('change', () => {
        editor.updateSourceElement();
      });
    } catch (error) {
      if (error.message.includes('editor-wrong-element')) {
        // Try again with a <div>
        const $textarea = $(`#${id}`);
        const $input = $('<input/>', {
          type: 'hidden',
          name: $textarea.attr('name'),
          val: $textarea.val(),
        }).insertAfter($textarea);
        $textarea.replaceWith(
          $('<div/>', {
            id: id,
            html: $textarea.val(),
          })
        );
        const editor = await init();
        // Keep the source element updated with changes
        editor.model.document.on('change', () => {
          $input.val(editor.getData());
        });
      } else {
        throw error;
      }
    }
  }
}
