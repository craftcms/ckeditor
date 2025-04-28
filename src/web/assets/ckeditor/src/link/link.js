import {Plugin} from 'ckeditor5';
import CraftLinkEditing from './linkediting';
import CraftLinkUI from './linkui';

export default class CraftLink extends Plugin {
  static get requires() {
    return [CraftLinkEditing, CraftLinkUI];
  }

  static get pluginName() {
    return 'CraftLink';
  }
}
