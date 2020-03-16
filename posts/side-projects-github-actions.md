---
title: Building a Side Projects Directory Using GitHub Actions
layout: layouts/post.njk
date: 2020-03-15T16:32:36.167Z
description: Automating adding side projects to my portfolio site
tags:
  - code
---
Here's a way to add side projects to your static-site generator (SSG) portfolio site by just pushing to GitHub!

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
  "isExternal": false,
  "isPublic": true,
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

GitHub already has a well-stocked [Marketplace](https://github.com/marketplace?type=actions) of different Actions available to use and remix, and I found a solid option for achieving this copy-and-paste across repositories in the [CopyCat GitHub Action](https://github.com/marketplace/actions/copycat-action) by André Storhaug.

Within the root of your side project directory, create a file within the folder structure `.github/workflows/main.yml`. GitHub Actions use [YAML](https://blog.stackpath.com/yaml/) to describe an Actions steps in a human-readable way.

Here is the content within `main.yml`. We'll step through it below.

```yaml
# This is a basic workflow to help you get started with Actions

name: Copy to Portfolio and Push to Netlify

# Controls when the action will run. Triggers the workflow on push or pull request 
# events but only for the master branch
on:
  push:
    branches: [ master ]
  pull_request:
    branches: [ master ]

# A workflow run is made up of one or more jobs that can run sequentially or in parallelå
jobs:
  directory:
    # The type of runner that the job will run on
    runs-on: ubuntu-latest

    # Steps represent a sequence of tasks that will be executed as part of the job
    steps:
    # Checks-out your repository under $GITHUB_WORKSPACE, so your job can access it
    - name: Checkout p1
      uses: actions/checkout@v2
    
    - name: Copycat Directory
      uses: andstor/copycat-action@v3.0.0
      with:
          personal_token: ${{ secrets.PORTFOLIO_SECRET }}
          src_path: public/*
          dst_path: work/map-animator/
          dst_owner: franknoirot
          dst_repo_name: franknoirot.co
  
  config:
    # The type of runner that the job will run on
    runs-on: ubuntu-latest
    needs: directory

    # Steps represent a sequence of tasks that will be executed as part of the job
    steps:
    # Checks-out your repository under $GITHUB_WORKSPACE, so your job can access it
    - name: Checkout p2
      uses: actions/checkout@v2

    - name: Copycat Config
      uses: andstor/copycat-action@v3.0.0
      with:
          personal_token: ${{ secrets.PORTFOLIO_SECRET }}
          src_path: portfolio-config.json
          dst_path: _data/work/mapAnimator.json
          dst_owner: franknoirot
          dst_repo_name: franknoirot.co
```

First we name our Workflow and what triggers it. In our case, this will run on any push or pull request to the side project, but you could also add in a `tag` list so that it only runs on proper "releases". This is helpful if you'll be doing a lot of development on your side project and don't want to eat up your build minutes on GitHub.

Then we describe our list of named Jobs. This is an interesting little limitation I'll revisit, but the CopyCat Action we'll be using below doesn't seem to like being used twice in the same job. So I've split out our two copying operations into two jobs, "directory" and "config", but eventually I'd like this to be one step.

In both Jobs we do three things:

1. Define what platform the Job runs on
2. Checkout the side project's repo to our workspace using the standard Checkout Action
3. Copy what we want to into the portfolio's repo using the CopyCat Action

In the first job you can see I've used an "*" to select all the contents of the public folder for my source path (`src_path`), and added a trailing slash to the end of a new folder that will live in the `work/` directory of my portfolio site. This is so that I can essentially rename the `public/` folder to the `map-animator/` folder, allowing the URL of my side project to be `/work/map-animator`  within my portfolio site.

In the second Job I've added a `needs: directory` statement. This is a second limitation I ran into with CopyCat: the Action doesn't seem set up to be able to be run in parallel, which is the default if you define multiple Jobs within your workflow. This I am keen to fix because it nearly halves the time it takes to run the Workflow when run in parallel. In the meantime, this needs statement makes the second Job not fire until the first one finishes, eliminating the merge conflict error I was getting.

One further note on the second Job is that CopyCat allows you to specify files as well as directories, and rename them by setting a different file name in the `dst_path` field. Thanks for that feature André!

### Personal Token

The `personal-token` key is needed if you use CopyCat to copy across directories. To set one up, visit the [Personal Access Tokens section](https://github.com/settings/tokens) of your Developer Settings page on GitHub.com and select **Generate New Token**. Select at least the `workflow` permission for this token (more if you're doing even fancier stuff), either name it something like "Portfolio Actions" or name it specifically per side project, if you're really concerned about the security of these actions.

Copy the generated token into your side project's **Secrets** section under the **Settings** tab and name it something appropriate like "PORTFOLIO_SECRET". This variable is now available to GitHub, including in your workflow step!

![View of Settings tab in a GitHub repository, with the Secrets section selected to view the PORTFOLIO_SECRET key.](/static/img/20-03-15_gh-actions_secrets.jpg)

So with our config file written and our GitHub Action added, here's what our final code base will look like in our side project repository:

```ignore
.github/
  | workflows/
    - main.yml
.portfolio-config.json
_site/ # this is where 11ty spits out its static files, may be different for your SSG
...rest of project code
```

Push this code to your repository and watch what happens in the Actions tab of your repository on GitHub.com. If all goes well, switch over to your portfolio's repository and see the changes made and committed there!

After you have that working you can begin hosting your portfolio site on [Netlify](https://www.netlify.com/), and *because we live in the future*, you will get start getting automatic rebuilds on your portfolio when you push to a side project's repo. Magic!

### Bonus Round: Using Portfolio Config

Sometimes I just want things to be available on my portfolio site, but not public and linked somewhere. What we've just built is perfect for that. But what if you do want a link to each of your side projects on a Work landing page, and don't want to have add code to your portfolio site every time you add a project? `portfolio-config.json` to the rescue.

What you're about to see is specific to 11ty using Nunjucks to template out pages, but the steps for getting this to work generally are:

1. Create a `portfolio-config.json` file for each side project within its own repo
2. Use GitHub Actions to copy that file into the portfolio's directory somewhere where it can be use by global or page-level data while building the site
3. Write templating logic to loop over those JSON data files and convert them into components or elements on the page

For my site I copied each portfolio config into a [work folder](https://github.com/franknoirot/franknoirot.co/tree/master/_data/work) within my `_data/` directory. 11ty grabs any `.json` files placed in this directory and make it available within your templates as an entry within a global `data` object.

So in my [`work.njk`](https://github.com/franknoirot/franknoirot.co/tree/master/_data/work) file I have the following template logic:

```html
<h1>My Work</h1>
<ul>
{%- for i, workItem in work -%}
{%- if workItem.isPublic -%}
<li>
  <a href='{% if workItem.isLocal %}/work{% endif %}{{ workItem.path }}'
  {%- if not workItem.isLocal -%}target='_blank' rel='noopener noreferrer'{%- endif -%}
  style='color: {{  workItem.themeColor }}'>
    {{ workItem.name }}
  </a>
</li>
{%- endif -%}
{%- endfor -%}
```

Here we see Nunjucks + 11ty two-fold magic. First, 11ty takes any separate JSON files within a subdirectory of `_data` and adds each as an entry within a `data` object with the work directory's name. So `work.mapAnimator` is accessible on that object, if your file's path is `_data/work/mapAnimator.json`. Second, within Nunjucks you can iterate over the keys of an object just like an array, which felt odd and magical to me coming from Javascript.

So here we iterate over each item in the work directory and refer to it as workItem. if the isPublic attribute is true, we create a list item and link for the side project. If the isLocal property is true on the side project we allow the path attribute to be the href of the link and open the link in a new tab, otherwise we tuck it under the /work/ subdirectory. This allows me to hide private or in-progress work, and include portfolio configs for client work where I don't own the codebase or don't want to put my personal code inside.

The inline styling of the link's color is my glorious minimum viable product for themeing. As naive as this implementation feels, it does have a lot of flexibility because it allows for any color value CSS will accept. When you build your own you should add configuration for layout, descriptions, and images of your side projects.

## Conclusion

This site's Work directory operates on this system, so [check it out live](/work) or [view the source code](https://github.com/franknoirot/franknoirot.co). I am really excited about the future of static build tools that chain together, because they feel easier to understand to me, but they can add up to more than the sum of their parts, and turn into really elegant workflows.

If you end up building something like this or improving on it, or have a edit for this piece, please [reach out to me](https://instagram.com/franknoirot). This is my first blog post, and I'm really excited to talk to developers.
