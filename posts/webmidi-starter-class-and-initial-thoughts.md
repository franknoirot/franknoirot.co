---
title: WebMIDI Starter Class and Initial Thoughts
slug: webmidi-starter-class-and-initial-thoughts
layout: layouts/post.njk
date: 2020-08-28T21:58:00.429Z
description: Lessons learned from a starter class for MIDI access written by
  Jake Albaugh on CodePen.
tags:
  - post
  - code
featuredImg: /img/2020-08-28-web_midi.jpg
---
I'm beginning to think about piano-style keyboards and MIDI synths beyond music, as high-dimensional instruments. With one hand a user can select up to five items using the keys, and with the other they can slide a fader, turn a knob, hit a pad, or play up to five more notes. I think exploring high-dimensional datasets could benefit a lot from research into MIDI input interface designs.

I've also become interested in MIDI because it is such a straightforward protocol with so many devices that use it natively, so there are a lot of physical interfaces out there that are affordable and use a standard, easy-to-process communication system. Every key, slider, pad, and knob on a MIDI controller has a number input ID, and its current value is represented as an integer between 0 and 127 (8 bits). These devices are most commonly used in electronic music—keyboards, drum pads, mixers, etc—but there's nothing stopping someone from using them outside of music.

There is a spec for [WebMIDI](https://www.w3.org/TR/webmidi/) that has been implemented in Chrome (hoping Firefox can someday manage to implement it, layoffs be damned), and working with MIDI in Javascript is surprisingly straightforward! There are larger tools available like the [WebMIDI.js library](https://djipco.github.io/webmidi/latest/classes/WebMidi.html), but I learned a lot from [this CodePen](https://codepen.io/jakealbaugh/pen/LBOjwr) by Jake Albaugh, who used to work for CodePen. In it he wrote this great little utility class that does all the checks for MIDI implementation and user interaction, which is required before you can request MIDI access from the user.

```javascript
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
```

All you have to do to use this class is add a interaction listener to your page, or an element like a toggle as I did, and within the listener's callback invoke the `MIDIAccess` class, passing in a function that will be called every time MIDI input is detected, named `onDeviceInput`. Jake also added a `started` variable that ensures that the `MIDIAccess` class is only invoked once, otherwise your MIDI input will trigger the callback multiple times if, say, someone toggles MIDI control off then back on again.

```javascript
let started = false;
document.documentElement.addEventListener('mousedown', () => {
  if (started) return;
  started = true;
  const midi = new MIDIAccess({ onDeviceInput });
  midi.start().then(() => {
    console.log('STARTED!');
  }).catch(console.error):

  function onDeviceInput({ input, value }) {
    //... your callback that does some action based on what knobs are turned or notes are played
  }
});
```

The `onDeviceInput` callback will receive an Object with keys `input` and `value`, which are shown being destructured in the example above. Each of these is a simple integer, the latter ranging between 0 and 127: the heart of the MIDI protocol. One small method I would recommend adding to Jake's class is `normalize()` or `normalizeMIDI()`, a function that returns a value from 0 to 1 instead of 0 to 127:

```javascript
Class MIDIAccess {
  // ...
  static normalize(val) {
    return val / 127
  }

  // ...
}
```

This will make it easier to understand your code looking back on it: instead of having `/ 127` sprinkled throughout your code you can convert the MIDI input value to a normalized one right away within your input handler with `MIDIAccess.normalize(value)`. From there you can transform the input value into any meaningful range, for example 0 to 360 for degrees of rotation or hue.

I've started building a tool to let you associate arbitrary MIDI controls with arbitrary outputs that you can [check out here](/work/midi-controller). It's built with Svelte.js because I can move fastest with that library, but I would love to see others building creative new MIDI interfaces with Vue and React! If you have any ideas for non-musical MIDI interface use cases please reach out to me on [Twitter](https://twitter.com/frank_noirot) or [Instagram](https://instagram.com/franknoirot).