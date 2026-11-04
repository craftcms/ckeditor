import "ckeditor5";
import { create } from "@craftcms/ckeditor";
import { cpConfig, t } from "@craftcms/cp";
// resources/assets/fieldsettings/src/ToolbarBuilder.js
var ToolbarBuilder_default = Garnish.Base.extend({
	$sourceContainer: null,
	$targetContainer: null,
	$input: null,
	value: null,
	components: {},
	drag: null,
	$items: null,
	draggingSourceItem: null,
	draggingSeparator: null,
	$insertion: null,
	showingInsertion: !1,
	closestItem: null,
	readOnly: !1,
	init: function(e, n, r = []) {
		this.$container = $(`#${e}`), this.$sourceContainer = this.$container.find(".ckeditor-tb--source .ck-toolbar__items"), this.$targetContainer = this.$container.find(".ckeditor-tb--target .ck-toolbar__items"), this.$input = this.$container.find("input"), this.value = JSON.parse(this.$input.val()), this.readOnly = $(`#${e}`).hasClass("disabled");
		let i = document.createElement("DIV");
		i.classList.add("hidden");
		let a = document.createElement("DIV");
		i.appendChild(a), this.$container.append(i), create(a, {
			linkOptions: [{ elementType: "CraftCms\\Cms\\Asset\\Elements\\Asset" }],
			imageSources: ["*"],
			entryTypeOptions: [{
				label: "fake",
				value: "fake"
			}],
			plugins: r
		}).then((e) => {
			let r = e.ui.componentFactory;
			for (let e of r.names()) this.components[e] = r.create(e);
			let i = JSON.parse(this.$container.attr("data-available-items"));
			for (let e = 0; e < i.length; e++) {
				let n = i[e];
				if (n.length > 1) {
					let r = this.value.findIndex((e) => n.some((n) => n.button === e));
					if (r !== -1) {
						for (let a = 0; a < n.length; a++) if (this.value[r + a] !== n[a].button) {
							i.splice(e, 1, ...n.map((e) => [e])), e += n.length - 1;
							break;
						}
					}
				}
			}
			this.drag = this.readOnly ? $() : new Garnish.DragDrop({
				dropTargets: this.$targetContainer,
				helper: (e) => {
					let n = $("<div class=\"offset-drag-helper ck ck-reset_all ck-editor ck-rounded-corners\"/>"), r = $("<div class=\"ck ck-toolbar\"/>").appendTo(n);
					return e.appendTo(r), n;
				},
				moveHelperToCursor: !0,
				onDragStart: () => {
					Garnish.$bod.addClass("dragging");
					let e = this.drag.$draggee;
					if (this.draggingSourceItem = $.contains(this.$sourceContainer[0], e[0]), this.draggingSeparator = e.hasClass("ckeditor-tb--separator"), this.$insertion = $("<div class=\"ckeditor-tb--insertion\"/>").css({
						width: e.outerWidth(),
						height: e.outerHeight()
					}), this.draggingSourceItem) {
						if (this.draggingSeparator) e.css("visibility", "");
						else {
							let n = cpConfig().get("orientation") === "ltr" ? "margin-right" : "margin-left", r = -1 * e.outerWidth();
							e.stop().velocity({ [n]: r }, 200, () => {
								e.addClass("hidden");
							});
						}
					} else e.addClass("hidden"), this.$insertion.insertBefore(e), this.showingInsertion = !0;
					this.setMidpoints();
				},
				onDrag: () => {
					this.checkForNewClosestItem();
				},
				onDragStop: () => {
					Garnish.$bod.removeClass("dragging");
					let e = this.drag.$draggee;
					if (this.checkForNewClosestItem(), this.showingInsertion) {
						if (this.draggingSourceItem) {
							let r;
							if (this.draggingSeparator) r = this.renderSeparator();
							else {
								let a = e.data("componentNames");
								r = this.renderComponentGroup(a);
								for (let e of a) {
									let r = i.flat().find(({ button: n }) => n === e);
									r && r.configOption && n.addSetting(r.configOption);
								}
							}
							r.data("sourceItem", e[0]), r.css("visibility", "hidden"), this.$insertion.replaceWith(r), this.drag.$draggee = r;
						} else this.$insertion.replaceWith(e), e.removeClass("hidden");
					} else {
						if (!this.draggingSourceItem) {
							let r = $(e.data("sourceItem"));
							if (e.remove(), this.drag.$draggee = e = r, !this.draggingSeparator) for (let e of r.data("componentNames")) {
								let r = i.flat().find(({ button: n }) => n === e);
								r && r.configOption && n.removeSetting(r.configOption);
							}
						}
						if (!this.draggingSeparator) {
							e.removeClass("hidden");
							let n = cpConfig().get("orientation") === "ltr" ? "margin-right" : "margin-left", r = e.css(n);
							e.css(n, "");
							let i = e.css(n);
							e.css(n, r), e.stop().velocity({ [n]: i }, 200, () => {
								e.css(n, "");
							});
						}
					}
					this.drag.returnHelpersToDraggees(), this.$items = this.$targetContainer.children(), this.value = [];
					for (let e of this.$items.toArray()) {
						let n = $(e);
						n.hasClass("ckeditor-tb--separator") ? this.value.push("|") : this.value.push(...n.data("componentNames"));
					}
					this.$input.val(JSON.stringify(this.value));
				}
			});
			let a = {};
			for (let e of i) {
				let n = this.renderComponentGroup(e);
				n && (n.appendTo(this.$sourceContainer), a[e.map((e) => e.button).join(",")] = n[0], this.value.includes(e[0].button) && n.addClass("hidden"));
			}
			a["|"] = this.renderSeparator().appendTo(this.$sourceContainer)[0], this.$items = $();
			for (let e = 0; e < this.value.length; e++) {
				let n = this.value[e], r, o;
				if (n === "|") r = this.renderSeparator().appendTo(this.$targetContainer), o = "|";
				else {
					let a = i.find((e) => e.some((e) => e.button === n));
					if (!a || (r = this.renderComponentGroup(a), !r)) continue;
					r.appendTo(this.$targetContainer), o = a.map((e) => e.button).join(","), e += a.length - 1;
				}
				r.data("sourceItem", a[o]), this.$items = this.$items.add(r);
			}
		}).catch(console.error);
	},
	renderSeparator: function() {
		let e = $("<div class=\"ckeditor-tb--item ckeditor-tb--separator\" data-cke-tooltip-text=\"Separator\"><span class=\"ck ck-toolbar__separator\"/></div>");
		return this.readOnly ? this.drag.add(e) : this.drag.addItems(e), e;
	},
	renderComponentGroup: function(e) {
		e = e.map((e) => typeof e == "string" ? e : e.button);
		let n = [], r = [];
		for (let i of e) {
			let e;
			try {
				e = this.renderComponent(i);
			} catch (e) {
				console.warn(e);
				continue;
			}
			n.push(e);
			let a = (e.is("[data-cke-tooltip-text]") ? e : e.find("[data-cke-tooltip-text]")).attr("data-cke-tooltip-text");
			r.push(a ? a.replace(/ \(.*\)$/, "") : `${i[0].toUpperCase()}${i.slice(1)}`);
		}
		if (!n.length) return !1;
		let i = $("<div class=\"ckeditor-tb--item\"/>").append(n);
		return i.attr("data-cke-tooltip-text", r.join(", ")), i.data("componentNames", e), this.readOnly ? this.drag.add(i) : this.drag.addItems(i), i;
	},
	renderComponent: function(e) {
		let n = this.components[e];
		if (!n) throw `Missing component: ${e}`;
		n.isRendered || n.render();
		let r = $(n.element.outerHTML);
		return r.data("componentName", e), r;
	},
	getClosestItem: function() {
		if (!Garnish.hitTest(this.drag.mouseX, this.drag.mouseY, this.$targetContainer)) return !1;
		if (!this.$items.length) return null;
		let e = this.$items.toArray();
		this.showingInsertion && e.push(this.$insertion[0]);
		let n = e.map((e) => {
			let n = $.data(e, "midpoint");
			return Garnish.getDist(n.left, n.top, this.drag.mouseX, this.drag.mouseY);
		}), r = Math.min(...n);
		return e[n.indexOf(r)];
	},
	checkForNewClosestItem: function() {
		let e = this.getClosestItem();
		e === !1 ? this.showingInsertion &&= (this.$insertion.remove(), !1) : e !== this.$insertion[0] && (e ? this.drag.mouseX < $.data(e, "midpoint").left ? this.$insertion.insertBefore(e) : this.$insertion.insertAfter(e) : this.$insertion.appendTo(this.$targetContainer), this.showingInsertion = !0, this.setMidpoints());
	},
	setMidpoints: function() {
		let e = this.$items.toArray();
		this.showingInsertion && e.push(this.$insertion[0]);
		for (let n of e) {
			let e = $(n), r = e.offset(), i = r.left + e.outerWidth() / 2, a = r.top + e.outerHeight() / 2;
			e.data("midpoint", {
				left: i,
				top: a
			});
		}
	}
}), ConfigOptions_default = Garnish.Base.extend({
	jsonSchemaUri: null,
	jsonSchema: null,
	mode: null,
	lastCodeMode: null,
	$container: null,
	$modeInput: null,
	$jsonContainer: null,
	$jsContainer: null,
	$fileContainer: null,
	jsonEditor: null,
	jsEditor: null,
	defaults: null,
	init: function(id, jsonSchemaUri, mode, hasFiles, jsonSchema = null) {
		this.jsonSchemaUri = jsonSchemaUri, this.jsonSchema = jsonSchema, this.mode = mode, this.mode !== "file" && (this.lastCodeMode = mode), this.$container = $(`#${id}`), this.$modeInput = $(`#${id}-mode`), this.$jsonContainer = $(`#${id}-json-container`), this.$jsContainer = $(`#${id}-js-container`), this.$fileContainer = $(`#${id}-file-container`), this.jsonEditor = document.getElementById(`${id}-json`), this.jsEditor = document.getElementById(`${id}-js`);
		const $modePicker = this.$container.children("craft-button-group");
		this.defaults = {};
		const $containers = this.$jsonContainer.add(this.$jsContainer).add(this.$fileContainer);
		new Craft.Listbox($modePicker, { onChange: (e) => {
			switch (this.mode = e.data("mode"), (this.mode !== "file" || hasFiles) && this.$modeInput.val(this.mode), $containers.addClass("hidden"), this.mode) {
				case "json":
					if (this.lastCodeMode === "js") {
						let e = this.getValue(this.jsEditor);
						if (this.jsContainsFunctions(e) && !confirm(t("Your JavaScript config contains functions. If you switch to JSON, they will be lost. Would you like to continue?", {}, "ckeditor"))) {
							$modePicker.children("[data-mode=\"js\"]")[0]?.click();
							break;
						}
						let n = this.js2json(e);
						this.setValue(this.jsonEditor, n || "{\n  \n}"), this.setValue(this.jsEditor, "");
					}
					this.$jsonContainer.removeClass("hidden");
					break;
				case "js":
					if (this.lastCodeMode === "json") {
						let e = this.getValue(this.jsonEditor), n = this.json2js(e);
						this.setValue(this.jsEditor, n || "return {\n  \n}"), this.setValue(this.jsonEditor, "");
					}
					this.$jsContainer.removeClass("hidden");
					break;
				case "file": this.$fileContainer.removeClass("hidden");
			}
			this.mode !== "file" && (this.lastCodeMode = this.mode);
		} }), this.jsonEditor.addEventListener("paste", (ev) => {
			const pastedContent = ev.clipboardData?.getData("text") ?? "";
			let config;
			try {
				eval(`config = {${pastedContent}}`);
			} catch {
				return;
			}
			const json = JSON.stringify(config, null, 2), trimmed = json.substring(1, json.length - 1).trim();
			if (!trimmed) return;
			ev.preventDefault();
			const { selectionStart, selectionEnd, value } = this.jsonEditor;
			this.setValue(this.jsonEditor, value.slice(0, selectionStart) + trimmed + value.slice(selectionEnd)), this.jsonEditor.selectionStart = this.jsonEditor.selectionEnd = selectionStart + trimmed.length;
		});
	},
	getValue: function(e) {
		return e.value;
	},
	setValue: function(e, n) {
		e.value = n, e.dispatchEvent(new Event("input", { bubbles: !0 }));
	},
	getConfig: function() {
		let e;
		if (this.mode === "json") e = this.getValue(this.jsonEditor).trim() || "{}";
		else {
			let n = this.getValue(this.jsEditor).trim();
			if (e = n ? this.js2json(n) : "{}", e === !1) return !1;
		}
		try {
			let n = JSON.parse(e);
			return $.isPlainObject(n) ? n : !1;
		} catch {
			return !1;
		}
	},
	setConfig: function(e) {
		let n = this.config2json(e);
		if (this.mode === "json") this.setValue(this.jsonEditor, n);
		else {
			let e = this.json2js(n);
			this.setValue(this.jsEditor, e || "return {\n  \n}");
		}
	},
	addSetting: function(e) {
		let n = this.getConfig();
		n && n[e] === void 0 && (this.defaults[e] === void 0 && (this.populateDefault(e), this.defaults[e] === void 0) || (n[e] = this.defaults[e], this.setConfig(n)));
	},
	removeSetting: function(e) {
		let n = this.getConfig();
		n && n[e] !== void 0 && (this.defaults[e] = n[e], delete n[e], this.setConfig(n));
	},
	populateDefault: function(e) {
		let n;
		if (n = this.jsonSchema, !n) {
			console.warn("Couldn’t get config options JSON schema.");
			return;
		}
		if (!n.$defs || !n.$defs.EditorConfig || !n.$defs.EditorConfig.properties) {
			console.warn("Config options JSON schema is missing $defs.EditorConfig.properties");
			return;
		}
		if (!n.$defs.EditorConfig.properties[e]) return;
		let r = n.$defs.EditorConfig.properties[e];
		if (r.default) {
			this.defaults[e] = r.default;
			return;
		}
		if (!r.$ref) return;
		let i = r.$ref.match(/^#\/\$defs\/(\w+)/);
		if (!i) return;
		let a = i[1];
		n.$defs[a] && n.$defs[a].default && (this.defaults[e] = n.$defs[a].default);
	},
	replacer: function(e, n) {
		return typeof n == "function" ? "__HAS__FUNCTION__" : n;
	},
	jsContainsFunctions: function(e) {
		let n = this.getValidJsonConfig(e);
		return !!(n === !1 || JSON.stringify(n, this.replacer, 2).match(/__HAS__FUNCTION__/));
	},
	config2json: function(e) {
		let n = JSON.stringify(e, null, 2);
		return n === "{}" && (n = "{\n  \n}"), n;
	},
	getValidJsonConfig: function(js) {
		const m = (js || "").match(/return\s*(\{[\w\W]*})/);
		if (!m) return !1;
		let config;
		try {
			eval(`config = ${m[1]};`);
		} catch {
			return !1;
		}
		return config;
	},
	js2json: function(e) {
		let n = this.getValidJsonConfig(e);
		return n !== !1 && this.config2json(n);
	},
	json2js: function(e) {
		let n;
		try {
			n = JSON.parse(e);
		} catch {
			return !1;
		}
		if (!$.isPlainObject(n)) return !1;
		let r = this.jsify(n, "");
		return r === "{\n}" && (r = "{\n  \n}"), `return ${r}`;
	},
	jsify: function(e, n) {
		let r;
		if (Array.isArray(e)) {
			r = "[\n";
			for (let i of e) r += `${n}  ${this.jsify(i, n + "  ")},\n`;
			r += `${n}]`;
		} else if ($.isPlainObject(e)) {
			r = "{\n";
			for (let [i, a] of Object.entries(e)) r += `${n}  ${i}: ${this.jsify(a, n + "  ")},\n`;
			r += `${n}}`;
		} else r = typeof e == "string" && !e.match(/[\r\n']/) ? `'${e}'` : JSON.stringify(e);
		return r;
	}
}), CssOptions_default = Garnish.Base.extend({
	mode: null,
	$container: null,
	$modeInput: null,
	$cssContainer: null,
	$fileContainer: null,
	init: function(e, n, r) {
		this.mode = n, this.$container = $(`#${e}`), this.$modeInput = $(`#${e}-mode`), this.$cssContainer = $(`#${e}-css-container`), this.$fileContainer = $(`#${e}-file-container`);
		let i = this.$container.children("craft-button-group"), a = this.$cssContainer.add(this.$fileContainer);
		new Craft.Listbox(i, { onChange: (e) => {
			switch (this.mode = e.data("mode"), (this.mode !== "file" || r) && this.$modeInput.val(this.mode), a.addClass("hidden"), this.mode) {
				case "css":
					this.$cssContainer.removeClass("hidden");
					break;
				case "file": this.$fileContainer.removeClass("hidden");
			}
		} });
	}
});
export { ConfigOptions_default as ConfigOptions, CssOptions_default as CssOptions, ToolbarBuilder_default as ToolbarBuilder };
