'use strict';
// Bindendes Titelformat der Reading Tests: "Reading-Test X · Task N: Typ · Thema".
const READING_TITLE = /^Reading-Test ([A-Z]) · Task (\d): (.+) · .+$/;

function parseReadingTitle(title) {
  const m = title.match(READING_TITLE);
  return m && { letter: m[1], task: Number(m[2]), type: m[3] };
}

module.exports = { READING_TITLE, parseReadingTitle };
