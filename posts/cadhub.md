---
title: "I'm helping build CadHub.xyz"
slug: working-on-cadhub
layout: layouts/post.njk
date: 2021-09-05T22:27:51.303Z
description: "I've gotten to help start something pretty great with CadHub.xyz, and we're ready for more help from anyone interested in the future of 3D modeling."
tags:
  - post
  - code
  - design
featuredImg: /img/2021_09_05-cadhub_2.jpg
---
I've gotten the chance to help out on a project called [CadHub](https://cadhub.xyz), which is trying to generate the friendliness and community that CodePen brought to frontend web development for the small world of "Code-CAD". Code-CAD (or CodeCAD, the spelling is TBD) is a loose collection of softwares that allow 3D modeling to be done mainly with written scripts, or supporting scripts as first-class citizens. 

## What I've been up to

My first contribution was this feature that lets you take a screenshot of your project and save it to your profile. It was fun process and my first time helping out on an open source project. Big thanks to Kurt Hutten ([@Irev-dev](http://github.com/irev-dev)) for being such a welcoming host. The idea of open source development has been this scary monolith to me for some time and he managed to make me feel like I was hacking away on just another personal project, and walk me through the process of PR reviews and code linting best practices with Prettier.

![A screenshot of my screenshot tool in use within CadHub, where users can take a picture of how their 3D model looks while working on it.](/img/2021_09_05-cadhub_1.jpg)

Since then I've been hooked, and I've become one of the core contributors on the project.

My initial work with Kurt was to make the leap to a custom editor and an app architecture that treated different CAD packages as plugins. We are so happy with how that process has turned out, because since then we have been able to integrate 3 of the most used Code-CAD packages—CadQuery, OpenSCAD, and JSCAD—into this platform. This means that users can now try out 3D modeling in three completely different languages all in the same place!

My ongoing work has been leading UX design for the platform, which you can check out within [our Figma project](https://www.figma.com/file/VUh53RdncjZ7NuFYj0RGB9/CadHub?node-id=1046%3A0). Kurt did an excellent job getting everything up and running in the core of the project, so my work has been about finding a way to pull all that charm into a full-fledged productivity app in the same family as CodeSandbox and CodePen.

In addition, I have been helping by [taking notes in our weekly meetings](https://github.com/Irev-Dev/cadhub/discussions/487) with contributors and CAD package maintainers as we continue to refine the core platform. I am excited for this next phase of the project because we are nearing a threshold where we are no longer just creating a playground for these tools to be tried out, but instead are actively helping to evolve the way they are used.

We have recently released a customizer tool for OpenSCAD projects that promises to be everything the Thingiverse customizer was supposed to be. Not only that, but the maintainers of our other integrations are adapting them to be able to support similar customizer functionality! That means soon whether you write in C++-like code with OpenSCAD, Python with CadQuery, or JavaScript with JSCAD, you'll be able to have similar customizable parameters for people to tweak, with a slick UI for them right on the web!

 

![A screenshot of my design for the customizer tray, which allows users to make certain parameters within their models available for others to tweak without editing any code.](/img/2021_09_05-cadhub_3.jpg)

## Bringing code back to CAD

Computer-Aided Design software is historically interesting because though the first CAD programs were script first, and often had no real visual interface, they quickly adopted 3D visualization technology as soon as it became available. It makes sense given the visual nature of modeling, but the Code-CAD community believes that by going fully GUI-based meant most CAD software threw out the best parts of script-based interaction. Abstracting parts into functions, creating truly parametric designs, and even embedding logic into your 3D models could be possible if you attach a programming language to 3D modeling software.

Even ignoring those advanced possibilities, Code-CAD offers a compelling user story for beginners as well. The tangible feedback of a 3D modeling visualizer makes Code-CAD a great tool for people just learning coding, 3D modeling, or both. A straightforward language like OpenSCAD lets users type in `cube();` and see a cube right away, immediately showing them how their inputs influence the program. I do UX design for a living and upon describing my 3D modeling hobby to my roommate using CadHub, he replied that it was the first time he's really understood any of my web explanations. 

Now with the advent of fast 3D rendering on the web thanks to the maturity of software like WebGL and modern GPUs, true 3D modeling in the browser is very much possible. And if a community site like CadHub can make sharing and collaborating on 3D models easier and more fun, we might see a whole new generation of designers and developers pop up, just like CodePen gave me my first taste of web development 5 years ago.

If you're interested in 3D modeling, Code-CAD, and the social web, please join us over at the [CadHub GitHub](https://github.com/Irev-Dev/cadhub) and Discord. We're working on building our own IDE that runs OpenSCAD in the browser, and makes GitHub-backed, shareable CAD projects a reality. We're looking to expand support for other CAD packages in the future.