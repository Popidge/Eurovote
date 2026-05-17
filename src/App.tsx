import { Fragment, type ReactNode, useMemo, useState } from 'react';
import { Crown, ExternalLink, Search } from 'lucide-react';
import data from './data/vienna-2026-grand-final.json';
import articleMarkdown from '../article.md?raw';
import './App.css';

type Entry = (typeof data.scoreboard)[number];
type AudienceRank = (typeof data.audienceRankings)[number];
type ScoreboardMode = 'official' | 'jury' | 'audience' | 'averageRank';
type AppView = 'article' | 'scoreboard' | 'counterfactuals' | 'public' | 'networks' | 'voters' | 'definitions';
type SortKey =
  | 'rank'
  | 'country'
  | 'total'
  | 'jury'
  | 'audience'
  | 'avgRank'
  | 'audienceRankDelta'
  | 'volatility'
  | 'publicJuryPointGap'
  | 'juryPublicRankGap';
type SortState = { key: SortKey; direction: 'asc' | 'desc' };

const pointValues = [12, 10, 8, 7, 6, 5, 4, 3, 2, 1, 0];
const relationshipLiftCards = [
  { feature: 'Land border', rows: 62, audienceLift: 2.66, juryLift: 0.87, audienceAvg: 4.85, juryAvg: 3.19 },
  { feature: 'Shared official language', rows: 28, audienceLift: 1.67, juryLift: 0.93, audienceAvg: 4.0, juryAvg: 3.29 },
  { feature: 'Same UN subregion', rows: 110, audienceLift: 1.89, juryLift: 1.33, audienceAvg: 4.04, juryAvg: 3.55 },
  { feature: 'Under 750km', rows: 115, audienceLift: 1.96, juryLift: 0.67, audienceAvg: 4.09, juryAvg: 2.97 },
  { feature: 'Mutual language/cultural mention', rows: 75, audienceLift: 2.31, juryLift: 1.4, audienceAvg: 4.49, juryAvg: 3.67 },
];
const globalReachLeaders = [
  { country: 'Israel', points: 172, comparable: 214, share: 0.8 },
  { country: 'Australia', points: 103, comparable: 120, share: 0.86 },
  { country: 'Bulgaria', points: 150, comparable: 300, share: 0.5 },
  { country: 'Finland', points: 73, comparable: 135, share: 0.54 },
  { country: 'Ukraine', points: 65, comparable: 159, share: 0.41 },
  { country: 'Moldova', points: 59, comparable: 173, share: 0.34 },
];
const borderPairs = [
  { pair: 'Moldova / Romania', km: 369, publicPoints: 24, juryPoints: 13 },
  { pair: 'Croatia / Serbia', km: 182, publicPoints: 24, juryPoints: 12 },
  { pair: 'Bulgaria / Greece', km: 358, publicPoints: 22, juryPoints: 6 },
  { pair: 'Moldova / Ukraine', km: 725, publicPoints: 22, juryPoints: 8 },
  { pair: 'Bulgaria / Romania', km: 557, publicPoints: 18, juryPoints: 4 },
  { pair: 'Finland / Sweden', km: 447, publicPoints: 18, juryPoints: 12 },
  { pair: 'Norway / Sweden', km: 1555, publicPoints: 5, juryPoints: 4 },
  { pair: 'Italy / San Marino', km: 32, publicPoints: 8, juryPoints: 10 },
];
const languageIdentityRows = [
  { direction: 'Albania -> Italy', publicPoints: 12, juryPoints: 12, terms: 'Italian', reverse: 'Albanian' },
  { direction: 'Cyprus -> Greece', publicPoints: 12, juryPoints: 12, terms: 'Greek', reverse: 'Greek' },
  { direction: 'Romania -> Moldova', publicPoints: 12, juryPoints: 10, terms: 'Romanian', reverse: 'Romanian' },
  { direction: 'Sweden -> Finland', publicPoints: 12, juryPoints: 12, terms: 'Finnish, Swedish', reverse: 'Swedish' },
  { direction: 'Poland -> Ukraine', publicPoints: 12, juryPoints: 1, terms: 'Ukrainian', reverse: 'Polish' },
  { direction: 'Switzerland -> Albania', publicPoints: 7, juryPoints: 0, terms: 'Albanian', reverse: 'Italian' },
];
const bucketAverages = [
  { bucket: 'Land border', points: 4.85 },
  { bucket: 'Language, no border', points: 3.75 },
  { bucket: '<750km only', points: 3.28 },
  { bucket: '750-1500km only', points: 2.16 },
  { bucket: '>1500km global', points: 2.02 },
];
const alignmentNetworkCorrelations = [
  { metric: 'Relationship-share delta', correlation: 0.013 },
  { metric: 'Curated affinity-share delta', correlation: 0.068 },
  { metric: 'Border-share delta', correlation: 0.111 },
  { metric: 'Official-language-share delta', correlation: 0.095 },
  { metric: 'Same-subregion-share delta', correlation: -0.066 },
  { metric: 'Near-neighbour-share delta', correlation: 0.032 },
  { metric: 'Far/global-share delta', correlation: 0.035 },
];
const alignmentNetworkCases = [
  { voter: 'Bulgaria', alignment: 0.0, juryShare: 0.09, publicShare: 0.64, public12: 'Greece', jury12: 'Malta', story: 'Public affinity, jury detachment' },
  { voter: 'Latvia', alignment: -0.04, juryShare: 0.28, publicShare: 0.43, public12: 'Lithuania', jury12: 'Czechia', story: 'Jury moved away from regional public pattern' },
  { voter: 'United Kingdom', alignment: 0.14, juryShare: 0.28, publicShare: 0.14, public12: 'Bulgaria', jury12: 'France', story: 'Jury more relationship-linked than public' },
  { voter: 'Belgium', alignment: -0.07, juryShare: 0.12, publicShare: 0.0, public12: 'Bulgaria', jury12: 'Poland', story: 'Public global, jury more regional' },
  { voter: 'Georgia', alignment: -0.16, juryShare: 0.1, publicShare: 0.17, public12: 'Ukraine', jury12: 'France', story: 'Split away from linked public vote' },
  { voter: 'Finland', alignment: -0.11, juryShare: 0.31, publicShare: 0.24, public12: 'Israel', jury12: 'France', story: 'Aesthetic split more than network split' },
];
const scoreGap = (entry: Entry) => entry.audience - entry.jury;
const rankSorter = (a: number, b: number) => a - b;

const median = (values: number[]) => {
  const sorted = values.toSorted(rankSorter);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

const rankStats = (country: string, rankings: AudienceRank[]) => {
  const rows = rankings.filter((row) => row.recipient === country);
  const ranks = rows.map((row) => row.rank);
  const average = ranks.reduce((sum, rank) => sum + rank, 0) / Math.max(1, ranks.length);
  const scoringRows = rows.filter((row) => row.inScoringTop10);
  const nonScoring = rows.filter((row) => !row.inScoringTop10);

  return {
    rows,
    average,
    median: median(ranks),
    best: Math.min(...ranks),
    worst: Math.max(...ranks),
    top10s: scoringRows.length,
    elevenths: rows.filter((row) => row.rank === 11).length,
    twelves: rows.filter((row) => row.points === 12).length,
    nonScoringAverage: nonScoring.reduce((sum, row) => sum + row.rank, 0) / Math.max(1, nonScoring.length),
    volatility: Math.sqrt(ranks.reduce((sum, rank) => sum + (rank - average) ** 2, 0) / Math.max(1, ranks.length)),
  };
};

const affinityClusters = [
  ['Albania', 'Croatia', 'Montenegro', 'Serbia'],
  ['Denmark', 'Finland', 'Norway', 'Sweden'],
  ['Estonia', 'Latvia', 'Lithuania'],
  ['Cyprus', 'Greece'],
  ['Moldova', 'Romania'],
  ['Australia', 'United Kingdom'],
];

const affinityPairs = new Set(
  affinityClusters.flatMap((cluster) =>
    cluster.flatMap((voter) => cluster.filter((recipient) => recipient !== voter).map((recipient) => `${voter}->${recipient}`)),
  ),
);

const isAffinityVote = (voter: string, recipient: string) => affinityPairs.has(`${voter}->${recipient}`);

const pointForRank = (rank: number) => [12, 10, 8, 7, 6, 5, 4, 3, 2, 1][rank - 1] ?? 0;

const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);

const pearson = (pairs: Array<[number, number]>) => {
  const xs = pairs.map(([x]) => x);
  const ys = pairs.map(([, y]) => y);
  const meanX = average(xs);
  const meanY = average(ys);
  const numerator = pairs.reduce((sum, [x, y]) => sum + (x - meanX) * (y - meanY), 0);
  const denominator =
    Math.sqrt(xs.reduce((sum, x) => sum + (x - meanX) ** 2, 0)) * Math.sqrt(ys.reduce((sum, y) => sum + (y - meanY) ** 2, 0));
  return denominator ? numerator / denominator : 0;
};

const rankOfScores = (scores: Record<string, number>) =>
  Object.entries(scores)
    .toSorted((a, b) => b[1] - a[1])
    .map(([country], index) => [country, index + 1] as const);

const affinitySummary = () => {
  const finalists = data.scoreboard.map((entry) => entry.country);
  const audienceVoters = [...new Set(data.audienceRankings.map((row) => row.voter))];
  const juryVoters = [...new Set(data.votesGiven.filter((vote) => vote.source === 'jury').map((vote) => vote.voter))];

  const audienceMatrix = audienceVoters.flatMap((voter) =>
    finalists
      .filter((recipient) => recipient !== voter)
      .map((recipient) => {
        const row = data.audienceRankings.find((rank) => rank.voter === voter && rank.recipient === recipient);
        return { voter, recipient, points: row ? pointForRank(row.rank) : 0, affinity: isAffinityVote(voter, recipient) };
      }),
  );

  const juryMatrix = juryVoters.flatMap((voter) =>
    finalists
      .filter((recipient) => recipient !== voter)
      .map((recipient) => ({
        voter,
        recipient,
        points:
          data.votesGiven.find((vote) => vote.source === 'jury' && vote.voter === voter && vote.recipient === recipient)?.points ?? 0,
        affinity: isAffinityVote(voter, recipient),
      })),
  );

  const summarize = (rows: typeof audienceMatrix) => {
    const affinity = rows.filter((row) => row.affinity).map((row) => row.points);
    const baseline = rows.filter((row) => !row.affinity).map((row) => row.points);
    return {
      affinityAverage: average(affinity),
      baselineAverage: average(baseline),
      lift: average(affinity) - average(baseline),
      pairCount: affinity.length,
    };
  };

  return {
    audience: summarize(audienceMatrix),
    jury: summarize(juryMatrix),
  };
};

const buildEnrichedEntries = () => {
  const byAudiencePoints = data.scoreboard.toSorted((a, b) => b.audience - a.audience || a.rank - b.rank);
  const byJuryPoints = data.scoreboard.toSorted((a, b) => b.jury - a.jury || a.rank - b.rank);
  const entries = data.scoreboard.map((entry) => ({
    ...entry,
    pointAudiencePlace: byAudiencePoints.findIndex((candidate) => candidate.country === entry.country) + 1,
    juryPointPlace: byJuryPoints.findIndex((candidate) => candidate.country === entry.country) + 1,
    audienceStats: rankStats(entry.country, data.audienceRankings),
  }));

  const byAverageRank = entries.toSorted((a, b) => a.audienceStats.average - b.audienceStats.average);
  return entries
    .map((entry) => ({
      ...entry,
      averageAudiencePlace: byAverageRank.findIndex((candidate) => candidate.country === entry.country) + 1,
    }))
    .map((entry) => ({
      ...entry,
      audienceRankDelta: entry.pointAudiencePlace - entry.averageAudiencePlace,
      publicJuryPointGap: entry.audience - entry.jury,
      juryPublicRankGap: entry.juryPointPlace - entry.pointAudiencePlace,
    }));
};

const buildAnalysis = (enriched: ReturnType<typeof buildEnrichedEntries>) => {
  const zeroAudience = enriched.filter((entry) => entry.audience === 0);
  const biggestPublicLift = enriched.toSorted((a, b) => scoreGap(b) - scoreGap(a)).slice(0, 5);
  const hiddenAudience = enriched
    .filter((entry) => entry.audienceStats.top10s === 0)
    .toSorted((a, b) => a.audienceStats.average - b.audienceStats.average);
  const biggestRankDeltas = enriched.toSorted((a, b) => Math.abs(b.audienceRankDelta) - Math.abs(a.audienceRankDelta)).slice(0, 6);
  const polarising = enriched.toSorted((a, b) => b.audienceStats.volatility - a.audienceStats.volatility).slice(0, 6);
  const heartbreak = enriched.toSorted((a, b) => b.audienceStats.elevenths - a.audienceStats.elevenths).slice(0, 5);
  const affinity = affinitySummary();
  const countries = [...new Set(data.scoreboard.map((entry) => entry.country))];
  const publicVoters = [...new Set(data.audienceRankings.map((row) => row.voter))];
  const rankByVoterRecipient = new Map(data.audienceRankings.map((row) => [`${row.voter}->${row.recipient}`, row]));
  const juryVoteByVoterRecipient = new Map(
    data.votesGiven.filter((vote) => vote.source === 'jury').map((vote) => [`${vote.voter}->${vote.recipient}`, vote]),
  );

  const reciprocals = countries
    .flatMap((a, index) =>
      countries.slice(index + 1).map((b) => {
        const aToB = rankByVoterRecipient.get(`${a}->${b}`)?.points ?? 0;
        const bToA = rankByVoterRecipient.get(`${b}->${a}`)?.points ?? 0;
        return { pair: `${a} <-> ${b}`, aToB, bToA, total: aToB + bToA, balance: Math.min(aToB, bToA) };
      }),
    )
    .filter((pair) => pair.total > 0)
    .toSorted((a, b) => b.total - a.total || b.balance - a.balance)
    .slice(0, 8);
  const runningOrder = {
    audienceCorr: pearson(enriched.map((entry) => [entry.runningOrder, entry.audience])),
    juryCorr: pearson(enriched.map((entry) => [entry.runningOrder, entry.jury])),
    firstHalfAudience: average(enriched.filter((entry) => entry.runningOrder <= 13).map((entry) => entry.audience)),
    secondHalfAudience: average(enriched.filter((entry) => entry.runningOrder > 13).map((entry) => entry.audience)),
  };
  const consensusWinner = enriched.toSorted((a, b) => a.audienceStats.average - b.audienceStats.average)[0];
  const finalists = enriched.map((entry) => entry.country);
  const audiencePointsRanks = new Map(rankOfScores(Object.fromEntries(enriched.map((entry) => [entry.country, entry.audience]))));
  const bordaScores = Object.fromEntries(
    finalists.map((country) => [
      country,
      data.audienceRankings.filter((row) => row.recipient === country).reduce((sum, row) => sum + (26 - row.rank), 0),
    ]),
  );
  const bordaRanks = new Map(rankOfScores(bordaScores));
  const pairwise = finalists
    .map((country) => {
      let wins = 0;
      let losses = 0;
      let ties = 0;
      let marginSum = 0;
      finalists
        .filter((opponent) => opponent !== country)
        .forEach((opponent) => {
          let countryVotes = 0;
          let opponentVotes = 0;
          publicVoters.forEach((voter) => {
            const countryRank = rankByVoterRecipient.get(`${voter}->${country}`)?.rank;
            const opponentRank = rankByVoterRecipient.get(`${voter}->${opponent}`)?.rank;
            if (!countryRank || !opponentRank) return;
            if (countryRank < opponentRank) countryVotes += 1;
            if (opponentRank < countryRank) opponentVotes += 1;
          });
          if (countryVotes > opponentVotes) wins += 1;
          else if (opponentVotes > countryVotes) losses += 1;
          else ties += 1;
          marginSum += countryVotes - opponentVotes;
        });
      return { country, wins, losses, ties, marginSum, borda: bordaScores[country], audiencePointsRank: audiencePointsRanks.get(country) ?? 0, bordaRank: bordaRanks.get(country) ?? 0 };
    })
    .toSorted((a, b) => b.wins - a.wins || b.marginSum - a.marginSum)
    .slice(0, 10);
  const concentration = enriched
    .map((entry) => {
      const awards = data.votesReceived
        .filter((vote) => vote.source === 'audience' && vote.recipient === entry.country)
        .map((vote) => vote.points)
        .toSorted((a, b) => b - a);
      const top3 = awards.slice(0, 3).reduce((sum, points) => sum + points, 0);
      return { country: entry.country, share: entry.audience ? top3 / entry.audience : 0, points: entry.audience };
    })
    .filter((entry) => entry.points > 0)
    .toSorted((a, b) => b.share - a.share)
    .slice(0, 8);
  const fragileMargins = enriched
    .toSorted((a, b) => a.rank - b.rank)
    .slice(0, -1)
    .map((entry, index, sorted) => {
      const next = sorted[index + 1] ?? enriched.find((candidate) => candidate.rank === entry.rank + 1);
      return next ? { places: `${entry.rank}/${next.rank}`, countries: `${entry.country} vs ${next.country}`, margin: entry.total - next.total } : null;
    })
    .filter((row): row is { places: string; countries: string; margin: number } => Boolean(row))
    .toSorted((a, b) => a.margin - b.margin)
    .slice(0, 8);
  const voterPairs = publicVoters
    .flatMap((a, index) =>
      publicVoters.slice(index + 1).map((b) => {
        const shared = finalists
          .map((recipient) => [
            rankByVoterRecipient.get(`${a}->${recipient}`)?.rank,
            rankByVoterRecipient.get(`${b}->${recipient}`)?.rank,
          ] as [number | undefined, number | undefined])
          .filter((pair): pair is [number, number] => pair[0] !== undefined && pair[1] !== undefined);
        const aTop = new Set(data.audienceRankings.filter((row) => row.voter === a && row.rank <= 10).map((row) => row.recipient));
        const bTop = new Set(data.audienceRankings.filter((row) => row.voter === b && row.rank <= 10).map((row) => row.recipient));
        return { pair: `${a} / ${b}`, correlation: pearson(shared), overlap: [...aTop].filter((country) => bTop.has(country)).length };
      }),
    )
    .filter((pair) => Number.isFinite(pair.correlation));
  const similarVoters = voterPairs.toSorted((a, b) => b.correlation - a.correlation).slice(0, 8);
  const differentVoters = voterPairs.toSorted((a, b) => a.correlation - b.correlation).slice(0, 6);
  const juryPublicSplit = [...new Set(data.votesGiven.filter((vote) => vote.source === 'jury').map((vote) => vote.voter))]
    .map((voter) => {
      const pairs = finalists
        .filter((recipient) => recipient !== voter)
        .map((recipient) => [
          pointForRank(rankByVoterRecipient.get(`${voter}->${recipient}`)?.rank ?? 99),
          juryVoteByVoterRecipient.get(`${voter}->${recipient}`)?.points ?? 0,
        ] as [number, number]);
      const public12 = data.audienceRankings.find((row) => row.voter === voter && row.rank === 1)?.recipient ?? '';
      const jury12 = data.votesGiven.find((vote) => vote.source === 'jury' && vote.voter === voter && vote.points === 12)?.recipient ?? '';
      const publicTop = new Set(data.audienceRankings.filter((row) => row.voter === voter && row.rank <= 10).map((row) => row.recipient));
      const juryTop = new Set(data.votesGiven.filter((vote) => vote.source === 'jury' && vote.voter === voter && vote.points > 0).map((vote) => vote.recipient));
      return { voter, correlation: pearson(pairs), public12, jury12, overlap: [...publicTop].filter((country) => juryTop.has(country)).length };
    })
    .toSorted((a, b) => a.correlation - b.correlation);

  return {
    zeroAudience,
    biggestPublicLift,
    hiddenAudience,
    biggestRankDeltas,
    polarising,
    heartbreak,
    affinity,
    reciprocals,
    runningOrder,
    consensusWinner,
    pairwise,
    concentration,
    fragileMargins,
    similarVoters,
    differentVoters,
    juryPublicSplit,
  };
};

const enriched = buildEnrichedEntries();
const analysis = buildAnalysis(enriched);

const inlineMarkdown = (text: string): ReactNode[] => {
  const nodes: ReactNode[] = [];
  const tokenPattern = /(\*\*[^*]+\*\*|\*[^*]+\*|https?:\/\/\S+)/g;
  let cursor = 0;

  for (const match of text.matchAll(tokenPattern)) {
    const token = match[0];
    const index = match.index ?? 0;
    if (index > cursor) nodes.push(text.slice(cursor, index));

    if (token.startsWith('**')) {
      nodes.push(<strong key={`${index}-strong`}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('*')) {
      nodes.push(<em key={`${index}-em`}>{token.slice(1, -1)}</em>);
    } else {
      const href = token.replace(/[.)]+$/, '');
      const suffix = token.slice(href.length);
      nodes.push(
        <Fragment key={`${index}-link`}>
          <a href={href} target="_blank" rel="noreferrer">
            {href}
          </a>
          {suffix}
        </Fragment>,
      );
    }

    cursor = index + token.length;
  }

  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes;
};

const parseArticleMarkdown = (markdown: string) => {
  const blocks: Array<{ type: 'heading' | 'paragraph' | 'quote' | 'rule'; text?: string; level?: number }> = [];
  const lines = markdown.trim().split(/\r?\n/);
  let paragraph: string[] = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    blocks.push({ type: 'paragraph', text: paragraph.join(' ') });
    paragraph = [];
  };

  lines.forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      return;
    }

    if (/^-{3,}$/.test(line)) {
      flushParagraph();
      blocks.push({ type: 'rule' });
      return;
    }

    const heading = /^(#{2,3})\s*(.+)$/.exec(line);
    if (heading) {
      flushParagraph();
      blocks.push({ type: 'heading', level: heading[1].length, text: heading[2] });
      return;
    }

    if (line.startsWith('>')) {
      flushParagraph();
      blocks.push({ type: 'quote', text: line.replace(/^>\s?/, '') });
      return;
    }

    paragraph.push(line);
  });

  flushParagraph();
  return blocks;
};

const articleBlocks = parseArticleMarkdown(articleMarkdown);

function ArticleView() {
  return (
    <article className="article-view">
      {articleBlocks.map((block, index) => {
        if (block.type === 'rule') return <hr key={index} />;
        if (block.type === 'quote') return <blockquote key={index}>{inlineMarkdown(block.text ?? '')}</blockquote>;
        if (block.type === 'heading') return <h2 key={index}>{inlineMarkdown(block.text ?? '')}</h2>;
        return <p key={index}>{inlineMarkdown(block.text ?? '')}</p>;
      })}
    </article>
  );
}

function App() {
  const [selectedCountry, setSelectedCountry] = useState('United Kingdom');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortState>({ key: 'rank', direction: 'asc' });
  const [scoreboardMode, setScoreboardMode] = useState<ScoreboardMode>('official');
  const [activeView, setActiveView] = useState<AppView>('article');

  const sortedEntries = useMemo(() => {
    const direction = sort.direction === 'asc' ? 1 : -1;
    const value = (entry: (typeof enriched)[number]) => {
      if (sort.key === 'avgRank') return entry.audienceStats.average;
      if (sort.key === 'volatility') return entry.audienceStats.volatility;
      return entry[sort.key];
    };
    return enriched
      .filter((entry) => `${entry.country} ${entry.artist} ${entry.song}`.toLowerCase().includes(query.toLowerCase()))
      .toSorted((a, b) => {
        const left = value(a);
        const right = value(b);
        if (typeof left === 'string' && typeof right === 'string') return left.localeCompare(right) * direction;
        return ((left as number) - (right as number) || a.rank - b.rank) * direction;
      });
  }, [query, sort]);

  const modeEntries = useMemo(() => {
    const value = (entry: (typeof enriched)[number]) => {
      if (scoreboardMode === 'official') return entry.total;
      if (scoreboardMode === 'jury') return entry.jury;
      if (scoreboardMode === 'audience') return entry.audience;
      return -entry.audienceStats.average;
    };
    return enriched.toSorted((a, b) => value(b) - value(a) || a.rank - b.rank).slice(0, 10);
  }, [scoreboardMode]);

  const selected = enriched.find((entry) => entry.country === selectedCountry) ?? enriched[0];
  const selectedRanks = selected.audienceStats.rows.toSorted((a, b) => a.rank - b.rank || a.voter.localeCompare(b.voter));
  const setTableSort = (key: SortKey) =>
    setSort((current) => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));

  const headerLabel = (label: string, key: SortKey) => `${label}${sort.key === key ? (sort.direction === 'asc' ? ' ^' : ' v') : ''}`;

  return (
    <main>
      <header className="app-header">
        <div>
          <p className="eyebrow">Vienna 2026 Grand Final</p>
          <h1>Eurovision scoring explorer</h1>
        </div>
        <a href={data.sourceUrl} target="_blank" rel="noreferrer" className="source-link">
          <ExternalLink size={18} />
          Official source
        </a>
      </header>

      <section className="stat-grid">
        <article>
          <span>{data.scoreboard.length}</span>
          <p>finalists</p>
        </article>
        <article>
          <span>{data.audienceRankings.length}</span>
          <p>audience rankings captured</p>
        </article>
        <article>
          <span>{analysis.zeroAudience.length}</span>
          <p>countries with 0 audience points</p>
        </article>
        <article>
          <span>{new Date(data.fetchedAt).toLocaleDateString()}</span>
          <p>data fetched</p>
        </article>
      </section>

      <nav className="analysis-nav" aria-label="Analysis views">
        {[
          ['article', 'Article'],
          ['scoreboard', 'Scoreboard'],
          ['counterfactuals', 'Counterfactuals'],
          ['public', 'Public patterns'],
          ['networks', 'Networks'],
          ['voters', 'Voters'],
          ['definitions', 'Definitions'],
        ].map(([view, label]) => (
          <button key={view} className={activeView === view ? 'active' : ''} onClick={() => setActiveView(view as AppView)}>
            {label}
          </button>
        ))}
      </nav>

      {activeView === 'article' && <ArticleView />}

      {activeView !== 'article' && activeView !== 'definitions' && (
        <section className="two-column">
          <div className={activeView === 'scoreboard' ? 'view-stack' : 'view-stack compact'}>
            {activeView === 'scoreboard' && (
              <div className="panel">
                <div className="panel-heading">
                  <h2>Scoreboard</h2>
                  <label className="search">
                    <Search size={16} />
                    <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter entries" />
                  </label>
                </div>
                <div className="table scoreboard-table">
                  <div className="table-head table-row-shape">
                    <button onClick={() => setTableSort('rank')}>{headerLabel('#', 'rank')}</button>
                    <button onClick={() => setTableSort('country')}>{headerLabel('Country', 'country')}</button>
                    <button onClick={() => setTableSort('total')}>{headerLabel('Total', 'total')}</button>
                    <button onClick={() => setTableSort('jury')}>{headerLabel('Jury', 'jury')}</button>
                    <button onClick={() => setTableSort('audience')}>{headerLabel('Audience', 'audience')}</button>
                    <button onClick={() => setTableSort('avgRank')}>{headerLabel('Avg rank', 'avgRank')}</button>
                    <button onClick={() => setTableSort('audienceRankDelta')}>{headerLabel('Rank diff', 'audienceRankDelta')}</button>
                    <button onClick={() => setTableSort('publicJuryPointGap')}>{headerLabel('P/J gap', 'publicJuryPointGap')}</button>
                    <button onClick={() => setTableSort('juryPublicRankGap')}>{headerLabel('Rank gap', 'juryPublicRankGap')}</button>
                  </div>
                  {sortedEntries.map((entry) => (
                    <button
                      key={entry.country}
                      className={entry.country === selected.country ? 'table-row table-row-shape selected' : 'table-row table-row-shape'}
                      onClick={() => setSelectedCountry(entry.country)}
                    >
                      <span>{entry.rank}</span>
                      <span>
                        {entry.rank === 1 && <Crown size={15} />}
                        <strong>{entry.country}</strong>
                        <small>
                          {entry.artist} - {entry.song}
                        </small>
                      </span>
                      <span>{entry.total}</span>
                      <span>{entry.jury}</span>
                      <span>{entry.audience}</span>
                      <span>{entry.audienceStats.average.toFixed(1)}</span>
                      <span>{entry.audienceRankDelta > 0 ? '+' : ''}{entry.audienceRankDelta}</span>
                      <span>{entry.publicJuryPointGap > 0 ? '+' : ''}{entry.publicJuryPointGap}</span>
                      <span>{entry.juryPublicRankGap > 0 ? '+' : ''}{entry.juryPublicRankGap}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeView === 'counterfactuals' && (
              <>
                <section className="insights three-up view-section">
                  <div className="panel">
                    <h2>Counterfactual scoreboard</h2>
                    <div className="mode-tabs" role="tablist" aria-label="Scoreboard mode">
                      {[
                        ['official', 'Official'],
                        ['jury', 'Jury'],
                        ['audience', 'Audience'],
                        ['averageRank', 'Avg rank'],
                      ].map(([mode, label]) => (
                        <button
                          key={mode}
                          className={scoreboardMode === mode ? 'active' : ''}
                          onClick={() => setScoreboardMode(mode as ScoreboardMode)}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    <div className="mini-table">
                      {modeEntries.map((entry, index) => (
                        <button key={entry.country} onClick={() => setSelectedCountry(entry.country)}>
                          <span>{index + 1}</span>
                          <strong>{entry.country}</strong>
                          <em>
                            {scoreboardMode === 'averageRank' ? `${entry.audienceStats.average.toFixed(1)} avg` : `${scoreboardMode === 'official' ? entry.total : scoreboardMode === 'jury' ? entry.jury : entry.audience} pts`}
                          </em>
                          <small>{entry.rank === index + 1 ? 'same' : `${entry.rank - (index + 1) > 0 ? '+' : ''}${entry.rank - (index + 1)} vs official`}</small>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="panel callout">
                    <h2>Consensus winner</h2>
                    <p>
                      {analysis.consensusWinner.country} did not just win the scoreboard. It was the public's broad-consensus winner, with an average public
                      rank of {analysis.consensusWinner.audienceStats.average.toFixed(1)}, {analysis.consensusWinner.audienceStats.twelves} first places, and top-10
                      coverage in {analysis.consensusWinner.audienceStats.top10s} public rankings.
                    </p>
                  </div>

                  <div className="panel callout">
                    <h2>Zero-point explainer</h2>
                    <p>
                      Zero public points means no voting entity placed the entry in its public top 10. It does not mean every country ranked it last:
                      the UK averaged {enriched.find((entry) => entry.country === 'United Kingdom')?.audienceStats.average.toFixed(1)} and Germany
                      averaged {enriched.find((entry) => entry.country === 'Germany')?.audienceStats.average.toFixed(1)}.
                    </p>
                  </div>
                </section>

                <section className="insights view-section">
                  <div className="panel">
                    <h2>Fragile margins</h2>
                    <p className="panel-note">Closest official rank boundaries. These are the places most vulnerable to a small scoring change.</p>
                    {analysis.fragileMargins.map((row) => (
                      <div className="compact-row static relation-row" key={row.places}>
                        <span>{row.places} {row.countries}</span>
                        <strong>{row.margin} pts</strong>
                        <em>gap</em>
                      </div>
                    ))}
                  </div>

                  <div className="panel callout">
                    <h2>Robust winner, fragile podium</h2>
                    <p>
                      Leave-one-voter-out analysis found Bulgaria survives every voter removal. The sharp edge is below it: removing Italy, Moldova,
                      Ukraine, or Luxembourg flips Romania and Australia for third place.
                    </p>
                  </div>
                </section>
              </>
            )}

            {activeView === 'public' && (
              <>
                <section className="insights three-up view-section">
                  <div className="panel">
                    <h2>Public social-choice ranking</h2>
                    <p className="panel-note">Pairwise majority and Borda use full public rankings, not only top-10 point awards.</p>
                    <div className="social-choice-list">
                      {analysis.pairwise.map((entry, index) => (
                        <button key={entry.country} onClick={() => setSelectedCountry(entry.country)}>
                          <span>{index + 1}</span>
                          <strong>{entry.country}</strong>
                          <em>{entry.wins}-{entry.losses}-{entry.ties}</em>
                          <small>Borda {entry.borda}</small>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="panel">
                    <h2>Avg-rank vs points rank</h2>
                    {analysis.biggestRankDeltas.map((entry) => (
                      <button
                        key={entry.country}
                        className="compact-row wide"
                        title={`Points-only audience ranking ${entry.pointAudiencePlace}, average audience ranking ${entry.averageAudiencePlace} (${entry.audienceStats.average.toFixed(1)} average rank)`}
                        onClick={() => setSelectedCountry(entry.country)}
                      >
                        <span>{entry.country}</span>
                        <strong>{entry.audienceRankDelta > 0 ? '+' : ''}{entry.audienceRankDelta} places</strong>
                        <em>{entry.audienceStats.average.toFixed(1)} avg</em>
                      </button>
                    ))}
                  </div>

                  <div className="panel">
                    <h2>11th-place heartbreak</h2>
                    {analysis.heartbreak.map((entry) => (
                      <button
                        key={entry.country}
                        className="compact-row wide"
                        title={`${entry.country} was ranked 11th by ${entry.audienceStats.elevenths} public voters`}
                        onClick={() => setSelectedCountry(entry.country)}
                      >
                        <span>{entry.country}</span>
                        <strong>{entry.audienceStats.elevenths} x 11th</strong>
                        <em>{entry.audience} pts</em>
                      </button>
                    ))}
                  </div>

                  <div className="panel">
                    <h2>Polarising audience profiles</h2>
                    {analysis.polarising.map((entry) => (
                      <button key={entry.country} className="compact-row wide" onClick={() => setSelectedCountry(entry.country)}>
                        <span>{entry.country}</span>
                        <strong>{entry.audienceStats.volatility.toFixed(1)} stdev</strong>
                        <em>{entry.audienceStats.best}-{entry.audienceStats.worst}</em>
                      </button>
                    ))}
                  </div>
                </section>

                <section className="insights view-section">
                  <div className="panel">
                    <h2>Consensus vs polarisation</h2>
                    <div className="scatter-wrap">
                      <svg viewBox="0 0 420 240" role="img" aria-label="Average public rank versus rank volatility">
                        <rect className="quadrant passionate-split" x="42" y="18" width="178" height="92" />
                        <rect className="quadrant broad-consensus" x="42" y="110" width="178" height="92" />
                        <rect className="quadrant divisive-low-support" x="220" y="18" width="178" height="92" />
                        <rect className="quadrant broad-low-support" x="220" y="110" width="178" height="92" />
                        <line className="quadrant-line" x1="220" y1="18" x2="220" y2="202" />
                        <line className="quadrant-line" x1="42" y1="110" x2="398" y2="110" />
                        <text className="quadrant-label" x="50" y="34">Strong but divisive</text>
                        <text className="quadrant-label" x="50" y="126">Broad consensus</text>
                        <text className="quadrant-label" x="228" y="34">Patchy niche support</text>
                        <text className="quadrant-label" x="228" y="126">Broad low support</text>
                        <line x1="42" y1="202" x2="398" y2="202" />
                        <line x1="42" y1="18" x2="42" y2="202" />
                        <text x="210" y="230">Average public rank</text>
                        <text x="7" y="110" transform="rotate(-90 7 110)">Rank volatility</text>
                        {enriched.map((entry) => {
                          const x = 42 + ((entry.audienceStats.average - 1) / 24) * 356;
                          const y = 202 - (entry.audienceStats.volatility / 9) * 184;
                          const r = 4 + (entry.audience / 312) * 10;
                          return (
                            <circle
                              key={entry.country}
                              cx={x}
                              cy={y}
                              r={r}
                              className={entry.country === selected.country ? 'selected-dot' : ''}
                              onClick={() => setSelectedCountry(entry.country)}
                            >
                              <title>{`${entry.country}: ${entry.audienceStats.average.toFixed(1)} avg rank, ${entry.audienceStats.volatility.toFixed(1)} volatility, ${entry.audience} public pts`}</title>
                            </circle>
                          );
                        })}
                      </svg>
                    </div>
                  </div>

                  <div className="panel">
                    <h2>Support concentration</h2>
                    <p className="panel-note">Share of public score supplied by the top three supporting voters. High shares are fragile for low scorers.</p>
                    <div className="concentration-list">
                      {analysis.concentration.map((entry) => (
                        <button key={entry.country} onClick={() => setSelectedCountry(entry.country)}>
                          <span>{entry.country}</span>
                          <div>
                            <i style={{ width: `${entry.share * 100}%` }} />
                          </div>
                          <strong>{Math.round(entry.share * 100)}%</strong>
                          <em>{entry.points} pts</em>
                        </button>
                      ))}
                    </div>
                  </div>
                </section>

                <section className="insights view-section">
                  <div className="panel">
                    <h2>Best 0-point audience profiles</h2>
                    {analysis.hiddenAudience.map((entry) => (
                      <button key={entry.country} className="compact-row" onClick={() => setSelectedCountry(entry.country)}>
                        <span>{entry.country}</span>
                        <strong>{entry.audienceStats.average.toFixed(1)} avg rank</strong>
                        <em>{entry.audienceStats.best}-{entry.audienceStats.worst}</em>
                      </button>
                    ))}
                  </div>
                </section>
              </>
            )}

            {activeView === 'networks' && (
              <>
                <section className="insights three-up view-section">
                  <div className="panel relationship-panel">
                    <h2>Data-driven relationship lifts</h2>
                    <p className="panel-note">
                      External country metadata turns broad bloc talk into testable pair features. Lifts are average points above each feature's baseline.
                    </p>
                    <div className="relationship-cards">
                      {relationshipLiftCards.map((card) => (
                        <div key={card.feature} title={`${card.rows} directed voter-recipient rows`}>
                          <span>{card.feature}</span>
                          <strong>+{card.audienceLift.toFixed(2)}</strong>
                          <em>public lift</em>
                          <small>jury +{card.juryLift.toFixed(2)}</small>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="panel">
                    <h2>Global-reach public vote</h2>
                    <p className="panel-note">
                      Public points from over 1500km away with no land border or shared official language, excluding Rest of the World.
                    </p>
                    <div className="reach-list">
                      {globalReachLeaders.map((entry) => (
                        <button key={entry.country} onClick={() => setSelectedCountry(entry.country)}>
                          <span>{entry.country}</span>
                          <div>
                            <i style={{ width: `${entry.share * 100}%` }} />
                          </div>
                          <strong>{Math.round(entry.share * 100)}%</strong>
                          <em>{entry.points}/{entry.comparable}</em>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="panel">
                    <h2>Affinity lift</h2>
                    <p className="panel-note">
                      Curated Eurovision-neighbour model retained as an overlay, not the main evidence.
                    </p>
                    <div className="affinity-grid">
                      <div title={`${analysis.affinity.audience.pairCount} audience voter-recipient pairs in the model`}>
                        <span>Audience</span>
                        <strong>+{analysis.affinity.audience.lift.toFixed(2)}</strong>
                        <em>{analysis.affinity.audience.affinityAverage.toFixed(2)} vs {analysis.affinity.audience.baselineAverage.toFixed(2)} pts</em>
                      </div>
                      <div title={`${analysis.affinity.jury.pairCount} jury voter-recipient pairs in the model`}>
                        <span>Jury</span>
                        <strong>+{analysis.affinity.jury.lift.toFixed(2)}</strong>
                        <em>{analysis.affinity.jury.affinityAverage.toFixed(2)} vs {analysis.affinity.jury.baselineAverage.toFixed(2)} pts</em>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="insights view-section">
                  <div className="panel">
                    <h2>Border length myth check</h2>
                    <p className="panel-note">
                      Shared borders predict extra public points; longer shared borders do not strongly predict more points.
                    </p>
                    <div className="border-scatter">
                      <svg viewBox="0 0 430 240" role="img" aria-label="Border length versus reciprocal public points">
                        <line x1="44" y1="202" x2="402" y2="202" />
                        <line x1="44" y1="22" x2="44" y2="202" />
                        <text x="184" y="230">Estimated shared border km</text>
                        <text x="8" y="122" transform="rotate(-90 8 122)">Reciprocal public points</text>
                        {borderPairs.map((pair) => {
                          const x = 44 + (Math.log(pair.km + 1) / Math.log(1600)) * 358;
                          const y = 202 - (pair.publicPoints / 24) * 180;
                          return (
                            <circle key={pair.pair} cx={x} cy={y} r={pair.publicPoints >= 18 ? 7 : 5}>
                              <title>{`${pair.pair}: ${pair.km}km, public ${pair.publicPoints}, jury ${pair.juryPoints}`}</title>
                            </circle>
                          );
                        })}
                      </svg>
                    </div>
                    <div className="border-examples">
                      {borderPairs.slice(0, 6).map((pair) => (
                        <div key={pair.pair}>
                          <span>{pair.pair}</span>
                          <strong>{pair.publicPoints}</strong>
                          <em>{pair.km}km</em>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="panel">
                    <h2>Language and cultural-presence signal</h2>
                    <p className="panel-note">
                      Broader Factbook language/identity mentions catch relationships official-language overlap misses.
                    </p>
                    <div className="signal-summary">
                      <div>
                        <span>Directed mention</span>
                        <strong>+1.31</strong>
                        <em>public lift</em>
                      </div>
                      <div>
                        <span>Mutual mention</span>
                        <strong>+2.31</strong>
                        <em>public lift</em>
                      </div>
                    </div>
                    {languageIdentityRows.map((row) => (
                      <div className="compact-row static relation-row" key={row.direction} title={`Matched terms: ${row.terms}; reverse terms: ${row.reverse}`}>
                        <span>{row.direction}</span>
                        <strong>{row.publicPoints} public</strong>
                        <em>{row.juryPoints} jury</em>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="insights view-section">
                  <div className="panel">
                    <h2>Relationship bucket averages</h2>
                    <p className="panel-note">
                      Exclusive public-vote buckets separate regional, language-linked, near-neighbour, and global patterns.
                    </p>
                    <div className="bucket-bars">
                      {bucketAverages.map((bucket) => (
                        <div key={bucket.bucket}>
                          <span>{bucket.bucket}</span>
                          <div>
                            <i style={{ width: `${(bucket.points / 4.85) * 100}%` }} />
                          </div>
                          <strong>{bucket.points.toFixed(2)}</strong>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="panel">
                    <h2>Reciprocal public pairs</h2>
                    {analysis.reciprocals.map((pair) => (
                      <div className="compact-row static" key={pair.pair} title={`${pair.pair}: ${pair.aToB} + ${pair.bToA}`}>
                        <span>{pair.pair}</span>
                        <strong>{pair.aToB} + {pair.bToA}</strong>
                        <em>{pair.total}</em>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="insights view-section">
                  <div className="panel">
                    <h2>Public vs jury split</h2>
                    {analysis.biggestPublicLift.map((entry) => (
                      <div className="bar-row" key={entry.country}>
                        <span>{entry.country}</span>
                        <div>
                          <i style={{ width: `${Math.max(4, (entry.audience / 312) * 100)}%` }} />
                        </div>
                        <strong>+{scoreGap(entry)}</strong>
                      </div>
                    ))}
                  </div>

                  <div className="panel">
                    <h2>Running-order myth check</h2>
                    <div className="myth-grid">
                      <div>
                        <span>{analysis.runningOrder.audienceCorr.toFixed(3)}</span>
                        <p>running order vs audience correlation</p>
                      </div>
                      <div>
                        <span>{analysis.runningOrder.juryCorr.toFixed(3)}</span>
                        <p>running order vs jury correlation</p>
                      </div>
                      <div>
                        <span>{analysis.runningOrder.firstHalfAudience.toFixed(1)}</span>
                        <p>first-half avg audience points</p>
                      </div>
                      <div>
                        <span>{analysis.runningOrder.secondHalfAudience.toFixed(1)}</span>
                        <p>second-half avg audience points</p>
                      </div>
                    </div>
                    <p className="panel-note">A weak single-final correlation check only; useful as a prompt, not causal evidence.</p>
                  </div>
                </section>
              </>
            )}

            {activeView === 'voters' && (
              <>
                <section className="insights three-up view-section">
                  <div className="panel">
                    <h2>Most similar public tastes</h2>
                    {analysis.similarVoters.map((pair) => (
                      <div className="compact-row static voter-row" key={pair.pair}>
                        <span>{pair.pair}</span>
                        <strong>{pair.correlation.toFixed(2)}</strong>
                        <em>{pair.overlap}/10 overlap</em>
                      </div>
                    ))}
                  </div>

                  <div className="panel">
                    <h2>Most distinctive public tastes</h2>
                    {analysis.differentVoters.map((pair) => (
                      <div className="compact-row static voter-row" key={pair.pair}>
                        <span>{pair.pair}</span>
                        <strong>{pair.correlation.toFixed(2)}</strong>
                        <em>{pair.overlap}/10 overlap</em>
                      </div>
                    ))}
                  </div>

                  <div className="panel callout">
                    <h2>Taste map, not bloc map</h2>
                    <p>
                      Public rank correlation compares full public rankings between voters. It surfaces expected pairs like Moldova/Romania, but also
                      less obvious taste neighbours such as Belgium/Italy or Czechia/Georgia.
                    </p>
                  </div>
                </section>

                <section className="insights view-section">
                  <div className="panel">
                    <h2>Jury/public split voters</h2>
                    <p className="panel-note">Lowest correlations mean the national jury and public were effectively watching different contests.</p>
                    <div className="split-table">
                      {analysis.juryPublicSplit.slice(0, 10).map((row) => (
                        <div key={row.voter}>
                          <span>{row.voter}</span>
                          <strong>{row.correlation.toFixed(2)}</strong>
                          <em>{row.public12} / {row.jury12}</em>
                          <small>{row.overlap}/10 overlap</small>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="panel">
                    <h2>Aligned jury/public voters</h2>
                    <div className="split-table">
                      {analysis.juryPublicSplit.toReversed().slice(0, 8).map((row) => (
                        <div key={row.voter}>
                          <span>{row.voter}</span>
                          <strong>{row.correlation.toFixed(2)}</strong>
                          <em>{row.public12} / {row.jury12}</em>
                          <small>{row.overlap}/10 overlap</small>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                <section className="insights view-section">
                  <div className="panel callout">
                    <h2>Alignment vs network direction</h2>
                    <p>
                      Low jury/public alignment is not globally explained by juries being more or less relationship-driven. The correlations between
                      alignment and relationship-share deltas are essentially flat, so the stronger story is voter-specific.
                    </p>
                    <div className="correlation-chips">
                      {alignmentNetworkCorrelations.map((row) => (
                        <div key={row.metric} title="Correlation with jury/public alignment">
                          <span>{row.metric}</span>
                          <strong>{row.correlation.toFixed(3)}</strong>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="panel">
                    <h2>Split case studies</h2>
                    {alignmentNetworkCases.map((row) => (
                      <div className="network-case" key={row.voter}>
                        <div>
                          <strong>{row.voter}</strong>
                          <span>{row.story}</span>
                        </div>
                        <em>{Math.round(row.publicShare * 100)}% public to {Math.round(row.juryShare * 100)}% jury linked</em>
                        <small>12s: {row.public12} / {row.jury12}</small>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}
          </div>

          <aside className="panel insight-panel">
          <h2>{selected.country}</h2>
          <p className="subtitle">
            {selected.artist} - {selected.song}
          </p>
          <div className="detail-metrics">
            <div>
              <span>{selected.total}</span>
              <p>total points</p>
            </div>
            <div>
              <span>{selected.audienceStats.average.toFixed(1)}</span>
              <p>average audience rank</p>
            </div>
            <div>
              <span>{selected.audienceStats.top10s}</span>
              <p>audience top 10s</p>
            </div>
            <div>
              <span>{selected.audienceStats.twelves}</span>
              <p>public first places</p>
            </div>
            <div>
              <span>{selected.audienceStats.elevenths}</span>
              <p>11th-place audience ranks</p>
            </div>
            <div>
              <span>{selected.audienceStats.volatility.toFixed(1)}</span>
              <p>rank volatility</p>
            </div>
            <div>
              <span>{selected.audienceRankDelta > 0 ? '+' : ''}{selected.audienceRankDelta}</span>
              <p>points place vs avg-rank place</p>
            </div>
            <div>
              <span>{selected.juryPublicRankGap > 0 ? '+' : ''}{selected.juryPublicRankGap}</span>
              <p>jury rank minus public rank</p>
            </div>
          </div>
          <div className="rank-strip" aria-label={`${selected.country} audience rank distribution`}>
            {pointValues.slice(0, -1).map((points) => {
              const count = selected.audienceStats.rows.filter((row) => row.points === points).length;
              return (
                <div key={points}>
                  <span>{points}</span>
                  <i style={{ height: `${Math.max(4, count * 8)}px` }} />
                  <em>{count}</em>
                </div>
              );
            })}
          </div>
          <div className="rank-list">
            {selectedRanks.map((row) => (
              <div key={`${row.voter}-${row.recipient}`} className={row.inScoringTop10 ? 'rank-row scoring' : 'rank-row'}>
                <span>{row.rank}</span>
                <strong>{row.voter}</strong>
                <em>{row.points} pts</em>
              </div>
            ))}
          </div>
        </aside>
      </section>
      )}

      {activeView === 'definitions' && (
      <section className="panel definitions">
        <h2>Metric definitions</h2>
        <dl>
          <div>
            <dt>Avg rank</dt>
            <dd>Average full public ranking position. Lower is better, and includes non-scoring ranks outside the top 10.</dd>
          </div>
          <div>
            <dt>Rank diff</dt>
            <dd>Audience points-only place minus average-rank place. Positive means the points table underrates broad support.</dd>
          </div>
          <div>
            <dt>P/J gap</dt>
            <dd>Audience points minus jury points. Positive is public lift; negative is jury lift.</dd>
          </div>
          <div>
            <dt>Rank volatility</dt>
            <dd>Standard deviation of public ranks. Low means broad agreement; high means voters disagreed strongly.</dd>
          </div>
        </dl>
      </section>
      )}
    </main>
  );
}

export default App;
