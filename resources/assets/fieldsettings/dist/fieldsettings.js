import { create } from "@craftcms/ckeditor";
import { cpConfig, t } from "@craftcms/cp";
import { DragDrop, getDist, getOffset, getOuterHeight, getOuterWidth, hitTest } from "@craftcms/garnish";
// resources/assets/fieldsettings/src/ToolbarBuilder.js
var componentNames = /* @__PURE__ */ new WeakMap(), sourceItems = /* @__PURE__ */ new WeakMap(), midpoints = /* @__PURE__ */ new WeakMap(), MARGIN_DURATION = 200;
function animateMargin(e, n, r, i, a) {
	e.getAnimations().forEach((e) => e.cancel()), e.style.setProperty(n, r), e.animate([{ [n]: r }, { [n]: i }], {
		duration: MARGIN_DURATION,
		easing: "ease-in-out"
	}).finished.catch(() => {}).then(() => {
		e.style.setProperty(n, i), a?.();
	});
}
var ToolbarBuilder = class {
	constructor(e, n, r = []) {
		this.container = document.getElementById(e), this.sourceContainer = this.container.querySelector(".ckeditor-tb--source .ck-toolbar__items"), this.targetContainer = this.container.querySelector(".ckeditor-tb--target .ck-toolbar__items"), this.input = this.container.querySelector("input"), this.value = JSON.parse(this.input.value), this.readOnly = this.container.classList.contains("disabled"), this.components = {}, this.drag = null, this.items = [], this.draggingSourceItem = null, this.draggingSeparator = null, this.insertion = null, this.showingInsertion = !1;
		let i = document.createElement("div");
		i.classList.add("hidden");
		let a = document.createElement("div");
		i.appendChild(a), this.container.append(i), create(a, {
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
			let i = JSON.parse(this.container.getAttribute("data-available-items"));
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
			this.readOnly || (this.drag = new DragDrop({
				dropTargets: this.targetContainer,
				helper: (e) => {
					let n = document.createElement("div");
					n.className = "offset-drag-helper ck ck-reset_all ck-editor ck-rounded-corners";
					let r = document.createElement("div");
					return r.className = "ck ck-toolbar", r.append(e), n.append(r), n;
				},
				moveHelperToCursor: !0,
				onDragStart: () => {
					document.body.classList.add("dragging");
					let [e] = this.drag.$draggee;
					this.draggingSourceItem = this.sourceContainer.contains(e), this.draggingSeparator = e.classList.contains("ckeditor-tb--separator"), this.insertion = document.createElement("div"), this.insertion.className = "ckeditor-tb--insertion", this.insertion.style.width = `${getOuterWidth(e)}px`, this.insertion.style.height = `${getOuterHeight(e)}px`, this.draggingSourceItem ? this.draggingSeparator ? e.style.visibility = "" : animateMargin(e, cpConfig().get("orientation") === "ltr" ? "margin-right" : "margin-left", "0px", `${-1 * getOuterWidth(e)}px`, () => e.classList.add("hidden")) : (e.classList.add("hidden"), e.before(this.insertion), this.showingInsertion = !0), this.setMidpoints();
				},
				onDrag: () => {
					this.checkForNewClosestItem();
				},
				onDragStop: () => {
					document.body.classList.remove("dragging");
					let [e] = this.drag.$draggee;
					if (this.checkForNewClosestItem(), this.showingInsertion) {
						if (this.draggingSourceItem) {
							let r;
							if (this.draggingSeparator) r = this.renderSeparator();
							else {
								let a = componentNames.get(e);
								r = this.renderComponentGroup(a);
								for (let e of a) {
									let r = i.flat().find(({ button: n }) => n === e);
									r && r.configOption && n.addSetting(r.configOption);
								}
							}
							sourceItems.set(r, e), r.style.visibility = "hidden", this.insertion.replaceWith(r), this.drag.$draggee = [r];
						} else this.insertion.replaceWith(e), e.classList.remove("hidden");
					} else {
						if (!this.draggingSourceItem) {
							let r = sourceItems.get(e);
							if (e.remove(), e = r, this.drag.$draggee = [e], !this.draggingSeparator) for (let e of componentNames.get(r)) {
								let r = i.flat().find(({ button: n }) => n === e);
								r && r.configOption && n.removeSetting(r.configOption);
							}
						}
						if (!this.draggingSeparator) {
							e.classList.remove("hidden");
							let n = cpConfig().get("orientation") === "ltr" ? "margin-right" : "margin-left", r = e.style.getPropertyValue(n) || "0px";
							e.style.removeProperty(n);
							let i = getComputedStyle(e).getPropertyValue(n);
							animateMargin(e, n, r, i, () => e.style.removeProperty(n));
						}
					}
					this.drag.returnHelpersToDraggees(), this.items = [...this.targetContainer.children], this.value = [];
					for (let e of this.items) e.classList.contains("ckeditor-tb--separator") ? this.value.push("|") : this.value.push(...componentNames.get(e));
					this.input.value = JSON.stringify(this.value);
				}
			}));
			let a = {};
			for (let e of i) {
				let n = this.renderComponentGroup(e);
				n && (this.sourceContainer.append(n), a[e.map((e) => e.button).join(",")] = n, this.value.includes(e[0].button) && n.classList.add("hidden"));
			}
			let o = this.renderSeparator();
			this.sourceContainer.append(o), a["|"] = o, this.items = [];
			for (let e = 0; e < this.value.length; e++) {
				let n = this.value[e], r, o;
				if (n === "|") r = this.renderSeparator(), this.targetContainer.append(r), o = "|";
				else {
					let a = i.find((e) => e.some((e) => e.button === n));
					if (!a || (r = this.renderComponentGroup(a), !r)) continue;
					this.targetContainer.append(r), o = a.map((e) => e.button).join(","), e += a.length - 1;
				}
				sourceItems.set(r, a[o]), this.items.push(r);
			}
		}).catch(console.error);
	}
	renderSeparator() {
		let e = document.createElement("div");
		e.className = "ckeditor-tb--item ckeditor-tb--separator", e.setAttribute("data-cke-tooltip-text", "Separator");
		let n = document.createElement("span");
		return n.className = "ck ck-toolbar__separator", e.append(n), this.drag?.addItems(e), e;
	}
	renderComponentGroup(e) {
		let n = e.map((e) => typeof e == "string" ? e : e.button), r = [], i = [];
		for (let e of n) {
			let n;
			try {
				n = this.renderComponent(e);
			} catch (e) {
				console.warn(e);
				continue;
			}
			r.push(n);
			let a = (n.matches("[data-cke-tooltip-text]") ? n : n.querySelector("[data-cke-tooltip-text]"))?.getAttribute("data-cke-tooltip-text");
			i.push(a ? a.replace(/ \(.*\)$/, "") : `${e[0].toUpperCase()}${e.slice(1)}`);
		}
		if (!r.length) return !1;
		let a = document.createElement("div");
		return a.className = "ckeditor-tb--item", a.append(...r), a.setAttribute("data-cke-tooltip-text", i.join(", ")), componentNames.set(a, n), this.drag?.addItems(a), a;
	}
	renderComponent(e) {
		let n = this.components[e];
		if (!n) throw `Missing component: ${e}`;
		n.isRendered || n.render();
		let r = document.createElement("template");
		return r.innerHTML = n.element.outerHTML.trim(), r.content.firstElementChild;
	}
	getClosestItem() {
		if (!hitTest(this.drag.mouseX, this.drag.mouseY, this.targetContainer)) return !1;
		if (!this.items.length) return null;
		let e = [...this.items];
		this.showingInsertion && e.push(this.insertion);
		let n = e.map((e) => {
			let n = midpoints.get(e);
			return getDist(n.left, n.top, this.drag.mouseX, this.drag.mouseY);
		}), r = Math.min(...n);
		return e[n.indexOf(r)];
	}
	checkForNewClosestItem() {
		let e = this.getClosestItem();
		e === !1 ? this.showingInsertion &&= (this.insertion.remove(), !1) : e !== this.insertion && (e ? this.drag.mouseX < midpoints.get(e).left ? e.before(this.insertion) : e.after(this.insertion) : this.targetContainer.append(this.insertion), this.showingInsertion = !0, this.setMidpoints());
	}
	setMidpoints() {
		let e = [...this.items];
		this.showingInsertion && e.push(this.insertion);
		for (let n of e) {
			let e = getOffset(n);
			midpoints.set(n, {
				left: e.left + getOuterWidth(n) / 2,
				top: e.top + getOuterHeight(n) / 2
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
							if (this.jsContainsFunctions(e) && !confirm(t("Your JavaScript config contains functions. If you switch to JSON, they will be lost. Would you like to continue?", {}, "ckeditor"))) {
								modePicker.querySelector("[data-mode=\"js\"]")?.click();
								break;
							}
							let n = this.js2json(e);
							this.setValue(this.jsonEditor, n || "{\n  \n}"), this.setValue(this.jsEditor, "");
						}
						this.jsonContainer.classList.remove("hidden");
						break;
					case "js":
						if (this.lastCodeMode === "json") {
							let e = this.getValue(this.jsonEditor), n = this.json2js(e);
							this.setValue(this.jsEditor, n || "return {\n  \n}"), this.setValue(this.jsonEditor, "");
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
	setValue(e, n) {
		e.value = n, e.dispatchEvent(new Event("input", { bubbles: !0 }));
	}
	getConfig() {
		let e;
		if (this.mode === "json") e = this.getValue(this.jsonEditor).trim() || "{}";
		else {
			let n = this.getValue(this.jsEditor).trim();
			if (e = n ? this.js2json(n) : "{}", e === !1) return !1;
		}
		try {
			let n = JSON.parse(e);
			return isPlainObject(n) ? n : !1;
		} catch {
			return !1;
		}
	}
	setConfig(e) {
		let n = this.config2json(e);
		if (this.mode === "json") this.setValue(this.jsonEditor, n);
		else {
			let e = this.json2js(n);
			this.setValue(this.jsEditor, e || "return {\n  \n}");
		}
	}
	addSetting(e) {
		let n = this.getConfig();
		n && n[e] === void 0 && (this.defaults[e] === void 0 && (this.populateDefault(e), this.defaults[e] === void 0) || (n[e] = this.defaults[e], this.setConfig(n)));
	}
	removeSetting(e) {
		let n = this.getConfig();
		n && n[e] !== void 0 && (this.defaults[e] = n[e], delete n[e], this.setConfig(n));
	}
	populateDefault(e) {
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
	}
	replacer(e, n) {
		return typeof n == "function" ? "__HAS__FUNCTION__" : n;
	}
	jsContainsFunctions(e) {
		let n = this.getValidJsonConfig(e);
		return !!(n === !1 || JSON.stringify(n, this.replacer, 2).match(/__HAS__FUNCTION__/));
	}
	config2json(e) {
		let n = JSON.stringify(e, null, 2);
		return n === "{}" && (n = "{\n  \n}"), n;
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
		let n = this.getValidJsonConfig(e);
		return n !== !1 && this.config2json(n);
	}
	json2js(e) {
		let n;
		try {
			n = JSON.parse(e);
		} catch {
			return !1;
		}
		if (!isPlainObject(n)) return !1;
		let r = this.jsify(n, "");
		return r === "{\n}" && (r = "{\n  \n}"), `return ${r}`;
	}
	jsify(e, n) {
		let r;
		if (Array.isArray(e)) {
			r = "[\n";
			for (let i of e) r += `${n}  ${this.jsify(i, n + "  ")},\n`;
			r += `${n}]`;
		} else if (isPlainObject(e)) {
			r = "{\n";
			for (let [i, a] of Object.entries(e)) r += `${n}  ${i}: ${this.jsify(a, n + "  ")},\n`;
			r += `${n}}`;
		} else r = typeof e == "string" && !e.match(/[\r\n']/) ? `'${e}'` : JSON.stringify(e);
		return r;
	}
}, CssOptions = class {
	constructor(e, n, r) {
		this.mode = n, this.container = document.getElementById(e), this.modeInput = document.getElementById(`${e}-mode`), this.cssContainer = document.getElementById(`${e}-css-container`), this.fileContainer = document.getElementById(`${e}-file-container`);
		let i = this.container.querySelector(":scope > craft-listbox");
		i.addEventListener("change", (e) => {
			e.target === i && (this.mode = e.detail.$selectedOption.dataset.mode, (this.mode !== "file" || r) && (this.modeInput.value = this.mode), this.cssContainer.classList.toggle("hidden", this.mode !== "css"), this.fileContainer.classList.toggle("hidden", this.mode !== "file"));
		});
	}
};
export { ConfigOptions, CssOptions, ToolbarBuilder };
