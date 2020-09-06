---
title: A Better, Local Side-Project System with Git Hooks
layout: layouts/post.njk
date: 2020-09-05T16:01:24.729Z
description: GitHub Actions? Where we're going, we don't need Actions.
tags:
  - post
  - code
featuredImg: /img/2020-09-05-git_hooks.jpg
---
My [first blog post](https://franknoirot.co/posts/side-projects-github-actions) was about how to integrate my side projects into my portfolio site in a more automated way using GitHub Actions. I've learned a little bit more about shell scripting and the Git command line in the time since then, and I believe there is a better, always-free way to accomplish the same effect.

My mistake previously was to balk at the idea that I might need to have my portfolio site cloned locally to whatever laptop I am working on my side project with. In practice this is almost always the case, and I have never run into a time where a side project wasn't worth bringing over to my primary device but was worth putting up on my portfolio site.

So now that I am comfortable requiring both my portfolio site and the side project be on the same device, that opens up the use of [Git Hooks](https://githooks.com/) to copy my side project's output directory, config file, and any image assets over to my portfolio site, then stage, commit, and push my portfolio site in tandem with my side project.

To create a Git hook for your project, create a `.git/hooks` directory in your project's root folder and create a file with the name of the hook and no file extension. I wanted my hook to fire while pushing my side project to its remote repository on GitHub, so I named my file `pre-push`. This file will be written as a Git Bash script, a kind of command line/shell script language.

In this file we use the `cp` command to copy each of the files we want over, then simply use git commands to stage and make our commit before pushing. I added in some variables to the top of the file so that when I copy it over to another project I can just worry about editing that part of the script without messing with the commands themselves.

<div class="steezy-pre">
```bash
{% raw %}
#!/bin/sh
PROJECT_NAME='Midi Controller'
SITE_DIR=public/
PORTFOLIO_DIR=~/documents/code/franknoirot.co/
WORK_DIR=work/midi-controller
DATA_FILE=_data/work/midiController.json

# create timestamped .json portfolio configuration
node portfolio-config

# copy over assets into portfolio
cp portfolio-config.json "$PORTFOLIO_DIR$DATA_FILE"
cp -r -T "$( pwd )/$SITE_DIR" $PORTFOLIO_DIR$WORK_DIR
echo "Successfully copied $SITE_DIR to $PORTFOLIO_DIR$WORK_DIR"

# commit and push portfolio
cd $PORTFOLIO_DIR
git add .
git commit -m "updated $PROJECT_NAME"
git push
{% endraw %}
```
</div>

This works great! I'm able to copy the side project's output directory and [portfolio-config.json](https://franknoirot.co/posts/side-projects-github-actions/) files over very quickly, and not using anyone else's servers.

One element I've added since the last iteration is making the `lastUpdated` dates procedurally generated. To do this I converted `porfolio-config` to a `.js` file instead of a `.json`, then I call `node portfolio-config` within my Git hook and within it write to my final JSON version of the file after filling in the date values with the current date.

```jsx
#!/usr/bin/env node
const fs = require('fs')

function getConfig() {
    const now = new Date()
    const month = (now.getMonth()+1).toString().padStart(2,'0')
    const day = now.getDate().toString().padStart(2,'0')

    return {
        "name": "WebMIDI Controller Prototype",
        "lastUpdated": `${now.getFullYear()}-${month}-${day}`,
        "lastUpdatedMMDD": month+"/"+day,
        "isLocal": true,
        "isPublic": true,
        "path": "/midi-controller",
        "themeColor": "hsl(310deg, 60%, 65%)",
        "tools": "Svelte.js, WebMIDI API",
        "image": '/img/2020-08-28-web_midi.jpg'
    }
}

fs.writeFile('portfolio-config.json', JSON.stringify(getConfig(),null,2), err => {
    if (err) console.error(err)
    else console.log('Portfolio file written successfully')
})
```

Now I get the latest date I've pushed code to a side project updated within my portfolio site automatically along with the latest code and configuration, all for free!

Just a note, I had trouble finding my Git Hook file after closing my project in VS Code and reopening it. This is because by default VS Code doesn't show any of the `.git` folder's contents, but you can [update your workspace settings](https://medium.com/@imstudio/visual-studio-code-show-hidden-folder-5fd0f01d3d5e) to make sure they appear.