
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
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
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
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
    function empty() {
        return text('');
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
    function to_number(value) {
        return value === '' ? undefined : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
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
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
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
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
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
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function outro_and_destroy_block(block, lookup) {
        transition_out(block, 1, 1, () => {
            lookup.delete(block.key);
        });
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
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error(`Cannot have duplicate keys in a keyed each`);
            }
            keys.add(key);
        }
    }
    function create_component(block) {
        block && block.c();
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
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
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
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
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
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.24.1' }, detail)));
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
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
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
        $capture_state() { }
        $inject_state() { }
    }

    /* src\components\MIDIIcon.svelte generated by Svelte v3.24.1 */

    const file = "src\\components\\MIDIIcon.svelte";

    function create_fragment(ctx) {
    	let svg;
    	let defs;
    	let mask;
    	let rect0;
    	let rect1;
    	let circle0;
    	let circle1;
    	let circle2;
    	let circle3;
    	let circle4;
    	let circle5;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			defs = svg_element("defs");
    			mask = svg_element("mask");
    			rect0 = svg_element("rect");
    			rect1 = svg_element("rect");
    			circle0 = svg_element("circle");
    			circle1 = svg_element("circle");
    			circle2 = svg_element("circle");
    			circle3 = svg_element("circle");
    			circle4 = svg_element("circle");
    			circle5 = svg_element("circle");
    			attr_dev(rect0, "width", "100%");
    			attr_dev(rect0, "height", "100%");
    			attr_dev(rect0, "fill", "white");
    			add_location(rect0, file, 3, 12, 82);
    			attr_dev(rect1, "width", "20%");
    			attr_dev(rect1, "height", "20%");
    			attr_dev(rect1, "x", "40%");
    			attr_dev(rect1, "fill", "black");
    			add_location(rect1, file, 4, 12, 143);
    			attr_dev(circle0, "r", "15");
    			attr_dev(circle0, "cx", "30");
    			attr_dev(circle0, "cy", "110");
    			attr_dev(circle0, "fill", "black");
    			add_location(circle0, file, 5, 12, 210);
    			attr_dev(circle1, "r", "15");
    			attr_dev(circle1, "cx", "60");
    			attr_dev(circle1, "cy", "145");
    			attr_dev(circle1, "fill", "black");
    			add_location(circle1, file, 6, 12, 270);
    			attr_dev(circle2, "r", "15");
    			attr_dev(circle2, "cx", "100");
    			attr_dev(circle2, "cy", "160");
    			attr_dev(circle2, "fill", "black");
    			add_location(circle2, file, 7, 12, 330);
    			attr_dev(circle3, "r", "15");
    			attr_dev(circle3, "cx", "140");
    			attr_dev(circle3, "cy", "145");
    			attr_dev(circle3, "fill", "black");
    			add_location(circle3, file, 8, 12, 391);
    			attr_dev(circle4, "r", "15");
    			attr_dev(circle4, "cx", "170");
    			attr_dev(circle4, "cy", "110");
    			attr_dev(circle4, "fill", "black");
    			add_location(circle4, file, 9, 12, 452);
    			attr_dev(mask, "id", "cutouts");
    			add_location(mask, file, 2, 8, 49);
    			add_location(defs, file, 1, 4, 33);
    			attr_dev(circle5, "id", "midi-icon");
    			attr_dev(circle5, "r", "100");
    			attr_dev(circle5, "cx", "100");
    			attr_dev(circle5, "cy", "100");
    			attr_dev(circle5, "mask", "url(#cutouts)");
    			add_location(circle5, file, 12, 4, 535);
    			attr_dev(svg, "viewBox", "0 0 200 200");
    			add_location(svg, file, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, defs);
    			append_dev(defs, mask);
    			append_dev(mask, rect0);
    			append_dev(mask, rect1);
    			append_dev(mask, circle0);
    			append_dev(mask, circle1);
    			append_dev(mask, circle2);
    			append_dev(mask, circle3);
    			append_dev(mask, circle4);
    			append_dev(svg, circle5);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
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

    function instance($$self, $$props) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<MIDIIcon> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("MIDIIcon", $$slots, []);
    	return [];
    }

    class MIDIIcon extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "MIDIIcon",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    let midi = false;
    let midiCallbacks = [];

    class MIDIAccess {
        constructor(args = {}) {
          this.onDeviceInput = args.onDeviceInput || console.log;
        }
      
        start() {
          return new Promise((resolve, reject) => {
            this._requestAccess().then(access => {
              this.initialize(access);
              resolve();
            }).catch(() => reject('Something went wrong.'));
          });
        }
      
        initialize(access) {
          const devices = access.inputs.values();
          for (let device of devices) this.initializeDevice(device);
        }
      
        initializeDevice(device) {
          device.onmidimessage = this.onMessage.bind(this);
        }
        
        onMessage(message) {
          let [_, input, value] = message.data;
          this.onDeviceInput({ input, value });
        }
      
        _requestAccess() {
          return new Promise((resolve, reject) => {
            if (navigator.requestMIDIAccess)
              navigator.requestMIDIAccess()
                .then(resolve)
                .catch(reject);
            else reject();
          });
        }
    }
      
    function listenForMIDIInput(dialContainer, button, setCallback, inputCallback) {
        console.log(dialContainer, button);

        button.classList.remove('set');
        button.classList.add('active');
        
        if (!midi) {
          midi = new MIDIAccess({ onDeviceInput: setMIDIInput });
          
          midi.start().then(() => {
            console.log('MIDI ACCESS STARTED!');
          }).catch(console.error);
        } else {
          midi.onDeviceInput = setMIDIInput;
        }
        
        function setMIDIInput({ input }) {
          dialContainer.dataset.midi = input;
          dialContainer.style.setProperty('--midi', `'${ input }'`);
          
          setCallback(input);

          midiCallbacks.push({ input, cb: inputCallback });

          button.classList.remove('active');
          button.classList.add('set');
          if (button.nextElementSibling) {
            button.nextElementSibling.innerHTML = 'MIDI ' + input;
          }
          
          midi.onDeviceInput = onDeviceInput;
        }
        
        function onDeviceInput({ input, value }) {
            const foundCb = midiCallbacks.find(({ input: inputVal }) => inputVal === input);

            if (foundCb) {
              foundCb.cb(input, normRange(value, 0, 127));
            }
            
        }
    }


    function normRange(val,min,max) {
        let range = max-min;
        return (val-min)/range;
      }

    /* src\components\DialMIDI.svelte generated by Svelte v3.24.1 */
    const file$1 = "src\\components\\DialMIDI.svelte";

    function create_fragment$1(ctx) {
    	let div10;
    	let h2;
    	let t0_value = /*output*/ ctx[5].toFixed(3) + "";
    	let t0;
    	let t1;
    	let div8;
    	let div2;
    	let div1;
    	let input0;
    	let input0_id_value;
    	let t2;
    	let div0;
    	let t3;
    	let label0;
    	let t4;
    	let label0_for_value;
    	let t5;
    	let div4;
    	let label1;
    	let div3;
    	let div3_style_value;
    	let label1_for_value;
    	let t6;
    	let input1;
    	let input1_id_value;
    	let t7;
    	let div7;
    	let div6;
    	let input2;
    	let input2_id_value;
    	let t8;
    	let div5;
    	let t9;
    	let label2;
    	let t10;
    	let label2_for_value;
    	let t11;
    	let div9;
    	let button;
    	let midiicon;
    	let t12;
    	let p;
    	let div10_style_value;
    	let current;
    	let mounted;
    	let dispose;
    	midiicon = new MIDIIcon({ $$inline: true });

    	const block = {
    		c: function create() {
    			div10 = element("div");
    			h2 = element("h2");
    			t0 = text(t0_value);
    			t1 = space();
    			div8 = element("div");
    			div2 = element("div");
    			div1 = element("div");
    			input0 = element("input");
    			t2 = space();
    			div0 = element("div");
    			t3 = space();
    			label0 = element("label");
    			t4 = text("Min");
    			t5 = space();
    			div4 = element("div");
    			label1 = element("label");
    			div3 = element("div");
    			t6 = space();
    			input1 = element("input");
    			t7 = space();
    			div7 = element("div");
    			div6 = element("div");
    			input2 = element("input");
    			t8 = space();
    			div5 = element("div");
    			t9 = space();
    			label2 = element("label");
    			t10 = text("Max");
    			t11 = space();
    			div9 = element("div");
    			button = element("button");
    			create_component(midiicon.$$.fragment);
    			t12 = space();
    			p = element("p");
    			p.textContent = "Set MIDI Input";
    			attr_dev(h2, "class", "output");
    			add_location(h2, file$1, 33, 4, 900);
    			attr_dev(input0, "class", "dial-min");
    			attr_dev(input0, "id", input0_id_value = `dial-${/*id*/ ctx[0]}-min`);
    			attr_dev(input0, "type", "number");
    			add_location(input0, file$1, 37, 16, 1070);
    			attr_dev(div0, "class", "line");
    			add_location(div0, file$1, 38, 16, 1171);
    			attr_dev(div1, "class", "dial-min-inner");
    			add_location(div1, file$1, 36, 12, 1024);
    			attr_dev(label0, "for", label0_for_value = `dial-${/*id*/ ctx[0]}-min`);
    			add_location(label0, file$1, 40, 12, 1229);
    			attr_dev(div2, "class", "dial-min-wrap");
    			add_location(div2, file$1, 35, 8, 983);
    			attr_dev(div3, "class", "dial-line");
    			attr_dev(div3, "style", div3_style_value = `transform: var(--init-trans) rotate(${(/*normalizedOutput*/ ctx[7] - 0.5) * 180}deg`);
    			add_location(div3, file$1, 44, 16, 1397);
    			attr_dev(label1, "class", "dial-bg");
    			attr_dev(label1, "for", label1_for_value = `dial-${/*id*/ ctx[0]}`);
    			add_location(label1, file$1, 43, 12, 1335);
    			attr_dev(input1, "class", "dial");
    			attr_dev(input1, "id", input1_id_value = `dial-${/*id*/ ctx[0]}`);
    			attr_dev(input1, "type", "range");
    			attr_dev(input1, "step", "any");
    			attr_dev(input1, "min", /*min*/ ctx[3]);
    			attr_dev(input1, "max", /*max*/ ctx[4]);
    			add_location(input1, file$1, 46, 12, 1546);
    			attr_dev(div4, "class", "dial-wrap");
    			add_location(div4, file$1, 42, 8, 1298);
    			attr_dev(input2, "class", "dial-max");
    			attr_dev(input2, "id", input2_id_value = `dial-${/*id*/ ctx[0]}-max`);
    			attr_dev(input2, "type", "number");
    			add_location(input2, file$1, 50, 16, 1771);
    			attr_dev(div5, "class", "line");
    			add_location(div5, file$1, 51, 16, 1872);
    			attr_dev(div6, "class", "dial-max-inner");
    			add_location(div6, file$1, 49, 12, 1725);
    			attr_dev(label2, "for", label2_for_value = `dial-${/*id*/ ctx[0]}-max`);
    			add_location(label2, file$1, 53, 12, 1930);
    			attr_dev(div7, "class", "dial-max-wrap");
    			add_location(div7, file$1, 48, 8, 1684);
    			attr_dev(div8, "class", "dial-row");
    			add_location(div8, file$1, 34, 4, 951);
    			attr_dev(button, "class", "dial-midi");
    			add_location(button, file$1, 57, 8, 2047);
    			attr_dev(p, "class", "midi-status");
    			add_location(p, file$1, 63, 8, 2298);
    			attr_dev(div9, "class", "midi-card-bottom");
    			add_location(div9, file$1, 56, 4, 2007);
    			attr_dev(div10, "class", "dial-container");
    			attr_dev(div10, "style", div10_style_value = `--theme: ${/*color*/ ctx[1]}`);
    			add_location(div10, file$1, 32, 0, 808);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div10, anchor);
    			append_dev(div10, h2);
    			append_dev(h2, t0);
    			append_dev(div10, t1);
    			append_dev(div10, div8);
    			append_dev(div8, div2);
    			append_dev(div2, div1);
    			append_dev(div1, input0);
    			set_input_value(input0, /*min*/ ctx[3]);
    			append_dev(div1, t2);
    			append_dev(div1, div0);
    			append_dev(div2, t3);
    			append_dev(div2, label0);
    			append_dev(label0, t4);
    			append_dev(div8, t5);
    			append_dev(div8, div4);
    			append_dev(div4, label1);
    			append_dev(label1, div3);
    			append_dev(div4, t6);
    			append_dev(div4, input1);
    			set_input_value(input1, /*output*/ ctx[5]);
    			append_dev(div8, t7);
    			append_dev(div8, div7);
    			append_dev(div7, div6);
    			append_dev(div6, input2);
    			set_input_value(input2, /*max*/ ctx[4]);
    			append_dev(div6, t8);
    			append_dev(div6, div5);
    			append_dev(div7, t9);
    			append_dev(div7, label2);
    			append_dev(label2, t10);
    			append_dev(div10, t11);
    			append_dev(div10, div9);
    			append_dev(div9, button);
    			mount_component(midiicon, button, null);
    			append_dev(div9, t12);
    			append_dev(div9, p);
    			/*div10_binding*/ ctx[14](div10);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[10]),
    					listen_dev(input1, "change", /*input1_change_input_handler*/ ctx[11]),
    					listen_dev(input1, "input", /*input1_change_input_handler*/ ctx[11]),
    					listen_dev(input2, "input", /*input2_input_handler*/ ctx[12]),
    					listen_dev(button, "click", /*click_handler*/ ctx[13], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*output*/ 32) && t0_value !== (t0_value = /*output*/ ctx[5].toFixed(3) + "")) set_data_dev(t0, t0_value);

    			if (!current || dirty & /*id*/ 1 && input0_id_value !== (input0_id_value = `dial-${/*id*/ ctx[0]}-min`)) {
    				attr_dev(input0, "id", input0_id_value);
    			}

    			if (dirty & /*min*/ 8 && to_number(input0.value) !== /*min*/ ctx[3]) {
    				set_input_value(input0, /*min*/ ctx[3]);
    			}

    			if (!current || dirty & /*id*/ 1 && label0_for_value !== (label0_for_value = `dial-${/*id*/ ctx[0]}-min`)) {
    				attr_dev(label0, "for", label0_for_value);
    			}

    			if (!current || dirty & /*normalizedOutput*/ 128 && div3_style_value !== (div3_style_value = `transform: var(--init-trans) rotate(${(/*normalizedOutput*/ ctx[7] - 0.5) * 180}deg`)) {
    				attr_dev(div3, "style", div3_style_value);
    			}

    			if (!current || dirty & /*id*/ 1 && label1_for_value !== (label1_for_value = `dial-${/*id*/ ctx[0]}`)) {
    				attr_dev(label1, "for", label1_for_value);
    			}

    			if (!current || dirty & /*id*/ 1 && input1_id_value !== (input1_id_value = `dial-${/*id*/ ctx[0]}`)) {
    				attr_dev(input1, "id", input1_id_value);
    			}

    			if (!current || dirty & /*min*/ 8) {
    				attr_dev(input1, "min", /*min*/ ctx[3]);
    			}

    			if (!current || dirty & /*max*/ 16) {
    				attr_dev(input1, "max", /*max*/ ctx[4]);
    			}

    			if (dirty & /*output*/ 32) {
    				set_input_value(input1, /*output*/ ctx[5]);
    			}

    			if (!current || dirty & /*id*/ 1 && input2_id_value !== (input2_id_value = `dial-${/*id*/ ctx[0]}-max`)) {
    				attr_dev(input2, "id", input2_id_value);
    			}

    			if (dirty & /*max*/ 16 && to_number(input2.value) !== /*max*/ ctx[4]) {
    				set_input_value(input2, /*max*/ ctx[4]);
    			}

    			if (!current || dirty & /*id*/ 1 && label2_for_value !== (label2_for_value = `dial-${/*id*/ ctx[0]}-max`)) {
    				attr_dev(label2, "for", label2_for_value);
    			}

    			if (!current || dirty & /*color*/ 2 && div10_style_value !== (div10_style_value = `--theme: ${/*color*/ ctx[1]}`)) {
    				attr_dev(div10, "style", div10_style_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(midiicon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(midiicon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div10);
    			destroy_component(midiicon);
    			/*div10_binding*/ ctx[14](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { id = 0 } = $$props;
    	let { color = "hsl(320deg, 60%, 60%)" } = $$props;
    	let containerDOM;
    	let min = 0;
    	let max = 100;
    	let output = (max - min) / 2 - min;
    	let midiInput = false;
    	const dispatch = createEventDispatcher();

    	function setMIDICallback(input) {
    		if (!midiInput) {
    			$$invalidate(6, midiInput = input);
    		}
    	}

    	function inputMIDICallback(input, val) {
    		if (input !== midiInput) return;
    		$$invalidate(5, output = val * (max - min) + min);
    	}

    	const writable_props = ["id", "color"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<DialMIDI> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("DialMIDI", $$slots, []);

    	function input0_input_handler() {
    		min = to_number(this.value);
    		$$invalidate(3, min);
    	}

    	function input1_change_input_handler() {
    		output = to_number(this.value);
    		$$invalidate(5, output);
    	}

    	function input2_input_handler() {
    		max = to_number(this.value);
    		$$invalidate(4, max);
    	}

    	const click_handler = function (e) {
    		$$invalidate(6, midiInput = false);
    		listenForMIDIInput(containerDOM, this, setMIDICallback, inputMIDICallback);
    	};

    	function div10_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			containerDOM = $$value;
    			$$invalidate(2, containerDOM);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("id" in $$props) $$invalidate(0, id = $$props.id);
    		if ("color" in $$props) $$invalidate(1, color = $$props.color);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		MIDIIcon,
    		listenForMIDIInput,
    		id,
    		color,
    		containerDOM,
    		min,
    		max,
    		output,
    		midiInput,
    		dispatch,
    		setMIDICallback,
    		inputMIDICallback,
    		normalizedOutput
    	});

    	$$self.$inject_state = $$props => {
    		if ("id" in $$props) $$invalidate(0, id = $$props.id);
    		if ("color" in $$props) $$invalidate(1, color = $$props.color);
    		if ("containerDOM" in $$props) $$invalidate(2, containerDOM = $$props.containerDOM);
    		if ("min" in $$props) $$invalidate(3, min = $$props.min);
    		if ("max" in $$props) $$invalidate(4, max = $$props.max);
    		if ("output" in $$props) $$invalidate(5, output = $$props.output);
    		if ("midiInput" in $$props) $$invalidate(6, midiInput = $$props.midiInput);
    		if ("normalizedOutput" in $$props) $$invalidate(7, normalizedOutput = $$props.normalizedOutput);
    	};

    	let normalizedOutput;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*output, min, max*/ 56) {
    			 $$invalidate(7, normalizedOutput = (output - min) / (max - min));
    		}

    		if ($$self.$$.dirty & /*output*/ 32) {
    			 if (output) {
    				dispatch("midiinput", output);
    			}
    		}
    	};

    	return [
    		id,
    		color,
    		containerDOM,
    		min,
    		max,
    		output,
    		midiInput,
    		normalizedOutput,
    		setMIDICallback,
    		inputMIDICallback,
    		input0_input_handler,
    		input1_change_input_handler,
    		input2_input_handler,
    		click_handler,
    		div10_binding
    	];
    }

    class DialMIDI extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { id: 0, color: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "DialMIDI",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get id() {
    		throw new Error("<DialMIDI>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<DialMIDI>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<DialMIDI>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<DialMIDI>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\App.svelte generated by Svelte v3.24.1 */
    const file$2 = "src\\App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	child_ctx[4] = list;
    	child_ctx[5] = i;
    	return child_ctx;
    }

    // (20:2) {#each controls as control, i (control.color+i)}
    function create_each_block(key_1, ctx) {
    	let first;
    	let dialmidi;
    	let current;

    	function midiinput_handler(...args) {
    		return /*midiinput_handler*/ ctx[2](/*control*/ ctx[3], /*each_value*/ ctx[4], /*i*/ ctx[5], ...args);
    	}

    	dialmidi = new DialMIDI({
    			props: {
    				id: /*i*/ ctx[5],
    				color: /*control*/ ctx[3].color
    			},
    			$$inline: true
    		});

    	dialmidi.$on("midiinput", midiinput_handler);

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			create_component(dialmidi.$$.fragment);
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);
    			mount_component(dialmidi, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const dialmidi_changes = {};
    			if (dirty & /*controls*/ 1) dialmidi_changes.id = /*i*/ ctx[5];
    			if (dirty & /*controls*/ 1) dialmidi_changes.color = /*control*/ ctx[3].color;
    			dialmidi.$set(dialmidi_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(dialmidi.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(dialmidi.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			destroy_component(dialmidi, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(20:2) {#each controls as control, i (control.color+i)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let main;
    	let section0;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let t0;
    	let button;
    	let t2;
    	let section1;
    	let svg;
    	let rect;
    	let rect_x_value;
    	let rect_y_value;
    	let rect_width_value;
    	let rect_height_value;
    	let rect_fill_value;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value = /*controls*/ ctx[0];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*control*/ ctx[3].color + /*i*/ ctx[5];
    	validate_each_keys(ctx, each_value, get_each_context, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			main = element("main");
    			section0 = element("section");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t0 = space();
    			button = element("button");
    			button.textContent = "+ Add MIDI Input";
    			t2 = space();
    			section1 = element("section");
    			svg = svg_element("svg");
    			rect = svg_element("rect");
    			attr_dev(button, "class", "add-midi svelte-1gya0lc");
    			add_location(button, file$2, 25, 2, 675);
    			attr_dev(section0, "class", "grid svelte-1gya0lc");
    			add_location(section0, file$2, 18, 1, 437);
    			attr_dev(rect, "x", rect_x_value = getCtrl(/*controls*/ ctx[0][0], 5));
    			attr_dev(rect, "y", rect_y_value = getCtrl(/*controls*/ ctx[0][1], 2.5));
    			attr_dev(rect, "width", rect_width_value = getCtrl(/*controls*/ ctx[0][2], 10));
    			attr_dev(rect, "height", rect_height_value = getCtrl(/*controls*/ ctx[0][3], 5));
    			attr_dev(rect, "fill", rect_fill_value = `hsl(${getCtrl(/*controls*/ ctx[0][4], 80)}deg, ${getCtrl(/*controls*/ ctx[0][5], 60)}%, ${getCtrl(/*controls*/ ctx[0][6], 60)}%)`);
    			add_location(rect, file$2, 29, 3, 853);
    			attr_dev(svg, "viewBox", "0 0 20 10");
    			set_style(svg, "max-width", "720px");
    			set_style(svg, "border", "solid 4px");
    			add_location(svg, file$2, 28, 2, 778);
    			add_location(section1, file$2, 27, 1, 765);
    			attr_dev(main, "class", "svelte-1gya0lc");
    			add_location(main, file$2, 17, 0, 428);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, section0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(section0, null);
    			}

    			append_dev(section0, t0);
    			append_dev(section0, button);
    			append_dev(main, t2);
    			append_dev(main, section1);
    			append_dev(section1, svg);
    			append_dev(svg, rect);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*addControl*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*controls*/ 1) {
    				const each_value = /*controls*/ ctx[0];
    				validate_each_argument(each_value);
    				group_outros();
    				validate_each_keys(ctx, each_value, get_each_context, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, section0, outro_and_destroy_block, create_each_block, t0, get_each_context);
    				check_outros();
    			}

    			if (!current || dirty & /*controls*/ 1 && rect_x_value !== (rect_x_value = getCtrl(/*controls*/ ctx[0][0], 5))) {
    				attr_dev(rect, "x", rect_x_value);
    			}

    			if (!current || dirty & /*controls*/ 1 && rect_y_value !== (rect_y_value = getCtrl(/*controls*/ ctx[0][1], 2.5))) {
    				attr_dev(rect, "y", rect_y_value);
    			}

    			if (!current || dirty & /*controls*/ 1 && rect_width_value !== (rect_width_value = getCtrl(/*controls*/ ctx[0][2], 10))) {
    				attr_dev(rect, "width", rect_width_value);
    			}

    			if (!current || dirty & /*controls*/ 1 && rect_height_value !== (rect_height_value = getCtrl(/*controls*/ ctx[0][3], 5))) {
    				attr_dev(rect, "height", rect_height_value);
    			}

    			if (!current || dirty & /*controls*/ 1 && rect_fill_value !== (rect_fill_value = `hsl(${getCtrl(/*controls*/ ctx[0][4], 80)}deg, ${getCtrl(/*controls*/ ctx[0][5], 60)}%, ${getCtrl(/*controls*/ ctx[0][6], 60)}%)`)) {
    				attr_dev(rect, "fill", rect_fill_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function getCtrl(ctrl, fallbackVal) {
    	return ctrl && ctrl.value !== undefined
    	? ctrl.value
    	: fallbackVal;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let controls = [];

    	function addControl() {
    		const hue = Math.random() * 360 + "deg";
    		const sat = Math.random() * 20 + 50 + "%";
    		const lit = "65%";
    		$$invalidate(0, controls = [...controls, { color: `hsl(${hue}, ${sat}, ${lit})` }]);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);

    	const midiinput_handler = (control, each_value, i, { detail }) => {
    		$$invalidate(0, each_value[i].value = detail, controls);
    		$$invalidate(0, controls = [...controls]);
    	};

    	$$self.$capture_state = () => ({ DialMIDI, controls, addControl, getCtrl });

    	$$self.$inject_state = $$props => {
    		if ("controls" in $$props) $$invalidate(0, controls = $$props.controls);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [controls, addControl, midiinput_handler];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$2.name
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
