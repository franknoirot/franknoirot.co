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

I am currently converting my portfolio site from Jekyll to 11ty because I want to get closer to knowing how every line in my site works, and right now I am far more capable and motivated to do that with a Node.js code base than one written in Ruby.

While I'm at it I decided to try to fix one annoyance I have. There are many side projects and toy sites that I like to include onto my personal site, things like this Pantone color picker and this map animator or even prototypes of things I am coming up with to help my colleagues like this SEO Checker. It's nice to have my personal site there as a kind of scratchpad for projects that aren't ready for primetime yet.

But because I am still pretty new to building out these projects and managing Git repos, I have not yet found an elegant way to have my side project's site directory (they're nearly all static sites) to my site's directory. So I have been committing code to my side project's GitHub repo, copying it, and uploading it to my portfolio site's repo using GitHub.com's GUI. I don't know much, but this doesn't feel like modern development to me. 

I will be spending time learning Make, Webpack, and Rollup to learn how to do this as part of my side projects' build process, but even if I learn the art of build config, each of my different side projects would have different "vendor lockin" configurations to push to my portfolio, and I would always need to have my entire portfolio site pulled to whatever machine I was working on. Gross!

## The Solution

Enter GitHub Actions and Netlify. Instead of copying and pasting my side project's site *locally,* let's push code to our side project repo and Octocat go off and run those errands for us! And we'll do it one better: let's add a custom \*specially-named\* config file to our side project's root folder, where we can define anything we want about how that side project shows up and gets linked-to on the portfolio site!