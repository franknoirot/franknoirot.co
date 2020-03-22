---
title: Adding Randomized CSS to Your 11ty Site Builds
layout: layouts/post.njk
date: 2020-03-21T15:54:58.417Z
description: >-
  Learn how I made the color of the gradient background on my homepage change
  with every re-build of my site
tags:
  - post
  - code
---
I like to add whimsy to my code projects whenever I can, even if it's just for me to see. This is definitely one of those things.

At time of writing there is a large wave-shaped graphic in the background of my homepage that is filled with two gradients, left-to-right fading between two colors, and top-to-bottom fading from opaque to transparent. I wrote a bit of logic so that whenever I push new code to my site or publish a new post, those two colors are randomly generated. Furthermore, the text on either side of my homepage is set to a dark shade of each color. It adds a bit of fun into finishing code or wrapping up a blog post, because I don't know exactly what tone my site is going to have until I visit it.

I use [11ty ](https://www.11ty.dev/)as my static site generator ([SSG](https://myles.github.io/awesome-static-generators/#awesome-static-web-site-generators)) for this blog so we'll be seeing its syntax and opinions when we look at my implementation below, but if you wanted to have random styling with your [Gridsome ](https://gridsome.org/)or [Gatsby](https://www.gatsbyjs.org/) site, the general process is as follows:

1. Identify the style you want to be random (or calculated at build-time). This could be a color like I did, or a font family, or any crazy combination of things that can be defined in your CSS.
2. Learn about your SSG's build process. Every static site generator has one, and any of them worth your time have exposed points in that process where you can insert data into your site. In Gatsby there's a file called [`gatsby-node.js`](https://www.gatsbyjs.org/docs/api-files-gatsby-node/) that lets you write code that runs at build time. In 11ty there is a concept called the [Data Cascade](https://www.11ty.dev/docs/data-cascade/) that lets you sprinkle in data and logic at many different points in the build. Write your function to randomly-generate or calculate your values and make them available to your site.
3. Go back into the page/template your want to add random styles to, and set styles to that new variable you just made available. Now next time you build your site you'll get some randomized styling!

## The Wave

I used Figma to mock up my site before starting to redesign it, and I was able to export the wave shape directly from Figma as an SVG file. I then threw it through [SVGOMG](https://jakearchibald.github.io/svgomg/) mostly because I like Jake Archibald but also just in case it could optimize it a bit, and pasted the code within it into my page. SVGs are kind of chameleons, which can either be referenced as an image (using the `src` attribute) or treated just like HTML code inline. If you want to use CSS on internal properties like `fill` you have to put the SVG code inline.

Now that we

## The Logic

Now let's create the data to make available to our SVG.

## Conclusion

This is just a minimum implementation of something much more powerful. On my site I used random numbers to change styles on my site, but we could have just as easily fetched data from an api and included it in our project: that's how most SSG plugins for CMSes work. And we can get way more abstract and avant garde. What if we put a haze on our website based on the current air quality index in our city? or changed the font based on what time of day we pushed the change to our site?