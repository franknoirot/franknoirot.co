---
title: Learning 11ty's Data Cascade with Random Themes
layout: layouts/post.njk
date: 2020-08-01T22:51:06.955Z
description: Using 11ty's Data Cascade and some simple random number generation
  we can get a website theme that changes every time it's rebuilt.
tags:
  - post
  - code
featuredImg: /img/11ty-theme.jpg
---
11ty has this excellent notion of the [Data Cascade](https://www.11ty.dev/docs/data-cascade/), which will be familiar to users of CSS. One element of that Cascade is that any JavaScript (or JSON) you place within the `/_data` directory of your project will be read at build time, and if the JavaScript exports an object it will be included within a global data object as a parameter with the same name as the file. JSON files get rolled in in the same way. You can then use that data within your template files with `fileName.parameterName`.

To try out this concept while building my new portfolio site, I decided to use it to randomly generate the two colors that make up the theme of my site.

The first file this uses is `/_data/theme.js`, which defines two random color and builds an object of different utility values we'll use in our CSS.

```jsx
// set a random hue, then get the hues 100 and 200deg away from it
const randColor = Math.round(Math.random()*360)
colors = [randColor, (randColor + 100) % 360, (randColor + 200) % 360]

// build an object with paramaeters for each
// of the three colors, each an object with
// a hue and a brightness
const colorExports = {}
colors.forEach((color, i) => {
    colorExports[`color${ i+1 }`] = {}
    colorExports[`color${ i+1 }`].hue = color + 'deg'
    colorExports[`color${ i+1 }`].brightness = rgbBrightness(hsl2rgb(color/360, .5, .5)).toPrecision(3)
})

module.exports = {
    ...colorExports,
}

// helper function for hsl2rgb
function rgbBrightness(rgb) {
    return Math.sqrt(
        rgb.r**2 * .241 +
        rgb.g**2 * .691 +
        rgb.b**2 * .068
    )
}

function hsl2rgb(h, s, l) {
    // ...do some conversions i googled
    return { r, g, b }
}
```

The only other thing we need is an include called `theme.njk` (I used Nunjucks for my website but can use a number of template languages). Includes are snippets of code that you can save as separate files within an `/_includes` directory, then drop into your template files. Nunjucks is usually used for HTML, but this file will just be a style tag so we can use Nunjucks' superpowers in our CSS.

<div class='steezy-pre'>

```html
<!-- /_includes/theme.js -->
<style id='theme-data'>
   {% raw %}
    :root {
        {% for colorName, color in theme %}
        --theme-hue-{{loop.index}}: {{ color.hue }};
        --theme-brightness-{{loop.index}}: {{ color.brightness }};
        --theme-color-{{loop.index}}: hsl(var(--theme-hue-{{loop.index}}), 60%, 85%);
        --theme-color-{{loop.index}}-dark: hsl(var(--theme-hue-{{loop.index}}), 80%, {% adjustBrightness 5, 20, color.brightness %}%);
        {% endfor %}
    }
    {% for colorName, color in theme %}
    a.theme-{{loop.index}}:hover,
    a.theme-{{loop.index}}:focus {
        color: hsl(var(--theme-hue-{{loop.index}}), 60%, 65%);
    }
    a.theme-{{loop.index}}:hover path,
    a.theme-{{loop.index}}:focus path {
        fill: hsl(var(--theme-hue-{{loop.index}}), 60%, 65%);
    }
    {% endfor %}
    {% endraw %}
</style>
```

</div>

In this file we loop over each of the colors created in our theme.js file, which is available simply as theme, and create a series of CSS custom properties we can then use throughout our site. Just for fun I added some classes that give links a with a theme class a hover color too.

Now I *include* this include into my `base.njk` template that every page inherits from.

```html
<!-- /_includes/layouts/base.njk -->
<!doctype html>
<html lang="en">
  <head>
  <!-- ... more meta and styles ... -->
  {% raw %}
  {% include theme.njk %}
  {% endraw %}
  <!-- more HTML and whatnot -->
```

Just like that I've got a bunch of theme CSS variables available for me to color things across the site with that are randomly determined at build time!

I never know what colors my site will have until after I rebuild it, which makes the process just a bit more fun. Currently theme color 1 is `{{ theme.color1.hue }}` and color 2 is `{{ theme.color2.hue }}`. And if I don't like them, well that just that little nudge I need to write my next post.