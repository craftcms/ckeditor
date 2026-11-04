import {t} from '@craftcms/cp';

/**
 * Adds the “Expand to a separate button” / “Collapse to a dropdown” action and the
 * “Show as a separate button” indicator to the entry type chips in a CKEditor field’s settings.
 *
 * The entry types’ `expanded` values are kept in the chips’ hidden inputs, via `EntryTypeSelect::extraValueKeys()`.
 */
const INPUT_SELECTOR =
  'input[name$="[entryTypes][]"], input[name="entryTypes[]"]';

interface DefineChipActionsEvent extends CustomEvent {
  detail: {chip: HTMLElement; actions: any[]};
}

// Whether the element belongs to a CKEditor field’s settings
function inCkeditorSettings(element: Element): boolean {
  // The toolbar’s field exists before its async control mounts. Stay within this
  // settings group so a CKEditor elsewhere on the page doesn't match other fields.
  return Boolean(
    element
      .closest('craft-field-group')
      ?.querySelector('craft-field[id$="-editorConfig"]'),
  );
}

function parseValue(input: HTMLInputElement): Record<string, any> | null {
  try {
    const value = JSON.parse(input.value);
    // Newly selected entry types start with just their ID.
    return typeof value === 'number' ? {id: value} : value;
  } catch (e) {
    return null;
  }
}

// Shows or hides the “Show as a separate button” indicator on an entry type chip
function toggleIndicator(chip: HTMLElement, show: boolean): void {
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

  const title = t('Show as a separate button', {}, 'ckeditor');
  indicator = document.createElement('div');
  indicator.className = 'cp-icon puny ckeditor-expanded-indicator';
  indicator.setAttribute('title', title);
  indicator.setAttribute('aria-label', title);
  const icon = document.createElement('craft-icon');
  icon.setAttribute('name', 'eye');
  indicator.append(icon);
  indicators.append(indicator);
}

export function registerEntryTypeChipActions(): void {
  // Keep the indicator in sync when the value changes, e.g. after the overrides are applied,
  // which replaces the chip’s label contents
  document.addEventListener('change', (event) => {
    const input = event.target;
    if (
      !(input instanceof HTMLInputElement) ||
      !input.matches(INPUT_SELECTOR) ||
      !inCkeditorSettings(input)
    ) {
      return;
    }

    const chip = input.closest('li');
    const value = parseValue(input);
    if (chip && value) {
      toggleIndicator(chip, Boolean(value.expanded));
    }
  });

  document.addEventListener('define-chip-actions', (event) => {
    const {chip, actions} = (event as DefineChipActionsEvent).detail ?? {};
    const input = chip?.querySelector<HTMLInputElement>(INPUT_SELECTOR);

    if (!input || !inCkeditorSettings(chip)) {
      return;
    }

    const config = parseValue(input);
    if (!config) {
      return;
    }

    const labels = {
      expand: t('Expand to a separate button', {}, 'ckeditor'),
      collapse: t('Collapse to a dropdown', {}, 'ckeditor'),
    };
    const expanded = Boolean(config.expanded);
    toggleIndicator(chip, expanded);

    actions.push({
      icon: expanded ? 'eye-slash' : 'eye',
      label: expanded ? labels.collapse : labels.expand,
      onActivate: () => {
        const current = parseValue(input) ?? {};
        const wasExpanded = Boolean(current.expanded);
        current.expanded = !wasExpanded;
        input.value = JSON.stringify(current);
        // Programmatic value changes don’t fire `change`; announce it so the control picks up the new value
        input.dispatchEvent(new Event('change', {bubbles: true}));

        // Chip actions are only defined once, so update the menu item in place
        const item = [...chip.querySelectorAll('craft-action-item')].find(
          (el) =>
            el.textContent?.trim() ===
            (wasExpanded ? labels.collapse : labels.expand),
        );
        if (item) {
          item.setAttribute('icon', wasExpanded ? 'eye' : 'eye-slash');
          item.textContent = wasExpanded ? labels.expand : labels.collapse;
        }
      },
    });
  });
}
