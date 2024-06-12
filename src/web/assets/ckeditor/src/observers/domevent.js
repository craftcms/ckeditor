import {DomEventObserver} from 'ckeditor5/src/engine';

export class DoubleClickObserver extends DomEventObserver {
  constructor(view) {
    super(view);

    this.domEventType = 'dblclick';
  }

  onDomEvent(domEvent) {
    this.fire(domEvent.type, domEvent);
  }
}
