---
title: Quick Workspace Setup Scripts in Windows
slug: workspace-scripts-windows
layout: layouts/post.njk
date: 2021-01-16T07:17:26.625Z
description: Just a quick script format to get workspaces set up quickly in Windows.
tags:
  - post
  - code
featuredImg: /img/windows-setup-script.jpg
---
One of the biggest barriers to getting work done on my weekend projects is the setup time. It may just be a few minutes to open up tabs to all the web services I need and open VS Code to my repository, but it feels like a climbing up a hill when I'm not motivated.

So tonight I googled "open multiple tabs at once firefox" and "windows shell script" because I forgot Windows uses .cmd files instead and bam! Productivity hack. These steps are for Windows but the process shouldn't be too different on Unix systems like MacOS.

## Step 1: Make a "scripts" folder and make your file

I created a folder to store any other useful scripts I think up in the future, storing it within my `/code` repository, but do whatever you want, you're an adult. Now make a file with a logical name ending in `.cmd`: I named my first one `rok-dev.cmd`. This is a Command Script, which is a [Windows-specific cousin ](https://smallbusiness.chron.com/write-cmd-script-53226.html)of a shell script that you may have heard about on Linux and Mac. Right click on this new file and open it with a text editor of your choice. I use VS Code.

## Step 2: Write a script

Here's where you use the power of scripting to do a bunch of stuff at once! I got a handy tip from [this support thread](https://support.mozilla.org/en-US/questions/1203652) on how to open all the tabs I need in Firefox (the best browser) at once from the command line. The key is the `-url` flag that lets you supply a list of URLs to open all at once. To open VS Code to my project repo I just use the famously straightforward `code` command followed by the path to my repository.

```shell
"C:\Program Files\Mozilla Firefox\firefox.exe" -url https://ringofkeys.org https://datocms.com https://stripe.com https://auth0.com

code "C:\Users\frank\Code\rok"
```

And then just Ctrl + S that sucker and save!

## Bonus: Make a shortcut and a cool icon

That's seriously it. double-click on your .exe file and watch magic happen, it's so simple it makes me mad I didn't know about it before.

If you want to be a cool hacker you can create a desktop shortcut to your new program. The default icon looks gross so I decided to use the favicon of the website I'm working on ([RingOfKeys.org](https://ringofkeys.org)) as the `rok-dev` image. I made another script to set up a learning environment, opening a VS Code playground, the [Rust Book](https://doc.rust-lang.org/stable/book/title-page.html), and [Codepen](https://codepen.io), so for that shortcut I opened up Figma and made a quick little icon.

![Showing the Figma interface with my learning icon as a frame.](/img/windows-scripts_figma.jpg)

Export to a PNG, then convert to an .ico image using a web tool like this one from [RedKetchup](https://redketchup.io/icon-converter). Then you can right click on the shortcut and click Properties from the context menu, followed by Change Icon on the first tab in the dialog that appears. I recommend moving your icon to be next to your program in your `/scripts` folder for safekeeping.

![](/img/windows_scripts-change_icon.jpg)

It's pretty ironic that this was such a revelation to me, since anyone who grew up with computers back in the day would have had this notion that the command line is their friend for scripting away tasks engrained pretty deeply in them. It bums me out how effectively [blackboxed](https://en.wikipedia.org/wiki/Blackboxing) computers are that even someone as moderately tech-involved as me can feel scared by the command line. But don't be afraid! I hope this makes your life a little easier! I have a good feeling it will help me a lot.