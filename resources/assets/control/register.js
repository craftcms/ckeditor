/**
 * Registers the CKEditor UI controls with the control panel, and adds the
 * “Expand to a separate button” action to the field settings’ entry type chips.
 *
 * Loaded as a deferred classic script ahead of `Cp.start()`. The components themselves are loaded lazily,
 * as ES modules that import the control panel’s shared `vue` build through the import map.
 */
(() => {
  const url = (file) => new URL(file, document.currentScript.src).href;
  const editorUrl = url('ckeditor-control.js');
  const editorConfigUrl = url('editor-config-control.js');

  window.Cp.booting((cp) => {
    cp.$components.register('ckeditor:editor', () => import(editorUrl));
    cp.$components.register(
      'ckeditor:editor-config',
      () => import(editorConfigUrl),
    );
  });

  // Whether the element belongs to a CKEditor field’s settings
  const inCkeditorSettings = (element) => {
    for (let el = element.parentElement; el; el = el.parentElement) {
      if (el.querySelector(':scope .ckeditor-editor-config')) {
        return true;
      }
    }
    return false;
  };

  // Shows or hides the “Show as a separate button” indicator on an entry type chip
  const toggleIndicator = async (chip, show) => {
    const label = chip.querySelector('craft-chip [id$="-label"]');
    if (!label) {
      return;
    }

    let indicator = label.querySelector('.ckeditor-expanded-indicator');
    if (!show) {
      indicator?.remove();
      return;
    }
    if (indicator) {
      return;
    }

    let indicators = label.querySelector(':scope > .indicators');
    if (!indicators) {
      indicators = document.createElement('div');
      indicators.className = 'indicators';
      label.append(indicators);
    }

    const title = Craft.t('ckeditor', 'Show as a separate button');
    indicator = document.createElement('div');
    indicator.className = 'cp-icon puny ckeditor-expanded-indicator';
    indicator.title = title;
    indicator.setAttribute('aria-label', title);
    indicators.append(indicator);

    const icon = await Craft.ui.icon('eye');
    const el = icon?.jquery ? icon[0] : icon;
    if (el) {
      indicator.append(el);
    }
  };

  // Keep the indicator in sync when the value changes, e.g. after the overrides are applied,
  // which replaces the chip’s label contents
  document.addEventListener('change', (event) => {
    const input = event.target;
    if (
      !(input instanceof HTMLInputElement) ||
      !input.matches(
        'input[name$="[entryTypes][]"], input[name="entryTypes[]"]',
      ) ||
      !inCkeditorSettings(input)
    ) {
      return;
    }

    const chip = input.closest('li');
    if (!chip) {
      return;
    }

    try {
      toggleIndicator(chip, Boolean(JSON.parse(input.value).expanded));
    } catch (e) {
      // not a JSON value
    }
  });

  document.addEventListener('define-chip-actions', (event) => {
    const {chip, actions} = event.detail ?? {};
    const input = chip?.querySelector(
      'input[name$="[entryTypes][]"], input[name="entryTypes[]"]',
    );

    if (!input || !inCkeditorSettings(chip)) {
      return;
    }

    let config;
    try {
      config = JSON.parse(input.value);
    } catch (e) {
      return;
    }

    const labels = {
      expand: Craft.t('ckeditor', 'Expand to a separate button'),
      collapse: Craft.t('ckeditor', 'Collapse to a dropdown'),
    };
    const expanded = Boolean(config.expanded);
    toggleIndicator(chip, expanded);

    actions.push({
      icon: expanded ? 'eye-slash' : 'eye',
      label: expanded ? labels.collapse : labels.expand,
      onActivate: () => {
        const current = JSON.parse(input.value);
        const wasExpanded = Boolean(current.expanded);
        current.expanded = !wasExpanded;
        input.value = JSON.stringify(current);
        // Programmatic value changes don’t fire `change`; announce it so the control picks up the new value
        input.dispatchEvent(new Event('change', {bubbles: true}));

        // Chip actions are only defined once, so update the menu item in place
        const item = [...chip.querySelectorAll('craft-action-item')].find(
          (el) =>
            el.textContent.trim() ===
            (wasExpanded ? labels.collapse : labels.expand),
        );
        if (item) {
          item.setAttribute('icon', wasExpanded ? 'eye' : 'eye-slash');
          item.textContent = wasExpanded ? labels.expand : labels.collapse;
        }
      },
    });
  });
})();
