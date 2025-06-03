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

  getInput: function ($component) {
    return $component.find('input');
  },

  getConfig: function ($input) {
    return JSON.parse($input.val());
  },

  getConfigFromComponent: function ($component) {
    let $input = this.getInput($component);
    return JSON.parse($input.val());
  },

  addComponentInternal: function ($component) {
    this.on('applySettings', () => {
      this.applyIndicators($component, this.getConfigFromComponent($component));
    });

    let $input = this.getInput($component);
    let $actionBtn = $component.find('.action-btn');
    let disclosureMenu = $actionBtn.disclosureMenu().data('disclosureMenu');

    let [
      expandBtn,
      collapseBtn,
      withColorBtn,
      withoutColorBtn,
      withIconBtn,
      withoutIconBtn,
      withTextBtn,
      withoutTextBtn,
    ] = this.getButtons(disclosureMenu, $component, $input);

    disclosureMenu.on('show', () => {
      let $chip = disclosureMenu.$trigger.parents('.chip');
      let config = this.getConfigFromComponent($chip);

      disclosureMenu.toggleItem(expandBtn, !config.expanded);
      disclosureMenu.toggleItem(collapseBtn, config.expanded);

      disclosureMenu.toggleItem(withColorBtn, !config.withColor);
      disclosureMenu.toggleItem(withoutColorBtn, config.withColor);

      disclosureMenu.toggleItem(withIconBtn, !config.withIcon);
      disclosureMenu.toggleItem(withoutIconBtn, config.withIcon);

      disclosureMenu.toggleItem(withTextBtn, !config.withText);
      disclosureMenu.toggleItem(withoutTextBtn, config.withText);
    });

    this.applyIndicators($component, this.getConfig($input));

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
    const $oldInput = this.getInput($component);

    const $newIndicators = $(data.chip).find('.indicators');
    const $newInput = this.getInput($(data.chip));
    const newConfig = this.getConfig($newInput);

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

  getButtons: function (disclosureMenu, $component, $input) {
    let expandBtn = disclosureMenu.addItem({
      icon: async () => await Craft.ui.icon('eye'),
      label: Craft.t('ckeditor', 'Expand to a separate button'),
      callback: () => {
        let config = this.getConfig($input);
        config.expanded = true;
        this.applyConfigChange($component, $input, config);
      },
    });

    let collapseBtn = disclosureMenu.addItem({
      icon: async () => await Craft.ui.icon('eye-slash'),
      label: Craft.t('ckeditor', 'Collapse to a dropdown'),
      callback: () => {
        let config = this.getConfig($input);
        config.expanded = false;
        this.applyConfigChange($component, $input, config);
      },
    });

    let withColorBtn = disclosureMenu.addItem({
      icon: async () => await Craft.ui.icon('brush'),
      label: Craft.t('ckeditor', 'Show with color'),
      callback: () => {
        let config = this.getConfig($input);
        config.withColor = true;
        this.applyConfigChange($component, $input, config);
      },
    });

    let withoutColorBtn = disclosureMenu.addItem({
      icon: async () => await Craft.ui.icon('xmark'),
      label: Craft.t('ckeditor', 'Show without color'),
      callback: () => {
        let config = this.getConfig($input);
        config.withColor = false;
        this.applyConfigChange($component, $input, config);
      },
    });

    let withIconBtn = disclosureMenu.addItem({
      icon: async () => await Craft.ui.icon('image'),
      label: Craft.t('ckeditor', 'Show with icon'),
      callback: () => {
        let config = this.getConfig($input);
        config.withIcon = true;
        this.applyConfigChange($component, $input, config);
      },
    });

    let withoutIconBtn = disclosureMenu.addItem({
      icon: async () => await Craft.ui.icon('xmark'),
      label: Craft.t('ckeditor', 'Show without icon'),
      callback: () => {
        let config = this.getConfig($input);
        config.withIcon = false;
        this.applyConfigChange($component, $input, config);
      },
    });

    let withTextBtn = disclosureMenu.addItem({
      icon: async () => await Craft.ui.icon('t'),
      label: Craft.t('ckeditor', 'Show with text'),
      callback: () => {
        let config = this.getConfig($input);
        config.withText = true;
        this.applyConfigChange($component, $input, config);
      },
    });

    let withoutTextBtn = disclosureMenu.addItem({
      icon: async () => await Craft.ui.icon('xmark'),
      label: Craft.t('ckeditor', 'Show without text'),
      callback: () => {
        let config = this.getConfig($input);
        config.withText = false;
        this.applyConfigChange($component, $input, config);
      },
    });

    return [
      expandBtn,
      collapseBtn,
      withColorBtn,
      withoutColorBtn,
      withIconBtn,
      withoutIconBtn,
      withTextBtn,
      withoutTextBtn,
    ];
  },
});
