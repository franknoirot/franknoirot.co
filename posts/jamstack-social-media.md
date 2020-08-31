---
title: Toward Social Media on the JAMstack
layout: layouts/post.njk
date: 2020-08-30T18:05:10.000Z
description: Building a profile editing system using Gatsby, DatoCMS, Auth0, and Netlify Functions.
tags:
  - post
  - code
featuredImg: /img/2020_08_30-rok-featured.jpg
---

At the start of the year I was asked to build a site for a local non-profit called [Ring of Keys](https://ringofkeys.org) with a really cool mission: they're dedicated to providing a directory of queer female, NB, and trans theatremakers as well as resources to theatre organizations that want to make an effort to address the wide disparity in hiring practices seen in the field today. One of the most common refrains from casting directors is that they have trouble finding queer and gender-nonconforming talent, so simply having a central place for artists to be visible could have a big impact.

![Screenshot of the directory page of RingOfKeys.com. Hey casting directors, they're right here.](/img/2020_08_30-rok-directory.jpg)

As a new developer I was excited to try out a full build of a website and CMS on my own with real stakes, and I started piecing together to technologies as the client and I outlined the features over text. Mostly landing pages, a searchable directory of artist profiles, the ability to upload news items and events: good, good, I reached for [Gatsby](https://gatsbyjs.org) and [DatoCMS](https://datocms.com) because of the CMS's price point (at the time) and Gatsby's momentum. And we'll host it on [Netlify](https://netlify.com) because of course we will.

And the ability for artists to edit their own profile pages.

Oh damn.

Profile editing, woof that is a different animal, almost like social media. Alright, let's make this work. I wanted to get profiles and editability without changing my stack, because any server-side and database app system was definitely going to be out of the organization's budget and my skill level. So I had to find a way to slightly augment my JAMstack instead of reimagining it.

The solution I reached ended up was deeply satisfying to make, and I think it could be a compelling model for small-scale social network and directory apps.

## Just Add Auth

[Auth0](https://auth0.com) and [Netlify functions](https://docs.netlify.com/functions/build-with-javascript/) were my secret weapons. Artists were already going to be entries within DatoCMS, and since Dato is a headless CMS artists' information can be created and [edited via API](https://www.datocms.com/docs/content-management-api). So all we had to do to make profiles editable was create Auth0 accounts for every artist in parallel with their profile in Dato, then associate it with their Dato entry.

![Architecture diagram of the site showing how the whole site is editable by site editors authorized by DatoCMS, and the profile pages are editable by artists authorized by the third-party service Auth0.](/img/2020_08_30-rok-editability.png)

Artists can apply on the site, and when they do they are actually creating a draft of a profile in the CMS, done via a Netlify function. At the same time, an email and text alert are sent out to the site editors to let them know a new profile is ready for their review. When the artist's profile is approved and published another Netlify function is triggered via DatoCMS Webhook to create an Auth0 account and send a welcome email to the user with their initial login link.

With Auth0 integrated, we made a sign-in available to users which leads them to a dashboard page where the client can post updates and upcoming events, and the artist can see an inbox of inquiry messages they've received (which I'll cover in another post). From here the artist can click to view their profile. This is exactly the same profile page shown within the directory, but since the user is authenticated and carrying around a JSON Web Token (JWT) on the site we can verify that they are the owner of this profile page and display a profile editor interface that can be toggled on and off.

![Screenshot of profile editor page showing some of the profile fields that can be edited, such as the artist's cities they work in, their pronouns, and their vocal range.](/img/2020_08_30-rok-editor.jpg)

From here the user can upload a new profile or banner image, and update their personal information with simple fields. When they click Save, they are calling a Netlify function and passing their authentication credentials along with their updated profile fields. Within this function the authentication is confirmed again, their profile is updated using DatoCMS's Node client library, and a rebuild of the site is triggered within Netlify.

## The World's Your CMS

The power of this model is that we've essentially created a new low-access tier within the CMS using Auth0. People with Auth0 accounts, the artists, have access to edit exactly one entry in the CMS, their profile, which we provide through a limited API interface. The more I worked on this project, the more I have come to feel that that is essentially what social media is; a CMS in which the vast majority of users have editing privileges to a single entry, although I'm sure I'm missing a lot of complexity in my assessment.

There is a cool added benefit of piggybacking off of an existing CMS to accomplish this kind of pseudo social media platform. The site editors and moderators still have full control of the artists' pages as relatively easy-to-edit CMS entries. This means that if an artist is having trouble with the site or with some element of their profile, editors have a fallback of going into the CMS to make changes without me having to build some entire editor interface from the ground up, which I find so commonly in platforms with user profiles. Need to block a profile for some reported abuse? Delete the CMS and Auth0 entry, or just unpublish until the issue is resolved. Profiles are on the same level as Landing Pages and Events, and use the same interface to edit them, all without me doing any extra development.

As a side note, my day job has taken up a lot of the time and energy I have to work on this project so if you're a developer or dev-curious person, especially a BIPOC, female, and/or gender-nonconforming person, looking to learn development and volunteer with an organization please hit me up! I'm happy to teach someone the ropes and be there to collaborate on coding.

## Open Issues

There are of course a lot of kinks to work out with this system. 

First of all, users do not like waiting for static site rebuilds. We ended up making a banner appear after the user has saved their content saying that they won't see their changes reflected in the directory for a few minutes until the site rebuilds. I stand by the static model for the savings it's garnered for my client, but that is simply not a great user experience. One thing I will be trying shortly is to use the `lastUpdated` property of entries in DatoCMS to generate a list of profile pages that should be "hydrated" with fresh content on page load, so if someone has profile changes that aren't reflected in the site yet we can fetch them when someone visits their page in the meantime. The longer page loads will be worth it for the better user experience.

![Screenshot of the banner that appears at the bottom of a profile page after editing it, which reads "Your'e viewing a preview of your new profile content. We're rebuilding the site now with your edits, and you should see them across the site within a few minutes." Not my favorite bit of UX I've created.](/img/2020_08_30-rok-alert.jpg)

A second issue is of course rebuilding the site on every profile update. I'm sure a lot of readers' Scalability Alarms™ went off when I mentioned that step a few paragraphs back. It was a trade-off that we made knowing that with such a small user base (~150 artists at launch, now ~500) we wouldn't incur too much cost with rebuilds, but it is one of my top priorities to do away with this soon so that our Netlify bill can be close to $0. I believe running a site rebuild as a daily or semi-daily chron job in conjunction with the hydrating strategy outlined in the paragraph above could be a workable solution for this, but I'd gladly take incremental builds whenever they're available.

A third is the speed of profile saves. We're making up to three fetch calls when the user clicks save, and it can lead to significant wait times that feel like an error to the user, especially if a larger image is being uploaded. I would be really grateful to anyone who has pointers on how to make the editing experience feel more immediate.

There were a ton of little challenges along the way to launching this site that I'd like to write about eventually, but this is the main concept I learned that I'd like to share: you can create sites with editable profiles on the JAMstack by leveraging the API power of headless CMSes in coordination with an authentication service and serverless functions.

If you have any questions, concerns, or corrections to this article please feel free to reach out to me on [Instagram](https://instagram.com/franknoirot) or [Twitter](https://twitter.com/frank_noirot). Thanks for reading!