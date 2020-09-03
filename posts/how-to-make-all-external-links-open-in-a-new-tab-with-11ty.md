---
title: How to Make All External Links Open in a New Tab with 11ty
layout: layouts/post.njk
date: 2020-09-03T22:27:51.303Z
description: We can make links that point away from our static site open in a
  new tab by pre-processing them at build time with a custom MarkdownIt plugin.
tags:
  - post
  - code
featuredImg: /img/2020-09-03-markdown-it-links.jpg
---
I get frustrated when I click a resource link in the middle of a blog post and I'm navigated away from the post. I am usually trying to open up tabs to read later, after I finish the current post, so I'm expecting the links to open new tabs as I go, especially if they're to another domain. But I realized the other day that links on my blog all opened in the same window, and since I write my blog in Markdown through [11ty](https://11ty.dev) I wasn't exactly sure how to to manipulate that behavior.

By default 11ty uses [Markdown It](https://github.com/markdown-it/markdown-it) as its Markdown parser program, which can be configured within the `.eleventy.js` file in your project's root. If you used a starter template for your project like I did, chances are there are already some configurations made to Markdown It. On my blog starter two plugins had already been added: a near-standard plugin called `linkify-it` and `markdown-header-anchor`, which adds little anchor links after each heading of my blog posts.

All we need to do is add a very short Markdown It plugin of our own that checks each link in turn, and if it determines that link to be external, add the `target="_blank"` and `rel="noopener noreferrer"` links to it. The way to use a plugin is chain it after your initial startup call to `markdownIt` with a `.use()` call, like `markdownIt({ /*  config */}).use(pluginName).use(anotherPlugin)`.

The easiest way to accomplish this unfortunately adds one more dependency to our project: `markdown-it-for-inline`. I'm not sure how to get around this dependency as it is referenced in each of the similar plugin examples on [Markdown It's documentation](https://github.com/markdown-it/markdown-it/blob/master/docs/architecture.md). 

Use npm install `markdown-it-for-inline` and add `const mdIterator = require('markdown-it-for-inline')` to the top of your `.eleventy.js` file. Now we can use this iterator returned by the package to check each link in turn.

Here is the final bit of code for our plugin. The new code consists of just five lines, the first `.use()` statement:

```jsx
const mdIterator = require('markdown-it-for-inline')
// other JS...

let markdownLibrary = markdownIt({
    html: true,
    breaks: true,
    linkify: true
  }).use(mdIterator, 'url_new_win', 'link_open', function (tokens, idx) {
    const [attrName, href] = tokens[idx].attrs.find(attr => attr[0] === 'href')
    
    if (href && (!href.includes('franknoirot.co') && !href.startsWith('/') && !href.startsWith('#'))) {
      tokens[idx].attrPush([ 'target', '_blank' ])
      tokens[idx].attrPush([ 'rel', 'noopener noreferrer' ])
    }
  }).use(markdownItAnchor, {
    permalink: true,
    permalinkClass: "direct-link",
    permalinkSymbol: "#"
  })
  eleventyConfig.setLibrary("md", markdownLibrary);
```

Our plugin takes the `mdIterator` we got from the `markdown-it-for-inline` package, a name of the new token rule we're creating, the name of the tokens we are looking though (`'link_open'`), and a callback to process those tokens one at a time.

This callback is passed two parameters that we care about (there are a few more available if you need more complex behavior): `tokens` and `idx`. `tokens` is a list of all the tokens in this category and `idx` is the current index the iterator is currently on, so the current link's value can be reached with `tokens[idx]`. The link is an object with several available keys (try `console.log(tokens[idx])` to see them all), and we can check the link's `href` by searching through the array of `attrs` on the link object to find the array containing 'href' as it's first item.

From there we check if this array exists, doesn't have my domain name in it, and doesn't start with `/` or `#` for relative and anchor URLs. If it meets all those conditions it's an external link, so we add the `target` and `rel` attributes to it with the `attrsPush()` method.

And just like that we have smarter links! You can see its effects in action here with an external link to [my Instagram account](https://instagram.com/franknoirot) and an internal link to [my concepting tool](https://franknoirot.co/work/concepting-tool).