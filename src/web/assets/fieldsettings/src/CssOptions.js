/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */

/** global: CKEditor5, Garnish, $ */
export default Garnish.Base.extend({
  mode: null,
  $container: null,
  $cssContainer: null,
  $fileContainer: null,

  init: function (id, mode) {
    this.mode = mode;
    this.$container = $(`#${id}`);
    this.$ckeConfigModeInput = $(`#${id}-mode`);
    this.$cssContainer = $(`#${id}-css-container`);
    this.$fileContainer = $(`#${id}-file-container`);
    const $modePicker = this.$container.children('.btngroup');

    const $containers = this.$cssContainer.add(this.$fileContainer);

    new Craft.Listbox($modePicker, {
      onChange: ($selectedOption) => {
        this.mode = $selectedOption.data('mode');
        this.$ckeConfigModeInput.val(this.mode);
        $containers.addClass('hidden');
        switch (this.mode) {
          case 'css':
            this.$cssContainer.removeClass('hidden');
            break;
          case 'file':
            this.$fileContainer.removeClass('hidden');
            break;
        }
      },
    });
  },
});
