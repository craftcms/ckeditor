import "ckeditor5";
import { create } from "@craftcms/ckeditor";
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
	init: function(e, t, n = []) {
		this.$container = $(`#${e}`), this.$sourceContainer = this.$container.find(".ckeditor-tb--source .ck-toolbar__items"), this.$targetContainer = this.$container.find(".ckeditor-tb--target .ck-toolbar__items"), this.$input = this.$container.find("input"), this.value = JSON.parse(this.$input.val()), this.readOnly = $(`#${e}`).hasClass("disabled");
		let r = document.createElement("DIV");
		r.classList.add("hidden");
		let i = document.createElement("DIV");
		r.appendChild(i), this.$container.append(r), create(i, {
			linkOptions: [{ elementType: "CraftCms\\Cms\\Asset\\Elements\\Asset" }],
			imageSources: ["*"],
			entryTypeOptions: [{
				label: "fake",
				value: "fake"
			}],
			plugins: n
		}).then((e) => {
			let n = e.ui.componentFactory;
			for (let e of n.names()) this.components[e] = n.create(e);
			let r = JSON.parse(this.$container.attr("data-available-items"));
			for (let e = 0; e < r.length; e++) {
				let t = r[e];
				if (t.length > 1) {
					let n = this.value.findIndex((e) => t.some((t) => t.button === e));
					if (n !== -1) {
						for (let i = 0; i < t.length; i++) if (this.value[n + i] !== t[i].button) {
							r.splice(e, 1, ...t.map((e) => [e])), e += t.length - 1;
							break;
						}
					}
				}
			}
			this.drag = this.readOnly ? $() : new Garnish.DragDrop({
				dropTargets: this.$targetContainer,
				helper: (e) => {
					let t = $("<div class=\"offset-drag-helper ck ck-reset_all ck-editor ck-rounded-corners\"/>"), n = $("<div class=\"ck ck-toolbar\"/>").appendTo(t);
					return e.appendTo(n), t;
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
							let t = Craft.orientation === "ltr" ? "margin-right" : "margin-left", n = -1 * e.outerWidth();
							e.stop().velocity({ [t]: n }, 200, () => {
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
							let n;
							if (this.draggingSeparator) n = this.renderSeparator();
							else {
								let i = e.data("componentNames");
								n = this.renderComponentGroup(i);
								for (let e of i) {
									let n = r.flat().find(({ button: t }) => t === e);
									n && n.configOption && t.addSetting(n.configOption);
								}
							}
							n.data("sourceItem", e[0]), n.css("visibility", "hidden"), this.$insertion.replaceWith(n), this.drag.$draggee = n;
						} else this.$insertion.replaceWith(e), e.removeClass("hidden");
					} else {
						if (!this.draggingSourceItem) {
							let n = $(e.data("sourceItem"));
							if (e.remove(), this.drag.$draggee = e = n, !this.draggingSeparator) for (let e of n.data("componentNames")) {
								let n = r.flat().find(({ button: t }) => t === e);
								n && n.configOption && t.removeSetting(n.configOption);
							}
						}
						if (!this.draggingSeparator) {
							e.removeClass("hidden");
							let t = Craft.orientation === "ltr" ? "margin-right" : "margin-left", n = e.css(t);
							e.css(t, "");
							let r = e.css(t);
							e.css(t, n), e.stop().velocity({ [t]: r }, 200, () => {
								e.css(t, "");
							});
						}
					}
					this.drag.returnHelpersToDraggees(), this.$items = this.$targetContainer.children(), this.value = [];
					for (let e of this.$items.toArray()) {
						let t = $(e);
						t.hasClass("ckeditor-tb--separator") ? this.value.push("|") : this.value.push(...t.data("componentNames"));
					}
					this.$input.val(JSON.stringify(this.value));
				}
			});
			let i = {};
			for (let e of r) {
				let t = this.renderComponentGroup(e);
				t && (t.appendTo(this.$sourceContainer), i[e.map((e) => e.button).join(",")] = t[0], this.value.includes(e[0].button) && t.addClass("hidden"));
			}
			i["|"] = this.renderSeparator().appendTo(this.$sourceContainer)[0], this.$items = $();
			for (let e = 0; e < this.value.length; e++) {
				let t = this.value[e], n, a;
				if (t === "|") n = this.renderSeparator().appendTo(this.$targetContainer), a = "|";
				else {
					let i = r.find((e) => e.some((e) => e.button === t));
					if (!i || (n = this.renderComponentGroup(i), !n)) continue;
					n.appendTo(this.$targetContainer), a = i.map((e) => e.button).join(","), e += i.length - 1;
				}
				n.data("sourceItem", i[a]), this.$items = this.$items.add(n);
			}
		}).catch(console.error);
	},
	renderSeparator: function() {
		let e = $("<div class=\"ckeditor-tb--item ckeditor-tb--separator\" data-cke-tooltip-text=\"Separator\"><span class=\"ck ck-toolbar__separator\"/></div>");
		return this.readOnly ? this.drag.add(e) : this.drag.addItems(e), e;
	},
	renderComponentGroup: function(e) {
		e = e.map((e) => typeof e == "string" ? e : e.button);
		let t = [], n = [];
		for (let r of e) {
			let e;
			try {
				e = this.renderComponent(r);
			} catch (e) {
				console.warn(e);
				continue;
			}
			t.push(e);
			let i = (e.is("[data-cke-tooltip-text]") ? e : e.find("[data-cke-tooltip-text]")).attr("data-cke-tooltip-text");
			n.push(i ? i.replace(/ \(.*\)$/, "") : `${r[0].toUpperCase()}${r.slice(1)}`);
		}
		if (!t.length) return !1;
		let r = $("<div class=\"ckeditor-tb--item\"/>").append(t);
		return r.attr("data-cke-tooltip-text", n.join(", ")), r.data("componentNames", e), this.readOnly ? this.drag.add(r) : this.drag.addItems(r), r;
	},
	renderComponent: function(e) {
		let t = this.components[e];
		if (!t) throw `Missing component: ${e}`;
		t.isRendered || t.render();
		let n = $(t.element.outerHTML);
		return n.data("componentName", e), n;
	},
	getClosestItem: function() {
		if (!Garnish.hitTest(this.drag.mouseX, this.drag.mouseY, this.$targetContainer)) return !1;
		if (!this.$items.length) return null;
		let e = this.$items.toArray();
		this.showingInsertion && e.push(this.$insertion[0]);
		let t = e.map((e) => {
			let t = $.data(e, "midpoint");
			return Garnish.getDist(t.left, t.top, this.drag.mouseX, this.drag.mouseY);
		}), n = Math.min(...t);
		return e[t.indexOf(n)];
	},
	checkForNewClosestItem: function() {
		let e = this.getClosestItem();
		e === !1 ? this.showingInsertion &&= (this.$insertion.remove(), !1) : e !== this.$insertion[0] && (e ? this.drag.mouseX < $.data(e, "midpoint").left ? this.$insertion.insertBefore(e) : this.$insertion.insertAfter(e) : this.$insertion.appendTo(this.$targetContainer), this.showingInsertion = !0, this.setMidpoints());
	},
	setMidpoints: function() {
		let e = this.$items.toArray();
		this.showingInsertion && e.push(this.$insertion[0]);
		for (let t of e) {
			let e = $(t), n = e.offset(), r = n.left + e.outerWidth() / 2, i = n.top + e.outerHeight() / 2;
			e.data("midpoint", {
				left: r,
				top: i
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
						if (this.jsContainsFunctions(e) && !confirm(Craft.t("ckeditor", "Your JavaScript config contains functions. If you switch to JSON, they will be lost. Would you like to continue?"))) {
							$modePicker.children("[data-mode=\"js\"]")[0]?.click();
							break;
						}
						let t = this.js2json(e);
						this.setValue(this.jsonEditor, t || "{\n  \n}"), this.setValue(this.jsEditor, "");
					}
					this.$jsonContainer.removeClass("hidden");
					break;
				case "js":
					if (this.lastCodeMode === "json") {
						let e = this.getValue(this.jsonEditor), t = this.json2js(e);
						this.setValue(this.jsEditor, t || "return {\n  \n}"), this.setValue(this.jsonEditor, "");
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
	setValue: function(e, t) {
		e.value = t, e.dispatchEvent(new Event("input", { bubbles: !0 }));
	},
	getConfig: function() {
		let e;
		if (this.mode === "json") e = this.getValue(this.jsonEditor).trim() || "{}";
		else {
			let t = this.getValue(this.jsEditor).trim();
			if (e = t ? this.js2json(t) : "{}", e === !1) return !1;
		}
		try {
			let t = JSON.parse(e);
			return $.isPlainObject(t) ? t : !1;
		} catch {
			return !1;
		}
	},
	setConfig: function(e) {
		let t = this.config2json(e);
		if (this.mode === "json") this.setValue(this.jsonEditor, t);
		else {
			let e = this.json2js(t);
			this.setValue(this.jsEditor, e || "return {\n  \n}");
		}
	},
	addSetting: function(e) {
		let t = this.getConfig();
		t && t[e] === void 0 && (this.defaults[e] === void 0 && (this.populateDefault(e), this.defaults[e] === void 0) || (t[e] = this.defaults[e], this.setConfig(t)));
	},
	removeSetting: function(e) {
		let t = this.getConfig();
		t && t[e] !== void 0 && (this.defaults[e] = t[e], delete t[e], this.setConfig(t));
	},
	populateDefault: function(e) {
		let t;
		if (t = this.jsonSchema, !t) {
			console.warn("Couldn’t get config options JSON schema.");
			return;
		}
		if (!t.$defs || !t.$defs.EditorConfig || !t.$defs.EditorConfig.properties) {
			console.warn("Config options JSON schema is missing $defs.EditorConfig.properties");
			return;
		}
		if (!t.$defs.EditorConfig.properties[e]) return;
		let n = t.$defs.EditorConfig.properties[e];
		if (n.default) {
			this.defaults[e] = n.default;
			return;
		}
		if (!n.$ref) return;
		let r = n.$ref.match(/^#\/\$defs\/(\w+)/);
		if (!r) return;
		let i = r[1];
		t.$defs[i] && t.$defs[i].default && (this.defaults[e] = t.$defs[i].default);
	},
	replacer: function(e, t) {
		return typeof t == "function" ? "__HAS__FUNCTION__" : t;
	},
	jsContainsFunctions: function(e) {
		let t = this.getValidJsonConfig(e);
		return !!(t === !1 || JSON.stringify(t, this.replacer, 2).match(/__HAS__FUNCTION__/));
	},
	config2json: function(e) {
		let t = JSON.stringify(e, null, 2);
		return t === "{}" && (t = "{\n  \n}"), t;
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
		let t = this.getValidJsonConfig(e);
		return t !== !1 && this.config2json(t);
	},
	json2js: function(e) {
		let t;
		try {
			t = JSON.parse(e);
		} catch {
			return !1;
		}
		if (!$.isPlainObject(t)) return !1;
		let n = this.jsify(t, "");
		return n === "{\n}" && (n = "{\n  \n}"), `return ${n}`;
	},
	jsify: function(e, t) {
		let n;
		if (Array.isArray(e)) {
			n = "[\n";
			for (let r of e) n += `${t}  ${this.jsify(r, t + "  ")},\n`;
			n += `${t}]`;
		} else if ($.isPlainObject(e)) {
			n = "{\n";
			for (let [r, i] of Object.entries(e)) n += `${t}  ${r}: ${this.jsify(i, t + "  ")},\n`;
			n += `${t}}`;
		} else n = typeof e == "string" && !e.match(/[\r\n']/) ? `'${e}'` : JSON.stringify(e);
		return n;
	}
}), CssOptions_default = Garnish.Base.extend({
	mode: null,
	$container: null,
	$modeInput: null,
	$cssContainer: null,
	$fileContainer: null,
	init: function(e, t, n) {
		this.mode = t, this.$container = $(`#${e}`), this.$modeInput = $(`#${e}-mode`), this.$cssContainer = $(`#${e}-css-container`), this.$fileContainer = $(`#${e}-file-container`);
		let r = this.$container.children("craft-button-group"), i = this.$cssContainer.add(this.$fileContainer);
		new Craft.Listbox(r, { onChange: (e) => {
			switch (this.mode = e.data("mode"), (this.mode !== "file" || n) && this.$modeInput.val(this.mode), i.addClass("hidden"), this.mode) {
				case "css":
					this.$cssContainer.removeClass("hidden");
					break;
				case "file": this.$fileContainer.removeClass("hidden");
			}
		} });
	}
});
export { ConfigOptions_default as ConfigOptions, CssOptions_default as CssOptions, ToolbarBuilder_default as ToolbarBuilder };
