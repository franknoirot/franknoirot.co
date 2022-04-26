---
title: "Back up Svelte Kit stores to localStorage"
slug: svelte-kit-stores-localstorage
layout: layouts/post.njk
date: 2022-04-26T08:00:00.000Z
description: "Automatically back up and retrieve your Svelte stores from localStorage with these small helper functions."
tags:
  - post
  - code
featuredImg: /img/svelte-localstorage.jpg
---

Svelte stores are part of the reason it's my favorite JavaScript framework to work with. They're reactive, globally-sharable, and have an ergonomic API. The only problem with them is that, like most JS global state solutions, they disappear on page refresh. Let's fix that by writing a few helper functions to back them up to localStorage.

# make a `stores.ts` file
If you're not familiar with Svelte stores, the [official Svelte interactive tutorial](https://svelte.dev/tutorial/basics) is where you should head first. It really is an excellent way to get used to the concepts. Then make a `store.ts` (or `store.js`) file in your Svelte project directory. If you're using Svelte Kit like I am these days, I like to put it in `/lib/stores.ts` to be able to import it later easily with `$lib/stores`.

Now you can create stores as you normally would, importing `readable`, `writable`, and `derived` stores as necessary. Here is one of my stores as an example:
```ts
// Trip ID. The ID of the user's most recent reserved trip.
export const tripId = writable('')
```

## a `fromLocalStorage method`
The first step in a robust, backed-up Svelte store is get a value from local storage if it exists, and fallback to a provided initial value if it's provided. I've named this function `fromLocalStorage`. It uses [SvelteKit's importable environment variable](https://kit.svelte.dev/docs/modules#$app-env-browser) to detect if we're in a browser or serverside context, so that we don't accidentally try to use `localStorage` when there isn't a `window` present.

```ts
import { browser } from '$app/env';

// Get value from localStorage if in browser and the value is stored, otherwise fallback
function fromLocalStorage(storageKey: string, fallbackValue: any) {
	if (browser) {
		const storedValue = window.localStorage.getItem(storageKey)
		
		if (storedValue !== 'undefined' && storedValue !== null) {
			return (typeof fallbackValue === 'object') 
				? JSON.parse(storedValue)
				: storedValue
		}
	}
	
	return fallbackValue
}
```

Nothing much going on here right? Local storage will return `undefined` if you try to get items that don't exist, so we need to verify that `storedValue` is valid before returning it, and if not or if we're not in the browser, just return the fallback default value. I also added a check to see if our fallback value has a `typeof` equal to Object (which includes things like Arrays and Dates in JavaScript), so that we can parse them to match the desired type on the way out.

Returning to our example store, here's what it looks like after augmenting it to use `fromLocalStorage`:
```ts
// Trip ID. The ID of the user's most recent reserved trip.
export const tripId = writable(fromLocalStorage('tripId', ''))
```

It slots right into the initial value we pass into our `writable` store. I like this approach because it allows us to *opt into* which of our stores are important enough to be backed up to local storage, and let some just exist in memory. We haven't wrapped things in too many abstractions.

## a `toLocalStorage` method
Now we have a writable store that will pull from local storage if a value is there. You can verify this works by manually putting values in your local storage using the developer tools of your browser (it's in the Application tab in Chrome), and I recommend you do this if it's your first time working with local storage just to get familiar with it. But for things to really work we'll hook up a listener to push the store's value into local storage any time it changes.

One of the defining features of Svelte stores is that they have a [`subscribe()` method](https://svelte.dev/docs#run-time-svelte-store-writable). Our `toLocalStorage` function will basically be a general store listener that pushes any new received values into local storage at the provided `storageKey`:

```ts
function toLocalStorage(store, storageKey: string) {
	if (browser) {
		store.subscribe(value => {
			let storageValue = (typeof value === 'object') 
				? JSON.stringify(value)
				: value
				
			window.localStorage.setItem(storageKey, storageValue)
		})
	}
}
```

In the reverse of our `fromLocalStorage` function, I've added a ternary assignment to make sure we stringify any objects before putting them into local storage. Returning once again to our example store, here it is given full local storage superpowers:

```ts
// Trip ID. The ID of the user's most recent reserved trip.
export const tripId = writable(fromLocalStorage('tripId', ''))
toLocalStorage(tripId, 'tripId')
```

And just like that, you've got backed up store values for any reactive state in your app! If you don't make any use of [SvelteKit load functions](https://kit.svelte.dev/docs/loading#input) or page endpoints you should be all set. [Reach out](mailto:frank@franknoirot.co) if you have any issues or questions.

## handling serverside use cases
You can't use Svelte stores script tags with `context="module"`, which makes sense since those are not a part of the runtime and have no concept of reactivity, they simply load and run normal JavaScript.

However, in several places in my app I have a localStorage-powered store that also is used in these load functions to perform a query from my CMS, so I needed the value out of localStorage even if I couldn't get the store itself. In cases like this, I recommend you export your initial value of the store separately from the store itself, so that you can import just the backed up value. My example here is the saved pick-up time for a rental reservation:
```ts
// src/lib/stores.ts
import { offsetNowHours } from './timeHelpers';

// Trip pickup, saved as a Date.
// Initial value is used in the individual car page to validate availability on load,
// Because Svelte stores are not available within that context.
export const pickupInitialValue = fromLocalStorage('pickup', offsetNowHours(1.5))
export const pickup = writable(pickupInitialValue)
toLocalStorage(pickup, 'pickup')

// Trip dropoff, saved as a Date.
export const dropoffInitialValue = fromLocalStorage('dropoff', offsetNowHours(25.5))
export const dropoff = writable(dropoffInitialValue)
toLocalStorage(dropoff, 'dropoff')
```

Note how the initial values of both `pickup` and `dropoff` are now broken out and exported as their own values. This means that in a page load function I can still have localStorage backups by importing them like in the snippet from a svelte component below.

```js
// src/routes/cars/[id].svelte
<script context="module">
	import { getCarByIdvalidateCarDates } from '$lib/cms';
	import { pickupInitialValue, dropoffInitialValue } from '$lib/stores';
	export const prerender = false; // set page to not pre-render for live car info
	
	export async function load({ params }) {
		const car = await getCarById(params.id)

		if (!car) {
			return {
				status: 308,
				redirect: '/',
			}
		}
	
		const isAvailable = await validateCarDates(params.id, {
			pickup: pickupInitialValue,
			dropoff: dropoffInitialValue,
		})
	
		return {
			props: {
				car,
				isAvailable,
			}
		}
	}
</script>
```

I have been really happy with how resiliant and easy to use this workflow has been, and I hope it makes your work with SvelteKit even more enjoyable than it already is. Happy coding.