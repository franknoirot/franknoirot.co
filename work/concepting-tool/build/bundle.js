
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function tick() {
        schedule_update();
        return resolved_promise;
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }

    function destroy_block(block, lookup) {
        block.d(1);
        lookup.delete(block.key);
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(child_ctx, dirty);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.17.2' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev("SvelteDOMSetProperty", { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    function loadIFramePromise(iFrame) {
        return new Promise((resolve, reject) => {
            iFrame.onload = () => resolve(true);
            iFrame.onerror = reject;
        })
    }

    function getIFrameCustomCSS(iFrame) {
        const stylesArray = Array.from(iFrame.contentDocument.styleSheets) // Trying to get the stylesheets of the embedded iframe
            .filter(sheet => sheet.href === null || sheet.href.startsWith(iFrame.contentWindow.origin))
            .reduce((acc, sheet) => (
                acc = [...acc,
                        ...Array.from(sheet.cssRules).reduce((def, rule) => (
                            def = (rule.selectorText === 'body' || rule.selectorText === ':root' || rule.selectorText === '*')
                                ? [
                                    ...def,
                                    ...Array.from(rule.style).filter(name => name.startsWith('--'))
                                        .map(styleProp => (
                                            [
                                                styleProp, 
                                                (rule.selectorText === 'body')
                                                    ? iFrame.contentWindow.getComputedStyle(iFrame.contentDocument.body).getPropertyValue(styleProp)
                                                    : iFrame.contentWindow.getComputedStyle(iFrame.contentDocument.documentElement).getPropertyValue(styleProp)
                                            ]
                                        ))
                                ] : def
                        ), [])
                    ]
        ), []);
        console.log('previewStyles = ', stylesArray);

        return stylesArray
    }

    /* src/App.svelte generated by Svelte v3.17.2 */
    const file = "src/App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[16] = list[i];
    	child_ctx[18] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[19] = list[i];
    	child_ctx[21] = i;
    	return child_ctx;
    }

    // (131:2) {#if previewStyles instanceof Array}
    function create_if_block_1(ctx) {
    	let section;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let each_value_1 = /*previewStyles*/ ctx[2];
    	const get_key = ctx => "style-control_" + /*j*/ ctx[21];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		let child_ctx = get_each_context_1(ctx, each_value_1, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block_1(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			section = element("section");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(section, "class", "control_group svelte-1aglda");
    			add_location(section, file, 131, 2, 4174);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(section, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			const each_value_1 = /*previewStyles*/ ctx[2];
    			each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_1, each_1_lookup, section, destroy_block, create_each_block_1, null, get_each_context_1);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(131:2) {#if previewStyles instanceof Array}",
    		ctx
    	});

    	return block;
    }

    // (142:4) {#if style[0].includes('color')}
    function create_if_block_2(ctx) {
    	let span;
    	let t_value = /*style*/ ctx[19][1] + "";
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(t_value);
    			attr_dev(span, "class", "value svelte-1aglda");
    			add_location(span, file, 142, 4, 4569);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*previewStyles*/ 4 && t_value !== (t_value = /*style*/ ctx[19][1] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(142:4) {#if style[0].includes('color')}",
    		ctx
    	});

    	return block;
    }

    // (133:3) {#each previewStyles as style, j ('style-control_'+j)}
    function create_each_block_1(key_1, ctx) {
    	let label;
    	let span;
    	let t0_value = /*style*/ ctx[19][0].slice(2, /*style*/ ctx[19][0].length).replace("-", " ") + "";
    	let t0;
    	let t1;
    	let input;
    	let input_type_value;
    	let input_value_value;
    	let t2;
    	let show_if = /*style*/ ctx[19][0].includes("color");
    	let t3;
    	let dispose;

    	function input_handler(...args) {
    		return /*input_handler*/ ctx[13](/*j*/ ctx[21], ...args);
    	}

    	let if_block = show_if && create_if_block_2(ctx);

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			label = element("label");
    			span = element("span");
    			t0 = text(t0_value);
    			t1 = space();
    			input = element("input");
    			t2 = space();
    			if (if_block) if_block.c();
    			t3 = space();
    			attr_dev(span, "class", "label svelte-1aglda");
    			add_location(span, file, 134, 4, 4295);

    			attr_dev(input, "type", input_type_value = /*style*/ ctx[19][0].includes("color")
    			? "color"
    			: "text");

    			input.value = input_value_value = /*style*/ ctx[19][1];
    			add_location(input, file, 135, 4, 4383);
    			attr_dev(label, "class", "control svelte-1aglda");
    			add_location(label, file, 133, 3, 4267);
    			this.first = label;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label, anchor);
    			append_dev(label, span);
    			append_dev(span, t0);
    			append_dev(label, t1);
    			append_dev(label, input);
    			append_dev(label, t2);
    			if (if_block) if_block.m(label, null);
    			append_dev(label, t3);
    			dispose = listen_dev(input, "input", input_handler, false, false, false);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*previewStyles*/ 4 && t0_value !== (t0_value = /*style*/ ctx[19][0].slice(2, /*style*/ ctx[19][0].length).replace("-", " ") + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*previewStyles*/ 4 && input_type_value !== (input_type_value = /*style*/ ctx[19][0].includes("color")
    			? "color"
    			: "text")) {
    				attr_dev(input, "type", input_type_value);
    			}

    			if (dirty & /*previewStyles*/ 4 && input_value_value !== (input_value_value = /*style*/ ctx[19][1]) && input.value !== input_value_value) {
    				prop_dev(input, "value", input_value_value);
    			}

    			if (dirty & /*previewStyles*/ 4) show_if = /*style*/ ctx[19][0].includes("color");

    			if (show_if) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_2(ctx);
    					if_block.c();
    					if_block.m(label, t3);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label);
    			if (if_block) if_block.d();
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(133:3) {#each previewStyles as style, j ('style-control_'+j)}",
    		ctx
    	});

    	return block;
    }

    // (163:1) {:else}
    function create_else_block(ctx) {
    	let form;
    	let label;
    	let t0;
    	let code;
    	let t2;
    	let select;
    	let option;
    	let t4;
    	let button;
    	let dispose;
    	let each_value = availablePages;
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			form = element("form");
    			label = element("label");
    			t0 = text("Enter a filename from within the local ");
    			code = element("code");
    			code.textContent = "/static/pages/";
    			t2 = text(" directory.\n\t\t\t");
    			select = element("select");
    			option = element("option");
    			option.textContent = "Pick a page";

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t4 = space();
    			button = element("button");
    			button.textContent = "Submit";
    			add_location(code, file, 164, 48, 5336);
    			option.__value = "";
    			option.value = option.__value;
    			add_location(option, file, 166, 4, 5402);
    			attr_dev(select, "name", "url");
    			add_location(select, file, 165, 3, 5378);
    			add_location(label, file, 164, 2, 5290);
    			attr_dev(button, "type", "submit");
    			add_location(button, file, 172, 2, 5561);
    			attr_dev(form, "class", "page-picker");
    			attr_dev(form, "action", "");
    			attr_dev(form, "method", "post");
    			add_location(form, file, 163, 1, 5210);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, form, anchor);
    			append_dev(form, label);
    			append_dev(label, t0);
    			append_dev(label, code);
    			append_dev(label, t2);
    			append_dev(label, select);
    			append_dev(select, option);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}

    			append_dev(form, t4);
    			append_dev(form, button);
    			dispose = listen_dev(form, "submit", /*handleURLEnter*/ ctx[5], false, false, false);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*availablePages*/ 0) {
    				each_value = availablePages;
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(form);
    			destroy_each(each_blocks, detaching);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(163:1) {:else}",
    		ctx
    	});

    	return block;
    }

    // (159:1) {#if iFrameInitialized}
    function create_if_block(ctx) {
    	let iframe;
    	let p;

    	const block = {
    		c: function create() {
    			iframe = element("iframe");
    			p = element("p");
    			p.textContent = "Sorry, your iframe isn't loading!";
    			add_location(p, file, 160, 2, 5148);
    			attr_dev(iframe, "title", "page-preview");
    			attr_dev(iframe, "width", "100%");
    			attr_dev(iframe, "height", "100%");
    			iframe.allowFullscreen = true;
    			add_location(iframe, file, 159, 1, 5046);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, iframe, anchor);
    			append_dev(iframe, p);
    			/*iframe_binding*/ ctx[15](iframe);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(iframe);
    			/*iframe_binding*/ ctx[15](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(159:1) {#if iFrameInitialized}",
    		ctx
    	});

    	return block;
    }

    // (168:4) {#each availablePages as page, i}
    function create_each_block(ctx) {
    	let option;
    	let t_value = /*page*/ ctx[16] + "";
    	let t;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = /*page*/ ctx[16];
    			option.value = option.__value;
    			add_location(option, file, 168, 4, 5482);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(168:4) {#each availablePages as page, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let section;
    	let h1;
    	let t1;
    	let section_class_value;
    	let t2;
    	let button;
    	let svg;
    	let path;
    	let t3;
    	let span;
    	let t4_value = (!/*isSidebarOpen*/ ctx[3] ? "Open" : "Close") + "";
    	let t4;
    	let t5;
    	let button_class_value;
    	let t6;
    	let dispose;
    	let if_block0 = /*previewStyles*/ ctx[2] instanceof Array && create_if_block_1(ctx);

    	function select_block_type(ctx, dirty) {
    		if (/*iFrameInitialized*/ ctx[0]) return create_if_block;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block1 = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			section = element("section");
    			h1 = element("h1");
    			h1.textContent = "Site Theming Tool";
    			t1 = space();
    			if (if_block0) if_block0.c();
    			t2 = space();
    			button = element("button");
    			svg = svg_element("svg");
    			path = svg_element("path");
    			t3 = space();
    			span = element("span");
    			t4 = text(t4_value);
    			t5 = text(" Tool Bar");
    			t6 = space();
    			if_block1.c();
    			attr_dev(h1, "class", "svelte-1aglda");
    			add_location(h1, file, 129, 2, 4106);
    			attr_dev(section, "class", section_class_value = "" + (null_to_empty(`side-bar ${/*isSidebarOpen*/ ctx[3] ? "open" : ""}`) + " svelte-1aglda"));
    			add_location(section, file, 128, 1, 4042);
    			attr_dev(path, "d", "M 1 2.5 l 8 0 M 7 1 l 2 1.5 l -2 1.5");
    			attr_dev(path, "class", "svelte-1aglda");
    			add_location(path, file, 152, 3, 4825);
    			attr_dev(svg, "viewBox", "0 0 10 5");
    			attr_dev(svg, "class", "svelte-1aglda");
    			add_location(svg, file, 151, 2, 4797);
    			attr_dev(span, "class", "svelte-1aglda");
    			add_location(span, file, 154, 2, 4886);
    			attr_dev(button, "class", button_class_value = "" + (null_to_empty(`side-bar_toggle ${/*isSidebarOpen*/ ctx[3] ? "open" : ""}`) + " svelte-1aglda"));
    			add_location(button, file, 149, 1, 4677);
    			attr_dev(main, "class", "svelte-1aglda");
    			add_location(main, file, 127, 0, 4034);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, section);
    			append_dev(section, h1);
    			append_dev(section, t1);
    			if (if_block0) if_block0.m(section, null);
    			append_dev(main, t2);
    			append_dev(main, button);
    			append_dev(button, svg);
    			append_dev(svg, path);
    			append_dev(button, t3);
    			append_dev(button, span);
    			append_dev(span, t4);
    			append_dev(span, t5);
    			append_dev(main, t6);
    			if_block1.m(main, null);
    			dispose = listen_dev(button, "click", /*click_handler*/ ctx[14], false, false, false);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*previewStyles*/ ctx[2] instanceof Array) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_1(ctx);
    					if_block0.c();
    					if_block0.m(section, null);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (dirty & /*isSidebarOpen*/ 8 && section_class_value !== (section_class_value = "" + (null_to_empty(`side-bar ${/*isSidebarOpen*/ ctx[3] ? "open" : ""}`) + " svelte-1aglda"))) {
    				attr_dev(section, "class", section_class_value);
    			}

    			if (dirty & /*isSidebarOpen*/ 8 && t4_value !== (t4_value = (!/*isSidebarOpen*/ ctx[3] ? "Open" : "Close") + "")) set_data_dev(t4, t4_value);

    			if (dirty & /*isSidebarOpen*/ 8 && button_class_value !== (button_class_value = "" + (null_to_empty(`side-bar_toggle ${/*isSidebarOpen*/ ctx[3] ? "open" : ""}`) + " svelte-1aglda"))) {
    				attr_dev(button, "class", button_class_value);
    			}

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block1) {
    				if_block1.p(ctx, dirty);
    			} else {
    				if_block1.d(1);
    				if_block1 = current_block_type(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(main, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if (if_block0) if_block0.d();
    			if_block1.d();
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    let availablePages = ["landing-page", "blog-template"];
    let currQueryParams = Array.from(new URL(document.location).searchParams.entries());

    function instance($$self, $$props, $$invalidate) {
    	let iFrameInitialized = currQueryParams.find(item => item[0] === "url");
    	let previewFrame, previewStyles;
    	let isFirstCall = true;
    	let paramStyles = "", originalStyles = [];
    	let isSidebarOpen = true;
    	let queryString = "";
    	onMount(handleMount);

    	async function handleMount() {
    		if (!currQueryParams.find(item => item[0] === "url")) return;

    		$$invalidate(
    			1,
    			previewFrame.src = currQueryParams.find(item => item[0] === "url")
    			? `./pages/${currQueryParams.find(item => item[0] === "url")[1]}`
    			: "",
    			previewFrame
    		);

    		// WAIT FOR IFRAME TO LOAD
    		const previewFrameLoaded = await loadIFramePromise(previewFrame).catch(err => console.error(err));

    		// EXTRACT BODY, :ROOT, AND * CSS VARIABLES
    		$$invalidate(2, previewStyles = getIFrameCustomCSS(previewFrame).map(style => {
    			if (queryStyles.find(qStyle => qStyle[0] === style[0])) {
    				style[1] = queryStyles.find(qStyle => qStyle[0] === style[0])[1];
    			}

    			return style;
    		}));

    		// SET ORIGINAL STYLES TO CHECK AGAINST LATER
    		if (isFirstCall) {
    			isFirstCall = false;
    			originalStyles = [...previewStyles.map(style => [...style])];
    		}
    	}

    	// TODO: WRITE TO URL AS QUERY PARAMS WHEN EDITING ANY CSS VARIABLE VALUES
    	function updateStyles(e, index) {
    		const newStyles = previewStyles;
    		$$invalidate(2, previewStyles[index][1] = e.target.value, previewStyles);
    		$$invalidate(2, previewStyles = newStyles);
    		buildQueryString();

    		if (queryString) {
    			const url = window.location.href.slice(0, window.location.href.indexOf("?") >= 0
    			? window.location.href.indexOf("?")
    			: window.location.href.length) + queryString;

    			window.history.replaceState(null, "", url);
    		}
    	}

    	function buildQueryString() {
    		if (currQueryParams && previewStyles) {
    			console.log("originalStyles", originalStyles);
    			const filteredStyles = previewStyles.filter((style, i) => style[1] !== originalStyles[i][1]);

    			queryString = "?" + `${currQueryParams.find(param => param[0] === "url")
			? "url=" + currQueryParams.find(param => param[0] === "url")[1]
			: ""}${filteredStyles
			? filteredStyles.length > 1
				? "&" + filteredStyles.map(style => encodeURIComponent(style[0]) + "=" + encodeURIComponent(style[1])).join("&")
				: "&" + encodeURIComponent(filteredStyles[0][0]) + "=" + encodeURIComponent(filteredStyles[0][1])
			: ""}`;
    		}
    	}

    	async function handleURLEnter(e) {
    		e.preventDefault();
    		const input = e.target.querySelector("select");
    		const url = input.value;
    		let localPageFound = await fetch("./pages/" + url);
    		localPageFound = localPageFound.status === 404 ? false : true;
    		console.log("localPageFound = ", localPageFound);

    		if (!localPageFound) {
    			input.value = "";
    			return;
    		}

    		const newQueryParams = [...currQueryParams];
    		newQueryParams.push(["url", url]);
    		currQueryParams = newQueryParams;
    		$$invalidate(0, iFrameInitialized = true);
    		await tick();
    		window.history.replaceState(null, "", window.location.href + "?url=" + url);
    		handleMount();
    	}

    	const input_handler = (j, e) => updateStyles(e, j);
    	const click_handler = () => $$invalidate(3, isSidebarOpen = !isSidebarOpen);

    	function iframe_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(1, previewFrame = $$value);
    		});
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("iFrameInitialized" in $$props) $$invalidate(0, iFrameInitialized = $$props.iFrameInitialized);
    		if ("previewFrame" in $$props) $$invalidate(1, previewFrame = $$props.previewFrame);
    		if ("previewStyles" in $$props) $$invalidate(2, previewStyles = $$props.previewStyles);
    		if ("isFirstCall" in $$props) isFirstCall = $$props.isFirstCall;
    		if ("paramStyles" in $$props) paramStyles = $$props.paramStyles;
    		if ("originalStyles" in $$props) originalStyles = $$props.originalStyles;
    		if ("isSidebarOpen" in $$props) $$invalidate(3, isSidebarOpen = $$props.isSidebarOpen);
    		if ("queryString" in $$props) queryString = $$props.queryString;
    		if ("queryStyles" in $$props) queryStyles = $$props.queryStyles;
    	};

    	let queryStyles;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*previewFrame, previewStyles*/ 6) {
    			 if (previewFrame && previewFrame.contentDocument && previewStyles) {
    				const hasInjectedStyles = previewFrame.contentDocument.documentElement.innerHTML.includes("style id=\"injected\"");

    				$$invalidate(
    					1,
    					previewFrame.contentDocument.documentElement.innerHTML = hasInjectedStyles
    					? previewFrame.contentDocument.documentElement.innerHTML.replace(/<style id="injected">(.|\t|\r|\n)*<\/head>/, `<style id='injected'>
			body { ${previewStyles.map(style => style[0] + ": " + style[1]).join("; ")} }
		</style>
		</head>`)
    					: previewFrame.contentDocument.documentElement.innerHTML.replace("</head>", `<style id='injected'>
			body { ${previewStyles.map(style => style[0] + ": " + style[1]).join("; ")} }
		</style>
		</head>`),
    					previewFrame
    				);
    			}
    		}
    	};

    	 queryStyles = currQueryParams.filter(param => param[0].startsWith("--"));

    	return [
    		iFrameInitialized,
    		previewFrame,
    		previewStyles,
    		isSidebarOpen,
    		updateStyles,
    		handleURLEnter,
    		isFirstCall,
    		originalStyles,
    		queryString,
    		queryStyles,
    		paramStyles,
    		handleMount,
    		buildQueryString,
    		input_handler,
    		click_handler,
    		iframe_binding
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
