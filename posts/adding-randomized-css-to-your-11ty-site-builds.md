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

I use 11ty as my static site generator (SSG) for this blog so we'll be seeing its syntax and opinions when we look at my implementation below, but if you wanted to have random styling with your Gridsome or Gatsby site, the general process is as follows:

1. Identify the style you want to be random (or calculated at build-time). This could be a color like I did, or a font family, or any crazy combination of things that can be defined in your CSS.
2. Learn about your SSG's build process. Every static site generator has one, and any of them worth your time have exposed points in that process where you can insert data into your site. Write your function to randomly-generate or calculate 



## The Wave

I used Figma to mock up my site before starting to redesign it, and I was able to export the wave shape directly from Figma as an SVG to use in my code.

## The Logic

Now let's create the data to make available to our SVG.



## Conclusion

This is just a minimum implementation of something much more powerful. On my site I used random numbers to change styles on my site, but we could have just as easily fetched data from an api and included it in our project: that's how most SSG plugins for CMSes work. And we can get way more abstract and avant garde. What if we put a haze on our website based on the current air quality index in our city? or changed the font based on what time of day we pushed the change to our site?