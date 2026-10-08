// Quiz questions drafted from each module's video, keyed by module number (videos.position).
// On startup, a module that has no questions yet gets these loaded as a DRAFT quiz;
// an admin still has to press "Approve" in Videos & quizzes before it goes live.
// Modules that already have questions (added or edited in the admin screen) are never touched.
//
// qtype: 'mc' (multiple choice) or 'tf' (true/false). correct = index into options (0-based).

const TF = ['True', 'False'];

module.exports = {
  // Module 4 — 3 Simple Rules
  4: [
    {
      qtype: 'mc',
      text: 'Rule number 1 of the 3 Simple Rules says to stay invested for long. How long is "long"?',
      options: ['At least 6 months', 'At least 1 to 2 years', '5 years or more', 'Until the fund is up 20%'],
      correct: 2,
    },
    {
      qtype: 'mc',
      text: 'Which of these is NOT one of the 3 Simple Rules?',
      options: [
        'Stay invested for long',
        'Time the market — sell after a quick gain, then buy again',
        'Invest regularly',
        'Always focus on your goal',
      ],
      correct: 1,
    },
    {
      qtype: 'tf',
      text: 'As long as a client stays invested for 5 years, the unit trust return is guaranteed.',
      options: TF,
      correct: 1,
    },
    {
      qtype: 'mc',
      text: 'What long-term average return guideline do we share with investors for unit trust?',
      options: [
        'About 8–10% a year on average, not guaranteed',
        'A guaranteed 8% every single year',
        'Around 3–4% a year, similar to a fixed deposit',
        'At least 20% a year',
      ],
      correct: 0,
    },
    {
      qtype: 'mc',
      text: 'When a fund declares a distribution, what happens to it by default?',
      options: [
        'It is paid out in cash to the investor',
        'It is kept by the fund house as a fee',
        'It is reinvested to buy more units for the investor at the current price',
        'It is used to lower the fund\'s sales charge',
      ],
      correct: 2,
    },
    {
      qtype: 'mc',
      text: 'With dollar cost averaging (investing a fixed amount regularly), what happens when the unit price drops?',
      options: [
        'The same amount buys more units, bringing the average cost down',
        'The same amount buys fewer units',
        'The investor should stop investing until the market recovers',
        'Nothing changes, because the number of units is fixed',
      ],
      correct: 0,
    },
    {
      qtype: 'tf',
      text: 'For a client doing regular investment, a drop in the unit price is good news because they collect cheaper units and break even faster.',
      options: TF,
      correct: 0,
    },
    {
      qtype: 'mc',
      text: 'In the "flying to Taiwan" analogy for Rule 3 (focus on your goal), what does the turbulence during the flight stand for?',
      options: [
        'The fees charged by the fund',
        'The market\'s ups and downs along the way',
        'Choosing the wrong fund',
        'The fixed deposit option',
      ],
      correct: 1,
    },
  ],
};
