---
title: "# How to generate sequence permutations in Javascript"
slug: permutations-in-javascript
layout: layouts/post.njk
date: 2020-10-24T19:25:48.445Z
description: How to iterate over every permutation of a quiz or similar sequence
  in Javascript.
tags:
  - post
  - code
featuredImg: /img/2020-10-24_permutations.jpg
---
I recently helped build a tool for a jewelry company to build personality quizzes around their merchandise, which has been the most rewarding project of my young career.

I have a lot of thoughts and learnings from the project, but this first one is a quick note about how to generate every possible permutation of the quiz in order to analyze how balanced it is.

So you might have heard how to calculate how many permutations of a sequence there are by using a factorial, which is the same basic principle for calculating the number of permutations of the quiz: simply multiply the number of answers each question has with each other. If Question 1 has 4 answers, Q2 has 3, Q3 has 4, Q4 has 2, and so on the number of permutations is 4 x 3 x 4 x 2 x etc. Our quiz has about 215k permutations.

But how do you generate every permutation and iterate over them? You count!

You can represent every answer chosen as a number ranging from 0 to the number of answers, so a playthrough can be represented as an array of numbers like `[2, 0, 3, 1, 0, 2, 1]`.

## The Counting Method

So to to iterate over the 7-question quiz example, start with an array of zeros `[0, 0, 0, 0, 0, 0, 0]` , then increment the last index to get the next permutation. Continue incrementing the last index until you overflow the number of answers of the last questions, then increment the second to last index and set the last to zero: `[0, 0, 0, 0, 0, 1, 0]` . Continue incrementing the last index and carrying the overflow.

This is exactly like counting in normal base 10 numbers! Count up in the "ones" place then carry over to the 10's place once you overflow it. So a quiz playthrough is kinda like a composite-base number in a way.

## The Conversion Method

We don't really need to write imperative logic to do this "carrying" logic when we count though. You can convert a base 10 number to binary more directly by finding the sequence of powers of 2 that add up to it. To convert 169 to binary, find the highest power of 2 less than it (128 is 2^7) and subtract it, then repeat. The powers of two are 2^7 + 2^5 + 2^3 + 2^0  = 169. Now simply mark each place starting from the right with a 1 to get the binary representation: `10101001`.

We can apply this same logic to our quiz to convert directly from base 10. Instead of finding the highest power of 2 that goes into our number, we'll find how many times our largest "power" goes into the base 10 number.

## An Example

Let's do a concrete example. we have a 7-question quiz with this many answers in each slot: `[3, 4, 2, 4, 3, 2, 3]`. There are 1,728 distinct permutations of this quiz, so we can convert any number less than that to a quiz permutation. Let's convert 1344. Start with the first slot: how many times does 4 * 2 * 4 * 3 * 2 * 3, or 576, go into 1344? What I did there was multiply all but the first slot together, which is the same thing we did with the binary example, just with numbers that aren't all 2.

576 goes into 1344 twice, so the first answer index is 2. 1344 - (2 * 576) = 192, which is our remainder to work with. The next slot measures how many times the number 2 * 4 * 3 * 2 * 3 = 144, so that goes into 192 once, and we mark the second slot with 1, leaving 48. Third slot is 4 * 3 * 2 * 3 = 72, which doesn't go into 48, so we mark down a 0. Next slot is 3 * 2 * 3 = 18, which goes in twice, leaving over 12. The third-to-last slot represents 2 * 3 = 6, which goes into 12 twice with nothing left over, so the last two slots are 0. The final slot is the "ones" slot, the final remainder if we had any.

Our final sequence is `[2, 1, 0, 2, 2, 0, 0]`! If we write the logic outlined above into a for loop we can generate every possible array of answers to our quiz. Here's the final code in JavaScript:

<div class='steezy-pre'>

```jsx
const totalPermutations = answerLengthsArray.reduce((acc, val) => acc * val, 1)
const permutations = []

for (let i = 0; i < totalPermutations; i++) {
	// pushing to an array will not work for longer quizzes, and will max out callstack.
	// I used generators to generate my permutations in quick batches of 100.
	permutations.push(base10ToQuiz(i, answerLengthsArray))
}

function base10ToQuiz(base10Num, answerLengths) {
	return answerLengths.map((answerLength, j, arr) => {
		// factor is the sliced "factorial", which = 4 x 2 x 4 x 3 x 2 x 3 for the first slot
		const factor = arr.slice(j + 1).reduce((acc, val) => acc * val, 1)

		/* 
		divide the base 10 number by this factor, then find the remainder
		of dividing by the number of answers using the modulo operator.
		This takes the place of our subtraction step outlined above,
		just to make the code a bit shorter.
		*/
		return Math.floor(base10Num / factor) % answerLength
	})
}
```

</div>

The conversion tactic is very terse and in my opinion almost elegant. The `base10ToQuiz` function takes a number to convert and an array of the number of answers in each question, and returns the number converted into a playthrough of the passed in quiz. I hope you find it useful in your writing!