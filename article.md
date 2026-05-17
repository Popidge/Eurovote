Victoria Swarovski (“I’m not a crystal heiress nepo baby at all, honest”) and Michael Ostrowski (“Leisure Suit Lukas”) definitely pulled off something unique in their hosting of the contest: they managed to have less chemistry than I’ve used in my career after getting a Chemistry degree 14 years ago (absolutely **none**), while also perfectly emulating a satellite delay to your co-presenter despite being physically close enough to go “Lady and the Tramp” on an Apple Strudel.
*You’re welcome for that visual.*
They did, however, repeatedly say one thing during the Grand Final that piqued my interest:
> “Zero televote points only means that you weren’t in any country’s top 10.”

I’m a data nerd by trade, so like Look Mum, No Computer, I retired to my home-made nerd lab (aka “poorly-coded Python script hellhole”) and dug into the numbers, kindly provided by the EBU here:
https://www.eurovision.com/eurovision-song-contest/vienna-2026/
I also pulled the voting breakdown into a small explorer with scoreboard, televote ranking, jury/public split, and country-pair views, which I’ll link at the end.
Here are a few things I came away with.

---

##1. Bulgaria won. Hard.

Make no mistake, the goal of the Eurovision voting system is bold and singular: take this mad contest collaboration of 35 national broadcasters, spanning tastes, languages, cultures, key changes, dance breaks, and inexplicable staging decisions, and somehow produce one winner.
This year, it did.
Bulgaria got the most points overall, and performed massively with both the jury and the televote. By basically every derived number I pulled out, they won in undisputed fashion. The broad, loud, general consensus amongst everyone who decided who won was:
> Banga’s were Ranga’d. See you in Sofia.

That’s all that matters, really. Eurovision is a delightfully simple contest in that respect: one winner, done and dusted, roly-poly and custard.
Not much else matters except to sweaty nerds like… well, me.
Beyond that, there’s lots of nuance in the scoring system and its results that goes beyond the “Douze/Nul Points”, *which is where the hosts’ continual reminders got me thinking...*

---

## 2. “Nul Points” doesn’t mean “Nul Love”

How true is this?

Now, I’m a little biased here. I’m a British Eurovision fan. Unlike LMNC, I do not need something salty, as my blood pressure is high enough already as a result of my nationality. But did Sam Battle’s zero-shaped slice of televote pepperoni really reflect what the audience thought?

Is there truly a scenario where you can be liked by a lot of televoters, but still find yourself questioning your life choices as a musician when you get the simplified version that reads as “nobody likes you”?

Yes.

This is where the Eurovision points system gets cruel. The public vote we see on screen is not a full popularity ranking. It is a top-10 extraction machine. A country can rank you 11th and you get nothing. A country can rank you 25th and you also get nothing. In scoreboard terms, those are the same thing. Emotionally, they are very much not the same thing.

The cleanest “just outside the points” case this year was France.
France only got 14 audience points, placing 18th in the televote points table. But in the full public rankings, France had an average audience rank of 12.5, and was ranked 11th by seven public voters. That is the top-10 cliff in action.

The near-zero and zero-point entries tell a related story. Germany, the United Kingdom, and Belgium all received 0 audience points, but their average public ranks were not “everyone put them last” disasters. Germany averaged 20.9, the UK 21.8, and Belgium 22.4.
To be clear, that is still not *good*. Nobody is polishing a trophy engraved “Europe’s 21.8th Favourite”. 

But it does mean the hosts were right: zero televote points does not mean universal rejection. It means no voting entity placed you inside its public top 10.

That pendulum swings both ways. Cyprus, Austria and Sweden all got more points from the public vote than their actual average audience ranking would have you believe. Cyprus ranked 14th on points, but 17th when all audience ranks are taken into account, Austria 22nd on points but 25th all-in and Sweden ranked 17th on points but 19th in the overall audience ranking.
Some entries can look healthier in the televote points than their full audience ranking suggests, because they had enough pockets of top-10 support - Cyprus getting 12 points from Greece, for example, let their televote points leapfrog the actual audience appetite. Others can be broadly tolerated, or even reasonably liked, but fail to convert that into points.
Televote points measure scoring-zone intensity, not general affection.

That’s what the people think, but they’re only half of the story. In an attempt to lessen the effects of “bloc voting” (something we’ll cover in a bit), the EBU introduced the national jury of “music professionals and experts” to provide the other half of the scoring formula.
*Which leads nicely on to the next thing I looked into.*

---

##3. Juries and their publics sometimes maybe agree, sometimes maybe disagree

The headline here is that overall, the jury and public agreed:

> Dara smashed it, “BANGARANGA” is a banger (...ranga?), and more chair dancing is better.

But does that hold true when you break it down by nation?
Mildly, yes.

Across countries, the correlation between jury points and public points was around 0.28-0.29 depending on the aggregation method. So: mildly aligned, but not exactly finishing each other’s sentences.
For the following numbers, around 1 means juries and their publics were aligned, while 0 or negative means they disagreed. Negatives can pop up because we only have top-10 data on juries, whereas we have full breakdowns for televotes.

There are a good few instances of juries and publics agreeing. Malta, Israel, and Montenegro all show strong alignment: 0.81, 0.79, and 0.76, respectively.
Malta loved Italy/Bulgaria, Israel were super into Bulgaria and Australia, and Montenegro’s jury and public LOVED Serbia.
For each of those, there are disagreements too.

Georgia’s jury (-0.16) preferred France compared to their public’s love for Ukraine, while the Portuguese (-0.14) and Swiss (-0.14) public quite liked Israel whilst their juries favoured Albania and Ukraine.
Some of these splits look like they may reflect the geopolitical situations surrounding Israel and Ukraine. To avoid that can of worms, I haven’t looked into those numbers any further. That’s a much bigger talking point for another day.

That aside, geography and shared language/culture come up often in Eurovision discourse, and are a little easier (and less controversial) to analyse.
*So, how did “bloc voting” affect this year’s contest?*

---

##4. Culture Club: borders, language, diaspora, and other things Eurovision fans pretend not to argue about

*Sidenote: because Boy George popped his head into the San Marino entry this year, I’m legally required to title this section “Culture Club”.
No further questions at this time.*

Carrying on the disclaimer from above, I’m looking at data insights generated from this contest only, and I am in no way inviting or making any political analysis. This year’s contest already has enough going around without me sticking my oar in.
Eurovision has a long-discussed trend of “bloc” voting: neighbouring countries, shared languages, diaspora representation, cultural trends, and so on. They all enter the conversation at some point.
How did it affect this year’s scoring, and is it more pronounced in jury votes or public votes?

For this, I tried to be a bit more data-driven than the usual ad-hoc “Balkans, Greece/Cyprus, native English speakers, Nordics” categories often used. I used a combination of geographical data (shared borders, shared UN subregions, distance between closest borders) and language data (shared official language and mutual language speakers) to see where the links were. I also looked at reciprocal voting pairs: did a pair of countries award more points to each other?
Basically, I tried to move beyond “Greece and Cyprus, lol” and give the usual Eurovision argument a basic stats course.

*Also, one caveat: this is one contest, not a universal law of Eurovision.*

By “lift”, I mean how many more points were awarded, on average, when that relationship existed compared with the baseline.
All combined together, the general average lift in points awarded across these affinities was +5.45 for the public vote and +3.38 for the jury vote.

So, affinity-related voting exists for both, and was more prominent in the public vote.

The clearest public-vote signal was simple: sharing a land border helped. The strongest jury-side affinity signal was broader language/cultural overlap. So yes, geography and culture show up, but not always in the cartoon version people argue about online.
The biggest public-vote contributor (+2.66 public / +0.87 jury) was a shared land border between the two participants.
The biggest contributor to jury affinity (+1.41 jury / +2.31 public) was a mutual language/cultural mention.
Having a land border and shared language influenced the public vote the most, with an average lift of 4.85 points. Mutual language as a whole, especially where there are large diaspora populations, showed too, with Albania/Italy, Sweden/Finland, and Romania/Moldova being examples.

Naturally, due to their separation from the European core of the EBU, Israel and Australia got the most “global reach” points regardless of geography. That’s to be expected.
However, the overall winner Bulgaria was next in line, showing it was broadly loved by the public worldwide.

In terms of reciprocal pairs for the public vote, Romania & Moldova, Greece & Cyprus, and Croatia & Serbia all gave each other 12 televote points.

Combining this with the previous jury/public alignment figures, I wanted to see *whether, when a national jury and its public differ in opinion, one tends to vote more by cultural affinity than the other.*
The answer: no, there’s no general pattern there.
There are some interesting individual data points. The UK jury tended to go along the cultural-affinity route more than the public vote, while some were purely aesthetic splits. For example, the Finnish jury preferred France over the public’s preference for Israel, with neither being especially driven by cultural affinity.

---

##5. But what does it all mean, Basil?

After all this, the original statement from what was certainly one of the hosts of all time:
> “Zero points doesn’t mean you were hated, it just means you weren’t in anyone’s top 10.”

held generally true, especially if you’re French.

My British grumpiness has been somewhat soothed: Look Mum, Someone Actually Did Like Us!

On a wider scale, Bulgaria was a proper winner. The scoring system did its one job. The jury/public split wasn’t massive, but it wasn’t absent either.
Bloc voting is still a thing, and it seems neither the jury nor public are fully immune to it, but the juries were a little more resilient to it than the public this year.

Culture matters, but not enough to explain away taste.

And anyone who attempts to reduce Eurovision voting to one simple mechanism should be forced to sit through the first semi-final Austria/Australia interval act on a loop until they learn their lesson.

Now run along fellow Euro-nerd, go wallow in our shared post-contest depression until next year.

---

To help with this, I whipped up a little explorer to collate and visualise the data here if anyone wants to poke around:
https://popidge.github.io/Eurovote/



