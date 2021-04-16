async function initCkeditor(id, init) {
    if (typeof CKEDITOR !== 'undefined') {
        // CKEditor 4
        const realInit = async function() {
            const editor = await init();
            // Keep the source element updated with changes
            editor.on('change', () => {
                editor.updateElement();
            });
        };
        const deinit = function() {
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
    } else {
        // CKEditor 5
        const editor = await init();
        // Keep the source element updated with changes
        editor.model.document.on('change', () => {
            editor.updateSourceElement();
        });
    }
}
