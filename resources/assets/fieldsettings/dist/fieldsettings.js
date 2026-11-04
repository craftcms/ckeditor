import { create } from "@craftcms/ckeditor";
import * as Craft from "@craftcms/cp";
import * as Garnish from "@craftcms/garnish";
// resources/assets/fieldsettings/src/ToolbarBuilder.js
var componentNames = /* @__PURE__ */ new WeakMap(), sourceItems = /* @__PURE__ */ new WeakMap(), midpoints = /* @__PURE__ */ new WeakMap(), MARGIN_DURATION = 200;
function animateMargin(e, t, n, r, i) {
	e.getAnimations().forEach((e) => e.cancel()), e.style.setProperty(t, n), e.animate([{ [t]: n }, { [t]: r }], {
		duration: MARGIN_DURATION,
		easing: "ease-in-out"
	}).finished.catch(() => {}).then(() => {
		e.style.setProperty(t, r), i?.();
	});
}
var ToolbarBuilder = class {
	constructor(e, t, n = []) {
		this.container = document.getElementById(e), this.sourceContainer = this.container.querySelector(".ckeditor-tb--source .ck-toolbar__items"), this.targetContainer = this.container.querySelector(".ckeditor-tb--target .ck-toolbar__items"), this.input = this.container.querySelector("input"), this.value = JSON.parse(this.input.value), this.readOnly = this.container.classList.contains("disabled"), this.components = {}, this.drag = null, this.items = [], this.draggingSourceItem = null, this.draggingSeparator = null, this.insertion = null, this.showingInsertion = !1;
		let r = document.createElement("div");
		r.classList.add("hidden");
		let i = document.createElement("div");
		r.appendChild(i), this.container.append(r), create(i, {
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
			let r = JSON.parse(this.container.getAttribute("data-available-items"));
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
			this.readOnly || (this.drag = new Garnish.DragDrop({
				dropTargets: this.targetContainer,
				helper: (e) => {
					let t = document.createElement("div");
					t.className = "offset-drag-helper ck ck-reset_all ck-editor ck-rounded-corners";
					let n = document.createElement("div");
					return n.className = "ck ck-toolbar", n.append(e), t.append(n), t;
				},
				moveHelperToCursor: !0,
				onDragStart: () => {
					document.body.classList.add("dragging");
					let [e] = this.drag.$draggee;
					this.draggingSourceItem = this.sourceContainer.contains(e), this.draggingSeparator = e.classList.contains("ckeditor-tb--separator"), this.insertion = document.createElement("div"), this.insertion.className = "ckeditor-tb--insertion", this.insertion.style.width = `${Garnish.getOuterWidth(e)}px`, this.insertion.style.height = `${Garnish.getOuterHeight(e)}px`, this.draggingSourceItem ? this.draggingSeparator ? e.style.visibility = "" : animateMargin(e, Craft.cpConfig().get("orientation") === "ltr" ? "margin-right" : "margin-left", "0px", `${-1 * Garnish.getOuterWidth(e)}px`, () => e.classList.add("hidden")) : (e.classList.add("hidden"), e.before(this.insertion), this.showingInsertion = !0), this.setMidpoints();
				},
				onDrag: () => {
					this.checkForNewClosestItem();
				},
				onDragStop: () => {
					document.body.classList.remove("dragging");
					let [e] = this.drag.$draggee;
					if (this.checkForNewClosestItem(), this.showingInsertion) {
						if (this.draggingSourceItem) {
							let n;
							if (this.draggingSeparator) n = this.renderSeparator();
							else {
								let i = componentNames.get(e);
								n = this.renderComponentGroup(i);
								for (let e of i) {
									let n = r.flat().find(({ button: t }) => t === e);
									n && n.configOption && t.addSetting(n.configOption);
								}
							}
							sourceItems.set(n, e), n.style.visibility = "hidden", this.insertion.replaceWith(n), this.drag.$draggee = [n];
						} else this.insertion.replaceWith(e), e.classList.remove("hidden");
					} else {
						if (!this.draggingSourceItem) {
							let n = sourceItems.get(e);
							if (e.remove(), e = n, this.drag.$draggee = [e], !this.draggingSeparator) for (let e of componentNames.get(n)) {
								let n = r.flat().find(({ button: t }) => t === e);
								n && n.configOption && t.removeSetting(n.configOption);
							}
						}
						if (!this.draggingSeparator) {
							e.classList.remove("hidden");
							let t = Craft.cpConfig().get("orientation") === "ltr" ? "margin-right" : "margin-left", n = e.style.getPropertyValue(t) || "0px";
							e.style.removeProperty(t);
							let r = getComputedStyle(e).getPropertyValue(t);
							animateMargin(e, t, n, r, () => e.style.removeProperty(t));
						}
					}
					this.drag.returnHelpersToDraggees(), this.items = [...this.targetContainer.children], this.value = [];
					for (let e of this.items) e.classList.contains("ckeditor-tb--separator") ? this.value.push("|") : this.value.push(...componentNames.get(e));
					this.input.value = JSON.stringify(this.value);
				}
			}));
			let i = {};
			for (let e of r) {
				let t = this.renderComponentGroup(e);
				t && (this.sourceContainer.append(t), i[e.map((e) => e.button).join(",")] = t, this.value.includes(e[0].button) && t.classList.add("hidden"));
			}
			let a = this.renderSeparator();
			this.sourceContainer.append(a), i["|"] = a, this.items = [];
			for (let e = 0; e < this.value.length; e++) {
				let t = this.value[e], n, a;
				if (t === "|") n = this.renderSeparator(), this.targetContainer.append(n), a = "|";
				else {
					let i = r.find((e) => e.some((e) => e.button === t));
					if (!i || (n = this.renderComponentGroup(i), !n)) continue;
					this.targetContainer.append(n), a = i.map((e) => e.button).join(","), e += i.length - 1;
				}
				sourceItems.set(n, i[a]), this.items.push(n);
			}
		}).catch(console.error);
	}
	renderSeparator() {
		let e = document.createElement("div");
		e.className = "ckeditor-tb--item ckeditor-tb--separator", e.setAttribute("data-cke-tooltip-text", "Separator");
		let t = document.createElement("span");
		return t.className = "ck ck-toolbar__separator", e.append(t), this.drag?.addItems(e), e;
	}
	renderComponentGroup(e) {
		let t = e.map((e) => typeof e == "string" ? e : e.button), n = [], r = [];
		for (let e of t) {
			let t;
			try {
				t = this.renderComponent(e);
			} catch (e) {
				console.warn(e);
				continue;
			}
			n.push(t);
			let i = (t.matches("[data-cke-tooltip-text]") ? t : t.querySelector("[data-cke-tooltip-text]"))?.getAttribute("data-cke-tooltip-text");
			r.push(i ? i.replace(/ \(.*\)$/, "") : `${e[0].toUpperCase()}${e.slice(1)}`);
		}
		if (!n.length) return !1;
		let i = document.createElement("div");
		return i.className = "ckeditor-tb--item", i.append(...n), i.setAttribute("data-cke-tooltip-text", r.join(", ")), componentNames.set(i, t), this.drag?.addItems(i), i;
	}
	renderComponent(e) {
		let t = this.components[e];
		if (!t) throw `Missing component: ${e}`;
		t.isRendered || t.render();
		let n = document.createElement("template");
		return n.innerHTML = t.element.outerHTML.trim(), n.content.firstElementChild;
	}
	getClosestItem() {
		if (!Garnish.hitTest(this.drag.mouseX, this.drag.mouseY, this.targetContainer)) return !1;
		if (!this.items.length) return null;
		let e = [...this.items];
		this.showingInsertion && e.push(this.insertion);
		let t = e.map((e) => {
			let t = midpoints.get(e);
			return Garnish.getDist(t.left, t.top, this.drag.mouseX, this.drag.mouseY);
		}), n = Math.min(...t);
		return e[t.indexOf(n)];
	}
	checkForNewClosestItem() {
		let e = this.getClosestItem();
		e === !1 ? this.showingInsertion &&= (this.insertion.remove(), !1) : e !== this.insertion && (e ? this.drag.mouseX < midpoints.get(e).left ? e.before(this.insertion) : e.after(this.insertion) : this.targetContainer.append(this.insertion), this.showingInsertion = !0, this.setMidpoints());
	}
	setMidpoints() {
		let e = [...this.items];
		this.showingInsertion && e.push(this.insertion);
		for (let t of e) {
			let e = Garnish.getOffset(t);
			midpoints.set(t, {
				left: e.left + Garnish.getOuterWidth(t) / 2,
				top: e.top + Garnish.getOuterHeight(t) / 2
			});
		}
	}
}, isPlainObject = (e) => typeof e == "object" && !!e && [Object.prototype, null].includes(Object.getPrototypeOf(e)), ConfigOptions = class {
	constructor(id, jsonSchemaUri, mode, hasFiles, jsonSchema = null) {
		this.jsonSchemaUri = jsonSchemaUri, this.jsonSchema = jsonSchema, this.mode = mode, this.lastCodeMode = mode === "file" ? null : mode, this.container = document.getElementById(id), this.modeInput = document.getElementById(`${id}-mode`), this.jsonContainer = document.getElementById(`${id}-json-container`), this.jsContainer = document.getElementById(`${id}-js-container`), this.fileContainer = document.getElementById(`${id}-file-container`), this.jsonEditor = document.getElementById(`${id}-json`), this.jsEditor = document.getElementById(`${id}-js`);
		const modePicker = this.container.querySelector(":scope > craft-listbox");
		this.defaults = {};
		const containers = [
			this.jsonContainer,
			this.jsContainer,
			this.fileContainer
		];
		modePicker.addEventListener("change", (e) => {
			if (e.target === modePicker) {
				switch (this.mode = e.detail.$selectedOption.dataset.mode, (this.mode !== "file" || hasFiles) && (this.modeInput.value = this.mode), containers.forEach((e) => e.classList.add("hidden")), this.mode) {
					case "json":
						if (this.lastCodeMode === "js") {
							let e = this.getValue(this.jsEditor);
							if (this.jsContainsFunctions(e) && !confirm(Craft.t("Your JavaScript config contains functions. If you switch to JSON, they will be lost. Would you like to continue?", {}, "ckeditor"))) {
								modePicker.querySelector("[data-mode=\"js\"]")?.click();
								break;
							}
							let t = this.js2json(e);
							this.setValue(this.jsonEditor, t || "{\n  \n}"), this.setValue(this.jsEditor, "");
						}
						this.jsonContainer.classList.remove("hidden");
						break;
					case "js":
						if (this.lastCodeMode === "json") {
							let e = this.getValue(this.jsonEditor), t = this.json2js(e);
							this.setValue(this.jsEditor, t || "return {\n  \n}"), this.setValue(this.jsonEditor, "");
						}
						this.jsContainer.classList.remove("hidden");
						break;
					case "file": this.fileContainer.classList.remove("hidden");
				}
				this.mode !== "file" && (this.lastCodeMode = this.mode);
			}
		}), this.jsonEditor.addEventListener("paste", (ev) => {
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
	}
	getValue(e) {
		return e.value;
	}
	setValue(e, t) {
		e.value = t, e.dispatchEvent(new Event("input", { bubbles: !0 }));
	}
	getConfig() {
		let e;
		if (this.mode === "json") e = this.getValue(this.jsonEditor).trim() || "{}";
		else {
			let t = this.getValue(this.jsEditor).trim();
			if (e = t ? this.js2json(t) : "{}", e === !1) return !1;
		}
		try {
			let t = JSON.parse(e);
			return isPlainObject(t) ? t : !1;
		} catch {
			return !1;
		}
	}
	setConfig(e) {
		let t = this.config2json(e);
		if (this.mode === "json") this.setValue(this.jsonEditor, t);
		else {
			let e = this.json2js(t);
			this.setValue(this.jsEditor, e || "return {\n  \n}");
		}
	}
	addSetting(e) {
		let t = this.getConfig();
		t && t[e] === void 0 && (this.defaults[e] === void 0 && (this.populateDefault(e), this.defaults[e] === void 0) || (t[e] = this.defaults[e], this.setConfig(t)));
	}
	removeSetting(e) {
		let t = this.getConfig();
		t && t[e] !== void 0 && (this.defaults[e] = t[e], delete t[e], this.setConfig(t));
	}
	populateDefault(e) {
		let t;
		if (t = this.jsonSchema, !t) {
			console.warn("Couldn’Craft.t get config options JSON schema.");
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
	}
	replacer(e, t) {
		return typeof t == "function" ? "__HAS__FUNCTION__" : t;
	}
	jsContainsFunctions(e) {
		let t = this.getValidJsonConfig(e);
		return !!(t === !1 || JSON.stringify(t, this.replacer, 2).match(/__HAS__FUNCTION__/));
	}
	config2json(e) {
		let t = JSON.stringify(e, null, 2);
		return t === "{}" && (t = "{\n  \n}"), t;
	}
	getValidJsonConfig(js) {
		const m = (js || "").match(/return\s*(\{[\w\W]*})/);
		if (!m) return !1;
		let config;
		try {
			eval(`config = ${m[1]};`);
		} catch {
			return !1;
		}
		return config;
	}
	js2json(e) {
		let t = this.getValidJsonConfig(e);
		return t !== !1 && this.config2json(t);
	}
	json2js(e) {
		let t;
		try {
			t = JSON.parse(e);
		} catch {
			return !1;
		}
		if (!isPlainObject(t)) return !1;
		let n = this.jsify(t, "");
		return n === "{\n}" && (n = "{\n  \n}"), `return ${n}`;
	}
	jsify(e, t) {
		let n;
		if (Array.isArray(e)) {
			n = "[\n";
			for (let r of e) n += `${t}  ${this.jsify(r, t + "  ")},\n`;
			n += `${t}]`;
		} else if (isPlainObject(e)) {
			n = "{\n";
			for (let [r, i] of Object.entries(e)) n += `${t}  ${r}: ${this.jsify(i, t + "  ")},\n`;
			n += `${t}}`;
		} else n = typeof e == "string" && !e.match(/[\r\n']/) ? `'${e}'` : JSON.stringify(e);
		return n;
	}
}, CssOptions = class {
	constructor(e, t, n) {
		this.mode = t, this.container = document.getElementById(e), this.modeInput = document.getElementById(`${e}-mode`), this.cssContainer = document.getElementById(`${e}-css-container`), this.fileContainer = document.getElementById(`${e}-file-container`);
		let r = this.container.querySelector(":scope > craft-listbox");
		r.addEventListener("change", (e) => {
			e.target === r && (this.mode = e.detail.$selectedOption.dataset.mode, (this.mode !== "file" || n) && (this.modeInput.value = this.mode), this.cssContainer.classList.toggle("hidden", this.mode !== "css"), this.fileContainer.classList.toggle("hidden", this.mode !== "file"));
		});
	}
};
export { ConfigOptions, CssOptions, ToolbarBuilder };
