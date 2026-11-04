/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */

export default class CssOptions {
  constructor(id, mode, hasFiles) {
    this.mode = mode;
    this.container = document.getElementById(id);
    this.modeInput = document.getElementById(`${id}-mode`);
    this.cssContainer = document.getElementById(`${id}-css-container`);
    this.fileContainer = document.getElementById(`${id}-file-container`);

    this.container.addEventListener('click', (event) => {
      const option = event.target.closest?.('[data-mode]');
      if (!option || !this.container.contains(option)) {
        return;
      }

      this.mode = option.dataset.mode;

      // “File” isn’t a real choice until there’s a file to pick
      if (this.mode !== 'file' || hasFiles) {
        this.modeInput.value = this.mode;
      }

      this.cssContainer.classList.toggle('hidden', this.mode !== 'css');
      this.fileContainer.classList.toggle('hidden', this.mode !== 'file');
    });
  }
}
