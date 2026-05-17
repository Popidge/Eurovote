# Eurovision Explorer Analysis Brief

Generated: 2026-05-17  
Dataset: `src/data/vienna-2026-grand-final.json`  
Source: official EBU page captured in `sourceUrl` inside the JSON  
Purpose: handoff notes for adding richer analysis routes to the Eurovision scoring explorer.

## Executive Summary

The local EBU-derived dataset supports analysis beyond the headline scoreboard. It includes:

- `scoreboard`: 25 finalists with total, jury, audience, final rank, artist, song, and running order.
- `votesGiven`: country-by-country points given by jury and audience.
- `votesReceived`: country-by-country points received by jury and audience.
- `audienceRankings`: full public ranking rows by voter, including non-scoring ranks.

The highest-value additions for the explorer are:

1. Jury/public split analysis.
2. Public consensus versus polarisation.
3. The "10-point cliff" / 11th-place heartbreak metric.
4. Bloc or affinity lift with transparent caveats.
5. Counterfactual scoreboards: actual, jury-only, audience-only, and average-audience-rank.
6. Reciprocal voting network moments.

The most important single story is that Bulgaria is not only the points winner. It is also the public consensus winner: average public rank 2.9, median public rank 3, public top 10 in all 35 available public rankings, and 10 public first places.

## Data Notes

Use `scoreboard` for official headline totals and final ranks.

Use `audienceRankings` for full public-rank analysis. These rows are richer than the public points alone because they preserve ranks outside the top 10.

Use `votesGiven` for jury points and audience points given by each voting country. For audience analysis, prefer `audienceRankings` when rank depth matters, and `votesGiven` when exact awarded points matter.

Current data shape observed in this pass:

- Finalists: 25
- `votesGiven` rows: 1725
- `votesReceived` rows: 1750
- `audienceRankings` rows: 875
- Audience voters represented in full ranking rows: 36
- Jury voters represented in `votesGiven`: 35

Note: some artist/song strings contain mojibake, for example `CÄƒpitÄƒnescu`, `SÃ¸ren`, and `SÃ¬`. This does not affect scoring analysis, but the explorer should avoid polished copy based on those names until encoding is corrected.

## Methodology

### Point Schedule

Use the Eurovision public/jury point schedule:

```ts
const pointForRank = (rank: number) =>
  [12, 10, 8, 7, 6, 5, 4, 3, 2, 1][rank - 1] ?? 0;
```

`audienceRankings.points` already contains points where available, but deriving points from `rank` keeps all public-rank calculations explicit.

### Jury and Audience Rank Positions

For each finalist:

```ts
audiencePointPlace = rankDescending(scoreboard, "audience")
juryPointPlace = rankDescending(scoreboard, "jury")
finalPlace = scoreboard.rank
```

Sort descending by points, with official final rank as a tie-breaker.

### Jury/Public Difference

Points gap:

```ts
publicJuryPointGap = audience - jury
```

Rank gap:

```ts
juryPublicRankGap = juryPointPlace - audiencePointPlace
```

Positive rank gap means the public placed the entry higher than the jury. Negative means the jury placed it higher than the public.

### Public Consensus Metrics

For each finalist, filter:

```ts
rows = audienceRankings.filter(row => row.recipient === country)
ranks = rows.map(row => row.rank)
```

Compute:

```ts
averageAudienceRank = mean(ranks)
medianAudienceRank = median(ranks)
audienceRankVolatility = standardDeviation(ranks)
publicFirstPlaces = count(rank === 1)
publicTop5s = count(rank <= 5)
publicTop10s = count(rank <= 10)
publicNonScoringRanks = count(rank > 10)
audienceElevenths = count(rank === 11)
```

These metrics support consensus, polarisation, and near-miss analysis.

### Points Efficiency / 10-Point Cliff

Compare public points rank with average public-rank position:

```ts
averageRankPlace = rankAscending(entries, "averageAudienceRank")
audiencePointPlace = rankDescending(entries, "audience")
pointsEfficiencyDistortion = averageRankPlace - audiencePointPlace
```

Interpretation:

- Positive distortion: entry did better in points than its average public rank suggests, usually because support was concentrated inside top 10s.
- Negative distortion: entry was broadly ranked decently but missed the scoring threshold too often.

The strongest "cliff" metric is simply:

```ts
audienceElevenths = count(audienceRankings where recipient === country && rank === 11)
```

### Bloc / Affinity Lift

The current app already defines these clusters:

```ts
[
  ["Albania", "Croatia", "Montenegro", "Serbia"],
  ["Denmark", "Finland", "Norway", "Sweden"],
  ["Estonia", "Latvia", "Lithuania"],
  ["Cyprus", "Greece"],
  ["Moldova", "Romania"],
  ["Australia", "United Kingdom"],
]
```

For each voter-recipient pair:

```ts
isAffinityVote = sameCluster(voter, recipient) && voter !== recipient
```

For audience:

```ts
points = pointForRank(audienceRank.rank)
```

For jury:

```ts
points = votesGiven.find(source === "jury" && voter === voter && recipient === recipient)?.points ?? 0
```

Lift:

```ts
affinityAverage = mean(points where isAffinityVote)
baselineAverage = mean(points where !isAffinityVote)
lift = affinityAverage - baselineAverage
```

Important caveat: these clusters are heuristic. The explorer should label them as "selected affinity groups" or "modeled affinity pairs", not as definitive proof of intent.

### Affinity-Removed Counterfactual

For a simple non-redistributive counterfactual:

```ts
counterfactualTotal[country] = officialTotal[country]

for each modeled affinity pair voter -> recipient:
  subtract audience points given by voter to recipient
  subtract jury points given by voter to recipient
```

Do not redistribute removed points unless implementing a more complex simulation. Label the result clearly as "affinity points removed, no redistribution".

### Reciprocity

For finalists that are also voters:

```ts
pairScore(A, B) = audiencePoints(A -> B) + audiencePoints(B -> A)
```

Sort descending by total reciprocal score, then by the smaller of the two directional scores to promote balanced reciprocity.

### Running Order Check

Compute simple Pearson correlations:

```ts
corr(runningOrder, audience)
corr(runningOrder, jury)
```

Also compare first half and second half averages:

```ts
firstHalfAudienceMean = mean(audience where runningOrder <= 13)
secondHalfAudienceMean = mean(audience where runningOrder > 13)
```

The signal in this dataset is weak, so this should be treated as a "myth check" rather than a headline claim.

## Headline Findings

### 1. Bulgaria Is a Consensus Winner

Bulgaria:

- Total: 516
- Jury: 204
- Audience: 312
- Average public rank: 2.9
- Median public rank: 3
- Public first places: 10
- Public top 10s: 35/35

Suggested explorer treatment:

- Add a "consensus winner" badge or panel.
- Show public average rank, public first places, and top-10 coverage beside points.
- Use Bulgaria as the explanatory anchor for the difference between points dominance and broad ranking dominance.

### 2. Jury/Public Schism

Largest jury/public rank divergences:

| Country | Jury points place | Audience points place | Rank gap | Points gap |
|---|---:|---:|---:|---:|
| France | 4 | 18 | -14 | -130 |
| Moldova | 17 | 4 | +13 | +140 |
| Romania | 13 | 2 | +11 | +168 |
| Ukraine | 15 | 5 | +10 | +113 |
| Czechia | 10 | 20 | -10 | -95 |
| Malta | 11 | 21 | -10 | -73 |
| Poland | 7 | 16 | -9 | -116 |
| Denmark | 3 | 11 | -8 | -87 |
| Australia | 2 | 9 | -7 | -43 |
| Norway | 9 | 15 | -6 | -96 |

Suggested explorer treatment:

- Add a sortable "jury/public split" table.
- Add two columns: points gap and rank gap.
- Consider labels: "public lift", "jury lift", "split entry".

### 3. Public-Only Top Five Differs Sharply

Actual top five:

1. Bulgaria
2. Israel
3. Romania
4. Australia
5. Italy

Jury-only top five:

1. Bulgaria - 204
2. Australia - 165
3. Denmark - 165
4. France - 144
5. Finland - 141

Audience-only top five:

1. Bulgaria - 312
2. Romania - 232
3. Israel - 220
4. Moldova - 183
5. Ukraine - 167

Average-public-rank top five:

1. Bulgaria - 2.9
2. Romania - 4.7
3. Israel - 5.6
4. Moldova - 6.2
5. Ukraine - 8.0

Suggested explorer treatment:

- Add a scoreboard mode toggle:
  - Official
  - Jury-only
  - Audience-only
  - Average public rank
- Preserve official final rank in each row to show movement.

### 4. The 10-Point Cliff: Czechia's 31 Elevenths

Czechia:

- Audience points: 9
- Audience points place: 20
- Average public rank: 10.7
- Average-public-rank place: 10
- Audience 11th places: 31

This is the clearest structural scoring story in the dataset. Czechia was very often just outside the points. The public did not ignore it; the top-10 threshold did.

Other near-miss cases:

| Country | Audience 11ths | Audience points | Average public rank |
|---|---:|---:|---:|
| Czechia | 31 | 9 | 10.7 |
| Lithuania | 4 | 12 | 11.7 |
| Moldova | 1 | 183 | 6.2 |

Suggested explorer treatment:

- Add an "11th-place heartbreak" module.
- For selected countries, show a rank histogram with rank 11 highlighted.
- Add copy such as: "Ranked 11th by 31 public voters: almost liked everywhere, rarely rewarded."

### 5. Polarising Entries

Highest public-rank volatility:

| Country | Rank SD | Average rank | Public first places | Non-scoring rankings |
|---|---:|---:|---:|---:|
| Serbia | 8.5 | 18.5 | 2 | 23 |
| Italy | 8.0 | 10.4 | 2 | 12 |
| Greece | 7.0 | 9.4 | 3 | 8 |
| Cyprus | 6.6 | 19.9 | 1 | 29 |
| Denmark | 6.4 | 13.2 | 1 | 21 |
| Croatia | 6.4 | 13.3 | 1 | 19 |
| Albania | 6.2 | 12.0 | 0 | 17 |
| Ukraine | 5.9 | 8.0 | 3 | 7 |

Suggested explorer treatment:

- Add a "consensus vs polarisation" quadrant:
  - X axis: average public rank
  - Y axis: rank volatility
  - Size: audience points or public first places
- Labels:
  - Broad consensus
  - Passionate niche
  - Jury rescue/public rejection
  - Low-impact consensus

### 6. Near-Zero Televote Does Not Always Mean Last in Full Rankings

Countries with audience <= 20:

| Country | Audience points | Average public rank | Public top 10s |
|---|---:|---:|---:|
| France | 14 | 18.0 | 8 |
| Poland | 17 | 15.6 | 6 |
| Norway | 19 | 20.2 | 4 |
| Czechia | 9 | 10.7 | 4 |
| Malta | 8 | 12.8 | 3 |
| Sweden | 16 | 22.2 | 3 |
| Belgium | 0 | 19.8 | 0 |
| Lithuania | 12 | 11.7 | 1 |
| Germany | 0 | 16.0 | 0 |
| Austria | 5 | 14.8 | 1 |
| United Kingdom | 0 | 14.1 | 0 |

Suggested explorer treatment:

- Add explanatory text or tooltip: "Zero public points does not necessarily mean every country ranked the entry last; it means no voting entity placed it inside its public top 10."
- This is especially useful for Germany and the United Kingdom: both had zero audience points but average public ranks of 16.0 and 14.1 respectively.

### 7. Bloc / Affinity Lift Is Strong but Did Not Decide the Winner

Selected modeled affinity groups produced large lifts:

| Group | Audience affinity avg | Audience baseline avg | Jury affinity avg | Jury baseline avg |
|---|---:|---:|---:|---:|
| Balkan | 7.56 | 2.39 | 5.56 | 2.39 |
| Nordic | 7.25 | 2.38 | 6.17 | 2.38 |
| Baltic | 6.00 | 2.39 | 0.00 | 2.39 |
| Hellenic | 12.00 | 2.38 | 12.00 | 2.39 |
| Moldova/Romania | 12.00 | 2.38 | 6.50 | 2.39 |
| Australia/UK | 3.50 | 2.38 | 1.50 | 2.39 |

Affinity-removed counterfactual, no redistribution:

| Rank | Country | Counterfactual total | Points removed |
|---:|---|---:|---:|
| 1 | Bulgaria | 516 | 0 |
| 2 | Israel | 343 | 0 |
| 3 | Romania | 281 | 15 |
| 4 | Italy | 281 | 0 |
| 5 | Australia | 277 | 10 |
| 6 | Finland | 221 | 58 |
| 7 | Ukraine | 221 | 0 |
| 8 | Moldova | 204 | 22 |
| 9 | Greece | 196 | 24 |
| 10 | Denmark | 181 | 62 |

Suggested explorer treatment:

- Add a toggle or card: "Modeled affinity lift".
- Show lift as average points per possible pair.
- Use explicit caveat text: "Based on selected modeled affinity groups; this is descriptive, not proof of motive."
- The key narrative: affinity voting strongly shaped mid-table positions and helped some countries, but Bulgaria still wins under this simple removal model.

### 8. Reciprocal Voting Network

Strongest reciprocal public pairs:

| Pair | Directional points | Total |
|---|---:|---:|
| Romania <-> Moldova | 12 + 12 | 24 |
| Greece <-> Cyprus | 12 + 12 | 24 |
| Croatia <-> Serbia | 12 + 12 | 24 |
| Bulgaria <-> Greece | 12 + 10 | 22 |
| Denmark <-> Norway | 10 + 12 | 22 |
| Moldova <-> Ukraine | 10 + 12 | 22 |
| Italy <-> Moldova | 12 + 7 | 19 |
| Italy <-> Albania | 7 + 12 | 19 |
| Bulgaria <-> Romania | 10 + 8 | 18 |
| Finland <-> Sweden | 6 + 12 | 18 |

Suggested explorer treatment:

- Add a network or chord-style view if feasible.
- Simpler alternative: a ranked reciprocal pairs table.
- Allow filter by audience, jury, or combined if both are implemented.

### 9. Running Order Is Not a Clean Story Here

Observed:

- Correlation between running order and audience points: -0.078
- Correlation between running order and jury points: -0.124
- First half average audience points: 97.8
- Second half average audience points: 68.1

Suggested explorer treatment:

- Treat as a small "myth check" panel, not a headline view.
- If plotted, use a scatterplot with trendline and explain the weak correlation.
- Avoid claiming a causal running-order effect from this single final.

## Implementation Priority

### Priority 1: Add Now

1. Counterfactual scoreboard toggle:
   - Official
   - Jury-only
   - Audience-only
   - Average public rank

2. Jury/public split columns:
   - `publicJuryPointGap`
   - `juryPublicRankGap`
   - labels for "public lift" and "jury lift"

3. Public consensus metrics:
   - average rank
   - median rank
   - top 10 count
   - first-place count
   - volatility

4. 11th-place heartbreak:
   - count rank 11s
   - highlight Czechia

### Priority 2: Add After Core Metrics

1. Consensus vs polarisation scatter/quadrant.
2. Affinity lift panel with caveats.
3. Reciprocal pairs table.
4. Zero-points explainer using average public rank.

### Priority 3: Experimental

1. Network/chord chart for reciprocal voting.
2. Voter personality profiles:
   - jury/audience top-10 overlap by voter
   - different jury and public 12-point recipients
3. More advanced counterfactuals:
   - remove affinity and redistribute to next eligible ranked entry
   - normalize away self-voting exclusions
   - compare rank-based Borda-style scoring with Eurovision scoring

## Suggested UI Copy

Use these as starting points, not final editorial text:

- "Bulgaria did not just win the scoreboard. It was the public's broad-consensus winner, appearing in every public top 10."
- "Czechia was the casualty of the top-10 threshold: 31 public voters ranked it 11th, just outside the points."
- "Zero public points does not always mean universal rejection. It means no voting entity placed the entry in its public top 10."
- "Modeled affinity voting created large local lifts, especially in the Hellenic, Nordic, Balkan, and Moldova/Romania pairs. In this simple no-redistribution model, it did not change the winner."
- "The jury and public told different stories: France was a jury top-four entry but only 18th with the public; Romania was public runner-up but only 13th with juries."

## External Context Checked

Common Eurovision scoring-analysis themes surfaced in external sources:

- Jury vs televote split.
- Bloc/friend/diaspora voting.
- Reciprocity and affinity networks.
- Running-order effects.
- Scoring-system distortions caused by the 1-8, 10, 12 schedule.

Useful starting references:

- Springer: Eurovision voting rules, biases and rationality.
  https://link.springer.com/article/10.1007/s10824-022-09456-5
- Oxford Academic / Significance: Eurovision voting as "a game of two halves".
  https://academic.oup.com/jrssig/article/20/2/6/7095712
- Cambridge Core: order effects in song contests, including Eurovision.
  https://www.cambridge.org/core/journals/judgment-and-decision-making/article/order-effects-in-the-results-of-song-contests-evidence-from-the-eurovision-and-the-new-wave/C03D0D5AA384362736FE1EB59A75516C
- ScienceDirect: friendship networks and Eurovision voting behaviour.
  https://www.sciencedirect.com/science/article/pii/S0378873313000506

## Validation Checks for Explorer Agent

Before shipping any integrated metric, verify:

- Public rank rows per finalist are complete enough for the metric being shown.
- Rank-derived public points match public points totals closely where expected.
- Sort ties have deterministic tie-breakers.
- Affinity labels are caveated as modeled groups.
- No polished display text uses mojibake artist/song names until encoding is corrected.
- Zero-points explanations distinguish "no top-10 placements" from "ranked last everywhere".

