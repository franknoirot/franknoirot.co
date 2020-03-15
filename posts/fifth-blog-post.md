---
title: Building a Side Projects Directory Using GitHub Actions
layout: layouts/post.njk
date: 2020-03-15T16:32:36.167Z
description: A fifth post to show the CMS is working.
tags:
  - code
---
# Building a Side Project Directory

## The Problem

I am currently converting my portfolio site from [Jekyll](https://jekyllrb.com/) to [11ty](https://11ty.dev) because I want to get closer to knowing how every line in my site works, and right now I am far more capable and motivated to do that with a Node.js code base than one written in Ruby.

While I'm at it I decided to try to fix one annoyance I have. There are many side projects and toy sites that I like to include onto my personal site, things like this Pantone color picker and this [map animator](https://franknoirot-11ty.netlify.com/work/map-animator) or even prototypes of things I am coming up with to help my colleagues like this [SEO Checker](https://franknoirot-11ty.netlify.com/work/seo-checker). It's nice to have my personal site there as a kind of scratchpad for projects that aren't ready for prime time yet.

But because I am still pretty new to building out these projects and managing Git repos, I have not yet found an elegant way to have my side project's site directory (they're nearly all static sites) to my site's directory. So I have been committing code to my side project's GitHub repo, copying it, and uploading it to my portfolio site's repo using GitHub.com's GUI. I don't know much, but this doesn't feel like modern development to me. 

I will be spending time learning [Make](https://www.gnu.org/software/make/manual/html_node/Introduction.html), [Webpack](https://webpack.js.org/), and [Rollup](https://rollupjs.org/guide/en/) to learn how to do this as part of my side projects' build process, but even if I learn the art of build configuration, each of my different side projects would have different "vendor lock-in" configurations to push each project to my portfolio, and furthermore I would always need to have my entire portfolio site pulled to whatever machine I was working on. Gross!

## The Solution

Enter [GitHub Actions](https://github.com/features/actions) and Netlify. Instead of copying and pasting my side project's site *manually,* let's push code to our side project repo and [Octocat](https://octodex.github.com/) go off and run those errands for us! And we'll do it one better: let's add a custom \*specially-named\* config file to our side project's root folder, where we can define anything we want about how that side project shows up and gets linked-to on the portfolio site!

### Portfolio Configuration

First let's write that portfolio configuration file:

```json
{
  "name": "SEO Checker",
  "path": "/seo-checker",
  "themeColor": "hsl(25deg, 70%, 50%)"
}
```

This is our minimum viable product for "theming": we're gonna make a link a different color. But you should go crazy building out this config to make each of your side projects shine on your portfolio site's Work showcase page.

Drop this file into the root of your side project and push it to GitHub so that your remote and local repositories are matched up, because our next step is going to be in the GitHub.com GUI.

### GitHub Action

Our GitHub Action is only going to automate two tasks:

1. Copying the contents of our side project's `/_site` directory into the portfolio site's `/work/[project-name]` directory
2. Copying our side project's `portfolio-config.json` file  into the `/_data/work` directory

   **Note:** This is how I got the themeing data to be accessible within my 11ty build, and will be a different destination depending on your SSG of choice. More details in the last section.

GitHub already has a well-stocked Marketplace of different Actions available to use and remix, and I found a solid option for achieving this copy-and-paste across repositories in the CopyCat GitHub Action by \[insert name].

\[ finish section ]

So here's what our final code base will look like in our side project repository:

```ignore
.github/
  | workflows/
    - main.yml
.portfolio-config.json
_site/ # this is where 11ty spits out its static files, may be different for your SSG
...rest of project code
```

Github Actions occur in Workflows: if we had a much larger enterprise project that needed extensive build testing, matrix build processes, and other powerful post-processing done to it, we would need more files within the workflows/ directory.



\[ write summary section ]