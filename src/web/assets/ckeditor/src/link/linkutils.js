/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */

/**
 * Resolve the raw value from an advanced link field into the value that
 * should be stored as the corresponding model attribute.
 *
 * For bool type fields, a truthy value collapses to an empty string
 * attribute value; see https://github.com/craftcms/ckeditor/issues/551 and
 * https://github.com/craftcms/ckeditor/issues/606
 *
 * Returns `undefined` when there's no value, so the attribute should be
 * removed/omitted rather than set.
 * @param {Object} item
 * @param {*} rawValue
 * @return {string|undefined}
 */
export function resolveAdvancedFieldAttributeValue(item, rawValue) {
  if (!rawValue) {
    return undefined;
  }

  return item.type === 'bool' && item.value == true ? '' : rawValue;
}
