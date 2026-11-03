/**
 * The owner bridge the CKEditor JavaScript uses in place of Craft 5’s element editor.
 */
const NESTED_OWNER_EDITOR_REQUEST = 'craft:nested-owner-editor-request';

export interface OwnerContext {
  ownerId: number | null;
  ownerSiteId?: number | null;
  ownerIsDerivative?: boolean;
  ownerIsInDerivativeTree?: boolean;
  ownerIsUnpublishedDraft?: boolean;
  ownerHasDrafts?: boolean;
}

export interface OwnerControl {
  path: string[];
  props: {owner?: OwnerContext | null};
}

export interface OwnerBridge {
  ownerId(): number | null;
  prepare(): Promise<number | null>;
  resolveElementId(id: number): number;
  refresh(): void;
}

/**
 * Finds the element editor containing the given element.
 *
 * Craft dispatches this event for its own HTML islands; there’s no public API for it yet.
 */
function requestOwnerEditor(element: Element | null): any {
  if (!element) {
    return null;
  }
  const request = new CustomEvent(NESTED_OWNER_EDITOR_REQUEST, {
    bubbles: true,
    detail: {editor: null},
  });
  element.dispatchEvent(request);
  return request.detail.editor;
}

export function createOwnerBridge(
  getRoot: () => Element | null,
  getControl: () => OwnerControl,
): OwnerBridge {
  const context = () => getControl().props.owner;

  return {
    /**
     * Returns the current owner’s ID.
     */
    ownerId() {
      return context()?.ownerId ?? null;
    },

    /**
     * Makes sure the owner is a draft (autosaving it if needed), and resolves to the owner ID
     * nested entries should be created for.
     */
    async prepare() {
      const owner = context();
      if (!owner) {
        return null;
      }

      // the owner is already a draft, so there’s nothing to prepare (like Craft 5’s `ensureIsDraftOrRevision()`)
      if (owner.ownerIsDerivative) {
        return owner.ownerId;
      }

      const ownerEditor = requestOwnerEditor(getRoot());
      if (!ownerEditor) {
        return owner.ownerId;
      }

      const prepared = await ownerEditor.prepare(getControl().path, {
        ownerId: owner.ownerId,
        ownerIsDerivative: owner.ownerIsDerivative,
        ownerIsInDerivativeTree: owner.ownerIsInDerivativeTree,
        ownerIsUnpublishedDraft: owner.ownerIsUnpublishedDraft,
        requiresDerivative: owner.ownerHasDrafts,
      });

      if (!prepared) {
        return owner.ownerId;
      }

      if (
        prepared.requiresDerivative &&
        !prepared.isProvisionalDraft &&
        !prepared.draftId &&
        !owner.ownerIsInDerivativeTree &&
        !owner.ownerIsUnpublishedDraft
      ) {
        throw new Error('Could not prepare the owner draft.');
      }

      return prepared.ownerId ?? owner.ownerId;
    },

    /**
     * Maps a canonical nested element ID to its ID in the owner’s draft.
     */
    resolveElementId(id) {
      return requestOwnerEditor(getRoot())?.resolveElementId?.(id) ?? id;
    },

    /**
     * Refreshes the owner’s UI after nested entries change.
     */
    refresh() {
      requestOwnerEditor(getRoot())?.refresh?.();
    },
  };
}
