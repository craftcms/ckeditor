/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */

/** global: CKEditor5, Garnish, $ */
import './ckeconfig.css';

export default Garnish.Base.extend({
  entryTypes: [],
  entryTypesToolbar: [],
  entryTypesComponent: [],
  selectedComponentIds: [],

  init: function (id, entryTypes, entryTypesToolbar) {
    this.$container = $(`#${id}`);
    this.entryTypes = entryTypes;
    this.entryTypesToolbar = entryTypesToolbar;
    let $entryTypesContainer = this.$container
      .closest('form')
      .find('[data-attribute="entry-types"]');
    let $entryTypesField = $entryTypesContainer
      .find('.componentselect')
      .first();
    this.entryTypesComponent = $entryTypesField.data('componentSelect');
    this.selectedComponentIds =
      this.entryTypesComponent.getSelectedComponentIds();

    // add or remove - sorting is disabled
    this.entryTypesComponent.on('change', () => {
      this.handleEntryTypesChange();
    });
  },

  handleEntryTypesChange: function () {
    let selectedComponents = this.entryTypesComponent.getComponents();
    let newSelectedComponentIds =
      this.entryTypesComponent.getSelectedComponentIds();

    if (newSelectedComponentIds.length < this.selectedComponentIds.length) {
      // we removed something
      const removedComponentId = this.selectedComponentIds.filter(
        (value) => !newSelectedComponentIds.includes(value),
      )[0];

      // find it in the entryTypesToolbar and remove
      this.entryTypesToolbar = this.entryTypesToolbar.filter(
        (item) => item.id != removedComponentId,
      );

      this.$container
        .find('textarea')
        .val(JSON.stringify(this.entryTypesToolbar));
    } else {
      // we added something
      const newComponentId = newSelectedComponentIds.filter(
        (value) => !this.selectedComponentIds.includes(value),
      )[0];

      // add to the entryTypesToolbar
      this.entryTypesToolbar.push({
        expanded: false,
        id: newComponentId,
        withColor: true,
        withIcon: true,
        withText: true,
      });

      this.$container
        .find('textarea')
        .val(JSON.stringify(this.entryTypesToolbar));
    }

    // update selected components ids so the next comparison works as expected
    this.selectedComponentIds =
      this.entryTypesComponent.getSelectedComponentIds();
  },
});
