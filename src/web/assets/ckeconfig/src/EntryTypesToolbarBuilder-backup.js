/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */

/** global: CKEditor5, Garnish, $ */
import './ckeconfig.css';

export default Garnish.Base.extend({
  $entryTypesToolbarVisual: null,
  $entryTypesToolbarInput: null,
  entryTypesToolbarValue: [],
  entryTypesComponent: [],
  selectedComponentIds: [],

  init: function (id /*, entryTypes, entryTypesToolbar*/) {
    this.$container = $(`#${id}`);
    this.$entryTypesToolbarVisual = this.$container.find('.visual');
    this.$entryTypesToolbarInput = this.$container.find('input');
    this.entryTypesToolbarValue = JSON.parse(
      this.$entryTypesToolbarInput.val(),
    );
    let $entryTypesContainer = this.$container
      .closest('form')
      .find('[data-attribute="entry-types"]');
    let $entryTypesField = $entryTypesContainer
      .find('.componentselect')
      .first();
    this.entryTypesComponent = $entryTypesField.data('componentSelect');
    this.selectedComponentIds =
      this.entryTypesComponent.getSelectedComponentIds();

    this.updateVisual();
    // add or remove - sorting is disabled
    this.entryTypesComponent.on('change', () => {
      this.handleEntryTypesChange();
    });
  },

  handleEntryTypesChange: function () {
    console.log('handleEntryTypesChange');
    let selectedComponents = this.entryTypesComponent.getComponents();
    let newSelectedComponentIds =
      this.entryTypesComponent.getSelectedComponentIds();

    if (newSelectedComponentIds.length < this.selectedComponentIds.length) {
      // we removed something
      const removedComponentId = this.selectedComponentIds.filter(
        (value) => !newSelectedComponentIds.includes(value),
      )[0];

      // find it in the entryTypesToolbarValue and remove
      this.entryTypesToolbarValue = this.entryTypesToolbarValue.filter(
        (item) => item.id != removedComponentId,
      );

      this.$entryTypesToolbarInput.val(
        JSON.stringify(this.entryTypesToolbarValue),
      );
    } else {
      // we added something
      const newComponentId = newSelectedComponentIds.filter(
        (value) => !this.selectedComponentIds.includes(value),
      )[0];

      // add to the entryTypesToolbarValue
      this.entryTypesToolbarValue.push({
        expanded: false,
        id: newComponentId,
        withColor: true,
        withIcon: true,
        withText: true,
      });

      this.$entryTypesToolbarInput.val(
        JSON.stringify(this.entryTypesToolbarValue),
      );
    }

    // update selected components ids so the next comparison works as expected
    this.selectedComponentIds =
      this.entryTypesComponent.getSelectedComponentIds();

    this.updateVisual();
  },

  updateVisual: function () {
    console.log(this.$entryTypesToolbarVisual);
  },
});
