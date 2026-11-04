/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */

export default class CssOptions {
  mode = null;
  container = null;
  modeInput = null;
  cssContainer = null;
  fileContainer = null;

  constructor(id, mode, hasFiles) {
    this.mode = mode;
    this.container = document.getElementById(id);
    this.modeInput = document.getElementById(`${id}-mode`);
    this.cssContainer = document.getElementById(`${id}-css-container`);
    this.fileContainer = document.getElementById(`${id}-file-container`);
    const modePicker = this.container.querySelector(':scope > craft-listbox');

    const containers = [this.cssContainer, this.fileContainer];

    // <craft-listbox> re-emits its listbox’s `change` event
    modePicker.addEventListener('change', (event) => {
      if (event.target !== modePicker) {
        return;
      }
      this.mode = event.detail.$selectedOption.dataset.mode;
      if (this.mode !== 'file' || hasFiles) {
        this.modeInput.value = this.mode;
      }
      containers.forEach((container) => container.classList.add('hidden'));
      switch (this.mode) {
        case 'css':
          this.cssContainer.classList.remove('hidden');
          break;
        case 'file':
          this.fileContainer.classList.remove('hidden');
          break;
      }
    });
  }
}
