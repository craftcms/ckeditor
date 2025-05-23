/** global: Craft */
/** global: Garnish */
/** global: $ */
/** global: jQuery */

/**
 * Base component select input
 */
export default Craft.EntryTypeSelectInput.extend(
  {
    init: function (settings = {}) {
      this.base(
        Object.assign({}, Craft.EntryTypeSelectInput.defaults, settings),
      );
    },

    addComponentInternal: function ($component) {
      let $input = $component.find('input[name$="entryTypes[]"]');
      let config = JSON.parse($input.val());
      let $actionBtn = $component.find('.action-btn');
      let disclosureMenu = $actionBtn.disclosureMenu().data('disclosureMenu');

      let expandBtn, collapseBtn;
      // TODO: do the same for withColor, withIcon, withText
      // TODO: update the icons too

      expandBtn = disclosureMenu.addItem({
        icon: async () => await Craft.ui.icon('eye'),
        label: Craft.t('ckeditor', 'Expand to a separate button'),
        callback: () => {
          config.expanded = true;
          this.updateConfig($input, config);
        },
      });

      collapseBtn = disclosureMenu.addItem({
        icon: async () => await Craft.ui.icon('eye-slash'),
        label: Craft.t('ckeditor', 'Collapse to a dropdown'),
        callback: () => {
          config.expanded = false;
          this.updateConfig($input, config);
        },
      });

      disclosureMenu.on('show', () => {
        disclosureMenu.toggleItem(expandBtn, !config.expanded);
        disclosureMenu.toggleItem(collapseBtn, config.expanded);
      });

      this.base($component);
    },
    updateConfig: function ($input, config) {
      $input.val(JSON.stringify(config));
    },
  },
  {
    defaults: {
      allowOverrides: false,
    },
  },
);
