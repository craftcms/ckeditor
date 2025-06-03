/** global: Craft */
/** global: Garnish */
/** global: $ */
/** global: jQuery */

/**
 * Base component select input
 */
export default Craft.EntryTypeSelectInput.extend({
  init: function (settings = {}) {
    this.base(Object.assign({}, Craft.EntryTypeSelectInput.defaults, settings));
  },

  addComponentInternal: function ($component) {
    let $input = $component.find('input[name$="entryTypes[]"]');
    let config = JSON.parse($input.val());
    let $actionBtn = $component.find('.action-btn');
    let disclosureMenu = $actionBtn.disclosureMenu().data('disclosureMenu');

    let expandBtn,
      collapseBtn,
      withColorBtn,
      withoutColorBtn,
      withIconBtn,
      withoutIconBtn,
      withTextBtn,
      withoutTextBtn;

    expandBtn = disclosureMenu.addItem({
      icon: async () => await Craft.ui.icon('eye'),
      label: Craft.t('ckeditor', 'Expand to a separate button'),
      callback: () => {
        config.expanded = true;
        this.applyConfigChange($component, $input, config);
      },
    });

    collapseBtn = disclosureMenu.addItem({
      icon: async () => await Craft.ui.icon('eye-slash'),
      label: Craft.t('ckeditor', 'Collapse to a dropdown'),
      callback: () => {
        config.expanded = false;
        this.applyConfigChange($component, $input, config);
      },
    });

    withColorBtn = disclosureMenu.addItem({
      icon: async () => await Craft.ui.icon('brush'),
      label: Craft.t('ckeditor', 'Show with color'),
      callback: () => {
        config.withColor = true;
        this.applyConfigChange($component, $input, config);
      },
    });

    withoutColorBtn = disclosureMenu.addItem({
      icon: async () => await Craft.ui.icon('xmark'),
      label: Craft.t('ckeditor', 'Show without color'),
      callback: () => {
        config.withColor = false;
        this.applyConfigChange($component, $input, config);
      },
    });

    withIconBtn = disclosureMenu.addItem({
      icon: async () => await Craft.ui.icon('image'),
      label: Craft.t('ckeditor', 'Show with icon'),
      callback: () => {
        config.withIcon = true;
        this.applyConfigChange($component, $input, config);
      },
    });

    withoutIconBtn = disclosureMenu.addItem({
      icon: async () => await Craft.ui.icon('xmark'),
      label: Craft.t('ckeditor', 'Show without icon'),
      callback: () => {
        config.withIcon = false;
        this.applyConfigChange($component, $input, config);
      },
    });

    withTextBtn = disclosureMenu.addItem({
      icon: async () => await Craft.ui.icon('t'),
      label: Craft.t('ckeditor', 'Show with text'),
      callback: () => {
        config.withText = true;
        this.applyConfigChange($component, $input, config);
      },
    });

    withoutTextBtn = disclosureMenu.addItem({
      icon: async () => await Craft.ui.icon('xmark'),
      label: Craft.t('ckeditor', 'Show without text'),
      callback: () => {
        config.withText = false;
        this.applyConfigChange($component, $input, config);
      },
    });

    disclosureMenu.on('show', () => {
      let $chip = disclosureMenu.$trigger.parents('.chip');
      let $input = $chip.find('input[name$="entryTypes[]"]');
      let updatedConfig = JSON.parse($input.val());

      disclosureMenu.toggleItem(expandBtn, !updatedConfig.expanded);
      disclosureMenu.toggleItem(collapseBtn, updatedConfig.expanded);

      disclosureMenu.toggleItem(withColorBtn, !updatedConfig.withColor);
      disclosureMenu.toggleItem(withoutColorBtn, updatedConfig.withColor);

      disclosureMenu.toggleItem(withIconBtn, !updatedConfig.withIcon);
      disclosureMenu.toggleItem(withoutIconBtn, updatedConfig.withIcon);

      disclosureMenu.toggleItem(withTextBtn, !updatedConfig.withText);
      disclosureMenu.toggleItem(withoutTextBtn, updatedConfig.withText);
    });

    this.applyIndicators($component, config);

    this.base($component);
  },

  async applyConfigChange($component, $input, config) {
    this.applyIndicators($component, config);
  },

  async applyIndicators($component, config) {
    let data;

    try {
      const response = await Craft.sendActionRequest(
        'POST',
        'ckeditor/cke-configs/apply-entry-type-indicators',
        {
          data: {
            config,
          },
        },
      );
      data = response.data;
    } catch (e) {
      Craft.cp.displayError(e?.response?.data?.message);
      throw e;
    }

    let $oldIndicators = $component.find('.indicators');
    const $oldInput = $component.find('input[name$="entryTypes[]"]');

    const $newIndicators = $(data.chip).find('.indicators');
    const $newInput = $(data.chip).find('input[name$="entryTypes[]"]');
    const newConfig = JSON.parse($newInput.val());

    // if we can't find old indicators, then we need to add the new ones at the end of .chip-label
    // this will be the case if we're choosing a new entry type to the list
    if ($oldIndicators.length == 0) {
      const $chipLabel = $component.find('.chip-label');
      $oldIndicators = $('<div class="indicators">').appendTo($chipLabel);
    }

    $oldIndicators.replaceWith($newIndicators);
    this.updateConfig($oldInput, newConfig);
  },

  updateConfig: function ($input, config) {
    $input.val(JSON.stringify(config));
  },
});
