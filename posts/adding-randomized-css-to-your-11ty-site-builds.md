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