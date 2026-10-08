// Quiz questions drafted from each module's video, keyed by module number (videos.position).
// On startup, a module that has no questions yet gets these loaded as a DRAFT quiz;
// an admin still has to press "Approve" in Videos & quizzes before it goes live.
// Modules that already have questions (added or edited in the admin screen) are never touched.
//
// qtype: 'mc' (multiple choice) or 'tf' (true/false). correct = index into options (0-based).

const TF = ['True', 'False'];

module.exports = {
  // Module 3 — Effective Presentation to Close EPF Sales
  3: [
    {
      qtype: 'mc',
      text: 'Which EPF account can a member withdraw from to invest in unit trust under the EPF Members Investment Scheme?',
      options: [
        'Account 1 (Akaun Persaraan)',
        'Account 2 (Akaun Sejahtera)',
        'Account 3 (Akaun Fleksibel)',
        'Any of the three accounts',
      ],
      correct: 0,
    },
    {
      qtype: 'mc',
      text: 'Why do we describe EPF money as "sleeping money"?',
      options: [
        'Because members cannot see their balance until retirement',
        'Because EPF follows a prudent policy — only around 40% is in equities and most of the rest is in low-risk fixed income',
        'Because EPF pays no dividend in some years',
        'Because the money is mostly invested overseas',
      ],
      correct: 1,
    },
    {
      qtype: 'mc',
      text: 'A client aged 41 has RM123,000 in Account 1. The basic savings required at age 41 is RM93,000, and a member may invest 30% of the amount above basic savings. How much can the client invest?',
      options: ['RM30,000', 'RM36,900', 'RM9,000', 'RM27,900'],
      correct: 2,
    },
    {
      qtype: 'tf',
      text: 'A client can withdraw from EPF to invest in unit trust as often as they like.',
      options: TF,
      correct: 1,
    },
    {
      qtype: 'mc',
      text: 'What are the two main criteria EPF uses to decide whether a fund is an EPF-approved fund?',
      options: [
        'Fund size and fund age',
        'Consistency of performance, and performance relative to its benchmark',
        'Lowest management fee and lowest sales charge',
        'Number of investors and number of agents selling it',
      ],
      correct: 1,
    },
    {
      qtype: 'mc',
      text: 'A prospect says, "I don\'t want to touch my EPF money." What is the recommended way to respond?',
      options: [
        'Tell them they are wrong and EPF returns are poor',
        'Drop EPF and only offer cash investment',
        'Agree to disagree — agree EPF shouldn\'t be used for other things, then show how investing it grows their retirement fund, which is what EPF is for',
        'Suggest they withdraw from the flexible account instead',
      ],
      correct: 2,
    },
    {
      qtype: 'tf',
      text: 'Investing through the EPF scheme usually costs the client a lower sales charge than investing with cash.',
      options: TF,
      correct: 0,
    },
    {
      qtype: 'mc',
      text: 'For a first-time EPF investment client, which of these is NOT part of the submission?',
      options: [
        'Account opening form (with PDPA consent and suitability assessment)',
        'Thumbprint form',
        'Two copies of IC (front and back on one A4 page), one certified',
        'Latest 3 months\' payslips',
      ],
      correct: 3,
    },
  ],

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
