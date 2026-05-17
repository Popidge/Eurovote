# Further Eurovision Analysis Routes

Generated: 2026-05-17  
Dataset: `src/data/vienna-2026-grand-final.json`  
Purpose: additional analysis avenues beyond relationship/bloc features.

## Recommended Additions

The most promising routes from this pass are:

1. **Social-choice view**: Condorcet, Borda, and public majority comparisons.
2. **Robustness / fragility**: leave-one-voter-out scoreboard movement.
3. **Support concentration**: broad support versus dependency on a few supporters.
4. **Taste-map similarity**: which voting publics and juries had similar taste profiles.
5. **Jury/public national split**: voters whose jury and public watched different contests.

## 1. Social-Choice View

The full audience rankings allow analysis beyond Eurovision's top-10 point schedule.

### Method

For each pair of finalists `A` and `B`, compare only voters who ranked both entries. This matters because countries cannot vote for themselves.

```ts
for each pair A, B:
  for each voter:
    if voter has rank for A and rank for B:
      if rank(A) < rank(B): A_pairwise_votes++
      if rank(B) < rank(A): B_pairwise_votes++
```

Pairwise record:

```ts
pairwiseWins = count(opponents beaten by public majority)
pairwiseLosses = count(opponents lost to by public majority)
pairwiseTies = count(pairwise ties)
marginSum = sum(pairwise winning margins) - sum(pairwise losing margins)
```

Borda-style score:

```ts
borda = sum(26 - audienceRank)
```

With 25 finalists, rank 1 gets 25, rank 25 gets 1.

### Key Finding

Bulgaria is a Condorcet winner: it beats every other finalist head-to-head in the public rankings.

Top pairwise public-majority leaderboard:

| Rank | Country | Pairwise record | Margin sum | Avg public rank | Borda | Audience points |
|---:|---|---:|---:|---:|---:|---:|
| 1 | Bulgaria | 24-0-0 | 686 | 2.9 | 810 | 312 |
| 2 | Romania | 23-1-0 | 560 | 4.7 | 747 | 232 |
| 3 | Israel | 22-2-0 | 500 | 5.5 | 717 | 220 |
| 4 | Moldova | 21-3-0 | 430 | 6.5 | 682 | 183 |
| 5 | Ukraine | 19-4-1 | 390 | 7.1 | 662 | 167 |
| 6 | Italy | 19-4-1 | 360 | 7.5 | 647 | 147 |
| 7 | Greece | 18-6-0 | 348 | 7.7 | 641 | 147 |
| 8 | Finland | 16-7-1 | 364 | 7.5 | 649 | 138 |
| 9 | Australia | 16-7-1 | 322 | 8.1 | 628 | 122 |
| 10 | Albania | 15-9-0 | 162 | 10.3 | 548 | 85 |

### Story

The public's broad preference order is not identical to the public points table. The winner is robust under every public method tested, and the corrected detailed-rank data shows a more modest middle-table reshuffle than the earlier bucket-derived data suggested.

France is the clearest low-score example:

- Audience points rank: 18
- Borda rank: 14
- Pairwise rank: 14
- Audience points: 14

This reinforces the corrected near-miss story: France was not broadly loved enough to score heavily, but its full rankings were stronger than its 14 public points alone imply.

### Eurovision Points vs Borda Divergences

| Country | Audience points rank | Borda rank | Difference |
|---|---:|---:|---:|
| France | 18 | 14 | -4 |
| Malta | 21 | 18 | -3 |
| Cyprus | 14 | 17 | +3 |
| Austria | 22 | 25 | +3 |
| Finland | 8 | 6 | -2 |
| Lithuania | 19 | 21 | +2 |
| Sweden | 17 | 19 | +2 |
| Germany | 23 | 22 | -1 |

Negative difference means the country was better in broad public ranking than in Eurovision points.

Suggested UI:

- Add a "Public method" toggle:
  - Eurovision points
  - Average rank
  - Borda
  - Pairwise majority
- Add a short explainer: "The public points table rewards top-10 placements; Borda and pairwise views measure broader preference."

## 2. Robustness / Fragility

### Method

For each voter:

```ts
counterfactualTotal[country] = officialTotal[country]

for each recipient:
  subtract voter audience points
  subtract voter jury points, if that voter has jury data

rerank scoreboard
```

This is a leave-one-voter-out test. It asks how much the final ranking moves if one voting country/entity is removed.

### Findings

Bulgaria remains the winner in every leave-one-voter-out scenario.

The top three is usually stable, but the Romania/Australia battle is fragile. Removing any of these voters flips the top three from:

> Bulgaria, Israel, Romania

to:

> Bulgaria, Israel, Australia

Voters that flip the top three:

- Italy
- Moldova
- Ukraine
- Luxembourg

Most influential voters by total rank movement:

| Removed voter | Total rank movement | Max single-country move | Winner |
|---|---:|---:|---|
| Greece | 10 | 2 | Bulgaria |
| Norway | 10 | 2 | Bulgaria |
| Romania | 10 | 2 | Bulgaria |
| Croatia | 8 | 2 | Bulgaria |
| Finland | 8 | 1 | Bulgaria |
| France | 8 | 2 | Bulgaria |
| Montenegro | 8 | 2 | Bulgaria |

### Story

The winner was not fragile. The podium edge was.

This is useful because it separates:

- Decisive winner: Bulgaria.
- Fragile rank boundaries: Romania/Australia, Italy/Finland, Ukraine/Greece, Serbia/Malta.

### Closest Official Margins

| Places | Countries | Margin |
|---|---|---:|
| 9/10 | Ukraine vs Greece | 1 |
| 17/18 | Serbia vs Malta | 1 |
| 5/6 | Italy vs Finland | 2 |
| 8/9 | Moldova vs Ukraine | 5 |
| 12/13 | Poland vs Albania | 5 |
| 24/25 | Austria vs United Kingdom | 5 |
| 4/5 | Australia vs Italy | 6 |
| 23/24 | Germany vs Austria | 6 |
| 11/12 | France vs Poland | 8 |
| 3/4 | Romania vs Australia | 9 |

Suggested UI:

- "Fragile margins" strip.
- Leave-one-voter-out mode for advanced users.
- Highlight: "Bulgaria survives every removal; Romania's podium place does not."

## 3. Support Concentration

### Method

For each recipient:

```ts
publicTop3Share = sum(top 3 public point awards received) / total public points
publicTop5Share = sum(top 5 public point awards received) / total public points
juryTop3Share = sum(top 3 jury point awards received) / total jury points
```

High share means the score depends heavily on a small number of supporters.

### Broad vs Concentrated Public Support

Broad public support examples:

| Country | Public top 3 share | Public points |
|---|---:|---:|
| Bulgaria | 12% | 312 |
| Romania | 14% | 232 |
| Israel | 16% | 220 |
| Moldova | 20% | 183 |
| Ukraine | 22% | 167 |

Concentrated public support examples:

| Country | Public top 3 share | Public points |
|---|---:|---:|
| Malta | 100% | 8 |
| Sweden | 100% | 16 |
| Lithuania | 100% | 12 |
| Austria | 100% | 5 |
| Norway | 95% | 19 |
| Czechia | 89% | 9 |
| Cyprus | 74% | 34 |
| Poland | 71% | 17 |
| Serbia | 65% | 52 |

### Story

Bulgaria, Romania, Israel, Moldova, and Ukraine had distributed public support. Several lower-scoring entries depended almost entirely on one to three voting entities.

This pairs well with the consensus/polarisation view:

- Broad high score: Bulgaria.
- Concentrated low score: Malta, Sweden, Lithuania, Austria.
- Concentrated medium score: Serbia, Cyprus.
- Better in full rankings than points suggest: France and Malta.

Suggested UI:

- Add "support concentration" bars.
- Tooltip: "Share of public score supplied by top 3 supporting voters."

## 4. Taste Similarity Map

### Method

For each pair of public voters:

```ts
rankCorrelation = pearsonCorrelation(
  ranks assigned by voter A to shared recipients,
  ranks assigned by voter B to shared recipients
)

top10Overlap = count(shared recipients in both public top 10s)
```

For jury voters, use jury point vectors and point correlation.

### Most Similar Public Taste Pairs

| Voter pair | Rank correlation | Top-10 overlap |
|---|---:|---:|
| Italy / Rest of the World | 0.98 | 10 |
| Albania / Moldova | 0.95 | 9 |
| Belgium / Italy | 0.94 | 9 |
| Belgium / France | 0.94 | 9 |
| Montenegro / Romania | 0.93 | 9 |
| Czechia / Georgia | 0.92 | 9 |
| Serbia / Switzerland | 0.92 | 10 |
| Estonia / Latvia | 0.92 | 9 |
| Denmark / Norway | 0.91 | 8 |
| Moldova / Romania | 0.89 | 8 |

### Least Similar Public Taste Pairs

| Voter pair | Rank correlation | Top-10 overlap |
|---|---:|---:|
| Greece / Sweden | -0.06 | 4 |
| Norway / Romania | -0.04 | 5 |
| Denmark / Greece | -0.03 | 6 |
| Montenegro / Norway | -0.03 | 6 |
| Bulgaria / Norway | -0.01 | 4 |
| San Marino / Ukraine | -0.01 | 5 |

### Voter Mainstreamness

Average rank correlation to all other public voters:

Most mainstream:

| Voter | Avg rank correlation |
|---|---:|
| Belgium | 0.68 |
| France | 0.67 |
| Italy | 0.67 |
| Estonia | 0.65 |
| Rest of the World | 0.64 |
| Austria | 0.64 |

Most distinctive:

| Voter | Avg rank correlation |
|---|---:|
| Denmark | 0.31 |
| Norway | 0.36 |
| Ukraine | 0.36 |
| Greece | 0.39 |
| Finland | 0.39 |
| Australia | 0.40 |

### Story

This gives the explorer a "taste map" rather than a political bloc map. Some pairs are expected, such as Denmark/Norway and Moldova/Romania. Others are more surprising, such as Belgium/Italy, Czechia/Georgia, and Serbia/Switzerland.

Suggested UI:

- Heatmap of voter similarity.
- Top similar / most different pair lists.
- "Mainstreamness" ranking.

## 5. Jury/Public National Split

### Method

For each voting country with both jury and public data:

```ts
publicJuryCorrelation = pearsonCorrelation(
  public point vector,
  jury point vector
)
```

Also compare public 12 and jury 12.

### Strongly Aligned Voters

| Voter | Public/jury correlation | Public 12 | Jury 12 |
|---|---:|---|---|
| Malta | 0.81 | Italy | Bulgaria |
| Israel | 0.79 | Bulgaria | Australia |
| Montenegro | 0.76 | Serbia | Serbia |
| Armenia | 0.74 | Bulgaria | Australia |
| Norway | 0.72 | Denmark | Denmark |
| Sweden | 0.68 | Finland | Finland |

### Strongly Split Voters

| Voter | Public/jury correlation | Public 12 | Jury 12 |
|---|---:|---|---|
| Georgia | -0.16 | Ukraine | France |
| Portugal | -0.14 | Israel | Albania |
| Switzerland | -0.14 | Israel | Ukraine |
| Finland | -0.11 | Israel | France |
| Belgium | -0.07 | Bulgaria | Poland |
| Latvia | -0.04 | Lithuania | Czechia |
| Italy | -0.03 | Moldova | Belgium |

### Story

Some countries did not have one national taste profile. Their public and jury were effectively watching different contests.

Suggested UI:

- Add a "jury/public agreement by voter" table.
- Include public 12, jury 12, top-10 overlap, and correlation.
- Use this as a country-detail panel rather than a main scoreboard feature.

## 6. Alignment vs Network Direction

Follow-up question: are low-alignment juries simply voting more or less along relationship networks than their publics?

Short answer: not globally. There is no meaningful overall correlation between jury/public alignment and the jury-public difference in relationship-linked vote share.

### Method

For each voting country:

```ts
alignment = corr(public point vector, jury point vector)

publicRelationshipShare =
  public points to recipients with any relationship feature / total public points

juryRelationshipShare =
  jury points to recipients with any relationship feature / total jury points

relationshipShareDelta =
  juryRelationshipShare - publicRelationshipShare
```

Relationship features included:

- curated affinity group
- shared land border
- shared official language
- same subregion
- centroid distance under 750km

### Overall Correlations

| Metric | Correlation with alignment |
|---|---:|
| Relationship-share delta | 0.013 |
| Curated affinity-share delta | 0.068 |
| Border-share delta | 0.111 |
| Official-language-share delta | 0.095 |
| Same-subregion-share delta | -0.066 |
| Near-neighbour-share delta | 0.032 |
| Far/global-share delta | 0.035 |

Interpretation:

- Low alignment is not explained by one network behaviour.
- Some split juries moved away from relationship-linked public voting.
- Others moved toward relationship-linked recipients.
- The more robust story is voter-specific, not global.

### Low-Alignment Case Studies

| Voter | Alignment | Jury relationship share | Public relationship share | Delta | Public 12 | Jury 12 |
|---|---:|---:|---:|---:|---|---|
| United Kingdom | 0.14 | 28% | 14% | +14pp | Bulgaria | France |
| Belgium | -0.07 | 12% | 0% | +12pp | Bulgaria | Poland |
| Austria | 0.02 | 33% | 24% | +9pp | Bulgaria | Poland |
| Switzerland | -0.14 | 29% | 21% | +9pp | Israel | Ukraine |
| Finland | -0.11 | 31% | 24% | +7pp | Israel | France |
| France | 0.12 | 14% | 9% | +5pp | Israel | Norway |
| Czechia | -0.00 | 9% | 7% | +2pp | Ukraine | Denmark |
| Italy | -0.03 | 14% | 19% | -5pp | Moldova | Belgium |
| Portugal | -0.14 | 0% | 5% | -5pp | Israel | Albania |
| Georgia | -0.16 | 10% | 17% | -7pp | Ukraine | France |
| Azerbaijan | 0.09 | 7% | 21% | -14pp | Israel | Italy |
| Latvia | -0.04 | 28% | 43% | -16pp | Lithuania | Czechia |
| Bulgaria | -0.00 | 9% | 64% | -55pp | Greece | Malta |

### Standout Interpretations

Bulgaria is the clearest "public affinity, jury detachment" case:

- Bulgarian public gave 64% of its points to relationship-linked recipients.
- Bulgarian jury gave only 9%.
- Public 12: Greece.
- Jury 12: Malta.

Belgium and the United Kingdom are opposite-style split cases:

- Their publics went heavily toward global/non-linked favourites.
- Their juries moved more toward relationship-linked or regional recipients.
- Belgium: public 12 Bulgaria, jury 12 Poland.
- United Kingdom: public 12 Bulgaria, jury 12 France.

Latvia split away from its own regional public pattern:

- Latvian public relationship share: 43%.
- Latvian jury relationship share: 28%.
- Public 12: Lithuania.
- Jury 12: Czechia.

Switzerland and Finland split from public Israel support into more jury-coded choices:

- Switzerland public 12: Israel; jury 12: Ukraine.
- Finland public 12: Israel; jury 12: France.
- Both juries had slightly higher relationship-linked shares than their publics, but the main story is aesthetic/recipient choice rather than pure network lift.

### Explorer Recommendation

Do not present this as:

> Low-alignment juries are less network-driven.

The data does not support that globally.

Better framing:

> When juries and publics split, they split in different ways. Some juries dampened their public's regional/affinity vote; others moved toward regional or jury-coded neighbours. The interesting cases are country-level.

## Implementation Notes

### Avoid Metric Pitfalls

- Pairwise comparisons must exclude voters who are missing one of the two entries, usually because of self-vote exclusions.
- Borda scores should use only actual audience ranking rows.
- Leave-one-voter-out should clarify whether removing a voter removes both jury and public votes. The findings above remove both where both exist.
- Support concentration ratios are unstable for very low totals; show raw points beside percentages.

### Recommended Priority

1. Social-choice view, because it strongly extends the existing "average rank vs points" story.
2. Support concentration, because it is easy to explain and visually compact.
3. Robustness/fragility, because it gives a strong narrative without much UI complexity.
4. Taste similarity map, if the explorer can support heatmaps or pair lists.
5. Jury/public national split, best as an advanced detail panel.
