# Data-Driven Voting Relationships

Generated: 2026-05-17  
Dataset: `src/data/vienna-2026-grand-final.json`  
Purpose: follow-on analysis for replacing or augmenting broad bloc-voting categories with country-pair features.

## Summary

The existing hand-built affinity clusters can be made more data-driven. I tested country-pair features from external country metadata and boundary data:

- Land border adjacency.
- Estimated shared land-border length.
- Shared official language.
- Same UN subregion.
- Geographic centroid distance.

These features do explain some voting lift, especially in the public vote. However, they do not explain everything. The strongest story is a split between:

1. **Relational voting**: border, language, near-neighbour, or same-region effects.
2. **Global-reach voting**: high points from distant countries with no shared border or official language.

Australia and Israel are particularly interesting in the second category. Bulgaria also has both: strong regional support and very strong long-distance support.

## External Data Used

REST Countries:

- URL: https://restcountries.com/
- Fields used: country names, ISO3 codes, land borders, official languages, latitude/longitude, subregion.
- Use: border adjacency, language matching, centroid distances, subregion matching.

World Atlas TopoJSON:

- URL: https://github.com/topojson/world-atlas
- CDN used in scratch analysis: https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json
- Use: estimate shared border lengths by summing shared TopoJSON arcs.

Important caveat: shared-border lengths are approximate because they come from generalized map geometry. They are good enough for exploratory relationship features, not for official geography claims.

## Methodology

### Pair Universe

For public-vote pair analysis:

```ts
for each voter in audienceRankings voters:
  for each recipient in finalists:
    if voter !== recipient:
      create pair row
```

`Rest of the World` was excluded from geographic-feature tests because it has no country geography.

### Audience Points

For each public pair:

```ts
audiencePoints = pointForRank(audienceRankings[voter, recipient].rank)
```

Where:

```ts
const pointForRank = (rank: number) =>
  [12, 10, 8, 7, 6, 5, 4, 3, 2, 1][rank - 1] ?? 0;
```

### Jury Points

For each jury pair:

```ts
juryPoints =
  votesGiven.find(vote =>
    vote.source === "jury" &&
    vote.voter === voter &&
    vote.recipient === recipient
  )?.points ?? 0
```

### Land Border

Two versions were tested:

1. REST Countries `borders` adjacency.
2. TopoJSON shared-boundary arcs.

They matched for the countries tested: 62 directed voter-recipient rows.

### Shared Border Length

Approximation:

1. Decode TopoJSON arcs.
2. For every arc used by two country geometries, treat that arc as a shared boundary.
3. Sum haversine segment lengths for the shared arcs.
4. Aggregate by undirected country pair.

### Shared Official Language

```ts
sharedLanguage =
  intersection(Object.values(voter.languages), Object.values(recipient.languages)).length > 0
```

This is conservative. It only uses official languages, not widely spoken minority languages or diaspora languages.

### Distance

Centroid distance uses REST Countries `latlng` with haversine distance.

Distance buckets tested:

- `<750km`
- `<1500km`
- `>1500km`

## Relationship Feature Lifts

Average points by directed voter-recipient rows:

| Feature | Rows | Audience avg | Audience baseline | Audience lift | Jury avg | Jury baseline | Jury lift |
|---|---:|---:|---:|---:|---:|---:|---:|
| Any land border | 62 | 4.85 | 2.19 | +2.66 | 3.19 | 2.32 | +0.87 |
| Shared official language | 28 | 4.00 | 2.33 | +1.67 | 3.29 | 2.36 | +0.93 |
| Same UN subregion | 110 | 4.04 | 2.14 | +1.89 | 3.55 | 2.22 | +1.33 |
| Centroid distance <750km | 115 | 4.09 | 2.12 | +1.96 | 2.97 | 2.30 | +0.67 |
| Centroid distance <1500km | 403 | 2.77 | 2.04 | +0.73 | 2.60 | 2.20 | +0.39 |

Interpretation:

- Land borders are the strongest simple public-vote predictor tested.
- Same subregion is strong for both public and jury.
- Shared official language is meaningful, but sample size is small.
- The public vote is more geographically sensitive than the jury vote on direct border adjacency.
- Proximity below 750km matters; broad proximity below 1500km is weaker.

## Border Length Findings

Among undirected border pairs with at least one finalist:

- Border pair count: 37
- Correlation between log border length and reciprocal public points: `0.268`
- Correlation between log border length and reciprocal jury points: `-0.105`

This means border length itself is only a weak public predictor and not useful for jury in this single contest. Border adjacency matters more than border length.

Top reciprocal public border pairs:

| Pair | Estimated border length | Reciprocal public points | Reciprocal jury points |
|---|---:|---:|---:|
| Moldova / Romania | 369km | 24 | 13 |
| Croatia / Serbia | 182km | 24 | 12 |
| Bulgaria / Greece | 358km | 22 | 6 |
| Moldova / Ukraine | 725km | 22 | 8 |
| Bulgaria / Romania | 557km | 18 | 4 |
| Finland / Sweden | 447km | 18 | 12 |
| Romania / Serbia | 413km | 17 | 0 |
| Albania / Greece | 196km | 16 | 3 |
| Romania / Ukraine | 470km | 14 | 4 |
| Poland / Ukraine | 368km | 12 | 1 |
| Montenegro / Serbia | 129km | 12 | 12 |
| Latvia / Lithuania | 401km | 12 | 0 |

Interesting non-length examples:

- Italy / San Marino has only an estimated 32km border but produced 8 reciprocal public points and 10 reciprocal jury points.
- Croatia / Montenegro has only an estimated 16km border but produced 8 reciprocal public points and 8 reciprocal jury points.
- Norway / Sweden has the longest border in this set at about 1555km, but only 5 reciprocal public points and 4 reciprocal jury points.

Suggested explorer framing:

> Shared borders matter; border length mostly does not. The relationship is social and cultural, not just geographic surface area.

## Normalised Border Share

Follow-up test: instead of using raw shared-border kilometres, compute the share of a country's total land border represented by the other country.

Directed metric:

```ts
voterBorderShare =
  sharedBorderKm(voter, recipient) / totalLandBorderKm(voter)
```

Symmetric alternatives:

```ts
recipientBorderShare =
  sharedBorderKm(voter, recipient) / totalLandBorderKm(recipient)

symmetricAverageBorderShare =
  (voterBorderShare + recipientBorderShare) / 2

symmetricMaxBorderShare =
  Math.max(voterBorderShare, recipientBorderShare)
```

Result across 62 directed border vote rows:

| Border metric | Audience correlation | Jury correlation |
|---|---:|---:|
| Raw shared km, log-scaled | 0.115 | -0.203 |
| Voter border share | 0.050 | -0.059 |
| Recipient border share | 0.116 | -0.039 |
| Symmetric average border share | 0.110 | -0.067 |
| Symmetric max border share | 0.036 | -0.016 |

Interpretation:

- Normalising by total border does not improve explanatory power in this single contest.
- The best signal remains the simple yes/no fact of sharing a land border.
- Border-share metrics are still useful for narrative examples, especially small countries, but should not be the main model feature.

High voter-border-share examples:

| Direction | Shared border share of voter | Public | Jury |
|---|---:|---:|---:|
| San Marino -> Italy | 100.0% | 8 | 10 |
| Denmark -> Germany | 100.0% | 0 | 0 |
| Sweden -> Norway | 77.7% | 1 | 0 |
| Norway -> Sweden | 66.6% | 4 | 4 |
| Moldova -> Ukraine | 66.3% | 10 | 0 |
| Belgium -> France | 44.9% | 0 | 5 |
| Latvia -> Lithuania | 42.7% | 12 | 0 |
| Switzerland -> Italy | 41.4% | 10 | 0 |
| Greece -> Bulgaria | 39.9% | 10 | 6 |
| Bulgaria -> Romania | 37.2% | 10 | 0 |

Useful counterexamples:

- Denmark shares 100% of its land border with Germany in this geometry, but Denmark gave Germany 0 public and 0 jury points.
- Sweden shares 77.7% of its land border with Norway, but Sweden gave Norway only 1 public point and 0 jury points.
- San Marino -> Italy is the cleanest positive small-country case: 100% border share, 8 public, 10 jury.

Recommendation:

- Keep `sharesLandBorder` as the primary feature.
- Include `voterBorderShare` as an optional tooltip/detail field.
- Avoid using border share as a headline predictor.

## Shared Language Findings

High shared-official-language rows:

| Pair direction | Shared language | Public points | Jury points |
|---|---|---:|---:|
| Cyprus -> Greece | Greek | 12 | 12 |
| Greece -> Cyprus | Greek | 12 | 12 |
| Sweden -> Finland | Swedish | 12 | 12 |
| Romania -> Moldova | Romanian | 12 | 10 |
| Moldova -> Romania | Romanian | 12 | 3 |
| Malta -> Australia | English | 10 | 8 |
| Switzerland -> Italy | Italian | 10 | 0 |
| San Marino -> Italy | Italian | 8 | 10 |
| United Kingdom -> Australia | English | 7 | 3 |
| Finland -> Sweden | Swedish | 6 | 0 |

Important caveat:

Official-language matching misses many real cultural and diaspora links. For example, countries can share major minority languages, migrant communities, music markets, or regional media without sharing official languages.

## Broader Language and Cultural-Mention Effects

Follow-up test: official-language overlap is too narrow. I tested a broader country-pair feature using CIA World Factbook language and ethnic-group text from the public `factbook.json` mirror.

Source:

- CIA World Factbook public data, mirrored as JSON:
  https://github.com/factbook/factbook.json
- The Factbook language field commonly reports official languages, minority languages, and sometimes speaker percentages.
- The ethnic-group field sometimes captures diasporic communities or named identity clusters that the language field misses.

### Heuristic

For each directed vote pair `voter -> recipient`, define an identity vocabulary for the recipient:

```ts
identityTerms[Italy] = ["italian"]
identityTerms[Albania] = ["albanian"]
identityTerms[Greece] = ["greek"]
identityTerms[Cyprus] = ["greek", "cypriot", "turkish"]
identityTerms[Malta] = ["maltese", "english", "italian"]
identityTerms[Moldova] = ["moldovan", "romanian"]
identityTerms[Serbia] = ["serbian", "serbo-croatian"]
identityTerms[Finland] = ["finnish", "swedish"]
...
```

Then:

```ts
directedLanguageCulturalMention =
  voterFactbookLanguagesAndEthnicGroups contains any identityTerms[recipient]
```

Mutual version:

```ts
mutualLanguageCulturalMention =
  directedLanguageCulturalMention(voter, recipient) &&
  directedLanguageCulturalMention(recipient, voter)
```

This is not a pure language variable. It is better described as `language/cultural identity mention`, because the ethnic-group field captures communities such as Albanian-Italians or Greek-Italians.

### Aggregate Lift

| Feature | Directed rows | Audience avg | Audience baseline | Audience lift | Jury avg | Jury baseline | Jury lift |
|---|---:|---:|---:|---:|---:|---:|---:|
| Directed language/cultural mention | 144 | 3.47 | 2.17 | +1.31 | 2.80 | 2.30 | +0.49 |
| Mutual language/cultural mention | 75 | 4.49 | 2.18 | +2.31 | 3.67 | 2.26 | +1.40 |

Interpretation:

- The broader Factbook-based language/cultural feature is meaningfully predictive.
- Mutual mentions are especially strong.
- This sits between the official-language feature and the hand-built affinity clusters: more data-driven than the curated blocs, more inclusive than official-language overlap.

### Captured High-Signal Rows

| Direction | Public | Jury | Matched identity terms | Reverse terms |
|---|---:|---:|---|---|
| Albania -> Italy | 12 | 12 | Italian | Albanian |
| Cyprus -> Greece | 12 | 12 | Greek | Greek |
| Greece -> Cyprus | 12 | 12 | Greek | Greek |
| Malta -> Italy | 12 | 10 | Italian | Italian |
| Romania -> Moldova | 12 | 10 | Romanian | Romanian |
| Moldova -> Romania | 12 | 3 | Romanian | Romanian |
| Sweden -> Finland | 12 | 12 | Finnish, Swedish | Swedish |
| San Marino -> Italy | 8 | 10 | Italian | Italian |
| Italy -> Albania | 7 | 0 | Albanian | Italian |
| Switzerland -> Italy | 10 | 0 | Italian | German, French, Italian |
| Switzerland -> Albania | 7 | 0 | Albanian | Italian |
| Poland -> Ukraine | 12 | 1 | Ukrainian | Polish |
| Ukraine -> Moldova | 12 | 8 | Moldovan, Romanian | Ukrainian |
| Latvia -> Lithuania | 12 | 0 | Lithuanian | none |

This directly supports the user's proposed Albania-Italy example. The Factbook captures it in both directions:

- Albania language text includes Italian among other minority/other languages.
- Italy ethnic-group text includes Albanian-Italians.
- Albania -> Italy gave 12 public and 12 jury.
- Italy -> Albania gave 7 public and 0 jury.

### Why This Is Better Than Official Language Alone

Official-language overlap caught only narrow cases such as:

- Greece / Cyprus.
- Romania / Moldova.
- San Marino / Italy.
- Sweden / Finland.
- Some English-language cases.

The broader Factbook mention heuristic also catches:

- Albania / Italy.
- Switzerland / Albania.
- Croatia / Italy.
- Greece / Albania.
- Cyprus / Romania.
- Poland / Ukraine.
- Ukraine / Moldova.

These are closer to the actual Eurovision discourse around migrant communities, regional exposure, and cross-border media than official-language overlap alone.

### Limitations

This should not be labelled as a direct measure of language speakers unless the source gives percentages for the specific country. Factbook language fields are inconsistent:

- Some countries have percentages by language.
- Some list only official languages.
- Some mention minority languages without percentages.
- Some relevant diasporic communities appear only in ethnic-group text.

Recommended label:

> Language and cultural-presence signal

Avoid labels like:

> Shared language population

unless a later pipeline extracts actual percentage estimates.

### Explorer Recommendation

Add three language-related tiers:

1. `sharedOfficialLanguage`: conservative, clean, low coverage.
2. `factbookLanguageOrIdentityMention`: broader, good coverage, descriptive.
3. `mutualFactbookLanguageOrIdentityMention`: strongest signal and easiest to explain.

Suggested copy:

> Official-language overlap is only part of the story. When a country's language or identity appears in another country's language or ethnic-group profile, average public points rise from 2.17 to 3.47. When the relationship is mutual, the average rises to 4.49.

Potential UI:

- Pair-level badges:
  - Official language
  - Language/identity mention
  - Mutual mention
- Recipient profile panel:
  - "Language-linked points"
  - "Mutual language-linked points"
  - "Unlinked/global points"

This should sit alongside border and distance, not replace them.

## Global-Reach Voting

I created an exclusive bucket system:

1. `border`
2. `shared official language`
3. `<750km`
4. `750-1500km`
5. `>1500km/no shared official language`

Bucket public averages:

| Bucket | Average public points |
|---|---:|
| Land border | 4.85 |
| Shared language, no land border | 3.75 |
| <750km, no border/language | 3.28 |
| 750-1500km, no border/language | 2.16 |
| >1500km, no border/language | 2.02 |

This enables a useful "global reach" metric:

```ts
globalReachPublicPoints =
  sum(public points from voter-recipient pairs where
    distance > 1500km &&
    !sharedOfficialLanguage &&
    !landBorder
  )
```

Recipient results, excluding `Rest of the World` for comparability:

| Recipient | Global-reach public points | Comparable public points | Share |
|---|---:|---:|---:|
| Israel | 172 | 214 | 80% |
| Bulgaria | 150 | 300 | 50% |
| Australia | 103 | 120 | 86% |
| Romania | 84 | 225 | 37% |
| Finland | 73 | 135 | 54% |
| Ukraine | 65 | 159 | 41% |
| Moldova | 59 | 173 | 34% |
| Greece | 55 | 143 | 38% |
| Italy | 33 | 147 | 22% |
| Denmark | 33 | 78 | 42% |

This tells a strong story:

- Israel's public score is overwhelmingly long-distance and non-language-linked in this model.
- Australia is also a global-reach entry, especially with juries.
- Bulgaria combines regional strength with broad long-distance appeal.

Selected long-distance high public votes:

| Direction | Public | Jury | Distance |
|---|---:|---:|---:|
| Australia -> Bulgaria | 12 | 12 | 13425km |
| United Kingdom -> Bulgaria | 12 | 10 | 2314km |
| Denmark -> Bulgaria | 12 | 12 | 1798km |
| Finland -> Israel | 12 | 0 | 3673km |
| France -> Israel | 12 | 4 | 3263km |
| Germany -> Israel | 12 | 3 | 3050km |
| Portugal -> Israel | 12 | 0 | 3967km |
| Switzerland -> Israel | 12 | 2 | 2881km |
| Armenia -> Australia | 10 | 12 | 11736km |
| Israel -> Australia | 10 | 12 | 12225km |

## Candidate Explorer Additions

### 1. Relationship-Aware Vote Table

Add columns to pair-level vote views:

- Land border: yes/no.
- Estimated shared border length.
- Shared official language(s).
- Same subregion.
- Distance bucket.
- Public points.
- Jury points.

This makes bloc voting inspectable rather than pre-labelled.

### 2. Relationship Lift Cards

Cards:

- Land border lift: public +2.66, jury +0.87.
- Shared official language lift: public +1.67, jury +0.93.
- Same subregion lift: public +1.89, jury +1.33.
- Near-neighbour lift under 750km: public +1.96, jury +0.67.

Keep caveats visible: one contest, limited sample sizes, official languages only.

### 3. Global Reach Score

For each finalist:

```ts
globalReachShare = globalReachPublicPoints / comparablePublicPoints
```

Use this to distinguish:

- Regional winners.
- Language-linked winners.
- Global-reach winners.
- Mixed winners.

Examples:

- Israel: 80% global-reach public share.
- Australia: 86% global-reach public share.
- Bulgaria: 50% global-reach public share plus strong regional points.

### 4. Border Length Myth Check

Mini finding:

> Border adjacency predicts extra points; longer shared borders do not strongly predict more points.

Use a scatterplot:

- X: estimated shared border length.
- Y: reciprocal public points.
- Label top pairs: Moldova/Romania, Croatia/Serbia, Bulgaria/Greece, Moldova/Ukraine, Norway/Sweden.

### 5. Data-Driven Affinity Model

Replace or augment the hard-coded affinity clusters with a scoring model:

```ts
relationshipScore =
  1.0 * landBorder +
  0.8 * sharedOfficialLanguage +
  0.6 * sameSubregion +
  0.5 * (distance < 750km) +
  0.2 * (distance < 1500km)
```

Alternative: do not combine into one score. Show each feature independently, which is more transparent and less arbitrary.

Recommendation: start with independent features. A combined score risks looking more scientific than it is.

## Other Analysis Avenues Worth Exploring

### Voter Jury/Public Agreement

Low overlap between a country's jury top 10 and public top 10:

| Voter | Top-10 overlap | Audience 12 | Jury 12 |
|---|---:|---|---|
| Georgia | 3/10 | Ukraine | France |
| Finland | 4/10 | Israel | France |
| Luxembourg | 4/10 | Bulgaria | Romania |
| Switzerland | 4/10 | Israel | Ukraine |

Potential story:

> Some countries did not have one national taste profile. Their jury and public were watching different contests.

### Recipient Support Mix

Use exclusive relationship buckets to show where each finalist's points came from:

Example comparable public mix, excluding `Rest of the World`:

| Recipient | Border | Language | Near | Mid | Far/global | Total |
|---|---:|---:|---:|---:|---:|---:|
| Bulgaria | 28 | 0 | 19 | 103 | 150 | 300 |
| Israel | 0 | 0 | 8 | 34 | 172 | 214 |
| Australia | 0 | 17 | 0 | 0 | 103 | 120 |
| Romania | 39 | 0 | 13 | 89 | 84 | 225 |
| Moldova | 24 | 0 | 8 | 82 | 59 | 173 |
| Italy | 29 | 0 | 34 | 51 | 33 | 147 |

This could become a stacked bar view: "Where did the points come from?"

### Residual Outliers

Using bucket averages, long-distance 12s can be framed as residual outliers:

- The `>1500km/no language` bucket averages only 2.02 public points.
- A 12-point vote in that bucket is about +9.98 above bucket expectation.

This makes unusually strong long-distance votes easy to surface without making assumptions about motive.

## Recommendation

Yes, this direction is worth adding. The strongest explorer-ready version is:

1. Add data-driven relationship features at pair level.
2. Show relationship lifts as descriptive cards.
3. Add a "global reach" score for each finalist.
4. Keep the original broad bloc model only as a curated overlay, not the main evidence.

Avoid overclaiming:

- Do not call these causal bloc effects.
- Do not equate official-language overlap with cultural similarity.
- Do not treat approximate border lengths as official facts.
- Do not infer diaspora directly unless diaspora population data is added later.
