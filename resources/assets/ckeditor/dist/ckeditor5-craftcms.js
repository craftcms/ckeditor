import { ButtonView as e, ClassicEditor as t, Collection as n, Command as r, ContextualBalloon as i, DomEventObserver as a, DropdownButtonView as o, FormRowView as s, Heading as c, IconImage as l, IconObjectSizeMedium as u, IconPlus as d, ImageInsertUI as f, ImageTextAlternativeUI as p, ImageUtils as m, LabeledFieldView as h, LinkUI as g, ModelRange as _, Plugin as v, SourceEditing as y, SwitchButtonView as b, View as x, ViewModel as S, Widget as C, WidgetToolbarRepository as w, addListToDropdown as T, createDropdown as E, createLabeledInputText as D, findAttributeRange as O, isWidget as ee, toWidget as k, viewToModelPositionOutsideModelElement as A } from "ckeditor5";
// \0rolldown/runtime.js
var j = Object.create, M = Object.defineProperty, te = Object.getOwnPropertyDescriptor, N = Object.getOwnPropertyNames, ne = Object.getPrototypeOf, re = Object.prototype.hasOwnProperty, ie = (e, t) => () => (t || (e((t = { exports: {} }).exports, t, t.exports), e = null), t.exports), ae = (e, t, n, r) => {
	if (t && typeof t == "object" || typeof t == "function") for (var i = N(t), a = 0, o = i.length, s; a < o; a++) s = i[a], !re.call(e, s) && s !== n && M(e, s, {
		get: ((e) => t[e]).bind(null, s),
		enumerable: !(r = te(t, s)) || r.enumerable
	});
	return e;
}, oe = (e, t, n) => (n = e == null ? {} : j(ne(e)), ae(t || !e || !e.__esModule || !re.call(e, "default") ? M(n, "default", {
	value: e,
	enumerable: !0
}) : n, e)), P = /#asset:\d+(?:@\d+)?:alt$/, se = /#asset:(\d+)(?:@(\d+))?/, ce = class extends p {
	static get pluginName() {
		return "CraftImageTextAlternativeUI";
	}
	constructor() {
		super(...arguments), this._syncButton = null, this._syncButtonRow = null;
	}
	_createForm() {
		super._createForm(), this._createSyncButton(), this.listenTo(this._form, "submit", () => {
			let e = this._form.labeledInput.fieldView, t = this.editor.commands.get("imageTextAlternative").value || "";
			P.test(t) && e.element.value === this._visibleAltText(t) && (e.value = e.element.value = t);
		}, { priority: "high" });
	}
	_showForm() {
		super._showForm();
		let e = this._form.labeledInput.fieldView, t = this._visibleAltText(e.element.value);
		e.value = e.element.value = t, this._syncButton.isEnabled = !!this._srcInfo(this._selectedImage()), e.select();
	}
	_visibleAltText(e) {
		return e.replace(P, "");
	}
	_selectedImage() {
		return this.editor.plugins.get("ImageUtils").getClosestSelectedImageElement(this.editor.model.document.selection);
	}
	_srcInfo(e) {
		if (!e || !e.hasAttribute("src")) return null;
		let t = e.getAttribute("src").match(se);
		return t ? {
			assetId: t[1],
			siteId: t[2] ?? null
		} : null;
	}
	_createSyncButton() {
		let t = this.editor, n = new e(t.locale);
		n.set({
			label: Craft.t("ckeditor", "Sync from asset"),
			withText: !0,
			class: "btn"
		}), n.render(), this.listenTo(n, "execute", () => this._syncFromAsset());
		let r = new s(t.locale, { children: [n] });
		this._form.children.add(r), this._form.focusTracker.add(n.element), this._form._focusables.add(n), this._syncButton = n, this._syncButtonRow = r;
	}
	async _syncFromAsset() {
		let e = this._selectedImage(), t = this._srcInfo(e);
		if (!t) return;
		let n;
		try {
			n = await Craft.sendActionRequest("POST", "ckeditor/ckeditor/image-alt", { data: {
				assetId: t.assetId,
				siteId: t.siteId ?? this.editor.config.get("elementSiteId")
			} });
		} catch (e) {
			throw Craft.cp.displayError(e?.response?.data?.message), e;
		}
		let r = n.data.siteId ?? t.siteId, i = n.data.alt ?? "", a = `${i}#asset:${t.assetId}${r ? `@${r}` : ""}:alt`, o = this._form.labeledInput.fieldView;
		o.value == i ? Craft.cp.displaySuccess(Craft.t("ckeditor", "The alternative text was already in sync.")) : (o.value = o.element.value = i, this.editor.execute("imageTextAlternative", { newValue: a }), Craft.cp.displaySuccess(Craft.t("ckeditor", "The alternative text was synced from the asset.")));
	}
	destroy() {
		this._syncButton && this._syncButton.destroy(), super.destroy();
	}
}, le = class extends f {
	static get pluginName() {
		return "CraftImageInsertUI";
	}
	constructor() {
		super(...arguments), this.$container = null, this.progressBar = null, this.$fileInput = null, this.uploader = null;
	}
	init() {
		if (!this._imageSources) {
			console.warn("Omitting the \"image\" CKEditor toolbar button, because there aren’t any permitted volumes.");
			return;
		}
		if (this._imageMode === "entries" && !this._imageFieldHandle) {
			console.warn("Omitting the \"image\" CKEditor toolbar button, because no image field was selected.");
			return;
		}
		let e = this.editor.ui.componentFactory, t = (e) => this._createToolbarImageButton(e);
		e.add("insertImage", t), e.add("imageInsert", t), this._attachUploader();
	}
	get _imageMode() {
		return this.editor.config.get("imageMode");
	}
	get _imageSources() {
		return this.editor.config.get("imageSources");
	}
	get _imageModalSettings() {
		return this.editor.config.get("imageModalSettings") ?? {};
	}
	get _imageFieldHandle() {
		return this.editor.config.get("imageFieldHandle");
	}
	get _elementEditor() {
		return $(this.editor.ui.view.element).closest("form,.lp-editor-container").data("elementEditor");
	}
	_createToolbarImageButton(t) {
		let n = this.editor, r = n.t, i = new e(t);
		i.isEnabled = !0, i.label = r("Insert image"), i.icon = l, i.tooltip = !0;
		let a = n.commands.get("insertImage");
		return i.bind("isEnabled").to(a), this.listenTo(i, "execute", () => this._showImageSelectModal()), i;
	}
	_showImageSelectModal() {
		let e = this._imageSources, t = this.editor, n = t.config, r = Object.assign({}, n.get("assetSelectionCriteria"), { kind: "image" });
		Craft.createElementSelectorModal("CraftCms\\Cms\\Asset\\Elements\\Asset", {
			...this._imageModalSettings,
			storageKey: `ckeditor:${this.pluginName}:'CraftCms\\Cms\\Asset\\Elements\\Asset'`,
			sources: e,
			criteria: r,
			defaultSiteId: n.get("elementSiteId"),
			transforms: n.get("transforms"),
			autoFocusSearchBox: !1,
			multiSelect: !0,
			onSelect: (e, n) => {
				this._processSelectedAssets(e, n).then(() => {
					t.editing.view.focus();
				});
			},
			onHide: () => {
				t.editing.view.focus();
			},
			closeOtherModals: !1
		});
	}
	async _processSelectedAssets(e, t) {
		if (!e.length) return;
		if (this._imageMode === "entries") {
			for (let t of e) await this._createImageEntry(t.id);
			return;
		}
		let n = this.editor, r = n.config.get("defaultTransform"), i = [];
		for (let a of e) {
			let e = a.siteId ?? n.config.get("elementSiteId"), o = `${a.$element.data("alt") ?? ""}#asset:${a.id}${e ? `@${e}` : ""}:alt`, s = this._isTransformUrl(a.url);
			if (!s && r) {
				let e = await this._getTransformUrl(a.id, r);
				i.push({
					src: e,
					alt: o
				});
			} else {
				let e = this._buildAssetUrl(a.id, a.url, s ? t : r);
				i.push({
					src: e,
					alt: o
				});
			}
		}
		n.execute("insertImage", { source: i });
	}
	async _createImageEntry(e) {
		let t = this.editor, n = this._elementEditor, r = $(t.sourceElement).attr("name");
		n && r && await n.setFormValue(r, "*");
		let i = t.config.get("nestedElementAttributes"), a = { ...i }, o = t.config.get("craftOwner");
		n ? (await n.markDeltaNameAsModified(t.sourceElement.name), a.ownerId = n.getDraftElementId(i.ownerId)) : o && (a.ownerId = await o.prepare());
		let s;
		try {
			s = await Craft.sendActionRequest("POST", "ckeditor/ckeditor/create-image-entry", { data: {
				...a,
				assetIds: [e]
			} });
		} catch (e) {
			throw Craft.cp.displayError(), e;
		}
		t.commands.execute("insertEntry", {
			entryId: s.data.entryId,
			siteId: s.data.siteId
		});
	}
	_buildAssetUrl(e, t, n) {
		return `${t}#asset:${e}:${n ? "transform:" + n : "url"}`;
	}
	_removeTransformFromUrl(e) {
		return e.replace(/(^|\/)_[^\/]+(\/\d+)?\/([^\/]+)$/, "$1$3");
	}
	_isTransformUrl(e) {
		return /(^|\/)_[^\/]+(\/\d+)?(\/[^\/]+)$/.test(e);
	}
	async _getTransformUrl(e, t) {
		let n;
		try {
			n = await Craft.sendActionRequest("POST", "ckeditor/ckeditor/image-url", { data: {
				assetId: e,
				transform: t
			} });
		} catch {
			alert("There was an error generating the transform URL.");
		}
		return this._buildAssetUrl(e, n.data.url, t);
	}
	_getAssetUrlComponents(e) {
		let t = e.match(/(.*)#asset:(\d+):(url|transform):?([a-zA-Z][a-zA-Z0-9_]*)?/);
		return t ? {
			url: t[1],
			assetId: t[2],
			transform: t[3] === "url" ? null : t[4]
		} : null;
	}
	_attachUploader() {
		let e = this.editor, t = e.config.get("defaultUploadFolderId");
		t && (this.$container = $(e.sourceElement).closest(".input"), this.progressBar = new Craft.ProgressBar($("<div class=\"progress-shade\"></div>").appendTo(this.$container)), this.$fileInput = $("<input/>", {
			type: "file",
			class: "hidden",
			multiple: !0
		}).insertAfter(e.sourceElement), this.uploader = Craft.createUploader(null, this.$container, {
			dropZone: this.$container,
			fileInput: this.$fileInput,
			allowedKinds: ["image"],
			canAddMoreFiles: !0,
			events: {
				fileuploadstart: this._onUploadStart.bind(this),
				fileuploadprogressall: this._onUploadProgress.bind(this),
				fileuploaddone: this._onUploadComplete.bind(this),
				fileuploadfail: this._onUploadFailure.bind(this)
			}
		}), this.uploader.setParams({
			folderId: t,
			siteId: e.config.get("elementSiteId")
		}), e.editing.view.document.on("drop", async (t, n) => {
			e.editing.view, e.model;
			let r = e.editing.mapper, i = n.dropRange;
			if (i) {
				let t = i.start, n = r.toModelPosition(t);
				e.model.change((e) => {
					e.setSelection(n, 0);
				});
			}
		}, { priority: "high" }));
	}
	_onUploadStart() {
		this.progressBar.$progressBar.css({ top: Math.round(this.$container.outerHeight() / 2) - 6 }), this.$container.addClass("uploading"), this.progressBar.resetProgressBar(), this.progressBar.showProgressBar();
	}
	_onUploadProgress(e, t = null) {
		t = e instanceof CustomEvent ? e.detail : t;
		var n = parseInt(Math.min(t.loaded / t.total, 1) * 100, 10);
		this.progressBar.setProgressPercentage(n);
	}
	async _onUploadComplete(e, t = null) {
		let n = e instanceof CustomEvent ? e.detail : t.result;
		if (this.progressBar.hideProgressBar(), this.$container.removeClass("uploading"), this._imageMode === "entries") {
			await this._createImageEntry(n.assetId);
			return;
		}
		let r = this.editor.config.get("defaultTransform"), i = this._isTransformUrl(n.url), a;
		a = !n.url || !i && r ? await this._getTransformUrl(n.assetId, r) : this._buildAssetUrl(n.assetId, n.url, i ? transform : r), this.editor.execute("insertImage", {
			source: a,
			breakBlock: !0
		});
	}
	_onUploadFailure(e, t = null) {
		let { message: n, filename: r, errors: i } = (e instanceof CustomEvent ? e.detail : t?.jqXHR?.responseJSON) || {};
		r ||= t?.files?.[0].name;
		let a = i ? Object.values(i).flat() : [];
		n ||= a.length ? a.join("\n") : r ? Craft.t("app", "Upload failed for “{filename}”.", { filename: r }) : Craft.t("app", "Upload failed."), Craft.cp.displayError(n), this.progressBar.hideProgressBar(), this.$container.removeClass("uploading");
	}
}, ue = class extends r {
	refresh() {
		let e = this._element(), t = this._srcInfo(e);
		this.isEnabled = !!t, this.value = t ? { transform: t.transform } : null;
	}
	_element() {
		let e = this.editor;
		return e.plugins.get("ImageUtils").getClosestSelectedImageElement(e.model.document.selection);
	}
	_srcInfo(e) {
		if (!e || !e.hasAttribute("src")) return null;
		let t = e.getAttribute("src"), n = t.match(/#asset:(\d+)(?::transform:([a-zA-Z][a-zA-Z0-9_]*))?/);
		return n ? {
			src: t,
			assetId: n[1],
			transform: n[2]
		} : null;
	}
	execute(e) {
		let t = this.editor.model, n = this._element(), r = this._srcInfo(n);
		if (this.value = { transform: e.transform }, r) {
			let i = `#asset:${r.assetId}` + (e.transform ? `:transform:${e.transform}` : "");
			t.change((e) => {
				let t = r.src.replace(/#.*/, "") + i;
				e.setAttribute("src", t, n);
			}), Craft.sendActionRequest("post", "ckeditor/ckeditor/image-url", { data: {
				assetId: r.assetId,
				transform: e.transform
			} }).then(({ data: e }) => {
				t.change((t) => {
					let r = e.url + i;
					t.setAttribute("src", r, n), e.width && t.setAttribute("width", e.width, n), e.height && t.setAttribute("height", e.height, n);
				});
			});
		}
	}
}, de = class extends v {
	static get requires() {
		return [m];
	}
	static get pluginName() {
		return "ImageTransformEditing";
	}
	constructor(e) {
		super(e), e.config.define("transforms", []);
	}
	init() {
		let e = this.editor, t = new ue(e);
		e.commands.add("transformImage", t);
	}
}, fe = u, pe = class extends v {
	static get requires() {
		return [de];
	}
	static get pluginName() {
		return "ImageTransformUI";
	}
	init() {
		let e = this.editor, t = e.config.get("transforms"), n = e.commands.get("transformImage");
		this.bind("isEnabled").to(n), this._registerImageTransformDropdown(t);
	}
	_registerImageTransformDropdown(e) {
		let t = this.editor, n = t.t, r = {
			name: "transformImage:original",
			value: null
		}, i = [r, ...e.map((e) => ({
			label: e.name,
			name: `transformImage:${e.handle}`,
			value: e.handle
		}))];
		t.ui.componentFactory.add("transformImage", (a) => {
			let s = t.commands.get("transformImage"), c = E(a, o), l = c.buttonView;
			return l.set({
				tooltip: n("Resize image"),
				commandValue: null,
				icon: fe,
				isToggleable: !0,
				label: this._getOptionLabelValue(r),
				withText: !0,
				class: "ck-resize-image-button"
			}), l.bind("label").to(s, "value", (t) => {
				if (!t || !t.transform) return this._getOptionLabelValue(r);
				let n = e.find((e) => e.handle === t.transform);
				return n ? n.name : t.transform;
			}), c.bind("isEnabled").to(this), T(c, () => this._getTransformDropdownListItemDefinitions(i, s), { ariaLabel: n("Image resize list") }), this.listenTo(c, "execute", (e) => {
				t.execute(e.source.commandName, { transform: e.source.commandValue }), t.editing.view.focus();
			}), c;
		});
	}
	_getOptionLabelValue(e) {
		return e.label || e.value || this.editor.t("Original");
	}
	_getTransformDropdownListItemDefinitions(e, t) {
		let r = new n();
		return e.map((e) => {
			let n = {
				type: "button",
				model: new S({
					commandName: "transformImage",
					commandValue: e.value,
					label: this._getOptionLabelValue(e),
					withText: !0,
					icon: null
				})
			};
			n.model.bind("isOn").to(t, "value", me(e.value)), r.add(n);
		}), r;
	}
};
function me(e) {
	return (t) => {
		let n = t;
		return e === null && n === e || n !== null && n.transform === e;
	};
}
// resources/assets/ckeditor/src/image/imagetransform.js
var he = class extends v {
	static get requires() {
		return [de, pe];
	}
	static get pluginName() {
		return "ImageTransform";
	}
}, ge = class extends r {
	refresh() {
		let e = this._element(), t = this._srcInfo(e);
		if (this.isEnabled = !!t, this.isEnabled) {
			let e = { assetId: t.assetId };
			Craft.sendActionRequest("POST", "ckeditor/ckeditor/image-permissions", { data: e }).then((e) => {
				e.data.editable === !1 && (this.isEnabled = !1);
			});
		}
	}
	_element() {
		let e = this.editor;
		return e.plugins.get("ImageUtils").getClosestSelectedImageElement(e.model.document.selection);
	}
	_srcInfo(e) {
		if (!e || !e.hasAttribute("src")) return null;
		let t = e.getAttribute("src"), n = t.match(/(.*)#asset:(\d+)(?::transform:([a-zA-Z][a-zA-Z0-9_]*))?/);
		return n ? {
			src: t,
			assetId: n[2],
			transform: n[3]
		} : null;
	}
	execute() {
		this.editor.model;
		let e = this._element(), t = this._srcInfo(e);
		if (t) {
			let e = {
				allowSavingAsNew: !1,
				onSave: (e) => {
					this._reloadImage(t.assetId, e);
				},
				allowDegreeFractions: Craft.isImagick
			};
			new Craft.AssetImageEditor(t.assetId, e);
		}
	}
	_reloadImage(e, t) {
		let n = this.editor.model;
		this._getAllImageAssets().forEach((t) => {
			if (t.srcInfo.assetId == e) {
				if (t.srcInfo.transform) {
					let e = {
						assetId: t.srcInfo.assetId,
						handle: t.srcInfo.transform
					};
					Craft.sendActionRequest("POST", "assets/generate-transform", { data: e }).then((e) => {
						let r = this._getNewSrc(e.data, t);
						n.change((e) => {
							e.setAttribute("src", r, t.element);
						});
					});
				} else {
					let e = { assetId: t.srcInfo.assetId };
					Craft.sendActionRequest("POST", "ckeditor/ckeditor/image-url", { data: e }).then((e) => {
						let r = this._getNewSrc(e.data, t);
						n.change((e) => {
							e.setAttribute("src", r, t.element);
						});
					});
				}
			}
		});
	}
	_getNewSrc(e, t) {
		let n = e.url;
		return Craft.revAssetUrls || (n += (n.includes("?") ? "&" : "?") + (/* @__PURE__ */ new Date()).getTime()), n += "#asset:" + t.srcInfo.assetId, t.srcInfo.transform && (n += ":transform:" + t.srcInfo.transform), n;
	}
	_getAllImageAssets() {
		let e = this.editor.model, t = e.createRangeIn(e.document.getRoot()), n = [];
		for (let e of t.getWalker({ ignoreElementEnd: !0 })) if (e.item.is("element") && e.item.name === "imageBlock") {
			let t = this._srcInfo(e.item);
			t && n.push({
				element: e.item,
				srcInfo: t
			});
		}
		return n;
	}
}, F = class extends v {
	static get requires() {
		return [m];
	}
	static get pluginName() {
		return "ImageEditorEditing";
	}
	init() {
		let e = this.editor, t = new ge(e);
		e.commands.add("imageEditor", t);
	}
}, _e = class extends v {
	static get requires() {
		return [F];
	}
	static get pluginName() {
		return "ImageEditorUI";
	}
	init() {
		let e = this.editor.commands.get("imageEditor");
		this.bind("isEnabled").to(e), this._registerImageEditorButton();
	}
	_registerImageEditorButton() {
		let t = this.editor, n = t.t, r = t.commands.get("imageEditor");
		t.ui.componentFactory.add("imageEditor", () => {
			let i = new e();
			return i.set({
				label: n("Edit Image"),
				withText: !0
			}), i.bind("isEnabled").to(r), this.listenTo(i, "execute", (e) => {
				t.execute("imageEditor"), t.editing.view.focus();
			}), i;
		});
	}
}, ve = class extends v {
	static get requires() {
		return [F, _e];
	}
	static get pluginName() {
		return "ImageEditor";
	}
}, ye = class extends r {
	execute(e) {
		let t = this.editor, n = t.model.document.selection;
		if (!n.isCollapsed && n.getFirstRange()) {
			let e = n.getSelectedElement();
			t.execute("insertParagraph", { position: t.model.createPositionAfter(e) });
		}
		t.model.change((r) => {
			let i = r.createElement("craftEntryModel", {
				...Object.fromEntries(n.getAttributes()),
				cardHtml: e.cardHtml,
				entryId: e.entryId,
				siteId: e.siteId
			});
			t.model.insertObject(i, null, null, { setSelection: "on" });
		});
	}
	refresh() {
		this.isEnabled = !0;
	}
}, be = class extends v {
	static get requires() {
		return [C];
	}
	static get pluginName() {
		return "CraftEntriesEditing";
	}
	init() {
		this._defineSchema(), this._defineConverters();
		let e = this.editor;
		e.commands.add("insertEntry", new ye(e)), e.editing.mapper.on("viewToModelPosition", A(e.model, (e) => {
			e.hasClass("cke-entry-card");
		}));
	}
	_defineSchema() {
		this.editor.model.schema.register("craftEntryModel", {
			inheritAllFrom: "$blockObject",
			allowAttributes: [
				"cardHtml",
				"entryId",
				"siteId"
			],
			allowChildren: !1
		});
	}
	_defineConverters() {
		let e = this.editor.conversion;
		e.for("upcast").elementToElement({
			view: { name: "craft-entry" },
			model: (e, { writer: t }) => {
				let n = e.getAttribute("data-card-html"), r = e.getAttribute("data-entry-id"), i = e.getAttribute("data-site-id") ?? null;
				return t.createElement("craftEntryModel", {
					cardHtml: n,
					entryId: r,
					siteId: i
				});
			}
		}), e.for("editingDowncast").elementToElement({
			model: "craftEntryModel",
			view: (e, { writer: n }) => {
				let r = e.getAttribute("entryId") ?? null, i = e.getAttribute("siteId") ?? null, a = n.createContainerElement("div", {
					class: "cke-entry-card",
					"data-entry-id": r,
					"data-site-id": i
				});
				return t(e, n, a), k(a, n);
			}
		}), e.for("dataDowncast").elementToElement({
			model: "craftEntryModel",
			view: (e, { writer: t }) => {
				let n = e.getAttribute("entryId") ?? null, r = e.getAttribute("siteId") ?? null;
				return t.createContainerElement("craft-entry", {
					"data-entry-id": n,
					"data-site-id": r
				});
			}
		});
		let t = (e, t, n) => {
			this._getCardHtml(e).then((e) => {
				let r = t.createRawElement("div", null, function(t) {
					t.innerHTML = e.cardHtml, Craft.appendHeadHtml(e.headHtml), Craft.appendBodyHtml(e.bodyHtml);
				});
				t.insert(t.createPositionAt(n, 0), r);
				let i = this.editor;
				i.editing.view.focus(), setTimeout(() => {
					Craft.cp.elementThumbLoader.load($(i.ui.element));
				}, 100), i.model.change((e) => {
					i.ui.update(), $(i.sourceElement).trigger("keyup");
				});
			});
		};
	}
	async _getCardHtml(e) {
		let t = e.getAttribute("cardHtml") ?? null;
		if (t) return { cardHtml: t };
		let n = $(this.editor.sourceElement).parents(".field"), r = this.editor.config.get("layoutElementUid") ?? $(n[0]).data("layout-element"), i = e.getAttribute("entryId") ?? null, a = e.getAttribute("siteId") ?? null;
		try {
			let e = this.editor, t = $(e.ui.view.element).closest("form,.lp-editor-container").data("elementEditor");
			t && await t.checkForm();
			let { data: n } = await Craft.sendActionRequest("POST", "ckeditor/ckeditor/entry-card-html", { data: {
				entryId: i,
				siteId: a,
				layoutElementUid: r
			} });
			return n;
		} catch (e) {
			return console.error(e?.response?.data), { cardHtml: "<div class=\"element card\"><div class=\"card-content\"><div class=\"card-heading\"><div class=\"label error\"><span>" + (e?.response?.data?.message || "An unknown error occurred.") + "</span></div></div></div></div>" };
		}
	}
}, xe = class extends a {
	constructor(e) {
		super(e), this.domEventType = "dblclick";
	}
	onDomEvent(e) {
		this.fire(e.type, e);
	}
}, Se = class extends x {
	constructor(t, n = {}) {
		super(t), this.set("isFocused", !1), this.entriesUi = n.entriesUi, this.editor = this.entriesUi.editor, this.entryType = n.entryType;
		let r = this.editor.commands.get("insertEntry"), i = new e(), a = {
			commandValue: this.entryType.model.commandValue,
			label: this.entryType.model.label,
			withText: !this.entryType.model.icon,
			tooltip: Craft.t("app", "New {type}", { type: this.entryType.model.label })
		}, o = ["btn", "ck-reset_all-excluded"];
		this.entryType.model.icon && o.push(["icon", "cp-icon"]), a.class = o.join(" "), this.entryType.model.withIcon && (a.icon = this.entryType.model.icon), i.set(a), this.listenTo(i, "execute", (e) => {
			this.entriesUi._showCreateEntrySlideout(e.source.commandValue);
		}), i.bind("isEnabled").to(r), this.setTemplate({
			tag: "div",
			attributes: { class: ["entry-type-button"] },
			children: [i]
		});
	}
	focus() {
		this.element.children[0].focus();
	}
}, Ce = class extends x {
	constructor(e, t = {}) {
		super(e), this.bindTemplate, this.set("isFocused", !1), this.entriesUi = t.entriesUi, this.editor = this.entriesUi.editor;
		let r = t.entryTypes, i = this.editor.commands.get("insertEntry"), a = new n();
		r.forEach((e) => {
			e.model.color && (e.model.class || (e.model.class = ""), e.model.class += "icon " + e.model.color), a.add(e);
		});
		let o = E(e);
		o.buttonView.set({
			label: Craft.t("ckeditor", "Add nested content"),
			icon: d,
			tooltip: !0,
			withText: !1
		}), o.bind("isEnabled").to(i), o.id = Craft.uuid(), T(o, () => a, { ariaLabel: Craft.t("ckeditor", "Entry types list") }), this.listenTo(o, "execute", (e) => {
			this.entriesUi._showCreateEntrySlideout(e.source.commandValue);
		}), this.setTemplate({
			tag: "div",
			attributes: { class: ["entry-type-button"] },
			children: [o]
		});
	}
	focus() {
		this.element.children[0].children[0].focus();
	}
}, we = class extends x {
	constructor(e, t = {}) {
		super(e), this.bindTemplate, this.set("isFocused", !1), this.entriesUi = t.entriesUi, this.editor = this.entriesUi.editor;
		let n = this.editor.commands.get("insertEntry"), r = E(e);
		r.buttonView.set({
			label: Craft.t("ckeditor", "Add nested content"),
			icon: d,
			tooltip: !0,
			withText: !1
		}), r.bind("isEnabled").to(n), r.id = Craft.uuid(), this.listenTo(r, "execute", (e) => {
			this.entriesUi._showCreateEntrySlideout(e.source.commandValue);
		}), this.setTemplate({
			tag: "div",
			attributes: {
				class: ["entry-type-button"],
				tabindex: -1
			},
			children: [r]
		});
	}
	focus() {
		this.element.focus();
	}
}, Te = class extends v {
	static get requires() {
		return [w];
	}
	static get pluginName() {
		return "CraftEntriesUI";
	}
	init() {
		this._createToolbarEntriesButtons(), this.editor.ui.componentFactory.add("editEntryBtn", (e) => this._createEditEntryBtn(e)), this._listenToEvents();
	}
	afterInit() {
		this.editor.plugins.get(w).register("entriesBalloon", {
			ariaLabel: Craft.t("ckeditor", "Entry toolbar"),
			items: ["editEntryBtn"],
			getRelatedElement: (e) => {
				let t = e.getSelectedElement();
				return t && ee(t) && t.hasClass("cke-entry-card") ? t : null;
			}
		});
	}
	_listenToEvents() {
		let e = this.editor.editing.view, t = e.document;
		e.addObserver(xe), this.editor.listenTo(t, "dblclick", (e, t) => {
			if (!this.editor.isReadOnly) {
				let e = this.editor.editing.mapper.toModelElement(t.target.parent);
				e.name === "craftEntryModel" && this._initEditEntrySlideout(t, e);
			}
		});
	}
	_initEditEntrySlideout(e = null, t = null) {
		if (this.editor.isReadOnly) return;
		t === null && (t = this.editor.model.document.selection.getSelectedElement());
		let n = t.getAttribute("entryId"), r = t.getAttribute("siteId") ?? null;
		this._showEditEntrySlideout(n, r, t);
	}
	_createToolbarEntriesButtons() {
		let e = this.editor.config.get("entryTypeOptions");
		if (e && e.length) {
			if (e.length == 1 && e[0].value == "fake") this.editor.ui.componentFactory.add("createEntry", (e) => new we(this.editor.locale, { entriesUi: this }));
			else {
				let t = this._getEntryTypeButtonsCollection(e ?? []), n = t.filter((e) => e.model.expanded), r = t.filter((e) => !e.model.expanded);
				n.forEach((e, t) => {
					this.editor.ui.componentFactory.add(`createEntry-${e.model.uid}`, (t) => new Se(this.editor.locale, {
						entriesUi: this,
						entryType: e
					}));
				}), r.length && this.editor.ui.componentFactory.add("createEntry", (e) => new Ce(this.editor.locale, {
					entriesUi: this,
					entryTypes: r
				}));
			}
		}
	}
	_getEntryTypeButtonsCollection(e) {
		let t = new n();
		return e.map((e) => {
			let n = {
				type: "button",
				model: new S({
					commandValue: e.value,
					color: e.expanded ? null : e.color,
					expanded: e.expanded,
					icon: e.icon,
					label: e.label || e.value,
					uid: e.uid,
					withIcon: e.icon,
					withText: !e.expanded || !e.icon
				})
			};
			t.add(n);
		}), t;
	}
	_createEditEntryBtn(t) {
		if (this.editor.isReadOnly) return;
		let n = new e(t);
		return n.set({
			isEnabled: !0,
			label: Craft.t("app", "Edit {type}", { type: (Craft.elementTypeNames["CraftCms\\Cms\\Entry\\Elements\\Entry"] ?? Craft.elementTypeNames["craft\\elements\\Entry"])[2] }),
			tooltip: !0,
			withText: !0
		}), this.listenTo(n, "execute", (e) => {
			this._initEditEntrySlideout();
		}), n;
	}
	getElementEditor() {
		return $(this.editor.ui.view.element).closest("form,.lp-editor-container").data("elementEditor");
	}
	_getCardElement(e) {
		return $(this.editor.ui.element).find(".element.card[data-id=\"" + e + "\"]");
	}
	_showEditEntrySlideout(e, t, n) {
		let r = this.editor, i = r.model, a = this.getElementEditor(), o = r.config.get("craftOwner");
		if (!a && o && Craft.openSlideout) {
			this._openNativeEditEntrySlideout(e, t, n, o);
			return;
		}
		let s = this._getCardElement(e), c = s.data("owner-id"), l = { siteId: t }, u = s.parents(".field");
		u.length && $(u[0]).hasClass("has-errors") && (l.prevalidate = !0);
		let d = Craft.createElementEditor(this.elementType, null, {
			elementId: e,
			params: l,
			onLoad: () => {
				d.elementEditor.on("update", () => {
					Craft.Preview.refresh();
				});
			},
			onBeforeSubmit: async () => {
				if (s !== null && Garnish.hasAttr(s, "data-owner-is-canonical") && (!a || !a.settings.isUnpublishedDraft)) {
					await d.elementEditor.checkForm(!0, !0);
					let e = $(r.sourceElement).attr("name");
					a && e && await a.setFormValue(e, "*"), a && a.settings.draftId && d.elementEditor.settings.draftId && (d.elementEditor.settings.saveParams || (d.elementEditor.settings.saveParams = {}), d.elementEditor.settings.saveParams.action = "elements/save-nested-element-for-derivative", d.elementEditor.settings.saveParams.newOwnerId = a.getDraftElementId(c));
				}
			},
			onSubmit: (t) => {
				let i = this._getCardElement(e);
				i !== null && t.data.id != i.data("id") && (i.attr("data-id", t.data.id).data("id", t.data.id).data("owner-id", t.data.ownerId), r.editing.model.change((e) => {
					e.setAttribute("entryId", t.data.id, n), r.ui.update();
				}), Craft.refreshElementInstances(t.data.id));
			}
		});
		d.on("beforeClose", () => {
			i.change((e) => {
				e.setSelection(e.createPositionAfter(n)), r.editing.view.focus();
			});
		}), d.on("close", () => {
			r.editing.view.focus();
		});
	}
	_openNativeEditEntrySlideout(e, t, n, r) {
		let i = this.editor, a = i.model, o = this._getCardElement(e), s = {
			elementId: e,
			siteId: t
		}, c = o.parents(".field");
		c.length && $(c[0]).hasClass("has-errors") && (s.prevalidate = 1), Craft.openSlideout(Craft.getActionUrl("elements/edit", s), {
			opener: o[0] ?? null,
			prepareNestedOwner: () => r.prepare(),
			onSaved: (t) => {
				if (t?.draft) return;
				let a = parseInt(t?.data?.element?.id ?? t?.data?.id ?? e, 10);
				a && a != e && i.editing.model.change((e) => {
					e.setAttribute("entryId", a, n);
				}), Craft.refreshElementInstances(a || e), r.refresh();
			},
			onClosed: () => {
				a.change((e) => {
					e.setSelection(e.createPositionAfter(n));
				}), i.editing.view.focus();
			}
		});
	}
	async _showCreateEntrySlideout(e) {
		let t = this.editor, n = t.model, r = n.document.selection.getFirstRange(), i = t.config.get("nestedElementAttributes"), a = Object.assign({}, i, { typeId: e }), o = this.getElementEditor(), s = t.config.get("craftOwner");
		o ? (await o.markDeltaNameAsModified(t.sourceElement.name), a.ownerId = o.getDraftElementId(i.ownerId)) : s && (a.ownerId = await s.prepare());
		let c;
		try {
			c = (await Craft.sendActionRequest("POST", "elements/create", { data: a })).data;
		} catch (e) {
			throw Craft.cp.displayError(e?.response?.data?.error), e;
		}
		let l = Craft.createElementEditor(this.elementType, {
			elementId: c.element.id,
			draftId: c.element.draftId,
			params: {
				fresh: 1,
				siteId: c.element.siteId
			},
			onSubmit: (e) => {
				t.commands.execute("insertEntry", {
					entryId: e.data.id,
					siteId: e.data.siteId
				});
			}
		});
		l.on("beforeClose", () => {
			l.$triggerElement = null, n.change((e) => {
				e.setSelection(e.createPositionAt(t.model.document.getRoot(), r.end.path[0]));
			}), t.editing.view.focus();
		});
	}
}, Ee = class extends v {
	static get requires() {
		return [be, Te];
	}
	static get pluginName() {
		return "CraftEntries";
	}
};
// resources/assets/ckeditor/src/link/linkutils.js
function De(e, t) {
	if (t) return e.type === "bool" && e.value == 1 ? "" : t;
}
// resources/assets/ckeditor/src/link/linkediting.js
var Oe = class extends v {
	static get pluginName() {
		return "CraftLinkEditing";
	}
	constructor() {
		super(...arguments), this.conversionData = [], this.editor.config.define("advancedLinkFields", []);
	}
	init() {
		let e = this.editor.config.get("advancedLinkFields");
		this.conversionData = e.map((e) => e.conversion ?? null).filter((e) => e), this._defineSchema(), this._defineConverters(), this._adjustLinkCommand(), this._adjustUnlinkCommand();
	}
	_defineSchema() {
		let e = this.editor.model.schema, t = this.conversionData.map((e) => e.model);
		e.extend("$text", { allowAttributes: t });
	}
	_defineConverters() {
		let e = this.editor.conversion;
		for (let t = 0; t < this.conversionData.length; t++) e.for("downcast").attributeToElement({
			model: this.conversionData[t].model,
			view: (e, { writer: n }) => {
				let r = n.createAttributeElement("a", { [this.conversionData[t].view]: e }, { priority: 5 });
				return n.setCustomProperty("link", !0, r), r;
			}
		}), e.for("upcast").attributeToAttribute({
			view: {
				name: "a",
				key: this.conversionData[t].view
			},
			model: {
				key: this.conversionData[t].model,
				value: (e, n) => e.getAttribute(this.conversionData[t].view)
			}
		});
		e.for("editingDowncast").add((e) => {
			e.on("attribute:linkHref", (e, t, { mapper: n, writer: r }) => {
				if (!t.attributeNewValue || !t.item.is("$textProxy")) return;
				let i = n.toViewRange(t.range);
				for (let e of i.getItems()) for (let t of e.getAncestors()) t.is("attributeElement", "a") && t.hasAttribute("href") && !t.getCustomProperty("link") && r.setCustomProperty("link", !0, t);
			}, { priority: "low" });
		});
	}
	_adjustLinkCommand() {
		let e = this.editor, t = e.commands.get("link"), n = !1;
		t.on("execute", (t, r) => {
			if (n) {
				n = !1;
				return;
			}
			t.stop(), n = !0;
			let i = r[3] || {}, a = e.model.document.selection;
			e.model.change((t) => {
				e.execute("link", ...r);
				let n = a.getFirstPosition(), o = null;
				if (a.isCollapsed) {
					let r = n.textNode || n.nodeBefore;
					o = r?.hasAttribute("linkHref") ? O(n, "linkHref", r.getAttribute("linkHref"), e.model) : t.createRangeOn(r);
				}
				this.conversionData.forEach((n) => {
					let r = De(n, i[n.model]);
					if (a.isCollapsed) r === void 0 ? t.removeAttribute(n.model, o) : t.setAttribute(n.model, r, o);
					else {
						let i = e.model.schema.getValidRanges(a.getRanges(), n.model);
						for (let e of i) r === void 0 ? t.removeAttribute(n.model, e) : t.setAttribute(n.model, r, e);
					}
				});
			});
		}, { priority: "high" });
	}
	_adjustUnlinkCommand() {
		let e = this.editor, t = e.commands.get("unlink"), { model: n } = e, { selection: r } = n.document, i = !1;
		t.on("execute", (t) => {
			i || (t.stop(), n.change(() => {
				i = !0, e.execute("unlink"), i = !1, n.change((e) => {
					let t;
					this.conversionData.forEach((i) => {
						t = r.isCollapsed ? [O(r.getFirstPosition(), i.model, r.getAttribute(i.model), n)] : n.schema.getValidRanges(r.getRanges(), i.model);
						for (let n of t) e.removeAttribute(i.model, n);
					});
				});
			}));
		}, { priority: "high" });
	}
}, ke = class extends x {
	constructor(t, n = {}) {
		super(t), this.bindTemplate, this.set("isFocused", !1), this.linkUi = n.linkUi, this.editor = this.linkUi.editor, this.elementId = this.linkUi._getLinkElementId(), this.siteId = this.linkUi._getLinkSiteId(), this.linkOption = n.linkOption;
		let r = this.linkUi._getLinkElementRefHandle();
		if (this.button = null, r) {
			let e = this.linkUi.linkTypeDropdownItemModels[r];
			this.linkUi.linkTypeDropdownView.buttonView.label == e.label && (this.button = Craft.t("app", "Loading"));
		}
		this.button ?? (this.button = new e(), this.button.set({
			label: Craft.t("app", "Choose"),
			withText: !0,
			class: "btn add icon dashed"
		})), this.setTemplate({
			tag: "div",
			attributes: {
				class: ["elementselect", "ck-reset_all-excluded"],
				tabindex: 0
			},
			children: [this.button]
		});
	}
	focus() {
		this.element.focus();
	}
	render() {
		super.render();
		let t = this.linkUi, n = t._linkUI, r = this.linkOption;
		this.element.addEventListener("click", function(e) {
			if (this.children[0].classList.contains("add") || e.target.classList.contains("ck-button__label")) {
				let e = n.formView.displayedTextInputView.fieldView.element.value;
				n._hideUI(!1), t._showElementSelectorModal(r, e);
			}
		}), this.element.children.length == 0 && Craft.sendActionRequest("POST", "ckeditor/ckeditor/render-element-with-supported-sites", { data: { elements: [{
			type: r.elementType,
			id: this.elementId,
			siteId: this.siteId,
			instances: [{
				context: "field",
				ui: "chip",
				sortable: !1,
				showActionMenu: !1
			}]
		}] } }).then((n) => {
			if (Object.keys(n.data.elements).length > 0) {
				if (Craft.isMultiSite && this.linkUi.sitesView != null) for (let [e, t] of Object.entries(this.linkUi.sitesView.siteDropdownItemModels)) n.data.siteIds.includes(parseInt(e)) || e == "current" ? t.set("isEnabled", !0) : t.set("isEnabled", !1);
				this.element.innerHTML = n.data.elements[this.elementId][0], Craft.appendHeadHtml(n.data.headHtml), Craft.appendBodyHtml(n.data.bodyHtml);
				let e = this.element.firstChild, r = [{
					icon: "arrows-rotate",
					label: Craft.t("app", "Replace"),
					callback: () => {
						this.linkUi._showElementSelectorModal(this.linkOption);
					}
				}, {
					icon: "remove",
					label: Craft.t("app", "Remove"),
					callback: () => {
						this.editor.commands.get("unlink").execute();
					}
				}];
				Craft.addActionsToChip(e, r), this.linkUi.sitesView?.siteDropdownView?.buttonView && this.linkUi.sitesView?.siteDropdownView.buttonView.set("isVisible", !0), t._alignFocus();
			} else if (this.linkUi.previousLinkValue?.length > 0) {
				let { formView: e } = this.linkUi._linkUI;
				e.urlInputView.fieldView.set("value", this.linkUi.previousLinkValue);
			} else this.button = new e(), this.button.set({
				label: Craft.t("app", "Choose"),
				withText: !0,
				class: "btn add icon dashed"
			}), this.button.render(), this.element.innerHTML = this.button.element.outerHTML;
		}).catch((e) => {
			throw Craft.cp.displayError(e?.response?.data?.message), e?.response?.data?.message ?? e;
		});
	}
}, Ae = class extends x {
	constructor(e, t = {}) {
		super(e), this.bindTemplate, this.set("isFocused", !1), this.linkUi = t.linkUi, this.editor = this.linkUi.editor, this.elementId = this.linkUi._getLinkElementId(), this.siteId = this.linkUi._getLinkSiteId(), this.linkOption = t.linkOption, this.linkUi._getLinkElementRefHandle(), this.siteDropdownView = E(this.linkUi._linkUI.formView.locale), this.siteDropdownItemModels = null, this.localizedRefHandleRE = null;
		let n = CKE_LOCALIZED_REF_HANDLES.join("|");
		this.localizedRefHandleRE = RegExp(`(#(?:${n}):\\d+)(?:@(\\d+))?`), this.setTemplate({
			tag: "div",
			attributes: {
				class: ["sites-dropdown", "ck-reset_all-excluded"],
				tabindex: 0
			},
			children: [this.siteDropdownView]
		});
	}
	focus() {
		this.element.focus();
	}
	render() {
		super.render(), this._sitesDropdown();
	}
	_sitesDropdown() {
		let { formView: e } = this.linkUi._linkUI, { urlInputView: t } = e, { fieldView: r } = t;
		this.siteDropdownView.buttonView.set({
			label: "",
			withText: !0,
			isVisible: !0
		}), this.siteDropdownItemModels = Object.fromEntries(Craft.sites.map((e) => [e.id, new S({
			label: e.name,
			siteId: e.id,
			withText: !0
		})])), this.siteDropdownItemModels.current = new S({
			label: Craft.t("ckeditor", "Link to the current site"),
			siteId: null,
			withText: !0
		}), T(this.siteDropdownView, new n([...Craft.sites.map((e) => ({
			type: "button",
			model: this.siteDropdownItemModels[e.id]
		})), {
			type: "button",
			model: this.siteDropdownItemModels.current
		}])), this.siteDropdownView.on("execute", (t) => {
			let n = this.linkUi._urlInputRefMatch(this.localizedRefHandleRE);
			if (!n) {
				console.warn(`No reference tag hash present in URL: ${this.linkUi._urlInputValue()}`);
				return;
			}
			let { siteId: r } = t.source, i = n[1];
			r && (i += `@${r}`), this.linkUi.previousLinkValue = this.linkUi._urlInputValue();
			let a = this.linkUi._urlInputValue().replace(n[0], i);
			e.urlInputView.fieldView.set("value", a), this._toggleSiteDropdownView();
		}), this.listenTo(r, "change:value", () => {
			this._toggleSiteDropdownView();
		}), this.listenTo(r, "input", () => {
			this._toggleSiteDropdownView();
		});
	}
	_toggleSiteDropdownView() {
		let e = this.linkUi._urlInputRefMatch(this.localizedRefHandleRE);
		if (e) {
			this.siteDropdownView.buttonView.set("isVisible", !0);
			let t = e[2] ? parseInt(e[2], 10) : null;
			t && this.siteDropdownItemModels[t] === void 0 && (t = null), this._selectSiteDropdownItem(t), this.siteDropdownView.buttonView.set("isVisible", !0);
		} else this.siteDropdownView.buttonView.set("isVisible", !1);
	}
	_selectSiteDropdownItem(e) {
		let t = this.siteDropdownItemModels[e ?? "current"], n = e ? Craft.t("ckeditor", "Site: {name}", { name: t.label }) : t.label;
		this.siteDropdownView.buttonView.set("label", n), Object.values(this.siteDropdownItemModels).forEach((e) => {
			e.set("isOn", e.siteId === t.siteId);
		});
	}
}, je = class extends x {
	constructor(e, t = {}) {
		super(e);
		let n = this.bindTemplate;
		this.set("label", Craft.t("app", "Advanced")), this.linkUi = t.linkUi, this.editor = this.linkUi.editor, this.children = this.createCollection(), this.advancedChildren = this.createCollection(), this.setTemplate({
			tag: "details",
			attributes: { class: [
				"ck",
				"ck-form__details",
				"link-type-advanced"
			] },
			children: this.children
		}), this.summary = new x(e), this.summary.setTemplate({
			tag: "summary",
			attributes: { class: ["ck", "ck-form__details__summary"] },
			children: [{ text: n.to("label") }]
		}), this.children.add(this.summary), this.advancedFieldsContainer = new x(e), this.advancedFieldsContainer.setTemplate({
			tag: "div",
			attributes: { class: [
				"meta",
				"pane",
				"hairline"
			] },
			children: this.advancedChildren
		}), this.children.add(this.advancedFieldsContainer);
	}
	focus() {
		this.summary.element.focus();
	}
	render() {
		super.render(), this.element.addEventListener("toggle", this.onToggle.bind(this));
	}
	onToggle(e) {
		let { formView: t } = this.linkUi._linkUI;
		if (e.target.open) {
			let e = t._focusables.getIndex(this);
			this.advancedChildren._items.forEach((n, r) => {
				t._focusables.add(n, e + r + 1), t.focusTracker.add(n.element, e + r + 1);
			});
		} else this.advancedChildren._items.forEach((e, n) => {
			t._focusables.remove(e), t.focusTracker.remove(e.element);
		});
	}
}, Me = class extends v {
	static get requires() {
		return [g];
	}
	static get pluginName() {
		return "CraftLinkUI";
	}
	constructor() {
		super(...arguments), this.linkTypeWrapperView = null, this.advancedView = null, this.elementInputView = null, this.sitesView = null, this.urlSuffixInputView = null, this.previousLinkValue = null, this.linkTypeDropdownView = null, this.linkTypeDropdownItemModels = [], this.elementTypeRefHandleRE = null, this.urlWithRefHandleRE = null, this.conversionData = [], this.linkOptions = [], this.advancedLinkFields = [], this.editor.config.define("linkOptions", []), this.editor.config.define("advancedLinkFields", []);
	}
	init() {
		let e = this.editor;
		this._linkUI = e.plugins.get(g), this._balloon = e.plugins.get(i), this.linkOptions = e.config.get("linkOptions"), this.advancedLinkFields = e.config.get("advancedLinkFields"), this.conversionData = this.advancedLinkFields.map((e) => e.conversion ?? null).filter((e) => e);
		let t = CKE_LOCALIZED_REF_HANDLES.join("|");
		this.elementTypeRefHandleRE = RegExp(`(#((?:${t})):\\d+)`), this.urlWithRefHandleRE = RegExp(`(.+)(#((?:${t})):(\\d+))(?:@(\\d+))?`), this._modifyFormViewTemplate(), this._balloon.on("set:visibleView", (e, t, n, r) => {
			let { formView: i } = this._linkUI;
			n !== r && n === i && this._alignFocus();
		});
	}
	_alignFocus() {
		let { formView: e } = this._linkUI, t = 0;
		this.linkTypeWrapperView && (this.linkTypeWrapperView._unboundChildren._items.forEach((n) => {
			e._focusables.has(n) && e._focusables.remove(n), e.focusTracker.remove(n.element), e._focusables.add(n, t), e.focusTracker.add(n.element, t), t++;
		}), this.advancedView !== null && (e._focusables.has(this.advancedView) && e._focusables.remove(this.advancedView), e.focusTracker.remove(this.advancedView), e._focusables.add(this.advancedView, t), e.focusTracker.add(this.advancedView.element, t)));
	}
	_modifyFormViewTemplate() {
		this._linkUI.formView || this._linkUI._createViews();
		let { formView: e } = this._linkUI;
		e.template.attributes.class.push("ck-link-form_layout-vertical", "ck-vertical-form"), this.linkOptions && this.linkOptions.length && this._linkOptionsDropdown(), this.advancedLinkFields && this.advancedLinkFields.length && this._advancedLinkFields();
	}
	_urlInputValue() {
		return this._linkUI.formView.urlInputView.fieldView.element.value;
	}
	_urlInputRefMatch(e) {
		return this._urlInputValue().match(e);
	}
	_linkOptionsDropdown() {
		let { formView: e } = this._linkUI, { urlInputView: t } = e, { fieldView: r } = t;
		this.linkTypeDropdownView = E(e.locale), this.linkTypeDropdownView.buttonView.set({
			label: "",
			withText: !0,
			isVisible: !0
		}), this.linkTypeDropdownItemModels = Object.fromEntries(this._getLinkListItemDefinitions().map((e) => [e.handle, e])), T(this.linkTypeDropdownView, new n([...this._getLinkListItemDefinitions().map((e) => ({
			type: "button",
			model: this.linkTypeDropdownItemModels[e.handle]
		}))])), r.isEmpty && this._showLinkTypeForm("default"), this.linkTypeDropdownView.on("execute", (t) => {
			if (t.source.linkOption) {
				let n = t.source.linkOption;
				this._selectLinkTypeDropdownItem(n.refHandle), this._showLinkTypeForm(n, e);
			} else this._selectLinkTypeDropdownItem("default"), this._showLinkTypeForm("default");
		}), this.listenTo(r, "change:value", () => {
			this._toggleLinkTypeDropdownView();
			let e = this._getLinkElementRefHandle();
			e ? this._showLinkTypeForm(this.linkTypeDropdownItemModels[e].linkOption) : this._urlInputValue().length == 0 ? (this._selectLinkTypeDropdownItem(this.linkOptions[0].refHandle), this._showLinkTypeForm(this.linkOptions[0])) : this._showLinkTypeForm("default");
		}), this.listenTo(r, "input", () => {
			this._toggleLinkTypeDropdownView();
		});
	}
	_getLinkElementRefHandle() {
		let e = null, t = this._urlInputValue().match(this.elementTypeRefHandleRE);
		return t && (e = t[2], e && this.linkTypeDropdownItemModels[e] === void 0 && (e = null)), e;
	}
	_getLinkElementId() {
		let e = null, t = this._urlInputRefMatch(this.urlWithRefHandleRE);
		return t && (e = t[4] ? parseInt(t[4], 10) : null), e;
	}
	_getLinkSiteId() {
		let e = null, t = this._urlInputRefMatch(this.urlWithRefHandleRE);
		return t && (e = t[5] ? parseInt(t[5], 10) : null), e;
	}
	_toggleLinkTypeDropdownView() {
		let e = this._getLinkElementRefHandle();
		e ? (this.linkTypeDropdownView.buttonView.set("isVisible", !0), this._selectLinkTypeDropdownItem(e)) : this._selectLinkTypeDropdownItem("default");
	}
	_selectLinkTypeDropdownItem(e) {
		let t = this.linkTypeDropdownItemModels[e], n = e ? Craft.t("app", "{name}", { name: t.label }) : t.label;
		this.linkTypeDropdownView.buttonView.set("label", n), Object.values(this.linkTypeDropdownItemModels).forEach((e) => {
			e.set("isOn", e.handle === t.handle);
		});
	}
	_getLinkListItemDefinitions() {
		let e = [];
		for (let t of this.linkOptions) e.push(new S({
			label: t.label,
			handle: t.refHandle,
			linkOption: t,
			withText: !0
		}));
		return e.push(new S({
			label: Craft.t("app", "URL"),
			handle: "default",
			withText: !0
		})), e;
	}
	_showLinkTypeForm(e) {
		let { formView: t } = this._linkUI, { children: n } = t, { urlInputView: r } = t, { displayedTextInputView: i } = t;
		i.focus(), this.linkTypeWrapperView !== null && n.remove(this.linkTypeWrapperView), e === "default" ? (this.elementInputView = r, this.sitesView !== null && this.sitesView?.siteDropdownView?.buttonView && this.sitesView.siteDropdownView.buttonView.set("isVisible", !1)) : (this.elementInputView = new ke(t.locale, {
			linkUi: this,
			linkOption: e,
			value: this._urlInputValue()
		}), this.sitesView !== null && this.sitesView?.siteDropdownView?.buttonView && this.sitesView.siteDropdownView.buttonView.set("isVisible", !1));
		let a = [this.linkTypeDropdownView, this.elementInputView];
		if (Craft.isMultiSite && this.sitesView == null && (this.sitesView = new Ae(t.locale, {
			linkUi: this,
			linkOption: e
		})), this.sitesView != null) {
			let e = new x();
			e.setTemplate({
				tag: "span",
				attributes: { class: ["break"] }
			}), a.push(e, this.sitesView);
		}
		this.linkTypeWrapperView = new x(), this.linkTypeWrapperView.setTemplate({
			tag: "div",
			children: a,
			attributes: { class: [
				"ck",
				"ck-form__row",
				"ck-form__row_large-top-padding",
				"link-type-group",
				"flex"
			] }
		}), n.add(this.linkTypeWrapperView, 2);
	}
	_showElementSelectorModal(e, t) {
		let n = this.editor, r = n.model, i = r.document.selection, a = i.isCollapsed, o = i.getFirstRange(), s = this._linkUI._getSelectedLinkElement(), c = () => {
			n.editing.view.focus(), !a && o && r.change((e) => {
				e.setSelection(o);
			}), this._linkUI._hideFakeVisualSelection();
		};
		s || this._linkUI._showFakeVisualSelection(), Craft.createElementSelectorModal(e.elementType, {
			storageKey: `ckeditor:${this.pluginName}:${e.elementType}`,
			sources: e.sources,
			criteria: e.criteria,
			defaultSiteId: n.config.get("elementSiteId"),
			autoFocusSearchBox: !1,
			onSelect: (l) => {
				if (l.length) {
					let c = l[0], u = this.urlSuffixInputView?.fieldView.element.value.trim() ?? "", d = `${c.url}${u}#${e.refHandle}:${c.id}@${c.siteId}`;
					if (n.editing.view.focus(), (!a || s) && o) {
						r.change((e) => {
							e.setSelection(o);
						});
						let e = n.commands.get("link"), t = this._getAdvancedFieldValues();
						e.execute(d, {}, void 0, t);
					} else r.change((e) => {
						let n = this._getAdvancedFieldValues(), r = { linkHref: d };
						this.conversionData.forEach((e) => {
							let t = De(e, n[e.model]);
							t !== void 0 && (r[e.model] = t);
						});
						let a = t || c.label;
						if (e.insertText(a, r, i.getFirstPosition()), o instanceof _) try {
							let t = o.clone();
							t.end.path[1] += a.length, e.setSelection(t);
						} catch {}
					});
					setTimeout(() => {
						this._linkUI._showUI(!0);
					}, 100);
				} else c();
			},
			onCancel: () => {
				c();
			},
			closeOtherModals: !1
		});
	}
	_advancedLinkFields() {
		this._addAdvancedLinkFieldInputs(), this._handleAdvancedLinkFieldsFormSubmit(), this._trackAdvancedLinkFieldsValueChange();
	}
	_addAdvancedLinkFieldInputs() {
		let e = this.editor.commands.get("link"), { formView: t } = this._linkUI, { children: n } = t;
		this.advancedView = new je(t.locale, { linkUi: this }), n.add(this.advancedView, 3);
		for (let n of this.advancedLinkFields) {
			let r = n.conversion?.model;
			if (r && t[r] === void 0) {
				if (n.conversion.type === "bool") {
					let i = new b();
					i.set({
						withText: !0,
						label: n.label,
						isToggleable: !0
					}), n.tooltip && (i.tooltip = n.tooltip), this.advancedView.advancedChildren.add(i), t[r] = i, t[r].bind("isOn").to(e, r, (e) => e === void 0 ? (t[r].element.value = "", !1) : (t[r].element.value = n.conversion.value, !0)), i.on("execute", () => {
						i.isOn ? (i.isOn = !1, t[r].element.value = "") : (i.isOn = !0, t[r].element.value = n.conversion.value);
					});
				} else t[r] = this._addLabeledField(n), t[r].fieldView.bind("value").to(e, r), t[r].fieldView.element.value = e[r] || "";
			} else if (n.value === "urlSuffix") {
				this.urlSuffixInputView = this._addLabeledField(n), this.listenTo(this.urlSuffixInputView.fieldView, "change:isFocused", (e, t, n, r) => {
					if (n !== r && !n) {
						if (this._urlInputValue().trim() === "") return;
						this._applyUrlSuffix(e.source.element.value);
					}
				}), this.listenTo(t.urlInputView.fieldView, "change:value", (e) => {
					this._toggleUrlSuffixInputView(this.urlSuffixInputView, e.source.isEmpty);
				});
				let e = !1;
				this.listenTo(t.urlInputView.fieldView, "change:isFocused", (t, n, r) => {
					let i = this._urlInputValue().trim() === "";
					if (r && (e = i), i) return;
					let a = this.urlSuffixInputView?.fieldView.element.value.trim();
					!r && e && a !== "" && this._getUrlSuffix() === "" ? this._applyUrlSuffix(a) : this._toggleUrlSuffixInputView(this.urlSuffixInputView, t.source.isEmpty);
				});
			}
		}
	}
	_addLabeledField(e) {
		let { formView: t } = this._linkUI, n = new h(t.locale, D);
		return n.label = e.label, e.tooltip && (n.infoText = e.tooltip), this.advancedView.advancedChildren.add(n), n;
	}
	_toggleUrlSuffixInputView(e, t) {
		e.fieldView.set("value", t ? "" : this._getUrlSuffix());
	}
	_getUrlWithoutRefTag() {
		let e = this._urlInputRefMatch(this.urlWithRefHandleRE);
		return e ? e[1] : this._urlInputValue();
	}
	_getUrlSuffix() {
		let e = this._getUrlWithoutRefTag();
		try {
			let t = new URL(e);
			return t.search + t.hash;
		} catch {
			let [t, n] = e.split("#"), [r, i] = t.split("?");
			return n = n ? "#" + n : "", i = i ? "?" + i : "", i + n;
		}
	}
	_applyUrlSuffix(e) {
		let { formView: t } = this._linkUI, n = this._getUrlWithoutRefTag(), r;
		try {
			let e = new URL(n);
			r = n.replace(e.hash, "").replace(e.search, "");
		} catch {
			let [e, t] = n.split("#"), [r, i] = e.split("?");
		}
		let i = this._urlInputValue().replace(n, r + e);
		t.urlInputView.fieldView.set("value", i);
	}
	_handleAdvancedLinkFieldsFormSubmit() {
		let e = this.editor.commands.get("link"), { formView: t } = this._linkUI;
		t.on("submit", () => {
			if (!t.isValid()) return;
			let n = this._getAdvancedFieldValues();
			e.once("execute", (e, t) => {
				t[3] = t[3] ? Object.assign(t[3], n) : n;
			}, { priority: "highest" });
		}, { priority: "high" });
	}
	_trackAdvancedLinkFieldsValueChange() {
		let e = this.editor, t = e.commands.get("link"), n = e.model.document.selection;
		this.conversionData.forEach((r) => {
			t.set(r.model, null), e.model.document.on("change", () => {
				t[r.model] = n.getAttribute(r.model);
			});
		});
	}
	_getAdvancedFieldValues() {
		let { formView: e } = this._linkUI, t = {};
		return this.conversionData.forEach((n) => {
			let r = [];
			n.type === "bool" ? r[n.model] = e[n.model].element.value : r[n.model] = e[n.model].fieldView.element.value, Object.assign(t, r);
		}), t;
	}
}, Ne = class extends v {
	static get requires() {
		return [Oe, Me];
	}
	static get pluginName() {
		return "CraftLink";
	}
}, Pe = /* @__PURE__ */ oe((/* @__PURE__ */ ie(((e, t, n) => {
	(function() {
		((e, t = {}) => {
			if (typeof document > "u") return;
			let n = document.createElement("style");
			t.styleId && (n.id = t.styleId);
			for (let e of Object.keys(t.attributes || {})) n.setAttribute(e, t.attributes[e]);
			n.setAttribute("data-cke-inspector", "true"), n.appendChild(document.createTextNode(e)), document.head.appendChild(n);
		})(".ck-inspector{--ck-inspector-color-tab-background-hover:#00000012;--ck-inspector-color-tab-active-border:#0dacef}.ck-inspector .ck-inspector-horizontal-nav{-webkit-user-select:none;user-select:none;flex-direction:row;align-self:stretch;display:flex}.ck-inspector .ck-inspector-horizontal-nav .ck-inspector-horizontal-nav__item{-webkit-appearance:none;background:0 0;border:0;border-bottom:2px solid #0000;align-self:stretch;padding:.5em 1em}.ck-inspector .ck-inspector-horizontal-nav .ck-inspector-horizontal-nav__item:hover{background:var(--ck-inspector-color-tab-background-hover)}.ck-inspector .ck-inspector-horizontal-nav .ck-inspector-horizontal-nav__item.ck-inspector-horizontal-nav__item_active{border-bottom-color:var(--ck-inspector-color-tab-active-border)}.ck-inspector{--ck-inspector-navbox-empty-background:#fafafa}.ck-inspector .ck-inspector-navbox{flex-direction:column;align-items:stretch;height:100%;display:flex}.ck-inspector .ck-inspector-navbox .ck-inspector-navbox__navigation{border-bottom:1px solid var(--ck-inspector-color-border);-webkit-user-select:none;user-select:none;flex-flow:row;align-items:center;width:100%;min-height:30px;max-height:30px;display:flex}.ck-inspector .ck-inspector-navbox .ck-inspector-navbox__content{flex-direction:row;height:100%;display:flex;overflow:hidden}.ck-inspector{--ck-inspector-icon-size:19px;--ck-inspector-button-size:calc(4px + var(--ck-inspector-icon-size));--ck-inspector-color-button:#777;--ck-inspector-color-button-hover:#222;--ck-inspector-color-button-on:#0f79e2}.ck-inspector .ck-inspector-button{width:var(--ck-inspector-button-size);height:var(--ck-inspector-button-size);color:var(--ck-inspector-color-button);border:0;border-radius:2px;padding:2px;overflow:hidden}.ck-inspector .ck-inspector-button.ck-inspector-button_on,.ck-inspector .ck-inspector-button.ck-inspector-button_on:hover{color:var(--ck-inspector-color-button-on);opacity:1}.ck-inspector .ck-inspector-button.ck-inspector-button_disabled{opacity:.3}.ck-inspector .ck-inspector-button>span{display:none}.ck-inspector .ck-inspector-button:hover{color:var(--ck-inspector-color-button-hover)}.ck-inspector .ck-inspector-button svg{width:var(--ck-inspector-icon-size);height:var(--ck-inspector-icon-size)}.ck-inspector .ck-inspector-button svg,.ck-inspector .ck-inspector-button svg *{fill:currentColor}.ck-inspector{--ck-inspector-explorer-width:300px}.ck-inspector .ck-inspector-pane{width:100%;display:flex}.ck-inspector .ck-inspector-pane.ck-inspector-pane_empty{background:var(--ck-inspector-navbox-empty-background);justify-content:center;align-items:center;padding:1em}.ck-inspector .ck-inspector-pane.ck-inspector-pane_empty p{text-align:center;align-self:center;width:100%}.ck-inspector .ck-inspector-pane>.ck-inspector-navbox:last-child{min-width:var(--ck-inspector-explorer-width);width:var(--ck-inspector-explorer-width)}.ck-inspector .ck-inspector-pane.ck-inspector-pane_vsplit>.ck-inspector-navbox:first-child{border-right:1px solid var(--ck-inspector-color-border);flex:auto;overflow:hidden}.ck-inspector .ck-inspector-pane.ck-inspector-pane_vsplit>.ck-inspector-navbox:first-child .ck-inspector-navbox__navigation{align-items:center}.ck-inspector .ck-inspector-pane.ck-inspector-pane_vsplit>.ck-inspector-navbox:first-child .ck-inspector-tree__config label{margin:0 .5em}.ck-inspector .ck-inspector-pane.ck-inspector-pane_vsplit>.ck-inspector-navbox:first-child .ck-inspector-tree__config input+label{margin-right:1em}.ck-inspector-side-pane{position:relative}.ck-inspector{--ck-inspector-color-tree-node-hover:#eaf2fb;--ck-inspector-color-tree-node-name:#882680;--ck-inspector-color-tree-node-attribute-name:#8a8a8a;--ck-inspector-color-tree-node-tag:#aaa;--ck-inspector-color-tree-node-attribute:#9a4819;--ck-inspector-color-tree-node-attribute-value:#2a43ac;--ck-inspector-color-tree-text-border:#b7b7b7;--ck-inspector-color-tree-node-border-hover:#b0c6e0;--ck-inspector-color-tree-content-delimiter:#ddd;--ck-inspector-color-tree-node-active-bg:#f5faff;--ck-inspector-color-tree-node-name-active-bg:#2b98f0;--ck-inspector-color-tree-node-inactive:#8a8a8a;--ck-inspector-color-tree-selection:#ff1744;--ck-inspector-color-tree-position:black;--ck-inspector-color-comment:green}.ck-inspector .ck-inspector-tree{background:var(--ck-inspector-color-white);-webkit-user-select:none;user-select:none;width:100%;height:100%;padding:1em;overflow:auto}.ck-inspector-tree .ck-inspector-tree-node__attribute{font:inherit;color:var(--ck-inspector-color-tree-node-tag);margin-left:.4em}.ck-inspector-tree .ck-inspector-tree-node__attribute .ck-inspector-tree-node__attribute__name{color:var(--ck-inspector-color-tree-node-attribute)}.ck-inspector-tree .ck-inspector-tree-node__attribute .ck-inspector-tree-node__attribute__value{color:var(--ck-inspector-color-tree-node-attribute-value)}.ck-inspector-tree .ck-inspector-tree-node__attribute .ck-inspector-tree-node__attribute__value:before{content:\"=\\\"\"}.ck-inspector-tree .ck-inspector-tree-node__attribute .ck-inspector-tree-node__attribute__value:after{content:\"\\\"\"}.ck-inspector-tree .ck-inspector-tree-node .ck-inspector-tree-node__name{color:var(--ck-inspector-color-tree-node-name);border-left:1px solid #0000;width:100%;padding:0 .1em;display:inline-block}.ck-inspector-tree .ck-inspector-tree-node .ck-inspector-tree-node__name:hover{background:var(--ck-inspector-color-tree-node-hover)}.ck-inspector-tree .ck-inspector-tree-node .ck-inspector-tree-node__content{border-left:1px solid var(--ck-inspector-color-tree-content-delimiter);white-space:pre-wrap;padding:1px .5em 1px 1.5em}.ck-inspector-tree .ck-inspector-tree-node:not(.ck-inspector-tree-node_tagless) .ck-inspector-tree-node__name>.ck-inspector-tree-node__name__bracket_open:after{content:\"<\";color:var(--ck-inspector-color-tree-node-tag)}.ck-inspector-tree .ck-inspector-tree-node:not(.ck-inspector-tree-node_tagless) .ck-inspector-tree-node__name .ck-inspector-tree-node__name__bracket_close:after{content:\">\";color:var(--ck-inspector-color-tree-node-tag)}.ck-inspector-tree .ck-inspector-tree-node:not(.ck-inspector-tree-node_tagless).ck-inspector-tree-node_empty .ck-inspector-tree-node__name:after{content:\" />\"}.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_tagless .ck-inspector-tree-node__content{display:none}.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_active>.ck-inspector-tree-node__name:not(.ck-inspector-tree-node__name_close),.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_active>.ck-inspector-tree-node__name:not(.ck-inspector-tree-node__name_close) :not(.ck-inspector-tree__position),.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_active>.ck-inspector-tree-node__name:not(.ck-inspector-tree-node__name_close)>.ck-inspector-tree-node__name__bracket:after{background:var(--ck-inspector-color-tree-node-name-active-bg);color:var(--ck-inspector-color-white)}.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_active>.ck-inspector-tree-node__content,.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_active>.ck-inspector-tree-node__name_close{background:var(--ck-inspector-color-tree-node-active-bg)}.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_active>.ck-inspector-tree-node__content{border-left-color:var(--ck-inspector-color-tree-node-name-active-bg)}.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_active>.ck-inspector-tree-node__name{border-left:1px solid var(--ck-inspector-color-tree-node-name-active-bg)}.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_disabled{opacity:.8}.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_disabled .ck-inspector-tree-node__name,.ck-inspector-tree .ck-inspector-tree-node.ck-inspector-tree-node_disabled .ck-inspector-tree-node__name *{color:var(--ck-inspector-color-tree-node-inactive)}.ck-inspector-tree .ck-inspector-tree-text{margin-bottom:1px;display:block}.ck-inspector-tree .ck-inspector-tree-text .ck-inspector-tree-node__content{border:1px dotted var(--ck-inspector-color-tree-text-border);word-break:break-all;border-radius:2px;margin-right:1px;padding:0 1px;display:inline-block}.ck-inspector-tree .ck-inspector-tree-text .ck-inspector-tree-text__attributes:not(:empty){margin-right:.5em}.ck-inspector-tree .ck-inspector-tree-text .ck-inspector-tree-text__attributes .ck-inspector-tree-node__attribute{background:var(--ck-inspector-color-tree-node-attribute-name);border-radius:2px;padding:0 .5em}.ck-inspector-tree .ck-inspector-tree-text .ck-inspector-tree-text__attributes .ck-inspector-tree-node__attribute+.ck-inspector-tree-node__attribute{margin-left:.2em}.ck-inspector-tree .ck-inspector-tree-text .ck-inspector-tree-text__attributes .ck-inspector-tree-node__attribute>*{color:var(--ck-inspector-color-white)}.ck-inspector-tree .ck-inspector-tree-text .ck-inspector-tree-text__attributes .ck-inspector-tree-node__attribute:first-child{margin-left:0}.ck-inspector-tree .ck-inspector-tree-text.ck-inspector-tree-node_active .ck-inspector-tree-node__content{border-style:solid;border-color:var(--ck-inspector-color-tree-node-name-active-bg)}.ck-inspector-tree .ck-inspector-tree-text.ck-inspector-tree-node_active .ck-inspector-tree-node__attribute{background:var(--ck-inspector-color-white)}.ck-inspector-tree .ck-inspector-tree-text.ck-inspector-tree-node_active .ck-inspector-tree-node__attribute>*{color:var(--ck-inspector-color-tree-node-name-active-bg)}.ck-inspector-tree .ck-inspector-tree-text.ck-inspector-tree-node_active>.ck-inspector-tree-node__content{background:var(--ck-inspector-color-tree-node-name-active-bg);color:var(--ck-inspector-color-white)}.ck-inspector-tree .ck-inspector-tree-text:not(.ck-inspector-tree-node_active) .ck-inspector-tree-node__content:hover{background:var(--ck-inspector-color-tree-node-hover);border-style:solid;border-color:var(--ck-inspector-color-tree-node-border-hover)}.ck-inspector-tree.ck-inspector-tree_text-direction_ltr .ck-inspector-tree-node__content{direction:ltr}.ck-inspector-tree.ck-inspector-tree_text-direction_rtl .ck-inspector-tree-node__content{direction:rtl}.ck-inspector-tree.ck-inspector-tree_text-direction_rtl .ck-inspector-tree-node__content .ck-inspector-tree-node__name{direction:ltr}.ck-inspector-tree.ck-inspector-tree_text-direction_rtl .ck-inspector-tree__position{transform:rotate(180deg)}.ck-inspector-tree .ck-inspector-tree-comment{color:var(--ck-inspector-color-comment);font-style:italic}.ck-inspector-tree .ck-inspector-tree-comment a{color:inherit;text-decoration:underline}.ck-inspector-tree_compact-text .ck-inspector-tree-text,.ck-inspector-tree_compact-text .ck-inspector-tree-text .ck-inspector-tree-node__content{display:inline}.ck-inspector .ck-inspector__tree__navigation{border-bottom:1px solid var(--ck-inspector-color-border);padding:.5em 1em}.ck-inspector .ck-inspector__tree__navigation label{margin-right:.5em}.ck-inspector-tree .ck-inspector-tree__position{cursor:default;pointer-events:none;vertical-align:top;height:100%;display:inline-block;position:relative}.ck-inspector-tree .ck-inspector-tree__position:after{content:\"\";border:1px solid var(--ck-inspector-color-tree-position);width:0;margin-left:-1px;position:absolute;top:0;bottom:0}.ck-inspector-tree .ck-inspector-tree__position:before{margin-left:-1px}.ck-inspector-tree .ck-inspector-tree__position.ck-inspector-tree__position_selection{z-index:2;--ck-inspector-color-tree-position:var(--ck-inspector-color-tree-selection)}.ck-inspector-tree .ck-inspector-tree__position.ck-inspector-tree__position_selection:before{content:\"\";border-top:2px solid var(--ck-inspector-color-tree-position);border-bottom:2px solid var(--ck-inspector-color-tree-position);width:8px;position:absolute;top:-1px;bottom:-1px;left:0}.ck-inspector-tree .ck-inspector-tree__position.ck-inspector-tree__position_selection.ck-inspector-tree__position_end:before{left:auto;right:-1px}.ck-inspector-tree .ck-inspector-tree__position.ck-inspector-tree__position_marker{z-index:1}.ck-inspector-tree .ck-inspector-tree__position.ck-inspector-tree__position_marker:before{content:\"\";cursor:default;border-style:solid;border-width:7px 7px 0 0;border-color:var(--ck-inspector-color-tree-position) transparent transparent transparent;width:0;height:0;display:block;position:absolute;top:-1px;left:0}.ck-inspector-tree .ck-inspector-tree__position.ck-inspector-tree__position_marker.ck-inspector-tree__position_end:before{border-width:0 7px 7px 0;border-color:transparent var(--ck-inspector-color-tree-position) transparent transparent;left:-5px}.ck-inspector .ck-inspector-checkbox{vertical-align:middle}.ck-inspector{--ck-inspector-color-property-list-property-name:#d0363f;--ck-inspector-color-property-list-property-value-true:green;--ck-inspector-color-property-list-property-value-false:red;--ck-inspector-color-property-list-property-value-unknown:#888;--ck-inspector-color-property-list-background:#f5f5f5;--ck-inspector-color-property-list-title-collapser:#727272}.ck-inspector .ck-inspector-property-list{background:var(--ck-inspector-color-white);grid-template-columns:auto 1fr;display:grid}.ck-inspector .ck-inspector-property-list>:nth-of-type(odd){background:var(--ck-inspector-color-property-list-background)}.ck-inspector .ck-inspector-property-list>:nth-of-type(2n){background:var(--ck-inspector-color-white)}.ck-inspector .ck-inspector-property-list dt{min-width:15em;padding:0 .7em 0 1.2em}.ck-inspector .ck-inspector-property-list dt.ck-inspector-property-list__title_collapsible button{vertical-align:middle;border-style:solid;border-width:3.5px 0 3.5px 6px;border-color:transparent transparent transparent var(--ck-inspector-color-property-list-title-collapser);width:0;height:0;margin-left:-9px;margin-right:.3em;transition:transform .2s ease-in-out;display:inline-block;overflow:hidden;transform:rotate(0)}.ck-inspector .ck-inspector-property-list dt.ck-inspector-property-list__title_expanded button{transform:rotate(90deg)}.ck-inspector .ck-inspector-property-list dt.ck-inspector-property-list__title_collapsed+dd+.ck-inspector-property-list{display:none}.ck-inspector .ck-inspector-property-list dt .ck-inspector-property-list__title__color-box{vertical-align:text-top;border:1px solid #000;border-radius:2px;width:12px;height:12px;margin-right:3px;display:inline-block}.ck-inspector .ck-inspector-property-list dt.ck-inspector-property-list__title_clickable label:hover{cursor:pointer;text-decoration:underline}.ck-inspector .ck-inspector-property-list dt label{color:var(--ck-inspector-color-property-list-property-name)}.ck-inspector .ck-inspector-property-list dd{padding-right:.7em}.ck-inspector .ck-inspector-property-list dd input{width:100%}.ck-inspector .ck-inspector-property-list dd input[value=false]{color:var(--ck-inspector-color-property-list-property-value-false)}.ck-inspector .ck-inspector-property-list dd input[value=true]{color:var(--ck-inspector-color-property-list-property-value-true)}.ck-inspector .ck-inspector-property-list dd input[value=undefined],.ck-inspector .ck-inspector-property-list dd input[value=\"function() {…}\"]{color:var(--ck-inspector-color-property-list-property-value-unknown)}.ck-inspector .ck-inspector-property-list dd input[value=\"function() {…}\"]{font-style:italic}.ck-inspector .ck-inspector-property-list .ck-inspector-property-list{background:0 0;grid-column:1/-1;margin-left:1em}.ck-inspector .ck-inspector-property-list .ck-inspector-property-list>:nth-of-type(odd),.ck-inspector .ck-inspector-property-list .ck-inspector-property-list>:nth-of-type(2n){background:0 0}.ck-inspector .ck-inspector__object-inspector{background:var(--ck-inspector-color-white);width:100%;overflow:auto}.ck-inspector .ck-inspector__object-inspector h2,.ck-inspector .ck-inspector__object-inspector h3{flex-flow:row;display:flex}.ck-inspector .ck-inspector__object-inspector h2{text-overflow:ellipsis;align-items:center;padding:1em;display:flex;overflow:hidden}.ck-inspector .ck-inspector__object-inspector h2>span{white-space:nowrap;text-overflow:ellipsis;margin-right:auto;display:block;overflow:hidden}.ck-inspector .ck-inspector__object-inspector h2>.ck-inspector-button{flex-shrink:0;margin-left:.5em}.ck-inspector .ck-inspector__object-inspector h2 a{color:var(--ck-inspector-color-tree-node-name);font-weight:700}.ck-inspector .ck-inspector__object-inspector h2 a,.ck-inspector .ck-inspector__object-inspector h2 a>*{cursor:pointer}.ck-inspector .ck-inspector__object-inspector h2 em:before,.ck-inspector .ck-inspector__object-inspector h2 em:after{content:\"\\\"\"}.ck-inspector .ck-inspector__object-inspector h3{align-items:center;padding:.4em .7em;font-size:12px;display:flex}.ck-inspector .ck-inspector__object-inspector h3 a{color:inherit;margin-right:auto;font-weight:700}.ck-inspector .ck-inspector__object-inspector h3 .ck-inspector-button{visibility:hidden}.ck-inspector .ck-inspector__object-inspector h3:hover .ck-inspector-button{visibility:visible}.ck-inspector .ck-inspector__object-inspector hr{border-top:1px solid var(--ck-inspector-color-border)}.ck-inspector-model-tree__hide-markers .ck-inspector-tree__position.ck-inspector-tree__position_marker{display:none}.ck-inspector-modal{--ck-inspector-set-data-modal-overlay:#00000080;--ck-inspector-set-data-modal-shadow:#0000000f;--ck-inspector-set-data-modal-button-background:#eee;--ck-inspector-set-data-modal-button-background-hover:#ddd;--ck-inspector-set-data-modal-save-button-background:#1976d2;--ck-inspector-set-data-modal-save-button-background-hover:#0b60b5}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal{z-index:999999;background-color:var(--ck-inspector-set-data-modal-overlay);position:fixed;inset:0}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content{border:1px solid var(--ck-inspector-color-border);background:var(--ck-inspector-color-white);box-shadow:0 1px 1px var(--ck-inspector-set-data-modal-shadow), 0 2px 2px var(--ck-inspector-set-data-modal-shadow), 0 4px 4px var(--ck-inspector-set-data-modal-shadow), 0 8px 8px var(--ck-inspector-set-data-modal-shadow), 0 16px 16px var(--ck-inspector-set-data-modal-shadow);border-radius:2px;outline:none;flex-direction:column;justify-content:space-between;width:100%;max-width:calc(100vw - 160px);height:100%;max-height:calc(100vh - 160px);display:flex;position:absolute;top:50%;left:50%;overflow:auto;transform:translate(-50%,-50%)}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content h2{background:var(--ck-inspector-color-background);border-bottom:1px solid var(--ck-inspector-color-border);margin:0;padding:12px 20px;font-size:14px;font-weight:700}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content textarea{border:1px solid var(--ck-inspector-color-border);resize:none;border-radius:2px;flex-grow:1;margin:20px;padding:10px;font-family:monospace;font-size:14px}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content button{white-space:nowrap;border:1px solid var(--ck-inspector-color-border);border-radius:2px;padding:10px 20px;font-size:14px}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content button:hover{background:var(--ck-inspector-set-data-modal-button-background-hover)}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content .ck-inspector-quick-actions__set-data-modal__buttons{justify-content:center;margin:0 20px 20px;display:flex}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content .ck-inspector-quick-actions__set-data-modal__buttons button+button{margin-left:20px}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content .ck-inspector-quick-actions__set-data-modal__buttons button:first-child{margin-right:auto}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content .ck-inspector-quick-actions__set-data-modal__buttons button:not(:first-child){flex-basis:20%}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content .ck-inspector-quick-actions__set-data-modal__buttons button:last-child{background:var(--ck-inspector-set-data-modal-save-button-background);border-color:var(--ck-inspector-set-data-modal-save-button-background);color:#fff;font-weight:700}.ck-inspector-modal.ck-inspector-quick-actions__set-data-modal .ck-inspector-quick-actions__set-data-modal__content .ck-inspector-quick-actions__set-data-modal__buttons button:last-child:hover{background:var(--ck-inspector-set-data-modal-save-button-background-hover)}.ck-inspector .ck-inspector-editor-quick-actions{flex-flow:row;place-content:center;align-items:center;display:flex}.ck-inspector .ck-inspector-editor-quick-actions>.ck-inspector-button{margin-left:.3em}.ck-inspector .ck-inspector-editor-quick-actions>.ck-inspector-button.ck-inspector-button_data-copied{color:green;animation-name:ck-inspector-bounce-in;animation-duration:.5s}@keyframes ck-inspector-bounce-in{0%{opacity:0;transform:scale3d(.5,.5,.5)}20%{transform:scale3d(1.1,1.1,1.1)}40%{transform:scale3d(.8,.8,.8)}60%{opacity:1;transform:scale3d(1.05,1.05,1.05)}to{opacity:1;transform:scale(1)}}.ck-inspector,.ck-inspector-portal{--ck-inspector-color-white:#fff;--ck-inspector-color-black:#000;--ck-inspector-color-background:#f3f3f3;--ck-inspector-color-link:#005cc6;--ck-inspector-code-font-size:11px;--ck-inspector-code-font-family:monaco,Consolas,Lucida Console,monospace;--ck-inspector-color-border:#d0d0d0}.ck-inspector,.ck-inspector :not(select),.ck-inspector-portal,.ck-inspector-portal :not(select){box-sizing:border-box;word-wrap:break-word;-webkit-font-smoothing:auto;background:0 0;border:0;width:auto;height:auto;margin:0;padding:0;font-family:Arial,Helvetica Neue,Helvetica,sans-serif;font-size:12px;font-weight:400;line-height:17px;text-decoration:none;transition:none;position:static}.ck-inspector{border-collapse:collapse;color:var(--ck-inspector-color-black);text-align:left;white-space:normal;cursor:auto;float:none;background:var(--ck-inspector-color-background);border-top:1px solid var(--ck-inspector-color-border);z-index:9999;overflow:hidden}.ck-inspector.ck-inspector_collapsed>.ck-inspector-navbox>.ck-inspector-navbox__navigation .ck-inspector-horizontal-nav{display:none}.ck-inspector .ck-inspector-navbox__navigation__logo{text-indent:100px;white-space:nowrap;background-image:url(\"data:image/svg+xml;charset=UTF-8,%3csvg width='68' height='64' xmlns='http://www.w3.org/2000/svg'%3e%3cg fill='none' fill-rule='evenodd'%3e%3cpath d='M43.71 11.025a11.508 11.508 0 0 0-1.213 5.159c0 6.42 5.244 11.625 11.713 11.625.083 0 .167 0 .25-.002v16.282c0 1.955-1.05 3.761-2.756 4.739L30.986 60.7a5.548 5.548 0 0 1-5.512 0L4.756 48.828A5.464 5.464 0 0 1 2 44.089V20.344c0-1.955 1.05-3.76 2.756-4.738L25.474 3.733a5.548 5.548 0 0 1 5.512 0l12.724 7.292z' fill='%23FFF'/%3e%3cpath d='M45.684 8.79a12.604 12.604 0 0 0-1.329 5.65c0 7.032 5.744 12.733 12.829 12.733.091 0 .183-.001.274-.003v17.834c0 2.14-1.151 4.119-3.019 5.19L31.747 63.196a6.076 6.076 0 0 1-6.037 0L3.02 50.193A5.984 5.984 0 0 1 0 45.003V18.997c0-2.14 1.15-4.119 3.019-5.19L25.71.804a6.076 6.076 0 0 1 6.037 0l13.937 7.986zM16.244 20.68c-.834 0-1.51.671-1.51 1.498v.715c0 .828.676 1.498 1.51 1.498h25.489c.833 0 1.51-.67 1.51-1.498v-.715c0-.827-.677-1.498-1.51-1.498h-25.49zm0 9.227c-.834 0-1.51.671-1.51 1.498v.715c0 .828.676 1.498 1.51 1.498h18.479c.833 0 1.509-.67 1.509-1.498v-.715c0-.827-.676-1.498-1.51-1.498H16.244zm0 9.227c-.834 0-1.51.671-1.51 1.498v.715c0 .828.676 1.498 1.51 1.498h25.489c.833 0 1.51-.67 1.51-1.498v-.715c0-.827-.677-1.498-1.51-1.498h-25.49zm41.191-14.459c-5.835 0-10.565-4.695-10.565-10.486 0-5.792 4.73-10.487 10.565-10.487C63.27 3.703 68 8.398 68 14.19c0 5.791-4.73 10.486-10.565 10.486zm3.422-8.68c0-.467-.084-.875-.251-1.225a2.547 2.547 0 0 0-.686-.88 2.888 2.888 0 0 0-1.026-.531 4.418 4.418 0 0 0-1.259-.175c-.134 0-.283.006-.447.018a2.72 2.72 0 0 0-.446.07l.075-1.4h3.587v-1.8h-5.462l-.214 5.06c.319-.116.682-.21 1.089-.28.406-.071.77-.107 1.088-.107.218 0 .437.021.655.063.218.041.413.114.585.218s.313.244.422.419c.109.175.163.391.163.65 0 .424-.132.745-.396.961a1.434 1.434 0 0 1-.938.325c-.352 0-.656-.1-.912-.3-.256-.2-.43-.453-.523-.762l-1.925.588c.1.35.258.664.472.943.214.279.47.514.767.706.298.191.63.339.995.443.365.104.749.156 1.151.156.437 0 .86-.064 1.272-.193.41-.13.778-.323 1.1-.581.324-.258.582-.585.775-.981.193-.396.29-.864.29-1.405z' fill='%231EBC61' fill-rule='nonzero'/%3e%3c/g%3e%3c/svg%3e\");background-position:50%;background-repeat:no-repeat;background-size:contain;align-self:center;width:1.8em;height:1.8em;margin-left:1em;margin-right:1em;display:block;overflow:hidden}.ck-inspector .ck-inspector-navbox__navigation__toggle{margin-right:1em}.ck-inspector .ck-inspector-navbox__navigation__toggle.ck-inspector-navbox__navigation__toggle_up{transform:rotate(180deg)}.ck-inspector .ck-inspector-editor-selector{margin-left:auto;margin-right:.3em}@media screen and (width<=680px){.ck-inspector .ck-inspector-editor-selector label{display:none}}.ck-inspector .ck-inspector-editor-selector select{margin-left:.5em}.ck-inspector .ck-inspector-code,.ck-inspector .ck-inspector-code *{font-size:var(--ck-inspector-code-font-size);font-family:var(--ck-inspector-code-font-family);cursor:default}.ck-inspector a{color:var(--ck-inspector-color-link);text-decoration:none}.ck-inspector a:hover{cursor:pointer;text-decoration:underline}.ck-inspector button{outline:0}.ck-inspector .ck-inspector-separator{border-right:1px solid var(--ck-inspector-color-border);vertical-align:middle;width:0;height:20px;margin:0 .5em;display:inline-block}html body.ck-inspector-body-expanded{margin-bottom:var(--ck-inspector-height)}html body.ck-inspector-body-collapsed{margin-bottom:var(--ck-inspector-collapsed-height)}.ck-inspector-wrapper *{box-sizing:border-box}\n/*$vite$:1*/", {});
	})(), (function(n, r) {
		typeof e == "object" && typeof t < "u" ? t.exports = r() : typeof define == "function" && define.amd ? define([], r) : (n = typeof globalThis < "u" ? globalThis : n || self, n.CKEditorInspector = r());
	})(n, function() {
		var e = Object.create, t = Object.defineProperty, n = Object.getOwnPropertyDescriptor, r = Object.getOwnPropertyNames, i = Object.getPrototypeOf, a = Object.prototype.hasOwnProperty, o = (e, t) => () => (e && (t = e(e = 0)), t), s = (e, t) => () => (t || (e((t = { exports: {} }).exports, t), e = null), t.exports), c = (e, n) => {
			let r = {};
			for (var i in e) t(r, i, {
				get: e[i],
				enumerable: !0
			});
			return n || t(r, Symbol.toStringTag, { value: "Module" }), r;
		}, l = (e, i, o, s) => {
			if (i && typeof i == "object" || typeof i == "function") for (var c = r(i), l = 0, u = c.length, d; l < u; l++) d = c[l], !a.call(e, d) && d !== o && t(e, d, {
				get: ((e) => i[e]).bind(null, d),
				enumerable: !(s = n(i, d)) || s.enumerable
			});
			return e;
		}, u = (n, r, a) => (a = n == null ? {} : e(i(n)), l(r || !n || !n.__esModule ? t(a, "default", {
			value: n,
			enumerable: !0
		}) : a, n)), d = (e) => a.call(e, "module.exports") ? e["module.exports"] : l(t({}, "__esModule", { value: !0 }), e), f = s(((e, t) => {
			var n = Object.getOwnPropertySymbols, r = Object.prototype.hasOwnProperty, i = Object.prototype.propertyIsEnumerable;
			function a(e) {
				if (e == null) throw TypeError("Object.assign cannot be called with null or undefined");
				return Object(e);
			}
			function o() {
				try {
					if (!Object.assign) return !1;
					var e = /* @__PURE__ */ new String("abc");
					if (e[5] = "de", Object.getOwnPropertyNames(e)[0] === "5") return !1;
					for (var t = {}, n = 0; n < 10; n++) t["_" + String.fromCharCode(n)] = n;
					if (Object.getOwnPropertyNames(t).map(function(e) {
						return t[e];
					}).join("") !== "0123456789") return !1;
					var r = {};
					return "abcdefghijklmnopqrst".split("").forEach(function(e) {
						r[e] = e;
					}), Object.keys(Object.assign({}, r)).join("") === "abcdefghijklmnopqrst";
				} catch {
					return !1;
				}
			}
			t.exports = o() ? Object.assign : function(e, t) {
				for (var o, s = a(e), c, l = 1; l < arguments.length; l++) {
					for (var u in o = Object(arguments[l]), o) r.call(o, u) && (s[u] = o[u]);
					if (n) {
						c = n(o);
						for (var d = 0; d < c.length; d++) i.call(o, c[d]) && (s[c[d]] = o[c[d]]);
					}
				}
				return s;
			};
		})), p = s(((e) => {
			var t = f(), n = typeof Symbol == "function" && Symbol.for, r = n ? Symbol.for("react.element") : 60103, i = n ? Symbol.for("react.portal") : 60106, a = n ? Symbol.for("react.fragment") : 60107, o = n ? Symbol.for("react.strict_mode") : 60108, s = n ? Symbol.for("react.profiler") : 60114, c = n ? Symbol.for("react.provider") : 60109, l = n ? Symbol.for("react.context") : 60110, u = n ? Symbol.for("react.forward_ref") : 60112, d = n ? Symbol.for("react.suspense") : 60113, p = n ? Symbol.for("react.memo") : 60115, m = n ? Symbol.for("react.lazy") : 60116, h = typeof Symbol == "function" && Symbol.iterator;
			function g(e) {
				for (var t = "https://reactjs.org/docs/error-decoder.html?invariant=" + e, n = 1; n < arguments.length; n++) t += "&args[]=" + encodeURIComponent(arguments[n]);
				return "Minified React error #" + e + "; visit " + t + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
			}
			var _ = {
				isMounted: function() {
					return !1;
				},
				enqueueForceUpdate: function() {},
				enqueueReplaceState: function() {},
				enqueueSetState: function() {}
			}, v = {};
			function y(e, t, n) {
				this.props = e, this.context = t, this.refs = v, this.updater = n || _;
			}
			y.prototype.isReactComponent = {}, y.prototype.setState = function(e, t) {
				if (typeof e != "object" && typeof e != "function" && e != null) throw Error(g(85));
				this.updater.enqueueSetState(this, e, t, "setState");
			}, y.prototype.forceUpdate = function(e) {
				this.updater.enqueueForceUpdate(this, e, "forceUpdate");
			};
			function b() {}
			b.prototype = y.prototype;
			function x(e, t, n) {
				this.props = e, this.context = t, this.refs = v, this.updater = n || _;
			}
			var S = x.prototype = new b();
			S.constructor = x, t(S, y.prototype), S.isPureReactComponent = !0;
			var C = { current: null }, w = Object.prototype.hasOwnProperty, T = {
				key: !0,
				ref: !0,
				__self: !0,
				__source: !0
			};
			function E(e, t, n) {
				var i, a = {}, o = null, s = null;
				if (t != null) for (i in t.ref !== void 0 && (s = t.ref), t.key !== void 0 && (o = "" + t.key), t) w.call(t, i) && !T.hasOwnProperty(i) && (a[i] = t[i]);
				var c = arguments.length - 2;
				if (c === 1) a.children = n;
				else if (1 < c) {
					for (var l = Array(c), u = 0; u < c; u++) l[u] = arguments[u + 2];
					a.children = l;
				}
				if (e && e.defaultProps) for (i in c = e.defaultProps, c) a[i] === void 0 && (a[i] = c[i]);
				return {
					$$typeof: r,
					type: e,
					key: o,
					ref: s,
					props: a,
					_owner: C.current
				};
			}
			function D(e, t) {
				return {
					$$typeof: r,
					type: e.type,
					key: t,
					ref: e.ref,
					props: e.props,
					_owner: e._owner
				};
			}
			function O(e) {
				return typeof e == "object" && !!e && e.$$typeof === r;
			}
			function ee(e) {
				var t = {
					"=": "=0",
					":": "=2"
				};
				return "$" + ("" + e).replace(/[=:]/g, function(e) {
					return t[e];
				});
			}
			var k = /\/+/g, A = [];
			function j(e, t, n, r) {
				if (A.length) {
					var i = A.pop();
					return i.result = e, i.keyPrefix = t, i.func = n, i.context = r, i.count = 0, i;
				}
				return {
					result: e,
					keyPrefix: t,
					func: n,
					context: r,
					count: 0
				};
			}
			function M(e) {
				e.result = null, e.keyPrefix = null, e.func = null, e.context = null, e.count = 0, 10 > A.length && A.push(e);
			}
			function te(e, t, n, a) {
				var o = typeof e;
				(o === "undefined" || o === "boolean") && (e = null);
				var s = !1;
				if (e === null) s = !0;
				else switch (o) {
					case "string":
					case "number":
						s = !0;
						break;
					case "object": switch (e.$$typeof) {
						case r:
						case i: s = !0;
					}
				}
				if (s) return n(a, e, t === "" ? "." + ne(e, 0) : t), 1;
				if (s = 0, t = t === "" ? "." : t + ":", Array.isArray(e)) for (var c = 0; c < e.length; c++) {
					o = e[c];
					var l = t + ne(o, c);
					s += te(o, l, n, a);
				}
				else if (typeof e != "object" || !e ? l = null : (l = h && e[h] || e["@@iterator"], l = typeof l == "function" ? l : null), typeof l == "function") for (e = l.call(e), c = 0; !(o = e.next()).done;) o = o.value, l = t + ne(o, c++), s += te(o, l, n, a);
				else if (o === "object") throw n = "" + e, Error(g(31, n === "[object Object]" ? "object with keys {" + Object.keys(e).join(", ") + "}" : n, ""));
				return s;
			}
			function N(e, t, n) {
				return e == null ? 0 : te(e, "", t, n);
			}
			function ne(e, t) {
				return typeof e == "object" && e && e.key != null ? ee(e.key) : t.toString(36);
			}
			function re(e, t) {
				e.func.call(e.context, t, e.count++);
			}
			function ie(e, t, n) {
				var r = e.result, i = e.keyPrefix;
				e = e.func.call(e.context, t, e.count++), Array.isArray(e) ? ae(e, r, n, function(e) {
					return e;
				}) : e != null && (O(e) && (e = D(e, i + (!e.key || t && t.key === e.key ? "" : ("" + e.key).replace(k, "$&/") + "/") + n)), r.push(e));
			}
			function ae(e, t, n, r, i) {
				var a = "";
				n != null && (a = ("" + n).replace(k, "$&/") + "/"), t = j(t, a, r, i), N(e, ie, t), M(t);
			}
			var oe = { current: null };
			function P() {
				var e = oe.current;
				if (e === null) throw Error(g(321));
				return e;
			}
			var se = {
				ReactCurrentDispatcher: oe,
				ReactCurrentBatchConfig: { suspense: null },
				ReactCurrentOwner: C,
				IsSomeRendererActing: { current: !1 },
				assign: t
			};
			e.Children = {
				map: function(e, t, n) {
					if (e == null) return e;
					var r = [];
					return ae(e, r, null, t, n), r;
				},
				forEach: function(e, t, n) {
					if (e == null) return e;
					t = j(null, null, t, n), N(e, re, t), M(t);
				},
				count: function(e) {
					return N(e, function() {
						return null;
					}, null);
				},
				toArray: function(e) {
					var t = [];
					return ae(e, t, null, function(e) {
						return e;
					}), t;
				},
				only: function(e) {
					if (!O(e)) throw Error(g(143));
					return e;
				}
			}, e.Component = y, e.Fragment = a, e.Profiler = s, e.PureComponent = x, e.StrictMode = o, e.Suspense = d, e.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = se, e.cloneElement = function(e, n, i) {
				if (e == null) throw Error(g(267, e));
				var a = t({}, e.props), o = e.key, s = e.ref, c = e._owner;
				if (n != null) {
					if (n.ref !== void 0 && (s = n.ref, c = C.current), n.key !== void 0 && (o = "" + n.key), e.type && e.type.defaultProps) var l = e.type.defaultProps;
					for (u in n) w.call(n, u) && !T.hasOwnProperty(u) && (a[u] = n[u] === void 0 && l !== void 0 ? l[u] : n[u]);
				}
				var u = arguments.length - 2;
				if (u === 1) a.children = i;
				else if (1 < u) {
					l = Array(u);
					for (var d = 0; d < u; d++) l[d] = arguments[d + 2];
					a.children = l;
				}
				return {
					$$typeof: r,
					type: e.type,
					key: o,
					ref: s,
					props: a,
					_owner: c
				};
			}, e.createContext = function(e, t) {
				return t === void 0 && (t = null), e = {
					$$typeof: l,
					_calculateChangedBits: t,
					_currentValue: e,
					_currentValue2: e,
					_threadCount: 0,
					Provider: null,
					Consumer: null
				}, e.Provider = {
					$$typeof: c,
					_context: e
				}, e.Consumer = e;
			}, e.createElement = E, e.createFactory = function(e) {
				var t = E.bind(null, e);
				return t.type = e, t;
			}, e.createRef = function() {
				return { current: null };
			}, e.forwardRef = function(e) {
				return {
					$$typeof: u,
					render: e
				};
			}, e.isValidElement = O, e.lazy = function(e) {
				return {
					$$typeof: m,
					_ctor: e,
					_status: -1,
					_result: null
				};
			}, e.memo = function(e, t) {
				return {
					$$typeof: p,
					type: e,
					compare: t === void 0 ? null : t
				};
			}, e.useCallback = function(e, t) {
				return P().useCallback(e, t);
			}, e.useContext = function(e, t) {
				return P().useContext(e, t);
			}, e.useDebugValue = function() {}, e.useEffect = function(e, t) {
				return P().useEffect(e, t);
			}, e.useImperativeHandle = function(e, t, n) {
				return P().useImperativeHandle(e, t, n);
			}, e.useLayoutEffect = function(e, t) {
				return P().useLayoutEffect(e, t);
			}, e.useMemo = function(e, t) {
				return P().useMemo(e, t);
			}, e.useReducer = function(e, t, n) {
				return P().useReducer(e, t, n);
			}, e.useRef = function(e) {
				return P().useRef(e);
			}, e.useState = function(e) {
				return P().useState(e);
			}, e.version = "16.14.0";
		})), m = s(((e, t) => {
			t.exports = p();
		})), h = s(((e) => {
			var t, n, r, i, a;
			if (typeof window > "u" || typeof MessageChannel != "function") {
				var o = null, s = null, c = function() {
					if (o !== null) try {
						var t = e.unstable_now();
						o(!0, t), o = null;
					} catch (e) {
						throw setTimeout(c, 0), e;
					}
				}, l = Date.now();
				e.unstable_now = function() {
					return Date.now() - l;
				}, t = function(e) {
					o === null ? (o = e, setTimeout(c, 0)) : setTimeout(t, 0, e);
				}, n = function(e, t) {
					s = setTimeout(e, t);
				}, r = function() {
					clearTimeout(s);
				}, i = function() {
					return !1;
				}, a = e.unstable_forceFrameRate = function() {};
			} else {
				var u = window.performance, d = window.Date, f = window.setTimeout, p = window.clearTimeout;
				if (typeof console < "u") {
					var m = window.cancelAnimationFrame;
					typeof window.requestAnimationFrame != "function" && console.error("This browser doesn't support requestAnimationFrame. Make sure that you load a polyfill in older browsers. https://fb.me/react-polyfills"), typeof m != "function" && console.error("This browser doesn't support cancelAnimationFrame. Make sure that you load a polyfill in older browsers. https://fb.me/react-polyfills");
				}
				if (typeof u == "object" && typeof u.now == "function") e.unstable_now = function() {
					return u.now();
				};
				else {
					var h = d.now();
					e.unstable_now = function() {
						return d.now() - h;
					};
				}
				var g = !1, _ = null, v = -1, y = 5, b = 0;
				i = function() {
					return e.unstable_now() >= b;
				}, a = function() {}, e.unstable_forceFrameRate = function(e) {
					0 > e || 125 < e ? console.error("forceFrameRate takes a positive int between 0 and 125, forcing framerates higher than 125 fps is not unsupported") : y = 0 < e ? Math.floor(1e3 / e) : 5;
				};
				var x = new MessageChannel(), S = x.port2;
				x.port1.onmessage = function() {
					if (_ !== null) {
						var t = e.unstable_now();
						b = t + y;
						try {
							_(!0, t) ? S.postMessage(null) : (g = !1, _ = null);
						} catch (e) {
							throw S.postMessage(null), e;
						}
					} else g = !1;
				}, t = function(e) {
					_ = e, g || (g = !0, S.postMessage(null));
				}, n = function(t, n) {
					v = f(function() {
						t(e.unstable_now());
					}, n);
				}, r = function() {
					p(v), v = -1;
				};
			}
			function C(e, t) {
				var n = e.length;
				e.push(t);
				a: for (;;) {
					var r = n - 1 >>> 1, i = e[r];
					if (i !== void 0 && 0 < E(i, t)) e[r] = t, e[n] = i, n = r;
					else break a;
				}
			}
			function w(e) {
				return e = e[0], e === void 0 ? null : e;
			}
			function T(e) {
				var t = e[0];
				if (t !== void 0) {
					var n = e.pop();
					if (n !== t) {
						e[0] = n;
						a: for (var r = 0, i = e.length; r < i;) {
							var a = 2 * (r + 1) - 1, o = e[a], s = a + 1, c = e[s];
							if (o !== void 0 && 0 > E(o, n)) c !== void 0 && 0 > E(c, o) ? (e[r] = c, e[s] = n, r = s) : (e[r] = o, e[a] = n, r = a);
							else if (c !== void 0 && 0 > E(c, n)) e[r] = c, e[s] = n, r = s;
							else break a;
						}
					}
					return t;
				}
				return null;
			}
			function E(e, t) {
				var n = e.sortIndex - t.sortIndex;
				return n === 0 ? e.id - t.id : n;
			}
			var D = [], O = [], ee = 1, k = null, A = 3, j = !1, M = !1, te = !1;
			function N(e) {
				for (var t = w(O); t !== null;) {
					if (t.callback === null) T(O);
					else if (t.startTime <= e) T(O), t.sortIndex = t.expirationTime, C(D, t);
					else break;
					t = w(O);
				}
			}
			function ne(e) {
				if (te = !1, N(e), !M) {
					if (w(D) !== null) M = !0, t(re);
					else {
						var r = w(O);
						r !== null && n(ne, r.startTime - e);
					}
				}
			}
			function re(t, a) {
				M = !1, te && (te = !1, r()), j = !0;
				var o = A;
				try {
					for (N(a), k = w(D); k !== null && (!(k.expirationTime > a) || t && !i());) {
						var s = k.callback;
						if (s !== null) {
							k.callback = null, A = k.priorityLevel;
							var c = s(k.expirationTime <= a);
							a = e.unstable_now(), typeof c == "function" ? k.callback = c : k === w(D) && T(D), N(a);
						} else T(D);
						k = w(D);
					}
					if (k !== null) var l = !0;
					else {
						var u = w(O);
						u !== null && n(ne, u.startTime - a), l = !1;
					}
					return l;
				} finally {
					k = null, A = o, j = !1;
				}
			}
			function ie(e) {
				switch (e) {
					case 1: return -1;
					case 2: return 250;
					case 5: return 1073741823;
					case 4: return 1e4;
					default: return 5e3;
				}
			}
			var ae = a;
			e.unstable_IdlePriority = 5, e.unstable_ImmediatePriority = 1, e.unstable_LowPriority = 4, e.unstable_NormalPriority = 3, e.unstable_Profiling = null, e.unstable_UserBlockingPriority = 2, e.unstable_cancelCallback = function(e) {
				e.callback = null;
			}, e.unstable_continueExecution = function() {
				M || j || (M = !0, t(re));
			}, e.unstable_getCurrentPriorityLevel = function() {
				return A;
			}, e.unstable_getFirstCallbackNode = function() {
				return w(D);
			}, e.unstable_next = function(e) {
				switch (A) {
					case 1:
					case 2:
					case 3:
						var t = 3;
						break;
					default: t = A;
				}
				var n = A;
				A = t;
				try {
					return e();
				} finally {
					A = n;
				}
			}, e.unstable_pauseExecution = function() {}, e.unstable_requestPaint = ae, e.unstable_runWithPriority = function(e, t) {
				switch (e) {
					case 1:
					case 2:
					case 3:
					case 4:
					case 5: break;
					default: e = 3;
				}
				var n = A;
				A = e;
				try {
					return t();
				} finally {
					A = n;
				}
			}, e.unstable_scheduleCallback = function(i, a, o) {
				var s = e.unstable_now();
				if (typeof o == "object" && o) {
					var c = o.delay;
					c = typeof c == "number" && 0 < c ? s + c : s, o = typeof o.timeout == "number" ? o.timeout : ie(i);
				} else o = ie(i), c = s;
				return o = c + o, i = {
					id: ee++,
					callback: a,
					priorityLevel: i,
					startTime: c,
					expirationTime: o,
					sortIndex: -1
				}, c > s ? (i.sortIndex = c, C(O, i), w(D) === null && i === w(O) && (te ? r() : te = !0, n(ne, c - s))) : (i.sortIndex = o, C(D, i), M || j || (M = !0, t(re))), i;
			}, e.unstable_shouldYield = function() {
				var t = e.unstable_now();
				N(t);
				var n = w(D);
				return n !== k && k !== null && n !== null && n.callback !== null && n.startTime <= t && n.expirationTime < k.expirationTime || i();
			}, e.unstable_wrapCallback = function(e) {
				var t = A;
				return function() {
					var n = A;
					A = t;
					try {
						return e.apply(this, arguments);
					} finally {
						A = n;
					}
				};
			};
		})), g = s(((e, t) => {
			t.exports = h();
		})), _ = s(((e) => {
			var t = m(), n = f(), r = g();
			function i(e) {
				for (var t = "https://reactjs.org/docs/error-decoder.html?invariant=" + e, n = 1; n < arguments.length; n++) t += "&args[]=" + encodeURIComponent(arguments[n]);
				return "Minified React error #" + e + "; visit " + t + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
			}
			if (!t) throw Error(i(227));
			function a(e, t, n, r, i, a, o, s, c) {
				var l = Array.prototype.slice.call(arguments, 3);
				try {
					t.apply(n, l);
				} catch (e) {
					this.onError(e);
				}
			}
			var o = !1, s = null, c = !1, l = null, u = { onError: function(e) {
				o = !0, s = e;
			} };
			function d(e, t, n, r, i, c, l, d, f) {
				o = !1, s = null, a.apply(u, arguments);
			}
			function p(e, t, n, r, a, u, f, p, m) {
				if (d.apply(this, arguments), o) {
					if (o) {
						var h = s;
						o = !1, s = null;
					} else throw Error(i(198));
					c || (c = !0, l = h);
				}
			}
			var h = null, _ = null, v = null;
			function y(e, t, n) {
				var r = e.type || "unknown-event";
				e.currentTarget = v(n), p(r, t, void 0, e), e.currentTarget = null;
			}
			var b = null, x = {};
			function S() {
				if (b) for (var e in x) {
					var t = x[e], n = b.indexOf(e);
					if (!(-1 < n)) throw Error(i(96, e));
					if (!w[n]) {
						if (!t.extractEvents) throw Error(i(97, e));
						for (var r in w[n] = t, n = t.eventTypes, n) {
							var a = void 0, o = n[r], s = t, c = r;
							if (T.hasOwnProperty(c)) throw Error(i(99, c));
							T[c] = o;
							var l = o.phasedRegistrationNames;
							if (l) {
								for (a in l) l.hasOwnProperty(a) && C(l[a], s, c);
								a = !0;
							} else o.registrationName ? (C(o.registrationName, s, c), a = !0) : a = !1;
							if (!a) throw Error(i(98, r, e));
						}
					}
				}
			}
			function C(e, t, n) {
				if (E[e]) throw Error(i(100, e));
				E[e] = t, D[e] = t.eventTypes[n].dependencies;
			}
			var w = [], T = {}, E = {}, D = {};
			function O(e) {
				var t = !1, n;
				for (n in e) if (e.hasOwnProperty(n)) {
					var r = e[n];
					if (!x.hasOwnProperty(n) || x[n] !== r) {
						if (x[n]) throw Error(i(102, n));
						x[n] = r, t = !0;
					}
				}
				t && S();
			}
			var ee = typeof window < "u" && window.document !== void 0 && window.document.createElement !== void 0, k = null, A = null, j = null;
			function M(e) {
				if (e = _(e)) {
					if (typeof k != "function") throw Error(i(280));
					var t = e.stateNode;
					t && (t = h(t), k(e.stateNode, e.type, t));
				}
			}
			function te(e) {
				A ? j ? j.push(e) : j = [e] : A = e;
			}
			function N() {
				if (A) {
					var e = A, t = j;
					if (j = A = null, M(e), t) for (e = 0; e < t.length; e++) M(t[e]);
				}
			}
			function ne(e, t) {
				return e(t);
			}
			function re(e, t, n, r, i) {
				return e(t, n, r, i);
			}
			function ie() {}
			var ae = ne, oe = !1, P = !1;
			function se() {
				(A !== null || j !== null) && (ie(), N());
			}
			function ce(e, t, n) {
				if (P) return e(t, n);
				P = !0;
				try {
					return ae(e, t, n);
				} finally {
					P = !1, se();
				}
			}
			var le = /^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/, ue = Object.prototype.hasOwnProperty, de = {}, fe = {};
			function pe(e) {
				return ue.call(fe, e) ? !0 : ue.call(de, e) ? !1 : le.test(e) ? fe[e] = !0 : (de[e] = !0, !1);
			}
			function me(e, t, n, r) {
				if (n !== null && n.type === 0) return !1;
				switch (typeof t) {
					case "function":
					case "symbol": return !0;
					case "boolean": return r ? !1 : n === null ? (e = e.toLowerCase().slice(0, 5), e !== "data-" && e !== "aria-") : !n.acceptsBooleans;
					default: return !1;
				}
			}
			function he(e, t, n, r) {
				if (t == null || me(e, t, n, r)) return !0;
				if (r) return !1;
				if (n !== null) switch (n.type) {
					case 3: return !t;
					case 4: return !1 === t;
					case 5: return isNaN(t);
					case 6: return isNaN(t) || 1 > t;
				}
				return !1;
			}
			function ge(e, t, n, r, i, a) {
				this.acceptsBooleans = t === 2 || t === 3 || t === 4, this.attributeName = r, this.attributeNamespace = i, this.mustUseProperty = n, this.propertyName = e, this.type = t, this.sanitizeURL = a;
			}
			var F = {};
			"children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style".split(" ").forEach(function(e) {
				F[e] = new ge(e, 0, !1, e, null, !1);
			}), [
				["acceptCharset", "accept-charset"],
				["className", "class"],
				["htmlFor", "for"],
				["httpEquiv", "http-equiv"]
			].forEach(function(e) {
				var t = e[0];
				F[t] = new ge(t, 1, !1, e[1], null, !1);
			}), [
				"contentEditable",
				"draggable",
				"spellCheck",
				"value"
			].forEach(function(e) {
				F[e] = new ge(e, 2, !1, e.toLowerCase(), null, !1);
			}), [
				"autoReverse",
				"externalResourcesRequired",
				"focusable",
				"preserveAlpha"
			].forEach(function(e) {
				F[e] = new ge(e, 2, !1, e, null, !1);
			}), "allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope".split(" ").forEach(function(e) {
				F[e] = new ge(e, 3, !1, e.toLowerCase(), null, !1);
			}), [
				"checked",
				"multiple",
				"muted",
				"selected"
			].forEach(function(e) {
				F[e] = new ge(e, 3, !0, e, null, !1);
			}), ["capture", "download"].forEach(function(e) {
				F[e] = new ge(e, 4, !1, e, null, !1);
			}), [
				"cols",
				"rows",
				"size",
				"span"
			].forEach(function(e) {
				F[e] = new ge(e, 6, !1, e, null, !1);
			}), ["rowSpan", "start"].forEach(function(e) {
				F[e] = new ge(e, 5, !1, e.toLowerCase(), null, !1);
			});
			var _e = /[\-:]([a-z])/g;
			function ve(e) {
				return e[1].toUpperCase();
			}
			"accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height".split(" ").forEach(function(e) {
				var t = e.replace(_e, ve);
				F[t] = new ge(t, 1, !1, e, null, !1);
			}), "xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type".split(" ").forEach(function(e) {
				var t = e.replace(_e, ve);
				F[t] = new ge(t, 1, !1, e, "http://www.w3.org/1999/xlink", !1);
			}), [
				"xml:base",
				"xml:lang",
				"xml:space"
			].forEach(function(e) {
				var t = e.replace(_e, ve);
				F[t] = new ge(t, 1, !1, e, "http://www.w3.org/XML/1998/namespace", !1);
			}), ["tabIndex", "crossOrigin"].forEach(function(e) {
				F[e] = new ge(e, 1, !1, e.toLowerCase(), null, !1);
			}), F.xlinkHref = new ge("xlinkHref", 1, !1, "xlink:href", "http://www.w3.org/1999/xlink", !0), [
				"src",
				"href",
				"action",
				"formAction"
			].forEach(function(e) {
				F[e] = new ge(e, 1, !1, e.toLowerCase(), null, !0);
			});
			var ye = t.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
			ye.hasOwnProperty("ReactCurrentDispatcher") || (ye.ReactCurrentDispatcher = { current: null }), ye.hasOwnProperty("ReactCurrentBatchConfig") || (ye.ReactCurrentBatchConfig = { suspense: null });
			function be(e, t, n, r) {
				var i = F.hasOwnProperty(t) ? F[t] : null;
				(i === null ? !r && !(!(2 < t.length) || t[0] !== "o" && t[0] !== "O" || t[1] !== "n" && t[1] !== "N") : i.type === 0) || (he(t, n, i, r) && (n = null), r || i === null ? pe(t) && (n === null ? e.removeAttribute(t) : e.setAttribute(t, "" + n)) : i.mustUseProperty ? e[i.propertyName] = n === null ? i.type !== 3 && "" : n : (t = i.attributeName, r = i.attributeNamespace, n === null ? e.removeAttribute(t) : (i = i.type, n = i === 3 || i === 4 && !0 === n ? "" : "" + n, r ? e.setAttributeNS(r, t, n) : e.setAttribute(t, n))));
			}
			var xe = /^(.*)[\\\/]/, Se = typeof Symbol == "function" && Symbol.for, Ce = Se ? Symbol.for("react.element") : 60103, we = Se ? Symbol.for("react.portal") : 60106, Te = Se ? Symbol.for("react.fragment") : 60107, Ee = Se ? Symbol.for("react.strict_mode") : 60108, De = Se ? Symbol.for("react.profiler") : 60114, Oe = Se ? Symbol.for("react.provider") : 60109, ke = Se ? Symbol.for("react.context") : 60110, Ae = Se ? Symbol.for("react.concurrent_mode") : 60111, je = Se ? Symbol.for("react.forward_ref") : 60112, Me = Se ? Symbol.for("react.suspense") : 60113, Ne = Se ? Symbol.for("react.suspense_list") : 60120, Pe = Se ? Symbol.for("react.memo") : 60115, Fe = Se ? Symbol.for("react.lazy") : 60116, Ie = Se ? Symbol.for("react.block") : 60121, Le = typeof Symbol == "function" && Symbol.iterator;
			function Re(e) {
				return typeof e != "object" || !e ? null : (e = Le && e[Le] || e["@@iterator"], typeof e == "function" ? e : null);
			}
			function ze(e) {
				if (e._status === -1) {
					e._status = 0;
					var t = e._ctor;
					t = t(), e._result = t, t.then(function(t) {
						e._status === 0 && (t = t.default, e._status = 1, e._result = t);
					}, function(t) {
						e._status === 0 && (e._status = 2, e._result = t);
					});
				}
			}
			function Be(e) {
				if (e == null) return null;
				if (typeof e == "function") return e.displayName || e.name || null;
				if (typeof e == "string") return e;
				switch (e) {
					case Te: return "Fragment";
					case we: return "Portal";
					case De: return "Profiler";
					case Ee: return "StrictMode";
					case Me: return "Suspense";
					case Ne: return "SuspenseList";
				}
				if (typeof e == "object") switch (e.$$typeof) {
					case ke: return "Context.Consumer";
					case Oe: return "Context.Provider";
					case je:
						var t = e.render;
						return t = t.displayName || t.name || "", e.displayName || (t === "" ? "ForwardRef" : "ForwardRef(" + t + ")");
					case Pe: return Be(e.type);
					case Ie: return Be(e.render);
					case Fe: if (e = e._status === 1 ? e._result : null) return Be(e);
				}
				return null;
			}
			function Ve(e) {
				var t = "";
				do {
					a: switch (e.tag) {
						case 3:
						case 4:
						case 6:
						case 7:
						case 10:
						case 9:
							var n = "";
							break a;
						default:
							var r = e._debugOwner, i = e._debugSource, a = Be(e.type);
							n = null, r && (n = Be(r.type)), r = a, a = "", i ? a = " (at " + i.fileName.replace(xe, "") + ":" + i.lineNumber + ")" : n && (a = " (created by " + n + ")"), n = "\n    in " + (r || "Unknown") + a;
					}
					t += n, e = e.return;
				} while (e);
				return t;
			}
			function He(e) {
				switch (typeof e) {
					case "boolean":
					case "number":
					case "object":
					case "string":
					case "undefined": return e;
					default: return "";
				}
			}
			function Ue(e) {
				var t = e.type;
				return (e = e.nodeName) && e.toLowerCase() === "input" && (t === "checkbox" || t === "radio");
			}
			function We(e) {
				var t = Ue(e) ? "checked" : "value", n = Object.getOwnPropertyDescriptor(e.constructor.prototype, t), r = "" + e[t];
				if (!e.hasOwnProperty(t) && n !== void 0 && typeof n.get == "function" && typeof n.set == "function") {
					var i = n.get, a = n.set;
					return Object.defineProperty(e, t, {
						configurable: !0,
						get: function() {
							return i.call(this);
						},
						set: function(e) {
							r = "" + e, a.call(this, e);
						}
					}), Object.defineProperty(e, t, { enumerable: n.enumerable }), {
						getValue: function() {
							return r;
						},
						setValue: function(e) {
							r = "" + e;
						},
						stopTracking: function() {
							e._valueTracker = null, delete e[t];
						}
					};
				}
			}
			function Ge(e) {
				e._valueTracker ||= We(e);
			}
			function Ke(e) {
				if (!e) return !1;
				var t = e._valueTracker;
				if (!t) return !0;
				var n = t.getValue(), r = "";
				return e && (r = Ue(e) ? e.checked ? "true" : "false" : e.value), e = r, e !== n && (t.setValue(e), !0);
			}
			function qe(e, t) {
				var r = t.checked;
				return n({}, t, {
					defaultChecked: void 0,
					defaultValue: void 0,
					value: void 0,
					checked: r ?? e._wrapperState.initialChecked
				});
			}
			function Je(e, t) {
				var n = t.defaultValue == null ? "" : t.defaultValue, r = t.checked == null ? t.defaultChecked : t.checked;
				n = He(t.value == null ? n : t.value), e._wrapperState = {
					initialChecked: r,
					initialValue: n,
					controlled: t.type === "checkbox" || t.type === "radio" ? t.checked != null : t.value != null
				};
			}
			function I(e, t) {
				t = t.checked, t != null && be(e, "checked", t, !1);
			}
			function Ye(e, t) {
				I(e, t);
				var n = He(t.value), r = t.type;
				if (n != null) r === "number" ? (n === 0 && e.value === "" || e.value != n) && (e.value = "" + n) : e.value !== "" + n && (e.value = "" + n);
				else if (r === "submit" || r === "reset") {
					e.removeAttribute("value");
					return;
				}
				t.hasOwnProperty("value") ? Ze(e, t.type, n) : t.hasOwnProperty("defaultValue") && Ze(e, t.type, He(t.defaultValue)), t.checked == null && t.defaultChecked != null && (e.defaultChecked = !!t.defaultChecked);
			}
			function Xe(e, t, n) {
				if (t.hasOwnProperty("value") || t.hasOwnProperty("defaultValue")) {
					var r = t.type;
					if (!(r !== "submit" && r !== "reset" || t.value !== void 0 && t.value !== null)) return;
					t = "" + e._wrapperState.initialValue, n || t === e.value || (e.value = t), e.defaultValue = t;
				}
				n = e.name, n !== "" && (e.name = ""), e.defaultChecked = !!e._wrapperState.initialChecked, n !== "" && (e.name = n);
			}
			function Ze(e, t, n) {
				(t !== "number" || e.ownerDocument.activeElement !== e) && (n == null ? e.defaultValue = "" + e._wrapperState.initialValue : e.defaultValue !== "" + n && (e.defaultValue = "" + n));
			}
			function Qe(e) {
				var n = "";
				return t.Children.forEach(e, function(e) {
					e != null && (n += e);
				}), n;
			}
			function $e(e, t) {
				return e = n({ children: void 0 }, t), (t = Qe(t.children)) && (e.children = t), e;
			}
			function et(e, t, n, r) {
				if (e = e.options, t) {
					t = {};
					for (var i = 0; i < n.length; i++) t["$" + n[i]] = !0;
					for (n = 0; n < e.length; n++) i = t.hasOwnProperty("$" + e[n].value), e[n].selected !== i && (e[n].selected = i), i && r && (e[n].defaultSelected = !0);
				} else {
					for (n = "" + He(n), t = null, i = 0; i < e.length; i++) {
						if (e[i].value === n) {
							e[i].selected = !0, r && (e[i].defaultSelected = !0);
							return;
						}
						t !== null || e[i].disabled || (t = e[i]);
					}
					t !== null && (t.selected = !0);
				}
			}
			function tt(e, t) {
				if (t.dangerouslySetInnerHTML != null) throw Error(i(91));
				return n({}, t, {
					value: void 0,
					defaultValue: void 0,
					children: "" + e._wrapperState.initialValue
				});
			}
			function nt(e, t) {
				var n = t.value;
				if (n == null) {
					if (n = t.children, t = t.defaultValue, n != null) {
						if (t != null) throw Error(i(92));
						if (Array.isArray(n)) {
							if (!(1 >= n.length)) throw Error(i(93));
							n = n[0];
						}
						t = n;
					}
					t ??= "", n = t;
				}
				e._wrapperState = { initialValue: He(n) };
			}
			function rt(e, t) {
				var n = He(t.value), r = He(t.defaultValue);
				n != null && (n = "" + n, n !== e.value && (e.value = n), t.defaultValue == null && e.defaultValue !== n && (e.defaultValue = n)), r != null && (e.defaultValue = "" + r);
			}
			function it(e) {
				var t = e.textContent;
				t === e._wrapperState.initialValue && t !== "" && t !== null && (e.value = t);
			}
			var at = {
				html: "http://www.w3.org/1999/xhtml",
				mathml: "http://www.w3.org/1998/Math/MathML",
				svg: "http://www.w3.org/2000/svg"
			};
			function ot(e) {
				switch (e) {
					case "svg": return "http://www.w3.org/2000/svg";
					case "math": return "http://www.w3.org/1998/Math/MathML";
					default: return "http://www.w3.org/1999/xhtml";
				}
			}
			function st(e, t) {
				return e == null || e === "http://www.w3.org/1999/xhtml" ? ot(t) : e === "http://www.w3.org/2000/svg" && t === "foreignObject" ? "http://www.w3.org/1999/xhtml" : e;
			}
			var ct, lt = function(e) {
				return typeof MSApp < "u" && MSApp.execUnsafeLocalFunction ? function(t, n, r, i) {
					MSApp.execUnsafeLocalFunction(function() {
						return e(t, n, r, i);
					});
				} : e;
			}(function(e, t) {
				if (e.namespaceURI !== at.svg || "innerHTML" in e) e.innerHTML = t;
				else {
					for (ct ||= document.createElement("div"), ct.innerHTML = "<svg>" + t.valueOf().toString() + "</svg>", t = ct.firstChild; e.firstChild;) e.removeChild(e.firstChild);
					for (; t.firstChild;) e.appendChild(t.firstChild);
				}
			});
			function ut(e, t) {
				if (t) {
					var n = e.firstChild;
					if (n && n === e.lastChild && n.nodeType === 3) {
						n.nodeValue = t;
						return;
					}
				}
				e.textContent = t;
			}
			function dt(e, t) {
				var n = {};
				return n[e.toLowerCase()] = t.toLowerCase(), n["Webkit" + e] = "webkit" + t, n["Moz" + e] = "moz" + t, n;
			}
			var ft = {
				animationend: dt("Animation", "AnimationEnd"),
				animationiteration: dt("Animation", "AnimationIteration"),
				animationstart: dt("Animation", "AnimationStart"),
				transitionend: dt("Transition", "TransitionEnd")
			}, pt = {}, mt = {};
			ee && (mt = document.createElement("div").style, "AnimationEvent" in window || (delete ft.animationend.animation, delete ft.animationiteration.animation, delete ft.animationstart.animation), "TransitionEvent" in window || delete ft.transitionend.transition);
			function ht(e) {
				if (pt[e]) return pt[e];
				if (!ft[e]) return e;
				var t = ft[e], n;
				for (n in t) if (t.hasOwnProperty(n) && n in mt) return pt[e] = t[n];
				return e;
			}
			var gt = ht("animationend"), _t = ht("animationiteration"), vt = ht("animationstart"), yt = ht("transitionend"), bt = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange seeked seeking stalled suspend timeupdate volumechange waiting".split(" "), xt = new (typeof WeakMap == "function" ? WeakMap : Map)();
			function St(e) {
				var t = xt.get(e);
				return t === void 0 && (t = /* @__PURE__ */ new Map(), xt.set(e, t)), t;
			}
			function Ct(e) {
				var t = e, n = e;
				if (e.alternate) for (; t.return;) t = t.return;
				else {
					e = t;
					do
						t = e, t.effectTag & 1026 && (n = t.return), e = t.return;
					while (e);
				}
				return t.tag === 3 ? n : null;
			}
			function wt(e) {
				if (e.tag === 13) {
					var t = e.memoizedState;
					if (t === null && (e = e.alternate, e !== null && (t = e.memoizedState)), t !== null) return t.dehydrated;
				}
				return null;
			}
			function L(e) {
				if (Ct(e) !== e) throw Error(i(188));
			}
			function Tt(e) {
				var t = e.alternate;
				if (!t) {
					if (t = Ct(e), t === null) throw Error(i(188));
					return t === e ? e : null;
				}
				for (var n = e, r = t;;) {
					var a = n.return;
					if (a === null) break;
					var o = a.alternate;
					if (o === null) {
						if (r = a.return, r !== null) {
							n = r;
							continue;
						}
						break;
					}
					if (a.child === o.child) {
						for (o = a.child; o;) {
							if (o === n) return L(a), e;
							if (o === r) return L(a), t;
							o = o.sibling;
						}
						throw Error(i(188));
					}
					if (n.return !== r.return) n = a, r = o;
					else {
						for (var s = !1, c = a.child; c;) {
							if (c === n) {
								s = !0, n = a, r = o;
								break;
							}
							if (c === r) {
								s = !0, r = a, n = o;
								break;
							}
							c = c.sibling;
						}
						if (!s) {
							for (c = o.child; c;) {
								if (c === n) {
									s = !0, n = o, r = a;
									break;
								}
								if (c === r) {
									s = !0, r = o, n = a;
									break;
								}
								c = c.sibling;
							}
							if (!s) throw Error(i(189));
						}
					}
					if (n.alternate !== r) throw Error(i(190));
				}
				if (n.tag !== 3) throw Error(i(188));
				return n.stateNode.current === n ? e : t;
			}
			function Et(e) {
				if (e = Tt(e), !e) return null;
				for (var t = e;;) {
					if (t.tag === 5 || t.tag === 6) return t;
					if (t.child) t.child.return = t, t = t.child;
					else {
						if (t === e) break;
						for (; !t.sibling;) {
							if (!t.return || t.return === e) return null;
							t = t.return;
						}
						t.sibling.return = t.return, t = t.sibling;
					}
				}
				return null;
			}
			function Dt(e, t) {
				if (t == null) throw Error(i(30));
				return e == null ? t : Array.isArray(e) ? Array.isArray(t) ? (e.push.apply(e, t), e) : (e.push(t), e) : Array.isArray(t) ? [e].concat(t) : [e, t];
			}
			function Ot(e, t, n) {
				Array.isArray(e) ? e.forEach(t, n) : e && t.call(n, e);
			}
			var kt = null;
			function At(e) {
				if (e) {
					var t = e._dispatchListeners, n = e._dispatchInstances;
					if (Array.isArray(t)) for (var r = 0; r < t.length && !e.isPropagationStopped(); r++) y(e, t[r], n[r]);
					else t && y(e, t, n);
					e._dispatchListeners = null, e._dispatchInstances = null, e.isPersistent() || e.constructor.release(e);
				}
			}
			function jt(e) {
				if (e !== null && (kt = Dt(kt, e)), e = kt, kt = null, e) {
					if (Ot(e, At), kt) throw Error(i(95));
					if (c) throw e = l, c = !1, l = null, e;
				}
			}
			function Mt(e) {
				return e = e.target || e.srcElement || window, e.correspondingUseElement && (e = e.correspondingUseElement), e.nodeType === 3 ? e.parentNode : e;
			}
			function Nt(e) {
				if (!ee) return !1;
				e = "on" + e;
				var t = e in document;
				return t ||= (t = document.createElement("div"), t.setAttribute(e, "return;"), typeof t[e] == "function"), t;
			}
			var Pt = [];
			function Ft(e) {
				e.topLevelType = null, e.nativeEvent = null, e.targetInst = null, e.ancestors.length = 0, 10 > Pt.length && Pt.push(e);
			}
			function It(e, t, n, r) {
				if (Pt.length) {
					var i = Pt.pop();
					return i.topLevelType = e, i.eventSystemFlags = r, i.nativeEvent = t, i.targetInst = n, i;
				}
				return {
					topLevelType: e,
					eventSystemFlags: r,
					nativeEvent: t,
					targetInst: n,
					ancestors: []
				};
			}
			function Lt(e) {
				var t = e.targetInst, n = t;
				do {
					if (!n) {
						e.ancestors.push(n);
						break;
					}
					var r = n;
					if (r.tag === 3) r = r.stateNode.containerInfo;
					else {
						for (; r.return;) r = r.return;
						r = r.tag === 3 ? r.stateNode.containerInfo : null;
					}
					if (!r) break;
					t = n.tag, t !== 5 && t !== 6 || e.ancestors.push(n), n = tr(r);
				} while (n);
				for (n = 0; n < e.ancestors.length; n++) {
					t = e.ancestors[n];
					var i = Mt(e.nativeEvent);
					r = e.topLevelType;
					var a = e.nativeEvent, o = e.eventSystemFlags;
					n === 0 && (o |= 64);
					for (var s = null, c = 0; c < w.length; c++) {
						var l = w[c];
						(l &&= l.extractEvents(r, t, a, i, o)) && (s = Dt(s, l));
					}
					jt(s);
				}
			}
			function R(e, t, n) {
				if (!n.has(e)) {
					switch (e) {
						case "scroll":
							vn(t, "scroll", !0);
							break;
						case "focus":
						case "blur":
							vn(t, "focus", !0), vn(t, "blur", !0), n.set("blur", null), n.set("focus", null);
							break;
						case "cancel":
						case "close":
							Nt(e) && vn(t, e, !0);
							break;
						case "invalid":
						case "submit":
						case "reset": break;
						default: bt.indexOf(e) === -1 && B(e, t);
					}
					n.set(e, null);
				}
			}
			var Rt, zt, Bt, Vt = !1, Ht = [], Ut = null, Wt = null, Gt = null, Kt = /* @__PURE__ */ new Map(), qt = /* @__PURE__ */ new Map(), Jt = [], Yt = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput close cancel copy cut paste click change contextmenu reset submit".split(" "), Xt = "focus blur dragenter dragleave mouseover mouseout pointerover pointerout gotpointercapture lostpointercapture".split(" ");
			function Zt(e, t) {
				var n = St(t);
				Yt.forEach(function(e) {
					R(e, t, n);
				}), Xt.forEach(function(e) {
					R(e, t, n);
				});
			}
			function Qt(e, t, n, r, i) {
				return {
					blockedOn: e,
					topLevelType: t,
					eventSystemFlags: n | 32,
					nativeEvent: i,
					container: r
				};
			}
			function $t(e, t) {
				switch (e) {
					case "focus":
					case "blur":
						Ut = null;
						break;
					case "dragenter":
					case "dragleave":
						Wt = null;
						break;
					case "mouseover":
					case "mouseout":
						Gt = null;
						break;
					case "pointerover":
					case "pointerout":
						Kt.delete(t.pointerId);
						break;
					case "gotpointercapture":
					case "lostpointercapture": qt.delete(t.pointerId);
				}
			}
			function en(e, t, n, r, i, a) {
				return e === null || e.nativeEvent !== a ? (e = Qt(t, n, r, i, a), t !== null && (t = nr(t), t !== null && zt(t)), e) : (e.eventSystemFlags |= r, e);
			}
			function tn(e, t, n, r, i) {
				switch (t) {
					case "focus": return Ut = en(Ut, e, t, n, r, i), !0;
					case "dragenter": return Wt = en(Wt, e, t, n, r, i), !0;
					case "mouseover": return Gt = en(Gt, e, t, n, r, i), !0;
					case "pointerover":
						var a = i.pointerId;
						return Kt.set(a, en(Kt.get(a) || null, e, t, n, r, i)), !0;
					case "gotpointercapture": return a = i.pointerId, qt.set(a, en(qt.get(a) || null, e, t, n, r, i)), !0;
				}
				return !1;
			}
			function nn(e) {
				var t = tr(e.target);
				if (t !== null) {
					var n = Ct(t);
					if (n !== null) {
						if (t = n.tag, t === 13) {
							if (t = wt(n), t !== null) {
								e.blockedOn = t, r.unstable_runWithPriority(e.priority, function() {
									Bt(n);
								});
								return;
							}
						} else if (t === 3 && n.stateNode.hydrate) {
							e.blockedOn = n.tag === 3 ? n.stateNode.containerInfo : null;
							return;
						}
					}
				}
				e.blockedOn = null;
			}
			function z(e) {
				if (e.blockedOn !== null) return !1;
				var t = Sn(e.topLevelType, e.eventSystemFlags, e.container, e.nativeEvent);
				if (t !== null) {
					var n = nr(t);
					return n !== null && zt(n), e.blockedOn = t, !1;
				}
				return !0;
			}
			function rn(e, t, n) {
				z(e) && n.delete(t);
			}
			function an() {
				for (Vt = !1; 0 < Ht.length;) {
					var e = Ht[0];
					if (e.blockedOn !== null) {
						e = nr(e.blockedOn), e !== null && Rt(e);
						break;
					}
					var t = Sn(e.topLevelType, e.eventSystemFlags, e.container, e.nativeEvent);
					t === null ? Ht.shift() : e.blockedOn = t;
				}
				Ut !== null && z(Ut) && (Ut = null), Wt !== null && z(Wt) && (Wt = null), Gt !== null && z(Gt) && (Gt = null), Kt.forEach(rn), qt.forEach(rn);
			}
			function on(e, t) {
				e.blockedOn === t && (e.blockedOn = null, Vt || (Vt = !0, r.unstable_scheduleCallback(r.unstable_NormalPriority, an)));
			}
			function sn(e) {
				function t(t) {
					return on(t, e);
				}
				if (0 < Ht.length) {
					on(Ht[0], e);
					for (var n = 1; n < Ht.length; n++) {
						var r = Ht[n];
						r.blockedOn === e && (r.blockedOn = null);
					}
				}
				for (Ut !== null && on(Ut, e), Wt !== null && on(Wt, e), Gt !== null && on(Gt, e), Kt.forEach(t), qt.forEach(t), n = 0; n < Jt.length; n++) r = Jt[n], r.blockedOn === e && (r.blockedOn = null);
				for (; 0 < Jt.length && (n = Jt[0], n.blockedOn === null);) nn(n), n.blockedOn === null && Jt.shift();
			}
			var cn = {}, ln = /* @__PURE__ */ new Map(), un = /* @__PURE__ */ new Map(), dn = [
				"abort",
				"abort",
				gt,
				"animationEnd",
				_t,
				"animationIteration",
				vt,
				"animationStart",
				"canplay",
				"canPlay",
				"canplaythrough",
				"canPlayThrough",
				"durationchange",
				"durationChange",
				"emptied",
				"emptied",
				"encrypted",
				"encrypted",
				"ended",
				"ended",
				"error",
				"error",
				"gotpointercapture",
				"gotPointerCapture",
				"load",
				"load",
				"loadeddata",
				"loadedData",
				"loadedmetadata",
				"loadedMetadata",
				"loadstart",
				"loadStart",
				"lostpointercapture",
				"lostPointerCapture",
				"playing",
				"playing",
				"progress",
				"progress",
				"seeking",
				"seeking",
				"stalled",
				"stalled",
				"suspend",
				"suspend",
				"timeupdate",
				"timeUpdate",
				yt,
				"transitionEnd",
				"waiting",
				"waiting"
			];
			function fn(e, t) {
				for (var n = 0; n < e.length; n += 2) {
					var r = e[n], i = e[n + 1], a = "on" + (i[0].toUpperCase() + i.slice(1));
					a = {
						phasedRegistrationNames: {
							bubbled: a,
							captured: a + "Capture"
						},
						dependencies: [r],
						eventPriority: t
					}, un.set(r, t), ln.set(r, a), cn[i] = a;
				}
			}
			fn("blur blur cancel cancel click click close close contextmenu contextMenu copy copy cut cut auxclick auxClick dblclick doubleClick dragend dragEnd dragstart dragStart drop drop focus focus input input invalid invalid keydown keyDown keypress keyPress keyup keyUp mousedown mouseDown mouseup mouseUp paste paste pause pause play play pointercancel pointerCancel pointerdown pointerDown pointerup pointerUp ratechange rateChange reset reset seeked seeked submit submit touchcancel touchCancel touchend touchEnd touchstart touchStart volumechange volumeChange".split(" "), 0), fn("drag drag dragenter dragEnter dragexit dragExit dragleave dragLeave dragover dragOver mousemove mouseMove mouseout mouseOut mouseover mouseOver pointermove pointerMove pointerout pointerOut pointerover pointerOver scroll scroll toggle toggle touchmove touchMove wheel wheel".split(" "), 1), fn(dn, 2);
			for (var pn = "change selectionchange textInput compositionstart compositionend compositionupdate".split(" "), mn = 0; mn < pn.length; mn++) un.set(pn[mn], 0);
			var hn = r.unstable_UserBlockingPriority, gn = r.unstable_runWithPriority, _n = !0;
			function B(e, t) {
				vn(t, e, !1);
			}
			function vn(e, t, n) {
				var r = un.get(t);
				switch (r === void 0 ? 2 : r) {
					case 0:
						r = yn.bind(null, t, 1, e);
						break;
					case 1:
						r = bn.bind(null, t, 1, e);
						break;
					default: r = xn.bind(null, t, 1, e);
				}
				n ? e.addEventListener(t, r, !0) : e.addEventListener(t, r, !1);
			}
			function yn(e, t, n, r) {
				oe || ie();
				var i = xn, a = oe;
				oe = !0;
				try {
					re(i, e, t, n, r);
				} finally {
					(oe = a) || se();
				}
			}
			function bn(e, t, n, r) {
				gn(hn, xn.bind(null, e, t, n, r));
			}
			function xn(e, t, n, r) {
				if (_n) {
					if (0 < Ht.length && -1 < Yt.indexOf(e)) e = Qt(null, e, t, n, r), Ht.push(e);
					else {
						var i = Sn(e, t, n, r);
						if (i === null) $t(e, r);
						else if (-1 < Yt.indexOf(e)) e = Qt(i, e, t, n, r), Ht.push(e);
						else if (!tn(i, e, t, n, r)) {
							$t(e, r), e = It(e, r, null, t);
							try {
								ce(Lt, e);
							} finally {
								Ft(e);
							}
						}
					}
				}
			}
			function Sn(e, t, n, r) {
				if (n = Mt(r), n = tr(n), n !== null) {
					var i = Ct(n);
					if (i === null) n = null;
					else {
						var a = i.tag;
						if (a === 13) {
							if (n = wt(i), n !== null) return n;
							n = null;
						} else if (a === 3) {
							if (i.stateNode.hydrate) return i.tag === 3 ? i.stateNode.containerInfo : null;
							n = null;
						} else i !== n && (n = null);
					}
				}
				e = It(e, r, n, t);
				try {
					ce(Lt, e);
				} finally {
					Ft(e);
				}
				return null;
			}
			var Cn = {
				animationIterationCount: !0,
				borderImageOutset: !0,
				borderImageSlice: !0,
				borderImageWidth: !0,
				boxFlex: !0,
				boxFlexGroup: !0,
				boxOrdinalGroup: !0,
				columnCount: !0,
				columns: !0,
				flex: !0,
				flexGrow: !0,
				flexPositive: !0,
				flexShrink: !0,
				flexNegative: !0,
				flexOrder: !0,
				gridArea: !0,
				gridRow: !0,
				gridRowEnd: !0,
				gridRowSpan: !0,
				gridRowStart: !0,
				gridColumn: !0,
				gridColumnEnd: !0,
				gridColumnSpan: !0,
				gridColumnStart: !0,
				fontWeight: !0,
				lineClamp: !0,
				lineHeight: !0,
				opacity: !0,
				order: !0,
				orphans: !0,
				tabSize: !0,
				widows: !0,
				zIndex: !0,
				zoom: !0,
				fillOpacity: !0,
				floodOpacity: !0,
				stopOpacity: !0,
				strokeDasharray: !0,
				strokeDashoffset: !0,
				strokeMiterlimit: !0,
				strokeOpacity: !0,
				strokeWidth: !0
			}, wn = [
				"Webkit",
				"ms",
				"Moz",
				"O"
			];
			Object.keys(Cn).forEach(function(e) {
				wn.forEach(function(t) {
					t = t + e.charAt(0).toUpperCase() + e.substring(1), Cn[t] = Cn[e];
				});
			});
			function Tn(e, t, n) {
				return t == null || typeof t == "boolean" || t === "" ? "" : n || typeof t != "number" || t === 0 || Cn.hasOwnProperty(e) && Cn[e] ? ("" + t).trim() : t + "px";
			}
			function En(e, t) {
				for (var n in e = e.style, t) if (t.hasOwnProperty(n)) {
					var r = n.indexOf("--") === 0, i = Tn(n, t[n], r);
					n === "float" && (n = "cssFloat"), r ? e.setProperty(n, i) : e[n] = i;
				}
			}
			var Dn = n({ menuitem: !0 }, {
				area: !0,
				base: !0,
				br: !0,
				col: !0,
				embed: !0,
				hr: !0,
				img: !0,
				input: !0,
				keygen: !0,
				link: !0,
				meta: !0,
				param: !0,
				source: !0,
				track: !0,
				wbr: !0
			});
			function On(e, t) {
				if (t) {
					if (Dn[e] && (t.children != null || t.dangerouslySetInnerHTML != null)) throw Error(i(137, e, ""));
					if (t.dangerouslySetInnerHTML != null) {
						if (t.children != null) throw Error(i(60));
						if (!(typeof t.dangerouslySetInnerHTML == "object" && "__html" in t.dangerouslySetInnerHTML)) throw Error(i(61));
					}
					if (t.style != null && typeof t.style != "object") throw Error(i(62, ""));
				}
			}
			function kn(e, t) {
				if (e.indexOf("-") === -1) return typeof t.is == "string";
				switch (e) {
					case "annotation-xml":
					case "color-profile":
					case "font-face":
					case "font-face-src":
					case "font-face-uri":
					case "font-face-format":
					case "font-face-name":
					case "missing-glyph": return !1;
					default: return !0;
				}
			}
			var An = at.html;
			function jn(e, t) {
				e = e.nodeType === 9 || e.nodeType === 11 ? e : e.ownerDocument;
				var n = St(e);
				t = D[t];
				for (var r = 0; r < t.length; r++) R(t[r], e, n);
			}
			function Mn() {}
			function Nn(e) {
				if (e ||= typeof document < "u" ? document : void 0, e === void 0) return null;
				try {
					return e.activeElement || e.body;
				} catch {
					return e.body;
				}
			}
			function Pn(e) {
				for (; e && e.firstChild;) e = e.firstChild;
				return e;
			}
			function Fn(e, t) {
				var n = Pn(e);
				e = 0;
				for (var r; n;) {
					if (n.nodeType === 3) {
						if (r = e + n.textContent.length, e <= t && r >= t) return {
							node: n,
							offset: t - e
						};
						e = r;
					}
					a: {
						for (; n;) {
							if (n.nextSibling) {
								n = n.nextSibling;
								break a;
							}
							n = n.parentNode;
						}
						n = void 0;
					}
					n = Pn(n);
				}
			}
			function In(e, t) {
				return e && t ? e === t ? !0 : e && e.nodeType === 3 ? !1 : t && t.nodeType === 3 ? In(e, t.parentNode) : "contains" in e ? e.contains(t) : e.compareDocumentPosition ? !!(e.compareDocumentPosition(t) & 16) : !1 : !1;
			}
			function Ln() {
				for (var e = window, t = Nn(); t instanceof e.HTMLIFrameElement;) {
					try {
						var n = typeof t.contentWindow.location.href == "string";
					} catch {
						n = !1;
					}
					if (n) e = t.contentWindow;
					else break;
					t = Nn(e.document);
				}
				return t;
			}
			function Rn(e) {
				var t = e && e.nodeName && e.nodeName.toLowerCase();
				return t && (t === "input" && (e.type === "text" || e.type === "search" || e.type === "tel" || e.type === "url" || e.type === "password") || t === "textarea" || e.contentEditable === "true");
			}
			var zn = "$", Bn = "/$", Vn = "$?", Hn = "$!", Un = null, Wn = null;
			function Gn(e, t) {
				switch (e) {
					case "button":
					case "input":
					case "select":
					case "textarea": return !!t.autoFocus;
				}
				return !1;
			}
			function Kn(e, t) {
				return e === "textarea" || e === "option" || e === "noscript" || typeof t.children == "string" || typeof t.children == "number" || typeof t.dangerouslySetInnerHTML == "object" && t.dangerouslySetInnerHTML !== null && t.dangerouslySetInnerHTML.__html != null;
			}
			var qn = typeof setTimeout == "function" ? setTimeout : void 0, Jn = typeof clearTimeout == "function" ? clearTimeout : void 0;
			function Yn(e) {
				for (; e != null; e = e.nextSibling) {
					var t = e.nodeType;
					if (t === 1 || t === 3) break;
				}
				return e;
			}
			function Xn(e) {
				e = e.previousSibling;
				for (var t = 0; e;) {
					if (e.nodeType === 8) {
						var n = e.data;
						if (n === zn || n === Hn || n === Vn) {
							if (t === 0) return e;
							t--;
						} else n === Bn && t++;
					}
					e = e.previousSibling;
				}
				return null;
			}
			var Zn = Math.random().toString(36).slice(2), Qn = "__reactInternalInstance$" + Zn, $n = "__reactEventHandlers$" + Zn, er = "__reactContainere$" + Zn;
			function tr(e) {
				var t = e[Qn];
				if (t) return t;
				for (var n = e.parentNode; n;) {
					if (t = n[er] || n[Qn]) {
						if (n = t.alternate, t.child !== null || n !== null && n.child !== null) for (e = Xn(e); e !== null;) {
							if (n = e[Qn]) return n;
							e = Xn(e);
						}
						return t;
					}
					e = n, n = e.parentNode;
				}
				return null;
			}
			function nr(e) {
				return e = e[Qn] || e[er], !e || e.tag !== 5 && e.tag !== 6 && e.tag !== 13 && e.tag !== 3 ? null : e;
			}
			function rr(e) {
				if (e.tag === 5 || e.tag === 6) return e.stateNode;
				throw Error(i(33));
			}
			function ir(e) {
				return e[$n] || null;
			}
			function ar(e) {
				do
					e = e.return;
				while (e && e.tag !== 5);
				return e || null;
			}
			function or(e, t) {
				var n = e.stateNode;
				if (!n) return null;
				var r = h(n);
				if (!r) return null;
				n = r[t];
				a: switch (t) {
					case "onClick":
					case "onClickCapture":
					case "onDoubleClick":
					case "onDoubleClickCapture":
					case "onMouseDown":
					case "onMouseDownCapture":
					case "onMouseMove":
					case "onMouseMoveCapture":
					case "onMouseUp":
					case "onMouseUpCapture":
					case "onMouseEnter":
						(r = !r.disabled) || (e = e.type, r = e !== "button" && e !== "input" && e !== "select" && e !== "textarea"), e = !r;
						break a;
					default: e = !1;
				}
				if (e) return null;
				if (n && typeof n != "function") throw Error(i(231, t, typeof n));
				return n;
			}
			function sr(e, t, n) {
				(t = or(e, n.dispatchConfig.phasedRegistrationNames[t])) && (n._dispatchListeners = Dt(n._dispatchListeners, t), n._dispatchInstances = Dt(n._dispatchInstances, e));
			}
			function cr(e) {
				if (e && e.dispatchConfig.phasedRegistrationNames) {
					for (var t = e._targetInst, n = []; t;) n.push(t), t = ar(t);
					for (t = n.length; 0 < t--;) sr(n[t], "captured", e);
					for (t = 0; t < n.length; t++) sr(n[t], "bubbled", e);
				}
			}
			function lr(e, t, n) {
				e && n && n.dispatchConfig.registrationName && (t = or(e, n.dispatchConfig.registrationName)) && (n._dispatchListeners = Dt(n._dispatchListeners, t), n._dispatchInstances = Dt(n._dispatchInstances, e));
			}
			function ur(e) {
				e && e.dispatchConfig.registrationName && lr(e._targetInst, null, e);
			}
			function dr(e) {
				Ot(e, cr);
			}
			var fr = null, pr = null, mr = null;
			function hr() {
				if (mr) return mr;
				var e, t = pr, n = t.length, r, i = "value" in fr ? fr.value : fr.textContent, a = i.length;
				for (e = 0; e < n && t[e] === i[e]; e++);
				var o = n - e;
				for (r = 1; r <= o && t[n - r] === i[a - r]; r++);
				return mr = i.slice(e, 1 < r ? 1 - r : void 0);
			}
			function gr() {
				return !0;
			}
			function _r() {
				return !1;
			}
			function vr(e, t, n, r) {
				for (var i in this.dispatchConfig = e, this._targetInst = t, this.nativeEvent = n, e = this.constructor.Interface, e) e.hasOwnProperty(i) && ((t = e[i]) ? this[i] = t(n) : i === "target" ? this.target = r : this[i] = n[i]);
				return this.isDefaultPrevented = (n.defaultPrevented == null ? !1 === n.returnValue : n.defaultPrevented) ? gr : _r, this.isPropagationStopped = _r, this;
			}
			n(vr.prototype, {
				preventDefault: function() {
					this.defaultPrevented = !0;
					var e = this.nativeEvent;
					e && (e.preventDefault ? e.preventDefault() : typeof e.returnValue != "unknown" && (e.returnValue = !1), this.isDefaultPrevented = gr);
				},
				stopPropagation: function() {
					var e = this.nativeEvent;
					e && (e.stopPropagation ? e.stopPropagation() : typeof e.cancelBubble != "unknown" && (e.cancelBubble = !0), this.isPropagationStopped = gr);
				},
				persist: function() {
					this.isPersistent = gr;
				},
				isPersistent: _r,
				destructor: function() {
					var e = this.constructor.Interface, t;
					for (t in e) this[t] = null;
					this.nativeEvent = this._targetInst = this.dispatchConfig = null, this.isPropagationStopped = this.isDefaultPrevented = _r, this._dispatchInstances = this._dispatchListeners = null;
				}
			}), vr.Interface = {
				type: null,
				target: null,
				currentTarget: function() {
					return null;
				},
				eventPhase: null,
				bubbles: null,
				cancelable: null,
				timeStamp: function(e) {
					return e.timeStamp || Date.now();
				},
				defaultPrevented: null,
				isTrusted: null
			}, vr.extend = function(e) {
				function t() {}
				function r() {
					return i.apply(this, arguments);
				}
				var i = this;
				t.prototype = i.prototype;
				var a = new t();
				return n(a, r.prototype), r.prototype = a, r.prototype.constructor = r, r.Interface = n({}, i.Interface, e), r.extend = i.extend, xr(r), r;
			}, xr(vr);
			function yr(e, t, n, r) {
				if (this.eventPool.length) {
					var i = this.eventPool.pop();
					return this.call(i, e, t, n, r), i;
				}
				return new this(e, t, n, r);
			}
			function br(e) {
				if (!(e instanceof this)) throw Error(i(279));
				e.destructor(), 10 > this.eventPool.length && this.eventPool.push(e);
			}
			function xr(e) {
				e.eventPool = [], e.getPooled = yr, e.release = br;
			}
			var Sr = vr.extend({ data: null }), Cr = vr.extend({ data: null }), wr = [
				9,
				13,
				27,
				32
			], Tr = ee && "CompositionEvent" in window, Er = null;
			ee && "documentMode" in document && (Er = document.documentMode);
			var Dr = ee && "TextEvent" in window && !Er, Or = ee && (!Tr || Er && 8 < Er && 11 >= Er), kr = " ", Ar = {
				beforeInput: {
					phasedRegistrationNames: {
						bubbled: "onBeforeInput",
						captured: "onBeforeInputCapture"
					},
					dependencies: [
						"compositionend",
						"keypress",
						"textInput",
						"paste"
					]
				},
				compositionEnd: {
					phasedRegistrationNames: {
						bubbled: "onCompositionEnd",
						captured: "onCompositionEndCapture"
					},
					dependencies: "blur compositionend keydown keypress keyup mousedown".split(" ")
				},
				compositionStart: {
					phasedRegistrationNames: {
						bubbled: "onCompositionStart",
						captured: "onCompositionStartCapture"
					},
					dependencies: "blur compositionstart keydown keypress keyup mousedown".split(" ")
				},
				compositionUpdate: {
					phasedRegistrationNames: {
						bubbled: "onCompositionUpdate",
						captured: "onCompositionUpdateCapture"
					},
					dependencies: "blur compositionupdate keydown keypress keyup mousedown".split(" ")
				}
			}, jr = !1;
			function Mr(e, t) {
				switch (e) {
					case "keyup": return wr.indexOf(t.keyCode) !== -1;
					case "keydown": return t.keyCode !== 229;
					case "keypress":
					case "mousedown":
					case "blur": return !0;
					default: return !1;
				}
			}
			function Nr(e) {
				return e = e.detail, typeof e == "object" && "data" in e ? e.data : null;
			}
			var Pr = !1;
			function Fr(e, t) {
				switch (e) {
					case "compositionend": return Nr(t);
					case "keypress": return t.which === 32 ? (jr = !0, kr) : null;
					case "textInput": return e = t.data, e === kr && jr ? null : e;
					default: return null;
				}
			}
			function Ir(e, t) {
				if (Pr) return e === "compositionend" || !Tr && Mr(e, t) ? (e = hr(), mr = pr = fr = null, Pr = !1, e) : null;
				switch (e) {
					case "paste": return null;
					case "keypress":
						if (!(t.ctrlKey || t.altKey || t.metaKey) || t.ctrlKey && t.altKey) {
							if (t.char && 1 < t.char.length) return t.char;
							if (t.which) return String.fromCharCode(t.which);
						}
						return null;
					case "compositionend": return Or && t.locale !== "ko" ? null : t.data;
					default: return null;
				}
			}
			var Lr = {
				eventTypes: Ar,
				extractEvents: function(e, t, n, r) {
					var i;
					if (Tr) b: {
						switch (e) {
							case "compositionstart":
								var a = Ar.compositionStart;
								break b;
							case "compositionend":
								a = Ar.compositionEnd;
								break b;
							case "compositionupdate":
								a = Ar.compositionUpdate;
								break b;
						}
						a = void 0;
					}
					else Pr ? Mr(e, n) && (a = Ar.compositionEnd) : e === "keydown" && n.keyCode === 229 && (a = Ar.compositionStart);
					return a ? (Or && n.locale !== "ko" && (Pr || a !== Ar.compositionStart ? a === Ar.compositionEnd && Pr && (i = hr()) : (fr = r, pr = "value" in fr ? fr.value : fr.textContent, Pr = !0)), a = Sr.getPooled(a, t, n, r), i ? a.data = i : (i = Nr(n), i !== null && (a.data = i)), dr(a), i = a) : i = null, (e = Dr ? Fr(e, n) : Ir(e, n)) ? (t = Cr.getPooled(Ar.beforeInput, t, n, r), t.data = e, dr(t)) : t = null, i === null ? t : t === null ? i : [i, t];
				}
			}, Rr = {
				color: !0,
				date: !0,
				datetime: !0,
				"datetime-local": !0,
				email: !0,
				month: !0,
				number: !0,
				password: !0,
				range: !0,
				search: !0,
				tel: !0,
				text: !0,
				time: !0,
				url: !0,
				week: !0
			};
			function zr(e) {
				var t = e && e.nodeName && e.nodeName.toLowerCase();
				return t === "input" ? !!Rr[e.type] : t === "textarea";
			}
			var Br = { change: {
				phasedRegistrationNames: {
					bubbled: "onChange",
					captured: "onChangeCapture"
				},
				dependencies: "blur change click focus input keydown keyup selectionchange".split(" ")
			} };
			function Vr(e, t, n) {
				return e = vr.getPooled(Br.change, e, t, n), e.type = "change", te(n), dr(e), e;
			}
			var Hr = null, Ur = null;
			function Wr(e) {
				jt(e);
			}
			function Gr(e) {
				if (Ke(rr(e))) return e;
			}
			function Kr(e, t) {
				if (e === "change") return t;
			}
			var qr = !1;
			ee && (qr = Nt("input") && (!document.documentMode || 9 < document.documentMode));
			function Jr() {
				Hr && (Hr.detachEvent("onpropertychange", Yr), Ur = Hr = null);
			}
			function Yr(e) {
				if (e.propertyName === "value" && Gr(Ur)) {
					if (e = Vr(Ur, e, Mt(e)), oe) jt(e);
					else {
						oe = !0;
						try {
							ne(Wr, e);
						} finally {
							oe = !1, se();
						}
					}
				}
			}
			function Xr(e, t, n) {
				e === "focus" ? (Jr(), Hr = t, Ur = n, Hr.attachEvent("onpropertychange", Yr)) : e === "blur" && Jr();
			}
			function Zr(e) {
				if (e === "selectionchange" || e === "keyup" || e === "keydown") return Gr(Ur);
			}
			function Qr(e, t) {
				if (e === "click") return Gr(t);
			}
			function $r(e, t) {
				if (e === "input" || e === "change") return Gr(t);
			}
			var ei = {
				eventTypes: Br,
				_isInputEventSupported: qr,
				extractEvents: function(e, t, n, r) {
					var i = t ? rr(t) : window, a = i.nodeName && i.nodeName.toLowerCase();
					if (a === "select" || a === "input" && i.type === "file") var o = Kr;
					else if (zr(i)) {
						if (qr) o = $r;
						else {
							o = Zr;
							var s = Xr;
						}
					} else (a = i.nodeName) && a.toLowerCase() === "input" && (i.type === "checkbox" || i.type === "radio") && (o = Qr);
					if (o &&= o(e, t)) return Vr(o, n, r);
					s && s(e, i, t), e === "blur" && (e = i._wrapperState) && e.controlled && i.type === "number" && Ze(i, "number", i.value);
				}
			}, ti = vr.extend({
				view: null,
				detail: null
			}), ni = {
				Alt: "altKey",
				Control: "ctrlKey",
				Meta: "metaKey",
				Shift: "shiftKey"
			};
			function ri(e) {
				var t = this.nativeEvent;
				return t.getModifierState ? t.getModifierState(e) : (e = ni[e]) ? !!t[e] : !1;
			}
			function ii() {
				return ri;
			}
			var V = 0, ai = 0, oi = !1, si = !1, ci = ti.extend({
				screenX: null,
				screenY: null,
				clientX: null,
				clientY: null,
				pageX: null,
				pageY: null,
				ctrlKey: null,
				shiftKey: null,
				altKey: null,
				metaKey: null,
				getModifierState: ii,
				button: null,
				buttons: null,
				relatedTarget: function(e) {
					return e.relatedTarget || (e.fromElement === e.srcElement ? e.toElement : e.fromElement);
				},
				movementX: function(e) {
					if ("movementX" in e) return e.movementX;
					var t = V;
					return V = e.screenX, oi ? e.type === "mousemove" ? e.screenX - t : 0 : (oi = !0, 0);
				},
				movementY: function(e) {
					if ("movementY" in e) return e.movementY;
					var t = ai;
					return ai = e.screenY, si ? e.type === "mousemove" ? e.screenY - t : 0 : (si = !0, 0);
				}
			}), li = ci.extend({
				pointerId: null,
				width: null,
				height: null,
				pressure: null,
				tangentialPressure: null,
				tiltX: null,
				tiltY: null,
				twist: null,
				pointerType: null,
				isPrimary: null
			}), ui = {
				mouseEnter: {
					registrationName: "onMouseEnter",
					dependencies: ["mouseout", "mouseover"]
				},
				mouseLeave: {
					registrationName: "onMouseLeave",
					dependencies: ["mouseout", "mouseover"]
				},
				pointerEnter: {
					registrationName: "onPointerEnter",
					dependencies: ["pointerout", "pointerover"]
				},
				pointerLeave: {
					registrationName: "onPointerLeave",
					dependencies: ["pointerout", "pointerover"]
				}
			}, di = {
				eventTypes: ui,
				extractEvents: function(e, t, n, r, i) {
					var a = e === "mouseover" || e === "pointerover", o = e === "mouseout" || e === "pointerout";
					if (a && !(i & 32) && (n.relatedTarget || n.fromElement) || !o && !a) return null;
					if (a = r.window === r ? r : (a = r.ownerDocument) ? a.defaultView || a.parentWindow : window, o) {
						if (o = t, t = (t = n.relatedTarget || n.toElement) ? tr(t) : null, t !== null) {
							var s = Ct(t);
							(t !== s || t.tag !== 5 && t.tag !== 6) && (t = null);
						}
					} else o = null;
					if (o === t) return null;
					if (e === "mouseout" || e === "mouseover") var c = ci, l = ui.mouseLeave, u = ui.mouseEnter, d = "mouse";
					else (e === "pointerout" || e === "pointerover") && (c = li, l = ui.pointerLeave, u = ui.pointerEnter, d = "pointer");
					if (e = o == null ? a : rr(o), a = t == null ? a : rr(t), l = c.getPooled(l, o, n, r), l.type = d + "leave", l.target = e, l.relatedTarget = a, n = c.getPooled(u, t, n, r), n.type = d + "enter", n.target = a, n.relatedTarget = e, r = o, d = t, r && d) a: {
						for (c = r, u = d, o = 0, e = c; e; e = ar(e)) o++;
						for (e = 0, t = u; t; t = ar(t)) e++;
						for (; 0 < o - e;) c = ar(c), o--;
						for (; 0 < e - o;) u = ar(u), e--;
						for (; o--;) {
							if (c === u || c === u.alternate) break a;
							c = ar(c), u = ar(u);
						}
						c = null;
					}
					else c = null;
					for (u = c, c = []; r && r !== u && (o = r.alternate, o === null || o !== u);) c.push(r), r = ar(r);
					for (r = []; d && d !== u && (o = d.alternate, o === null || o !== u);) r.push(d), d = ar(d);
					for (d = 0; d < c.length; d++) lr(c[d], "bubbled", l);
					for (d = r.length; 0 < d--;) lr(r[d], "captured", n);
					return i & 64 ? [l, n] : [l];
				}
			};
			function fi(e, t) {
				return e === t && (e !== 0 || 1 / e == 1 / t) || e !== e && t !== t;
			}
			var pi = typeof Object.is == "function" ? Object.is : fi, mi = Object.prototype.hasOwnProperty;
			function hi(e, t) {
				if (pi(e, t)) return !0;
				if (typeof e != "object" || !e || typeof t != "object" || !t) return !1;
				var n = Object.keys(e), r = Object.keys(t);
				if (n.length !== r.length) return !1;
				for (r = 0; r < n.length; r++) if (!mi.call(t, n[r]) || !pi(e[n[r]], t[n[r]])) return !1;
				return !0;
			}
			var gi = ee && "documentMode" in document && 11 >= document.documentMode, _i = { select: {
				phasedRegistrationNames: {
					bubbled: "onSelect",
					captured: "onSelectCapture"
				},
				dependencies: "blur contextmenu dragend focus keydown keyup mousedown mouseup selectionchange".split(" ")
			} }, vi = null, yi = null, bi = null, xi = !1;
			function Si(e, t) {
				var n = t.window === t ? t.document : t.nodeType === 9 ? t : t.ownerDocument;
				return xi || vi == null || vi !== Nn(n) ? null : (n = vi, "selectionStart" in n && Rn(n) ? n = {
					start: n.selectionStart,
					end: n.selectionEnd
				} : (n = (n.ownerDocument && n.ownerDocument.defaultView || window).getSelection(), n = {
					anchorNode: n.anchorNode,
					anchorOffset: n.anchorOffset,
					focusNode: n.focusNode,
					focusOffset: n.focusOffset
				}), bi && hi(bi, n) ? null : (bi = n, e = vr.getPooled(_i.select, yi, e, t), e.type = "select", e.target = vi, dr(e), e));
			}
			var Ci = {
				eventTypes: _i,
				extractEvents: function(e, t, n, r, i, a) {
					if (i = a || (r.window === r ? r.document : r.nodeType === 9 ? r : r.ownerDocument), !(a = !i)) {
						a: {
							i = St(i), a = D.onSelect;
							for (var o = 0; o < a.length; o++) if (!i.has(a[o])) {
								i = !1;
								break a;
							}
							i = !0;
						}
						a = !i;
					}
					if (a) return null;
					switch (i = t ? rr(t) : window, e) {
						case "focus":
							(zr(i) || i.contentEditable === "true") && (vi = i, yi = t, bi = null);
							break;
						case "blur":
							bi = yi = vi = null;
							break;
						case "mousedown":
							xi = !0;
							break;
						case "contextmenu":
						case "mouseup":
						case "dragend": return xi = !1, Si(n, r);
						case "selectionchange": if (gi) break;
						case "keydown":
						case "keyup": return Si(n, r);
					}
					return null;
				}
			}, wi = vr.extend({
				animationName: null,
				elapsedTime: null,
				pseudoElement: null
			}), Ti = vr.extend({ clipboardData: function(e) {
				return "clipboardData" in e ? e.clipboardData : window.clipboardData;
			} }), Ei = ti.extend({ relatedTarget: null });
			function Di(e) {
				var t = e.keyCode;
				return "charCode" in e ? (e = e.charCode, e === 0 && t === 13 && (e = 13)) : e = t, e === 10 && (e = 13), 32 <= e || e === 13 ? e : 0;
			}
			var Oi = {
				Esc: "Escape",
				Spacebar: " ",
				Left: "ArrowLeft",
				Up: "ArrowUp",
				Right: "ArrowRight",
				Down: "ArrowDown",
				Del: "Delete",
				Win: "OS",
				Menu: "ContextMenu",
				Apps: "ContextMenu",
				Scroll: "ScrollLock",
				MozPrintableKey: "Unidentified"
			}, ki = {
				8: "Backspace",
				9: "Tab",
				12: "Clear",
				13: "Enter",
				16: "Shift",
				17: "Control",
				18: "Alt",
				19: "Pause",
				20: "CapsLock",
				27: "Escape",
				32: " ",
				33: "PageUp",
				34: "PageDown",
				35: "End",
				36: "Home",
				37: "ArrowLeft",
				38: "ArrowUp",
				39: "ArrowRight",
				40: "ArrowDown",
				45: "Insert",
				46: "Delete",
				112: "F1",
				113: "F2",
				114: "F3",
				115: "F4",
				116: "F5",
				117: "F6",
				118: "F7",
				119: "F8",
				120: "F9",
				121: "F10",
				122: "F11",
				123: "F12",
				144: "NumLock",
				145: "ScrollLock",
				224: "Meta"
			}, Ai = ti.extend({
				key: function(e) {
					if (e.key) {
						var t = Oi[e.key] || e.key;
						if (t !== "Unidentified") return t;
					}
					return e.type === "keypress" ? (e = Di(e), e === 13 ? "Enter" : String.fromCharCode(e)) : e.type === "keydown" || e.type === "keyup" ? ki[e.keyCode] || "Unidentified" : "";
				},
				location: null,
				ctrlKey: null,
				shiftKey: null,
				altKey: null,
				metaKey: null,
				repeat: null,
				locale: null,
				getModifierState: ii,
				charCode: function(e) {
					return e.type === "keypress" ? Di(e) : 0;
				},
				keyCode: function(e) {
					return e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
				},
				which: function(e) {
					return e.type === "keypress" ? Di(e) : e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
				}
			}), ji = ci.extend({ dataTransfer: null }), Mi = ti.extend({
				touches: null,
				targetTouches: null,
				changedTouches: null,
				altKey: null,
				metaKey: null,
				ctrlKey: null,
				shiftKey: null,
				getModifierState: ii
			}), Ni = vr.extend({
				propertyName: null,
				elapsedTime: null,
				pseudoElement: null
			}), Pi = ci.extend({
				deltaX: function(e) {
					return "deltaX" in e ? e.deltaX : "wheelDeltaX" in e ? -e.wheelDeltaX : 0;
				},
				deltaY: function(e) {
					return "deltaY" in e ? e.deltaY : "wheelDeltaY" in e ? -e.wheelDeltaY : "wheelDelta" in e ? -e.wheelDelta : 0;
				},
				deltaZ: null,
				deltaMode: null
			}), Fi = {
				eventTypes: cn,
				extractEvents: function(e, t, n, r) {
					var i = ln.get(e);
					if (!i) return null;
					switch (e) {
						case "keypress": if (Di(n) === 0) return null;
						case "keydown":
						case "keyup":
							e = Ai;
							break;
						case "blur":
						case "focus":
							e = Ei;
							break;
						case "click": if (n.button === 2) return null;
						case "auxclick":
						case "dblclick":
						case "mousedown":
						case "mousemove":
						case "mouseup":
						case "mouseout":
						case "mouseover":
						case "contextmenu":
							e = ci;
							break;
						case "drag":
						case "dragend":
						case "dragenter":
						case "dragexit":
						case "dragleave":
						case "dragover":
						case "dragstart":
						case "drop":
							e = ji;
							break;
						case "touchcancel":
						case "touchend":
						case "touchmove":
						case "touchstart":
							e = Mi;
							break;
						case gt:
						case _t:
						case vt:
							e = wi;
							break;
						case yt:
							e = Ni;
							break;
						case "scroll":
							e = ti;
							break;
						case "wheel":
							e = Pi;
							break;
						case "copy":
						case "cut":
						case "paste":
							e = Ti;
							break;
						case "gotpointercapture":
						case "lostpointercapture":
						case "pointercancel":
						case "pointerdown":
						case "pointermove":
						case "pointerout":
						case "pointerover":
						case "pointerup":
							e = li;
							break;
						default: e = vr;
					}
					return t = e.getPooled(i, t, n, r), dr(t), t;
				}
			};
			if (b) throw Error(i(101));
			b = Array.prototype.slice.call("ResponderEventPlugin SimpleEventPlugin EnterLeaveEventPlugin ChangeEventPlugin SelectEventPlugin BeforeInputEventPlugin".split(" ")), S();
			var Ii = nr;
			h = ir, _ = Ii, v = rr, O({
				SimpleEventPlugin: Fi,
				EnterLeaveEventPlugin: di,
				ChangeEventPlugin: ei,
				SelectEventPlugin: Ci,
				BeforeInputEventPlugin: Lr
			});
			var Li = [], Ri = -1;
			function H(e) {
				0 > Ri || (e.current = Li[Ri], Li[Ri] = null, Ri--);
			}
			function U(e, t) {
				Ri++, Li[Ri] = e.current, e.current = t;
			}
			var zi = {}, Bi = { current: zi }, Vi = { current: !1 }, Hi = zi;
			function Ui(e, t) {
				var n = e.type.contextTypes;
				if (!n) return zi;
				var r = e.stateNode;
				if (r && r.__reactInternalMemoizedUnmaskedChildContext === t) return r.__reactInternalMemoizedMaskedChildContext;
				var i = {}, a;
				for (a in n) i[a] = t[a];
				return r && (e = e.stateNode, e.__reactInternalMemoizedUnmaskedChildContext = t, e.__reactInternalMemoizedMaskedChildContext = i), i;
			}
			function Wi(e) {
				return e = e.childContextTypes, e != null;
			}
			function Gi() {
				H(Vi), H(Bi);
			}
			function Ki(e, t, n) {
				if (Bi.current !== zi) throw Error(i(168));
				U(Bi, t), U(Vi, n);
			}
			function qi(e, t, r) {
				var a = e.stateNode;
				if (e = t.childContextTypes, typeof a.getChildContext != "function") return r;
				for (var o in a = a.getChildContext(), a) if (!(o in e)) throw Error(i(108, Be(t) || "Unknown", o));
				return n({}, r, {}, a);
			}
			function Ji(e) {
				return e = (e = e.stateNode) && e.__reactInternalMemoizedMergedChildContext || zi, Hi = Bi.current, U(Bi, e), U(Vi, Vi.current), !0;
			}
			function Yi(e, t, n) {
				var r = e.stateNode;
				if (!r) throw Error(i(169));
				n ? (e = qi(e, t, Hi), r.__reactInternalMemoizedMergedChildContext = e, H(Vi), H(Bi), U(Bi, e)) : H(Vi), U(Vi, n);
			}
			var Xi = r.unstable_runWithPriority, Zi = r.unstable_scheduleCallback, Qi = r.unstable_cancelCallback, $i = r.unstable_requestPaint, ea = r.unstable_now, ta = r.unstable_getCurrentPriorityLevel, W = r.unstable_ImmediatePriority, na = r.unstable_UserBlockingPriority, ra = r.unstable_NormalPriority, ia = r.unstable_LowPriority, aa = r.unstable_IdlePriority, oa = {}, sa = r.unstable_shouldYield, ca = $i === void 0 ? function() {} : $i, la = null, ua = null, da = !1, fa = ea(), pa = 1e4 > fa ? ea : function() {
				return ea() - fa;
			};
			function ma() {
				switch (ta()) {
					case W: return 99;
					case na: return 98;
					case ra: return 97;
					case ia: return 96;
					case aa: return 95;
					default: throw Error(i(332));
				}
			}
			function ha(e) {
				switch (e) {
					case 99: return W;
					case 98: return na;
					case 97: return ra;
					case 96: return ia;
					case 95: return aa;
					default: throw Error(i(332));
				}
			}
			function ga(e, t) {
				return e = ha(e), Xi(e, t);
			}
			function _a(e, t, n) {
				return e = ha(e), Zi(e, t, n);
			}
			function va(e) {
				return la === null ? (la = [e], ua = Zi(W, ba)) : la.push(e), oa;
			}
			function ya() {
				if (ua !== null) {
					var e = ua;
					ua = null, Qi(e);
				}
				ba();
			}
			function ba() {
				if (!da && la !== null) {
					da = !0;
					var e = 0;
					try {
						var t = la;
						ga(99, function() {
							for (; e < t.length; e++) {
								var n = t[e];
								do
									n = n(!0);
								while (n !== null);
							}
						}), la = null;
					} catch (t) {
						throw la !== null && (la = la.slice(e + 1)), Zi(W, ya), t;
					} finally {
						da = !1;
					}
				}
			}
			function xa(e, t, n) {
				return n /= 10, 1073741821 - (((1073741821 - e + t / 10) / n | 0) + 1) * n;
			}
			function Sa(e, t) {
				if (e && e.defaultProps) for (var r in t = n({}, t), e = e.defaultProps, e) t[r] === void 0 && (t[r] = e[r]);
				return t;
			}
			var Ca = { current: null }, wa = null, G = null, Ta = null;
			function Ea() {
				Ta = G = wa = null;
			}
			function Da(e) {
				var t = Ca.current;
				H(Ca), e.type._context._currentValue = t;
			}
			function Oa(e, t) {
				for (; e !== null;) {
					var n = e.alternate;
					if (e.childExpirationTime < t) e.childExpirationTime = t, n !== null && n.childExpirationTime < t && (n.childExpirationTime = t);
					else if (n !== null && n.childExpirationTime < t) n.childExpirationTime = t;
					else break;
					e = e.return;
				}
			}
			function ka(e, t) {
				wa = e, Ta = G = null, e = e.dependencies, e !== null && e.firstContext !== null && (e.expirationTime >= t && ($o = !0), e.firstContext = null);
			}
			function K(e, t) {
				if (Ta !== e && !1 !== t && t !== 0) {
					if ((typeof t != "number" || t === 1073741823) && (Ta = e, t = 1073741823), t = {
						context: e,
						observedBits: t,
						next: null
					}, G === null) {
						if (wa === null) throw Error(i(308));
						G = t, wa.dependencies = {
							expirationTime: 0,
							firstContext: t,
							responders: null
						};
					} else G = G.next = t;
				}
				return e._currentValue;
			}
			var Aa = !1;
			function ja(e) {
				e.updateQueue = {
					baseState: e.memoizedState,
					baseQueue: null,
					shared: { pending: null },
					effects: null
				};
			}
			function Ma(e, t) {
				e = e.updateQueue, t.updateQueue === e && (t.updateQueue = {
					baseState: e.baseState,
					baseQueue: e.baseQueue,
					shared: e.shared,
					effects: e.effects
				});
			}
			function Na(e, t) {
				return e = {
					expirationTime: e,
					suspenseConfig: t,
					tag: 0,
					payload: null,
					callback: null,
					next: null
				}, e.next = e;
			}
			function Pa(e, t) {
				if (e = e.updateQueue, e !== null) {
					e = e.shared;
					var n = e.pending;
					n === null ? t.next = t : (t.next = n.next, n.next = t), e.pending = t;
				}
			}
			function Fa(e, t) {
				var n = e.alternate;
				n !== null && Ma(n, e), e = e.updateQueue, n = e.baseQueue, n === null ? (e.baseQueue = t.next = t, t.next = t) : (t.next = n.next, n.next = t);
			}
			function Ia(e, t, r, i) {
				var a = e.updateQueue;
				Aa = !1;
				var o = a.baseQueue, s = a.shared.pending;
				if (s !== null) {
					if (o !== null) {
						var c = o.next;
						o.next = s.next, s.next = c;
					}
					o = s, a.shared.pending = null, c = e.alternate, c !== null && (c = c.updateQueue, c !== null && (c.baseQueue = s));
				}
				if (o !== null) {
					c = o.next;
					var l = a.baseState, u = 0, d = null, f = null, p = null;
					if (c !== null) {
						var m = c;
						do {
							if (s = m.expirationTime, s < i) {
								var h = {
									expirationTime: m.expirationTime,
									suspenseConfig: m.suspenseConfig,
									tag: m.tag,
									payload: m.payload,
									callback: m.callback,
									next: null
								};
								p === null ? (f = p = h, d = l) : p = p.next = h, s > u && (u = s);
							} else {
								p !== null && (p = p.next = {
									expirationTime: 1073741823,
									suspenseConfig: m.suspenseConfig,
									tag: m.tag,
									payload: m.payload,
									callback: m.callback,
									next: null
								}), Ic(s, m.suspenseConfig);
								a: {
									var g = e, _ = m;
									switch (s = t, h = r, _.tag) {
										case 1:
											if (g = _.payload, typeof g == "function") {
												l = g.call(h, l, s);
												break a;
											}
											l = g;
											break a;
										case 3: g.effectTag = g.effectTag & -4097 | 64;
										case 0:
											if (g = _.payload, s = typeof g == "function" ? g.call(h, l, s) : g, s == null) break a;
											l = n({}, l, s);
											break a;
										case 2: Aa = !0;
									}
								}
								m.callback !== null && (e.effectTag |= 32, s = a.effects, s === null ? a.effects = [m] : s.push(m));
							}
							if (m = m.next, m === null || m === c) {
								if (s = a.shared.pending, s === null) break;
								m = o.next = s.next, s.next = c, a.baseQueue = o = s, a.shared.pending = null;
							}
						} while (1);
					}
					p === null ? d = l : p.next = f, a.baseState = d, a.baseQueue = p, Lc(u), e.expirationTime = u, e.memoizedState = l;
				}
			}
			function La(e, t, n) {
				if (e = t.effects, t.effects = null, e !== null) for (t = 0; t < e.length; t++) {
					var r = e[t], a = r.callback;
					if (a !== null) {
						if (r.callback = null, r = a, a = n, typeof r != "function") throw Error(i(191, r));
						r.call(a);
					}
				}
			}
			var Ra = ye.ReactCurrentBatchConfig, za = new t.Component().refs;
			function Ba(e, t, r, i) {
				t = e.memoizedState, r = r(i, t), r = r == null ? t : n({}, t, r), e.memoizedState = r, e.expirationTime === 0 && (e.updateQueue.baseState = r);
			}
			var Va = {
				isMounted: function(e) {
					return (e = e._reactInternalFiber) ? Ct(e) === e : !1;
				},
				enqueueSetState: function(e, t, n) {
					e = e._reactInternalFiber;
					var r = Sc(), i = Ra.suspense;
					r = Cc(r, e, i), i = Na(r, i), i.payload = t, n != null && (i.callback = n), Pa(e, i), wc(e, r);
				},
				enqueueReplaceState: function(e, t, n) {
					e = e._reactInternalFiber;
					var r = Sc(), i = Ra.suspense;
					r = Cc(r, e, i), i = Na(r, i), i.tag = 1, i.payload = t, n != null && (i.callback = n), Pa(e, i), wc(e, r);
				},
				enqueueForceUpdate: function(e, t) {
					e = e._reactInternalFiber;
					var n = Sc(), r = Ra.suspense;
					n = Cc(n, e, r), r = Na(n, r), r.tag = 2, t != null && (r.callback = t), Pa(e, r), wc(e, n);
				}
			};
			function Ha(e, t, n, r, i, a, o) {
				return e = e.stateNode, typeof e.shouldComponentUpdate == "function" ? e.shouldComponentUpdate(r, a, o) : t.prototype && t.prototype.isPureReactComponent ? !hi(n, r) || !hi(i, a) : !0;
			}
			function Ua(e, t, n) {
				var r = !1, i = zi, a = t.contextType;
				return typeof a == "object" && a ? a = K(a) : (i = Wi(t) ? Hi : Bi.current, r = t.contextTypes, a = (r = r != null) ? Ui(e, i) : zi), t = new t(n, a), e.memoizedState = t.state !== null && t.state !== void 0 ? t.state : null, t.updater = Va, e.stateNode = t, t._reactInternalFiber = e, r && (e = e.stateNode, e.__reactInternalMemoizedUnmaskedChildContext = i, e.__reactInternalMemoizedMaskedChildContext = a), t;
			}
			function Wa(e, t, n, r) {
				e = t.state, typeof t.componentWillReceiveProps == "function" && t.componentWillReceiveProps(n, r), typeof t.UNSAFE_componentWillReceiveProps == "function" && t.UNSAFE_componentWillReceiveProps(n, r), t.state !== e && Va.enqueueReplaceState(t, t.state, null);
			}
			function Ga(e, t, n, r) {
				var i = e.stateNode;
				i.props = n, i.state = e.memoizedState, i.refs = za, ja(e);
				var a = t.contextType;
				typeof a == "object" && a ? i.context = K(a) : (a = Wi(t) ? Hi : Bi.current, i.context = Ui(e, a)), Ia(e, n, i, r), i.state = e.memoizedState, a = t.getDerivedStateFromProps, typeof a == "function" && (Ba(e, t, a, n), i.state = e.memoizedState), typeof t.getDerivedStateFromProps == "function" || typeof i.getSnapshotBeforeUpdate == "function" || typeof i.UNSAFE_componentWillMount != "function" && typeof i.componentWillMount != "function" || (t = i.state, typeof i.componentWillMount == "function" && i.componentWillMount(), typeof i.UNSAFE_componentWillMount == "function" && i.UNSAFE_componentWillMount(), t !== i.state && Va.enqueueReplaceState(i, i.state, null), Ia(e, n, i, r), i.state = e.memoizedState), typeof i.componentDidMount == "function" && (e.effectTag |= 4);
			}
			var Ka = Array.isArray;
			function qa(e, t, n) {
				if (e = n.ref, e !== null && typeof e != "function" && typeof e != "object") {
					if (n._owner) {
						if (n = n._owner, n) {
							if (n.tag !== 1) throw Error(i(309));
							var r = n.stateNode;
						}
						if (!r) throw Error(i(147, e));
						var a = "" + e;
						return t !== null && t.ref !== null && typeof t.ref == "function" && t.ref._stringRef === a ? t.ref : (t = function(e) {
							var t = r.refs;
							t === za && (t = r.refs = {}), e === null ? delete t[a] : t[a] = e;
						}, t._stringRef = a, t);
					}
					if (typeof e != "string") throw Error(i(284));
					if (!n._owner) throw Error(i(290, e));
				}
				return e;
			}
			function Ja(e, t) {
				if (e.type !== "textarea") throw Error(i(31, Object.prototype.toString.call(t) === "[object Object]" ? "object with keys {" + Object.keys(t).join(", ") + "}" : t, ""));
			}
			function Ya(e) {
				function t(t, n) {
					if (e) {
						var r = t.lastEffect;
						r === null ? t.firstEffect = t.lastEffect = n : (r.nextEffect = n, t.lastEffect = n), n.nextEffect = null, n.effectTag = 8;
					}
				}
				function n(n, r) {
					if (!e) return null;
					for (; r !== null;) t(n, r), r = r.sibling;
					return null;
				}
				function r(e, t) {
					for (e = /* @__PURE__ */ new Map(); t !== null;) t.key === null ? e.set(t.index, t) : e.set(t.key, t), t = t.sibling;
					return e;
				}
				function a(e, t) {
					return e = ol(e, t), e.index = 0, e.sibling = null, e;
				}
				function o(t, n, r) {
					return t.index = r, e ? (r = t.alternate, r === null ? (t.effectTag = 2, n) : (r = r.index, r < n ? (t.effectTag = 2, n) : r)) : n;
				}
				function s(t) {
					return e && t.alternate === null && (t.effectTag = 2), t;
				}
				function c(e, t, n, r) {
					return t === null || t.tag !== 6 ? (t = ll(n, e.mode, r), t.return = e, t) : (t = a(t, n), t.return = e, t);
				}
				function l(e, t, n, r) {
					return t !== null && t.elementType === n.type ? (r = a(t, n.props), r.ref = qa(e, t, n), r.return = e, r) : (r = sl(n.type, n.key, n.props, null, e.mode, r), r.ref = qa(e, t, n), r.return = e, r);
				}
				function u(e, t, n, r) {
					return t === null || t.tag !== 4 || t.stateNode.containerInfo !== n.containerInfo || t.stateNode.implementation !== n.implementation ? (t = ul(n, e.mode, r), t.return = e, t) : (t = a(t, n.children || []), t.return = e, t);
				}
				function d(e, t, n, r, i) {
					return t === null || t.tag !== 7 ? (t = cl(n, e.mode, r, i), t.return = e, t) : (t = a(t, n), t.return = e, t);
				}
				function f(e, t, n) {
					if (typeof t == "string" || typeof t == "number") return t = ll("" + t, e.mode, n), t.return = e, t;
					if (typeof t == "object" && t) {
						switch (t.$$typeof) {
							case Ce: return n = sl(t.type, t.key, t.props, null, e.mode, n), n.ref = qa(e, null, t), n.return = e, n;
							case we: return t = ul(t, e.mode, n), t.return = e, t;
						}
						if (Ka(t) || Re(t)) return t = cl(t, e.mode, n, null), t.return = e, t;
						Ja(e, t);
					}
					return null;
				}
				function p(e, t, n, r) {
					var i = t === null ? null : t.key;
					if (typeof n == "string" || typeof n == "number") return i === null ? c(e, t, "" + n, r) : null;
					if (typeof n == "object" && n) {
						switch (n.$$typeof) {
							case Ce: return n.key === i ? n.type === Te ? d(e, t, n.props.children, r, i) : l(e, t, n, r) : null;
							case we: return n.key === i ? u(e, t, n, r) : null;
						}
						if (Ka(n) || Re(n)) return i === null ? d(e, t, n, r, null) : null;
						Ja(e, n);
					}
					return null;
				}
				function m(e, t, n, r, i) {
					if (typeof r == "string" || typeof r == "number") return e = e.get(n) || null, c(t, e, "" + r, i);
					if (typeof r == "object" && r) {
						switch (r.$$typeof) {
							case Ce: return e = e.get(r.key === null ? n : r.key) || null, r.type === Te ? d(t, e, r.props.children, i, r.key) : l(t, e, r, i);
							case we: return e = e.get(r.key === null ? n : r.key) || null, u(t, e, r, i);
						}
						if (Ka(r) || Re(r)) return e = e.get(n) || null, d(t, e, r, i, null);
						Ja(t, r);
					}
					return null;
				}
				function h(i, a, s, c) {
					for (var l = null, u = null, d = a, h = a = 0, g = null; d !== null && h < s.length; h++) {
						d.index > h ? (g = d, d = null) : g = d.sibling;
						var _ = p(i, d, s[h], c);
						if (_ === null) {
							d === null && (d = g);
							break;
						}
						e && d && _.alternate === null && t(i, d), a = o(_, a, h), u === null ? l = _ : u.sibling = _, u = _, d = g;
					}
					if (h === s.length) return n(i, d), l;
					if (d === null) {
						for (; h < s.length; h++) d = f(i, s[h], c), d !== null && (a = o(d, a, h), u === null ? l = d : u.sibling = d, u = d);
						return l;
					}
					for (d = r(i, d); h < s.length; h++) g = m(d, i, h, s[h], c), g !== null && (e && g.alternate !== null && d.delete(g.key === null ? h : g.key), a = o(g, a, h), u === null ? l = g : u.sibling = g, u = g);
					return e && d.forEach(function(e) {
						return t(i, e);
					}), l;
				}
				function g(a, s, c, l) {
					var u = Re(c);
					if (typeof u != "function") throw Error(i(150));
					if (c = u.call(c), c == null) throw Error(i(151));
					for (var d = u = null, h = s, g = s = 0, _ = null, v = c.next(); h !== null && !v.done; g++, v = c.next()) {
						h.index > g ? (_ = h, h = null) : _ = h.sibling;
						var y = p(a, h, v.value, l);
						if (y === null) {
							h === null && (h = _);
							break;
						}
						e && h && y.alternate === null && t(a, h), s = o(y, s, g), d === null ? u = y : d.sibling = y, d = y, h = _;
					}
					if (v.done) return n(a, h), u;
					if (h === null) {
						for (; !v.done; g++, v = c.next()) v = f(a, v.value, l), v !== null && (s = o(v, s, g), d === null ? u = v : d.sibling = v, d = v);
						return u;
					}
					for (h = r(a, h); !v.done; g++, v = c.next()) v = m(h, a, g, v.value, l), v !== null && (e && v.alternate !== null && h.delete(v.key === null ? g : v.key), s = o(v, s, g), d === null ? u = v : d.sibling = v, d = v);
					return e && h.forEach(function(e) {
						return t(a, e);
					}), u;
				}
				return function(e, r, o, c) {
					var l = typeof o == "object" && !!o && o.type === Te && o.key === null;
					l && (o = o.props.children);
					var u = typeof o == "object" && !!o;
					if (u) switch (o.$$typeof) {
						case Ce:
							a: {
								for (u = o.key, l = r; l !== null;) {
									if (l.key === u) {
										switch (l.tag) {
											case 7:
												if (o.type === Te) {
													n(e, l.sibling), r = a(l, o.props.children), r.return = e, e = r;
													break a;
												}
												break;
											default: if (l.elementType === o.type) {
												n(e, l.sibling), r = a(l, o.props), r.ref = qa(e, l, o), r.return = e, e = r;
												break a;
											}
										}
										n(e, l);
										break;
									}
									t(e, l), l = l.sibling;
								}
								o.type === Te ? (r = cl(o.props.children, e.mode, c, o.key), r.return = e, e = r) : (c = sl(o.type, o.key, o.props, null, e.mode, c), c.ref = qa(e, r, o), c.return = e, e = c);
							}
							return s(e);
						case we:
							a: {
								for (l = o.key; r !== null;) {
									if (r.key === l) {
										if (r.tag === 4 && r.stateNode.containerInfo === o.containerInfo && r.stateNode.implementation === o.implementation) {
											n(e, r.sibling), r = a(r, o.children || []), r.return = e, e = r;
											break a;
										}
										n(e, r);
										break;
									}
									t(e, r), r = r.sibling;
								}
								r = ul(o, e.mode, c), r.return = e, e = r;
							}
							return s(e);
					}
					if (typeof o == "string" || typeof o == "number") return o = "" + o, r !== null && r.tag === 6 ? (n(e, r.sibling), r = a(r, o), r.return = e, e = r) : (n(e, r), r = ll(o, e.mode, c), r.return = e, e = r), s(e);
					if (Ka(o)) return h(e, r, o, c);
					if (Re(o)) return g(e, r, o, c);
					if (u && Ja(e, o), o === void 0 && !l) switch (e.tag) {
						case 1:
						case 0: throw e = e.type, Error(i(152, e.displayName || e.name || "Component"));
					}
					return n(e, r);
				};
			}
			var Xa = Ya(!0), Za = Ya(!1), Qa = {}, $a = { current: Qa }, eo = { current: Qa }, to = { current: Qa };
			function no(e) {
				if (e === Qa) throw Error(i(174));
				return e;
			}
			function ro(e, t) {
				switch (U(to, t), U(eo, e), U($a, Qa), e = t.nodeType, e) {
					case 9:
					case 11:
						t = (t = t.documentElement) ? t.namespaceURI : st(null, "");
						break;
					default: e = e === 8 ? t.parentNode : t, t = e.namespaceURI || null, e = e.tagName, t = st(t, e);
				}
				H($a), U($a, t);
			}
			function io() {
				H($a), H(eo), H(to);
			}
			function ao(e) {
				no(to.current);
				var t = no($a.current), n = st(t, e.type);
				t !== n && (U(eo, e), U($a, n));
			}
			function oo(e) {
				eo.current === e && (H($a), H(eo));
			}
			var q = { current: 0 };
			function so(e) {
				for (var t = e; t !== null;) {
					if (t.tag === 13) {
						var n = t.memoizedState;
						if (n !== null && (n = n.dehydrated, n === null || n.data === Vn || n.data === Hn)) return t;
					} else if (t.tag === 19 && t.memoizedProps.revealOrder !== void 0) {
						if (t.effectTag & 64) return t;
					} else if (t.child !== null) {
						t.child.return = t, t = t.child;
						continue;
					}
					if (t === e) break;
					for (; t.sibling === null;) {
						if (t.return === null || t.return === e) return null;
						t = t.return;
					}
					t.sibling.return = t.return, t = t.sibling;
				}
				return null;
			}
			function co(e, t) {
				return {
					responder: e,
					props: t
				};
			}
			var lo = ye.ReactCurrentDispatcher, uo = ye.ReactCurrentBatchConfig, fo = 0, J = null, Y = null, po = null, mo = !1;
			function ho() {
				throw Error(i(321));
			}
			function go(e, t) {
				if (t === null) return !1;
				for (var n = 0; n < t.length && n < e.length; n++) if (!pi(e[n], t[n])) return !1;
				return !0;
			}
			function _o(e, t, n, r, a, o) {
				if (fo = o, J = t, t.memoizedState = null, t.updateQueue = null, t.expirationTime = 0, lo.current = e === null || e.memoizedState === null ? Bo : Vo, e = n(r, a), t.expirationTime === fo) {
					o = 0;
					do {
						if (t.expirationTime = 0, !(25 > o)) throw Error(i(301));
						o += 1, po = Y = null, t.updateQueue = null, lo.current = Ho, e = n(r, a);
					} while (t.expirationTime === fo);
				}
				if (lo.current = zo, t = Y !== null && Y.next !== null, fo = 0, po = Y = J = null, mo = !1, t) throw Error(i(300));
				return e;
			}
			function vo() {
				var e = {
					memoizedState: null,
					baseState: null,
					baseQueue: null,
					queue: null,
					next: null
				};
				return po === null ? J.memoizedState = po = e : po = po.next = e, po;
			}
			function yo() {
				if (Y === null) {
					var e = J.alternate;
					e = e === null ? null : e.memoizedState;
				} else e = Y.next;
				var t = po === null ? J.memoizedState : po.next;
				if (t !== null) po = t, Y = e;
				else {
					if (e === null) throw Error(i(310));
					Y = e, e = {
						memoizedState: Y.memoizedState,
						baseState: Y.baseState,
						baseQueue: Y.baseQueue,
						queue: Y.queue,
						next: null
					}, po === null ? J.memoizedState = po = e : po = po.next = e;
				}
				return po;
			}
			function bo(e, t) {
				return typeof t == "function" ? t(e) : t;
			}
			function xo(e) {
				var t = yo(), n = t.queue;
				if (n === null) throw Error(i(311));
				n.lastRenderedReducer = e;
				var r = Y, a = r.baseQueue, o = n.pending;
				if (o !== null) {
					if (a !== null) {
						var s = a.next;
						a.next = o.next, o.next = s;
					}
					r.baseQueue = a = o, n.pending = null;
				}
				if (a !== null) {
					a = a.next, r = r.baseState;
					var c = s = o = null, l = a;
					do {
						var u = l.expirationTime;
						if (u < fo) {
							var d = {
								expirationTime: l.expirationTime,
								suspenseConfig: l.suspenseConfig,
								action: l.action,
								eagerReducer: l.eagerReducer,
								eagerState: l.eagerState,
								next: null
							};
							c === null ? (s = c = d, o = r) : c = c.next = d, u > J.expirationTime && (J.expirationTime = u, Lc(u));
						} else c !== null && (c = c.next = {
							expirationTime: 1073741823,
							suspenseConfig: l.suspenseConfig,
							action: l.action,
							eagerReducer: l.eagerReducer,
							eagerState: l.eagerState,
							next: null
						}), Ic(u, l.suspenseConfig), r = l.eagerReducer === e ? l.eagerState : e(r, l.action);
						l = l.next;
					} while (l !== null && l !== a);
					c === null ? o = r : c.next = s, pi(r, t.memoizedState) || ($o = !0), t.memoizedState = r, t.baseState = o, t.baseQueue = c, n.lastRenderedState = r;
				}
				return [t.memoizedState, n.dispatch];
			}
			function So(e) {
				var t = yo(), n = t.queue;
				if (n === null) throw Error(i(311));
				n.lastRenderedReducer = e;
				var r = n.dispatch, a = n.pending, o = t.memoizedState;
				if (a !== null) {
					n.pending = null;
					var s = a = a.next;
					do
						o = e(o, s.action), s = s.next;
					while (s !== a);
					pi(o, t.memoizedState) || ($o = !0), t.memoizedState = o, t.baseQueue === null && (t.baseState = o), n.lastRenderedState = o;
				}
				return [o, r];
			}
			function Co(e) {
				var t = vo();
				return typeof e == "function" && (e = e()), t.memoizedState = t.baseState = e, e = t.queue = {
					pending: null,
					dispatch: null,
					lastRenderedReducer: bo,
					lastRenderedState: e
				}, e = e.dispatch = Ro.bind(null, J, e), [t.memoizedState, e];
			}
			function wo(e, t, n, r) {
				return e = {
					tag: e,
					create: t,
					destroy: n,
					deps: r,
					next: null
				}, t = J.updateQueue, t === null ? (t = { lastEffect: null }, J.updateQueue = t, t.lastEffect = e.next = e) : (n = t.lastEffect, n === null ? t.lastEffect = e.next = e : (r = n.next, n.next = e, e.next = r, t.lastEffect = e)), e;
			}
			function To() {
				return yo().memoizedState;
			}
			function Eo(e, t, n, r) {
				var i = vo();
				J.effectTag |= e, i.memoizedState = wo(1 | t, n, void 0, r === void 0 ? null : r);
			}
			function Do(e, t, n, r) {
				var i = yo();
				r = r === void 0 ? null : r;
				var a = void 0;
				if (Y !== null) {
					var o = Y.memoizedState;
					if (a = o.destroy, r !== null && go(r, o.deps)) {
						wo(t, n, a, r);
						return;
					}
				}
				J.effectTag |= e, i.memoizedState = wo(1 | t, n, a, r);
			}
			function Oo(e, t) {
				return Eo(516, 4, e, t);
			}
			function ko(e, t) {
				return Do(516, 4, e, t);
			}
			function Ao(e, t) {
				return Do(4, 2, e, t);
			}
			function jo(e, t) {
				if (typeof t == "function") return e = e(), t(e), function() {
					t(null);
				};
				if (t != null) return e = e(), t.current = e, function() {
					t.current = null;
				};
			}
			function Mo(e, t, n) {
				return n = n == null ? null : n.concat([e]), Do(4, 2, jo.bind(null, t, e), n);
			}
			function No() {}
			function Po(e, t) {
				return vo().memoizedState = [e, t === void 0 ? null : t], e;
			}
			function Fo(e, t) {
				var n = yo();
				t = t === void 0 ? null : t;
				var r = n.memoizedState;
				return r !== null && t !== null && go(t, r[1]) ? r[0] : (n.memoizedState = [e, t], e);
			}
			function Io(e, t) {
				var n = yo();
				t = t === void 0 ? null : t;
				var r = n.memoizedState;
				return r !== null && t !== null && go(t, r[1]) ? r[0] : (e = e(), n.memoizedState = [e, t], e);
			}
			function Lo(e, t, n) {
				var r = ma();
				ga(98 > r ? 98 : r, function() {
					e(!0);
				}), ga(97 < r ? 97 : r, function() {
					var r = uo.suspense;
					uo.suspense = t === void 0 ? null : t;
					try {
						e(!1), n();
					} finally {
						uo.suspense = r;
					}
				});
			}
			function Ro(e, t, n) {
				var r = Sc(), i = Ra.suspense;
				r = Cc(r, e, i), i = {
					expirationTime: r,
					suspenseConfig: i,
					action: n,
					eagerReducer: null,
					eagerState: null,
					next: null
				};
				var a = t.pending;
				if (a === null ? i.next = i : (i.next = a.next, a.next = i), t.pending = i, a = e.alternate, e === J || a !== null && a === J) mo = !0, i.expirationTime = fo, J.expirationTime = fo;
				else {
					if (e.expirationTime === 0 && (a === null || a.expirationTime === 0) && (a = t.lastRenderedReducer, a !== null)) try {
						var o = t.lastRenderedState, s = a(o, n);
						if (i.eagerReducer = a, i.eagerState = s, pi(s, o)) return;
					} catch {}
					wc(e, r);
				}
			}
			var zo = {
				readContext: K,
				useCallback: ho,
				useContext: ho,
				useEffect: ho,
				useImperativeHandle: ho,
				useLayoutEffect: ho,
				useMemo: ho,
				useReducer: ho,
				useRef: ho,
				useState: ho,
				useDebugValue: ho,
				useResponder: ho,
				useDeferredValue: ho,
				useTransition: ho
			}, Bo = {
				readContext: K,
				useCallback: Po,
				useContext: K,
				useEffect: Oo,
				useImperativeHandle: function(e, t, n) {
					return n = n == null ? null : n.concat([e]), Eo(4, 2, jo.bind(null, t, e), n);
				},
				useLayoutEffect: function(e, t) {
					return Eo(4, 2, e, t);
				},
				useMemo: function(e, t) {
					var n = vo();
					return t = t === void 0 ? null : t, e = e(), n.memoizedState = [e, t], e;
				},
				useReducer: function(e, t, n) {
					var r = vo();
					return t = n === void 0 ? t : n(t), r.memoizedState = r.baseState = t, e = r.queue = {
						pending: null,
						dispatch: null,
						lastRenderedReducer: e,
						lastRenderedState: t
					}, e = e.dispatch = Ro.bind(null, J, e), [r.memoizedState, e];
				},
				useRef: function(e) {
					var t = vo();
					return e = { current: e }, t.memoizedState = e;
				},
				useState: Co,
				useDebugValue: No,
				useResponder: co,
				useDeferredValue: function(e, t) {
					var n = Co(e), r = n[0], i = n[1];
					return Oo(function() {
						var n = uo.suspense;
						uo.suspense = t === void 0 ? null : t;
						try {
							i(e);
						} finally {
							uo.suspense = n;
						}
					}, [e, t]), r;
				},
				useTransition: function(e) {
					var t = Co(!1), n = t[0];
					return t = t[1], [Po(Lo.bind(null, t, e), [t, e]), n];
				}
			}, Vo = {
				readContext: K,
				useCallback: Fo,
				useContext: K,
				useEffect: ko,
				useImperativeHandle: Mo,
				useLayoutEffect: Ao,
				useMemo: Io,
				useReducer: xo,
				useRef: To,
				useState: function() {
					return xo(bo);
				},
				useDebugValue: No,
				useResponder: co,
				useDeferredValue: function(e, t) {
					var n = xo(bo), r = n[0], i = n[1];
					return ko(function() {
						var n = uo.suspense;
						uo.suspense = t === void 0 ? null : t;
						try {
							i(e);
						} finally {
							uo.suspense = n;
						}
					}, [e, t]), r;
				},
				useTransition: function(e) {
					var t = xo(bo), n = t[0];
					return t = t[1], [Fo(Lo.bind(null, t, e), [t, e]), n];
				}
			}, Ho = {
				readContext: K,
				useCallback: Fo,
				useContext: K,
				useEffect: ko,
				useImperativeHandle: Mo,
				useLayoutEffect: Ao,
				useMemo: Io,
				useReducer: So,
				useRef: To,
				useState: function() {
					return So(bo);
				},
				useDebugValue: No,
				useResponder: co,
				useDeferredValue: function(e, t) {
					var n = So(bo), r = n[0], i = n[1];
					return ko(function() {
						var n = uo.suspense;
						uo.suspense = t === void 0 ? null : t;
						try {
							i(e);
						} finally {
							uo.suspense = n;
						}
					}, [e, t]), r;
				},
				useTransition: function(e) {
					var t = So(bo), n = t[0];
					return t = t[1], [Fo(Lo.bind(null, t, e), [t, e]), n];
				}
			}, Uo = null, Wo = null, Go = !1;
			function Ko(e, t) {
				var n = rl(5, null, null, 0);
				n.elementType = "DELETED", n.type = "DELETED", n.stateNode = t, n.return = e, n.effectTag = 8, e.lastEffect === null ? e.firstEffect = e.lastEffect = n : (e.lastEffect.nextEffect = n, e.lastEffect = n);
			}
			function qo(e, t) {
				switch (e.tag) {
					case 5:
						var n = e.type;
						return t = t.nodeType !== 1 || n.toLowerCase() !== t.nodeName.toLowerCase() ? null : t, t !== null && (e.stateNode = t, !0);
					case 6: return t = e.pendingProps === "" || t.nodeType !== 3 ? null : t, t !== null && (e.stateNode = t, !0);
					case 13: return !1;
					default: return !1;
				}
			}
			function Jo(e) {
				if (Go) {
					var t = Wo;
					if (t) {
						var n = t;
						if (!qo(e, t)) {
							if (t = Yn(n.nextSibling), !t || !qo(e, t)) {
								e.effectTag = e.effectTag & -1025 | 2, Go = !1, Uo = e;
								return;
							}
							Ko(Uo, n);
						}
						Uo = e, Wo = Yn(t.firstChild);
					} else e.effectTag = e.effectTag & -1025 | 2, Go = !1, Uo = e;
				}
			}
			function Yo(e) {
				for (e = e.return; e !== null && e.tag !== 5 && e.tag !== 3 && e.tag !== 13;) e = e.return;
				Uo = e;
			}
			function Xo(e) {
				if (e !== Uo) return !1;
				if (!Go) return Yo(e), Go = !0, !1;
				var t = e.type;
				if (e.tag !== 5 || t !== "head" && t !== "body" && !Kn(t, e.memoizedProps)) for (t = Wo; t;) Ko(e, t), t = Yn(t.nextSibling);
				if (Yo(e), e.tag === 13) {
					if (e = e.memoizedState, e = e === null ? null : e.dehydrated, !e) throw Error(i(317));
					a: {
						for (e = e.nextSibling, t = 0; e;) {
							if (e.nodeType === 8) {
								var n = e.data;
								if (n === Bn) {
									if (t === 0) {
										Wo = Yn(e.nextSibling);
										break a;
									}
									t--;
								} else n !== zn && n !== Hn && n !== Vn || t++;
							}
							e = e.nextSibling;
						}
						Wo = null;
					}
				} else Wo = Uo ? Yn(e.stateNode.nextSibling) : null;
				return !0;
			}
			function Zo() {
				Wo = Uo = null, Go = !1;
			}
			var Qo = ye.ReactCurrentOwner, $o = !1;
			function es(e, t, n, r) {
				t.child = e === null ? Za(t, null, n, r) : Xa(t, e.child, n, r);
			}
			function ts(e, t, n, r, i) {
				n = n.render;
				var a = t.ref;
				return ka(t, i), r = _o(e, t, n, r, a, i), e !== null && !$o ? (t.updateQueue = e.updateQueue, t.effectTag &= -517, e.expirationTime <= i && (e.expirationTime = 0), ms(e, t, i)) : (t.effectTag |= 1, es(e, t, r, i), t.child);
			}
			function ns(e, t, n, r, i, a) {
				if (e === null) {
					var o = n.type;
					return typeof o == "function" && !il(o) && o.defaultProps === void 0 && n.compare === null && n.defaultProps === void 0 ? (t.tag = 15, t.type = o, rs(e, t, o, r, i, a)) : (e = sl(n.type, null, r, null, t.mode, a), e.ref = t.ref, e.return = t, t.child = e);
				}
				return o = e.child, i < a && (i = o.memoizedProps, n = n.compare, n = n === null ? hi : n, n(i, r) && e.ref === t.ref) ? ms(e, t, a) : (t.effectTag |= 1, e = ol(o, r), e.ref = t.ref, e.return = t, t.child = e);
			}
			function rs(e, t, n, r, i, a) {
				return e !== null && hi(e.memoizedProps, r) && e.ref === t.ref && ($o = !1, i < a) ? (t.expirationTime = e.expirationTime, ms(e, t, a)) : as(e, t, n, r, a);
			}
			function is(e, t) {
				var n = t.ref;
				(e === null && n !== null || e !== null && e.ref !== n) && (t.effectTag |= 128);
			}
			function as(e, t, n, r, i) {
				var a = Wi(n) ? Hi : Bi.current;
				return a = Ui(t, a), ka(t, i), n = _o(e, t, n, r, a, i), e !== null && !$o ? (t.updateQueue = e.updateQueue, t.effectTag &= -517, e.expirationTime <= i && (e.expirationTime = 0), ms(e, t, i)) : (t.effectTag |= 1, es(e, t, n, i), t.child);
			}
			function os(e, t, n, r, i) {
				if (Wi(n)) {
					var a = !0;
					Ji(t);
				} else a = !1;
				if (ka(t, i), t.stateNode === null) e !== null && (e.alternate = null, t.alternate = null, t.effectTag |= 2), Ua(t, n, r), Ga(t, n, r, i), r = !0;
				else if (e === null) {
					var o = t.stateNode, s = t.memoizedProps;
					o.props = s;
					var c = o.context, l = n.contextType;
					typeof l == "object" && l ? l = K(l) : (l = Wi(n) ? Hi : Bi.current, l = Ui(t, l));
					var u = n.getDerivedStateFromProps, d = typeof u == "function" || typeof o.getSnapshotBeforeUpdate == "function";
					d || typeof o.UNSAFE_componentWillReceiveProps != "function" && typeof o.componentWillReceiveProps != "function" || (s !== r || c !== l) && Wa(t, o, r, l), Aa = !1;
					var f = t.memoizedState;
					o.state = f, Ia(t, r, o, i), c = t.memoizedState, s !== r || f !== c || Vi.current || Aa ? (typeof u == "function" && (Ba(t, n, u, r), c = t.memoizedState), (s = Aa || Ha(t, n, s, r, f, c, l)) ? (d || typeof o.UNSAFE_componentWillMount != "function" && typeof o.componentWillMount != "function" || (typeof o.componentWillMount == "function" && o.componentWillMount(), typeof o.UNSAFE_componentWillMount == "function" && o.UNSAFE_componentWillMount()), typeof o.componentDidMount == "function" && (t.effectTag |= 4)) : (typeof o.componentDidMount == "function" && (t.effectTag |= 4), t.memoizedProps = r, t.memoizedState = c), o.props = r, o.state = c, o.context = l, r = s) : (typeof o.componentDidMount == "function" && (t.effectTag |= 4), r = !1);
				} else o = t.stateNode, Ma(e, t), s = t.memoizedProps, o.props = t.type === t.elementType ? s : Sa(t.type, s), c = o.context, l = n.contextType, typeof l == "object" && l ? l = K(l) : (l = Wi(n) ? Hi : Bi.current, l = Ui(t, l)), u = n.getDerivedStateFromProps, (d = typeof u == "function" || typeof o.getSnapshotBeforeUpdate == "function") || typeof o.UNSAFE_componentWillReceiveProps != "function" && typeof o.componentWillReceiveProps != "function" || (s !== r || c !== l) && Wa(t, o, r, l), Aa = !1, c = t.memoizedState, o.state = c, Ia(t, r, o, i), f = t.memoizedState, s !== r || c !== f || Vi.current || Aa ? (typeof u == "function" && (Ba(t, n, u, r), f = t.memoizedState), (u = Aa || Ha(t, n, s, r, c, f, l)) ? (d || typeof o.UNSAFE_componentWillUpdate != "function" && typeof o.componentWillUpdate != "function" || (typeof o.componentWillUpdate == "function" && o.componentWillUpdate(r, f, l), typeof o.UNSAFE_componentWillUpdate == "function" && o.UNSAFE_componentWillUpdate(r, f, l)), typeof o.componentDidUpdate == "function" && (t.effectTag |= 4), typeof o.getSnapshotBeforeUpdate == "function" && (t.effectTag |= 256)) : (typeof o.componentDidUpdate != "function" || s === e.memoizedProps && c === e.memoizedState || (t.effectTag |= 4), typeof o.getSnapshotBeforeUpdate != "function" || s === e.memoizedProps && c === e.memoizedState || (t.effectTag |= 256), t.memoizedProps = r, t.memoizedState = f), o.props = r, o.state = f, o.context = l, r = u) : (typeof o.componentDidUpdate != "function" || s === e.memoizedProps && c === e.memoizedState || (t.effectTag |= 4), typeof o.getSnapshotBeforeUpdate != "function" || s === e.memoizedProps && c === e.memoizedState || (t.effectTag |= 256), r = !1);
				return ss(e, t, n, r, a, i);
			}
			function ss(e, t, n, r, i, a) {
				is(e, t);
				var o = !!(t.effectTag & 64);
				if (!r && !o) return i && Yi(t, n, !1), ms(e, t, a);
				r = t.stateNode, Qo.current = t;
				var s = o && typeof n.getDerivedStateFromError != "function" ? null : r.render();
				return t.effectTag |= 1, e !== null && o ? (t.child = Xa(t, e.child, null, a), t.child = Xa(t, null, s, a)) : es(e, t, s, a), t.memoizedState = r.state, i && Yi(t, n, !0), t.child;
			}
			function cs(e) {
				var t = e.stateNode;
				t.pendingContext ? Ki(e, t.pendingContext, t.pendingContext !== t.context) : t.context && Ki(e, t.context, !1), ro(e, t.containerInfo);
			}
			var ls = {
				dehydrated: null,
				retryTime: 0
			};
			function us(e, t, n) {
				var r = t.mode, i = t.pendingProps, a = q.current, o = !1, s;
				if ((s = !!(t.effectTag & 64)) || (s = !!(a & 2) && (e === null || e.memoizedState !== null)), s ? (o = !0, t.effectTag &= -65) : e !== null && e.memoizedState === null || i.fallback === void 0 || !0 === i.unstable_avoidThisFallback || (a |= 1), U(q, a & 1), e === null) {
					if (i.fallback !== void 0 && Jo(t), o) {
						if (o = i.fallback, i = cl(null, r, 0, null), i.return = t, !(t.mode & 2)) for (e = t.memoizedState === null ? t.child : t.child.child, i.child = e; e !== null;) e.return = i, e = e.sibling;
						return n = cl(o, r, n, null), n.return = t, i.sibling = n, t.memoizedState = ls, t.child = i, n;
					}
					return r = i.children, t.memoizedState = null, t.child = Za(t, null, r, n);
				}
				if (e.memoizedState !== null) {
					if (e = e.child, r = e.sibling, o) {
						if (i = i.fallback, n = ol(e, e.pendingProps), n.return = t, !(t.mode & 2) && (o = t.memoizedState === null ? t.child : t.child.child, o !== e.child)) for (n.child = o; o !== null;) o.return = n, o = o.sibling;
						return r = ol(r, i), r.return = t, n.sibling = r, n.childExpirationTime = 0, t.memoizedState = ls, t.child = n, r;
					}
					return n = Xa(t, e.child, i.children, n), t.memoizedState = null, t.child = n;
				}
				if (e = e.child, o) {
					if (o = i.fallback, i = cl(null, r, 0, null), i.return = t, i.child = e, e !== null && (e.return = i), !(t.mode & 2)) for (e = t.memoizedState === null ? t.child : t.child.child, i.child = e; e !== null;) e.return = i, e = e.sibling;
					return n = cl(o, r, n, null), n.return = t, i.sibling = n, n.effectTag |= 2, i.childExpirationTime = 0, t.memoizedState = ls, t.child = i, n;
				}
				return t.memoizedState = null, t.child = Xa(t, e, i.children, n);
			}
			function ds(e, t) {
				e.expirationTime < t && (e.expirationTime = t);
				var n = e.alternate;
				n !== null && n.expirationTime < t && (n.expirationTime = t), Oa(e.return, t);
			}
			function fs(e, t, n, r, i, a) {
				var o = e.memoizedState;
				o === null ? e.memoizedState = {
					isBackwards: t,
					rendering: null,
					renderingStartTime: 0,
					last: r,
					tail: n,
					tailExpiration: 0,
					tailMode: i,
					lastEffect: a
				} : (o.isBackwards = t, o.rendering = null, o.renderingStartTime = 0, o.last = r, o.tail = n, o.tailExpiration = 0, o.tailMode = i, o.lastEffect = a);
			}
			function ps(e, t, n) {
				var r = t.pendingProps, i = r.revealOrder, a = r.tail;
				if (es(e, t, r.children, n), r = q.current, r & 2) r = r & 1 | 2, t.effectTag |= 64;
				else {
					if (e !== null && e.effectTag & 64) a: for (e = t.child; e !== null;) {
						if (e.tag === 13) e.memoizedState !== null && ds(e, n);
						else if (e.tag === 19) ds(e, n);
						else if (e.child !== null) {
							e.child.return = e, e = e.child;
							continue;
						}
						if (e === t) break a;
						for (; e.sibling === null;) {
							if (e.return === null || e.return === t) break a;
							e = e.return;
						}
						e.sibling.return = e.return, e = e.sibling;
					}
					r &= 1;
				}
				if (U(q, r), !(t.mode & 2)) t.memoizedState = null;
				else switch (i) {
					case "forwards":
						for (n = t.child, i = null; n !== null;) e = n.alternate, e !== null && so(e) === null && (i = n), n = n.sibling;
						n = i, n === null ? (i = t.child, t.child = null) : (i = n.sibling, n.sibling = null), fs(t, !1, i, n, a, t.lastEffect);
						break;
					case "backwards":
						for (n = null, i = t.child, t.child = null; i !== null;) {
							if (e = i.alternate, e !== null && so(e) === null) {
								t.child = i;
								break;
							}
							e = i.sibling, i.sibling = n, n = i, i = e;
						}
						fs(t, !0, n, null, a, t.lastEffect);
						break;
					case "together":
						fs(t, !1, null, null, void 0, t.lastEffect);
						break;
					default: t.memoizedState = null;
				}
				return t.child;
			}
			function ms(e, t, n) {
				e !== null && (t.dependencies = e.dependencies);
				var r = t.expirationTime;
				if (r !== 0 && Lc(r), t.childExpirationTime < n) return null;
				if (e !== null && t.child !== e.child) throw Error(i(153));
				if (t.child !== null) {
					for (e = t.child, n = ol(e, e.pendingProps), t.child = n, n.return = t; e.sibling !== null;) e = e.sibling, n = n.sibling = ol(e, e.pendingProps), n.return = t;
					n.sibling = null;
				}
				return t.child;
			}
			var hs = function(e, t) {
				for (var n = t.child; n !== null;) {
					if (n.tag === 5 || n.tag === 6) e.appendChild(n.stateNode);
					else if (n.tag !== 4 && n.child !== null) {
						n.child.return = n, n = n.child;
						continue;
					}
					if (n === t) break;
					for (; n.sibling === null;) {
						if (n.return === null || n.return === t) return;
						n = n.return;
					}
					n.sibling.return = n.return, n = n.sibling;
				}
			}, gs = function(e, t, r, i, a) {
				var o = e.memoizedProps;
				if (o !== i) {
					var s = t.stateNode;
					switch (no($a.current), e = null, r) {
						case "input":
							o = qe(s, o), i = qe(s, i), e = [];
							break;
						case "option":
							o = $e(s, o), i = $e(s, i), e = [];
							break;
						case "select":
							o = n({}, o, { value: void 0 }), i = n({}, i, { value: void 0 }), e = [];
							break;
						case "textarea":
							o = tt(s, o), i = tt(s, i), e = [];
							break;
						default: typeof o.onClick != "function" && typeof i.onClick == "function" && (s.onclick = Mn);
					}
					On(r, i);
					var c, l;
					for (c in r = null, o) if (!i.hasOwnProperty(c) && o.hasOwnProperty(c) && o[c] != null) {
						if (c === "style") for (l in s = o[c], s) s.hasOwnProperty(l) && (r ||= {}, r[l] = "");
						else c !== "dangerouslySetInnerHTML" && c !== "children" && c !== "suppressContentEditableWarning" && c !== "suppressHydrationWarning" && c !== "autoFocus" && (E.hasOwnProperty(c) ? e ||= [] : (e ||= []).push(c, null));
					}
					for (c in i) {
						var u = i[c];
						if (s = o?.[c], i.hasOwnProperty(c) && u !== s && (u != null || s != null)) {
							if (c === "style") {
								if (s) {
									for (l in s) !s.hasOwnProperty(l) || u && u.hasOwnProperty(l) || (r ||= {}, r[l] = "");
									for (l in u) u.hasOwnProperty(l) && s[l] !== u[l] && (r ||= {}, r[l] = u[l]);
								} else r || (e ||= [], e.push(c, r)), r = u;
							} else c === "dangerouslySetInnerHTML" ? (u = u ? u.__html : void 0, s = s ? s.__html : void 0, u != null && s !== u && (e ||= []).push(c, u)) : c === "children" ? s === u || typeof u != "string" && typeof u != "number" || (e ||= []).push(c, "" + u) : c !== "suppressContentEditableWarning" && c !== "suppressHydrationWarning" && (E.hasOwnProperty(c) ? (u != null && jn(a, c), e || s === u || (e = [])) : (e ||= []).push(c, u));
						}
					}
					r && (e ||= []).push("style", r), a = e, (t.updateQueue = a) && (t.effectTag |= 4);
				}
			}, _s = function(e, t, n, r) {
				n !== r && (t.effectTag |= 4);
			};
			function vs(e, t) {
				switch (e.tailMode) {
					case "hidden":
						t = e.tail;
						for (var n = null; t !== null;) t.alternate !== null && (n = t), t = t.sibling;
						n === null ? e.tail = null : n.sibling = null;
						break;
					case "collapsed":
						n = e.tail;
						for (var r = null; n !== null;) n.alternate !== null && (r = n), n = n.sibling;
						r === null ? t || e.tail === null ? e.tail = null : e.tail.sibling = null : r.sibling = null;
				}
			}
			function ys(e, t, r) {
				var a = t.pendingProps;
				switch (t.tag) {
					case 2:
					case 16:
					case 15:
					case 0:
					case 11:
					case 7:
					case 8:
					case 12:
					case 9:
					case 14: return null;
					case 1: return Wi(t.type) && Gi(), null;
					case 3: return io(), H(Vi), H(Bi), r = t.stateNode, r.pendingContext && (r.context = r.pendingContext, r.pendingContext = null), e !== null && e.child !== null || !Xo(t) || (t.effectTag |= 4), null;
					case 5:
						oo(t), r = no(to.current);
						var o = t.type;
						if (e !== null && t.stateNode != null) gs(e, t, o, a, r), e.ref !== t.ref && (t.effectTag |= 128);
						else {
							if (!a) {
								if (t.stateNode === null) throw Error(i(166));
								return null;
							}
							if (e = no($a.current), Xo(t)) {
								a = t.stateNode, o = t.type;
								var s = t.memoizedProps;
								switch (a[Qn] = t, a[$n] = s, o) {
									case "iframe":
									case "object":
									case "embed":
										B("load", a);
										break;
									case "video":
									case "audio":
										for (e = 0; e < bt.length; e++) B(bt[e], a);
										break;
									case "source":
										B("error", a);
										break;
									case "img":
									case "image":
									case "link":
										B("error", a), B("load", a);
										break;
									case "form":
										B("reset", a), B("submit", a);
										break;
									case "details":
										B("toggle", a);
										break;
									case "input":
										Je(a, s), B("invalid", a), jn(r, "onChange");
										break;
									case "select":
										a._wrapperState = { wasMultiple: !!s.multiple }, B("invalid", a), jn(r, "onChange");
										break;
									case "textarea": nt(a, s), B("invalid", a), jn(r, "onChange");
								}
								for (var c in On(o, s), e = null, s) if (s.hasOwnProperty(c)) {
									var l = s[c];
									c === "children" ? typeof l == "string" ? a.textContent !== l && (e = ["children", l]) : typeof l == "number" && a.textContent !== "" + l && (e = ["children", "" + l]) : E.hasOwnProperty(c) && l != null && jn(r, c);
								}
								switch (o) {
									case "input":
										Ge(a), Xe(a, s, !0);
										break;
									case "textarea":
										Ge(a), it(a);
										break;
									case "select":
									case "option": break;
									default: typeof s.onClick == "function" && (a.onclick = Mn);
								}
								r = e, t.updateQueue = r, r !== null && (t.effectTag |= 4);
							} else {
								switch (c = r.nodeType === 9 ? r : r.ownerDocument, e === An && (e = ot(o)), e === An ? o === "script" ? (e = c.createElement("div"), e.innerHTML = "<script><\/script>", e = e.removeChild(e.firstChild)) : typeof a.is == "string" ? e = c.createElement(o, { is: a.is }) : (e = c.createElement(o), o === "select" && (c = e, a.multiple ? c.multiple = !0 : a.size && (c.size = a.size))) : e = c.createElementNS(e, o), e[Qn] = t, e[$n] = a, hs(e, t, !1, !1), t.stateNode = e, c = kn(o, a), o) {
									case "iframe":
									case "object":
									case "embed":
										B("load", e), l = a;
										break;
									case "video":
									case "audio":
										for (l = 0; l < bt.length; l++) B(bt[l], e);
										l = a;
										break;
									case "source":
										B("error", e), l = a;
										break;
									case "img":
									case "image":
									case "link":
										B("error", e), B("load", e), l = a;
										break;
									case "form":
										B("reset", e), B("submit", e), l = a;
										break;
									case "details":
										B("toggle", e), l = a;
										break;
									case "input":
										Je(e, a), l = qe(e, a), B("invalid", e), jn(r, "onChange");
										break;
									case "option":
										l = $e(e, a);
										break;
									case "select":
										e._wrapperState = { wasMultiple: !!a.multiple }, l = n({}, a, { value: void 0 }), B("invalid", e), jn(r, "onChange");
										break;
									case "textarea":
										nt(e, a), l = tt(e, a), B("invalid", e), jn(r, "onChange");
										break;
									default: l = a;
								}
								On(o, l);
								var u = l;
								for (s in u) if (u.hasOwnProperty(s)) {
									var d = u[s];
									s === "style" ? En(e, d) : s === "dangerouslySetInnerHTML" ? (d = d ? d.__html : void 0, d != null && lt(e, d)) : s === "children" ? typeof d == "string" ? (o !== "textarea" || d !== "") && ut(e, d) : typeof d == "number" && ut(e, "" + d) : s !== "suppressContentEditableWarning" && s !== "suppressHydrationWarning" && s !== "autoFocus" && (E.hasOwnProperty(s) ? d != null && jn(r, s) : d != null && be(e, s, d, c));
								}
								switch (o) {
									case "input":
										Ge(e), Xe(e, a, !1);
										break;
									case "textarea":
										Ge(e), it(e);
										break;
									case "option":
										a.value != null && e.setAttribute("value", "" + He(a.value));
										break;
									case "select":
										e.multiple = !!a.multiple, r = a.value, r == null ? a.defaultValue != null && et(e, !!a.multiple, a.defaultValue, !0) : et(e, !!a.multiple, r, !1);
										break;
									default: typeof l.onClick == "function" && (e.onclick = Mn);
								}
								Gn(o, a) && (t.effectTag |= 4);
							}
							t.ref !== null && (t.effectTag |= 128);
						}
						return null;
					case 6:
						if (e && t.stateNode != null) _s(e, t, e.memoizedProps, a);
						else {
							if (typeof a != "string" && t.stateNode === null) throw Error(i(166));
							r = no(to.current), no($a.current), Xo(t) ? (r = t.stateNode, a = t.memoizedProps, r[Qn] = t, r.nodeValue !== a && (t.effectTag |= 4)) : (r = (r.nodeType === 9 ? r : r.ownerDocument).createTextNode(a), r[Qn] = t, t.stateNode = r);
						}
						return null;
					case 13: return H(q), a = t.memoizedState, t.effectTag & 64 ? (t.expirationTime = r, t) : (r = a !== null, a = !1, e === null ? t.memoizedProps.fallback !== void 0 && Xo(t) : (o = e.memoizedState, a = o !== null, r || o === null || (o = e.child.sibling, o !== null && (s = t.firstEffect, s === null ? (t.firstEffect = t.lastEffect = o, o.nextEffect = null) : (t.firstEffect = o, o.nextEffect = s), o.effectTag = 8))), r && !a && t.mode & 2 && (e === null && !0 !== t.memoizedProps.unstable_avoidThisFallback || q.current & 1 ? rc === Ys && (rc = Qs) : ((rc === Ys || rc === Qs) && (rc = $s), cc !== 0 && tc !== null && (pl(tc, nc), ml(tc, cc)))), (r || a) && (t.effectTag |= 4), null);
					case 4: return io(), null;
					case 10: return Da(t), null;
					case 17: return Wi(t.type) && Gi(), null;
					case 19:
						if (H(q), a = t.memoizedState, a === null) return null;
						if (o = !!(t.effectTag & 64), s = a.rendering, s === null) {
							if (o) vs(a, !1);
							else if (rc !== Ys || e !== null && e.effectTag & 64) for (s = t.child; s !== null;) {
								if (e = so(s), e !== null) {
									for (t.effectTag |= 64, vs(a, !1), o = e.updateQueue, o !== null && (t.updateQueue = o, t.effectTag |= 4), a.lastEffect === null && (t.firstEffect = null), t.lastEffect = a.lastEffect, a = t.child; a !== null;) o = a, s = r, o.effectTag &= 2, o.nextEffect = null, o.firstEffect = null, o.lastEffect = null, e = o.alternate, e === null ? (o.childExpirationTime = 0, o.expirationTime = s, o.child = null, o.memoizedProps = null, o.memoizedState = null, o.updateQueue = null, o.dependencies = null) : (o.childExpirationTime = e.childExpirationTime, o.expirationTime = e.expirationTime, o.child = e.child, o.memoizedProps = e.memoizedProps, o.memoizedState = e.memoizedState, o.updateQueue = e.updateQueue, s = e.dependencies, o.dependencies = s === null ? null : {
										expirationTime: s.expirationTime,
										firstContext: s.firstContext,
										responders: s.responders
									}), a = a.sibling;
									return U(q, q.current & 1 | 2), t.child;
								}
								s = s.sibling;
							}
						} else {
							if (!o) {
								if (e = so(s), e !== null) {
									if (t.effectTag |= 64, o = !0, r = e.updateQueue, r !== null && (t.updateQueue = r, t.effectTag |= 4), vs(a, !0), a.tail === null && a.tailMode === "hidden" && !s.alternate) return t = t.lastEffect = a.lastEffect, t !== null && (t.nextEffect = null), null;
								} else 2 * pa() - a.renderingStartTime > a.tailExpiration && 1 < r && (t.effectTag |= 64, o = !0, vs(a, !1), t.expirationTime = t.childExpirationTime = r - 1);
							}
							a.isBackwards ? (s.sibling = t.child, t.child = s) : (r = a.last, r === null ? t.child = s : r.sibling = s, a.last = s);
						}
						return a.tail === null ? null : (a.tailExpiration === 0 && (a.tailExpiration = pa() + 500), r = a.tail, a.rendering = r, a.tail = r.sibling, a.lastEffect = t.lastEffect, a.renderingStartTime = pa(), r.sibling = null, t = q.current, U(q, o ? t & 1 | 2 : t & 1), r);
				}
				throw Error(i(156, t.tag));
			}
			function bs(e) {
				switch (e.tag) {
					case 1:
						Wi(e.type) && Gi();
						var t = e.effectTag;
						return t & 4096 ? (e.effectTag = t & -4097 | 64, e) : null;
					case 3:
						if (io(), H(Vi), H(Bi), t = e.effectTag, t & 64) throw Error(i(285));
						return e.effectTag = t & -4097 | 64, e;
					case 5: return oo(e), null;
					case 13: return H(q), t = e.effectTag, t & 4096 ? (e.effectTag = t & -4097 | 64, e) : null;
					case 19: return H(q), null;
					case 4: return io(), null;
					case 10: return Da(e), null;
					default: return null;
				}
			}
			function xs(e, t) {
				return {
					value: e,
					source: t,
					stack: Ve(t)
				};
			}
			var Ss = typeof WeakSet == "function" ? WeakSet : Set;
			function Cs(e, t) {
				var n = t.source, r = t.stack;
				r === null && n !== null && (r = Ve(n)), n !== null && Be(n.type), t = t.value, e !== null && e.tag === 1 && Be(e.type);
				try {
					console.error(t);
				} catch (e) {
					setTimeout(function() {
						throw e;
					});
				}
			}
			function ws(e, t) {
				try {
					t.props = e.memoizedProps, t.state = e.memoizedState, t.componentWillUnmount();
				} catch (t) {
					Yc(e, t);
				}
			}
			function Ts(e) {
				var t = e.ref;
				if (t !== null) {
					if (typeof t == "function") try {
						t(null);
					} catch (t) {
						Yc(e, t);
					}
					else t.current = null;
				}
			}
			function Es(e, t) {
				switch (t.tag) {
					case 0:
					case 11:
					case 15:
					case 22: return;
					case 1:
						if (t.effectTag & 256 && e !== null) {
							var n = e.memoizedProps, r = e.memoizedState;
							e = t.stateNode, t = e.getSnapshotBeforeUpdate(t.elementType === t.type ? n : Sa(t.type, n), r), e.__reactInternalSnapshotBeforeUpdate = t;
						}
						return;
					case 3:
					case 5:
					case 6:
					case 4:
					case 17: return;
				}
				throw Error(i(163));
			}
			function Ds(e, t) {
				if (t = t.updateQueue, t = t === null ? null : t.lastEffect, t !== null) {
					var n = t = t.next;
					do {
						if ((n.tag & e) === e) {
							var r = n.destroy;
							n.destroy = void 0, r !== void 0 && r();
						}
						n = n.next;
					} while (n !== t);
				}
			}
			function Os(e, t) {
				if (t = t.updateQueue, t = t === null ? null : t.lastEffect, t !== null) {
					var n = t = t.next;
					do {
						if ((n.tag & e) === e) {
							var r = n.create;
							n.destroy = r();
						}
						n = n.next;
					} while (n !== t);
				}
			}
			function ks(e, t, n) {
				switch (n.tag) {
					case 0:
					case 11:
					case 15:
					case 22:
						Os(3, n);
						return;
					case 1:
						if (e = n.stateNode, n.effectTag & 4) {
							if (t === null) e.componentDidMount();
							else {
								var r = n.elementType === n.type ? t.memoizedProps : Sa(n.type, t.memoizedProps);
								e.componentDidUpdate(r, t.memoizedState, e.__reactInternalSnapshotBeforeUpdate);
							}
						}
						t = n.updateQueue, t !== null && La(n, t, e);
						return;
					case 3:
						if (t = n.updateQueue, t !== null) {
							if (e = null, n.child !== null) switch (n.child.tag) {
								case 5:
									e = n.child.stateNode;
									break;
								case 1: e = n.child.stateNode;
							}
							La(n, t, e);
						}
						return;
					case 5:
						e = n.stateNode, t === null && n.effectTag & 4 && Gn(n.type, n.memoizedProps) && e.focus();
						return;
					case 6: return;
					case 4: return;
					case 12: return;
					case 13:
						n.memoizedState === null && (n = n.alternate, n !== null && (n = n.memoizedState, n !== null && (n = n.dehydrated, n !== null && sn(n))));
						return;
					case 19:
					case 17:
					case 20:
					case 21: return;
				}
				throw Error(i(163));
			}
			function As(e, t, n) {
				switch (typeof el == "function" && el(t), t.tag) {
					case 0:
					case 11:
					case 14:
					case 15:
					case 22:
						if (e = t.updateQueue, e !== null && (e = e.lastEffect, e !== null)) {
							var r = e.next;
							ga(97 < n ? 97 : n, function() {
								var e = r;
								do {
									var n = e.destroy;
									if (n !== void 0) {
										var i = t;
										try {
											n();
										} catch (e) {
											Yc(i, e);
										}
									}
									e = e.next;
								} while (e !== r);
							});
						}
						break;
					case 1:
						Ts(t), n = t.stateNode, typeof n.componentWillUnmount == "function" && ws(t, n);
						break;
					case 5:
						Ts(t);
						break;
					case 4: Is(e, t, n);
				}
			}
			function js(e) {
				var t = e.alternate;
				e.return = null, e.child = null, e.memoizedState = null, e.updateQueue = null, e.dependencies = null, e.alternate = null, e.firstEffect = null, e.lastEffect = null, e.pendingProps = null, e.memoizedProps = null, e.stateNode = null, t !== null && js(t);
			}
			function Ms(e) {
				return e.tag === 5 || e.tag === 3 || e.tag === 4;
			}
			function Ns(e) {
				a: {
					for (var t = e.return; t !== null;) {
						if (Ms(t)) {
							var n = t;
							break a;
						}
						t = t.return;
					}
					throw Error(i(160));
				}
				switch (t = n.stateNode, n.tag) {
					case 5:
						var r = !1;
						break;
					case 3:
						t = t.containerInfo, r = !0;
						break;
					case 4:
						t = t.containerInfo, r = !0;
						break;
					default: throw Error(i(161));
				}
				n.effectTag & 16 && (ut(t, ""), n.effectTag &= -17);
				a: b: for (n = e;;) {
					for (; n.sibling === null;) {
						if (n.return === null || Ms(n.return)) {
							n = null;
							break a;
						}
						n = n.return;
					}
					for (n.sibling.return = n.return, n = n.sibling; n.tag !== 5 && n.tag !== 6 && n.tag !== 18;) {
						if (n.effectTag & 2 || n.child === null || n.tag === 4) continue b;
						n.child.return = n, n = n.child;
					}
					if (!(n.effectTag & 2)) {
						n = n.stateNode;
						break a;
					}
				}
				r ? Ps(e, n, t) : Fs(e, n, t);
			}
			function Ps(e, t, n) {
				var r = e.tag, i = r === 5 || r === 6;
				if (i) e = i ? e.stateNode : e.stateNode.instance, t ? n.nodeType === 8 ? n.parentNode.insertBefore(e, t) : n.insertBefore(e, t) : (n.nodeType === 8 ? (t = n.parentNode, t.insertBefore(e, n)) : (t = n, t.appendChild(e)), n = n._reactRootContainer, n != null || t.onclick !== null || (t.onclick = Mn));
				else if (r !== 4 && (e = e.child, e !== null)) for (Ps(e, t, n), e = e.sibling; e !== null;) Ps(e, t, n), e = e.sibling;
			}
			function Fs(e, t, n) {
				var r = e.tag, i = r === 5 || r === 6;
				if (i) e = i ? e.stateNode : e.stateNode.instance, t ? n.insertBefore(e, t) : n.appendChild(e);
				else if (r !== 4 && (e = e.child, e !== null)) for (Fs(e, t, n), e = e.sibling; e !== null;) Fs(e, t, n), e = e.sibling;
			}
			function Is(e, t, n) {
				for (var r = t, a = !1, o, s;;) {
					if (!a) {
						a = r.return;
						a: for (;;) {
							if (a === null) throw Error(i(160));
							switch (o = a.stateNode, a.tag) {
								case 5:
									s = !1;
									break a;
								case 3:
									o = o.containerInfo, s = !0;
									break a;
								case 4:
									o = o.containerInfo, s = !0;
									break a;
							}
							a = a.return;
						}
						a = !0;
					}
					if (r.tag === 5 || r.tag === 6) {
						a: for (var c = e, l = r, u = n, d = l;;) if (As(c, d, u), d.child !== null && d.tag !== 4) d.child.return = d, d = d.child;
						else {
							if (d === l) break a;
							for (; d.sibling === null;) {
								if (d.return === null || d.return === l) break a;
								d = d.return;
							}
							d.sibling.return = d.return, d = d.sibling;
						}
						s ? (c = o, l = r.stateNode, c.nodeType === 8 ? c.parentNode.removeChild(l) : c.removeChild(l)) : o.removeChild(r.stateNode);
					} else if (r.tag === 4) {
						if (r.child !== null) {
							o = r.stateNode.containerInfo, s = !0, r.child.return = r, r = r.child;
							continue;
						}
					} else if (As(e, r, n), r.child !== null) {
						r.child.return = r, r = r.child;
						continue;
					}
					if (r === t) break;
					for (; r.sibling === null;) {
						if (r.return === null || r.return === t) return;
						r = r.return, r.tag === 4 && (a = !1);
					}
					r.sibling.return = r.return, r = r.sibling;
				}
			}
			function Ls(e, t) {
				switch (t.tag) {
					case 0:
					case 11:
					case 14:
					case 15:
					case 22:
						Ds(3, t);
						return;
					case 1: return;
					case 5:
						var n = t.stateNode;
						if (n != null) {
							var r = t.memoizedProps, a = e === null ? r : e.memoizedProps;
							e = t.type;
							var o = t.updateQueue;
							if (t.updateQueue = null, o !== null) {
								for (n[$n] = r, e === "input" && r.type === "radio" && r.name != null && I(n, r), kn(e, a), t = kn(e, r), a = 0; a < o.length; a += 2) {
									var s = o[a], c = o[a + 1];
									s === "style" ? En(n, c) : s === "dangerouslySetInnerHTML" ? lt(n, c) : s === "children" ? ut(n, c) : be(n, s, c, t);
								}
								switch (e) {
									case "input":
										Ye(n, r);
										break;
									case "textarea":
										rt(n, r);
										break;
									case "select": t = n._wrapperState.wasMultiple, n._wrapperState.wasMultiple = !!r.multiple, e = r.value, e == null ? t !== !!r.multiple && (r.defaultValue == null ? et(n, !!r.multiple, r.multiple ? [] : "", !1) : et(n, !!r.multiple, r.defaultValue, !0)) : et(n, !!r.multiple, e, !1);
								}
							}
						}
						return;
					case 6:
						if (t.stateNode === null) throw Error(i(162));
						t.stateNode.nodeValue = t.memoizedProps;
						return;
					case 3:
						t = t.stateNode, t.hydrate && (t.hydrate = !1, sn(t.containerInfo));
						return;
					case 12: return;
					case 13:
						if (n = t, t.memoizedState === null ? r = !1 : (r = !0, n = t.child, uc = pa()), n !== null) a: for (e = n;;) {
							if (e.tag === 5) o = e.stateNode, r ? (o = o.style, typeof o.setProperty == "function" ? o.setProperty("display", "none", "important") : o.display = "none") : (o = e.stateNode, a = e.memoizedProps.style, a = a != null && a.hasOwnProperty("display") ? a.display : null, o.style.display = Tn("display", a));
							else if (e.tag === 6) e.stateNode.nodeValue = r ? "" : e.memoizedProps;
							else if (e.tag === 13 && e.memoizedState !== null && e.memoizedState.dehydrated === null) {
								o = e.child.sibling, o.return = e, e = o;
								continue;
							} else if (e.child !== null) {
								e.child.return = e, e = e.child;
								continue;
							}
							if (e === n) break;
							for (; e.sibling === null;) {
								if (e.return === null || e.return === n) break a;
								e = e.return;
							}
							e.sibling.return = e.return, e = e.sibling;
						}
						Rs(t);
						return;
					case 19:
						Rs(t);
						return;
					case 17: return;
				}
				throw Error(i(163));
			}
			function Rs(e) {
				var t = e.updateQueue;
				if (t !== null) {
					e.updateQueue = null;
					var n = e.stateNode;
					n === null && (n = e.stateNode = new Ss()), t.forEach(function(t) {
						var r = Zc.bind(null, e, t);
						n.has(t) || (n.add(t), t.then(r, r));
					});
				}
			}
			var zs = typeof WeakMap == "function" ? WeakMap : Map;
			function Bs(e, t, n) {
				n = Na(n, null), n.tag = 3, n.payload = { element: null };
				var r = t.value;
				return n.callback = function() {
					fc || (fc = !0, pc = r), Cs(e, t);
				}, n;
			}
			function Vs(e, t, n) {
				n = Na(n, null), n.tag = 3;
				var r = e.type.getDerivedStateFromError;
				if (typeof r == "function") {
					var i = t.value;
					n.payload = function() {
						return Cs(e, t), r(i);
					};
				}
				var a = e.stateNode;
				return a !== null && typeof a.componentDidCatch == "function" && (n.callback = function() {
					typeof r != "function" && (mc === null ? mc = /* @__PURE__ */ new Set([this]) : mc.add(this), Cs(e, t));
					var n = t.stack;
					this.componentDidCatch(t.value, { componentStack: n === null ? "" : n });
				}), n;
			}
			var Hs = Math.ceil, Us = ye.ReactCurrentDispatcher, Ws = ye.ReactCurrentOwner, Gs = 0, Ks = 8, qs = 16, Js = 32, Ys = 0, Xs = 1, Zs = 2, Qs = 3, $s = 4, ec = 5, X = Gs, tc = null, Z = null, nc = 0, rc = Ys, ic = null, ac = 1073741823, oc = 1073741823, sc = null, cc = 0, lc = !1, uc = 0, dc = 500, Q = null, fc = !1, pc = null, mc = null, hc = !1, gc = null, _c = 90, vc = null, yc = 0, bc = null, xc = 0;
			function Sc() {
				return (X & (qs | Js)) === Gs ? xc === 0 ? xc = 1073741821 - (pa() / 10 | 0) : xc : 1073741821 - (pa() / 10 | 0);
			}
			function Cc(e, t, n) {
				if (t = t.mode, !(t & 2)) return 1073741823;
				var r = ma();
				if (!(t & 4)) return r === 99 ? 1073741823 : 1073741822;
				if ((X & qs) !== Gs) return nc;
				if (n !== null) e = xa(e, n.timeoutMs | 0 || 5e3, 250);
				else switch (r) {
					case 99:
						e = 1073741823;
						break;
					case 98:
						e = xa(e, 150, 100);
						break;
					case 97:
					case 96:
						e = xa(e, 5e3, 250);
						break;
					case 95:
						e = 2;
						break;
					default: throw Error(i(326));
				}
				return tc !== null && e === nc && --e, e;
			}
			function wc(e, t) {
				if (50 < yc) throw yc = 0, bc = null, Error(i(185));
				if (e = Tc(e, t), e !== null) {
					var n = ma();
					t === 1073741823 ? (X & Ks) !== Gs && (X & (qs | Js)) === Gs ? kc(e) : (Dc(e), X === Gs && ya()) : Dc(e), (X & 4) === Gs || n !== 98 && n !== 99 || (vc === null ? vc = /* @__PURE__ */ new Map([[e, t]]) : (n = vc.get(e), (n === void 0 || n > t) && vc.set(e, t)));
				}
			}
			function Tc(e, t) {
				e.expirationTime < t && (e.expirationTime = t);
				var n = e.alternate;
				n !== null && n.expirationTime < t && (n.expirationTime = t);
				var r = e.return, i = null;
				if (r === null && e.tag === 3) i = e.stateNode;
				else for (; r !== null;) {
					if (n = r.alternate, r.childExpirationTime < t && (r.childExpirationTime = t), n !== null && n.childExpirationTime < t && (n.childExpirationTime = t), r.return === null && r.tag === 3) {
						i = r.stateNode;
						break;
					}
					r = r.return;
				}
				return i !== null && (tc === i && (Lc(t), rc === $s && pl(i, nc)), ml(i, t)), i;
			}
			function Ec(e) {
				var t = e.lastExpiredTime;
				if (t !== 0 || (t = e.firstPendingTime, !fl(e, t))) return t;
				var n = e.lastPingedTime;
				return e = e.nextKnownPendingLevel, e = n > e ? n : e, 2 >= e && t !== e ? 0 : e;
			}
			function Dc(e) {
				if (e.lastExpiredTime !== 0) e.callbackExpirationTime = 1073741823, e.callbackPriority = 99, e.callbackNode = va(kc.bind(null, e));
				else {
					var t = Ec(e), n = e.callbackNode;
					if (t === 0) n !== null && (e.callbackNode = null, e.callbackExpirationTime = 0, e.callbackPriority = 90);
					else {
						var r = Sc();
						if (t === 1073741823 ? r = 99 : t === 1 || t === 2 ? r = 95 : (r = 10 * (1073741821 - t) - 10 * (1073741821 - r), r = 0 >= r ? 99 : 250 >= r ? 98 : 5250 >= r ? 97 : 95), n !== null) {
							var i = e.callbackPriority;
							if (e.callbackExpirationTime === t && i >= r) return;
							n !== oa && Qi(n);
						}
						e.callbackExpirationTime = t, e.callbackPriority = r, t = t === 1073741823 ? va(kc.bind(null, e)) : _a(r, Oc.bind(null, e), { timeout: 10 * (1073741821 - t) - pa() }), e.callbackNode = t;
					}
				}
			}
			function Oc(e, t) {
				if (xc = 0, t) return t = Sc(), hl(e, t), Dc(e), null;
				var n = Ec(e);
				if (n !== 0) {
					if (t = e.callbackNode, (X & (qs | Js)) !== Gs) throw Error(i(327));
					if (Kc(), e === tc && n === nc || Nc(e, n), Z !== null) {
						var r = X;
						X |= qs;
						var a = Fc();
						do
							try {
								zc();
								break;
							} catch (t) {
								Pc(e, t);
							}
						while (1);
						if (Ea(), X = r, Us.current = a, rc === Xs) throw t = ic, Nc(e, n), pl(e, n), Dc(e), t;
						if (Z === null) switch (a = e.finishedWork = e.current.alternate, e.finishedExpirationTime = n, r = rc, tc = null, r) {
							case Ys:
							case Xs: throw Error(i(345));
							case Zs:
								hl(e, 2 < n ? 2 : n);
								break;
							case Qs:
								if (pl(e, n), r = e.lastSuspendedTime, n === r && (e.nextKnownPendingLevel = Hc(a)), ac === 1073741823 && (a = uc + dc - pa(), 10 < a)) {
									if (lc) {
										var o = e.lastPingedTime;
										if (o === 0 || o >= n) {
											e.lastPingedTime = n, Nc(e, n);
											break;
										}
									}
									if (o = Ec(e), o !== 0 && o !== n) break;
									if (r !== 0 && r !== n) {
										e.lastPingedTime = r;
										break;
									}
									e.timeoutHandle = qn(Uc.bind(null, e), a);
									break;
								}
								Uc(e);
								break;
							case $s:
								if (pl(e, n), r = e.lastSuspendedTime, n === r && (e.nextKnownPendingLevel = Hc(a)), lc && (a = e.lastPingedTime, a === 0 || a >= n)) {
									e.lastPingedTime = n, Nc(e, n);
									break;
								}
								if (a = Ec(e), a !== 0 && a !== n) break;
								if (r !== 0 && r !== n) {
									e.lastPingedTime = r;
									break;
								}
								if (oc === 1073741823 ? ac === 1073741823 ? r = 0 : (r = 10 * (1073741821 - ac) - 5e3, a = pa(), n = 10 * (1073741821 - n) - a, r = a - r, 0 > r && (r = 0), r = (120 > r ? 120 : 480 > r ? 480 : 1080 > r ? 1080 : 1920 > r ? 1920 : 3e3 > r ? 3e3 : 4320 > r ? 4320 : 1960 * Hs(r / 1960)) - r, n < r && (r = n)) : r = 10 * (1073741821 - oc) - pa(), 10 < r) {
									e.timeoutHandle = qn(Uc.bind(null, e), r);
									break;
								}
								Uc(e);
								break;
							case ec:
								if (ac !== 1073741823 && sc !== null) {
									o = ac;
									var s = sc;
									if (r = s.busyMinDurationMs | 0, 0 >= r ? r = 0 : (a = s.busyDelayMs | 0, o = pa() - (10 * (1073741821 - o) - (s.timeoutMs | 0 || 5e3)), r = o <= a ? 0 : a + r - o), 10 < r) {
										pl(e, n), e.timeoutHandle = qn(Uc.bind(null, e), r);
										break;
									}
								}
								Uc(e);
								break;
							default: throw Error(i(329));
						}
						if (Dc(e), e.callbackNode === t) return Oc.bind(null, e);
					}
				}
				return null;
			}
			function kc(e) {
				var t = e.lastExpiredTime;
				if (t = t === 0 ? 1073741823 : t, (X & (qs | Js)) !== Gs) throw Error(i(327));
				if (Kc(), e === tc && t === nc || Nc(e, t), Z !== null) {
					var n = X;
					X |= qs;
					var r = Fc();
					do
						try {
							Rc();
							break;
						} catch (t) {
							Pc(e, t);
						}
					while (1);
					if (Ea(), X = n, Us.current = r, rc === Xs) throw n = ic, Nc(e, t), pl(e, t), Dc(e), n;
					if (Z !== null) throw Error(i(261));
					e.finishedWork = e.current.alternate, e.finishedExpirationTime = t, tc = null, Uc(e), Dc(e);
				}
				return null;
			}
			function Ac() {
				if (vc !== null) {
					var e = vc;
					vc = null, e.forEach(function(e, t) {
						hl(t, e), Dc(t);
					}), ya();
				}
			}
			function jc(e, t) {
				var n = X;
				X |= 1;
				try {
					return e(t);
				} finally {
					X = n, X === Gs && ya();
				}
			}
			function Mc(e, t) {
				var n = X;
				X &= -2, X |= Ks;
				try {
					return e(t);
				} finally {
					X = n, X === Gs && ya();
				}
			}
			function Nc(e, t) {
				e.finishedWork = null, e.finishedExpirationTime = 0;
				var n = e.timeoutHandle;
				if (n !== -1 && (e.timeoutHandle = -1, Jn(n)), Z !== null) for (n = Z.return; n !== null;) {
					var r = n;
					switch (r.tag) {
						case 1:
							r = r.type.childContextTypes, r != null && Gi();
							break;
						case 3:
							io(), H(Vi), H(Bi);
							break;
						case 5:
							oo(r);
							break;
						case 4:
							io();
							break;
						case 13:
							H(q);
							break;
						case 19:
							H(q);
							break;
						case 10: Da(r);
					}
					n = n.return;
				}
				tc = e, Z = ol(e.current, null), nc = t, rc = Ys, ic = null, oc = ac = 1073741823, sc = null, cc = 0, lc = !1;
			}
			function Pc(e, t) {
				do {
					try {
						if (Ea(), lo.current = zo, mo) for (var n = J.memoizedState; n !== null;) {
							var r = n.queue;
							r !== null && (r.pending = null), n = n.next;
						}
						if (fo = 0, po = Y = J = null, mo = !1, Z === null || Z.return === null) return rc = Xs, ic = t, Z = null;
						a: {
							var i = e, a = Z.return, o = Z, s = t;
							if (t = nc, o.effectTag |= 2048, o.firstEffect = o.lastEffect = null, typeof s == "object" && s && typeof s.then == "function") {
								var c = s;
								if (!(o.mode & 2)) {
									var l = o.alternate;
									l ? (o.updateQueue = l.updateQueue, o.memoizedState = l.memoizedState, o.expirationTime = l.expirationTime) : (o.updateQueue = null, o.memoizedState = null);
								}
								var u = !!(q.current & 1), d = a;
								do {
									var f;
									if (f = d.tag === 13) {
										var p = d.memoizedState;
										if (p !== null) f = p.dehydrated !== null;
										else {
											var m = d.memoizedProps;
											f = m.fallback === void 0 ? !1 : !0 !== m.unstable_avoidThisFallback || !u;
										}
									}
									if (f) {
										var h = d.updateQueue;
										if (h === null) {
											var g = /* @__PURE__ */ new Set();
											g.add(c), d.updateQueue = g;
										} else h.add(c);
										if (!(d.mode & 2)) {
											if (d.effectTag |= 64, o.effectTag &= -2981, o.tag === 1) {
												if (o.alternate === null) o.tag = 17;
												else {
													var _ = Na(1073741823, null);
													_.tag = 2, Pa(o, _);
												}
											}
											o.expirationTime = 1073741823;
											break a;
										}
										s = void 0, o = t;
										var v = i.pingCache;
										if (v === null ? (v = i.pingCache = new zs(), s = /* @__PURE__ */ new Set(), v.set(c, s)) : (s = v.get(c), s === void 0 && (s = /* @__PURE__ */ new Set(), v.set(c, s))), !s.has(o)) {
											s.add(o);
											var y = Xc.bind(null, i, c, o);
											c.then(y, y);
										}
										d.effectTag |= 4096, d.expirationTime = t;
										break a;
									}
									d = d.return;
								} while (d !== null);
								s = Error((Be(o.type) || "A React component") + " suspended while rendering, but no fallback UI was specified.\n\nAdd a <Suspense fallback=...> component higher in the tree to provide a loading indicator or placeholder to display." + Ve(o));
							}
							rc !== ec && (rc = Zs), s = xs(s, o), d = a;
							do {
								switch (d.tag) {
									case 3:
										c = s, d.effectTag |= 4096, d.expirationTime = t;
										var b = Bs(d, c, t);
										Fa(d, b);
										break a;
									case 1:
										c = s;
										var x = d.type, S = d.stateNode;
										if (!(d.effectTag & 64) && (typeof x.getDerivedStateFromError == "function" || S !== null && typeof S.componentDidCatch == "function" && (mc === null || !mc.has(S)))) {
											d.effectTag |= 4096, d.expirationTime = t;
											var C = Vs(d, c, t);
											Fa(d, C);
											break a;
										}
								}
								d = d.return;
							} while (d !== null);
						}
						Z = Vc(Z);
					} catch (e) {
						t = e;
						continue;
					}
					break;
				} while (1);
			}
			function Fc() {
				var e = Us.current;
				return Us.current = zo, e === null ? zo : e;
			}
			function Ic(e, t) {
				e < ac && 2 < e && (ac = e), t !== null && e < oc && 2 < e && (oc = e, sc = t);
			}
			function Lc(e) {
				e > cc && (cc = e);
			}
			function Rc() {
				for (; Z !== null;) Z = Bc(Z);
			}
			function zc() {
				for (; Z !== null && !sa();) Z = Bc(Z);
			}
			function Bc(e) {
				var t = Qc(e.alternate, e, nc);
				return e.memoizedProps = e.pendingProps, t === null && (t = Vc(e)), Ws.current = null, t;
			}
			function Vc(e) {
				Z = e;
				do {
					var t = Z.alternate;
					if (e = Z.return, Z.effectTag & 2048) {
						if (t = bs(Z), t !== null) return t.effectTag &= 2047, t;
						e !== null && (e.firstEffect = e.lastEffect = null, e.effectTag |= 2048);
					} else {
						if (t = ys(t, Z, nc), nc === 1 || Z.childExpirationTime !== 1) {
							for (var n = 0, r = Z.child; r !== null;) {
								var i = r.expirationTime, a = r.childExpirationTime;
								i > n && (n = i), a > n && (n = a), r = r.sibling;
							}
							Z.childExpirationTime = n;
						}
						if (t !== null) return t;
						e !== null && !(e.effectTag & 2048) && (e.firstEffect === null && (e.firstEffect = Z.firstEffect), Z.lastEffect !== null && (e.lastEffect !== null && (e.lastEffect.nextEffect = Z.firstEffect), e.lastEffect = Z.lastEffect), 1 < Z.effectTag && (e.lastEffect === null ? e.firstEffect = Z : e.lastEffect.nextEffect = Z, e.lastEffect = Z));
					}
					if (t = Z.sibling, t !== null) return t;
					Z = e;
				} while (Z !== null);
				return rc === Ys && (rc = ec), null;
			}
			function Hc(e) {
				var t = e.expirationTime;
				return e = e.childExpirationTime, t > e ? t : e;
			}
			function Uc(e) {
				var t = ma();
				return ga(99, Wc.bind(null, e, t)), null;
			}
			function Wc(e, t) {
				do
					Kc();
				while (gc !== null);
				if ((X & (qs | Js)) !== Gs) throw Error(i(327));
				var n = e.finishedWork, r = e.finishedExpirationTime;
				if (n === null) return null;
				if (e.finishedWork = null, e.finishedExpirationTime = 0, n === e.current) throw Error(i(177));
				e.callbackNode = null, e.callbackExpirationTime = 0, e.callbackPriority = 90, e.nextKnownPendingLevel = 0;
				var a = Hc(n);
				if (e.firstPendingTime = a, r <= e.lastSuspendedTime ? e.firstSuspendedTime = e.lastSuspendedTime = e.nextKnownPendingLevel = 0 : r <= e.firstSuspendedTime && (e.firstSuspendedTime = r - 1), r <= e.lastPingedTime && (e.lastPingedTime = 0), r <= e.lastExpiredTime && (e.lastExpiredTime = 0), e === tc && (Z = tc = null, nc = 0), 1 < n.effectTag ? n.lastEffect === null ? a = n : (n.lastEffect.nextEffect = n, a = n.firstEffect) : a = n.firstEffect, a !== null) {
					var o = X;
					X |= Js, Ws.current = null, Un = _n;
					var s = Ln();
					if (Rn(s)) {
						if ("selectionStart" in s) var c = {
							start: s.selectionStart,
							end: s.selectionEnd
						};
						else a: {
							c = (c = s.ownerDocument) && c.defaultView || window;
							var l = c.getSelection && c.getSelection();
							if (l && l.rangeCount !== 0) {
								c = l.anchorNode;
								var u = l.anchorOffset, d = l.focusNode;
								l = l.focusOffset;
								try {
									c.nodeType, d.nodeType;
								} catch {
									c = null;
									break a;
								}
								var f = 0, p = -1, m = -1, h = 0, g = 0, _ = s, v = null;
								b: for (;;) {
									for (var y; _ !== c || u !== 0 && _.nodeType !== 3 || (p = f + u), _ !== d || l !== 0 && _.nodeType !== 3 || (m = f + l), _.nodeType === 3 && (f += _.nodeValue.length), (y = _.firstChild) !== null;) v = _, _ = y;
									for (;;) {
										if (_ === s) break b;
										if (v === c && ++h === u && (p = f), v === d && ++g === l && (m = f), (y = _.nextSibling) !== null) break;
										_ = v, v = _.parentNode;
									}
									_ = y;
								}
								c = p === -1 || m === -1 ? null : {
									start: p,
									end: m
								};
							} else c = null;
						}
						c ||= {
							start: 0,
							end: 0
						};
					} else c = null;
					Wn = {
						activeElementDetached: null,
						focusedElem: s,
						selectionRange: c
					}, _n = !1, Q = a;
					do
						try {
							Gc();
						} catch (e) {
							if (Q === null) throw Error(i(330));
							Yc(Q, e), Q = Q.nextEffect;
						}
					while (Q !== null);
					Q = a;
					do
						try {
							for (s = e, c = t; Q !== null;) {
								var b = Q.effectTag;
								if (b & 16 && ut(Q.stateNode, ""), b & 128) {
									var x = Q.alternate;
									if (x !== null) {
										var S = x.ref;
										S !== null && (typeof S == "function" ? S(null) : S.current = null);
									}
								}
								switch (b & 1038) {
									case 2:
										Ns(Q), Q.effectTag &= -3;
										break;
									case 6:
										Ns(Q), Q.effectTag &= -3, Ls(Q.alternate, Q);
										break;
									case 1024:
										Q.effectTag &= -1025;
										break;
									case 1028:
										Q.effectTag &= -1025, Ls(Q.alternate, Q);
										break;
									case 4:
										Ls(Q.alternate, Q);
										break;
									case 8: u = Q, Is(s, u, c), js(u);
								}
								Q = Q.nextEffect;
							}
						} catch (e) {
							if (Q === null) throw Error(i(330));
							Yc(Q, e), Q = Q.nextEffect;
						}
					while (Q !== null);
					if (S = Wn, x = Ln(), b = S.focusedElem, c = S.selectionRange, x !== b && b && b.ownerDocument && In(b.ownerDocument.documentElement, b)) {
						for (c !== null && Rn(b) && (x = c.start, S = c.end, S === void 0 && (S = x), ("selectionStart" in b) ? (b.selectionStart = x, b.selectionEnd = Math.min(S, b.value.length)) : (S = (x = b.ownerDocument || document) && x.defaultView || window, S.getSelection && (S = S.getSelection(), u = b.textContent.length, s = Math.min(c.start, u), c = c.end === void 0 ? s : Math.min(c.end, u), !S.extend && s > c && (u = c, c = s, s = u), u = Fn(b, s), d = Fn(b, c), u && d && (S.rangeCount !== 1 || S.anchorNode !== u.node || S.anchorOffset !== u.offset || S.focusNode !== d.node || S.focusOffset !== d.offset) && (x = x.createRange(), x.setStart(u.node, u.offset), S.removeAllRanges(), s > c ? (S.addRange(x), S.extend(d.node, d.offset)) : (x.setEnd(d.node, d.offset), S.addRange(x)))))), x = [], S = b; S = S.parentNode;) S.nodeType === 1 && x.push({
							element: S,
							left: S.scrollLeft,
							top: S.scrollTop
						});
						for (typeof b.focus == "function" && b.focus(), b = 0; b < x.length; b++) S = x[b], S.element.scrollLeft = S.left, S.element.scrollTop = S.top;
					}
					_n = !!Un, Wn = Un = null, e.current = n, Q = a;
					do
						try {
							for (b = e; Q !== null;) {
								var C = Q.effectTag;
								if (C & 36 && ks(b, Q.alternate, Q), C & 128) {
									x = void 0;
									var w = Q.ref;
									if (w !== null) {
										var T = Q.stateNode;
										switch (Q.tag) {
											case 5:
												x = T;
												break;
											default: x = T;
										}
										typeof w == "function" ? w(x) : w.current = x;
									}
								}
								Q = Q.nextEffect;
							}
						} catch (e) {
							if (Q === null) throw Error(i(330));
							Yc(Q, e), Q = Q.nextEffect;
						}
					while (Q !== null);
					Q = null, ca(), X = o;
				} else e.current = n;
				if (hc) hc = !1, gc = e, _c = t;
				else for (Q = a; Q !== null;) t = Q.nextEffect, Q.nextEffect = null, Q = t;
				if (t = e.firstPendingTime, t === 0 && (mc = null), t === 1073741823 ? e === bc ? yc++ : (yc = 0, bc = e) : yc = 0, typeof $c == "function" && $c(n.stateNode, r), Dc(e), fc) throw fc = !1, e = pc, pc = null, e;
				return (X & Ks) === Gs && ya(), null;
			}
			function Gc() {
				for (; Q !== null;) {
					var e = Q.effectTag;
					e & 256 && Es(Q.alternate, Q), !(e & 512) || hc || (hc = !0, _a(97, function() {
						return Kc(), null;
					})), Q = Q.nextEffect;
				}
			}
			function Kc() {
				if (_c !== 90) {
					var e = 97 < _c ? 97 : _c;
					return _c = 90, ga(e, qc);
				}
			}
			function qc() {
				if (gc === null) return !1;
				var e = gc;
				if (gc = null, (X & (qs | Js)) !== Gs) throw Error(i(331));
				var t = X;
				for (X |= Js, e = e.current.firstEffect; e !== null;) {
					try {
						var n = e;
						if (n.effectTag & 512) switch (n.tag) {
							case 0:
							case 11:
							case 15:
							case 22: Ds(5, n), Os(5, n);
						}
					} catch (t) {
						if (e === null) throw Error(i(330));
						Yc(e, t);
					}
					n = e.nextEffect, e.nextEffect = null, e = n;
				}
				return X = t, ya(), !0;
			}
			function Jc(e, t, n) {
				t = xs(n, t), t = Bs(e, t, 1073741823), Pa(e, t), e = Tc(e, 1073741823), e !== null && Dc(e);
			}
			function Yc(e, t) {
				if (e.tag === 3) Jc(e, e, t);
				else for (var n = e.return; n !== null;) {
					if (n.tag === 3) {
						Jc(n, e, t);
						break;
					}
					if (n.tag === 1) {
						var r = n.stateNode;
						if (typeof n.type.getDerivedStateFromError == "function" || typeof r.componentDidCatch == "function" && (mc === null || !mc.has(r))) {
							e = xs(t, e), e = Vs(n, e, 1073741823), Pa(n, e), n = Tc(n, 1073741823), n !== null && Dc(n);
							break;
						}
					}
					n = n.return;
				}
			}
			function Xc(e, t, n) {
				var r = e.pingCache;
				r !== null && r.delete(t), tc === e && nc === n ? rc === $s || rc === Qs && ac === 1073741823 && pa() - uc < dc ? Nc(e, nc) : lc = !0 : fl(e, n) && (t = e.lastPingedTime, t !== 0 && t < n || (e.lastPingedTime = n, Dc(e)));
			}
			function Zc(e, t) {
				var n = e.stateNode;
				n !== null && n.delete(t), t = 0, t === 0 && (t = Sc(), t = Cc(t, e, null)), e = Tc(e, t), e !== null && Dc(e);
			}
			var Qc = function(e, t, n) {
				var r = t.expirationTime;
				if (e !== null) {
					var a = t.pendingProps;
					if (e.memoizedProps !== a || Vi.current) $o = !0;
					else {
						if (r < n) {
							switch ($o = !1, t.tag) {
								case 3:
									cs(t), Zo();
									break;
								case 5:
									if (ao(t), t.mode & 4 && n !== 1 && a.hidden) return t.expirationTime = t.childExpirationTime = 1, null;
									break;
								case 1:
									Wi(t.type) && Ji(t);
									break;
								case 4:
									ro(t, t.stateNode.containerInfo);
									break;
								case 10:
									r = t.memoizedProps.value, a = t.type._context, U(Ca, a._currentValue), a._currentValue = r;
									break;
								case 13:
									if (t.memoizedState !== null) return r = t.child.childExpirationTime, r !== 0 && r >= n ? us(e, t, n) : (U(q, q.current & 1), t = ms(e, t, n), t === null ? null : t.sibling);
									U(q, q.current & 1);
									break;
								case 19:
									if (r = t.childExpirationTime >= n, e.effectTag & 64) {
										if (r) return ps(e, t, n);
										t.effectTag |= 64;
									}
									if (a = t.memoizedState, a !== null && (a.rendering = null, a.tail = null), U(q, q.current), !r) return null;
							}
							return ms(e, t, n);
						}
						$o = !1;
					}
				} else $o = !1;
				switch (t.expirationTime = 0, t.tag) {
					case 2:
						if (r = t.type, e !== null && (e.alternate = null, t.alternate = null, t.effectTag |= 2), e = t.pendingProps, a = Ui(t, Bi.current), ka(t, n), a = _o(null, t, r, e, a, n), t.effectTag |= 1, typeof a == "object" && a && typeof a.render == "function" && a.$$typeof === void 0) {
							if (t.tag = 1, t.memoizedState = null, t.updateQueue = null, Wi(r)) {
								var o = !0;
								Ji(t);
							} else o = !1;
							t.memoizedState = a.state !== null && a.state !== void 0 ? a.state : null, ja(t);
							var s = r.getDerivedStateFromProps;
							typeof s == "function" && Ba(t, r, s, e), a.updater = Va, t.stateNode = a, a._reactInternalFiber = t, Ga(t, r, e, n), t = ss(null, t, r, !0, o, n);
						} else t.tag = 0, es(null, t, a, n), t = t.child;
						return t;
					case 16:
						a: {
							if (a = t.elementType, e !== null && (e.alternate = null, t.alternate = null, t.effectTag |= 2), e = t.pendingProps, ze(a), a._status !== 1) throw a._result;
							switch (a = a._result, t.type = a, o = t.tag = al(a), e = Sa(a, e), o) {
								case 0:
									t = as(null, t, a, e, n);
									break a;
								case 1:
									t = os(null, t, a, e, n);
									break a;
								case 11:
									t = ts(null, t, a, e, n);
									break a;
								case 14:
									t = ns(null, t, a, Sa(a.type, e), r, n);
									break a;
							}
							throw Error(i(306, a, ""));
						}
						return t;
					case 0: return r = t.type, a = t.pendingProps, a = t.elementType === r ? a : Sa(r, a), as(e, t, r, a, n);
					case 1: return r = t.type, a = t.pendingProps, a = t.elementType === r ? a : Sa(r, a), os(e, t, r, a, n);
					case 3:
						if (cs(t), r = t.updateQueue, e === null || r === null) throw Error(i(282));
						if (r = t.pendingProps, a = t.memoizedState, a = a === null ? null : a.element, Ma(e, t), Ia(t, r, null, n), r = t.memoizedState.element, r === a) Zo(), t = ms(e, t, n);
						else {
							if ((a = t.stateNode.hydrate) && (Wo = Yn(t.stateNode.containerInfo.firstChild), Uo = t, a = Go = !0), a) for (n = Za(t, null, r, n), t.child = n; n;) n.effectTag = n.effectTag & -3 | 1024, n = n.sibling;
							else es(e, t, r, n), Zo();
							t = t.child;
						}
						return t;
					case 5: return ao(t), e === null && Jo(t), r = t.type, a = t.pendingProps, o = e === null ? null : e.memoizedProps, s = a.children, Kn(r, a) ? s = null : o !== null && Kn(r, o) && (t.effectTag |= 16), is(e, t), t.mode & 4 && n !== 1 && a.hidden ? (t.expirationTime = t.childExpirationTime = 1, t = null) : (es(e, t, s, n), t = t.child), t;
					case 6: return e === null && Jo(t), null;
					case 13: return us(e, t, n);
					case 4: return ro(t, t.stateNode.containerInfo), r = t.pendingProps, e === null ? t.child = Xa(t, null, r, n) : es(e, t, r, n), t.child;
					case 11: return r = t.type, a = t.pendingProps, a = t.elementType === r ? a : Sa(r, a), ts(e, t, r, a, n);
					case 7: return es(e, t, t.pendingProps, n), t.child;
					case 8: return es(e, t, t.pendingProps.children, n), t.child;
					case 12: return es(e, t, t.pendingProps.children, n), t.child;
					case 10:
						a: {
							r = t.type._context, a = t.pendingProps, s = t.memoizedProps, o = a.value;
							var c = t.type._context;
							if (U(Ca, c._currentValue), c._currentValue = o, s !== null) {
								if (c = s.value, o = pi(c, o) ? 0 : (typeof r._calculateChangedBits == "function" ? r._calculateChangedBits(c, o) : 1073741823) | 0, o === 0) {
									if (s.children === a.children && !Vi.current) {
										t = ms(e, t, n);
										break a;
									}
								} else for (c = t.child, c !== null && (c.return = t); c !== null;) {
									var l = c.dependencies;
									if (l !== null) {
										s = c.child;
										for (var u = l.firstContext; u !== null;) {
											if (u.context === r && (u.observedBits & o) !== 0) {
												c.tag === 1 && (u = Na(n, null), u.tag = 2, Pa(c, u)), c.expirationTime < n && (c.expirationTime = n), u = c.alternate, u !== null && u.expirationTime < n && (u.expirationTime = n), Oa(c.return, n), l.expirationTime < n && (l.expirationTime = n);
												break;
											}
											u = u.next;
										}
									} else s = c.tag === 10 && c.type === t.type ? null : c.child;
									if (s !== null) s.return = c;
									else for (s = c; s !== null;) {
										if (s === t) {
											s = null;
											break;
										}
										if (c = s.sibling, c !== null) {
											c.return = s.return, s = c;
											break;
										}
										s = s.return;
									}
									c = s;
								}
							}
							es(e, t, a.children, n), t = t.child;
						}
						return t;
					case 9: return a = t.type, o = t.pendingProps, r = o.children, ka(t, n), a = K(a, o.unstable_observedBits), r = r(a), t.effectTag |= 1, es(e, t, r, n), t.child;
					case 14: return a = t.type, o = Sa(a, t.pendingProps), o = Sa(a.type, o), ns(e, t, a, o, r, n);
					case 15: return rs(e, t, t.type, t.pendingProps, r, n);
					case 17: return r = t.type, a = t.pendingProps, a = t.elementType === r ? a : Sa(r, a), e !== null && (e.alternate = null, t.alternate = null, t.effectTag |= 2), t.tag = 1, Wi(r) ? (e = !0, Ji(t)) : e = !1, ka(t, n), Ua(t, r, a), Ga(t, r, a, n), ss(null, t, r, !0, e, n);
					case 19: return ps(e, t, n);
				}
				throw Error(i(156, t.tag));
			}, $c = null, el = null;
			function tl(e) {
				if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u") return !1;
				var t = __REACT_DEVTOOLS_GLOBAL_HOOK__;
				if (t.isDisabled || !t.supportsFiber) return !0;
				try {
					var n = t.inject(e);
					$c = function(e) {
						try {
							t.onCommitFiberRoot(n, e, void 0, (e.current.effectTag & 64) == 64);
						} catch {}
					}, el = function(e) {
						try {
							t.onCommitFiberUnmount(n, e);
						} catch {}
					};
				} catch {}
				return !0;
			}
			function nl(e, t, n, r) {
				this.tag = e, this.key = n, this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null, this.index = 0, this.ref = null, this.pendingProps = t, this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null, this.mode = r, this.effectTag = 0, this.lastEffect = this.firstEffect = this.nextEffect = null, this.childExpirationTime = this.expirationTime = 0, this.alternate = null;
			}
			function rl(e, t, n, r) {
				return new nl(e, t, n, r);
			}
			function il(e) {
				return e = e.prototype, !(!e || !e.isReactComponent);
			}
			function al(e) {
				if (typeof e == "function") return +!!il(e);
				if (e != null) {
					if (e = e.$$typeof, e === je) return 11;
					if (e === Pe) return 14;
				}
				return 2;
			}
			function ol(e, t) {
				var n = e.alternate;
				return n === null ? (n = rl(e.tag, t, e.key, e.mode), n.elementType = e.elementType, n.type = e.type, n.stateNode = e.stateNode, n.alternate = e, e.alternate = n) : (n.pendingProps = t, n.effectTag = 0, n.nextEffect = null, n.firstEffect = null, n.lastEffect = null), n.childExpirationTime = e.childExpirationTime, n.expirationTime = e.expirationTime, n.child = e.child, n.memoizedProps = e.memoizedProps, n.memoizedState = e.memoizedState, n.updateQueue = e.updateQueue, t = e.dependencies, n.dependencies = t === null ? null : {
					expirationTime: t.expirationTime,
					firstContext: t.firstContext,
					responders: t.responders
				}, n.sibling = e.sibling, n.index = e.index, n.ref = e.ref, n;
			}
			function sl(e, t, n, r, a, o) {
				var s = 2;
				if (r = e, typeof e == "function") il(e) && (s = 1);
				else if (typeof e == "string") s = 5;
				else a: switch (e) {
					case Te: return cl(n.children, a, o, t);
					case Ae:
						s = 8, a |= 7;
						break;
					case Ee:
						s = 8, a |= 1;
						break;
					case De: return e = rl(12, n, t, a | 8), e.elementType = De, e.type = De, e.expirationTime = o, e;
					case Me: return e = rl(13, n, t, a), e.type = Me, e.elementType = Me, e.expirationTime = o, e;
					case Ne: return e = rl(19, n, t, a), e.elementType = Ne, e.expirationTime = o, e;
					default:
						if (typeof e == "object" && e) switch (e.$$typeof) {
							case Oe:
								s = 10;
								break a;
							case ke:
								s = 9;
								break a;
							case je:
								s = 11;
								break a;
							case Pe:
								s = 14;
								break a;
							case Fe:
								s = 16, r = null;
								break a;
							case Ie:
								s = 22;
								break a;
						}
						throw Error(i(130, e == null ? e : typeof e, ""));
				}
				return t = rl(s, n, t, a), t.elementType = e, t.type = r, t.expirationTime = o, t;
			}
			function cl(e, t, n, r) {
				return e = rl(7, e, r, t), e.expirationTime = n, e;
			}
			function ll(e, t, n) {
				return e = rl(6, e, null, t), e.expirationTime = n, e;
			}
			function ul(e, t, n) {
				return t = rl(4, e.children === null ? [] : e.children, e.key, t), t.expirationTime = n, t.stateNode = {
					containerInfo: e.containerInfo,
					pendingChildren: null,
					implementation: e.implementation
				}, t;
			}
			function dl(e, t, n) {
				this.tag = t, this.current = null, this.containerInfo = e, this.pingCache = this.pendingChildren = null, this.finishedExpirationTime = 0, this.finishedWork = null, this.timeoutHandle = -1, this.pendingContext = this.context = null, this.hydrate = n, this.callbackNode = null, this.callbackPriority = 90, this.lastExpiredTime = this.lastPingedTime = this.nextKnownPendingLevel = this.lastSuspendedTime = this.firstSuspendedTime = this.firstPendingTime = 0;
			}
			function fl(e, t) {
				var n = e.firstSuspendedTime;
				return e = e.lastSuspendedTime, n !== 0 && n >= t && e <= t;
			}
			function pl(e, t) {
				var n = e.firstSuspendedTime, r = e.lastSuspendedTime;
				n < t && (e.firstSuspendedTime = t), (r > t || n === 0) && (e.lastSuspendedTime = t), t <= e.lastPingedTime && (e.lastPingedTime = 0), t <= e.lastExpiredTime && (e.lastExpiredTime = 0);
			}
			function ml(e, t) {
				t > e.firstPendingTime && (e.firstPendingTime = t);
				var n = e.firstSuspendedTime;
				n !== 0 && (t >= n ? e.firstSuspendedTime = e.lastSuspendedTime = e.nextKnownPendingLevel = 0 : t >= e.lastSuspendedTime && (e.lastSuspendedTime = t + 1), t > e.nextKnownPendingLevel && (e.nextKnownPendingLevel = t));
			}
			function hl(e, t) {
				var n = e.lastExpiredTime;
				(n === 0 || n > t) && (e.lastExpiredTime = t);
			}
			function gl(e, t, n, r) {
				var a = t.current, o = Sc(), s = Ra.suspense;
				o = Cc(o, a, s);
				a: if (n) {
					n = n._reactInternalFiber;
					b: {
						if (Ct(n) !== n || n.tag !== 1) throw Error(i(170));
						var c = n;
						do {
							switch (c.tag) {
								case 3:
									c = c.stateNode.context;
									break b;
								case 1: if (Wi(c.type)) {
									c = c.stateNode.__reactInternalMemoizedMergedChildContext;
									break b;
								}
							}
							c = c.return;
						} while (c !== null);
						throw Error(i(171));
					}
					if (n.tag === 1) {
						var l = n.type;
						if (Wi(l)) {
							n = qi(n, l, c);
							break a;
						}
					}
					n = c;
				} else n = zi;
				return t.context === null ? t.context = n : t.pendingContext = n, t = Na(o, s), t.payload = { element: e }, r = r === void 0 ? null : r, r !== null && (t.callback = r), Pa(a, t), wc(a, o), o;
			}
			function _l(e) {
				if (e = e.current, !e.child) return null;
				switch (e.child.tag) {
					case 5: return e.child.stateNode;
					default: return e.child.stateNode;
				}
			}
			function vl(e, t) {
				e = e.memoizedState, e !== null && e.dehydrated !== null && e.retryTime < t && (e.retryTime = t);
			}
			function yl(e, t) {
				vl(e, t), (e = e.alternate) && vl(e, t);
			}
			function bl(e, t, n) {
				n = n != null && !0 === n.hydrate;
				var r = new dl(e, t, n), i = rl(3, null, null, t === 2 ? 7 : t === 1 ? 3 : 0);
				r.current = i, i.stateNode = r, ja(i), e[er] = r.current, n && t !== 0 && Zt(e, e.nodeType === 9 ? e : e.ownerDocument), this._internalRoot = r;
			}
			bl.prototype.render = function(e) {
				gl(e, this._internalRoot, null, null);
			}, bl.prototype.unmount = function() {
				var e = this._internalRoot, t = e.containerInfo;
				gl(null, e, null, function() {
					t[er] = null;
				});
			};
			function xl(e) {
				return !(!e || e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11 && (e.nodeType !== 8 || e.nodeValue !== " react-mount-point-unstable "));
			}
			function Sl(e, t) {
				if (t ||= (t = e ? e.nodeType === 9 ? e.documentElement : e.firstChild : null, !(!t || t.nodeType !== 1 || !t.hasAttribute("data-reactroot"))), !t) for (var n; n = e.lastChild;) e.removeChild(n);
				return new bl(e, 0, t ? { hydrate: !0 } : void 0);
			}
			function Cl(e, t, n, r, i) {
				var a = n._reactRootContainer;
				if (a) {
					var o = a._internalRoot;
					if (typeof i == "function") {
						var s = i;
						i = function() {
							var e = _l(o);
							s.call(e);
						};
					}
					gl(t, o, e, i);
				} else {
					if (a = n._reactRootContainer = Sl(n, r), o = a._internalRoot, typeof i == "function") {
						var c = i;
						i = function() {
							var e = _l(o);
							c.call(e);
						};
					}
					Mc(function() {
						gl(t, o, e, i);
					});
				}
				return _l(o);
			}
			function wl(e, t, n) {
				var r = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
				return {
					$$typeof: we,
					key: r == null ? null : "" + r,
					children: e,
					containerInfo: t,
					implementation: n
				};
			}
			Rt = function(e) {
				if (e.tag === 13) {
					var t = xa(Sc(), 150, 100);
					wc(e, t), yl(e, t);
				}
			}, zt = function(e) {
				e.tag === 13 && (wc(e, 3), yl(e, 3));
			}, Bt = function(e) {
				if (e.tag === 13) {
					var t = Sc();
					t = Cc(t, e, null), wc(e, t), yl(e, t);
				}
			}, k = function(e, t, n) {
				switch (t) {
					case "input":
						if (Ye(e, n), t = n.name, n.type === "radio" && t != null) {
							for (n = e; n.parentNode;) n = n.parentNode;
							for (n = n.querySelectorAll("input[name=" + JSON.stringify("" + t) + "][type=\"radio\"]"), t = 0; t < n.length; t++) {
								var r = n[t];
								if (r !== e && r.form === e.form) {
									var a = ir(r);
									if (!a) throw Error(i(90));
									Ke(r), Ye(r, a);
								}
							}
						}
						break;
					case "textarea":
						rt(e, n);
						break;
					case "select": t = n.value, t != null && et(e, !!n.multiple, t, !1);
				}
			}, ne = jc, re = function(e, t, n, r, i) {
				var a = X;
				X |= 4;
				try {
					return ga(98, e.bind(null, t, n, r, i));
				} finally {
					X = a, X === Gs && ya();
				}
			}, ie = function() {
				(X & (1 | qs | Js)) === Gs && (Ac(), Kc());
			}, ae = function(e, t) {
				var n = X;
				X |= 2;
				try {
					return e(t);
				} finally {
					X = n, X === Gs && ya();
				}
			};
			function Tl(e, t) {
				var n = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
				if (!xl(t)) throw Error(i(200));
				return wl(e, t, null, n);
			}
			var El = { Events: [
				nr,
				rr,
				ir,
				O,
				T,
				dr,
				function(e) {
					Ot(e, ur);
				},
				te,
				N,
				xn,
				jt,
				Kc,
				{ current: !1 }
			] };
			(function(e) {
				var t = e.findFiberByHostInstance;
				return tl(n({}, e, {
					overrideHookState: null,
					overrideProps: null,
					setSuspenseHandler: null,
					scheduleUpdate: null,
					currentDispatcherRef: ye.ReactCurrentDispatcher,
					findHostInstanceByFiber: function(e) {
						return e = Et(e), e === null ? null : e.stateNode;
					},
					findFiberByHostInstance: function(e) {
						return t ? t(e) : null;
					},
					findHostInstancesForRefresh: null,
					scheduleRefresh: null,
					scheduleRoot: null,
					setRefreshHandler: null,
					getCurrentFiber: null
				}));
			})({
				findFiberByHostInstance: tr,
				bundleType: 0,
				version: "16.14.0",
				rendererPackageName: "react-dom"
			}), e.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = El, e.createPortal = Tl, e.findDOMNode = function(e) {
				if (e == null) return null;
				if (e.nodeType === 1) return e;
				var t = e._reactInternalFiber;
				if (t === void 0) throw typeof e.render == "function" ? Error(i(188)) : Error(i(268, Object.keys(e)));
				return e = Et(t), e = e === null ? null : e.stateNode, e;
			}, e.flushSync = function(e, t) {
				if ((X & (qs | Js)) !== Gs) throw Error(i(187));
				var n = X;
				X |= 1;
				try {
					return ga(99, e.bind(null, t));
				} finally {
					X = n, ya();
				}
			}, e.hydrate = function(e, t, n) {
				if (!xl(t)) throw Error(i(200));
				return Cl(null, e, t, !0, n);
			}, e.render = function(e, t, n) {
				if (!xl(t)) throw Error(i(200));
				return Cl(null, e, t, !1, n);
			}, e.unmountComponentAtNode = function(e) {
				if (!xl(e)) throw Error(i(40));
				return e._reactRootContainer ? (Mc(function() {
					Cl(null, null, e, !1, function() {
						e._reactRootContainer = null, e[er] = null;
					});
				}), !0) : !1;
			}, e.unstable_batchedUpdates = jc, e.unstable_createPortal = function(e, t) {
				return Tl(e, t, 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null);
			}, e.unstable_renderSubtreeIntoContainer = function(e, t, n, r) {
				if (!xl(n)) throw Error(i(200));
				if (e == null || e._reactInternalFiber === void 0) throw Error(i(38));
				return Cl(e, t, n, !1, r);
			}, e.version = "16.14.0";
		})), v = s(((e, t) => {
			function n() {
				if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u" && typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE == "function") try {
					__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(n);
				} catch (e) {
					console.error(e);
				}
			}
			n(), t.exports = _();
		})), y = u(m()), b = u(v());
		function x(e) {
			return "Minified Redux error #" + e + "; visit https://redux.js.org/Errors?code=" + e + " for the full message or use the non-minified dev environment for full errors. ";
		}
		var S = (function() {
			return typeof Symbol == "function" && Symbol.observable || "@@observable";
		})(), C = function() {
			return Math.random().toString(36).substring(7).split("").join(".");
		}, w = {
			INIT: "@@redux/INIT" + C(),
			REPLACE: "@@redux/REPLACE" + C(),
			PROBE_UNKNOWN_ACTION: function() {
				return "@@redux/PROBE_UNKNOWN_ACTION" + C();
			}
		};
		function T(e) {
			if (typeof e != "object" || !e) return !1;
			for (var t = e; Object.getPrototypeOf(t) !== null;) t = Object.getPrototypeOf(t);
			return Object.getPrototypeOf(e) === t;
		}
		function E(e, t, n) {
			var r;
			if (typeof t == "function" && typeof n == "function" || typeof n == "function" && typeof arguments[3] == "function") throw Error(x(0));
			if (typeof t == "function" && n === void 0 && (n = t, t = void 0), n !== void 0) {
				if (typeof n != "function") throw Error(x(1));
				return n(E)(e, t);
			}
			if (typeof e != "function") throw Error(x(2));
			var i = e, a = t, o = [], s = o, c = !1;
			function l() {
				s === o && (s = o.slice());
			}
			function u() {
				if (c) throw Error(x(3));
				return a;
			}
			function d(e) {
				if (typeof e != "function") throw Error(x(4));
				if (c) throw Error(x(5));
				var t = !0;
				return l(), s.push(e), function() {
					if (t) {
						if (c) throw Error(x(6));
						t = !1, l();
						var n = s.indexOf(e);
						s.splice(n, 1), o = null;
					}
				};
			}
			function f(e) {
				if (!T(e)) throw Error(x(7));
				if (e.type === void 0) throw Error(x(8));
				if (c) throw Error(x(9));
				try {
					c = !0, a = i(a, e);
				} finally {
					c = !1;
				}
				for (var t = o = s, n = 0; n < t.length; n++) {
					var r = t[n];
					r();
				}
				return e;
			}
			function p(e) {
				if (typeof e != "function") throw Error(x(10));
				i = e, f({ type: w.REPLACE });
			}
			function m() {
				var e, t = d;
				return e = { subscribe: function(e) {
					if (typeof e != "object" || !e) throw Error(x(11));
					function n() {
						e.next && e.next(u());
					}
					return n(), { unsubscribe: t(n) };
				} }, e[S] = function() {
					return this;
				}, e;
			}
			return f({ type: w.INIT }), r = {
				dispatch: f,
				subscribe: d,
				getState: u,
				replaceReducer: p
			}, r[S] = m, r;
		}
		var D = s(((e, t) => {
			t.exports = "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED";
		})), O = s(((e, t) => {
			var n = D();
			function r() {}
			function i() {}
			i.resetWarningCache = r, t.exports = function() {
				function e(e, t, r, i, a, o) {
					if (o !== n) {
						var s = Error("Calling PropTypes validators directly is not supported by the `prop-types` package. Use PropTypes.checkPropTypes() to call them. Read more at http://fb.me/use-check-prop-types");
						throw s.name = "Invariant Violation", s;
					}
				}
				e.isRequired = e;
				function t() {
					return e;
				}
				var a = {
					array: e,
					bigint: e,
					bool: e,
					func: e,
					number: e,
					object: e,
					string: e,
					symbol: e,
					any: e,
					arrayOf: t,
					element: e,
					elementType: e,
					instanceOf: t,
					node: e,
					objectOf: t,
					oneOf: t,
					oneOfType: t,
					shape: t,
					exact: t,
					checkPropTypes: i,
					resetWarningCache: r
				};
				return a.PropTypes = a, a;
			};
		})), ee = s(((e, t) => {
			t.exports = O()();
		})), k = y.createContext(null);
		function A(e) {
			e();
		}
		var j = A, M = function(e) {
			return j = e;
		}, te = function() {
			return j;
		};
		function N() {
			var e = te(), t = null, n = null;
			return {
				clear: function() {
					t = null, n = null;
				},
				notify: function() {
					e(function() {
						for (var e = t; e;) e.callback(), e = e.next;
					});
				},
				get: function() {
					for (var e = [], n = t; n;) e.push(n), n = n.next;
					return e;
				},
				subscribe: function(e) {
					var r = !0, i = n = {
						callback: e,
						next: null,
						prev: n
					};
					return i.prev ? i.prev.next = i : t = i, function() {
						!r || t === null || (r = !1, i.next ? i.next.prev = i.prev : n = i.prev, i.prev ? i.prev.next = i.next : t = i.next);
					};
				}
			};
		}
		var ne = {
			notify: function() {},
			get: function() {
				return [];
			}
		};
		function re(e, t) {
			var n, r = ne;
			function i(e) {
				return c(), r.subscribe(e);
			}
			function a() {
				r.notify();
			}
			function o() {
				u.onStateChange && u.onStateChange();
			}
			function s() {
				return !!n;
			}
			function c() {
				n || (n = t ? t.addNestedSub(o) : e.subscribe(o), r = N());
			}
			function l() {
				n && (n(), n = void 0, r.clear(), r = ne);
			}
			var u = {
				addNestedSub: i,
				notifyNestedSubs: a,
				handleChangeWrapper: o,
				isSubscribed: s,
				trySubscribe: c,
				tryUnsubscribe: l,
				getListeners: function() {
					return r;
				}
			};
			return u;
		}
		var ie = typeof window < "u" && window.document !== void 0 && window.document.createElement !== void 0 ? y.useLayoutEffect : y.useEffect;
		function ae(e) {
			var t = e.store, n = e.context, r = e.children, i = (0, y.useMemo)(function() {
				return {
					store: t,
					subscription: re(t)
				};
			}, [t]), a = (0, y.useMemo)(function() {
				return t.getState();
			}, [t]);
			ie(function() {
				var e = i.subscription;
				return e.onStateChange = e.notifyNestedSubs, e.trySubscribe(), a !== t.getState() && e.notifyNestedSubs(), function() {
					e.tryUnsubscribe(), e.onStateChange = null;
				};
			}, [i, a]);
			var o = n || k;
			return y.createElement(o.Provider, { value: i }, r);
		}
		function oe() {
			return oe = Object.assign ? Object.assign.bind() : function(e) {
				for (var t = 1; t < arguments.length; t++) {
					var n = arguments[t];
					for (var r in n) ({}).hasOwnProperty.call(n, r) && (e[r] = n[r]);
				}
				return e;
			}, oe.apply(null, arguments);
		}
		function P(e, t) {
			if (e == null) return {};
			var n = {};
			for (var r in e) if ({}.hasOwnProperty.call(e, r)) {
				if (t.indexOf(r) !== -1) continue;
				n[r] = e[r];
			}
			return n;
		}
		var se = s(((e) => {
			var t = typeof Symbol == "function" && Symbol.for, n = t ? Symbol.for("react.element") : 60103, r = t ? Symbol.for("react.portal") : 60106, i = t ? Symbol.for("react.fragment") : 60107, a = t ? Symbol.for("react.strict_mode") : 60108, o = t ? Symbol.for("react.profiler") : 60114, s = t ? Symbol.for("react.provider") : 60109, c = t ? Symbol.for("react.context") : 60110, l = t ? Symbol.for("react.async_mode") : 60111, u = t ? Symbol.for("react.concurrent_mode") : 60111, d = t ? Symbol.for("react.forward_ref") : 60112, f = t ? Symbol.for("react.suspense") : 60113, p = t ? Symbol.for("react.suspense_list") : 60120, m = t ? Symbol.for("react.memo") : 60115, h = t ? Symbol.for("react.lazy") : 60116, g = t ? Symbol.for("react.block") : 60121, _ = t ? Symbol.for("react.fundamental") : 60117, v = t ? Symbol.for("react.responder") : 60118, y = t ? Symbol.for("react.scope") : 60119;
			function b(e) {
				if (typeof e == "object" && e) {
					var t = e.$$typeof;
					switch (t) {
						case n: switch (e = e.type, e) {
							case l:
							case u:
							case i:
							case o:
							case a:
							case f: return e;
							default: switch (e &&= e.$$typeof, e) {
								case c:
								case d:
								case h:
								case m:
								case s: return e;
								default: return t;
							}
						}
						case r: return t;
					}
				}
			}
			function x(e) {
				return b(e) === u;
			}
			e.AsyncMode = l, e.ConcurrentMode = u, e.ContextConsumer = c, e.ContextProvider = s, e.Element = n, e.ForwardRef = d, e.Fragment = i, e.Lazy = h, e.Memo = m, e.Portal = r, e.Profiler = o, e.StrictMode = a, e.Suspense = f, e.isAsyncMode = function(e) {
				return x(e) || b(e) === l;
			}, e.isConcurrentMode = x, e.isContextConsumer = function(e) {
				return b(e) === c;
			}, e.isContextProvider = function(e) {
				return b(e) === s;
			}, e.isElement = function(e) {
				return typeof e == "object" && !!e && e.$$typeof === n;
			}, e.isForwardRef = function(e) {
				return b(e) === d;
			}, e.isFragment = function(e) {
				return b(e) === i;
			}, e.isLazy = function(e) {
				return b(e) === h;
			}, e.isMemo = function(e) {
				return b(e) === m;
			}, e.isPortal = function(e) {
				return b(e) === r;
			}, e.isProfiler = function(e) {
				return b(e) === o;
			}, e.isStrictMode = function(e) {
				return b(e) === a;
			}, e.isSuspense = function(e) {
				return b(e) === f;
			}, e.isValidElementType = function(e) {
				return typeof e == "string" || typeof e == "function" || e === i || e === u || e === o || e === a || e === f || e === p || typeof e == "object" && !!e && (e.$$typeof === h || e.$$typeof === m || e.$$typeof === s || e.$$typeof === c || e.$$typeof === d || e.$$typeof === _ || e.$$typeof === v || e.$$typeof === y || e.$$typeof === g);
			}, e.typeOf = b;
		})), ce = s(((e, t) => {
			t.exports = se();
		})), le = s(((e, t) => {
			var n = ce(), r = {
				childContextTypes: !0,
				contextType: !0,
				contextTypes: !0,
				defaultProps: !0,
				displayName: !0,
				getDefaultProps: !0,
				getDerivedStateFromError: !0,
				getDerivedStateFromProps: !0,
				mixins: !0,
				propTypes: !0,
				type: !0
			}, i = {
				name: !0,
				length: !0,
				prototype: !0,
				caller: !0,
				callee: !0,
				arguments: !0,
				arity: !0
			}, a = {
				$$typeof: !0,
				render: !0,
				defaultProps: !0,
				displayName: !0,
				propTypes: !0
			}, o = {
				$$typeof: !0,
				compare: !0,
				defaultProps: !0,
				displayName: !0,
				propTypes: !0,
				type: !0
			}, s = {};
			s[n.ForwardRef] = a, s[n.Memo] = o;
			function c(e) {
				return n.isMemo(e) ? o : s[e.$$typeof] || r;
			}
			var l = Object.defineProperty, u = Object.getOwnPropertyNames, d = Object.getOwnPropertySymbols, f = Object.getOwnPropertyDescriptor, p = Object.getPrototypeOf, m = Object.prototype;
			function h(e, t, n) {
				if (typeof t != "string") {
					if (m) {
						var r = p(t);
						r && r !== m && h(e, r, n);
					}
					var a = u(t);
					d && (a = a.concat(d(t)));
					for (var o = c(e), s = c(t), g = 0; g < a.length; ++g) {
						var _ = a[g];
						if (!i[_] && !(n && n[_]) && !(s && s[_]) && !(o && o[_])) {
							var v = f(t, _);
							try {
								l(e, _, v);
							} catch {}
						}
					}
				}
				return e;
			}
			t.exports = h;
		})), ue = s(((e) => {
			var t = 60103, n = 60106, r = 60107, i = 60108, a = 60114, o = 60109, s = 60110, c = 60112, l = 60113, u = 60120, d = 60115, f = 60116;
			if (typeof Symbol == "function" && Symbol.for) {
				var p = Symbol.for;
				t = p("react.element"), n = p("react.portal"), r = p("react.fragment"), i = p("react.strict_mode"), a = p("react.profiler"), o = p("react.provider"), s = p("react.context"), c = p("react.forward_ref"), l = p("react.suspense"), u = p("react.suspense_list"), d = p("react.memo"), f = p("react.lazy"), p("react.block"), p("react.server.block"), p("react.fundamental"), p("react.debug_trace_mode"), p("react.legacy_hidden");
			}
			function m(e) {
				if (typeof e == "object" && e) {
					var p = e.$$typeof;
					switch (p) {
						case t: switch (e = e.type, e) {
							case r:
							case a:
							case i:
							case l:
							case u: return e;
							default: switch (e &&= e.$$typeof, e) {
								case s:
								case c:
								case f:
								case d:
								case o: return e;
								default: return p;
							}
						}
						case n: return p;
					}
				}
			}
			e.isContextConsumer = function(e) {
				return m(e) === s;
			};
		})), de = s(((e, t) => {
			t.exports = ue();
		})), fe = u(le()), pe = de(), me = [
			"getDisplayName",
			"methodName",
			"renderCountProp",
			"shouldHandleStateChanges",
			"storeKey",
			"withRef",
			"forwardRef",
			"context"
		], he = ["reactReduxForwardedRef"], ge = [], F = [null, null];
		function _e(e, t) {
			var n = e[1];
			return [t.payload, n + 1];
		}
		function ve(e, t, n) {
			ie(function() {
				return e.apply(void 0, t);
			}, n);
		}
		function ye(e, t, n, r, i, a, o) {
			e.current = r, t.current = i, n.current = !1, a.current && (a.current = null, o());
		}
		function be(e, t, n, r, i, a, o, s, c, l) {
			if (e) {
				var u = !1, d = null, f = function() {
					if (!u) {
						var e = t.getState(), n, f;
						try {
							n = r(e, i.current);
						} catch (e) {
							f = e, d = e;
						}
						f || (d = null), n === a.current ? o.current || c() : (a.current = n, s.current = n, o.current = !0, l({
							type: "STORE_UPDATED",
							payload: { error: f }
						}));
					}
				};
				return n.onStateChange = f, n.trySubscribe(), f(), function() {
					if (u = !0, n.tryUnsubscribe(), n.onStateChange = null, d) throw d;
				};
			}
		}
		var xe = function() {
			return [null, 0];
		};
		function Se(e, t) {
			t === void 0 && (t = {});
			var n = t, r = n.getDisplayName, i = r === void 0 ? function(e) {
				return "ConnectAdvanced(" + e + ")";
			} : r, a = n.methodName, o = a === void 0 ? "connectAdvanced" : a, s = n.renderCountProp, c = s === void 0 ? void 0 : s, l = n.shouldHandleStateChanges, u = l === void 0 || l, d = n.storeKey, f = d === void 0 ? "store" : d;
			n.withRef;
			var p = n.forwardRef, m = p !== void 0 && p, h = n.context, g = h === void 0 ? k : h, _ = P(n, me), v = g;
			return function(t) {
				var n = t.displayName || t.name || "Component", r = i(n), a = oe({}, _, {
					getDisplayName: i,
					methodName: o,
					renderCountProp: c,
					shouldHandleStateChanges: u,
					storeKey: f,
					displayName: r,
					wrappedComponentName: n,
					WrappedComponent: t
				}), s = _.pure;
				function l(t) {
					return e(t.dispatch, a);
				}
				var d = s ? y.useMemo : function(e) {
					return e();
				};
				function p(e) {
					var n = (0, y.useMemo)(function() {
						var t = e.reactReduxForwardedRef, n = P(e, he);
						return [
							e.context,
							t,
							n
						];
					}, [e]), r = n[0], i = n[1], a = n[2], o = (0, y.useMemo)(function() {
						return r && r.Consumer && (0, pe.isContextConsumer)(y.createElement(r.Consumer, null)) ? r : v;
					}, [r, v]), s = (0, y.useContext)(o), c = !!e.store && !!e.store.getState && !!e.store.dispatch;
					s && s.store;
					var f = c ? e.store : s.store, p = (0, y.useMemo)(function() {
						return l(f);
					}, [f]), m = (0, y.useMemo)(function() {
						if (!u) return F;
						var e = re(f, c ? null : s.subscription);
						return [e, e.notifyNestedSubs.bind(e)];
					}, [
						f,
						c,
						s
					]), h = m[0], g = m[1], _ = (0, y.useMemo)(function() {
						return c ? s : oe({}, s, { subscription: h });
					}, [
						c,
						s,
						h
					]), b = (0, y.useReducer)(_e, ge, xe), x = b[0][0], S = b[1];
					if (x && x.error) throw x.error;
					var C = (0, y.useRef)(), w = (0, y.useRef)(a), T = (0, y.useRef)(), E = (0, y.useRef)(!1), D = d(function() {
						return T.current && a === w.current ? T.current : p(f.getState(), a);
					}, [
						f,
						x,
						a
					]);
					ve(ye, [
						w,
						C,
						E,
						a,
						D,
						T,
						g
					]), ve(be, [
						u,
						f,
						h,
						p,
						w,
						C,
						E,
						T,
						g,
						S
					], [
						f,
						h,
						p
					]);
					var O = (0, y.useMemo)(function() {
						return y.createElement(t, oe({}, D, { ref: i }));
					}, [
						i,
						t,
						D
					]);
					return (0, y.useMemo)(function() {
						return u ? y.createElement(o.Provider, { value: _ }, O) : O;
					}, [
						o,
						O,
						_
					]);
				}
				var h = s ? y.memo(p) : p;
				if (h.WrappedComponent = t, h.displayName = p.displayName = r, m) {
					var g = y.forwardRef(function(e, t) {
						return y.createElement(h, oe({}, e, { reactReduxForwardedRef: t }));
					});
					return g.displayName = r, g.WrappedComponent = t, (0, fe.default)(g, t);
				}
				return (0, fe.default)(h, t);
			};
		}
		function Ce(e, t) {
			return e === t ? e !== 0 || t !== 0 || 1 / e == 1 / t : e !== e && t !== t;
		}
		function we(e, t) {
			if (Ce(e, t)) return !0;
			if (typeof e != "object" || !e || typeof t != "object" || !t) return !1;
			var n = Object.keys(e), r = Object.keys(t);
			if (n.length !== r.length) return !1;
			for (var i = 0; i < n.length; i++) if (!Object.prototype.hasOwnProperty.call(t, n[i]) || !Ce(e[n[i]], t[n[i]])) return !1;
			return !0;
		}
		function Te(e, t) {
			var n = {}, r = function(r) {
				var i = e[r];
				typeof i == "function" && (n[r] = function() {
					return t(i.apply(void 0, arguments));
				});
			};
			for (var i in e) r(i);
			return n;
		}
		function Ee(e) {
			return function(t, n) {
				var r = e(t, n);
				function i() {
					return r;
				}
				return i.dependsOnOwnProps = !1, i;
			};
		}
		function De(e) {
			return e.dependsOnOwnProps !== null && e.dependsOnOwnProps !== void 0 ? !!e.dependsOnOwnProps : e.length !== 1;
		}
		function Oe(e, t) {
			return function(t, n) {
				n.displayName;
				var r = function(e, t) {
					return r.dependsOnOwnProps ? r.mapToProps(e, t) : r.mapToProps(e);
				};
				return r.dependsOnOwnProps = !0, r.mapToProps = function(t, n) {
					r.mapToProps = e, r.dependsOnOwnProps = De(e);
					var i = r(t, n);
					return typeof i == "function" && (r.mapToProps = i, r.dependsOnOwnProps = De(i), i = r(t, n)), i;
				}, r;
			};
		}
		function ke(e) {
			return typeof e == "function" ? Oe(e, "mapDispatchToProps") : void 0;
		}
		function Ae(e) {
			return e ? void 0 : Ee(function(e) {
				return { dispatch: e };
			});
		}
		function je(e) {
			return e && typeof e == "object" ? Ee(function(t) {
				return Te(e, t);
			}) : void 0;
		}
		var Me = [
			ke,
			Ae,
			je
		];
		function Ne(e) {
			return typeof e == "function" ? Oe(e, "mapStateToProps") : void 0;
		}
		function Pe(e) {
			return e ? void 0 : Ee(function() {
				return {};
			});
		}
		var Fe = [Ne, Pe];
		function Ie(e, t, n) {
			return oe({}, n, e, t);
		}
		function Le(e) {
			return function(t, n) {
				n.displayName;
				var r = n.pure, i = n.areMergedPropsEqual, a = !1, o;
				return function(t, n, s) {
					var c = e(t, n, s);
					return a ? r && i(c, o) || (o = c) : (a = !0, o = c), o;
				};
			};
		}
		function Re(e) {
			return typeof e == "function" ? Le(e) : void 0;
		}
		function ze(e) {
			return e ? void 0 : function() {
				return Ie;
			};
		}
		var Be = [Re, ze], Ve = [
			"initMapStateToProps",
			"initMapDispatchToProps",
			"initMergeProps"
		];
		function He(e, t, n, r) {
			return function(i, a) {
				return n(e(i, a), t(r, a), a);
			};
		}
		function Ue(e, t, n, r, i) {
			var a = i.areStatesEqual, o = i.areOwnPropsEqual, s = i.areStatePropsEqual, c = !1, l, u, d, f, p;
			function m(i, a) {
				return l = i, u = a, d = e(l, u), f = t(r, u), p = n(d, f, u), c = !0, p;
			}
			function h() {
				return d = e(l, u), t.dependsOnOwnProps && (f = t(r, u)), p = n(d, f, u), p;
			}
			function g() {
				return e.dependsOnOwnProps && (d = e(l, u)), t.dependsOnOwnProps && (f = t(r, u)), p = n(d, f, u), p;
			}
			function _() {
				var t = e(l, u), r = !s(t, d);
				return d = t, r && (p = n(d, f, u)), p;
			}
			function v(e, t) {
				var n = !o(t, u), r = !a(e, l, t, u);
				return l = e, u = t, n && r ? h() : n ? g() : r ? _() : p;
			}
			return function(e, t) {
				return c ? v(e, t) : m(e, t);
			};
		}
		function We(e, t) {
			var n = t.initMapStateToProps, r = t.initMapDispatchToProps, i = t.initMergeProps, a = P(t, Ve), o = n(e, a), s = r(e, a), c = i(e, a);
			return (a.pure ? Ue : He)(o, s, c, e, a);
		}
		var Ge = [
			"pure",
			"areStatesEqual",
			"areOwnPropsEqual",
			"areStatePropsEqual",
			"areMergedPropsEqual"
		];
		function Ke(e, t, n) {
			for (var r = t.length - 1; r >= 0; r--) {
				var i = t[r](e);
				if (i) return i;
			}
			return function(t, r) {
				throw Error("Invalid value of type " + typeof e + " for " + n + " argument when connecting component " + r.wrappedComponentName + ".");
			};
		}
		function qe(e, t) {
			return e === t;
		}
		function Je(e) {
			var t = e === void 0 ? {} : e, n = t.connectHOC, r = n === void 0 ? Se : n, i = t.mapStateToPropsFactories, a = i === void 0 ? Fe : i, o = t.mapDispatchToPropsFactories, s = o === void 0 ? Me : o, c = t.mergePropsFactories, l = c === void 0 ? Be : c, u = t.selectorFactory, d = u === void 0 ? We : u;
			return function(e, t, n, i) {
				i === void 0 && (i = {});
				var o = i, c = o.pure, u = c === void 0 || c, f = o.areStatesEqual, p = f === void 0 ? qe : f, m = o.areOwnPropsEqual, h = m === void 0 ? we : m, g = o.areStatePropsEqual, _ = g === void 0 ? we : g, v = o.areMergedPropsEqual, y = v === void 0 ? we : v, b = P(o, Ge), x = Ke(e, a, "mapStateToProps"), S = Ke(t, s, "mapDispatchToProps"), C = Ke(n, l, "mergeProps");
				return r(d, oe({
					methodName: "connect",
					getDisplayName: function(e) {
						return "Connect(" + e + ")";
					},
					shouldHandleStateChanges: !!e,
					initMapStateToProps: x,
					initMapDispatchToProps: S,
					initMergeProps: C,
					pure: u,
					areStatesEqual: p,
					areOwnPropsEqual: h,
					areStatePropsEqual: _,
					areMergedPropsEqual: y
				}, b));
			};
		}
		var I = Je();
		M(b.unstable_batchedUpdates);
		var Ye = "SET_MODEL_CURRENT_ROOT_NAME", Xe = "SET_MODEL_CURRENT_NODE", Ze = "SET_MODEL_ACTIVE_TAB", Qe = "TOGGLE_MODEL_SHOW_MARKERS", $e = "TOGGLE_MODEL_SHOW_COMPACT_TEXT", et = "UPDATE_MODEL_STATE";
		function tt(e) {
			return {
				type: Ye,
				currentRootName: e
			};
		}
		function nt(e) {
			return {
				type: Xe,
				currentNode: e
			};
		}
		function rt(e) {
			return {
				type: Ze,
				tabName: e
			};
		}
		function it() {
			return { type: Qe };
		}
		function at() {
			return { type: $e };
		}
		function ot() {
			return { type: et };
		}
		var st = "TOGGLE_IS_COLLAPSED", ct = "SET_HEIGHT", lt = "SET_SIDE_PANE_WIDTH", ut = "SET_EDITORS", dt = "SET_CURRENT_EDITOR_NAME", ft = "UPDATE_CURRENT_EDITOR_IS_READ_ONLY", pt = "SET_ACTIVE_INSPECTOR_TAB";
		function mt() {
			return { type: st };
		}
		function ht(e) {
			return {
				type: ct,
				newHeight: e
			};
		}
		function gt(e) {
			return {
				type: lt,
				newWidth: e
			};
		}
		function _t(e) {
			return {
				type: ut,
				editors: e
			};
		}
		function vt(e) {
			return {
				type: dt,
				editorName: e
			};
		}
		function yt(e) {
			return {
				type: pt,
				tabName: e
			};
		}
		function bt() {
			return { type: ft };
		}
		function xt(e) {
			return e && e.is("element");
		}
		function St(e) {
			return e && e.is("rootElement");
		}
		function Ct(e) {
			return e.getPath ? e.getPath() : e.path;
		}
		function wt(e) {
			return {
				path: Ct(e),
				stickiness: e.stickiness,
				index: e.index,
				isAtEnd: e.isAtEnd,
				isAtStart: e.isAtStart,
				offset: e.offset,
				textNode: e.textNode && e.textNode.data
			};
		}
		var L = class {
			static group(...e) {
				console.group(...e);
			}
			static groupEnd(...e) {
				console.groupEnd(...e);
			}
			static log(...e) {
				console.log(...e);
			}
			static warn(...e) {
				console.warn(...e);
			}
		}, Tt = 0;
		function Et(e) {
			let t = {
				editors: {},
				options: {}
			};
			if (typeof e[0] == "string") L.warn(`[CKEditorInspector] The CKEditorInspector.attach( '${e[0]}', editor ) syntax has been deprecated and will be removed in the near future. To pass a name of an editor instance, use CKEditorInspector.attach( { '${e[0]}': editor } ) instead. Learn more in https://github.com/ckeditor/ckeditor5-inspector/blob/master/README.md.`), t.editors[e[0]] = e[1];
			else {
				if (kt(e[0])) t.editors[Dt()] = e[0];
				else for (let n in e[0]) t.editors[n] = e[0][n];
				t.options = e[1] || t.options;
			}
			return t;
		}
		function Dt() {
			return `editor-${++Tt}`;
		}
		function Ot(e) {
			return [...e][0][0] || "";
		}
		function kt(e) {
			return !!e.model && !!e.editing;
		}
		function At(e, t) {
			let n = Math.min(e.length, t.length);
			for (let r = 0; r < n; r++) if (e[r] != t[r]) return r;
			return e.length == t.length ? "same" : e.length < t.length ? "prefix" : "extension";
		}
		var jt = s(((e) => {
			Object.defineProperty(e, "__esModule", { value: !0 }), e.stringifyPath = e.quoteKey = e.isValidVariableName = e.IS_VALID_IDENTIFIER = e.quoteString = void 0;
			var t = /[\\\'\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g, n = /* @__PURE__ */ new Map([
				["\b", "\\b"],
				["	", "\\t"],
				["\n", "\\n"],
				["\f", "\\f"],
				["\r", "\\r"],
				["'", "\\'"],
				["\"", "\\\""],
				["\\", "\\\\"]
			]);
			function r(e) {
				return n.get(e) || `\\u${`0000${e.charCodeAt(0).toString(16)}`.slice(-4)}`;
			}
			function i(e) {
				return `'${e.replace(t, r)}'`;
			}
			e.quoteString = i;
			var a = new Set("break else new var case finally return void catch for switch while continue function this with default if throw delete in try do instanceof typeof abstract enum int short boolean export interface static byte extends long super char final native synchronized class float package throws const goto private transient debugger implements protected volatile double import public let yield".split(" "));
			e.IS_VALID_IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
			function o(t) {
				return typeof t == "string" && !a.has(t) && e.IS_VALID_IDENTIFIER.test(t);
			}
			e.isValidVariableName = o;
			function s(e, t) {
				return o(e) ? e : t(e);
			}
			e.quoteKey = s;
			function c(e, t) {
				let n = "";
				for (let r of e) o(r) ? n += `.${r}` : n += `[${t(r)}]`;
				return n;
			}
			e.stringifyPath = c;
		})), Mt = s(((e) => {
			Object.defineProperty(e, "__esModule", { value: !0 }), e.FunctionParser = e.dedentFunction = e.functionToString = e.USED_METHOD_KEY = void 0;
			var t = jt(), n = { " "() {} }[" "].toString().charAt(0) === "\"", r = {
				Function: "function ",
				GeneratorFunction: "function* ",
				AsyncFunction: "async function ",
				AsyncGeneratorFunction: "async function* "
			}, i = {
				Function: "",
				GeneratorFunction: "*",
				AsyncFunction: "async ",
				AsyncGeneratorFunction: "async *"
			}, a = new Set("case delete else in instanceof new return throw typeof void , ; : + - ! ~ & | ^ * / % < > ? =".split(" "));
			e.USED_METHOD_KEY = /* @__PURE__ */ new WeakSet(), e.functionToString = (t, n, r, i) => {
				let a = typeof i == "string" ? i : void 0;
				return a !== void 0 && e.USED_METHOD_KEY.add(t), new s(t, n, r, a).stringify();
			};
			function o(e) {
				let t;
				for (let n of e.split("\n").slice(1)) {
					let r = /^[\s\t]+/.exec(n);
					if (!r) return e;
					let [i] = r;
					(t === void 0 || i.length < t.length) && (t = i);
				}
				return t ? e.split(`\n${t}`).join("\n") : e;
			}
			e.dedentFunction = o;
			var s = class {
				constructor(e, n, r, i) {
					this.fn = e, this.indent = n, this.next = r, this.key = i, this.pos = 0, this.hadKeyword = !1, this.fnString = Function.prototype.toString.call(e), this.fnType = e.constructor.name, this.keyQuote = i === void 0 ? "" : t.quoteKey(i, r), this.keyPrefix = i === void 0 ? "" : `${this.keyQuote}:${n ? " " : ""}`, this.isMethodCandidate = i === void 0 ? !1 : this.fn.name === "" || this.fn.name === i;
				}
				stringify() {
					let e = this.tryParse();
					return e ? o(e) : `${this.keyPrefix}void ${this.next(this.fnString)}`;
				}
				getPrefix() {
					return this.isMethodCandidate && !this.hadKeyword ? i[this.fnType] + this.keyQuote : this.keyPrefix + r[this.fnType];
				}
				tryParse() {
					if (this.fnString[this.fnString.length - 1] !== "}") return this.keyPrefix + this.fnString;
					if (this.fn.name) {
						let e = this.tryStrippingName();
						if (e) return e;
					}
					let e = this.pos;
					if (this.consumeSyntax() === "class") return this.fnString;
					if (this.pos = e, this.tryParsePrefixTokens()) {
						let e = this.tryStrippingName();
						if (e) return e;
						let t = this.pos;
						switch (this.consumeSyntax("WORD_LIKE")) {
							case "WORD_LIKE": this.isMethodCandidate && !this.hadKeyword && (t = this.pos);
							case "()":
								if (this.fnString.substr(this.pos, 2) === "=>") return this.keyPrefix + this.fnString;
								this.pos = t;
							case "\"":
							case "'":
							case "[]": return this.getPrefix() + this.fnString.substr(this.pos);
						}
					}
				}
				tryStrippingName() {
					if (n) return;
					let e = this.pos, r = this.fnString.substr(this.pos, this.fn.name.length);
					if (r === this.fn.name && (this.pos += r.length, this.consumeSyntax() === "()" && this.consumeSyntax() === "{}" && this.pos === this.fnString.length)) return (this.isMethodCandidate || !t.isValidVariableName(r)) && (e += r.length), this.getPrefix() + this.fnString.substr(e);
					this.pos = e;
				}
				tryParsePrefixTokens() {
					let e = this.pos;
					switch (this.hadKeyword = !1, this.fnType) {
						case "AsyncFunction":
							if (this.consumeSyntax() !== "async") return !1;
							e = this.pos;
						case "Function": return this.consumeSyntax() === "function" ? this.hadKeyword = !0 : this.pos = e, !0;
						case "AsyncGeneratorFunction": if (this.consumeSyntax() !== "async") return !1;
						case "GeneratorFunction":
							let t = this.consumeSyntax();
							return t === "function" && (t = this.consumeSyntax(), this.hadKeyword = !0), t === "*";
					}
				}
				consumeSyntax(e) {
					let t = this.consumeMatch(/^(?:([A-Za-z_0-9$\xA0-\uFFFF]+)|=>|\+\+|\-\-|.)/);
					if (!t) return;
					let [n, r] = t;
					if (this.consumeWhitespace(), r) return e || r;
					switch (n) {
						case "(": return this.consumeSyntaxUntil("(", ")");
						case "[": return this.consumeSyntaxUntil("[", "]");
						case "{": return this.consumeSyntaxUntil("{", "}");
						case "`": return this.consumeTemplate();
						case "\"": return this.consumeRegExp(/^(?:[^\\"]|\\.)*"/, "\"");
						case "'": return this.consumeRegExp(/^(?:[^\\']|\\.)*'/, "'");
					}
					return n;
				}
				consumeSyntaxUntil(e, t) {
					let n = !0;
					for (;;) {
						let r = this.consumeSyntax();
						if (r === t) return e + t;
						if (!r || r === ")" || r === "]" || r === "}") return;
						r === "/" && n && this.consumeMatch(/^(?:\\.|[^\\\/\n[]|\[(?:\\.|[^\]])*\])+\/[a-z]*/) ? (n = !1, this.consumeWhitespace()) : n = a.has(r);
					}
				}
				consumeMatch(e) {
					let t = e.exec(this.fnString.substr(this.pos));
					return t && (this.pos += t[0].length), t;
				}
				consumeRegExp(e, t) {
					let n = e.exec(this.fnString.substr(this.pos));
					if (n) return this.pos += n[0].length, this.consumeWhitespace(), t;
				}
				consumeTemplate() {
					for (;;) {
						if (this.consumeMatch(/^(?:[^`$\\]|\\.|\$(?!{))*/), this.fnString[this.pos] === "`") return this.pos++, this.consumeWhitespace(), "`";
						if (!(this.fnString.substr(this.pos, 2) === "${" && (this.pos += 2, this.consumeWhitespace(), this.consumeSyntaxUntil("{", "}")))) return;
					}
				}
				consumeWhitespace() {
					this.consumeMatch(/^(?:\s|\/\/.*|\/\*[^]*?\*\/)*/);
				}
			};
			e.FunctionParser = s;
		})), Nt = s(((e) => {
			Object.defineProperty(e, "__esModule", { value: !0 }), e.arrayToString = void 0, e.arrayToString = (e, t, n) => {
				let r = e.map(function(e, r) {
					let i = n(e, r);
					return i === void 0 ? String(i) : t + i.split("\n").join(`\n${t}`);
				}).join(t ? ",\n" : ","), i = t && r ? "\n" : "";
				return `[${i}${r}${i}]`;
			};
		})), Pt = s(((e) => {
			Object.defineProperty(e, "__esModule", { value: !0 }), e.objectToString = void 0;
			var t = jt(), n = Mt(), r = Nt();
			e.objectToString = (e, t, n, r) => {
				if (typeof Buffer == "function" && Buffer.isBuffer(e)) return `Buffer.from(${n(e.toString("base64"))}, 'base64')`;
				if (typeof global == "object" && e === global) return a(e, t, n, r);
				let i = o[Object.prototype.toString.call(e)];
				return i ? i(e, t, n, r) : void 0;
			};
			var i = (e, r, i, a) => {
				let o = r ? "\n" : "", s = r ? " " : "", c = Object.keys(e).reduce(function(a, o) {
					let c = e[o], l = i(c, o);
					if (l === void 0) return a;
					let u = l.split("\n").join(`\n${r}`);
					return n.USED_METHOD_KEY.has(c) ? (a.push(`${r}${u}`), a) : (a.push(`${r}${t.quoteKey(o, i)}:${s}${u}`), a);
				}, []).join(`,${o}`);
				return c === "" ? "{}" : `{${o}${c}${o}}`;
			}, a = (e, t, n) => `Function(${n("return this")})()`, o = {
				"[object Array]": r.arrayToString,
				"[object Object]": i,
				"[object Error]": (e, t, n) => `new Error(${n(e.message)})`,
				"[object Date]": (e) => `new Date(${e.getTime()})`,
				"[object String]": (e, t, n) => `new String(${n(e.toString())})`,
				"[object Number]": (e) => `new Number(${e})`,
				"[object Boolean]": (e) => `new Boolean(${e})`,
				"[object Set]": (e, t, n) => `new Set(${n(Array.from(e))})`,
				"[object Map]": (e, t, n) => `new Map(${n(Array.from(e))})`,
				"[object RegExp]": String,
				"[object global]": a,
				"[object Window]": a
			};
		})), Ft = s(((e) => {
			Object.defineProperty(e, "__esModule", { value: !0 }), e.toString = void 0;
			var t = jt(), n = Pt(), r = Mt(), i = {
				string: t.quoteString,
				number: (e) => Object.is(e, -0) ? "-0" : String(e),
				boolean: String,
				symbol: (e, t, n) => {
					let r = Symbol.keyFor(e);
					return r === void 0 ? `Symbol(${n(e.description)})` : `Symbol.for(${n(r)})`;
				},
				bigint: (e, t, n) => `BigInt(${n(String(e))})`,
				undefined: String,
				object: n.objectToString,
				function: r.functionToString
			};
			e.toString = (e, t, n, r) => e === null ? "null" : i[typeof e](e, t, n, r);
		})), It = s(((e) => {
			Object.defineProperty(e, "__esModule", { value: !0 }), e.stringify = void 0;
			var t = Ft(), n = jt(), r = Symbol("root");
			function i(e, t, i, o = {}) {
				let s = typeof i == "string" ? i : " ".repeat(i || 0), c = [], l = /* @__PURE__ */ new Set(), u = /* @__PURE__ */ new Map(), d = /* @__PURE__ */ new Map(), f = 0, { maxDepth: p = 100, references: m = !1, skipUndefinedProperties: h = !1, maxValues: g = 1e5 } = o, _ = a(t), v = (e, t) => {
					if (++f > g || h && e === void 0 || c.length > p) return;
					if (t === void 0) return _(e, s, v, t);
					c.push(t);
					let n = y(e, t === r ? void 0 : t);
					return c.pop(), n;
				}, y = m ? (e, t) => {
					if (e !== null && (typeof e == "object" || typeof e == "function" || typeof e == "symbol")) {
						if (u.has(e)) return d.set(c.slice(1), u.get(e)), _(void 0, s, v, t);
						u.set(e, c.slice(1));
					}
					return _(e, s, v, t);
				} : (e, t) => {
					if (l.has(e)) return;
					l.add(e);
					let n = _(e, s, v, t);
					return l.delete(e), n;
				}, b = v(e, r);
				if (d.size) {
					let e = s ? " " : "", t = s ? "\n" : "", r = `var x${e}=${e}${b};${t}`;
					for (let [i, a] of d.entries()) {
						let o = n.stringifyPath(i, v), s = n.stringifyPath(a, v);
						r += `x${o}${e}=${e}x${s};${t}`;
					}
					return `(function${e}()${e}{${t}${r}return x;${t}}())`;
				}
				return b;
			}
			e.stringify = i;
			function a(e) {
				return e ? (n, r, i, a) => e(n, r, (e) => t.toString(e, r, i, a), a) : t.toString;
			}
		}))();
		function Lt(e, t = !0) {
			if (e === void 0) return "undefined";
			if (typeof e == "function") return "function() {…}";
			let n = (0, It.stringify)(e, zt, null, { maxDepth: 2 });
			return t ? n : n.replace(/(^"|"$)/g, "");
		}
		function R(e) {
			let t = {};
			for (let n in e) t[n] = e[n], t[n].value = Lt(t[n].value);
			return t;
		}
		function Rt(e, t) {
			return e.length > t ? e.substr(0, t) + `… [${e.length - t} characters left]` : e;
		}
		function zt(e, t, n) {
			return typeof e == "string" ? `"${e.replaceAll("'", "\\\"")}"` : n(e);
		}
		var Bt = "https://ckeditor.com/docs/ckeditor5/latest/api/module_engine_model_", Vt = [
			"#03a9f4",
			"#fb8c00",
			"#009688",
			"#e91e63",
			"#4caf50",
			"#00bcd4",
			"#607d8b",
			"#cddc39",
			"#9c27b0",
			"#f44336",
			"#6d4c41",
			"#8bc34a",
			"#3f51b5",
			"#2196f3",
			"#f4511e",
			"#673ab7",
			"#ffb300"
		];
		function Ht(e) {
			if (!e) return [];
			let t = [...e.model.document.roots];
			return t.filter(({ rootName: e }) => e !== "$graveyard").concat(t.filter(({ rootName: e }) => e === "$graveyard"));
		}
		function Ut(e, t) {
			if (!e) return [];
			let n = [], r = e.model;
			for (let e of r.document.selection.getRanges()) e.root.rootName === t && n.push({
				type: "selection",
				start: wt(e.start),
				end: wt(e.end)
			});
			return n;
		}
		function Wt(e, t) {
			if (!e) return [];
			let n = [], r = e.model, i = 0;
			for (let e of r.markers) {
				let { name: r, affectsData: a, managedUsingOperations: o } = e, s = e.getStart(), c = e.getEnd();
				s.root.rootName === t && n.push({
					type: "marker",
					marker: e,
					name: r,
					affectsData: a,
					managedUsingOperations: o,
					presentation: { color: Vt[i++ % (Vt.length - 1)] },
					start: wt(s),
					end: wt(c)
				});
			}
			return n;
		}
		function Gt({ currentEditor: e, currentRootName: t, ranges: n, markers: r }) {
			return e ? [qt(e.model.document.getRoot(t), [...n, ...r])] : [];
		}
		function Kt(e, t) {
			let n = {
				editorNode: t,
				properties: {},
				attributes: {}
			};
			xt(t) ? (St(t) ? (n.type = "RootElement", n.name = t.rootName, n.url = `${Bt}rootelement-RootElement.html`) : (n.type = "Element", n.name = t.name, n.url = `${Bt}element-Element.html`), n.properties = {
				childCount: { value: t.childCount },
				startOffset: { value: t.startOffset },
				endOffset: { value: t.endOffset },
				maxOffset: { value: t.maxOffset }
			}) : (n.name = t.data, n.type = "Text", n.url = `${Bt}text-Text.html`, n.properties = {
				startOffset: { value: t.startOffset },
				endOffset: { value: t.endOffset },
				offsetSize: { value: t.offsetSize }
			}), n.properties.path = { value: Ct(t) }, Qt(t).forEach(([e, t]) => {
				n.attributes[e] = { value: t };
			}), n.properties = R(n.properties), n.attributes = R(n.attributes);
			for (let t in n.attributes) {
				let r = {}, i = e.model.schema.getAttributeProperties(t);
				for (let e in i) r[e] = { value: i[e] };
				n.attributes[t].subProperties = R(r);
			}
			return n;
		}
		function qt(e, t) {
			let n = {}, { startOffset: r, endOffset: i } = e;
			return Object.assign(n, {
				startOffset: r,
				endOffset: i,
				node: e,
				path: e.getPath(),
				positionsBefore: [],
				positionsAfter: []
			}), xt(e) ? Jt(n, t) : Xt(n), n;
		}
		function Jt(e, t) {
			let n = e.node;
			Object.assign(e, {
				type: "element",
				name: n.name,
				children: [],
				maxOffset: n.maxOffset,
				positions: []
			});
			for (let r of n.getChildren()) e.children.push(qt(r, t));
			Yt(e, t), e.attributes = Zt(n);
		}
		function Yt(e, t) {
			for (let n of t) {
				let t = $t(e, n);
				for (let n of t) {
					let t = n.offset;
					if (t === 0) {
						let t = e.children[0];
						t ? t.positionsBefore.push(n) : e.positions.push(n);
					} else if (t === e.maxOffset) {
						let t = e.children[e.children.length - 1];
						t ? t.positionsAfter.push(n) : e.positions.push(n);
					} else {
						let r = n.isEnd ? 0 : e.children.length - 1, i = e.children[r];
						for (; i;) {
							if (i.startOffset === t) {
								i.positionsBefore.push(n);
								break;
							}
							if (i.endOffset === t) {
								let t = e.children[r + 1], a = i.type === "text" && t && t.type === "element", o = i.type === "element" && t && t.type === "text", s = i.type === "text" && t && t.type === "text";
								n.isEnd && (a || o || s) ? t.positionsBefore.push(n) : i.positionsAfter.push(n);
								break;
							}
							if (i.startOffset < t && i.endOffset > t) {
								i.positions.push(n);
								break;
							}
							r += n.isEnd ? 1 : -1, i = e.children[r];
						}
					}
				}
			}
		}
		function Xt(e) {
			let t = e.node;
			Object.assign(e, {
				type: "text",
				text: t.data,
				positions: [],
				presentation: { dontRenderAttributeValue: !0 }
			}), e.attributes = Zt(t);
		}
		function Zt(e) {
			let t = Qt(e).map(([e, t]) => [e, Lt(t, !1)]);
			return new Map(t);
		}
		function Qt(e) {
			return [...e.getAttributes()].sort(([e], [t]) => e < t ? -1 : 1);
		}
		function $t(e, t) {
			let n = e.path, r = t.start.path, i = t.end.path, a = [];
			return en(n, r) && a.push({
				offset: r[r.length - 1],
				isEnd: !1,
				presentation: t.presentation || null,
				type: t.type,
				name: t.name || null
			}), en(n, i) && a.push({
				offset: i[i.length - 1],
				isEnd: !0,
				presentation: t.presentation || null,
				type: t.type,
				name: t.name || null
			}), a;
		}
		function en(e, t) {
			return e.length === t.length - 1 && At(e, t) === "prefix";
		}
		var tn = class {
			constructor(e) {
				this._config = e;
			}
			startListening(e) {
				e.model.document.on("change", this._config.onModelChange), e.editing.view.on("render", this._config.onViewRender), e.on("change:isReadOnly", this._config.onReadOnlyChange);
			}
			stopListening(e) {
				e.model.document.off("change", this._config.onModelChange), e.editing.view.off("render", this._config.onViewRender), e.off("change:isReadOnly", this._config.onReadOnlyChange);
			}
		};
		function nn(e) {
			return e.editors.get(e.currentEditorName);
		}
		var z = class {
			static set(e, t) {
				window.localStorage.setItem("ck5-inspector-" + e, t);
			}
			static get(e) {
				return window.localStorage.getItem("ck5-inspector-" + e);
			}
		}, rn = "active-model-tab-name", an = "model-show-markers", on = "model-compact-text";
		function sn(e, t, n) {
			let r = cn(e, t, n);
			return r && (r.ui = ln(r.ui, n)), r;
		}
		function cn(e, t, n) {
			if (e.ui.activeTab !== "Model") return t;
			if (!t) return mn(e, t);
			switch (n.type) {
				case Ye: return un(e, t, n);
				case Xe: return {
					...t,
					currentNode: n.currentNode,
					currentNodeDefinition: Kt(nn(e), n.currentNode)
				};
				case pt:
				case et: return {
					...t,
					...hn(e, t)
				};
				case ut:
				case dt: return mn(e, t);
				default: return t;
			}
		}
		function ln(e, t) {
			if (!e) return {
				activeTab: z.get("active-model-tab-name") || "Inspect",
				showMarkers: z.get(an) === "true",
				showCompactText: z.get(on) === "true"
			};
			switch (t.type) {
				case Ze: return dn(e, t);
				case Qe: return fn(e);
				case $e: return pn(e);
				default: return e;
			}
		}
		function un(e, t, n) {
			let r = n.currentRootName;
			return {
				...t,
				...hn(e, t, { currentRootName: r }),
				currentNode: null,
				currentNodeDefinition: null,
				currentRootName: r
			};
		}
		function dn(e, t) {
			return z.set(rn, t.tabName), {
				...e,
				activeTab: t.tabName
			};
		}
		function fn(e) {
			let t = !e.showMarkers;
			return z.set(an, t), {
				...e,
				showMarkers: t
			};
		}
		function pn(e) {
			let t = !e.showCompactText;
			return z.set(on, t), {
				...e,
				showCompactText: t
			};
		}
		function mn(e, t = {}) {
			let n = nn(e);
			if (!n) return { ui: t.ui };
			let r = Ht(n)[0].rootName;
			return {
				...t,
				...hn(e, t, { currentRootName: r }),
				currentRootName: r,
				currentNode: null,
				currentNodeDefinition: null
			};
		}
		function hn(e, t, n) {
			let r = nn(e), i = {
				...t,
				...n
			}, a = i.currentRootName, o = Ut(r, a), s = Wt(r, a), c = Gt({
				currentEditor: r,
				currentRootName: i.currentRootName,
				ranges: o,
				markers: s
			}), l = i.currentNode, u = i.currentNodeDefinition;
			return l ? l.root.rootName !== a || !St(l) && !l.parent ? (l = null, u = null) : u = Kt(r, l) : u = null, {
				treeDefinition: c,
				currentNode: l,
				currentNodeDefinition: u,
				ranges: o,
				markers: s
			};
		}
		var gn = "SET_VIEW_CURRENT_ROOT_NAME", _n = "SET_VIEW_CURRENT_NODE", B = "SET_VIEW_ACTIVE_TAB", vn = "TOGGLE_VIEW_SHOW_ELEMENT_TYPES", yn = "UPDATE_VIEW_STATE";
		function bn(e) {
			return {
				type: gn,
				currentRootName: e
			};
		}
		function xn(e) {
			return {
				type: _n,
				currentNode: e
			};
		}
		function Sn(e) {
			return {
				type: B,
				tabName: e
			};
		}
		function Cn() {
			return { type: vn };
		}
		function wn() {
			return { type: yn };
		}
		function Tn(e) {
			return e && e.name;
		}
		function En(e) {
			return e && Tn(e) && e.is("attributeElement");
		}
		function Dn(e) {
			return e && Tn(e) && e.is("emptyElement");
		}
		function On(e) {
			return e && Tn(e) && e.is("uiElement");
		}
		function kn(e) {
			return e && Tn(e) && e.is("rawElement");
		}
		function An(e) {
			return e && Tn(e) && e.is("editableElement");
		}
		function jn(e) {
			return e && e.is("rootElement");
		}
		function Mn(e) {
			return {
				path: [...e.parent.getPath(), e.offset],
				offset: e.offset,
				isAtEnd: e.isAtEnd,
				isAtStart: e.isAtStart,
				parent: Nn(e.parent)
			};
		}
		function Nn(e) {
			return Tn(e) ? En(e) ? "attribute:" + e.name : jn(e) ? "root:" + e.name : "container:" + e.name : e.data;
		}
		var Pn = "https://ckeditor.com/docs/ckeditor5/latest/api/module_engine_view", Fn = `&lt;!--The View UI element content has been skipped. <a href="${Pn}_uielement-UIElement.html" target="_blank">Find out why</a>. --&gt;`, In = `&lt;!--The View raw element content has been skipped. <a href="${Pn}_rawelement-RawElement.html" target="_blank">Find out why</a>. --&gt;`;
		function Ln(e) {
			return e ? [...e.editing.view.document.roots] : [];
		}
		function Rn(e, t) {
			if (!e) return [];
			let n = [], r = e.editing.view.document.selection;
			for (let e of r.getRanges()) e.root.rootName === t && n.push({
				type: "selection",
				start: Mn(e.start),
				end: Mn(e.end)
			});
			return n;
		}
		function zn({ currentEditor: e, currentRootName: t, ranges: n }) {
			return !e || !t ? null : [Vn(e.editing.view.document.getRoot(t), [...n])];
		}
		function Bn(e) {
			let t = {
				editorNode: e,
				properties: {},
				attributes: {},
				customProperties: {}
			};
			if (Tn(e)) {
				jn(e) ? (t.type = "RootEditableElement", t.name = e.rootName, t.url = `${Pn}_rooteditableelement-RootEditableElement.html`) : (t.name = e.name, En(e) ? (t.type = "AttributeElement", t.url = `${Pn}_attributeelement-AttributeElement.html`) : Dn(e) ? (t.type = "EmptyElement", t.url = `${Pn}_emptyelement-EmptyElement.html`) : On(e) ? (t.type = "UIElement", t.url = `${Pn}_uielement-UIElement.html`) : kn(e) ? (t.type = "RawElement", t.url = `${Pn}_rawelement-RawElement.html`) : An(e) ? (t.type = "EditableElement", t.url = `${Pn}_editableelement-EditableElement.html`) : (t.type = "ContainerElement", t.url = `${Pn}_containerelement-ContainerElement.html`)), Jn(e).forEach(([e, n]) => {
					t.attributes[e] = { value: n };
				}), t.properties = {
					index: { value: e.index },
					isEmpty: { value: e.isEmpty },
					childCount: { value: e.childCount }
				};
				for (let [n, r] of e.getCustomProperties()) typeof n == "symbol" && (n = n.toString()), t.customProperties[n] = { value: r };
			} else t.name = e.data, t.type = "Text", t.url = `${Pn}_text-Text.html`, t.properties = { index: { value: e.index } };
			return t.properties = R(t.properties), t.customProperties = R(t.customProperties), t.attributes = R(t.attributes), t;
		}
		function Vn(e, t) {
			let n = {};
			return Object.assign(n, {
				index: e.index,
				path: e.getPath(),
				node: e,
				positionsBefore: [],
				positionsAfter: []
			}), Tn(e) ? Hn(n, t) : Un(n, t), n;
		}
		function Hn(e, t) {
			let n = e.node;
			Object.assign(e, {
				type: "element",
				children: [],
				positions: []
			}), e.name = n.name, e.elementType = En(n) ? "attribute" : jn(n) ? "root" : Dn(n) ? "empty" : On(n) ? "ui" : kn(n) ? "raw" : "container", Dn(n) ? e.presentation = { isEmpty: !0 } : On(n) ? e.children.push({
				type: "comment",
				text: Fn
			}) : kn(n) && e.children.push({
				type: "comment",
				text: In
			});
			for (let r of n.getChildren()) e.children.push(Vn(r, t));
			Wn(e, t), e.attributes = qn(n);
		}
		function Un(e, t) {
			Object.assign(e, {
				type: "text",
				startOffset: 0,
				text: e.node.data,
				positions: []
			});
			for (let n of t) {
				let t = Gn(e, n);
				e.positions.push(...t);
			}
		}
		function Wn(e, t) {
			for (let n of t) {
				let t = Gn(e, n);
				for (let n of t) {
					let t = n.offset;
					if (t === 0) {
						let t = e.children[0];
						t ? t.positionsBefore.push(n) : e.positions.push(n);
					} else if (t === e.children.length) {
						let t = e.children[e.children.length - 1];
						t ? t.positionsAfter.push(n) : e.positions.push(n);
					} else {
						let r = n.isEnd ? 0 : e.children.length - 1, i = e.children[r];
						for (; i;) {
							if (i.index === t) {
								i.positionsBefore.push(n);
								break;
							}
							if (i.index + 1 === t) {
								i.positionsAfter.push(n);
								break;
							}
							r += n.isEnd ? 1 : -1, i = e.children[r];
						}
					}
				}
			}
		}
		function Gn(e, t) {
			let n = e.path, r = t.start.path, i = t.end.path, a = [];
			return Kn(n, r) && a.push({
				offset: r[r.length - 1],
				isEnd: !1,
				presentation: t.presentation || null,
				type: t.type,
				name: t.name || null
			}), Kn(n, i) && a.push({
				offset: i[i.length - 1],
				isEnd: !0,
				presentation: t.presentation || null,
				type: t.type,
				name: t.name || null
			}), a;
		}
		function Kn(e, t) {
			return e.length === t.length - 1 && At(e, t) === "prefix";
		}
		function qn(e) {
			let t = Jn(e).map(([e, t]) => [e, Lt(t, !1)]);
			return new Map(t);
		}
		function Jn(e) {
			return [...e.getAttributes()].sort(([e], [t]) => e.toUpperCase() < t.toUpperCase() ? -1 : 1);
		}
		var Yn = "active-view-tab-name", Xn = "view-element-types";
		function Zn(e, t, n) {
			let r = Qn(e, t, n);
			return r && (r.ui = $n(e, r.ui, n)), r;
		}
		function Qn(e, t, n) {
			if (e.ui.activeTab !== "View") return t;
			if (!t) return rr(e, t);
			switch (n.type) {
				case gn: return er(e, t, n);
				case _n: return {
					...t,
					currentNode: n.currentNode,
					currentNodeDefinition: Bn(n.currentNode)
				};
				case pt:
				case yn: return {
					...t,
					...ir(e, t)
				};
				case ut:
				case dt: return rr(e, t);
				default: return t;
			}
		}
		function $n(e, t, n) {
			if (!t) return {
				activeTab: z.get("active-view-tab-name") || "Inspect",
				showElementTypes: z.get(Xn) === "true"
			};
			switch (n.type) {
				case B: return tr(t, n);
				case vn: return nr(e, t);
				default: return t;
			}
		}
		function er(e, t, n) {
			let r = n.currentRootName;
			return {
				...t,
				...ir(e, t, { currentRootName: r }),
				currentNode: null,
				currentNodeDefinition: null,
				currentRootName: r
			};
		}
		function tr(e, t) {
			return z.set(Yn, t.tabName), {
				...e,
				activeTab: t.tabName
			};
		}
		function nr(e, t) {
			let n = !t.showElementTypes;
			return z.set(Xn, n), {
				...t,
				showElementTypes: n
			};
		}
		function rr(e, t = {}) {
			let n = Ln(nn(e)), r = n[0] ? n[0].rootName : null;
			return {
				...t,
				...ir(e, t, { currentRootName: r }),
				currentRootName: r,
				currentNode: null,
				currentNodeDefinition: null
			};
		}
		function ir(e, t, n) {
			let r = {
				...t,
				...n
			}, i = r.currentRootName, a = Rn(nn(e), i), o = zn({
				currentEditor: nn(e),
				currentRootName: i,
				ranges: a
			}), s = r.currentNode, c = r.currentNodeDefinition;
			return s ? s.root.rootName !== i || !jn(s) && !s.parent ? (s = null, c = null) : c = Bn(s) : c = null, {
				treeDefinition: o,
				currentNode: s,
				currentNodeDefinition: c,
				ranges: a
			};
		}
		var ar = "SET_COMMANDS_CURRENT_COMMAND_NAME", or = "UPDATE_COMMANDS_STATE";
		function sr(e) {
			return {
				type: ar,
				currentCommandName: e
			};
		}
		function cr() {
			return { type: or };
		}
		function lr({ editors: e, currentEditorName: t }, n) {
			if (!n) return null;
			let r = e.get(t).commands.get(n);
			return {
				currentCommandName: n,
				type: "Command",
				url: "https://ckeditor.com/docs/ckeditor5/latest/api/module_core_command-Command.html",
				properties: R({
					isEnabled: { value: r.isEnabled },
					value: { value: r.value }
				}),
				command: r
			};
		}
		function ur({ editors: e, currentEditorName: t }) {
			if (!e.get(t)) return [];
			let n = [];
			for (let [r, i] of e.get(t).commands) {
				let e = [];
				i.value !== void 0 && e.push(["value", Lt(i.value, !1)]), n.push({
					name: r,
					type: "element",
					children: [],
					node: r,
					attributes: e,
					presentation: {
						isEmpty: !0,
						cssClass: ["ck-inspector-tree-node_tagless", i.isEnabled ? "" : "ck-inspector-tree-node_disabled"].join(" ")
					}
				});
			}
			return n.sort((e, t) => e.name > t.name ? 1 : -1);
		}
		function dr(e, t, n) {
			if (e.ui.activeTab !== "Commands") return t;
			if (!t) return fr(e, t);
			switch (n.type) {
				case ar: return {
					...t,
					currentCommandDefinition: lr(e, n.currentCommandName),
					currentCommandName: n.currentCommandName
				};
				case pt:
				case or: return {
					...t,
					currentCommandDefinition: lr(e, t.currentCommandName),
					treeDefinition: ur(e, t)
				};
				case ut:
				case dt: return fr(e, t);
				default: return t;
			}
		}
		function fr(e, t = {}) {
			return {
				...t,
				currentCommandName: null,
				currentCommandDefinition: null,
				treeDefinition: ur(e, t)
			};
		}
		var pr = "SET_SCHEMA_CURRENT_DEFINITION_NAME";
		function mr(e) {
			return {
				type: pr,
				currentSchemaDefinitionName: e
			};
		}
		var hr = [
			"isBlock",
			"isInline",
			"isObject",
			"isContent",
			"isLimit",
			"isSelectable"
		];
		function gr({ editors: e, currentEditorName: t }, n) {
			if (!n) return null;
			let r = e.get(t).model.schema, i = r.getDefinitions()[n], a = {}, o = {}, s = {}, c = {};
			for (let e of hr) i[e] && (a[e] = { value: i[e] });
			for (let e of i.allowChildren.sort()) o[e] = {
				value: !0,
				title: `Click to see the definition of ${e}`
			};
			for (let e of i.allowIn.sort()) s[e] = {
				value: !0,
				title: `Click to see the definition of ${e}`
			};
			for (let e of i.allowAttributes.sort()) c[e] = { value: !0 };
			c = R(c);
			for (let e in c) {
				let t = r.getAttributeProperties(e), n = {};
				for (let e in t) n[e] = { value: t[e] };
				c[e].subProperties = R(n);
			}
			return {
				currentSchemaDefinitionName: n,
				type: "SchemaCompiledItemDefinition",
				urls: {
					general: "https://ckeditor.com/docs/ckeditor5/latest/api/module_engine_model_schema-SchemaCompiledItemDefinition.html",
					allowAttributes: "https://ckeditor.com/docs/ckeditor5/latest/api/module_engine_model_schema-SchemaItemDefinition.html#member-allowAttributes",
					allowChildren: "https://ckeditor.com/docs/ckeditor5/latest/api/module_engine_model_schema-SchemaItemDefinition.html#member-allowChildren",
					allowIn: "https://ckeditor.com/docs/ckeditor5/latest/api/module_engine_model_schema-SchemaItemDefinition.html#member-allowIn"
				},
				properties: R(a),
				allowChildren: R(o),
				allowIn: R(s),
				allowAttributes: c,
				definition: i
			};
		}
		function _r({ editors: e, currentEditorName: t }) {
			if (!e.get(t)) return [];
			let n = [], r = e.get(t).model.schema.getDefinitions();
			for (let e in r) n.push({
				name: e,
				type: "element",
				children: [],
				node: e,
				attributes: [],
				presentation: {
					isEmpty: !0,
					cssClass: "ck-inspector-tree-node_tagless"
				}
			});
			return n.sort((e, t) => e.name > t.name ? 1 : -1);
		}
		function vr(e, t, n) {
			if (e.ui.activeTab !== "Schema") return t;
			if (!t) return yr(e, t);
			switch (n.type) {
				case pr: return {
					...t,
					currentSchemaDefinition: gr(e, n.currentSchemaDefinitionName),
					currentSchemaDefinitionName: n.currentSchemaDefinitionName
				};
				case pt: return {
					...t,
					currentSchemaDefinition: gr(e, t.currentSchemaDefinitionName),
					treeDefinition: _r(e, t)
				};
				case ut:
				case dt: return yr(e, t);
				default: return t;
			}
		}
		function yr(e, t = {}) {
			return {
				...t,
				currentSchemaDefinitionName: null,
				currentSchemaDefinition: null,
				treeDefinition: _r(e, t)
			};
		}
		var br = "active-tab-name", xr = "is-collapsed", Sr = "height", Cr = "side-pane-width";
		function wr(e, t) {
			let n = Tr(e, t);
			return n.currentEditorGlobals = Er(n, n.currentEditorGlobals, t), n.ui = Dr(n.ui, t), n.model = sn(n, n.model, t), n.view = Zn(n, n.view, t), n.commands = dr(n, n.commands, t), n.schema = vr(n, n.schema, t), {
				...e,
				...n
			};
		}
		function Tr(e, t) {
			switch (t.type) {
				case ut: return jr(e, t);
				case dt: return Or(e, t);
				default: return e;
			}
		}
		function Er(e, t, n) {
			switch (n.type) {
				case ut:
				case dt: return kr(e);
				case ft: return Ar(e, t);
				default: return t;
			}
		}
		function Dr(e, t) {
			if (!e.activeTab) {
				let t;
				return t = e.isCollapsed === void 0 ? z.get(xr) === "true" : e.isCollapsed, {
					...e,
					isCollapsed: t,
					activeTab: z.get("active-tab-name") || "Model",
					height: z.get("height") || "400px",
					sidePaneWidth: z.get("side-pane-width") || "500px"
				};
			}
			switch (t.type) {
				case st: return Pr(e);
				case ct: return Mr(e, t);
				case lt: return Nr(e, t);
				case pt: return Fr(e, t);
				default: return e;
			}
		}
		function Or(e, t) {
			return {
				...e,
				currentEditorName: t.editorName
			};
		}
		function kr(e) {
			return { ...Ar(e, {}) };
		}
		function Ar(e, t) {
			let n = nn(e);
			return {
				...t,
				isReadOnly: n ? n.isReadOnly : !1
			};
		}
		function jr(e, t) {
			let n = { editors: new Map(t.editors) };
			return t.editors.size ? t.editors.has(e.currentEditorName) || (n.currentEditorName = Ot(t.editors)) : n.currentEditorName = null, {
				...e,
				...n
			};
		}
		function Mr(e, t) {
			return z.set(Sr, t.newHeight), {
				...e,
				height: t.newHeight
			};
		}
		function Nr(e, t) {
			return z.set(Cr, t.newWidth), {
				...e,
				sidePaneWidth: t.newWidth
			};
		}
		function Pr(e) {
			let t = !e.isCollapsed;
			return z.set(xr, t), {
				...e,
				isCollapsed: t
			};
		}
		function Fr(e, t) {
			return z.set(br, t.tabName), {
				...e,
				activeTab: t.tabName
			};
		}
		var Ir = s(((e, t) => {
			(function() {
				var e = {}.hasOwnProperty;
				function n() {
					for (var e = "", t = 0; t < arguments.length; t++) {
						var n = arguments[t];
						n && (e = i(e, r(n)));
					}
					return e;
				}
				function r(t) {
					if (typeof t == "string" || typeof t == "number") return t;
					if (typeof t != "object") return "";
					if (Array.isArray(t)) return n.apply(null, t);
					if (t.toString !== Object.prototype.toString && !t.toString.toString().includes("[native code]")) return t.toString();
					var r = "";
					for (var a in t) e.call(t, a) && t[a] && (r = i(r, a));
					return r;
				}
				function i(e, t) {
					return t ? e ? e + " " + t : e + t : e;
				}
				t !== void 0 && t.exports ? (n.default = n, t.exports = n) : typeof define == "function" && typeof define.amd == "object" && define.amd ? define("classnames", [], function() {
					return n;
				}) : window.classNames = n;
			})();
		})), Lr = s(((e) => {
			Object.defineProperty(e, "__esModule", { value: !0 }), e.findInArray = t, e.isFunction = n, e.isNum = r, e.int = i, e.dontSetMe = a;
			function t(e, t) {
				for (var n = 0, r = e.length; n < r; n++) if (t.apply(t, [
					e[n],
					n,
					e
				])) return e[n];
			}
			function n(e) {
				return typeof e == "function" || Object.prototype.toString.call(e) === "[object Function]";
			}
			function r(e) {
				return typeof e == "number" && !isNaN(e);
			}
			function i(e) {
				return parseInt(e, 10);
			}
			function a(e, t, n) {
				if (e[t]) return Error(`Invalid prop ${t} passed to ${n} - do not set this, set it on the child.`);
			}
		})), Rr = s(((e) => {
			Object.defineProperty(e, "__esModule", { value: !0 }), e.getPrefix = n, e.browserPrefixToKey = r, e.browserPrefixToStyle = i, e.default = void 0;
			var t = [
				"Moz",
				"Webkit",
				"O",
				"ms"
			];
			function n() {
				var e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "transform";
				if (typeof window > "u" || window.document === void 0) return "";
				var n = window.document.documentElement.style;
				if (e in n) return "";
				for (var i = 0; i < t.length; i++) if (r(e, t[i]) in n) return t[i];
				return "";
			}
			function r(e, t) {
				return t ? `${t}${a(e)}` : e;
			}
			function i(e, t) {
				return t ? `-${t.toLowerCase()}-${e}` : e;
			}
			function a(e) {
				for (var t = "", n = !0, r = 0; r < e.length; r++) n ? (t += e[r].toUpperCase(), n = !1) : e[r] === "-" ? n = !0 : t += e[r];
				return t;
			}
			e.default = n();
		})), zr = s(((e) => {
			function t(e) {
				"@babel/helpers - typeof";
				return t = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e) {
					return typeof e;
				} : function(e) {
					return e && typeof Symbol == "function" && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;
				}, t(e);
			}
			Object.defineProperty(e, "__esModule", { value: !0 }), e.matchesSelector = u, e.matchesSelectorAndParentsTo = d, e.addEvent = f, e.removeEvent = p, e.outerHeight = m, e.outerWidth = h, e.innerHeight = g, e.innerWidth = _, e.offsetXYFromParent = v, e.createCSSTransform = y, e.createSVGTransform = b, e.getTranslation = x, e.getTouch = S, e.getTouchIdentifier = C, e.addUserSelectStyles = w, e.removeUserSelectStyles = T, e.addClassName = E, e.removeClassName = D;
			var n = Lr(), r = a(Rr());
			function i() {
				if (typeof WeakMap != "function") return null;
				var e = /* @__PURE__ */ new WeakMap();
				return i = function() {
					return e;
				}, e;
			}
			function a(e) {
				if (e && e.__esModule) return e;
				if (e === null || t(e) !== "object" && typeof e != "function") return { default: e };
				var n = i();
				if (n && n.has(e)) return n.get(e);
				var r = {}, a = Object.defineProperty && Object.getOwnPropertyDescriptor;
				for (var o in e) if (Object.prototype.hasOwnProperty.call(e, o)) {
					var s = a ? Object.getOwnPropertyDescriptor(e, o) : null;
					s && (s.get || s.set) ? Object.defineProperty(r, o, s) : r[o] = e[o];
				}
				return r.default = e, n && n.set(e, r), r;
			}
			function o(e, t) {
				var n = Object.keys(e);
				if (Object.getOwnPropertySymbols) {
					var r = Object.getOwnPropertySymbols(e);
					t && (r = r.filter(function(t) {
						return Object.getOwnPropertyDescriptor(e, t).enumerable;
					})), n.push.apply(n, r);
				}
				return n;
			}
			function s(e) {
				for (var t = 1; t < arguments.length; t++) {
					var n = arguments[t] == null ? {} : arguments[t];
					t % 2 ? o(Object(n), !0).forEach(function(t) {
						c(e, t, n[t]);
					}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : o(Object(n)).forEach(function(t) {
						Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(n, t));
					});
				}
				return e;
			}
			function c(e, t, n) {
				return t in e ? Object.defineProperty(e, t, {
					value: n,
					enumerable: !0,
					configurable: !0,
					writable: !0
				}) : e[t] = n, e;
			}
			var l = "";
			function u(e, t) {
				return l ||= (0, n.findInArray)([
					"matches",
					"webkitMatchesSelector",
					"mozMatchesSelector",
					"msMatchesSelector",
					"oMatchesSelector"
				], function(t) {
					return (0, n.isFunction)(e[t]);
				}), (0, n.isFunction)(e[l]) ? e[l](t) : !1;
			}
			function d(e, t, n) {
				var r = e;
				do {
					if (u(r, t)) return !0;
					if (r === n) return !1;
					r = r.parentNode;
				} while (r);
				return !1;
			}
			function f(e, t, n, r) {
				if (e) {
					var i = s({ capture: !0 }, r);
					e.addEventListener ? e.addEventListener(t, n, i) : e.attachEvent ? e.attachEvent("on" + t, n) : e["on" + t] = n;
				}
			}
			function p(e, t, n, r) {
				if (e) {
					var i = s({ capture: !0 }, r);
					e.removeEventListener ? e.removeEventListener(t, n, i) : e.detachEvent ? e.detachEvent("on" + t, n) : e["on" + t] = null;
				}
			}
			function m(e) {
				var t = e.clientHeight, r = e.ownerDocument.defaultView.getComputedStyle(e);
				return t += (0, n.int)(r.borderTopWidth), t += (0, n.int)(r.borderBottomWidth), t;
			}
			function h(e) {
				var t = e.clientWidth, r = e.ownerDocument.defaultView.getComputedStyle(e);
				return t += (0, n.int)(r.borderLeftWidth), t += (0, n.int)(r.borderRightWidth), t;
			}
			function g(e) {
				var t = e.clientHeight, r = e.ownerDocument.defaultView.getComputedStyle(e);
				return t -= (0, n.int)(r.paddingTop), t -= (0, n.int)(r.paddingBottom), t;
			}
			function _(e) {
				var t = e.clientWidth, r = e.ownerDocument.defaultView.getComputedStyle(e);
				return t -= (0, n.int)(r.paddingLeft), t -= (0, n.int)(r.paddingRight), t;
			}
			function v(e, t, n) {
				var r = t === t.ownerDocument.body ? {
					left: 0,
					top: 0
				} : t.getBoundingClientRect();
				return {
					x: (e.clientX + t.scrollLeft - r.left) / n,
					y: (e.clientY + t.scrollTop - r.top) / n
				};
			}
			function y(e, t) {
				var n = x(e, t, "px");
				return c({}, (0, r.browserPrefixToKey)("transform", r.default), n);
			}
			function b(e, t) {
				return x(e, t, "");
			}
			function x(e, t, n) {
				var r = `translate(${e.x}${n},${e.y}${n})`;
				return t && (r = `translate(${`${typeof t.x == "string" ? t.x : t.x + n}`}, ${`${typeof t.y == "string" ? t.y : t.y + n}`})` + r), r;
			}
			function S(e, t) {
				return e.targetTouches && (0, n.findInArray)(e.targetTouches, function(e) {
					return t === e.identifier;
				}) || e.changedTouches && (0, n.findInArray)(e.changedTouches, function(e) {
					return t === e.identifier;
				});
			}
			function C(e) {
				if (e.targetTouches && e.targetTouches[0]) return e.targetTouches[0].identifier;
				if (e.changedTouches && e.changedTouches[0]) return e.changedTouches[0].identifier;
			}
			function w(e) {
				if (e) {
					var t = e.getElementById("react-draggable-style-el");
					t || (t = e.createElement("style"), t.type = "text/css", t.id = "react-draggable-style-el", t.innerHTML = ".react-draggable-transparent-selection *::-moz-selection {all: inherit;}\n", t.innerHTML += ".react-draggable-transparent-selection *::selection {all: inherit;}\n", e.getElementsByTagName("head")[0].appendChild(t)), e.body && E(e.body, "react-draggable-transparent-selection");
				}
			}
			function T(e) {
				if (e) try {
					if (e.body && D(e.body, "react-draggable-transparent-selection"), e.selection) e.selection.empty();
					else {
						var t = (e.defaultView || window).getSelection();
						t && t.type !== "Caret" && t.removeAllRanges();
					}
				} catch {}
			}
			function E(e, t) {
				e.classList ? e.classList.add(t) : e.className.match(RegExp(`(?:^|\\s)${t}(?!\\S)`)) || (e.className += ` ${t}`);
			}
			function D(e, t) {
				e.classList ? e.classList.remove(t) : e.className = e.className.replace(RegExp(`(?:^|\\s)${t}(?!\\S)`, "g"), "");
			}
		})), Br = s(((e) => {
			Object.defineProperty(e, "__esModule", { value: !0 }), e.getBoundPosition = r, e.snapToGrid = i, e.canDragX = a, e.canDragY = o, e.getControlPosition = s, e.createCoreData = c, e.createDraggableData = l;
			var t = Lr(), n = zr();
			function r(e, r, i) {
				if (!e.props.bounds) return [r, i];
				var a = e.props.bounds;
				a = typeof a == "string" ? a : u(a);
				var o = d(e);
				if (typeof a == "string") {
					var s = o.ownerDocument, c = s.defaultView, l = a === "parent" ? o.parentNode : s.querySelector(a);
					if (!(l instanceof c.HTMLElement)) throw Error("Bounds selector \"" + a + "\" could not find an element.");
					var f = c.getComputedStyle(o), p = c.getComputedStyle(l);
					a = {
						left: -o.offsetLeft + (0, t.int)(p.paddingLeft) + (0, t.int)(f.marginLeft),
						top: -o.offsetTop + (0, t.int)(p.paddingTop) + (0, t.int)(f.marginTop),
						right: (0, n.innerWidth)(l) - (0, n.outerWidth)(o) - o.offsetLeft + (0, t.int)(p.paddingRight) - (0, t.int)(f.marginRight),
						bottom: (0, n.innerHeight)(l) - (0, n.outerHeight)(o) - o.offsetTop + (0, t.int)(p.paddingBottom) - (0, t.int)(f.marginBottom)
					};
				}
				return (0, t.isNum)(a.right) && (r = Math.min(r, a.right)), (0, t.isNum)(a.bottom) && (i = Math.min(i, a.bottom)), (0, t.isNum)(a.left) && (r = Math.max(r, a.left)), (0, t.isNum)(a.top) && (i = Math.max(i, a.top)), [r, i];
			}
			function i(e, t, n) {
				return [Math.round(t / e[0]) * e[0], Math.round(n / e[1]) * e[1]];
			}
			function a(e) {
				return e.props.axis === "both" || e.props.axis === "x";
			}
			function o(e) {
				return e.props.axis === "both" || e.props.axis === "y";
			}
			function s(e, t, r) {
				var i = typeof t == "number" ? (0, n.getTouch)(e, t) : null;
				if (typeof t == "number" && !i) return null;
				var a = d(r), o = r.props.offsetParent || a.offsetParent || a.ownerDocument.body;
				return (0, n.offsetXYFromParent)(i || e, o, r.props.scale);
			}
			function c(e, n, r) {
				var i = e.state, a = !(0, t.isNum)(i.lastX), o = d(e);
				return a ? {
					node: o,
					deltaX: 0,
					deltaY: 0,
					lastX: n,
					lastY: r,
					x: n,
					y: r
				} : {
					node: o,
					deltaX: n - i.lastX,
					deltaY: r - i.lastY,
					lastX: i.lastX,
					lastY: i.lastY,
					x: n,
					y: r
				};
			}
			function l(e, t) {
				var n = e.props.scale;
				return {
					node: t.node,
					x: e.state.x + t.deltaX / n,
					y: e.state.y + t.deltaY / n,
					deltaX: t.deltaX / n,
					deltaY: t.deltaY / n,
					lastX: e.state.x,
					lastY: e.state.y
				};
			}
			function u(e) {
				return {
					left: e.left,
					top: e.top,
					right: e.right,
					bottom: e.bottom
				};
			}
			function d(e) {
				var t = e.findDOMNode();
				if (!t) throw Error("<DraggableCore>: Unmounted during event!");
				return t;
			}
		})), Vr = s(((e) => {
			Object.defineProperty(e, "__esModule", { value: !0 }), e.default = t;
			function t() {}
		})), Hr = s(((e) => {
			Object.defineProperty(e, "__esModule", { value: !0 }), e.default = void 0;
			var t = u(m()), n = c(ee()), r = c(v()), i = zr(), a = Br(), o = Lr(), s = c(Vr());
			function c(e) {
				return e && e.__esModule ? e : { default: e };
			}
			function l() {
				if (typeof WeakMap != "function") return null;
				var e = /* @__PURE__ */ new WeakMap();
				return l = function() {
					return e;
				}, e;
			}
			function u(e) {
				if (e && e.__esModule) return e;
				if (e === null || d(e) !== "object" && typeof e != "function") return { default: e };
				var t = l();
				if (t && t.has(e)) return t.get(e);
				var n = {}, r = Object.defineProperty && Object.getOwnPropertyDescriptor;
				for (var i in e) if (Object.prototype.hasOwnProperty.call(e, i)) {
					var a = r ? Object.getOwnPropertyDescriptor(e, i) : null;
					a && (a.get || a.set) ? Object.defineProperty(n, i, a) : n[i] = e[i];
				}
				return n.default = e, t && t.set(e, n), n;
			}
			function d(e) {
				"@babel/helpers - typeof";
				return d = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e) {
					return typeof e;
				} : function(e) {
					return e && typeof Symbol == "function" && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;
				}, d(e);
			}
			function f(e, t) {
				return y(e) || _(e, t) || h(e, t) || p();
			}
			function p() {
				throw TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
			}
			function h(e, t) {
				if (e) {
					if (typeof e == "string") return g(e, t);
					var n = Object.prototype.toString.call(e).slice(8, -1);
					if (n === "Object" && e.constructor && (n = e.constructor.name), n === "Map" || n === "Set") return Array.from(e);
					if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return g(e, t);
				}
			}
			function g(e, t) {
				(t == null || t > e.length) && (t = e.length);
				for (var n = 0, r = Array(t); n < t; n++) r[n] = e[n];
				return r;
			}
			function _(e, t) {
				if (typeof Symbol < "u" && Symbol.iterator in Object(e)) {
					var n = [], r = !0, i = !1, a = void 0;
					try {
						for (var o = e[Symbol.iterator](), s; !(r = (s = o.next()).done) && (n.push(s.value), !(t && n.length === t)); r = !0);
					} catch (e) {
						i = !0, a = e;
					} finally {
						try {
							!r && o.return != null && o.return();
						} finally {
							if (i) throw a;
						}
					}
					return n;
				}
			}
			function y(e) {
				if (Array.isArray(e)) return e;
			}
			function b(e, t) {
				if (!(e instanceof t)) throw TypeError("Cannot call a class as a function");
			}
			function x(e, t) {
				for (var n = 0; n < t.length; n++) {
					var r = t[n];
					r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), Object.defineProperty(e, r.key, r);
				}
			}
			function S(e, t, n) {
				return t && x(e.prototype, t), n && x(e, n), e;
			}
			function C(e, t) {
				if (typeof t != "function" && t !== null) throw TypeError("Super expression must either be null or a function");
				e.prototype = Object.create(t && t.prototype, { constructor: {
					value: e,
					writable: !0,
					configurable: !0
				} }), t && w(e, t);
			}
			function w(e, t) {
				return w = Object.setPrototypeOf || function(e, t) {
					return e.__proto__ = t, e;
				}, w(e, t);
			}
			function T(e) {
				var t = O();
				return function() {
					var n = k(e), r;
					if (t) {
						var i = k(this).constructor;
						r = Reflect.construct(n, arguments, i);
					} else r = n.apply(this, arguments);
					return E(this, r);
				};
			}
			function E(e, t) {
				return t && (d(t) === "object" || typeof t == "function") ? t : D(e);
			}
			function D(e) {
				if (e === void 0) throw ReferenceError("this hasn't been initialised - super() hasn't been called");
				return e;
			}
			function O() {
				if (typeof Reflect > "u" || !Reflect.construct || Reflect.construct.sham) return !1;
				if (typeof Proxy == "function") return !0;
				try {
					return Date.prototype.toString.call(Reflect.construct(Date, [], function() {})), !0;
				} catch {
					return !1;
				}
			}
			function k(e) {
				return k = Object.setPrototypeOf ? Object.getPrototypeOf : function(e) {
					return e.__proto__ || Object.getPrototypeOf(e);
				}, k(e);
			}
			function A(e, t, n) {
				return t in e ? Object.defineProperty(e, t, {
					value: n,
					enumerable: !0,
					configurable: !0,
					writable: !0
				}) : e[t] = n, e;
			}
			var j = {
				touch: {
					start: "touchstart",
					move: "touchmove",
					stop: "touchend"
				},
				mouse: {
					start: "mousedown",
					move: "mousemove",
					stop: "mouseup"
				}
			}, M = j.mouse, te = function(e) {
				C(o, e);
				var n = T(o);
				function o() {
					var e;
					b(this, o);
					var t = [...arguments];
					return e = n.call.apply(n, [this].concat(t)), A(D(e), "state", {
						dragging: !1,
						lastX: NaN,
						lastY: NaN,
						touchIdentifier: null
					}), A(D(e), "mounted", !1), A(D(e), "handleDragStart", function(t) {
						if (e.props.onMouseDown(t), !e.props.allowAnyClick && typeof t.button == "number" && t.button !== 0) return !1;
						var n = e.findDOMNode();
						if (!n || !n.ownerDocument || !n.ownerDocument.body) throw Error("<DraggableCore> not mounted on DragStart!");
						var r = n.ownerDocument;
						if (!(e.props.disabled || !(t.target instanceof r.defaultView.Node) || e.props.handle && !(0, i.matchesSelectorAndParentsTo)(t.target, e.props.handle, n) || e.props.cancel && (0, i.matchesSelectorAndParentsTo)(t.target, e.props.cancel, n))) {
							t.type === "touchstart" && t.preventDefault();
							var o = (0, i.getTouchIdentifier)(t);
							e.setState({ touchIdentifier: o });
							var c = (0, a.getControlPosition)(t, o, D(e));
							if (c != null) {
								var l = c.x, u = c.y, d = (0, a.createCoreData)(D(e), l, u);
								(0, s.default)("DraggableCore: handleDragStart: %j", d), (0, s.default)("calling", e.props.onStart), e.props.onStart(t, d) !== !1 && e.mounted !== !1 && (e.props.enableUserSelectHack && (0, i.addUserSelectStyles)(r), e.setState({
									dragging: !0,
									lastX: l,
									lastY: u
								}), (0, i.addEvent)(r, M.move, e.handleDrag), (0, i.addEvent)(r, M.stop, e.handleDragStop));
							}
						}
					}), A(D(e), "handleDrag", function(t) {
						var n = (0, a.getControlPosition)(t, e.state.touchIdentifier, D(e));
						if (n != null) {
							var r = n.x, i = n.y;
							if (Array.isArray(e.props.grid)) {
								var o = r - e.state.lastX, c = i - e.state.lastY, l = f((0, a.snapToGrid)(e.props.grid, o, c), 2);
								if (o = l[0], c = l[1], !o && !c) return;
								r = e.state.lastX + o, i = e.state.lastY + c;
							}
							var u = (0, a.createCoreData)(D(e), r, i);
							if ((0, s.default)("DraggableCore: handleDrag: %j", u), e.props.onDrag(t, u) === !1 || e.mounted === !1) {
								try {
									e.handleDragStop(new MouseEvent("mouseup"));
								} catch {
									var d = document.createEvent("MouseEvents");
									d.initMouseEvent("mouseup", !0, !0, window, 0, 0, 0, 0, 0, !1, !1, !1, !1, 0, null), e.handleDragStop(d);
								}
								return;
							}
							e.setState({
								lastX: r,
								lastY: i
							});
						}
					}), A(D(e), "handleDragStop", function(t) {
						if (e.state.dragging) {
							var n = (0, a.getControlPosition)(t, e.state.touchIdentifier, D(e));
							if (n != null) {
								var r = n.x, o = n.y, c = (0, a.createCoreData)(D(e), r, o);
								if (e.props.onStop(t, c) === !1 || e.mounted === !1) return !1;
								var l = e.findDOMNode();
								l && e.props.enableUserSelectHack && (0, i.removeUserSelectStyles)(l.ownerDocument), (0, s.default)("DraggableCore: handleDragStop: %j", c), e.setState({
									dragging: !1,
									lastX: NaN,
									lastY: NaN
								}), l && ((0, s.default)("DraggableCore: Removing handlers"), (0, i.removeEvent)(l.ownerDocument, M.move, e.handleDrag), (0, i.removeEvent)(l.ownerDocument, M.stop, e.handleDragStop));
							}
						}
					}), A(D(e), "onMouseDown", function(t) {
						return M = j.mouse, e.handleDragStart(t);
					}), A(D(e), "onMouseUp", function(t) {
						return M = j.mouse, e.handleDragStop(t);
					}), A(D(e), "onTouchStart", function(t) {
						return M = j.touch, e.handleDragStart(t);
					}), A(D(e), "onTouchEnd", function(t) {
						return M = j.touch, e.handleDragStop(t);
					}), e;
				}
				return S(o, [
					{
						key: "componentDidMount",
						value: function() {
							this.mounted = !0;
							var e = this.findDOMNode();
							e && (0, i.addEvent)(e, j.touch.start, this.onTouchStart, { passive: !1 });
						}
					},
					{
						key: "componentWillUnmount",
						value: function() {
							this.mounted = !1;
							var e = this.findDOMNode();
							if (e) {
								var t = e.ownerDocument;
								(0, i.removeEvent)(t, j.mouse.move, this.handleDrag), (0, i.removeEvent)(t, j.touch.move, this.handleDrag), (0, i.removeEvent)(t, j.mouse.stop, this.handleDragStop), (0, i.removeEvent)(t, j.touch.stop, this.handleDragStop), (0, i.removeEvent)(e, j.touch.start, this.onTouchStart, { passive: !1 }), this.props.enableUserSelectHack && (0, i.removeUserSelectStyles)(t);
							}
						}
					},
					{
						key: "findDOMNode",
						value: function() {
							return this.props.nodeRef ? this.props.nodeRef.current : r.default.findDOMNode(this);
						}
					},
					{
						key: "render",
						value: function() {
							return t.cloneElement(t.Children.only(this.props.children), {
								onMouseDown: this.onMouseDown,
								onMouseUp: this.onMouseUp,
								onTouchEnd: this.onTouchEnd
							});
						}
					}
				]), o;
			}(t.Component);
			e.default = te, A(te, "displayName", "DraggableCore"), A(te, "propTypes", {
				allowAnyClick: n.default.bool,
				disabled: n.default.bool,
				enableUserSelectHack: n.default.bool,
				offsetParent: function(e, t) {
					if (e[t] && e[t].nodeType !== 1) throw Error("Draggable's offsetParent must be a DOM Node.");
				},
				grid: n.default.arrayOf(n.default.number),
				handle: n.default.string,
				cancel: n.default.string,
				nodeRef: n.default.object,
				onStart: n.default.func,
				onDrag: n.default.func,
				onStop: n.default.func,
				onMouseDown: n.default.func,
				scale: n.default.number,
				className: o.dontSetMe,
				style: o.dontSetMe,
				transform: o.dontSetMe
			}), A(te, "defaultProps", {
				allowAnyClick: !1,
				cancel: null,
				disabled: !1,
				enableUserSelectHack: !0,
				offsetParent: null,
				handle: null,
				grid: null,
				transform: null,
				onStart: function() {},
				onDrag: function() {},
				onStop: function() {},
				onMouseDown: function() {},
				scale: 1
			});
		})), Ur = s(((e) => {
			Object.defineProperty(e, "__esModule", { value: !0 }), Object.defineProperty(e, "DraggableCore", {
				enumerable: !0,
				get: function() {
					return c.default;
				}
			}), e.default = void 0;
			var t = f(m()), n = u(ee()), r = u(v()), i = u(Ir()), a = zr(), o = Br(), s = Lr(), c = u(Hr()), l = u(Vr());
			function u(e) {
				return e && e.__esModule ? e : { default: e };
			}
			function d() {
				if (typeof WeakMap != "function") return null;
				var e = /* @__PURE__ */ new WeakMap();
				return d = function() {
					return e;
				}, e;
			}
			function f(e) {
				if (e && e.__esModule) return e;
				if (e === null || p(e) !== "object" && typeof e != "function") return { default: e };
				var t = d();
				if (t && t.has(e)) return t.get(e);
				var n = {}, r = Object.defineProperty && Object.getOwnPropertyDescriptor;
				for (var i in e) if (Object.prototype.hasOwnProperty.call(e, i)) {
					var a = r ? Object.getOwnPropertyDescriptor(e, i) : null;
					a && (a.get || a.set) ? Object.defineProperty(n, i, a) : n[i] = e[i];
				}
				return n.default = e, t && t.set(e, n), n;
			}
			function p(e) {
				"@babel/helpers - typeof";
				return p = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e) {
					return typeof e;
				} : function(e) {
					return e && typeof Symbol == "function" && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;
				}, p(e);
			}
			function h() {
				return h = Object.assign || function(e) {
					for (var t = 1; t < arguments.length; t++) {
						var n = arguments[t];
						for (var r in n) Object.prototype.hasOwnProperty.call(n, r) && (e[r] = n[r]);
					}
					return e;
				}, h.apply(this, arguments);
			}
			function g(e, t) {
				if (e == null) return {};
				var n = _(e, t), r, i;
				if (Object.getOwnPropertySymbols) {
					var a = Object.getOwnPropertySymbols(e);
					for (i = 0; i < a.length; i++) r = a[i], !(t.indexOf(r) >= 0) && Object.prototype.propertyIsEnumerable.call(e, r) && (n[r] = e[r]);
				}
				return n;
			}
			function _(e, t) {
				if (e == null) return {};
				for (var n = {}, r = Object.keys(e), i, a = 0; a < r.length; a++) i = r[a], !(t.indexOf(i) >= 0) && (n[i] = e[i]);
				return n;
			}
			function y(e, t) {
				return w(e) || C(e, t) || x(e, t) || b();
			}
			function b() {
				throw TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
			}
			function x(e, t) {
				if (e) {
					if (typeof e == "string") return S(e, t);
					var n = Object.prototype.toString.call(e).slice(8, -1);
					if (n === "Object" && e.constructor && (n = e.constructor.name), n === "Map" || n === "Set") return Array.from(e);
					if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return S(e, t);
				}
			}
			function S(e, t) {
				(t == null || t > e.length) && (t = e.length);
				for (var n = 0, r = Array(t); n < t; n++) r[n] = e[n];
				return r;
			}
			function C(e, t) {
				if (typeof Symbol < "u" && Symbol.iterator in Object(e)) {
					var n = [], r = !0, i = !1, a = void 0;
					try {
						for (var o = e[Symbol.iterator](), s; !(r = (s = o.next()).done) && (n.push(s.value), !(t && n.length === t)); r = !0);
					} catch (e) {
						i = !0, a = e;
					} finally {
						try {
							!r && o.return != null && o.return();
						} finally {
							if (i) throw a;
						}
					}
					return n;
				}
			}
			function w(e) {
				if (Array.isArray(e)) return e;
			}
			function T(e, t) {
				var n = Object.keys(e);
				if (Object.getOwnPropertySymbols) {
					var r = Object.getOwnPropertySymbols(e);
					t && (r = r.filter(function(t) {
						return Object.getOwnPropertyDescriptor(e, t).enumerable;
					})), n.push.apply(n, r);
				}
				return n;
			}
			function E(e) {
				for (var t = 1; t < arguments.length; t++) {
					var n = arguments[t] == null ? {} : arguments[t];
					t % 2 ? T(Object(n), !0).forEach(function(t) {
						ie(e, t, n[t]);
					}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : T(Object(n)).forEach(function(t) {
						Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(n, t));
					});
				}
				return e;
			}
			function D(e, t) {
				if (!(e instanceof t)) throw TypeError("Cannot call a class as a function");
			}
			function O(e, t) {
				for (var n = 0; n < t.length; n++) {
					var r = t[n];
					r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), Object.defineProperty(e, r.key, r);
				}
			}
			function k(e, t, n) {
				return t && O(e.prototype, t), n && O(e, n), e;
			}
			function A(e, t) {
				if (typeof t != "function" && t !== null) throw TypeError("Super expression must either be null or a function");
				e.prototype = Object.create(t && t.prototype, { constructor: {
					value: e,
					writable: !0,
					configurable: !0
				} }), t && j(e, t);
			}
			function j(e, t) {
				return j = Object.setPrototypeOf || function(e, t) {
					return e.__proto__ = t, e;
				}, j(e, t);
			}
			function M(e) {
				var t = ne();
				return function() {
					var n = re(e), r;
					if (t) {
						var i = re(this).constructor;
						r = Reflect.construct(n, arguments, i);
					} else r = n.apply(this, arguments);
					return te(this, r);
				};
			}
			function te(e, t) {
				return t && (p(t) === "object" || typeof t == "function") ? t : N(e);
			}
			function N(e) {
				if (e === void 0) throw ReferenceError("this hasn't been initialised - super() hasn't been called");
				return e;
			}
			function ne() {
				if (typeof Reflect > "u" || !Reflect.construct || Reflect.construct.sham) return !1;
				if (typeof Proxy == "function") return !0;
				try {
					return Date.prototype.toString.call(Reflect.construct(Date, [], function() {})), !0;
				} catch {
					return !1;
				}
			}
			function re(e) {
				return re = Object.setPrototypeOf ? Object.getPrototypeOf : function(e) {
					return e.__proto__ || Object.getPrototypeOf(e);
				}, re(e);
			}
			function ie(e, t, n) {
				return t in e ? Object.defineProperty(e, t, {
					value: n,
					enumerable: !0,
					configurable: !0,
					writable: !0
				}) : e[t] = n, e;
			}
			var ae = function(e) {
				A(s, e);
				var n = M(s);
				k(s, null, [{
					key: "getDerivedStateFromProps",
					value: function(e, t) {
						var n = e.position, r = t.prevPropsPosition;
						return n && (!r || n.x !== r.x || n.y !== r.y) ? ((0, l.default)("Draggable: getDerivedStateFromProps %j", {
							position: n,
							prevPropsPosition: r
						}), {
							x: n.x,
							y: n.y,
							prevPropsPosition: E({}, n)
						}) : null;
					}
				}]);
				function s(e) {
					var t;
					return D(this, s), t = n.call(this, e), ie(N(t), "onDragStart", function(e, n) {
						if ((0, l.default)("Draggable: onDragStart: %j", n), t.props.onStart(e, (0, o.createDraggableData)(N(t), n)) === !1) return !1;
						t.setState({
							dragging: !0,
							dragged: !0
						});
					}), ie(N(t), "onDrag", function(e, n) {
						if (!t.state.dragging) return !1;
						(0, l.default)("Draggable: onDrag: %j", n);
						var r = (0, o.createDraggableData)(N(t), n), i = {
							x: r.x,
							y: r.y
						};
						if (t.props.bounds) {
							var a = i.x, s = i.y;
							i.x += t.state.slackX, i.y += t.state.slackY;
							var c = y((0, o.getBoundPosition)(N(t), i.x, i.y), 2), u = c[0], d = c[1];
							i.x = u, i.y = d, i.slackX = t.state.slackX + (a - i.x), i.slackY = t.state.slackY + (s - i.y), r.x = i.x, r.y = i.y, r.deltaX = i.x - t.state.x, r.deltaY = i.y - t.state.y;
						}
						if (t.props.onDrag(e, r) === !1) return !1;
						t.setState(i);
					}), ie(N(t), "onDragStop", function(e, n) {
						if (!t.state.dragging || t.props.onStop(e, (0, o.createDraggableData)(N(t), n)) === !1) return !1;
						(0, l.default)("Draggable: onDragStop: %j", n);
						var r = {
							dragging: !1,
							slackX: 0,
							slackY: 0
						};
						if (t.props.position) {
							var i = t.props.position, a = i.x, s = i.y;
							r.x = a, r.y = s;
						}
						t.setState(r);
					}), t.state = {
						dragging: !1,
						dragged: !1,
						x: e.position ? e.position.x : e.defaultPosition.x,
						y: e.position ? e.position.y : e.defaultPosition.y,
						prevPropsPosition: E({}, e.position),
						slackX: 0,
						slackY: 0,
						isElementSVG: !1
					}, e.position && !(e.onDrag || e.onStop) && console.warn("A `position` was applied to this <Draggable>, without drag handlers. This will make this component effectively undraggable. Please attach `onDrag` or `onStop` handlers so you can adjust the `position` of this element."), t;
				}
				return k(s, [
					{
						key: "componentDidMount",
						value: function() {
							window.SVGElement !== void 0 && this.findDOMNode() instanceof window.SVGElement && this.setState({ isElementSVG: !0 });
						}
					},
					{
						key: "componentWillUnmount",
						value: function() {
							this.setState({ dragging: !1 });
						}
					},
					{
						key: "findDOMNode",
						value: function() {
							return this.props.nodeRef ? this.props.nodeRef.current : r.default.findDOMNode(this);
						}
					},
					{
						key: "render",
						value: function() {
							var e, n = this.props;
							n.axis, n.bounds;
							var r = n.children, s = n.defaultPosition, l = n.defaultClassName, u = n.defaultClassNameDragging, d = n.defaultClassNameDragged, f = n.position, p = n.positionOffset;
							n.scale;
							var m = g(n, [
								"axis",
								"bounds",
								"children",
								"defaultPosition",
								"defaultClassName",
								"defaultClassNameDragging",
								"defaultClassNameDragged",
								"position",
								"positionOffset",
								"scale"
							]), _ = {}, v = null, y = !f || this.state.dragging, b = f || s, x = {
								x: (0, o.canDragX)(this) && y ? this.state.x : b.x,
								y: (0, o.canDragY)(this) && y ? this.state.y : b.y
							};
							this.state.isElementSVG ? v = (0, a.createSVGTransform)(x, p) : _ = (0, a.createCSSTransform)(x, p);
							var S = (0, i.default)(r.props.className || "", l, (e = {}, ie(e, u, this.state.dragging), ie(e, d, this.state.dragged), e));
							return t.createElement(c.default, h({}, m, {
								onStart: this.onDragStart,
								onDrag: this.onDrag,
								onStop: this.onDragStop
							}), t.cloneElement(t.Children.only(r), {
								className: S,
								style: E(E({}, r.props.style), _),
								transform: v
							}));
						}
					}
				]), s;
			}(t.Component);
			e.default = ae, ie(ae, "displayName", "Draggable"), ie(ae, "propTypes", E(E({}, c.default.propTypes), {}, {
				axis: n.default.oneOf([
					"both",
					"x",
					"y",
					"none"
				]),
				bounds: n.default.oneOfType([
					n.default.shape({
						left: n.default.number,
						right: n.default.number,
						top: n.default.number,
						bottom: n.default.number
					}),
					n.default.string,
					n.default.oneOf([!1])
				]),
				defaultClassName: n.default.string,
				defaultClassNameDragging: n.default.string,
				defaultClassNameDragged: n.default.string,
				defaultPosition: n.default.shape({
					x: n.default.number,
					y: n.default.number
				}),
				positionOffset: n.default.shape({
					x: n.default.oneOfType([n.default.number, n.default.string]),
					y: n.default.oneOfType([n.default.number, n.default.string])
				}),
				position: n.default.shape({
					x: n.default.number,
					y: n.default.number
				}),
				className: s.dontSetMe,
				style: s.dontSetMe,
				transform: s.dontSetMe
			})), ie(ae, "defaultProps", E(E({}, c.default.defaultProps), {}, {
				axis: "both",
				bounds: !1,
				defaultClassName: "react-draggable",
				defaultClassNameDragging: "react-draggable-dragging",
				defaultClassNameDragged: "react-draggable-dragged",
				defaultPosition: {
					x: 0,
					y: 0
				},
				position: null,
				scale: 1
			}));
		})), Wr = u(s(((e, t) => {
			var n = Ur(), r = n.default, i = n.DraggableCore;
			t.exports = r, t.exports.default = r, t.exports.DraggableCore = i;
		}))()), Gr = (function() {
			var e = function(t, n) {
				return e = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(e, t) {
					e.__proto__ = t;
				} || function(e, t) {
					for (var n in t) t.hasOwnProperty(n) && (e[n] = t[n]);
				}, e(t, n);
			};
			return function(t, n) {
				e(t, n);
				function r() {
					this.constructor = t;
				}
				t.prototype = n === null ? Object.create(n) : (r.prototype = n.prototype, new r());
			};
		})(), Kr = function() {
			return Kr = Object.assign || function(e) {
				for (var t, n = 1, r = arguments.length; n < r; n++) for (var i in t = arguments[n], t) Object.prototype.hasOwnProperty.call(t, i) && (e[i] = t[i]);
				return e;
			}, Kr.apply(this, arguments);
		}, qr = {
			top: {
				width: "100%",
				height: "10px",
				top: "-5px",
				left: "0px",
				cursor: "row-resize"
			},
			right: {
				width: "10px",
				height: "100%",
				top: "0px",
				right: "-5px",
				cursor: "col-resize"
			},
			bottom: {
				width: "100%",
				height: "10px",
				bottom: "-5px",
				left: "0px",
				cursor: "row-resize"
			},
			left: {
				width: "10px",
				height: "100%",
				top: "0px",
				left: "-5px",
				cursor: "col-resize"
			},
			topRight: {
				width: "20px",
				height: "20px",
				position: "absolute",
				right: "-10px",
				top: "-10px",
				cursor: "ne-resize"
			},
			bottomRight: {
				width: "20px",
				height: "20px",
				position: "absolute",
				right: "-10px",
				bottom: "-10px",
				cursor: "se-resize"
			},
			bottomLeft: {
				width: "20px",
				height: "20px",
				position: "absolute",
				left: "-10px",
				bottom: "-10px",
				cursor: "sw-resize"
			},
			topLeft: {
				width: "20px",
				height: "20px",
				position: "absolute",
				left: "-10px",
				top: "-10px",
				cursor: "nw-resize"
			}
		}, Jr = function(e) {
			Gr(t, e);
			function t() {
				var t = e !== null && e.apply(this, arguments) || this;
				return t.onMouseDown = function(e) {
					t.props.onResizeStart(e, t.props.direction);
				}, t.onTouchStart = function(e) {
					t.props.onResizeStart(e, t.props.direction);
				}, t;
			}
			return t.prototype.render = function() {
				return y.createElement("div", {
					className: this.props.className || "",
					style: Kr(Kr({
						position: "absolute",
						userSelect: "none"
					}, qr[this.props.direction]), this.props.replaceStyles || {}),
					onMouseDown: this.onMouseDown,
					onTouchStart: this.onTouchStart
				}, this.props.children);
			}, t;
		}(y.PureComponent), Yr = u(s(((e, t) => {
			function n(e, t) {
				var n = t && t.cache ? t.cache : f, r = t && t.serializer ? t.serializer : u;
				return (t && t.strategy ? t.strategy : s)(e, {
					cache: n,
					serializer: r
				});
			}
			function r(e) {
				return e == null || typeof e == "number" || typeof e == "boolean";
			}
			function i(e, t, n, i) {
				var a = r(i) ? i : n(i), o = t.get(a);
				return o === void 0 && (o = e.call(this, i), t.set(a, o)), o;
			}
			function a(e, t, n) {
				var r = Array.prototype.slice.call(arguments, 3), i = n(r), a = t.get(i);
				return a === void 0 && (a = e.apply(this, r), t.set(i, a)), a;
			}
			function o(e, t, n, r, i) {
				return n.bind(t, e, r, i);
			}
			function s(e, t) {
				var n = e.length === 1 ? i : a;
				return o(e, this, n, t.cache.create(), t.serializer);
			}
			function c(e, t) {
				var n = a;
				return o(e, this, n, t.cache.create(), t.serializer);
			}
			function l(e, t) {
				var n = i;
				return o(e, this, n, t.cache.create(), t.serializer);
			}
			function u() {
				return JSON.stringify(arguments);
			}
			function d() {
				this.cache = Object.create(null);
			}
			d.prototype.has = function(e) {
				return e in this.cache;
			}, d.prototype.get = function(e) {
				return this.cache[e];
			}, d.prototype.set = function(e, t) {
				this.cache[e] = t;
			};
			var f = { create: function() {
				return new d();
			} };
			t.exports = n, t.exports.strategies = {
				variadic: c,
				monadic: l
			};
		}))()), Xr = (function() {
			var e = function(t, n) {
				return e = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(e, t) {
					e.__proto__ = t;
				} || function(e, t) {
					for (var n in t) t.hasOwnProperty(n) && (e[n] = t[n]);
				}, e(t, n);
			};
			return function(t, n) {
				e(t, n);
				function r() {
					this.constructor = t;
				}
				t.prototype = n === null ? Object.create(n) : (r.prototype = n.prototype, new r());
			};
		})(), Zr = function() {
			return Zr = Object.assign || function(e) {
				for (var t, n = 1, r = arguments.length; n < r; n++) for (var i in t = arguments[n], t) Object.prototype.hasOwnProperty.call(t, i) && (e[i] = t[i]);
				return e;
			}, Zr.apply(this, arguments);
		}, Qr = {
			width: "auto",
			height: "auto"
		}, $r = (0, Yr.default)(function(e, t, n) {
			return Math.max(Math.min(e, n), t);
		}), ei = (0, Yr.default)(function(e, t) {
			return Math.round(e / t) * t;
		}), ti = (0, Yr.default)(function(e, t) {
			return new RegExp(e, "i").test(t);
		}), ni = function(e) {
			return !!(e.touches && e.touches.length);
		}, ri = function(e) {
			return !(!e.clientX && e.clientX !== 0 || !e.clientY && e.clientY !== 0);
		}, ii = (0, Yr.default)(function(e, t, n) {
			n === void 0 && (n = 0);
			var r = t.reduce(function(n, r, i) {
				return Math.abs(r - e) < Math.abs(t[n] - e) ? i : n;
			}, 0), i = Math.abs(t[r] - e);
			return n === 0 || i < n ? t[r] : e;
		}), V = (0, Yr.default)(function(e, t) {
			return e.substr(e.length - t.length, t.length) === t;
		}), ai = (0, Yr.default)(function(e) {
			return e = e.toString(), e === "auto" || V(e, "px") || V(e, "%") || V(e, "vh") || V(e, "vw") || V(e, "vmax") || V(e, "vmin") ? e : e + "px";
		}), oi = function(e, t, n, r) {
			if (e && typeof e == "string") {
				if (V(e, "px")) return Number(e.replace("px", ""));
				if (V(e, "%")) {
					var i = Number(e.replace("%", "")) / 100;
					return t * i;
				}
				if (V(e, "vw")) {
					var i = Number(e.replace("vw", "")) / 100;
					return n * i;
				}
				if (V(e, "vh")) {
					var i = Number(e.replace("vh", "")) / 100;
					return r * i;
				}
			}
			return e;
		}, si = (0, Yr.default)(function(e, t, n, r, i, a, o) {
			return r = oi(r, e.width, t, n), i = oi(i, e.height, t, n), a = oi(a, e.width, t, n), o = oi(o, e.height, t, n), {
				maxWidth: r === void 0 ? void 0 : Number(r),
				maxHeight: i === void 0 ? void 0 : Number(i),
				minWidth: a === void 0 ? void 0 : Number(a),
				minHeight: o === void 0 ? void 0 : Number(o)
			};
		}), ci = "as.style.className.grid.snap.bounds.boundsByDirection.size.defaultSize.minWidth.minHeight.maxWidth.maxHeight.lockAspectRatio.lockAspectRatioExtraWidth.lockAspectRatioExtraHeight.enable.handleStyles.handleClasses.handleWrapperStyle.handleWrapperClass.children.onResizeStart.onResize.onResizeStop.handleComponent.scale.resizeRatio.snapGap".split("."), li = "__resizable_base__", ui = function(e) {
			Xr(t, e);
			function t(t) {
				var n = e.call(this, t) || this;
				return n.ratio = 1, n.resizable = null, n.parentLeft = 0, n.parentTop = 0, n.resizableLeft = 0, n.resizableRight = 0, n.resizableTop = 0, n.resizableBottom = 0, n.targetLeft = 0, n.targetTop = 0, n.appendBase = function() {
					if (!n.resizable || !n.window) return null;
					var e = n.parentNode;
					if (!e) return null;
					var t = n.window.document.createElement("div");
					return t.style.width = "100%", t.style.height = "100%", t.style.position = "absolute", t.style.transform = "scale(0, 0)", t.style.left = "0", t.style.flex = "0", t.classList ? t.classList.add(li) : t.className += li, e.appendChild(t), t;
				}, n.removeBase = function(e) {
					var t = n.parentNode;
					t && t.removeChild(e);
				}, n.ref = function(e) {
					e && (n.resizable = e);
				}, n.state = {
					isResizing: !1,
					width: (n.propsSize && n.propsSize.width) === void 0 ? "auto" : n.propsSize && n.propsSize.width,
					height: (n.propsSize && n.propsSize.height) === void 0 ? "auto" : n.propsSize && n.propsSize.height,
					direction: "right",
					original: {
						x: 0,
						y: 0,
						width: 0,
						height: 0
					},
					backgroundStyle: {
						height: "100%",
						width: "100%",
						backgroundColor: "rgba(0,0,0,0)",
						cursor: "auto",
						opacity: 0,
						position: "fixed",
						zIndex: 9999,
						top: "0",
						left: "0",
						bottom: "0",
						right: "0"
					},
					flexBasis: void 0
				}, n.onResizeStart = n.onResizeStart.bind(n), n.onMouseMove = n.onMouseMove.bind(n), n.onMouseUp = n.onMouseUp.bind(n), n;
			}
			return Object.defineProperty(t.prototype, "parentNode", {
				get: function() {
					return this.resizable ? this.resizable.parentNode : null;
				},
				enumerable: !1,
				configurable: !0
			}), Object.defineProperty(t.prototype, "window", {
				get: function() {
					return !this.resizable || !this.resizable.ownerDocument ? null : this.resizable.ownerDocument.defaultView;
				},
				enumerable: !1,
				configurable: !0
			}), Object.defineProperty(t.prototype, "propsSize", {
				get: function() {
					return this.props.size || this.props.defaultSize || Qr;
				},
				enumerable: !1,
				configurable: !0
			}), Object.defineProperty(t.prototype, "size", {
				get: function() {
					var e = 0, t = 0;
					if (this.resizable && this.window) {
						var n = this.resizable.offsetWidth, r = this.resizable.offsetHeight, i = this.resizable.style.position;
						i !== "relative" && (this.resizable.style.position = "relative"), e = this.resizable.style.width === "auto" ? n : this.resizable.offsetWidth, t = this.resizable.style.height === "auto" ? r : this.resizable.offsetHeight, this.resizable.style.position = i;
					}
					return {
						width: e,
						height: t
					};
				},
				enumerable: !1,
				configurable: !0
			}), Object.defineProperty(t.prototype, "sizeStyle", {
				get: function() {
					var e = this, t = this.props.size, n = function(t) {
						if (e.state[t] === void 0 || e.state[t] === "auto") return "auto";
						if (e.propsSize && e.propsSize[t] && V(e.propsSize[t].toString(), "%")) {
							if (V(e.state[t].toString(), "%")) return e.state[t].toString();
							var n = e.getParentSize();
							return Number(e.state[t].toString().replace("px", "")) / n[t] * 100 + "%";
						}
						return ai(e.state[t]);
					};
					return {
						width: t && t.width !== void 0 && !this.state.isResizing ? ai(t.width) : n("width"),
						height: t && t.height !== void 0 && !this.state.isResizing ? ai(t.height) : n("height")
					};
				},
				enumerable: !1,
				configurable: !0
			}), t.prototype.getParentSize = function() {
				if (!this.parentNode) return this.window ? {
					width: this.window.innerWidth,
					height: this.window.innerHeight
				} : {
					width: 0,
					height: 0
				};
				var e = this.appendBase();
				if (!e) return {
					width: 0,
					height: 0
				};
				var t = !1, n = this.parentNode.style.flexWrap;
				n !== "wrap" && (t = !0, this.parentNode.style.flexWrap = "wrap"), e.style.position = "relative", e.style.minWidth = "100%";
				var r = {
					width: e.offsetWidth,
					height: e.offsetHeight
				};
				return t && (this.parentNode.style.flexWrap = n), this.removeBase(e), r;
			}, t.prototype.bindEvents = function() {
				this.window && (this.window.addEventListener("mouseup", this.onMouseUp), this.window.addEventListener("mousemove", this.onMouseMove), this.window.addEventListener("mouseleave", this.onMouseUp), this.window.addEventListener("touchmove", this.onMouseMove, {
					capture: !0,
					passive: !1
				}), this.window.addEventListener("touchend", this.onMouseUp));
			}, t.prototype.unbindEvents = function() {
				this.window && (this.window.removeEventListener("mouseup", this.onMouseUp), this.window.removeEventListener("mousemove", this.onMouseMove), this.window.removeEventListener("mouseleave", this.onMouseUp), this.window.removeEventListener("touchmove", this.onMouseMove, !0), this.window.removeEventListener("touchend", this.onMouseUp));
			}, t.prototype.componentDidMount = function() {
				if (this.resizable && this.window) {
					var e = this.window.getComputedStyle(this.resizable);
					this.setState({
						width: this.state.width || this.size.width,
						height: this.state.height || this.size.height,
						flexBasis: e.flexBasis === "auto" ? void 0 : e.flexBasis
					});
				}
			}, t.prototype.componentWillUnmount = function() {
				this.window && this.unbindEvents();
			}, t.prototype.createSizeForCssProperty = function(e, t) {
				var n = this.propsSize && this.propsSize[t];
				return this.state[t] === "auto" && this.state.original[t] === e && (n === void 0 || n === "auto") ? "auto" : e;
			}, t.prototype.calculateNewMaxFromBoundary = function(e, t) {
				var n = this.props.boundsByDirection, r = this.state.direction, i = n && ti("left", r), a = n && ti("top", r), o, s;
				if (this.props.bounds === "parent") {
					var c = this.parentNode;
					c && (o = i ? this.resizableRight - this.parentLeft : c.offsetWidth + (this.parentLeft - this.resizableLeft), s = a ? this.resizableBottom - this.parentTop : c.offsetHeight + (this.parentTop - this.resizableTop));
				} else this.props.bounds === "window" ? this.window && (o = i ? this.resizableRight : this.window.innerWidth - this.resizableLeft, s = a ? this.resizableBottom : this.window.innerHeight - this.resizableTop) : this.props.bounds && (o = i ? this.resizableRight - this.targetLeft : this.props.bounds.offsetWidth + (this.targetLeft - this.resizableLeft), s = a ? this.resizableBottom - this.targetTop : this.props.bounds.offsetHeight + (this.targetTop - this.resizableTop));
				return o && Number.isFinite(o) && (e = e && e < o ? e : o), s && Number.isFinite(s) && (t = t && t < s ? t : s), {
					maxWidth: e,
					maxHeight: t
				};
			}, t.prototype.calculateNewSizeFromDirection = function(e, t) {
				var n = this.props.scale || 1, r = this.props.resizeRatio || 1, i = this.state, a = i.direction, o = i.original, s = this.props, c = s.lockAspectRatio, l = s.lockAspectRatioExtraHeight, u = s.lockAspectRatioExtraWidth, d = o.width, f = o.height, p = l || 0, m = u || 0;
				return ti("right", a) && (d = o.width + (e - o.x) * r / n, c && (f = (d - m) / this.ratio + p)), ti("left", a) && (d = o.width - (e - o.x) * r / n, c && (f = (d - m) / this.ratio + p)), ti("bottom", a) && (f = o.height + (t - o.y) * r / n, c && (d = (f - p) * this.ratio + m)), ti("top", a) && (f = o.height - (t - o.y) * r / n, c && (d = (f - p) * this.ratio + m)), {
					newWidth: d,
					newHeight: f
				};
			}, t.prototype.calculateNewSizeFromAspectRatio = function(e, t, n, r) {
				var i = this.props, a = i.lockAspectRatio, o = i.lockAspectRatioExtraHeight, s = i.lockAspectRatioExtraWidth, c = r.width === void 0 ? 10 : r.width, l = n.width === void 0 || n.width < 0 ? e : n.width, u = r.height === void 0 ? 10 : r.height, d = n.height === void 0 || n.height < 0 ? t : n.height, f = o || 0, p = s || 0;
				if (a) {
					var m = (u - f) * this.ratio + p, h = (d - f) * this.ratio + p, g = (c - p) / this.ratio + f, _ = (l - p) / this.ratio + f, v = Math.max(c, m), y = Math.min(l, h), b = Math.max(u, g), x = Math.min(d, _);
					e = $r(e, v, y), t = $r(t, b, x);
				} else e = $r(e, c, l), t = $r(t, u, d);
				return {
					newWidth: e,
					newHeight: t
				};
			}, t.prototype.setBoundingClientRect = function() {
				if (this.props.bounds === "parent") {
					var e = this.parentNode;
					if (e) {
						var t = e.getBoundingClientRect();
						this.parentLeft = t.left, this.parentTop = t.top;
					}
				}
				if (this.props.bounds && typeof this.props.bounds != "string") {
					var n = this.props.bounds.getBoundingClientRect();
					this.targetLeft = n.left, this.targetTop = n.top;
				}
				if (this.resizable) {
					var r = this.resizable.getBoundingClientRect(), i = r.left, a = r.top, o = r.right, s = r.bottom;
					this.resizableLeft = i, this.resizableRight = o, this.resizableTop = a, this.resizableBottom = s;
				}
			}, t.prototype.onResizeStart = function(e, t) {
				if (this.resizable && this.window) {
					var n = 0, r = 0;
					if (e.nativeEvent && ri(e.nativeEvent)) {
						if (n = e.nativeEvent.clientX, r = e.nativeEvent.clientY, e.nativeEvent.which === 3) return;
					} else e.nativeEvent && ni(e.nativeEvent) && (n = e.nativeEvent.touches[0].clientX, r = e.nativeEvent.touches[0].clientY);
					if (!(this.props.onResizeStart && this.resizable && this.props.onResizeStart(e, t, this.resizable) === !1)) {
						this.props.size && (this.props.size.height !== void 0 && this.props.size.height !== this.state.height && this.setState({ height: this.props.size.height }), this.props.size.width !== void 0 && this.props.size.width !== this.state.width && this.setState({ width: this.props.size.width })), this.ratio = typeof this.props.lockAspectRatio == "number" ? this.props.lockAspectRatio : this.size.width / this.size.height;
						var i, a = this.window.getComputedStyle(this.resizable);
						if (a.flexBasis !== "auto") {
							var o = this.parentNode;
							if (o) {
								var s = this.window.getComputedStyle(o).flexDirection;
								this.flexDir = s.startsWith("row") ? "row" : "column", i = a.flexBasis;
							}
						}
						this.setBoundingClientRect(), this.bindEvents();
						var c = {
							original: {
								x: n,
								y: r,
								width: this.size.width,
								height: this.size.height
							},
							isResizing: !0,
							backgroundStyle: Zr(Zr({}, this.state.backgroundStyle), { cursor: this.window.getComputedStyle(e.target).cursor || "auto" }),
							direction: t,
							flexBasis: i
						};
						this.setState(c);
					}
				}
			}, t.prototype.onMouseMove = function(e) {
				if (this.state.isResizing && this.resizable && this.window) {
					if (this.window.TouchEvent && ni(e)) try {
						e.preventDefault(), e.stopPropagation();
					} catch {}
					var t = this.props, n = t.maxWidth, r = t.maxHeight, i = t.minWidth, a = t.minHeight, o = ni(e) ? e.touches[0].clientX : e.clientX, s = ni(e) ? e.touches[0].clientY : e.clientY, c = this.state, l = c.direction, u = c.original, d = c.width, f = c.height, p = this.getParentSize(), m = si(p, this.window.innerWidth, this.window.innerHeight, n, r, i, a);
					n = m.maxWidth, r = m.maxHeight, i = m.minWidth, a = m.minHeight;
					var h = this.calculateNewSizeFromDirection(o, s), g = h.newHeight, _ = h.newWidth, v = this.calculateNewMaxFromBoundary(n, r), y = this.calculateNewSizeFromAspectRatio(_, g, {
						width: v.maxWidth,
						height: v.maxHeight
					}, {
						width: i,
						height: a
					});
					if (_ = y.newWidth, g = y.newHeight, this.props.grid) {
						var b = ei(_, this.props.grid[0]), x = ei(g, this.props.grid[1]), S = this.props.snapGap || 0;
						_ = S === 0 || Math.abs(b - _) <= S ? b : _, g = S === 0 || Math.abs(x - g) <= S ? x : g;
					}
					this.props.snap && this.props.snap.x && (_ = ii(_, this.props.snap.x, this.props.snapGap)), this.props.snap && this.props.snap.y && (g = ii(g, this.props.snap.y, this.props.snapGap));
					var C = {
						width: _ - u.width,
						height: g - u.height
					};
					if (d && typeof d == "string") {
						if (V(d, "%")) {
							var w = _ / p.width * 100;
							_ = w + "%";
						} else if (V(d, "vw")) {
							var T = _ / this.window.innerWidth * 100;
							_ = T + "vw";
						} else if (V(d, "vh")) {
							var E = _ / this.window.innerHeight * 100;
							_ = E + "vh";
						}
					}
					if (f && typeof f == "string") {
						if (V(f, "%")) {
							var w = g / p.height * 100;
							g = w + "%";
						} else if (V(f, "vw")) {
							var T = g / this.window.innerWidth * 100;
							g = T + "vw";
						} else if (V(f, "vh")) {
							var E = g / this.window.innerHeight * 100;
							g = E + "vh";
						}
					}
					var D = {
						width: this.createSizeForCssProperty(_, "width"),
						height: this.createSizeForCssProperty(g, "height")
					};
					this.flexDir === "row" ? D.flexBasis = D.width : this.flexDir === "column" && (D.flexBasis = D.height), this.setState(D), this.props.onResize && this.props.onResize(e, l, this.resizable, C);
				}
			}, t.prototype.onMouseUp = function(e) {
				var t = this.state, n = t.isResizing, r = t.direction, i = t.original;
				if (n && this.resizable) {
					var a = {
						width: this.size.width - i.width,
						height: this.size.height - i.height
					};
					this.props.onResizeStop && this.props.onResizeStop(e, r, this.resizable, a), this.props.size && this.setState(this.props.size), this.unbindEvents(), this.setState({
						isResizing: !1,
						backgroundStyle: Zr(Zr({}, this.state.backgroundStyle), { cursor: "auto" })
					});
				}
			}, t.prototype.updateSize = function(e) {
				this.setState({
					width: e.width,
					height: e.height
				});
			}, t.prototype.renderResizer = function() {
				var e = this, t = this.props, n = t.enable, r = t.handleStyles, i = t.handleClasses, a = t.handleWrapperStyle, o = t.handleWrapperClass, s = t.handleComponent;
				if (!n) return null;
				var c = Object.keys(n).map(function(t) {
					return n[t] === !1 ? null : y.createElement(Jr, {
						key: t,
						direction: t,
						onResizeStart: e.onResizeStart,
						replaceStyles: r && r[t],
						className: i && i[t]
					}, s && s[t] ? s[t] : null);
				});
				return y.createElement("div", {
					className: o,
					style: a
				}, c);
			}, t.prototype.render = function() {
				var e = this, t = Object.keys(this.props).reduce(function(t, n) {
					return ci.indexOf(n) === -1 && (t[n] = e.props[n]), t;
				}, {}), n = Zr(Zr(Zr({
					position: "relative",
					userSelect: this.state.isResizing ? "none" : "auto"
				}, this.props.style), this.sizeStyle), {
					maxWidth: this.props.maxWidth,
					maxHeight: this.props.maxHeight,
					minWidth: this.props.minWidth,
					minHeight: this.props.minHeight,
					boxSizing: "border-box",
					flexShrink: 0
				});
				this.state.flexBasis && (n.flexBasis = this.state.flexBasis);
				var r = this.props.as || "div";
				return y.createElement(r, Zr({
					ref: this.ref,
					style: n,
					className: this.props.className
				}, t), this.state.isResizing && y.createElement("div", { style: this.state.backgroundStyle }), this.props.children, this.renderResizer());
			}, t.defaultProps = {
				as: "div",
				onResizeStart: function() {},
				onResize: function() {},
				onResizeStop: function() {},
				enable: {
					top: !0,
					right: !0,
					bottom: !0,
					left: !0,
					topRight: !0,
					bottomRight: !0,
					bottomLeft: !0,
					topLeft: !0
				},
				style: {},
				grid: [1, 1],
				lockAspectRatio: !1,
				lockAspectRatioExtraWidth: 0,
				lockAspectRatioExtraHeight: 0,
				scale: 1,
				resizeRatio: 1,
				snapGap: 0
			}, t;
		}(y.PureComponent), di = function(e, t) {
			return di = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(e, t) {
				e.__proto__ = t;
			} || function(e, t) {
				for (var n in t) t.hasOwnProperty(n) && (e[n] = t[n]);
			}, di(e, t);
		};
		function fi(e, t) {
			di(e, t);
			function n() {
				this.constructor = e;
			}
			e.prototype = t === null ? Object.create(t) : (n.prototype = t.prototype, new n());
		}
		var pi = function() {
			return pi = Object.assign || function(e) {
				for (var t, n = 1, r = arguments.length; n < r; n++) for (var i in t = arguments[n], t) Object.prototype.hasOwnProperty.call(t, i) && (e[i] = t[i]);
				return e;
			}, pi.apply(this, arguments);
		};
		function mi(e, t) {
			var n = {};
			for (var r in e) Object.prototype.hasOwnProperty.call(e, r) && t.indexOf(r) < 0 && (n[r] = e[r]);
			if (e != null && typeof Object.getOwnPropertySymbols == "function") for (var i = 0, r = Object.getOwnPropertySymbols(e); i < r.length; i++) t.indexOf(r[i]) < 0 && Object.prototype.propertyIsEnumerable.call(e, r[i]) && (n[r[i]] = e[r[i]]);
			return n;
		}
		var hi = Wr.default, gi = {
			width: "auto",
			height: "auto",
			display: "inline-block",
			position: "absolute",
			top: 0,
			left: 0
		}, _i = function(e) {
			return {
				bottom: e,
				bottomLeft: e,
				bottomRight: e,
				left: e,
				right: e,
				top: e,
				topLeft: e,
				topRight: e
			};
		}, vi = function(e) {
			fi(t, e);
			function t(t) {
				var n = e.call(this, t) || this;
				return n.resizing = !1, n.resizingPosition = {
					x: 0,
					y: 0
				}, n.offsetFromParent = {
					left: 0,
					top: 0
				}, n.resizableElement = { current: null }, n.refDraggable = function(e) {
					e && (n.draggable = e);
				}, n.refResizable = function(e) {
					e && (n.resizable = e, n.resizableElement.current = e.resizable);
				}, n.state = {
					original: {
						x: 0,
						y: 0
					},
					bounds: {
						top: 0,
						right: 0,
						bottom: 0,
						left: 0
					},
					maxWidth: t.maxWidth,
					maxHeight: t.maxHeight
				}, n.onResizeStart = n.onResizeStart.bind(n), n.onResize = n.onResize.bind(n), n.onResizeStop = n.onResizeStop.bind(n), n.onDragStart = n.onDragStart.bind(n), n.onDrag = n.onDrag.bind(n), n.onDragStop = n.onDragStop.bind(n), n.getMaxSizesFromProps = n.getMaxSizesFromProps.bind(n), n;
			}
			return t.prototype.componentDidMount = function() {
				this.updateOffsetFromParent();
				var e = this.offsetFromParent, t = e.left, n = e.top, r = this.getDraggablePosition(), i = r.x, a = r.y;
				this.draggable.setState({
					x: i - t,
					y: a - n
				}), this.forceUpdate();
			}, t.prototype.getDraggablePosition = function() {
				var e = this.draggable.state;
				return {
					x: e.x,
					y: e.y
				};
			}, t.prototype.getParent = function() {
				return this.resizable && this.resizable.parentNode;
			}, t.prototype.getParentSize = function() {
				return this.resizable.getParentSize();
			}, t.prototype.getMaxSizesFromProps = function() {
				return {
					maxWidth: this.props.maxWidth === void 0 ? 2 ** 53 - 1 : this.props.maxWidth,
					maxHeight: this.props.maxHeight === void 0 ? 2 ** 53 - 1 : this.props.maxHeight
				};
			}, t.prototype.getSelfElement = function() {
				return this.resizable && this.resizable.resizable;
			}, t.prototype.getOffsetHeight = function(e) {
				var t = this.props.scale;
				switch (this.props.bounds) {
					case "window": return window.innerHeight / t;
					case "body": return document.body.offsetHeight / t;
					default: return e.offsetHeight;
				}
			}, t.prototype.getOffsetWidth = function(e) {
				var t = this.props.scale;
				switch (this.props.bounds) {
					case "window": return window.innerWidth / t;
					case "body": return document.body.offsetWidth / t;
					default: return e.offsetWidth;
				}
			}, t.prototype.onDragStart = function(e, t) {
				if (this.props.onDragStart && this.props.onDragStart(e, t), this.props.bounds) {
					var n = this.getParent(), r = this.props.scale, i;
					if (this.props.bounds === "parent") i = n;
					else if (this.props.bounds === "body") {
						var a = n.getBoundingClientRect(), o = a.left, s = a.top, c = document.body.getBoundingClientRect(), l = -(o - n.offsetLeft * r - c.left) / r, u = -(s - n.offsetTop * r - c.top) / r, d = (document.body.offsetWidth - this.resizable.size.width * r) / r + l, f = (document.body.offsetHeight - this.resizable.size.height * r) / r + u;
						return this.setState({ bounds: {
							top: u,
							right: d,
							bottom: f,
							left: l
						} });
					} else if (this.props.bounds === "window") {
						if (!this.resizable) return;
						var p = n.getBoundingClientRect(), m = p.left, h = p.top, g = -(m - n.offsetLeft * r) / r, _ = -(h - n.offsetTop * r) / r, d = (window.innerWidth - this.resizable.size.width * r) / r + g, f = (window.innerHeight - this.resizable.size.height * r) / r + _;
						return this.setState({ bounds: {
							top: _,
							right: d,
							bottom: f,
							left: g
						} });
					} else i = document.querySelector(this.props.bounds);
					if (i instanceof HTMLElement && n instanceof HTMLElement) {
						var v = i.getBoundingClientRect(), y = v.left, b = v.top, x = n.getBoundingClientRect(), S = x.left, C = x.top, w = (y - S) / r, T = b - C;
						if (this.resizable) {
							this.updateOffsetFromParent();
							var E = this.offsetFromParent;
							this.setState({ bounds: {
								top: T - E.top,
								right: w + (i.offsetWidth - this.resizable.size.width) - E.left / r,
								bottom: T + (i.offsetHeight - this.resizable.size.height) - E.top,
								left: w - E.left / r
							} });
						}
					}
				}
			}, t.prototype.onDrag = function(e, t) {
				if (this.props.onDrag) {
					var n = this.offsetFromParent;
					return this.props.onDrag(e, pi(pi({}, t), {
						x: t.x - n.left,
						y: t.y - n.top
					}));
				}
			}, t.prototype.onDragStop = function(e, t) {
				if (this.props.onDragStop) {
					var n = this.offsetFromParent, r = n.left, i = n.top;
					return this.props.onDragStop(e, pi(pi({}, t), {
						x: t.x + r,
						y: t.y + i
					}));
				}
			}, t.prototype.onResizeStart = function(e, t, n) {
				e.stopPropagation(), this.resizing = !0;
				var r = this.props.scale, i = this.offsetFromParent, a = this.getDraggablePosition();
				if (this.resizingPosition = {
					x: a.x + i.left,
					y: a.y + i.top
				}, this.setState({ original: a }), this.props.bounds) {
					var o = this.getParent(), s = void 0;
					s = this.props.bounds === "parent" ? o : this.props.bounds === "body" ? document.body : this.props.bounds === "window" ? window : document.querySelector(this.props.bounds);
					var c = this.getSelfElement();
					if (c instanceof Element && (s instanceof HTMLElement || s === window) && o instanceof HTMLElement) {
						var l = this.getMaxSizesFromProps(), u = l.maxWidth, d = l.maxHeight, f = this.getParentSize();
						if (u && typeof u == "string") {
							if (u.endsWith("%")) {
								var p = Number(u.replace("%", "")) / 100;
								u = f.width * p;
							} else u.endsWith("px") && (u = Number(u.replace("px", "")));
						}
						if (d && typeof d == "string") {
							if (d.endsWith("%")) {
								var p = Number(d.replace("%", "")) / 100;
								d = f.width * p;
							} else d.endsWith("px") && (d = Number(d.replace("px", "")));
						}
						var m = c.getBoundingClientRect(), h = m.left, g = m.top, _ = this.props.bounds === "window" ? {
							left: 0,
							top: 0
						} : s.getBoundingClientRect(), v = _.left, y = _.top, b = this.getOffsetWidth(s), x = this.getOffsetHeight(s), S = t.toLowerCase().endsWith("left"), C = t.toLowerCase().endsWith("right"), w = t.startsWith("top"), T = t.startsWith("bottom");
						if (S && this.resizable) {
							var E = (h - v) / r + this.resizable.size.width;
							this.setState({ maxWidth: E > Number(u) ? u : E });
						}
						if (C || this.props.lockAspectRatio && !S) {
							var E = b + (v - h) / r;
							this.setState({ maxWidth: E > Number(u) ? u : E });
						}
						if (w && this.resizable) {
							var E = (g - y) / r + this.resizable.size.height;
							this.setState({ maxHeight: E > Number(d) ? d : E });
						}
						if (T || this.props.lockAspectRatio && !w) {
							var E = x + (y - g) / r;
							this.setState({ maxHeight: E > Number(d) ? d : E });
						}
					}
				} else this.setState({
					maxWidth: this.props.maxWidth,
					maxHeight: this.props.maxHeight
				});
				this.props.onResizeStart && this.props.onResizeStart(e, t, n);
			}, t.prototype.onResize = function(e, t, n, r) {
				var i = {
					x: this.state.original.x,
					y: this.state.original.y
				}, a = -r.width, o = -r.height;
				[
					"top",
					"left",
					"topLeft",
					"bottomLeft",
					"topRight"
				].indexOf(t) !== -1 && (t === "bottomLeft" ? i.x += a : (t === "topRight" || (i.x += a), i.y += o)), (i.x !== this.draggable.state.x || i.y !== this.draggable.state.y) && this.draggable.setState(i), this.updateOffsetFromParent();
				var s = this.offsetFromParent, c = this.getDraggablePosition().x + s.left, l = this.getDraggablePosition().y + s.top;
				this.resizingPosition = {
					x: c,
					y: l
				}, this.props.onResize && this.props.onResize(e, t, n, r, {
					x: c,
					y: l
				});
			}, t.prototype.onResizeStop = function(e, t, n, r) {
				this.resizing = !1;
				var i = this.getMaxSizesFromProps(), a = i.maxWidth, o = i.maxHeight;
				this.setState({
					maxWidth: a,
					maxHeight: o
				}), this.props.onResizeStop && this.props.onResizeStop(e, t, n, r, this.resizingPosition);
			}, t.prototype.updateSize = function(e) {
				this.resizable && this.resizable.updateSize({
					width: e.width,
					height: e.height
				});
			}, t.prototype.updatePosition = function(e) {
				this.draggable.setState(e);
			}, t.prototype.updateOffsetFromParent = function() {
				var e = this.props.scale, t = this.getParent(), n = this.getSelfElement();
				if (!t || n === null) return {
					top: 0,
					left: 0
				};
				var r = t.getBoundingClientRect(), i = r.left, a = r.top, o = n.getBoundingClientRect(), s = this.getDraggablePosition();
				this.offsetFromParent = {
					left: o.left - i - s.x * e,
					top: o.top - a - s.y * e
				};
			}, t.prototype.render = function() {
				var e = this.props, t = e.disableDragging, n = e.style, r = e.dragHandleClassName, i = e.position, a = e.onMouseDown, o = e.onMouseUp, s = e.dragAxis, c = e.dragGrid, l = e.bounds, u = e.enableUserSelectHack, d = e.cancel, f = e.children;
				e.onResizeStart, e.onResize, e.onResizeStop, e.onDragStart, e.onDrag, e.onDragStop;
				var p = e.resizeHandleStyles, m = e.resizeHandleClasses, h = e.resizeHandleComponent, g = e.enableResizing, _ = e.resizeGrid, v = e.resizeHandleWrapperClass, b = e.resizeHandleWrapperStyle, x = e.scale, S = e.allowAnyClick, C = mi(e, "disableDragging.style.dragHandleClassName.position.onMouseDown.onMouseUp.dragAxis.dragGrid.bounds.enableUserSelectHack.cancel.children.onResizeStart.onResize.onResizeStop.onDragStart.onDrag.onDragStop.resizeHandleStyles.resizeHandleClasses.resizeHandleComponent.enableResizing.resizeGrid.resizeHandleWrapperClass.resizeHandleWrapperStyle.scale.allowAnyClick".split(".")), w = this.props.default ? pi({}, this.props.default) : void 0;
				delete C.default;
				var T = t || r ? { cursor: "auto" } : { cursor: "move" }, E = pi(pi(pi({}, gi), T), n), D = this.offsetFromParent, O = D.left, ee = D.top, k;
				i && (k = {
					x: i.x - O,
					y: i.y - ee
				});
				var A = this.resizing ? void 0 : k, j = this.resizing ? "both" : s;
				return (0, y.createElement)(hi, {
					ref: this.refDraggable,
					handle: r ? "." + r : void 0,
					defaultPosition: w,
					onMouseDown: a,
					onMouseUp: o,
					onStart: this.onDragStart,
					onDrag: this.onDrag,
					onStop: this.onDragStop,
					axis: j,
					disabled: t,
					grid: c,
					bounds: l ? this.state.bounds : void 0,
					position: A,
					enableUserSelectHack: u,
					cancel: d,
					scale: x,
					allowAnyClick: S,
					nodeRef: this.resizableElement
				}, (0, y.createElement)(ui, pi({}, C, {
					ref: this.refResizable,
					defaultSize: w,
					size: this.props.size,
					enable: typeof g == "boolean" ? _i(g) : g,
					onResizeStart: this.onResizeStart,
					onResize: this.onResize,
					onResizeStop: this.onResizeStop,
					style: E,
					minWidth: this.props.minWidth,
					minHeight: this.props.minHeight,
					maxWidth: this.resizing ? this.state.maxWidth : this.props.maxWidth,
					maxHeight: this.resizing ? this.state.maxHeight : this.props.maxHeight,
					grid: _,
					handleWrapperClass: v,
					handleWrapperStyle: b,
					lockAspectRatio: this.props.lockAspectRatio,
					lockAspectRatioExtraWidth: this.props.lockAspectRatioExtraWidth,
					lockAspectRatioExtraHeight: this.props.lockAspectRatioExtraHeight,
					handleStyles: p,
					handleClasses: m,
					handleComponent: h,
					scale: this.props.scale
				}), f));
			}, t.defaultProps = {
				maxWidth: 2 ** 53 - 1,
				maxHeight: 2 ** 53 - 1,
				scale: 1,
				onResizeStart: function() {},
				onResize: function() {},
				onResizeStop: function() {},
				onDragStart: function() {},
				onDrag: function() {},
				onDragStop: function() {}
			}, t;
		}(y.PureComponent), yi = class extends y.Component {
			constructor(e) {
				super(e), this.handleTabClick = this.handleTabClick.bind(this);
			}
			handleTabClick(e) {
				this.setState({ activeTab: e }, () => {
					this.props.onClick(e);
				});
			}
			render() {
				return y.createElement("div", { className: "ck-inspector-horizontal-nav" }, this.props.definitions.map((e) => y.createElement(bi, {
					key: e,
					label: e,
					isActive: this.props.activeTab === e,
					onClick: () => this.handleTabClick(e)
				})));
			}
		}, bi = class extends y.Component {
			render() {
				return y.createElement("button", {
					className: ["ck-inspector-horizontal-nav__item", this.props.isActive ? " ck-inspector-horizontal-nav__item_active" : ""].join(" "),
					key: this.props.label,
					onClick: this.props.onClick,
					type: "button"
				}, this.props.label);
			}
		}, xi = class extends y.Component {
			render() {
				let e = Array.isArray(this.props.children) ? this.props.children : [this.props.children];
				return y.createElement("div", { className: "ck-inspector-navbox" }, e.length > 1 ? y.createElement("div", { className: "ck-inspector-navbox__navigation" }, e[0]) : "", y.createElement("div", { className: "ck-inspector-navbox__content" }, e[e.length - 1]));
			}
		}, Si = class extends y.Component {
			constructor(e) {
				super(e), this.handleTabClick = this.handleTabClick.bind(this);
			}
			handleTabClick(e) {
				this.props.onTabChange(e);
			}
			render() {
				let e = Array.isArray(this.props.children) ? this.props.children : [this.props.children];
				return y.createElement(xi, null, [
					this.props.contentBefore,
					y.createElement(yi, {
						key: "navigation",
						definitions: e.map((e) => e.props.label),
						activeTab: this.props.activeTab,
						onClick: this.handleTabClick
					}),
					this.props.contentAfter
				], e.filter((e) => e.props.label === this.props.activeTab));
			}
		};
		function Ci(e, t) {
			return e === t || Number.isNaN(e) && Number.isNaN(t);
		}
		function wi(e) {
			return Object.getOwnPropertySymbols(e).filter((t) => Object.prototype.propertyIsEnumerable.call(e, t));
		}
		function Ti(e) {
			return e == null ? e === void 0 ? "[object Undefined]" : "[object Null]" : Object.prototype.toString.call(e);
		}
		var Ei = "[object RegExp]", Di = "[object String]", Oi = "[object Number]", ki = "[object Boolean]", Ai = "[object Symbol]", ji = "[object Date]", Mi = "[object Map]", Ni = "[object Set]", Pi = "[object Array]", Fi = "[object Function]", Ii = "[object ArrayBuffer]", Li = "[object Object]", Ri = "[object Error]", H = "[object DataView]", U = "[object Uint8Array]", zi = "[object Uint8ClampedArray]", Bi = "[object Uint16Array]", Vi = "[object Uint32Array]", Hi = "[object BigUint64Array]", Ui = "[object Int8Array]", Wi = "[object Int16Array]", Gi = "[object Int32Array]", Ki = "[object BigInt64Array]", qi = "[object Float32Array]", Ji = "[object Float64Array]";
		function Yi(e) {
			if (!e || typeof e != "object") return !1;
			let t = Object.getPrototypeOf(e);
			return t === null || t === Object.prototype || Object.getPrototypeOf(t) === null ? Object.prototype.toString.call(e) === "[object Object]" : !1;
		}
		function Xi(e, t, n) {
			return Zi(e, t, void 0, void 0, void 0, void 0, n);
		}
		function Zi(e, t, n, r, i, a, o) {
			let s = o(e, t, n, r, i, a);
			if (s !== void 0) return s;
			if (typeof e == typeof t) switch (typeof e) {
				case "bigint":
				case "string":
				case "boolean":
				case "symbol":
				case "undefined": return e === t;
				case "number": return e === t || Object.is(e, t);
				case "function": return e === t;
				case "object": return Qi(e, t, a, o);
			}
			return Qi(e, t, a, o);
		}
		function Qi(e, t, n, r) {
			if (Object.is(e, t)) return !0;
			let i = Ti(e), a = Ti(t);
			if (i === "[object Arguments]" && (i = Li), a === "[object Arguments]" && (a = Li), i !== a) return !1;
			switch (i) {
				case Di: return e.toString() === t.toString();
				case Oi: return Ci(e.valueOf(), t.valueOf());
				case ki:
				case ji:
				case Ai: return Object.is(e.valueOf(), t.valueOf());
				case Ei: return e.source === t.source && e.flags === t.flags;
				case Fi: return e === t;
			}
			n ??= /* @__PURE__ */ new Map();
			let o = n.get(e), s = n.get(t);
			if (o != null && s != null) return o === t;
			n.set(e, t), n.set(t, e);
			try {
				switch (i) {
					case Mi:
						if (e.size !== t.size) return !1;
						for (let [i, a] of e.entries()) if (!t.has(i) || !Zi(a, t.get(i), i, e, t, n, r)) return !1;
						return !0;
					case Ni: {
						if (e.size !== t.size) return !1;
						let i = Array.from(e.values()), a = Array.from(t.values());
						for (let o = 0; o < i.length; o++) {
							let s = i[o], c = a.findIndex((i) => Zi(s, i, void 0, e, t, n, r));
							if (c === -1) return !1;
							a.splice(c, 1);
						}
						return !0;
					}
					case Pi:
					case U:
					case zi:
					case Bi:
					case Vi:
					case Hi:
					case Ui:
					case Wi:
					case Gi:
					case Ki:
					case qi:
					case Ji:
						if (typeof Buffer < "u" && Buffer.isBuffer(e) !== Buffer.isBuffer(t) || e.length !== t.length) return !1;
						for (let i = 0; i < e.length; i++) if (!Zi(e[i], t[i], i, e, t, n, r)) return !1;
						return !0;
					case Ii: return e.byteLength === t.byteLength && Qi(new Uint8Array(e), new Uint8Array(t), n, r);
					case H: return e.byteLength !== t.byteLength || e.byteOffset !== t.byteOffset ? !1 : Qi(new Uint8Array(e), new Uint8Array(t), n, r);
					case Ri: return e.name === t.name && e.message === t.message;
					case Li: {
						if (!(Qi(e.constructor, t.constructor, n, r) || Yi(e) && Yi(t))) return !1;
						let i = [...Object.keys(e), ...wi(e)], a = [...Object.keys(t), ...wi(t)];
						if (i.length !== a.length) return !1;
						for (let a = 0; a < i.length; a++) {
							let o = i[a], s = e[o];
							if (!Object.hasOwn(t, o)) return !1;
							let c = t[o];
							if (!Zi(s, c, o, e, t, n, r)) return !1;
						}
						return !0;
					}
					default: return !1;
				}
			} finally {
				n.delete(e), n.delete(t);
			}
		}
		function $i() {}
		function ea(e, t) {
			return Xi(e, t, $i);
		}
		var ta = class extends y.Component {
			render() {
				return [y.createElement("label", {
					htmlFor: this.props.id,
					key: "label"
				}, this.props.label, ":"), y.createElement("select", {
					id: this.props.id,
					value: this.props.value,
					onChange: this.props.onChange,
					key: "select"
				}, this.props.options.map((e) => y.createElement("option", {
					value: e,
					key: e
				}, e)))];
			}
			shouldComponentUpdate(e) {
				return !ea(this.props, e);
			}
		}, W = class extends y.PureComponent {
			render() {
				let e = [
					"ck-inspector-button",
					this.props.className || "",
					this.props.isOn ? "ck-inspector-button_on" : "",
					this.props.isEnabled === !1 ? "ck-inspector-button_disabled" : ""
				].filter((e) => e).join(" ");
				return y.createElement("button", {
					className: e,
					type: "button",
					onClick: this.props.isEnabled === !1 ? () => {} : this.props.onClick,
					title: this.props.title || this.props.text
				}, y.createElement("span", null, this.props.text), this.props.icon);
			}
		}, na = class extends y.Component {
			render() {
				return y.createElement("div", { className: [
					"ck-inspector-pane",
					this.props.splitVertically ? "ck-inspector-pane_vsplit" : "",
					this.props.isEmpty ? "ck-inspector-pane_empty" : ""
				].join(" ") }, this.props.children);
			}
		}, ra = y.createContext({
			document: typeof document > "u" ? null : document,
			window: typeof window > "u" ? null : window
		}), ia = 200, aa = { position: "relative" }, oa = class extends y.Component {
			static contextType = ra;
			get maxSidePaneWidth() {
				let e = this.context.window;
				return Math.min(e.innerWidth - 400, e.innerWidth * .8);
			}
			render() {
				return y.createElement("div", { className: "ck-inspector-side-pane" }, y.createElement(vi, {
					enableResizing: { left: !0 },
					disableDragging: !0,
					minWidth: ia,
					maxWidth: this.maxSidePaneWidth,
					style: aa,
					position: {
						x: "100%",
						y: "100%"
					},
					size: {
						width: this.props.sidePaneWidth,
						height: "100%"
					},
					onResizeStop: (e, t, n) => this.props.setSidePaneWidth(n.style.width)
				}, this.props.children));
			}
		}, sa = I(({ ui: { sidePaneWidth: e } }) => ({ sidePaneWidth: e }), { setSidePaneWidth: gt })(oa), ca = class extends y.Component {
			constructor(e) {
				super(e), this.handleClick = this.handleClick.bind(this);
			}
			handleClick(e) {
				this.globalTreeProps.onClick(e, this.definition.node);
			}
			getChildren() {
				return this.definition.children.map((e, t) => ha(e, t, this.props.globalTreeProps));
			}
			get definition() {
				return this.props.definition;
			}
			get globalTreeProps() {
				return this.props.globalTreeProps || {};
			}
			get isActive() {
				return this.definition.node === this.globalTreeProps.activeNode;
			}
			shouldComponentUpdate(e) {
				return !ea(this.props, e);
			}
		}, la = 500, ua = class extends y.PureComponent {
			render() {
				let e, t = Rt(this.props.value, la);
				return this.props.dontRenderValue || (e = y.createElement("span", { className: "ck-inspector-tree-node__attribute__value" }, t)), y.createElement("span", { className: "ck-inspector-tree-node__attribute" }, y.createElement("span", {
					className: "ck-inspector-tree-node__attribute__name",
					title: t
				}, this.props.name), e);
			}
		}, da = class extends y.Component {
			render() {
				let e = this.props.definition, t = {
					className: [
						"ck-inspector-tree__position",
						e.type === "selection" ? "ck-inspector-tree__position_selection" : "",
						e.type === "marker" ? "ck-inspector-tree__position_marker" : "",
						e.isEnd ? "ck-inspector-tree__position_end" : ""
					].join(" "),
					style: {}
				};
				return e.presentation && e.presentation.color && (t.style["--ck-inspector-color-tree-position"] = e.presentation.color), e.type === "marker" && (t["data-marker-name"] = e.name), y.createElement("span", t, "​");
			}
			shouldComponentUpdate(e) {
				return !ea(this.props, e);
			}
		}, fa = class extends ca {
			render() {
				let e = this.definition, t = e.presentation, n = t && t.isEmpty, r = t && t.cssClass, i = this.getChildren(), a = [
					"ck-inspector-code",
					"ck-inspector-tree-node",
					this.isActive ? "ck-inspector-tree-node_active" : "",
					n ? "ck-inspector-tree-node_empty" : "",
					r
				], o = [], s = [];
				e.positionsBefore && e.positionsBefore.forEach((e, t) => {
					o.push(y.createElement(da, {
						key: "position-before:" + t,
						definition: e
					}));
				}), e.positionsAfter && e.positionsAfter.forEach((e, t) => {
					s.push(y.createElement(da, {
						key: "position-after:" + t,
						definition: e
					}));
				}), e.positions && e.positions.forEach((e, t) => {
					i.push(y.createElement(da, {
						key: "position" + t,
						definition: e
					}));
				});
				let c = e.name;
				return this.globalTreeProps.showElementTypes && (c = e.elementType + ":" + c), y.createElement("div", {
					className: a.join(" "),
					onClick: this.handleClick
				}, o, y.createElement("span", { className: "ck-inspector-tree-node__name" }, y.createElement("span", { className: "ck-inspector-tree-node__name__bracket ck-inspector-tree-node__name__bracket_open" }), c, this.getAttributes(), n ? "" : y.createElement("span", { className: "ck-inspector-tree-node__name__bracket ck-inspector-tree-node__name__bracket_close" })), y.createElement("div", { className: "ck-inspector-tree-node__content" }, i), n ? "" : y.createElement("span", { className: "ck-inspector-tree-node__name ck-inspector-tree-node__name_close" }, y.createElement("span", { className: "ck-inspector-tree-node__name__bracket ck-inspector-tree-node__name__bracket_open" }), "/", c, y.createElement("span", { className: "ck-inspector-tree-node__name__bracket ck-inspector-tree-node__name__bracket_close" }), s));
			}
			getAttributes() {
				let e = [], t = this.definition;
				for (let [n, r] of t.attributes) e.push(y.createElement(ua, {
					key: n,
					name: n,
					value: r
				}));
				return e;
			}
			shouldComponentUpdate(e) {
				return !ea(this.props, e);
			}
		}, pa = class extends ca {
			render() {
				let e = this.definition, t = ["ck-inspector-tree-text", this.isActive ? "ck-inspector-tree-node_active" : ""].join(" "), n = this.definition.text;
				e.positions && e.positions.length && (n = n.split(""), Array.from(e.positions).sort((e, t) => e.offset < t.offset ? -1 : e.offset === t.offset ? 0 : 1).reverse().forEach((t, r) => {
					n.splice(t.offset - e.startOffset, 0, y.createElement(da, {
						key: "position" + r,
						definition: t
					}));
				}));
				let r = [n];
				return e.positionsBefore && e.positionsBefore.length && e.positionsBefore.forEach((e, t) => {
					r.unshift(y.createElement(da, {
						key: "position-before:" + t,
						definition: e
					}));
				}), e.positionsAfter && e.positionsAfter.length && e.positionsAfter.forEach((e, t) => {
					r.push(y.createElement(da, {
						key: "position-after:" + t,
						definition: e
					}));
				}), y.createElement("span", {
					className: t,
					onClick: this.handleClick
				}, y.createElement("span", { className: "ck-inspector-tree-node__content" }, this.globalTreeProps.showCompactText ? "" : this.getAttributes(), this.globalTreeProps.showCompactText ? "" : "\"", r, this.globalTreeProps.showCompactText ? "" : "\""));
			}
			getAttributes() {
				let e = [], t = this.definition, n = t.presentation, r = n && n.dontRenderAttributeValue;
				for (let [n, i] of t.attributes) e.push(y.createElement(ua, {
					key: n,
					name: n,
					value: i,
					dontRenderValue: r
				}));
				return y.createElement("span", { className: "ck-inspector-tree-text__attributes" }, e);
			}
			shouldComponentUpdate(e) {
				return !ea(this.props, e);
			}
		}, ma = class extends y.Component {
			render() {
				return y.createElement("span", {
					className: "ck-inspector-tree-comment",
					dangerouslySetInnerHTML: { __html: this.props.definition.text }
				});
			}
		};
		function ha(e, t, n) {
			if (e.type === "element") return y.createElement(fa, {
				key: t,
				definition: e,
				globalTreeProps: n
			});
			if (e.type === "text") return y.createElement(pa, {
				key: t,
				definition: e,
				globalTreeProps: n
			});
			if (e.type === "comment") return y.createElement(ma, {
				key: t,
				definition: e
			});
		}
		var ga = class extends y.Component {
			render() {
				let e;
				return e = this.props.definition ? this.props.definition.map((e, t) => ha(e, t, {
					onClick: this.props.onClick,
					showCompactText: this.props.showCompactText,
					showElementTypes: this.props.showElementTypes,
					activeNode: this.props.activeNode
				})) : "Nothing to show.", y.createElement("div", { className: [
					"ck-inspector-tree",
					...this.props.className || [],
					this.props.textDirection ? "ck-inspector-tree_text-direction_" + this.props.textDirection : "",
					this.props.showCompactText ? "ck-inspector-tree_compact-text" : ""
				].join(" ") }, e);
			}
		}, _a = class extends y.PureComponent {
			render() {
				return [y.createElement("input", {
					type: "checkbox",
					className: "ck-inspector-checkbox",
					id: this.props.id,
					key: "input",
					checked: this.props.isChecked,
					onChange: this.props.onChange
				}), y.createElement("label", {
					htmlFor: this.props.id,
					key: "label"
				}, this.props.label)];
			}
		}, va = class extends y.Component {
			constructor(e) {
				super(e), this.handleTreeClick = this.handleTreeClick.bind(this), this.handleRootChange = this.handleRootChange.bind(this);
			}
			handleTreeClick(e, t) {
				e.persist(), e.stopPropagation(), this.props.setModelCurrentNode(t), e.detail === 2 && this.props.setModelActiveTab("Inspect");
			}
			handleRootChange(e) {
				this.props.setModelCurrentRootName(e.target.value);
			}
			render() {
				let e = this.props.editors.get(this.props.currentEditorName);
				return y.createElement(xi, null, [
					y.createElement("div", {
						className: "ck-inspector-tree__config",
						key: "root-cfg"
					}, y.createElement(ta, {
						id: "view-root-select",
						label: "Root",
						value: this.props.currentRootName,
						options: Ht(e).map((e) => e.rootName),
						onChange: this.handleRootChange
					})),
					y.createElement("span", {
						className: "ck-inspector-separator",
						key: "separator"
					}),
					y.createElement("div", {
						className: "ck-inspector-tree__config",
						key: "text-cfg"
					}, y.createElement(_a, {
						label: "Compact text",
						id: "model-compact-text",
						isChecked: this.props.showCompactText,
						onChange: this.props.toggleModelShowCompactText
					}), y.createElement(_a, {
						label: "Show markers",
						id: "model-show-markers",
						isChecked: this.props.showMarkers,
						onChange: this.props.toggleModelShowMarkers
					}))
				], y.createElement(ga, {
					className: [this.props.showMarkers ? "" : "ck-inspector-model-tree__hide-markers"],
					definition: this.props.treeDefinition,
					textDirection: e.locale.contentLanguageDirection,
					onClick: this.handleTreeClick,
					showCompactText: this.props.showCompactText,
					activeNode: this.props.currentNode
				}));
			}
		}, ya = I(({ editors: e, currentEditorName: t, model: { treeDefinition: n, currentRootName: r, currentNode: i, ui: { showMarkers: a, showCompactText: o } } }) => ({
			treeDefinition: n,
			editors: e,
			currentEditorName: t,
			currentRootName: r,
			currentNode: i,
			showMarkers: a,
			showCompactText: o
		}), {
			toggleModelShowCompactText: at,
			setModelCurrentRootName: tt,
			toggleModelShowMarkers: it,
			setModelCurrentNode: nt,
			setModelActiveTab: rt
		})(va), ba = 2e3, xa = class e extends y.Component {
			render() {
				let t = this.props.presentation && this.props.presentation.expandCollapsibles, n = [];
				for (let r in this.props.itemDefinitions) {
					let i = this.props.itemDefinitions[r], { subProperties: a, presentation: o = {} } = i, s = a && Object.keys(a).length, c = Rt(String(i.value), ba), l = [y.createElement(Sa, {
						key: `${this.props.name}-${r}-name`,
						name: r,
						listUid: this.props.name,
						canCollapse: s,
						colorBox: o.colorBox,
						expandCollapsibles: t,
						onClick: this.props.onPropertyTitleClick,
						title: i.title
					}), y.createElement("dd", { key: `${this.props.name}-${r}-value` }, y.createElement("input", {
						id: `${this.props.name}-${r}-value-input`,
						type: "text",
						value: c,
						readOnly: !0
					}))];
					s && l.push(y.createElement(e, {
						name: `${this.props.name}-${r}`,
						key: `${this.props.name}-${r}`,
						itemDefinitions: a,
						presentation: this.props.presentation
					})), n.push(l);
				}
				return y.createElement("dl", { className: "ck-inspector-property-list ck-inspector-code" }, n);
			}
			shouldComponentUpdate(e) {
				return !ea(this.props, e);
			}
		}, Sa = class extends y.PureComponent {
			constructor(e) {
				super(e), this.state = { isCollapsed: !this.props.expandCollapsibles }, this.handleCollapsedChange = this.handleCollapsedChange.bind(this);
			}
			handleCollapsedChange() {
				this.setState({ isCollapsed: !this.state.isCollapsed });
			}
			render() {
				let e = ["ck-inspector-property-list__title"], t, n;
				return this.props.canCollapse && (e.push("ck-inspector-property-list__title_collapsible"), e.push("ck-inspector-property-list__title_" + (this.state.isCollapsed ? "collapsed" : "expanded")), t = y.createElement("button", {
					type: "button",
					onClick: this.handleCollapsedChange
				}, "Toggle")), this.props.colorBox && (n = y.createElement("span", {
					className: "ck-inspector-property-list__title__color-box",
					style: { background: this.props.colorBox }
				})), this.props.onClick && e.push("ck-inspector-property-list__title_clickable"), y.createElement("dt", { className: e.join(" ").trim() }, t, n, y.createElement("label", {
					htmlFor: `${this.props.listUid}-${this.props.name}-value-input`,
					onClick: this.props.onClick ? () => this.props.onClick(this.props.name) : null,
					title: this.props.title
				}, this.props.name), ":");
			}
		}, Ca = class extends y.PureComponent {
			render() {
				let e = [];
				for (let t of this.props.lists) Object.keys(t.itemDefinitions).length && e.push(y.createElement("hr", { key: `${t.name}-separator` }), y.createElement("h3", { key: `${t.name}-header` }, y.createElement("a", {
					href: t.url,
					target: "_blank",
					rel: "noopener noreferrer"
				}, t.name), t.buttons && t.buttons.map((e, t) => y.createElement(W, {
					key: "button" + t,
					...e
				}))), y.createElement(xa, {
					key: `${t.name}-list`,
					name: t.name,
					itemDefinitions: t.itemDefinitions,
					presentation: t.presentation,
					onPropertyTitleClick: t.onPropertyTitleClick
				}));
				return y.createElement("div", { className: "ck-inspector__object-inspector" }, y.createElement("h2", { className: "ck-inspector-code" }, this.props.header), e);
			}
		}, wa = s(((e) => {
			var t = m(), n = 60103;
			if (e.Fragment = 60107, typeof Symbol == "function" && Symbol.for) {
				var r = Symbol.for;
				n = r("react.element"), e.Fragment = r("react.fragment");
			}
			var i = t.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner, a = Object.prototype.hasOwnProperty, o = {
				key: !0,
				ref: !0,
				__self: !0,
				__source: !0
			};
			function s(e, t, r) {
				var s, c = {}, l = null, u = null;
				for (s in r !== void 0 && (l = "" + r), t.key !== void 0 && (l = "" + t.key), t.ref !== void 0 && (u = t.ref), t) a.call(t, s) && !o.hasOwnProperty(s) && (c[s] = t[s]);
				if (e && e.defaultProps) for (s in t = e.defaultProps, t) c[s] === void 0 && (c[s] = t[s]);
				return {
					$$typeof: n,
					type: e,
					key: l,
					ref: u,
					props: c,
					_owner: i.current
				};
			}
			e.jsx = s, e.jsxs = s;
		})), G = s(((e, t) => {
			t.exports = wa();
		}))(), Ta = (e) => (0, G.jsx)("svg", {
			viewBox: "0 0 19 19",
			xmlns: "http://www.w3.org/2000/svg",
			...e,
			children: (0, G.jsx)("path", { d: "M17 15.75a.75.75 0 0 1 .102 1.493L17 17.25H9a.75.75 0 0 1-.102-1.493L9 15.75h8ZM2.156 2.947l.095.058 7.58 5.401a.75.75 0 0 1 .084 1.152l-.083.069-7.58 5.425a.75.75 0 0 1-.958-1.148l.086-.071 6.724-4.815-6.723-4.792a.75.75 0 0 1-.233-.95l.057-.096a.75.75 0 0 1 .951-.233Z" })
		}), Ea = (e) => (0, G.jsx)("svg", {
			fill: "none",
			xmlns: "http://www.w3.org/2000/svg",
			viewBox: "0 0 19 19",
			...e,
			children: (0, G.jsx)("path", {
				fillRule: "evenodd",
				clipRule: "evenodd",
				d: "M6 1a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-2v2h5a1 1 0 0 1 1 1v3h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-3a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1v-2.5a.5.5 0 0 0-.5-.5H10v3h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1v-3H4.5a.5.5 0 0 0-.5.5V13h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1v-3a1 1 0 0 1 1-1h5V7H7a1 1 0 0 1-1-1V1Zm1.5 4.5v-4h4v4h-4Zm-5 11v-2h2v2h-2Zm6-2v2h2v-2h-2Zm6 2v-2h2v2h-2Z",
				fill: "#000"
			})
		}), Da = class extends y.Component {
			constructor(e) {
				super(e), this.handleNodeLogButtonClick = this.handleNodeLogButtonClick.bind(this), this.handleNodeSchemaButtonClick = this.handleNodeSchemaButtonClick.bind(this);
			}
			handleNodeLogButtonClick() {
				L.log(this.props.currentNodeDefinition.editorNode);
			}
			handleNodeSchemaButtonClick() {
				let e = this.props.editors.get(this.props.currentEditorName).model.schema.getDefinition(this.props.currentNodeDefinition.editorNode);
				this.props.setActiveTab("Schema"), this.props.setSchemaCurrentDefinitionName(e.name);
			}
			render() {
				let e = this.props.currentNodeDefinition;
				return e ? y.createElement(Ca, {
					header: [
						y.createElement("span", { key: "link" }, y.createElement("a", {
							href: e.url,
							target: "_blank",
							rel: "noopener noreferrer"
						}, y.createElement("b", null, e.type)), ":", e.type === "Text" ? y.createElement("em", null, e.name) : e.name),
						y.createElement(W, {
							key: "log",
							icon: y.createElement(Ta, null),
							text: "Log in console",
							onClick: this.handleNodeLogButtonClick
						}),
						y.createElement(W, {
							key: "schema",
							icon: y.createElement(Ea, null),
							text: "Show in schema",
							onClick: this.handleNodeSchemaButtonClick
						})
					],
					lists: [{
						name: "Attributes",
						url: e.url,
						itemDefinitions: e.attributes
					}, {
						name: "Properties",
						url: e.url,
						itemDefinitions: e.properties
					}]
				}) : y.createElement(na, { isEmpty: "true" }, y.createElement("p", null, "Select a node in the tree to inspect"));
			}
		}, Oa = I(({ editors: e, currentEditorName: t, model: { currentNodeDefinition: n } }) => ({
			editors: e,
			currentEditorName: t,
			currentNodeDefinition: n
		}), {
			setActiveTab: yt,
			setSchemaCurrentDefinitionName: mr
		})(Da), ka = (e) => (0, G.jsx)("svg", {
			viewBox: "0 0 19 19",
			xmlns: "http://www.w3.org/2000/svg",
			...e,
			children: (0, G.jsx)("path", { d: "M9.5 4.5c1.85 0 3.667.561 5.199 1.519C16.363 7.059 17.5 8.4 17.5 9.5s-1.137 2.441-2.801 3.481c-1.532.958-3.35 1.519-5.199 1.519-1.85 0-3.667-.561-5.199-1.519C2.637 11.941 1.5 10.6 1.5 9.5s1.137-2.441 2.801-3.481C5.833 5.06 7.651 4.5 9.5 4.5Zm0 1a4 4 0 1 1-.2.005l.2-.005c-1.655 0-3.29.505-4.669 1.367C3.431 7.742 2.5 8.84 2.5 9.5c0 .66.931 1.758 2.331 2.633C6.21 12.995 7.845 13.5 9.5 13.5c1.655 0 3.29-.505 4.669-1.367 1.4-.875 2.331-1.974 2.331-2.633 0-.66-.931-1.758-2.331-2.633C12.79 6.005 11.155 5.5 9.5 5.5ZM8 6.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z" })
		}), K = "https://ckeditor.com/docs/ckeditor5/latest/api/module_engine_model_selection-Selection.html", Aa = class extends y.Component {
			static contextType = ra;
			constructor(e) {
				super(e), this.handleSelectionLogButtonClick = this.handleSelectionLogButtonClick.bind(this), this.handleScrollToSelectionButtonClick = this.handleScrollToSelectionButtonClick.bind(this);
			}
			handleSelectionLogButtonClick() {
				let e = this.props.editor;
				L.log(e.model.document.selection);
			}
			handleScrollToSelectionButtonClick() {
				let e = this.context.document.querySelector(".ck-inspector-tree__position.ck-inspector-tree__position_selection");
				e && e.scrollIntoView({
					behavior: "smooth",
					block: "center"
				});
			}
			render() {
				let e = this.props.editor, t = this.props.info;
				return y.createElement(Ca, {
					header: [
						y.createElement("span", { key: "link" }, y.createElement("a", {
							href: K,
							target: "_blank",
							rel: "noopener noreferrer"
						}, y.createElement("b", null, "Selection"))),
						y.createElement(W, {
							key: "log",
							icon: y.createElement(Ta, null),
							text: "Log in console",
							onClick: this.handleSelectionLogButtonClick
						}),
						y.createElement(W, {
							key: "scroll",
							icon: y.createElement(ka, null),
							text: "Scroll to selection",
							onClick: this.handleScrollToSelectionButtonClick
						})
					],
					lists: [
						{
							name: "Attributes",
							url: `${K}#function-getAttributes`,
							itemDefinitions: t.attributes
						},
						{
							name: "Properties",
							url: `${K}`,
							itemDefinitions: t.properties
						},
						{
							name: "Anchor",
							url: `${K}#member-anchor`,
							buttons: [{
								icon: y.createElement(Ta, null),
								text: "Log in console",
								onClick: () => L.log(e.model.document.selection.anchor)
							}],
							itemDefinitions: t.anchor
						},
						{
							name: "Focus",
							url: `${K}#member-focus`,
							buttons: [{
								icon: y.createElement(Ta, null),
								text: "Log in console",
								onClick: () => L.log(e.model.document.selection.focus)
							}],
							itemDefinitions: t.focus
						},
						{
							name: "Ranges",
							url: `${K}#function-getRanges`,
							buttons: [{
								icon: y.createElement(Ta, null),
								text: "Log in console",
								onClick: () => L.log(...e.model.document.selection.getRanges())
							}],
							itemDefinitions: t.ranges,
							presentation: { expandCollapsibles: !0 }
						}
					]
				});
			}
		}, ja = I(({ editors: e, currentEditorName: t, model: { ranges: n } }) => {
			let r = e.get(t);
			return {
				editor: r,
				currentEditorName: t,
				info: Na(r, n)
			};
		}, {})(Aa);
		function Ma({ path: e, stickiness: t, index: n, isAtEnd: r, isAtStart: i, offset: a, textNode: o }) {
			return {
				path: { value: e },
				stickiness: { value: t },
				index: { value: n },
				isAtEnd: { value: r },
				isAtStart: { value: i },
				offset: { value: a },
				textNode: { value: o }
			};
		}
		function Na(e, t) {
			let n = e.model.document.selection, r = n.anchor, i = n.focus, a = {
				properties: {
					isCollapsed: { value: n.isCollapsed },
					isBackward: { value: n.isBackward },
					isGravityOverridden: { value: n.isGravityOverridden },
					rangeCount: { value: n.rangeCount }
				},
				attributes: {},
				anchor: Ma(wt(r)),
				focus: Ma(wt(i)),
				ranges: {}
			};
			for (let [e, t] of n.getAttributes()) a.attributes[e] = { value: t };
			t.forEach((e, t) => {
				a.ranges[t] = {
					value: "",
					subProperties: {
						start: {
							value: "",
							subProperties: R(Ma(e.start))
						},
						end: {
							value: "",
							subProperties: R(Ma(e.end))
						}
					}
				};
			});
			for (let e in a) e !== "ranges" && (a[e] = R(a[e]));
			return a;
		}
		var Pa = "https://ckeditor.com/docs/ckeditor5/latest/api/module_engine_model_markercollection-Marker.html", Fa = class extends y.Component {
			render() {
				let e = La(this.props.markers), t = Ra(e), n = this.props.editors.get(this.props.currentEditorName);
				return Object.keys(e).length ? y.createElement(Ca, {
					header: [y.createElement("span", { key: "link" }, y.createElement("a", {
						href: Pa,
						target: "_blank",
						rel: "noopener noreferrer"
					}, y.createElement("b", null, "Markers"))), y.createElement(W, {
						key: "log",
						icon: y.createElement(Ta, null),
						text: "Log in console",
						onClick: () => L.log([...n.model.markers])
					})],
					lists: [{
						name: "Markers tree",
						itemDefinitions: t,
						presentation: { expandCollapsibles: !0 }
					}]
				}) : y.createElement(na, { isEmpty: "true" }, y.createElement("p", null, "No markers in the document."));
			}
		}, Ia = I(({ editors: e, currentEditorName: t, model: { markers: n } }) => ({
			editors: e,
			currentEditorName: t,
			markers: n
		}), {})(Fa);
		function La(e) {
			let t = {};
			for (let n of e) {
				let e = n.name.split(":"), r = t;
				for (let t of e) {
					let i = t === e[e.length - 1];
					r = r[t] ? r[t] : r[t] = i ? n : {};
				}
			}
			return t;
		}
		function Ra(e) {
			let t = {};
			for (let n in e) {
				let r = e[n];
				if (r.name) {
					let e = R(za(r));
					t[n] = {
						value: "",
						presentation: { colorBox: r.presentation.color },
						subProperties: e
					};
				} else {
					let e = Object.keys(r).length;
					t[n] = {
						value: e + " marker" + (e > 1 ? "s" : ""),
						subProperties: Ra(r)
					};
				}
			}
			return t;
		}
		function za({ name: e, start: t, end: n, affectsData: r, managedUsingOperations: i }) {
			return {
				name: { value: e },
				start: { value: t.path },
				end: { value: n.path },
				affectsData: { value: r },
				managedUsingOperations: { value: i }
			};
		}
		var Ba = class extends y.Component {
			render() {
				return this.props.currentEditorName ? y.createElement(na, { splitVertically: "true" }, y.createElement(ya, null), y.createElement(sa, null, y.createElement(Si, {
					onTabChange: this.props.setModelActiveTab,
					activeTab: this.props.activeTab
				}, y.createElement(Oa, { label: "Inspect" }), y.createElement(ja, { label: "Selection" }), y.createElement(Ia, { label: "Markers" })))) : y.createElement(na, { isEmpty: "true" }, y.createElement("p", null, "Nothing to show. Attach another editor instance to start inspecting."));
			}
		}, Va = I(({ currentEditorName: e, model: { ui: { activeTab: t } } }) => ({
			currentEditorName: e,
			activeTab: t
		}), { setModelActiveTab: rt })(Ba), Ha = class extends y.Component {
			constructor(e) {
				super(e), this.handleTreeClick = this.handleTreeClick.bind(this), this.handleRootChange = this.handleRootChange.bind(this);
			}
			handleTreeClick(e, t) {
				e.persist(), e.stopPropagation(), this.props.setViewCurrentNode(t), e.detail === 2 && this.props.setViewActiveTab("Inspect");
			}
			handleRootChange(e) {
				this.props.setViewCurrentRootName(e.target.value);
			}
			render() {
				let e = this.props.editors.get(this.props.currentEditorName);
				return y.createElement(xi, null, [
					y.createElement("div", {
						className: "ck-inspector-tree__config",
						key: "root-cfg"
					}, y.createElement(ta, {
						id: "view-root-select",
						label: "Root",
						value: this.props.currentRootName,
						options: Ln(e).map((e) => e.rootName),
						onChange: this.handleRootChange
					})),
					y.createElement("span", {
						className: "ck-inspector-separator",
						key: "separator"
					}),
					y.createElement("div", {
						className: "ck-inspector-tree__config",
						key: "types-cfg"
					}, y.createElement(_a, {
						label: "Show element types",
						id: "view-show-types",
						isChecked: this.props.showElementTypes,
						onChange: this.props.toggleViewShowElementTypes
					}))
				], y.createElement(ga, {
					definition: this.props.treeDefinition,
					textDirection: e.locale.contentLanguageDirection,
					onClick: this.handleTreeClick,
					showCompactText: "true",
					showElementTypes: this.props.showElementTypes,
					activeNode: this.props.currentNode
				}));
			}
		}, Ua = I(({ editors: e, currentEditorName: t, view: { treeDefinition: n, currentRootName: r, currentNode: i, ui: { showElementTypes: a } } }) => ({
			treeDefinition: n,
			editors: e,
			currentEditorName: t,
			currentRootName: r,
			currentNode: i,
			showElementTypes: a
		}), {
			setViewCurrentRootName: bn,
			toggleViewShowElementTypes: Cn,
			setViewCurrentNode: xn,
			setViewActiveTab: Sn
		})(Ha), Wa = class extends y.Component {
			constructor(e) {
				super(e), this.handleNodeLogButtonClick = this.handleNodeLogButtonClick.bind(this);
			}
			handleNodeLogButtonClick() {
				L.log(this.props.currentNodeDefinition.editorNode);
			}
			render() {
				let e = this.props.currentNodeDefinition;
				return e ? y.createElement(Ca, {
					header: [y.createElement("span", { key: "link" }, y.createElement("a", {
						href: e.url,
						target: "_blank",
						rel: "noopener noreferrer"
					}, y.createElement("b", null, e.type), ":"), e.type === "Text" ? y.createElement("em", null, e.name) : e.name), y.createElement(W, {
						key: "log",
						icon: y.createElement(Ta, null),
						text: "Log in console",
						onClick: this.handleNodeLogButtonClick
					})],
					lists: [
						{
							name: "Attributes",
							url: e.url,
							itemDefinitions: e.attributes
						},
						{
							name: "Properties",
							url: e.url,
							itemDefinitions: e.properties
						},
						{
							name: "Custom Properties",
							url: `${Pn}_element-Element.html#function-getCustomProperty`,
							itemDefinitions: e.customProperties
						}
					]
				}) : y.createElement(na, { isEmpty: "true" }, y.createElement("p", null, "Select a node in the tree to inspect"));
			}
		}, Ga = I(({ view: { currentNodeDefinition: e } }) => ({ currentNodeDefinition: e }), {})(Wa), Ka = "https://ckeditor.com/docs/ckeditor5/latest/api/module_engine_view_selection-Selection.html", qa = class extends y.Component {
			static contextType = ra;
			constructor(e) {
				super(e), this.handleSelectionLogButtonClick = this.handleSelectionLogButtonClick.bind(this), this.handleScrollToSelectionButtonClick = this.handleScrollToSelectionButtonClick.bind(this);
			}
			handleSelectionLogButtonClick() {
				let e = this.props.editor;
				L.log(e.editing.view.document.selection);
			}
			handleScrollToSelectionButtonClick() {
				let e = this.context.document.querySelector(".ck-inspector-tree__position.ck-inspector-tree__position_selection");
				e && e.scrollIntoView({
					behavior: "smooth",
					block: "center"
				});
			}
			render() {
				let e = this.props.editor, t = this.props.info;
				return y.createElement(Ca, {
					header: [
						y.createElement("span", { key: "link" }, y.createElement("a", {
							href: Ka,
							target: "_blank",
							rel: "noopener noreferrer"
						}, y.createElement("b", null, "Selection"))),
						y.createElement(W, {
							key: "log",
							icon: y.createElement(Ta, null),
							text: "Log in console",
							onClick: this.handleSelectionLogButtonClick
						}),
						y.createElement(W, {
							key: "scroll",
							icon: y.createElement(ka, null),
							text: "Scroll to selection",
							onClick: this.handleScrollToSelectionButtonClick
						})
					],
					lists: [
						{
							name: "Properties",
							url: `${Ka}`,
							itemDefinitions: t.properties
						},
						{
							name: "Anchor",
							url: `${Ka}#member-anchor`,
							buttons: [{
								type: "log",
								text: "Log in console",
								onClick: () => L.log(e.editing.view.document.selection.anchor)
							}],
							itemDefinitions: t.anchor
						},
						{
							name: "Focus",
							url: `${Ka}#member-focus`,
							buttons: [{
								type: "log",
								text: "Log in console",
								onClick: () => L.log(e.editing.view.document.selection.focus)
							}],
							itemDefinitions: t.focus
						},
						{
							name: "Ranges",
							url: `${Ka}#function-getRanges`,
							buttons: [{
								type: "log",
								text: "Log in console",
								onClick: () => L.log(...e.editing.view.document.selection.getRanges())
							}],
							itemDefinitions: t.ranges,
							presentation: { expandCollapsibles: !0 }
						}
					]
				});
			}
		}, Ja = I(({ editors: e, currentEditorName: t, view: { ranges: n } }) => {
			let r = e.get(t);
			return {
				editor: r,
				currentEditorName: t,
				info: Xa(r, n)
			};
		}, {})(qa);
		function Ya({ offset: e, isAtEnd: t, isAtStart: n, parent: r }) {
			return {
				offset: { value: e },
				isAtEnd: { value: t },
				isAtStart: { value: n },
				parent: { value: r }
			};
		}
		function Xa(e, t) {
			let n = e.editing.view.document.selection, r = {
				properties: {
					isCollapsed: { value: n.isCollapsed },
					isBackward: { value: n.isBackward },
					isFake: { value: n.isFake },
					rangeCount: { value: n.rangeCount }
				},
				anchor: Ya(Mn(n.anchor)),
				focus: Ya(Mn(n.focus)),
				ranges: {}
			};
			t.forEach((e, t) => {
				r.ranges[t] = {
					value: "",
					subProperties: {
						start: {
							value: "",
							subProperties: R(Ya(e.start))
						},
						end: {
							value: "",
							subProperties: R(Ya(e.end))
						}
					}
				};
			});
			for (let e in r) e !== "ranges" && (r[e] = R(r[e]));
			return r;
		}
		var Za = class extends y.Component {
			render() {
				return this.props.currentEditorName ? y.createElement(na, { splitVertically: "true" }, y.createElement(Ua, null), y.createElement(sa, null, y.createElement(Si, {
					onTabChange: this.props.setViewActiveTab,
					activeTab: this.props.activeTab
				}, y.createElement(Ga, { label: "Inspect" }), y.createElement(Ja, { label: "Selection" })))) : y.createElement(na, { isEmpty: "true" }, y.createElement("p", null, "Nothing to show. Attach another editor instance to start inspecting."));
			}
		}, Qa = I(({ currentEditorName: e, view: { ui: { activeTab: t } } }) => ({
			currentEditorName: e,
			activeTab: t
		}), {
			setViewActiveTab: Sn,
			updateViewState: wn
		})(Za), $a = class extends y.Component {
			constructor(e) {
				super(e), this.handleTreeClick = this.handleTreeClick.bind(this);
			}
			handleTreeClick(e, t) {
				e.persist(), e.stopPropagation(), this.props.setCommandsCurrentCommandName(t);
			}
			render() {
				return y.createElement(xi, null, y.createElement(ga, {
					definition: this.props.treeDefinition,
					onClick: this.handleTreeClick,
					activeNode: this.props.currentCommandName
				}));
			}
		}, eo = I(({ commands: { treeDefinition: e, currentCommandName: t } }) => ({
			treeDefinition: e,
			currentCommandName: t
		}), { setCommandsCurrentCommandName: sr })($a), to = (e) => (0, G.jsx)("svg", {
			viewBox: "0 0 19 19",
			xmlns: "http://www.w3.org/2000/svg",
			...e,
			children: (0, G.jsx)("path", { d: "M9.25 1.25a8 8 0 1 1 0 16 8 8 0 0 1 0-16Zm0 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM7.344 6.485l4.98 2.765-4.98 3.018V6.485Z" })
		}), no = class extends y.Component {
			constructor(e) {
				super(e), this.handleCommandLogButtonClick = this.handleCommandLogButtonClick.bind(this), this.handleCommandExecuteButtonClick = this.handleCommandExecuteButtonClick.bind(this);
			}
			handleCommandLogButtonClick() {
				L.log(this.props.currentCommandDefinition.command);
			}
			handleCommandExecuteButtonClick() {
				this.props.editors.get(this.props.currentEditorName).execute(this.props.currentCommandName);
			}
			render() {
				let e = this.props.currentCommandDefinition;
				return e ? y.createElement(Ca, {
					header: [
						y.createElement("span", { key: "link" }, y.createElement("a", {
							href: e.url,
							target: "_blank",
							rel: "noopener noreferrer"
						}, y.createElement("b", null, e.type)), ":", this.props.currentCommandName),
						y.createElement(W, {
							key: "exec",
							icon: y.createElement(to, null),
							text: "Execute command",
							onClick: this.handleCommandExecuteButtonClick
						}),
						y.createElement(W, {
							key: "log",
							icon: y.createElement(Ta, null),
							text: "Log in console",
							onClick: this.handleCommandLogButtonClick
						})
					],
					lists: [{
						name: "Properties",
						url: e.url,
						itemDefinitions: e.properties
					}]
				}) : y.createElement(na, { isEmpty: "true" }, y.createElement("p", null, "Select a command to inspect"));
			}
		}, ro = I(({ editors: e, currentEditorName: t, commands: { currentCommandName: n, currentCommandDefinition: r } }) => ({
			editors: e,
			currentEditorName: t,
			currentCommandName: n,
			currentCommandDefinition: r
		}), {})(no), io = class extends y.Component {
			render() {
				return this.props.currentEditorName ? y.createElement(na, { splitVertically: "true" }, y.createElement(eo, null), y.createElement(sa, null, y.createElement(Si, { activeTab: "Inspect" }, y.createElement(ro, { label: "Inspect" })))) : y.createElement(na, { isEmpty: "true" }, y.createElement("p", null, "Nothing to show. Attach another editor instance to start inspecting."));
			}
		}, ao = I(({ currentEditorName: e }) => ({ currentEditorName: e }), { updateCommandsState: cr })(io), oo = class extends y.Component {
			constructor(e) {
				super(e), this.handleTreeClick = this.handleTreeClick.bind(this);
			}
			handleTreeClick(e, t) {
				e.persist(), e.stopPropagation(), this.props.setSchemaCurrentDefinitionName(t);
			}
			render() {
				return y.createElement(xi, null, y.createElement(ga, {
					definition: this.props.treeDefinition,
					onClick: this.handleTreeClick,
					activeNode: this.props.currentSchemaDefinitionName
				}));
			}
		}, q = I(({ schema: { treeDefinition: e, currentSchemaDefinitionName: t } }) => ({
			treeDefinition: e,
			currentSchemaDefinitionName: t
		}), { setSchemaCurrentDefinitionName: mr })(oo), so = class extends y.Component {
			render() {
				let e = this.props.currentSchemaDefinition;
				return e ? y.createElement(Ca, {
					header: [y.createElement("span", { key: "link" }, y.createElement("a", {
						href: e.urls.general,
						target: "_blank",
						rel: "noopener noreferrer"
					}, y.createElement("b", null, e.type)), ":", this.props.currentSchemaDefinitionName)],
					lists: [
						{
							name: "Properties",
							url: e.urls.general,
							itemDefinitions: e.properties
						},
						{
							name: "Allowed attributes",
							url: e.urls.allowAttributes,
							itemDefinitions: e.allowAttributes
						},
						{
							name: "Allowed children",
							url: e.urls.allowChildren,
							itemDefinitions: e.allowChildren,
							onPropertyTitleClick: (e) => {
								this.props.setSchemaCurrentDefinitionName(e);
							}
						},
						{
							name: "Allowed in",
							url: e.urls.allowIn,
							itemDefinitions: e.allowIn,
							onPropertyTitleClick: (e) => {
								this.props.setSchemaCurrentDefinitionName(e);
							}
						}
					]
				}) : y.createElement(na, { isEmpty: "true" }, y.createElement("p", null, "Select a schema definition to inspect"));
			}
		}, co = I(({ editors: e, currentEditorName: t, schema: { currentSchemaDefinitionName: n, currentSchemaDefinition: r } }) => ({
			editors: e,
			currentEditorName: t,
			currentSchemaDefinitionName: n,
			currentSchemaDefinition: r
		}), { setSchemaCurrentDefinitionName: mr })(so), lo = class extends y.Component {
			render() {
				return this.props.currentEditorName ? y.createElement(na, { splitVertically: "true" }, y.createElement(q, null), y.createElement(sa, null, y.createElement(Si, { activeTab: "Inspect" }, y.createElement(co, { label: "Inspect" })))) : y.createElement(na, { isEmpty: "true" }, y.createElement("p", null, "Nothing to show. Attach another editor instance to start inspecting."));
			}
		}, uo = I(({ currentEditorName: e }) => ({ currentEditorName: e }))(lo), fo = s(((e, t) => {
			t.exports = function() {
				var e = document.getSelection();
				if (!e.rangeCount) return function() {};
				for (var t = document.activeElement, n = [], r = 0; r < e.rangeCount; r++) n.push(e.getRangeAt(r));
				switch (t.tagName.toUpperCase()) {
					case "INPUT":
					case "TEXTAREA":
						t.blur();
						break;
					default: t = null;
				}
				return e.removeAllRanges(), function() {
					e.type === "Caret" && e.removeAllRanges(), e.rangeCount || n.forEach(function(t) {
						e.addRange(t);
					}), t && t.focus();
				};
			};
		})), J = s(((e, t) => {
			var n = fo(), r = {
				"text/plain": "Text",
				"text/html": "Url",
				default: "Text"
			}, i = "Copy to clipboard: #{key}, Enter";
			function a(e) {
				var t = (/mac os x/i.test(navigator.userAgent) ? "⌘" : "Ctrl") + "+C";
				return e.replace(/#{\s*key\s*}/g, t);
			}
			function o(e, t) {
				var o, s, c, l, u, d, f = !1;
				t ||= {}, o = t.debug || !1;
				try {
					if (c = n(), l = document.createRange(), u = document.getSelection(), d = document.createElement("span"), d.textContent = e, d.ariaHidden = "true", d.style.all = "unset", d.style.position = "fixed", d.style.top = 0, d.style.clip = "rect(0, 0, 0, 0)", d.style.whiteSpace = "pre", d.style.webkitUserSelect = "text", d.style.MozUserSelect = "text", d.style.msUserSelect = "text", d.style.userSelect = "text", d.addEventListener("copy", function(n) {
						if (n.stopPropagation(), t.format) {
							if (n.preventDefault(), n.clipboardData === void 0) {
								o && console.warn("unable to use e.clipboardData"), o && console.warn("trying IE specific stuff"), window.clipboardData.clearData();
								var i = r[t.format] || r.default;
								window.clipboardData.setData(i, e);
							} else n.clipboardData.clearData(), n.clipboardData.setData(t.format, e);
						}
						t.onCopy && (n.preventDefault(), t.onCopy(n.clipboardData));
					}), document.body.appendChild(d), l.selectNodeContents(d), u.addRange(l), !document.execCommand("copy")) throw Error("copy command was unsuccessful");
					f = !0;
				} catch (n) {
					o && console.error("unable to copy using execCommand: ", n), o && console.warn("trying IE specific stuff");
					try {
						window.clipboardData.setData(t.format || "text", e), t.onCopy && t.onCopy(window.clipboardData), f = !0;
					} catch (n) {
						o && console.error("unable to copy using clipboardData: ", n), o && console.error("falling back to prompt"), s = a("message" in t ? t.message : i), window.prompt(s, e);
					}
				} finally {
					u && (typeof u.removeRange == "function" ? u.removeRange(l) : u.removeAllRanges()), d && document.body.removeChild(d), c();
				}
				return f;
			}
			t.exports = o;
		})), Y = s(((e, t) => {
			Object.defineProperty(e, "__esModule", { value: !0 }), e.default = u;
			var n = "none", r = "contents", i = /^(input|select|textarea|button|object|iframe)$/;
			function a(e, t) {
				return t.getPropertyValue("overflow") !== "visible" || e.scrollWidth <= 0 && e.scrollHeight <= 0;
			}
			function o(e) {
				var t = e.offsetWidth <= 0 && e.offsetHeight <= 0;
				if (t && !e.innerHTML) return !0;
				try {
					var i = window.getComputedStyle(e), o = i.getPropertyValue("display");
					return t ? o !== r && a(e, i) : o === n;
				} catch {
					return console.warn("Failed to inspect element style"), !1;
				}
			}
			function s(e) {
				for (var t = e, n = e.getRootNode && e.getRootNode(); t && t !== document.body;) {
					if (n && t === n && (t = n.host.parentNode), o(t)) return !1;
					t = t.parentNode;
				}
				return !0;
			}
			function c(e, t) {
				var n = e.nodeName.toLowerCase();
				return (i.test(n) && !e.disabled || n === "a" && e.href || t) && s(e);
			}
			function l(e) {
				var t = e.getAttribute("tabindex");
				t === null && (t = void 0);
				var n = isNaN(t);
				return (n || t >= 0) && c(e, !n);
			}
			function u(e) {
				return [].slice.call(e.querySelectorAll("*"), 0).reduce(function(e, t) {
					return e.concat(t.shadowRoot ? u(t.shadowRoot) : [t]);
				}, []).filter(l);
			}
			t.exports = e.default;
		})), po = s(((e) => {
			Object.defineProperty(e, "__esModule", { value: !0 }), e.resetState = o, e.log = s, e.handleBlur = c, e.handleFocus = l, e.markForFocusLater = u, e.returnFocus = d, e.popWithoutFocus = f, e.setupScopedFocus = p, e.teardownScopedFocus = m;
			var t = n(Y());
			function n(e) {
				return e && e.__esModule ? e : { default: e };
			}
			var r = [], i = null, a = !1;
			function o() {
				r = [];
			}
			function s() {}
			function c() {
				a = !0;
			}
			function l() {
				if (a) {
					if (a = !1, !i) return;
					setTimeout(function() {
						i.contains(document.activeElement) || ((0, t.default)(i)[0] || i).focus();
					}, 0);
				}
			}
			function u() {
				r.push(document.activeElement);
			}
			function d() {
				var e = arguments.length > 0 && arguments[0] !== void 0 && arguments[0], t = null;
				try {
					r.length !== 0 && (t = r.pop(), t.focus({ preventScroll: e }));
					return;
				} catch {
					console.warn([
						"You tried to return focus to",
						t,
						"but it is not in the DOM anymore"
					].join(" "));
				}
			}
			function f() {
				r.length > 0 && r.pop();
			}
			function p(e) {
				i = e, window.addEventListener ? (window.addEventListener("blur", c, !1), document.addEventListener("focus", l, !0)) : (window.attachEvent("onBlur", c), document.attachEvent("onFocus", l));
			}
			function m() {
				i = null, window.addEventListener ? (window.removeEventListener("blur", c), document.removeEventListener("focus", l)) : (window.detachEvent("onBlur", c), document.detachEvent("onFocus", l));
			}
		})), mo = s(((e, t) => {
			Object.defineProperty(e, "__esModule", { value: !0 }), e.default = a;
			var n = r(Y());
			function r(e) {
				return e && e.__esModule ? e : { default: e };
			}
			function i() {
				var e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : document;
				return e.activeElement.shadowRoot ? i(e.activeElement.shadowRoot) : e.activeElement;
			}
			function a(e, t) {
				var r = (0, n.default)(e);
				if (!r.length) t.preventDefault();
				else {
					var a = void 0, o = t.shiftKey, s = r[0], c = r[r.length - 1], l = i();
					if (e === l) {
						if (!o) return;
						a = c;
					}
					if (c === l && !o && (a = s), s === l && o && (a = c), a) t.preventDefault(), a.focus();
					else {
						var u = /(\bChrome\b|\bSafari\b)\//.exec(navigator.userAgent);
						if (u != null && u[1] != "Chrome" && /\biPod\b|\biPad\b/g.exec(navigator.userAgent) == null) {
							var d = r.indexOf(l);
							if (d > -1 && (d += o ? -1 : 1), a = r[d], a === void 0) {
								t.preventDefault(), a = o ? c : s, a.focus();
								return;
							}
							t.preventDefault(), a.focus();
						}
					}
				}
			}
			t.exports = e.default;
		})), ho = s(((e, t) => {
			t.exports = function() {};
		})), go = s(((e, t) => {
			(function() {
				var e = !!(typeof window < "u" && window.document && window.document.createElement), n = {
					canUseDOM: e,
					canUseWorkers: typeof Worker < "u",
					canUseEventListeners: e && !!(window.addEventListener || window.attachEvent),
					canUseViewport: e && !!window.screen
				};
				typeof define == "function" && typeof define.amd == "object" && define.amd ? define(function() {
					return n;
				}) : t !== void 0 && t.exports ? t.exports = n : window.ExecutionEnvironment = n;
			})();
		})), _o = s(((e) => {
			Object.defineProperty(e, "__esModule", { value: !0 }), e.canUseDOM = e.SafeNodeList = e.SafeHTMLCollection = void 0;
			var t = n(go());
			function n(e) {
				return e && e.__esModule ? e : { default: e };
			}
			var r = t.default, i = r.canUseDOM ? window.HTMLElement : {};
			e.SafeHTMLCollection = r.canUseDOM ? window.HTMLCollection : {}, e.SafeNodeList = r.canUseDOM ? window.NodeList : {}, e.canUseDOM = r.canUseDOM, e.default = i;
		})), vo = s(((e) => {
			Object.defineProperty(e, "__esModule", { value: !0 }), e.resetState = a, e.log = o, e.assertNodeList = s, e.setElement = c, e.validateElement = l, e.hide = u, e.show = d, e.documentNotReadyOrSSRTesting = f;
			var t = r(ho()), n = _o();
			function r(e) {
				return e && e.__esModule ? e : { default: e };
			}
			var i = null;
			function a() {
				i && (i.removeAttribute ? i.removeAttribute("aria-hidden") : i.length == null ? document.querySelectorAll(i).forEach(function(e) {
					return e.removeAttribute("aria-hidden");
				}) : i.forEach(function(e) {
					return e.removeAttribute("aria-hidden");
				})), i = null;
			}
			function o() {}
			function s(e, t) {
				if (!e || !e.length) throw Error("react-modal: No elements were found for selector " + t + ".");
			}
			function c(e) {
				var t = e;
				if (typeof t == "string" && n.canUseDOM) {
					var r = document.querySelectorAll(t);
					s(r, t), t = r;
				}
				return i = t || i, i;
			}
			function l(e) {
				var n = e || i;
				return n ? Array.isArray(n) || n instanceof HTMLCollection || n instanceof NodeList ? n : [n] : ((0, t.default)(!1, "react-modal: App element is not defined. Please use `Modal.setAppElement(el)` or set `appElement={el}`. This is needed so screen readers don't see main content when modal is opened. It is not recommended, but you can opt-out by setting `ariaHideApp={false}`."), []);
			}
			function u(e) {
				var t = !0, n = !1, r = void 0;
				try {
					for (var i = l(e)[Symbol.iterator](), a; !(t = (a = i.next()).done); t = !0) a.value.setAttribute("aria-hidden", "true");
				} catch (e) {
					n = !0, r = e;
				} finally {
					try {
						!t && i.return && i.return();
					} finally {
						if (n) throw r;
					}
				}
			}
			function d(e) {
				var t = !0, n = !1, r = void 0;
				try {
					for (var i = l(e)[Symbol.iterator](), a; !(t = (a = i.next()).done); t = !0) a.value.removeAttribute("aria-hidden");
				} catch (e) {
					n = !0, r = e;
				} finally {
					try {
						!t && i.return && i.return();
					} finally {
						if (n) throw r;
					}
				}
			}
			function f() {
				i = null;
			}
		})), yo = s(((e) => {
			Object.defineProperty(e, "__esModule", { value: !0 }), e.resetState = i, e.log = a;
			var t = {}, n = {};
			function r(e, t) {
				e.classList.remove(t);
			}
			function i() {
				var e = document.getElementsByTagName("html")[0];
				for (var i in t) r(e, t[i]);
				var a = document.body;
				for (var o in n) r(a, n[o]);
				t = {}, n = {};
			}
			function a() {}
			var o = function(e, t) {
				return e[t] || (e[t] = 0), e[t] += 1, t;
			}, s = function(e, t) {
				return e[t] && --e[t], t;
			}, c = function(e, t, n) {
				n.forEach(function(n) {
					o(t, n), e.add(n);
				});
			}, l = function(e, t, n) {
				n.forEach(function(n) {
					s(t, n), t[n] === 0 && e.remove(n);
				});
			};
			e.add = function(e, r) {
				return c(e.classList, e.nodeName.toLowerCase() == "html" ? t : n, r.split(" "));
			}, e.remove = function(e, r) {
				return l(e.classList, e.nodeName.toLowerCase() == "html" ? t : n, r.split(" "));
			};
		})), bo = s(((e) => {
			Object.defineProperty(e, "__esModule", { value: !0 }), e.log = i, e.resetState = a;
			function t(e, t) {
				if (!(e instanceof t)) throw TypeError("Cannot call a class as a function");
			}
			var n = function e() {
				var n = this;
				t(this, e), this.register = function(e) {
					n.openInstances.indexOf(e) === -1 && (n.openInstances.push(e), n.emit("register"));
				}, this.deregister = function(e) {
					var t = n.openInstances.indexOf(e);
					t !== -1 && (n.openInstances.splice(t, 1), n.emit("deregister"));
				}, this.subscribe = function(e) {
					n.subscribers.push(e);
				}, this.emit = function(e) {
					n.subscribers.forEach(function(t) {
						return t(e, n.openInstances.slice());
					});
				}, this.openInstances = [], this.subscribers = [];
			}, r = new n();
			function i() {
				console.log("portalOpenInstances ----------"), console.log(r.openInstances.length), r.openInstances.forEach(function(e) {
					return console.log(e);
				}), console.log("end portalOpenInstances ----------");
			}
			function a() {
				r = new n();
			}
			e.default = r;
		})), xo = s(((e) => {
			Object.defineProperty(e, "__esModule", { value: !0 }), e.resetState = o, e.log = s;
			var t = n(bo());
			function n(e) {
				return e && e.__esModule ? e : { default: e };
			}
			var r = void 0, i = void 0, a = [];
			function o() {
				for (var e = [r, i], t = 0; t < e.length; t++) {
					var n = e[t];
					n && n.parentNode && n.parentNode.removeChild(n);
				}
				r = i = null, a = [];
			}
			function s() {
				console.log("bodyTrap ----------"), console.log(a.length);
				for (var e = [r, i], t = 0; t < e.length; t++) {
					var n = e[t] || {};
					console.log(n.nodeName, n.className, n.id);
				}
				console.log("edn bodyTrap ----------");
			}
			function c() {
				a.length !== 0 && a[a.length - 1].focusContent();
			}
			function l(e, t) {
				!r && !i && (r = document.createElement("div"), r.setAttribute("data-react-modal-body-trap", ""), r.style.position = "absolute", r.style.opacity = "0", r.setAttribute("tabindex", "0"), r.addEventListener("focus", c), i = r.cloneNode(), i.addEventListener("focus", c)), a = t, a.length > 0 ? (document.body.firstChild !== r && document.body.insertBefore(r, document.body.firstChild), document.body.lastChild !== i && document.body.appendChild(i)) : (r.parentElement && r.parentElement.removeChild(r), i.parentElement && i.parentElement.removeChild(i));
			}
			t.default.subscribe(l);
		})), So = s(((e, t) => {
			Object.defineProperty(e, "__esModule", { value: !0 });
			var n = Object.assign || function(e) {
				for (var t = 1; t < arguments.length; t++) {
					var n = arguments[t];
					for (var r in n) Object.prototype.hasOwnProperty.call(n, r) && (e[r] = n[r]);
				}
				return e;
			}, r = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e) {
				return typeof e;
			} : function(e) {
				return e && typeof Symbol == "function" && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;
			}, i = function() {
				function e(e, t) {
					for (var n = 0; n < t.length; n++) {
						var r = t[n];
						r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), Object.defineProperty(e, r.key, r);
					}
				}
				return function(t, n, r) {
					return n && e(t.prototype, n), r && e(t, r), t;
				};
			}(), a = m(), o = g(ee()), s = h(po()), c = g(mo()), l = h(vo()), u = h(yo()), d = _o(), f = g(d), p = g(bo());
			xo();
			function h(e) {
				if (e && e.__esModule) return e;
				var t = {};
				if (e != null) for (var n in e) Object.prototype.hasOwnProperty.call(e, n) && (t[n] = e[n]);
				return t.default = e, t;
			}
			function g(e) {
				return e && e.__esModule ? e : { default: e };
			}
			function _(e, t) {
				if (!(e instanceof t)) throw TypeError("Cannot call a class as a function");
			}
			function v(e, t) {
				if (!e) throw ReferenceError("this hasn't been initialised - super() hasn't been called");
				return t && (typeof t == "object" || typeof t == "function") ? t : e;
			}
			function y(e, t) {
				if (typeof t != "function" && t !== null) throw TypeError("Super expression must either be null or a function, not " + typeof t);
				e.prototype = Object.create(t && t.prototype, { constructor: {
					value: e,
					enumerable: !1,
					writable: !0,
					configurable: !0
				} }), t && (Object.setPrototypeOf ? Object.setPrototypeOf(e, t) : e.__proto__ = t);
			}
			var b = {
				overlay: "ReactModal__Overlay",
				content: "ReactModal__Content"
			}, x = function(e) {
				return e.code === "Tab" || e.keyCode === 9;
			}, S = function(e) {
				return e.code === "Escape" || e.keyCode === 27;
			}, C = 0, w = function(e) {
				y(t, e);
				function t(e) {
					_(this, t);
					var n = v(this, (t.__proto__ || Object.getPrototypeOf(t)).call(this, e));
					return n.setOverlayRef = function(e) {
						n.overlay = e, n.props.overlayRef && n.props.overlayRef(e);
					}, n.setContentRef = function(e) {
						n.content = e, n.props.contentRef && n.props.contentRef(e);
					}, n.afterClose = function() {
						var e = n.props, t = e.appElement, r = e.ariaHideApp, i = e.htmlOpenClassName, a = e.bodyOpenClassName, o = e.parentSelector, c = o && o().ownerDocument || document;
						a && u.remove(c.body, a), i && u.remove(c.getElementsByTagName("html")[0], i), r && C > 0 && (--C, C === 0 && l.show(t)), n.props.shouldFocusAfterRender && (n.props.shouldReturnFocusAfterClose ? (s.returnFocus(n.props.preventScroll), s.teardownScopedFocus()) : s.popWithoutFocus()), n.props.onAfterClose && n.props.onAfterClose(), p.default.deregister(n);
					}, n.open = function() {
						n.beforeOpen(), n.state.afterOpen && n.state.beforeClose ? (clearTimeout(n.closeTimer), n.setState({ beforeClose: !1 })) : (n.props.shouldFocusAfterRender && (s.setupScopedFocus(n.node), s.markForFocusLater()), n.setState({ isOpen: !0 }, function() {
							n.openAnimationFrame = requestAnimationFrame(function() {
								n.setState({ afterOpen: !0 }), n.props.isOpen && n.props.onAfterOpen && n.props.onAfterOpen({
									overlayEl: n.overlay,
									contentEl: n.content
								});
							});
						}));
					}, n.close = function() {
						n.props.closeTimeoutMS > 0 ? n.closeWithTimeout() : n.closeWithoutTimeout();
					}, n.focusContent = function() {
						return n.content && !n.contentHasFocus() && n.content.focus({ preventScroll: !0 });
					}, n.closeWithTimeout = function() {
						var e = Date.now() + n.props.closeTimeoutMS;
						n.setState({
							beforeClose: !0,
							closesAt: e
						}, function() {
							n.closeTimer = setTimeout(n.closeWithoutTimeout, n.state.closesAt - Date.now());
						});
					}, n.closeWithoutTimeout = function() {
						n.setState({
							beforeClose: !1,
							isOpen: !1,
							afterOpen: !1,
							closesAt: null
						}, n.afterClose);
					}, n.handleKeyDown = function(e) {
						x(e) && (0, c.default)(n.content, e), n.props.shouldCloseOnEsc && S(e) && (e.stopPropagation(), n.requestClose(e));
					}, n.handleOverlayOnClick = function(e) {
						n.shouldClose === null && (n.shouldClose = !0), n.shouldClose && n.props.shouldCloseOnOverlayClick && (n.ownerHandlesClose() ? n.requestClose(e) : n.focusContent()), n.shouldClose = null;
					}, n.handleContentOnMouseUp = function() {
						n.shouldClose = !1;
					}, n.handleOverlayOnMouseDown = function(e) {
						!n.props.shouldCloseOnOverlayClick && e.target == n.overlay && e.preventDefault();
					}, n.handleContentOnClick = function() {
						n.shouldClose = !1;
					}, n.handleContentOnMouseDown = function() {
						n.shouldClose = !1;
					}, n.requestClose = function(e) {
						return n.ownerHandlesClose() && n.props.onRequestClose(e);
					}, n.ownerHandlesClose = function() {
						return n.props.onRequestClose;
					}, n.shouldBeClosed = function() {
						return !n.state.isOpen && !n.state.beforeClose;
					}, n.contentHasFocus = function() {
						return document.activeElement === n.content || n.content.contains(document.activeElement);
					}, n.buildClassName = function(e, t) {
						var i = (t === void 0 ? "undefined" : r(t)) === "object" ? t : {
							base: b[e],
							afterOpen: b[e] + "--after-open",
							beforeClose: b[e] + "--before-close"
						}, a = i.base;
						return n.state.afterOpen && (a = a + " " + i.afterOpen), n.state.beforeClose && (a = a + " " + i.beforeClose), typeof t == "string" && t ? a + " " + t : a;
					}, n.attributesFromObject = function(e, t) {
						return Object.keys(t).reduce(function(n, r) {
							return n[e + "-" + r] = t[r], n;
						}, {});
					}, n.state = {
						afterOpen: !1,
						beforeClose: !1
					}, n.shouldClose = null, n.moveFromContentToOverlay = null, n;
				}
				return i(t, [
					{
						key: "componentDidMount",
						value: function() {
							this.props.isOpen && this.open();
						}
					},
					{
						key: "componentDidUpdate",
						value: function(e, t) {
							this.props.isOpen && !e.isOpen ? this.open() : !this.props.isOpen && e.isOpen && this.close(), this.props.shouldFocusAfterRender && this.state.isOpen && !t.isOpen && this.focusContent();
						}
					},
					{
						key: "componentWillUnmount",
						value: function() {
							this.state.isOpen && this.afterClose(), clearTimeout(this.closeTimer), cancelAnimationFrame(this.openAnimationFrame);
						}
					},
					{
						key: "beforeOpen",
						value: function() {
							var e = this.props, t = e.appElement, n = e.ariaHideApp, r = e.htmlOpenClassName, i = e.bodyOpenClassName, a = e.parentSelector, o = a && a().ownerDocument || document;
							i && u.add(o.body, i), r && u.add(o.getElementsByTagName("html")[0], r), n && (C += 1, l.hide(t)), p.default.register(this);
						}
					},
					{
						key: "render",
						value: function() {
							var e = this.props, t = e.id, r = e.className, i = e.overlayClassName, a = e.defaultStyles, o = e.children, s = r ? {} : a.content, c = i ? {} : a.overlay;
							if (this.shouldBeClosed()) return null;
							var l = {
								ref: this.setOverlayRef,
								className: this.buildClassName("overlay", i),
								style: n({}, c, this.props.style.overlay),
								onClick: this.handleOverlayOnClick,
								onMouseDown: this.handleOverlayOnMouseDown
							}, u = n({
								id: t,
								ref: this.setContentRef,
								style: n({}, s, this.props.style.content),
								className: this.buildClassName("content", r),
								tabIndex: "-1",
								onKeyDown: this.handleKeyDown,
								onMouseDown: this.handleContentOnMouseDown,
								onMouseUp: this.handleContentOnMouseUp,
								onClick: this.handleContentOnClick,
								role: this.props.role,
								"aria-label": this.props.contentLabel
							}, this.attributesFromObject("aria", n({ modal: !0 }, this.props.aria)), this.attributesFromObject("data", this.props.data || {}), { "data-testid": this.props.testId }), d = this.props.contentElement(u, o);
							return this.props.overlayElement(l, d);
						}
					}
				]), t;
			}(a.Component);
			w.defaultProps = {
				style: {
					overlay: {},
					content: {}
				},
				defaultStyles: {}
			}, w.propTypes = {
				isOpen: o.default.bool.isRequired,
				defaultStyles: o.default.shape({
					content: o.default.object,
					overlay: o.default.object
				}),
				style: o.default.shape({
					content: o.default.object,
					overlay: o.default.object
				}),
				className: o.default.oneOfType([o.default.string, o.default.object]),
				overlayClassName: o.default.oneOfType([o.default.string, o.default.object]),
				parentSelector: o.default.func,
				bodyOpenClassName: o.default.string,
				htmlOpenClassName: o.default.string,
				ariaHideApp: o.default.bool,
				appElement: o.default.oneOfType([
					o.default.instanceOf(f.default),
					o.default.instanceOf(d.SafeHTMLCollection),
					o.default.instanceOf(d.SafeNodeList),
					o.default.arrayOf(o.default.instanceOf(f.default))
				]),
				onAfterOpen: o.default.func,
				onAfterClose: o.default.func,
				onRequestClose: o.default.func,
				closeTimeoutMS: o.default.number,
				shouldFocusAfterRender: o.default.bool,
				shouldCloseOnOverlayClick: o.default.bool,
				shouldReturnFocusAfterClose: o.default.bool,
				preventScroll: o.default.bool,
				role: o.default.string,
				contentLabel: o.default.string,
				aria: o.default.object,
				data: o.default.object,
				children: o.default.node,
				shouldCloseOnEsc: o.default.bool,
				overlayRef: o.default.func,
				contentRef: o.default.func,
				id: o.default.string,
				overlayElement: o.default.func,
				contentElement: o.default.func,
				testId: o.default.string
			}, e.default = w, t.exports = e.default;
		})), Co = c({ polyfill: () => Do });
		function wo() {
			var e = this.constructor.getDerivedStateFromProps(this.props, this.state);
			e != null && this.setState(e);
		}
		function To(e) {
			function t(t) {
				return this.constructor.getDerivedStateFromProps(e, t) ?? null;
			}
			this.setState(t.bind(this));
		}
		function Eo(e, t) {
			try {
				var n = this.props, r = this.state;
				this.props = e, this.state = t, this.__reactInternalSnapshotFlag = !0, this.__reactInternalSnapshot = this.getSnapshotBeforeUpdate(n, r);
			} finally {
				this.props = n, this.state = r;
			}
		}
		function Do(e) {
			var t = e.prototype;
			if (!t || !t.isReactComponent) throw Error("Can only polyfill class components");
			if (typeof e.getDerivedStateFromProps != "function" && typeof t.getSnapshotBeforeUpdate != "function") return e;
			var n = null, r = null, i = null;
			if (typeof t.componentWillMount == "function" ? n = "componentWillMount" : typeof t.UNSAFE_componentWillMount == "function" && (n = "UNSAFE_componentWillMount"), typeof t.componentWillReceiveProps == "function" ? r = "componentWillReceiveProps" : typeof t.UNSAFE_componentWillReceiveProps == "function" && (r = "UNSAFE_componentWillReceiveProps"), typeof t.componentWillUpdate == "function" ? i = "componentWillUpdate" : typeof t.UNSAFE_componentWillUpdate == "function" && (i = "UNSAFE_componentWillUpdate"), n !== null || r !== null || i !== null) {
				var a = e.displayName || e.name, o = typeof e.getDerivedStateFromProps == "function" ? "getDerivedStateFromProps()" : "getSnapshotBeforeUpdate()";
				throw Error("Unsafe legacy lifecycles will not be called for components using new component APIs.\n\n" + a + " uses " + o + " but also contains the following legacy lifecycles:" + (n === null ? "" : "\n  " + n) + (r === null ? "" : "\n  " + r) + (i === null ? "" : "\n  " + i) + "\n\nThe above lifecycles should be removed. Learn more about this warning here:\nhttps://fb.me/react-async-component-lifecycle-hooks");
			}
			if (typeof e.getDerivedStateFromProps == "function" && (t.componentWillMount = wo, t.componentWillReceiveProps = To), typeof t.getSnapshotBeforeUpdate == "function") {
				if (typeof t.componentDidUpdate != "function") throw Error("Cannot polyfill getSnapshotBeforeUpdate() for components that do not define componentDidUpdate() on the prototype");
				t.componentWillUpdate = Eo;
				var s = t.componentDidUpdate;
				t.componentDidUpdate = function(e, t, n) {
					var r = this.__reactInternalSnapshotFlag ? this.__reactInternalSnapshot : n;
					s.call(this, e, t, r);
				};
			}
			return e;
		}
		var Oo = o((() => {
			wo.__suppressDeprecationWarning = !0, To.__suppressDeprecationWarning = !0, Eo.__suppressDeprecationWarning = !0;
		})), ko = s(((e) => {
			Object.defineProperty(e, "__esModule", { value: !0 }), e.bodyOpenClassName = e.portalClassName = void 0;
			var t = Object.assign || function(e) {
				for (var t = 1; t < arguments.length; t++) {
					var n = arguments[t];
					for (var r in n) Object.prototype.hasOwnProperty.call(n, r) && (e[r] = n[r]);
				}
				return e;
			}, n = function() {
				function e(e, t) {
					for (var n = 0; n < t.length; n++) {
						var r = t[n];
						r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), Object.defineProperty(e, r.key, r);
					}
				}
				return function(t, n, r) {
					return n && e(t.prototype, n), r && e(t, r), t;
				};
			}(), r = m(), i = h(r), a = h(v()), o = h(ee()), s = h(So()), c = p(vo()), l = _o(), u = h(l), f = (Oo(), d(Co));
			function p(e) {
				if (e && e.__esModule) return e;
				var t = {};
				if (e != null) for (var n in e) Object.prototype.hasOwnProperty.call(e, n) && (t[n] = e[n]);
				return t.default = e, t;
			}
			function h(e) {
				return e && e.__esModule ? e : { default: e };
			}
			function g(e, t) {
				if (!(e instanceof t)) throw TypeError("Cannot call a class as a function");
			}
			function _(e, t) {
				if (!e) throw ReferenceError("this hasn't been initialised - super() hasn't been called");
				return t && (typeof t == "object" || typeof t == "function") ? t : e;
			}
			function y(e, t) {
				if (typeof t != "function" && t !== null) throw TypeError("Super expression must either be null or a function, not " + typeof t);
				e.prototype = Object.create(t && t.prototype, { constructor: {
					value: e,
					enumerable: !1,
					writable: !0,
					configurable: !0
				} }), t && (Object.setPrototypeOf ? Object.setPrototypeOf(e, t) : e.__proto__ = t);
			}
			var b = e.portalClassName = "ReactModalPortal", x = e.bodyOpenClassName = "ReactModal__Body--open", S = l.canUseDOM && a.default.createPortal !== void 0, C = function(e) {
				return document.createElement(e);
			}, w = function() {
				return S ? a.default.createPortal : a.default.unstable_renderSubtreeIntoContainer;
			};
			function T(e) {
				return e();
			}
			var E = function(e) {
				y(r, e);
				function r() {
					var e, n, o, c;
					g(this, r);
					var l = [...arguments];
					return c = (n = (o = _(this, (e = r.__proto__ || Object.getPrototypeOf(r)).call.apply(e, [this].concat(l))), o), o.removePortal = function() {
						!S && a.default.unmountComponentAtNode(o.node);
						var e = T(o.props.parentSelector);
						e && e.contains(o.node) ? e.removeChild(o.node) : console.warn("React-Modal: \"parentSelector\" prop did not returned any DOM element. Make sure that the parent element is unmounted to avoid any memory leaks.");
					}, o.portalRef = function(e) {
						o.portal = e;
					}, o.renderPortal = function(e) {
						var n = w()(o, i.default.createElement(s.default, t({ defaultStyles: r.defaultStyles }, e)), o.node);
						o.portalRef(n);
					}, n), _(o, c);
				}
				return n(r, [
					{
						key: "componentDidMount",
						value: function() {
							l.canUseDOM && (S || (this.node = C("div")), this.node.className = this.props.portalClassName, T(this.props.parentSelector).appendChild(this.node), !S && this.renderPortal(this.props));
						}
					},
					{
						key: "getSnapshotBeforeUpdate",
						value: function(e) {
							return {
								prevParent: T(e.parentSelector),
								nextParent: T(this.props.parentSelector)
							};
						}
					},
					{
						key: "componentDidUpdate",
						value: function(e, t, n) {
							if (l.canUseDOM) {
								var r = this.props, i = r.isOpen, a = r.portalClassName;
								e.portalClassName !== a && (this.node.className = a);
								var o = n.prevParent, s = n.nextParent;
								s !== o && (o.removeChild(this.node), s.appendChild(this.node)), (e.isOpen || i) && !S && this.renderPortal(this.props);
							}
						}
					},
					{
						key: "componentWillUnmount",
						value: function() {
							if (l.canUseDOM && this.node && this.portal) {
								var e = this.portal.state, t = Date.now(), n = e.isOpen && this.props.closeTimeoutMS && (e.closesAt || t + this.props.closeTimeoutMS);
								n ? (e.beforeClose || this.portal.closeWithTimeout(), setTimeout(this.removePortal, n - t)) : this.removePortal();
							}
						}
					},
					{
						key: "render",
						value: function() {
							return !l.canUseDOM || !S ? null : (!this.node && S && (this.node = C("div")), w()(i.default.createElement(s.default, t({
								ref: this.portalRef,
								defaultStyles: r.defaultStyles
							}, this.props)), this.node));
						}
					}
				], [{
					key: "setAppElement",
					value: function(e) {
						c.setElement(e);
					}
				}]), r;
			}(r.Component);
			E.propTypes = {
				isOpen: o.default.bool.isRequired,
				style: o.default.shape({
					content: o.default.object,
					overlay: o.default.object
				}),
				portalClassName: o.default.string,
				bodyOpenClassName: o.default.string,
				htmlOpenClassName: o.default.string,
				className: o.default.oneOfType([o.default.string, o.default.shape({
					base: o.default.string.isRequired,
					afterOpen: o.default.string.isRequired,
					beforeClose: o.default.string.isRequired
				})]),
				overlayClassName: o.default.oneOfType([o.default.string, o.default.shape({
					base: o.default.string.isRequired,
					afterOpen: o.default.string.isRequired,
					beforeClose: o.default.string.isRequired
				})]),
				appElement: o.default.oneOfType([
					o.default.instanceOf(u.default),
					o.default.instanceOf(l.SafeHTMLCollection),
					o.default.instanceOf(l.SafeNodeList),
					o.default.arrayOf(o.default.instanceOf(u.default))
				]),
				onAfterOpen: o.default.func,
				onRequestClose: o.default.func,
				closeTimeoutMS: o.default.number,
				ariaHideApp: o.default.bool,
				shouldFocusAfterRender: o.default.bool,
				shouldCloseOnOverlayClick: o.default.bool,
				shouldReturnFocusAfterClose: o.default.bool,
				preventScroll: o.default.bool,
				parentSelector: o.default.func,
				aria: o.default.object,
				data: o.default.object,
				role: o.default.string,
				contentLabel: o.default.string,
				shouldCloseOnEsc: o.default.bool,
				overlayRef: o.default.func,
				contentRef: o.default.func,
				id: o.default.string,
				overlayElement: o.default.func,
				contentElement: o.default.func
			}, E.defaultProps = {
				isOpen: !1,
				portalClassName: b,
				bodyOpenClassName: x,
				role: "dialog",
				ariaHideApp: !0,
				closeTimeoutMS: 0,
				shouldFocusAfterRender: !0,
				shouldCloseOnEsc: !0,
				shouldCloseOnOverlayClick: !0,
				shouldReturnFocusAfterClose: !0,
				preventScroll: !1,
				parentSelector: function() {
					return document.body;
				},
				overlayElement: function(e, t) {
					return i.default.createElement("div", e, t);
				},
				contentElement: function(e, t) {
					return i.default.createElement("div", e, t);
				}
			}, E.defaultStyles = {
				overlay: {
					position: "fixed",
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					backgroundColor: "rgba(255, 255, 255, 0.75)"
				},
				content: {
					position: "absolute",
					top: "40px",
					left: "40px",
					right: "40px",
					bottom: "40px",
					border: "1px solid #ccc",
					background: "#fff",
					overflow: "auto",
					WebkitOverflowScrolling: "touch",
					borderRadius: "4px",
					outline: "none",
					padding: "20px"
				}
			}, (0, f.polyfill)(E), e.default = E;
		})), Ao = s(((e, t) => {
			Object.defineProperty(e, "__esModule", { value: !0 });
			var n = r(ko());
			function r(e) {
				return e && e.__esModule ? e : { default: e };
			}
			e.default = n.default, t.exports = e.default;
		})), jo = u(J()), Mo = u(Ao()), No = (e) => (0, G.jsx)("svg", {
			viewBox: "0 0 19 19",
			xmlns: "http://www.w3.org/2000/svg",
			...e,
			children: (0, G.jsxs)("g", { children: [(0, G.jsx)("path", { d: "m12.936 0 5 4.5v12.502l-1.504-.001v.003h1.504v1.499h-5v-1.501l3.496-.001V5.208L12.21 1.516 3.436 1.5v15.504l3.5-.001v1.5h-5V0h11Z" }), (0, G.jsx)("path", { d: "m10.374 9.463.085.072.477.464L11 10v.06l3.545 3.453-1.047 1.075L11 12.155 11 19H9v-6.9l-2.424 2.476-1.072-1.05L9.4 9.547a.75.75 0 0 1 .974-.084ZM12.799 1.5l-.001 2.774h3.645v1.5h-5.144V1.5z" })] })
		}), Po = class extends y.Component {
			static contextType = ra;
			constructor(e) {
				super(e), this.state = {
					isModalOpen: !1,
					editorDataValue: ""
				}, this.textarea = y.createRef();
			}
			render() {
				return [y.createElement(W, {
					text: "Set editor data",
					icon: y.createElement(No, null),
					isEnabled: !!this.props.editor,
					onClick: () => this.setState({ isModalOpen: !0 }),
					key: "button"
				}), y.createElement(Mo.default, {
					isOpen: this.state.isModalOpen,
					appElement: this.context.document.querySelector(".ck-inspector-wrapper"),
					onAfterOpen: this._handleModalAfterOpen.bind(this),
					overlayClassName: "ck-inspector-modal ck-inspector-quick-actions__set-data-modal",
					className: "ck-inspector-quick-actions__set-data-modal__content",
					onRequestClose: this._closeModal.bind(this),
					portalClassName: "ck-inspector-portal",
					shouldCloseOnEsc: !0,
					shouldCloseOnOverlayClick: !0,
					key: "modal"
				}, y.createElement("h2", null, "Set editor data"), y.createElement("textarea", {
					autoFocus: !0,
					ref: this.textarea,
					value: this.state.editorDataValue,
					placeholder: "Paste HTML here...",
					onChange: this._handlDataChange.bind(this),
					onKeyPress: (e) => {
						e.key == "Enter" && e.shiftKey && this._setEditorDataAndCloseModal();
					}
				}), y.createElement("div", { className: "ck-inspector-quick-actions__set-data-modal__buttons" }, y.createElement("button", {
					type: "button",
					onClick: () => {
						this.setState({ editorDataValue: this.props.editor.getData() }), this.textarea.current.focus();
					}
				}, "Load data"), y.createElement("button", {
					type: "button",
					title: "Cancel (Esc)",
					onClick: this._closeModal.bind(this)
				}, "Cancel"), y.createElement("button", {
					type: "button",
					title: "Set editor data (⇧+Enter)",
					onClick: this._setEditorDataAndCloseModal.bind(this)
				}, "Set data")))];
			}
			_setEditorDataAndCloseModal() {
				this.props.editor.setData(this.state.editorDataValue), this._closeModal();
			}
			_closeModal() {
				this.setState({ isModalOpen: !1 });
			}
			_handlDataChange(e) {
				this.setState({ editorDataValue: e.target.value });
			}
			_handleModalAfterOpen() {
				this.setState({ editorDataValue: this.props.editor.getData() }), this.textarea.current.select();
			}
		}, Fo = (e) => (0, G.jsx)("svg", {
			viewBox: "0 0 19 19",
			xmlns: "http://www.w3.org/2000/svg",
			...e,
			children: (0, G.jsxs)("g", { children: [(0, G.jsx)("path", { d: "m12.936 0 5 4.5v14.003h-4.503L14.936 17h-10l1.503 1.503H1.936V0h11Zm-9.5 1.5v15.504h12.996V5.208L12.21 1.516 3.436 1.5Z" }), (0, G.jsx)("path", { d: "m12.799 1.5-.001 2.774h3.645v1.5h-5.144V1.5zM9.675 18.859l-.085-.072-4.086-3.978 1.047-1.075L9 16.119 9 9h2v7.273l2.473-2.526 1.072 1.049-3.896 3.979a.75.75 0 0 1-.974.084Z" })] })
		}), Io = (e) => (0, G.jsx)("svg", {
			viewBox: "0 0 19 19",
			xmlns: "http://www.w3.org/2000/svg",
			...e,
			children: (0, G.jsx)("path", { d: "m3.144 15.748 2.002 1.402-1.976.516-.026-1.918ZM2.438 3.391l15.346 11.023-.875 1.218-5.202-3.736-2.877 4.286.006.005-3.055.797-2.646-1.852-.04-2.95-.006-.005.006-.008v-.025l.01.008L6.02 7.81l-4.457-3.2.876-1.22ZM7.25 8.695l-2.13 3.198 3.277 2.294 2.104-3.158-3.25-2.334ZM14.002 0l2.16 1.512-.856 1.222c.828.967 1.144 2.141.432 3.158l-2.416 3.599-1.214-.873 2.396-3.593.005.003c.317-.452-.16-1.332-1.064-1.966-.891-.624-1.865-.776-2.197-.349l-.006-.004-2.384 3.575-1.224-.879 2.376-3.539c.674-.932 1.706-1.155 3.096-.668l.046.018.85-1.216Z" })
		}), Lo = (e) => (0, G.jsx)("svg", {
			viewBox: "0 0 19 19",
			xmlns: "http://www.w3.org/2000/svg",
			...e,
			children: (0, G.jsx)("path", { d: "M11.28 1a1 1 0 0 1 .948.684l.333 1 .018.066H16a.75.75 0 0 1 .102 1.493L16 4.25h-.5V16a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2V4.25H3a.75.75 0 0 1-.102-1.493L3 2.75h3.42a1 1 0 0 1 .019-.066l.333-1A1 1 0 0 1 7.721 1h3.558ZM14 4.5H5V16a.5.5 0 0 0 .41.492l.09.008h8a.5.5 0 0 0 .492-.41L14 16V4.5ZM7.527 6.06v8.951h-1V6.06h1Zm5 0v8.951h-1V6.06h1ZM10 6.06v8.951H9V6.06h1Z" })
		}), Ro = (e) => (0, G.jsx)("svg", {
			viewBox: "0 0 20 20",
			xmlns: "http://www.w3.org/2000/svg",
			...e,
			children: (0, G.jsxs)("g", { children: [(0, G.jsx)("path", { d: "M2.284 2.498c-.239.266-.184.617-.184 1.002V4H2a.5.5 0 0 0-.492.41L1.5 4.5V17a1 1 0 0 0 .883.993L2.5 18h10a1 1 0 0 0 .97-.752l-.081-.062c.438.368.976.54 1.507.526a2.5 2.5 0 0 1-2.232 1.783l-.164.005h-10a2.5 2.5 0 0 1-2.495-2.336L0 17V4.5a2 2 0 0 1 1.85-1.995L2 2.5l.284-.002zm10.532 0L13 2.5a2 2 0 0 1 1.995 1.85L15 4.5v2.28a2.243 2.243 0 0 0-1.5.404V4.5a.5.5 0 0 0-.41-.492L13 4v-.5l-.007-.144c-.031-.329.032-.626-.177-.858z" }), (0, G.jsx)("path", { d: "m6 .49-.144.006a1.75 1.75 0 0 0-1.41.94l-.029.058.083-.004c-.69 0-1.25.56-1.25 1.25v1c0 .69.56 1.25 1.25 1.25h6c.69 0 1.25-.56 1.25-1.25v-1l-.006-.128a1.25 1.25 0 0 0-1.116-1.116l-.046-.002-.027-.058A1.75 1.75 0 0 0 9 .49H6zm0 1.5h3a.25.25 0 0 1 .25.25l.007.102A.75.75 0 0 0 10 2.99h.25v.5h-5.5v-.5H5a.75.75 0 0 0 .743-.648l.007-.102A.25.25 0 0 1 6 1.99zM15.374 8.54a.75.75 0 0 1-.093 1.056l-2.33 1.954h6.127a.75.75 0 0 1 0 1.501h-5.949l2.19 1.837a.75.75 0 1 1-.966 1.15l-3.788-3.18a.747.747 0 0 1-.21-.285.75.75 0 0 1 .17-.945l3.792-3.182a.75.75 0 0 1 1.057.093z" })] })
		}), zo = (e) => (0, G.jsx)("svg", {
			viewBox: "0 0 20 20",
			xmlns: "http://www.w3.org/2000/svg",
			...e,
			children: (0, G.jsx)("path", {
				fill: "#4fa800",
				d: "M6.972 16.615a.997.997 0 0 1-.744-.292l-4.596-4.596a1 1 0 1 1 1.414-1.414l3.926 3.926 9.937-9.937a1 1 0 0 1 1.414 1.415L7.717 16.323a.997.997 0 0 1-.745.292z"
			})
		}), Bo = "Lock from Inspector (@ckeditor/ckeditor5-inspector)", Vo = class extends y.Component {
			static contextType = ra;
			constructor(e) {
				super(e), this.state = {
					isShiftKeyPressed: !1,
					wasEditorDataJustCopied: !1
				}, this._keyDownHandler = this._handleKeyDown.bind(this), this._keyUpHandler = this._handleKeyUp.bind(this), this._readOnlyHandler = this._handleReadOnly.bind(this), this._editorDataJustCopiedTimeout = null;
			}
			render() {
				return y.createElement("div", { className: "ck-inspector-editor-quick-actions" }, y.createElement(W, {
					text: "Log editor",
					icon: y.createElement(Ta, null),
					isEnabled: !!this.props.editor,
					onClick: () => console.log(this.props.editor)
				}), this._getLogButton(), y.createElement(Po, { editor: this.props.editor }), y.createElement(W, {
					text: "Toggle read only",
					icon: y.createElement(Io, null),
					isOn: this.props.isReadOnly,
					isEnabled: !!this.props.editor,
					onClick: this._readOnlyHandler
				}), y.createElement(W, {
					text: "Destroy editor",
					icon: y.createElement(Lo, null),
					isEnabled: !!this.props.editor,
					onClick: () => {
						this.props.editor.destroy();
					}
				}));
			}
			componentDidMount() {
				this.context.document.addEventListener("keydown", this._keyDownHandler), this.context.document.addEventListener("keyup", this._keyUpHandler);
			}
			componentWillUnmount() {
				this.context.document.removeEventListener("keydown", this._keyDownHandler), this.context.document.removeEventListener("keyup", this._keyUpHandler), clearTimeout(this._editorDataJustCopiedTimeout);
			}
			_getLogButton() {
				let e, t;
				return this.state.wasEditorDataJustCopied ? (e = y.createElement(zo, null), t = "Data copied to clipboard.") : (e = this.state.isShiftKeyPressed ? y.createElement(Ro, null) : y.createElement(Fo, null), t = "Log editor data (press with Shift to copy)"), y.createElement(W, {
					text: t,
					icon: e,
					className: this.state.wasEditorDataJustCopied ? "ck-inspector-button_data-copied" : "",
					isEnabled: !!this.props.editor,
					onClick: this._handleLogEditorDataClick.bind(this)
				});
			}
			_handleLogEditorDataClick({ shiftKey: e }) {
				e ? ((0, jo.default)(this.props.editor.getData()), this.setState({ wasEditorDataJustCopied: !0 }), clearTimeout(this._editorDataJustCopiedTimeout), this._editorDataJustCopiedTimeout = setTimeout(() => {
					this.setState({ wasEditorDataJustCopied: !1 });
				}, 3e3)) : console.log(this.props.editor.getData());
			}
			_handleKeyDown({ key: e }) {
				this.setState({ isShiftKeyPressed: e === "Shift" });
			}
			_handleKeyUp() {
				this.setState({ isShiftKeyPressed: !1 });
			}
			_handleReadOnly() {
				this.props.editor.isReadOnly ? this.props.editor.disableReadOnlyMode(Bo) : this.props.editor.enableReadOnlyMode(Bo);
			}
		}, Ho = I(({ editors: e, currentEditorName: t, currentEditorGlobals: { isReadOnly: n } }) => ({
			editor: e.get(t),
			isReadOnly: n
		}), {})(Vo), Uo = (e) => (0, G.jsx)("svg", {
			viewBox: "0 0 19 19",
			xmlns: "http://www.w3.org/2000/svg",
			...e,
			children: (0, G.jsx)("path", { d: "M17.03 6.47a.75.75 0 0 1 .073.976l-.072.084-6.984 7a.75.75 0 0 1-.977.073l-.084-.072-7.016-7a.75.75 0 0 1 .976-1.134l.084.072 6.485 6.47 6.454-6.469a.75.75 0 0 1 .977-.073l.084.072Z" })
		}), Wo = "100", Go = 30, Ko = {
			position: "fixed",
			bottom: "0",
			left: "0",
			right: "0",
			top: "auto"
		}, qo = class extends y.Component {
			static contextType = ra;
			constructor(e) {
				super(e), this.handleInspectorResize = this.handleInspectorResize.bind(this);
			}
			componentDidMount() {
				es(this.context.document, this.props.height), this.context.document.body.style.setProperty("--ck-inspector-collapsed-height", `${Go}px`);
			}
			handleInspectorResize(e, t, n) {
				let r = n.style.height;
				this.props.setHeight(r), es(this.context.document, r);
			}
			render() {
				let e = this.context.document.body;
				return this.props.isCollapsed ? (e.classList.remove("ck-inspector-body-expanded"), e.classList.add("ck-inspector-body-collapsed")) : (e.classList.remove("ck-inspector-body-collapsed"), e.classList.add("ck-inspector-body-expanded")), y.createElement(vi, {
					bounds: "window",
					enableResizing: { top: !this.props.isCollapsed },
					disableDragging: !0,
					minHeight: Wo,
					maxHeight: "100%",
					style: Ko,
					className: ["ck-inspector", this.props.isCollapsed ? "ck-inspector_collapsed" : ""].join(" "),
					position: {
						x: 0,
						y: "100%"
					},
					size: {
						width: "100%",
						height: this.props.isCollapsed ? Go : this.props.height
					},
					onResizeStop: this.handleInspectorResize
				}, y.createElement(Si, {
					onTabChange: this.props.setActiveTab,
					contentBefore: y.createElement(Yo, { key: "docs" }),
					activeTab: this.props.activeTab,
					contentAfter: [
						y.createElement($o, { key: "selector" }),
						y.createElement("span", {
							className: "ck-inspector-separator",
							key: "separator-a"
						}),
						y.createElement(Ho, { key: "quick-actions" }),
						y.createElement("span", {
							className: "ck-inspector-separator",
							key: "separator-b"
						}),
						y.createElement(Zo, { key: "inspector-toggle" })
					]
				}, y.createElement(Va, { label: "Model" }), y.createElement(Qa, { label: "View" }), y.createElement(ao, { label: "Commands" }), y.createElement(uo, { label: "Schema" })));
			}
			componentWillUnmount() {
				let e = this.context.document.body;
				e.classList.remove("ck-inspector-body-expanded"), e.classList.remove("ck-inspector-body-collapsed");
			}
		}, Jo = I(({ editors: e, currentEditorName: t, ui: { isCollapsed: n, height: r, activeTab: i } }) => ({
			isCollapsed: n,
			height: r,
			editors: e,
			currentEditorName: t,
			activeTab: i
		}), {
			toggleIsCollapsed: mt,
			setHeight: ht,
			setEditors: _t,
			setCurrentEditorName: vt,
			setActiveTab: yt
		})(qo), Yo = class extends y.Component {
			render() {
				return y.createElement("a", {
					className: "ck-inspector-navbox__navigation__logo",
					title: "Go to the documentation",
					href: "https://ckeditor.com/docs/ckeditor5/latest/",
					target: "_blank",
					rel: "noopener noreferrer"
				}, "CKEditor documentation");
			}
		}, Xo = class extends y.Component {
			static contextType = ra;
			constructor(e) {
				super(e), this.handleShortcut = this.handleShortcut.bind(this);
			}
			render() {
				return y.createElement(W, {
					text: "Toggle inspector",
					icon: y.createElement(Uo, null),
					onClick: this.props.toggleIsCollapsed,
					title: "Toggle inspector (Alt+F12)",
					className: ["ck-inspector-navbox__navigation__toggle", this.props.isCollapsed ? " ck-inspector-navbox__navigation__toggle_up" : ""].join(" ")
				});
			}
			componentDidMount() {
				this.context.window.addEventListener("keydown", this.handleShortcut);
			}
			componentWillUnmount() {
				this.context.window.removeEventListener("keydown", this.handleShortcut);
			}
			handleShortcut(e) {
				ts(e) && this.props.toggleIsCollapsed();
			}
		}, Zo = I(({ ui: { isCollapsed: e } }) => ({ isCollapsed: e }), { toggleIsCollapsed: mt })(Xo), Qo = class extends y.Component {
			render() {
				return y.createElement("div", {
					className: "ck-inspector-editor-selector",
					key: "editor-selector"
				}, this.props.currentEditorName ? y.createElement(ta, {
					id: "inspector-editor-selector",
					label: "Instance",
					value: this.props.currentEditorName,
					options: [...this.props.editors].map(([e]) => e),
					onChange: (e) => this.props.setCurrentEditorName(e.target.value)
				}) : "");
			}
		}, $o = I(({ currentEditorName: e, editors: t }) => ({
			currentEditorName: e,
			editors: t
		}), { setCurrentEditorName: vt })(Qo);
		function es(e, t) {
			e.body.style.setProperty("--ck-inspector-height", t);
		}
		function ts(e) {
			return e.altKey && !e.shiftKey && !e.ctrlKey && e.key === "F12";
		}
		window.CKEDITOR_INSPECTOR_VERSION = "5.0.3";
		var ns = class e {
			constructor() {
				L.warn("[CKEditorInspector] Whoops! Looks like you tried to create an instance of the CKEditorInspector class. To attach the inspector, use the static CKEditorInspector.attach( editor ) method instead. For the latest API, please refer to https://github.com/ckeditor/ckeditor5-inspector/blob/master/README.md. ");
			}
			static attach(...t) {
				let { CKEDITOR_VERSION: n } = window;
				if (n) {
					let [e] = n.split(".").map(Number);
					e < 34 && L.warn("[CKEditorInspector] The inspector requires using CKEditor 5 in version 34 or higher. If you cannot update CKEditor 5, consider downgrading the major version of the inspector to version 3.");
				} else L.warn("[CKEditorInspector] Could not determine a version of CKEditor 5. Some of the functionalities may not work as expected.");
				let { editors: r, options: i } = Et(t);
				for (let t in r) {
					let n = r[t];
					L.group("%cAttached the inspector to a CKEditor 5 instance. To learn more, visit https://ckeditor.com/docs/ckeditor5.", "font-weight: bold;"), L.log(`Editor instance "${t}"`, n), L.groupEnd(), e._editors.set(t, n), n.on("destroy", () => {
						e.detach(t);
					}), e._mount(i), e._updateEditorsState();
				}
				return Object.keys(r);
			}
			static attachToAll(t) {
				let n = document.querySelectorAll(".ck.ck-content.ck-editor__editable"), r = [];
				for (let i of n) {
					let n = i.ckeditorInstance;
					n && !e._isAttachedTo(n) && r.push(...e.attach(n, t));
				}
				return r;
			}
			static detach(t) {
				e._wrapper && (e._editors.delete(t), e._updateEditorsState());
			}
			static destroy() {
				if (!e._wrapper) return;
				b.unmountComponentAtNode(e._wrapper), e._editors.clear(), e._wrapper.remove();
				let t = e._store.getState(), n = t.editors.get(t.currentEditorName);
				n && e._editorListener.stopListening(n), e._editorListener = null, e._wrapper = null, e._store = null, e._teardown?.(), e._teardown = null;
			}
			static _updateEditorsState() {
				e._store.dispatch(_t(e._editors));
			}
			static _mount(t) {
				if (e._wrapper) return;
				let n = t.container || document.body, r = n.ownerDocument, i = r.defaultView || window, a = e._wrapper = r.createElement("div"), o, s;
				a.className = "ck-inspector-wrapper", n.appendChild(a);
				let c = [];
				if (r !== document) {
					for (let e of document.querySelectorAll("style")) if (e.textContent && e.textContent.includes("ck-inspector")) {
						let t = e.cloneNode(!0);
						t.dataset.ckInspectorClone = "true", r.head.appendChild(t), c.push(t);
					}
				}
				e._teardown = () => {
					for (let e of c) e.remove();
				}, e._editorListener = new tn({
					onModelChange() {
						let t = e._store;
						t.getState().ui.isCollapsed || (t.dispatch(ot()), t.dispatch(cr()));
					},
					onViewRender() {
						let t = e._store;
						t.getState().ui.isCollapsed || t.dispatch(wn());
					},
					onReadOnlyChange() {
						e._store.dispatch(bt());
					}
				}), e._store = E(wr, {
					editors: e._editors,
					currentEditorName: Ot(e._editors),
					currentEditorGlobals: {},
					ui: { isCollapsed: t.isCollapsed }
				}), e._store.subscribe(() => {
					let t = e._store.getState(), n = t.editors.get(t.currentEditorName);
					o !== n && (o && e._editorListener.stopListening(o), n && e._editorListener.startListening(n), o = n);
				}), e._store.subscribe(() => {
					let t = e._store, n = t.getState().ui.isCollapsed, r = s && !n;
					s = n, r && (t.dispatch(ot()), t.dispatch(cr()), t.dispatch(wn()));
				}), b.render(y.createElement(ra.Provider, { value: {
					document: r,
					window: i
				} }, y.createElement(ae, { store: e._store }, y.createElement(Jo, null))), a);
			}
			static _isAttachedTo(t) {
				return [...e._editors.values()].includes(t);
			}
		};
		return ns._editors = /* @__PURE__ */ new Map(), ns._wrapper = null, ns;
	});
})))(), 1), Fe = function(e) {
	let t = e.plugins.get(y), n = $(e.ui.view.element), r = $(e.sourceElement), i = `ckeditor${Math.floor(Math.random() * 1e9)}`, a = [
		"keypress",
		"keyup",
		"change",
		"focus",
		"blur",
		"click",
		"mousedown",
		"mouseup"
	].map((e) => `${e}.${i}`).join(" ");
	t.on("change:isSourceEditingMode", () => {
		let e = n.find(".ck-source-editing-area");
		if (t.isSourceEditingMode) {
			let t = e.attr("data-value");
			e.on(a, () => {
				t !== (t = e.attr("data-value")) && r.val(t);
			});
		} else e.off(`.${i}`);
	});
}, Ie = function(e, t) {
	if (t.heading !== void 0) {
		var n = t.heading.options;
		n.find((e) => e.view === "h1") !== void 0 && e.keystrokes.set("Ctrl+Alt+1", () => e.execute("heading", { value: "heading1" })), n.find((e) => e.view === "h2") !== void 0 && e.keystrokes.set("Ctrl+Alt+2", () => e.execute("heading", { value: "heading2" })), n.find((e) => e.view === "h3") !== void 0 && e.keystrokes.set("Ctrl+Alt+3", () => e.execute("heading", { value: "heading3" })), n.find((e) => e.view === "h4") !== void 0 && e.keystrokes.set("Ctrl+Alt+4", () => e.execute("heading", { value: "heading4" })), n.find((e) => e.view === "h5") !== void 0 && e.keystrokes.set("Ctrl+Alt+5", () => e.execute("heading", { value: "heading5" })), n.find((e) => e.view === "h6") !== void 0 && e.keystrokes.set("Ctrl+Alt+6", () => e.execute("heading", { value: "heading6" })), n.find((e) => e.model === "paragraph") !== void 0 && e.keystrokes.set("Ctrl+Alt+p", "paragraph");
	}
}, Le = function(e, t) {
	let n = null, r = e.editing.view.document, i = e.plugins.get("ClipboardPipeline");
	r.on("clipboardOutput", (t, r) => {
		n = e.id;
	}), r.on("clipboardInput", async (r, a) => {
		let o = a.dataTransfer.getData("text/html");
		if (o && o.includes("<craft-entry") && (a.method != "drop" || n !== e.id) && (a.method == "paste" || a.method == "drop" && n !== e.id)) {
			let s = o, c = !1, l = Craft.siteId, u = null, d = null, f = e.getData(), p = [...o.matchAll(/data-entry-id="([0-9]+)[^>]*data-site-id="([0-9]+)/g)];
			r.stop();
			let m = $(e.ui.view.element), h = m.parents("form").data("elementEditor"), g = e.config.get("craftOwner");
			h ? await h.ensureIsDraftOrRevision() : g && (u = await g.prepare());
			let _ = m.parents(".input");
			if (_.length > 0) {
				let e = $(_[0]).find("div.ckeditor-container");
				e.length > 0 && (u = $(e[0]).data("element-id"));
			}
			u ??= h ? h.settings.elementId : e.config.get("nestedElementAttributes")?.ownerId, d = e.config.get("layoutElementUid") ?? m.parents(".field").data("layoutElement");
			for (let r = 0; r < p.length; r++) {
				let i = null;
				p[r][1] && (i = p[r][1]);
				let a = null;
				if (p[r][2] && (a = p[r][2]), i !== null) {
					let r = RegExp("data-entry-id=\"" + i + "\"");
					if (n !== e.id || r.test(f)) {
						let r = null;
						n !== e.id && (t.includes(Ee) ? r = e.config.get("entryTypeOptions").map((e) => e.value) : (Craft.cp.displayError(Craft.t("ckeditor", "This field doesn’t allow nested entries.")), c = !0)), await Craft.sendActionRequest("POST", "ckeditor/ckeditor/duplicate-nested-entry", { data: {
							entryId: i,
							targetSiteId: l,
							sourceSiteId: a,
							targetEntryTypeIds: r,
							targetOwnerId: u,
							targetLayoutElementUid: d
						} }).then((e) => {
							e.data.newEntryId && (s = s.replace("data-entry-id=\"" + i + "\"", "data-entry-id=\"" + e.data.newEntryId + "\"")), e.data.newSiteId && (s = s.replace("data-site-id=\"" + a + "\"", "data-site-id=\"" + e.data.newSiteId + "\""));
						}).catch((e) => {
							c = !0, Craft.cp.displayError(e?.response?.data?.message), console.error(e?.response?.data?.additionalMessage);
						});
					}
				}
			}
			c || (a.content = e.data.htmlProcessor.toView(s), i.fire("inputTransformation", a));
		}
	});
}, Re = async function(e, n) {
	typeof e == "string" && (e = document.querySelector(`#${e}`)), n.licenseKey = n.licenseKey || "GPL", n.attachTo = e;
	let r = await t.create(n);
	Craft.showCkeditorInspector && Craft.userIsAdmin && Pe.default.attach(r), r.editing.view.change((e) => {
		let t = r.editing.view.document.getRoot();
		if (n.accessibleFieldName !== void 0 && n.accessibleFieldName.length) {
			let r = t.getAttribute("aria-label");
			e.setAttribute("aria-label", n.accessibleFieldName + ", " + r, t);
		}
		n.describedBy !== void 0 && n.describedBy.length && e.setAttribute("aria-describedby", n.describedBy, t);
	});
	let i = $(r.ui.view.element).parents("form").data("elementEditor");
	if (!i) r.updateSourceElement();
	else {
		let e = r.sourceElement.name, t = $(r.sourceElement).val();
		i.pause(), r.updateSourceElement();
		let n = $(r.sourceElement).val();
		if (t !== n) {
			let r = i.$container.data("initialSerializedValue");
			typeof r == "string" && i.$container.data("initialSerializedValue", r.replace($.param({ [e]: t }), $.param({ [e]: n })));
		}
		i.resume();
	}
	return r.model.document.on("change:data", () => {
		r.updateSourceElement();
	}), n.plugins.includes(y) && Fe(r, y), n.plugins.includes(c) && Ie(r, n), Le(r, n.plugins), r;
};
export { Ee as CraftEntries, le as CraftImageInsertUI, ce as CraftImageTextAlternativeUI, Ne as CraftLink, ve as ImageEditor, he as ImageTransform, Re as create };
