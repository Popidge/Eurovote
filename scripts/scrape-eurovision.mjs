import { writeFile, mkdir } from 'node:fs/promises';
import * as cheerio from 'cheerio';

const SOURCE_URL =
  'https://www.eurovision.com/eurovision-song-contest/vienna-2026/vienna-2026-grand-final/';
const OUT_FILE = new URL('../src/data/vienna-2026-grand-final.json', import.meta.url);

const pointForRank = (rank) => [12, 10, 8, 7, 6, 5, 4, 3, 2, 1][rank - 1] ?? 0;

const clean = (value) => value.replace(/\s+/g, ' ').trim();
const slug = (value) =>
  clean(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const numberFrom = (value) => {
  const match = clean(value).match(/-?\d+/);
  return match ? Number(match[0]) : 0;
};

const countriesIn = ($, node) =>
  $(node)
    .find('[data-country-name]')
    .map((_, country) => clean($(country).text()))
    .get();

const parseAccordionRows = ($, accordion) =>
  $(accordion)
    .find('.voting-data-row-entry')
    .map((_, row) => {
      const points = numberFrom($(row).find('.voting-board-pill--darkbg').first().text());
      return countriesIn($, row).map((country) => ({ country, points }));
    })
    .get()
    .flat();

const parseScoreboard = ($) =>
  $('.data-row-entry[aria-label^="Scoreboard entry for"]')
    .map((_, entry) => {
      const label = $(entry).attr('aria-label') ?? '';
      const country = label.replace('Scoreboard entry for', '').trim();
      const rank = numberFrom($(entry).find('.scoreboard-rank').first().text());
      const text = clean($(entry).text());
      const total = numberFrom(text.match(/(\d+) points/)?.[1] ?? '0');
      const jury = numberFrom(text.match(/Jury\s+(\d+)/)?.[1] ?? '0');
      const audience = numberFrom(text.match(/Audience\s+(\d+)/)?.[1] ?? '0');
      const runningOrder = numberFrom(text.match(/Running Order\s+(\d+)/)?.[1] ?? '0');
      const songLink = $(entry).find('a[href*="youtu"]').first();
      const artist = clean(songLink.prevAll('div').first().find('p').first().text());
      const song = clean(songLink.text());
      return { id: slug(country), country, rank, artist, song, total, jury, audience, runningOrder };
    })
    .get()
    .filter((entry) => entry.country);

const parseDetailedAudienceRankings = ($, finalists) =>
  $('.voting-results-section.mt-4 .voting-details')
    .map((_, panel) => {
      const voter = clean($(panel).find('h3').first().clone().children().remove().end().text()).replace(
        /\s+breakdown$/i,
        '',
      );
      if (!voter) return [];

      return $(panel)
        .find('.detailed-voting-results-entry')
        .map((__, entry) => {
          const recipient = clean($(entry).find('[data-country-name]').first().text());
          const audienceRankResult = $(entry)
            .find('.data-row-entry-result-wrapper')
            .filter((___, result) => clean($(result).find('.data-row-entry-result-label').first().text()) === 'Audience Rank')
            .first();
          const rank = numberFrom(audienceRankResult.text());

          if (!recipient || !finalists.has(recipient) || !rank) return undefined;

          const points = pointForRank(rank);
          return {
            voter,
            recipient,
            rank,
            points,
            inScoringTop10: points > 0,
          };
        })
        .get()
        .filter(Boolean);
    })
    .get()
    .flat();

const parseDetails = ($, audienceRankByPair) => {
  const finalists = new Set(parseScoreboard($).map((entry) => entry.country));
  const votesGiven = [];
  const votesReceived = [];

  $('.country-details').each((_, panel) => {
    const country = clean($(panel).find('h2').first().text());
    if (!country) return;

    $(panel)
      .find('.accordion--voting-results')
      .each((__, accordion) => {
        const label = clean($(accordion).find('.accordion-label').first().text()).toLowerCase();
        const rows = parseAccordionRows($, accordion);

        if (label === 'by the audience' || label === 'by the juries') {
          const source = label.includes('audience') ? 'audience' : 'jury';
          rows.forEach((row, index) => {
            votesGiven.push({
              voter: country,
              recipient: row.country,
              source,
              points: row.points,
              rank: source === 'audience' ? audienceRankByPair.get(`${country}->${row.country}`) : undefined,
            });
          });
        }

        if (label === 'from the audience' || label === 'from the juries') {
          const source = label.includes('audience') ? 'audience' : 'jury';
          rows.forEach((row) => {
            votesReceived.push({
              recipient: country,
              voter: row.country,
              source,
              points: row.points,
            });
          });
        }
      });
  });

  return { votesGiven, votesReceived };
};

const response = await fetch(SOURCE_URL);
if (!response.ok) {
  throw new Error(`Failed to fetch ${SOURCE_URL}: ${response.status} ${response.statusText}`);
}

const html = await response.text();
const $ = cheerio.load(html);
const scoreboard = parseScoreboard($);
const finalists = new Set(scoreboard.map((entry) => entry.country));
const audienceRankings = parseDetailedAudienceRankings($, finalists);
const audienceRankByPair = new Map(audienceRankings.map((row) => [`${row.voter}->${row.recipient}`, row.rank]));
const { votesGiven, votesReceived } = parseDetails($, audienceRankByPair);

const data = {
  sourceUrl: SOURCE_URL,
  fetchedAt: new Date().toISOString(),
  event: 'Eurovision Song Contest 2026',
  show: 'Grand Final',
  scoreboard,
  votesGiven,
  votesReceived,
  audienceRankings,
};

await mkdir(new URL('../src/data/', import.meta.url), { recursive: true });
await writeFile(OUT_FILE, `${JSON.stringify(data, null, 2)}\n`);

console.log(
  `Wrote ${scoreboard.length} finalists, ${votesGiven.length} given rows, ${audienceRankings.length} audience ranking rows to ${OUT_FILE.pathname}`,
);
