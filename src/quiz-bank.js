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

  // Module 6 — Closing Techniques
  6: [
    {
      qtype: 'mc',
      text: 'Which two closing techniques are described as the most effective for unit trust?',
      options: [
        'Fire-sale close and empathy close',
        'Assumptive close and alternative-choice close',
        'Calendar close and diagram close',
        '1-2-3 close and customer-care close',
      ],
      correct: 1,
    },
    {
      qtype: 'mc',
      text: 'Why should you avoid asking a yes/no question like "Do you want to start investing now?"',
      options: [
        'It sounds too formal',
        'It takes too long for the client to answer',
        'It gives the client an easy chance to say "I want to consider first"',
        'It is not allowed by the compliance rules',
      ],
      correct: 2,
    },
    {
      qtype: 'mc',
      text: 'Which of these is a good alternative-choice closing question?',
      options: [
        '"Do you want to invest or not?"',
        '"Would you prefer letter statements or e-statements?"',
        '"Should I come back next month?"',
        '"Do you need more time to think?"',
      ],
      correct: 1,
    },
    {
      qtype: 'mc',
      text: 'You have just asked the client a closing question. What should you do next?',
      options: [
        'Keep talking so the silence doesn\'t feel awkward',
        'Remind them they can take time to consider',
        'Stay calm and silent, and wait for the client to answer',
        'Move on to the next slide',
      ],
      correct: 2,
    },
    {
      qtype: 'mc',
      text: 'Which of these is a buying signal from a client?',
      options: [
        '"What do I need to open the account?"',
        'Checking the time and looking around the room',
        '"Can you send me the slides to read later?"',
        'Changing the subject to something unrelated',
      ],
      correct: 0,
    },
    {
      qtype: 'tf',
      text: 'If a client shows a strong buying signal halfway through your presentation, you should finish presenting all your slides before moving to the close.',
      options: TF,
      correct: 1,
    },
    {
      qtype: 'tf',
      text: 'Good salespeople are born that way — closing is not a skill that can be learned through practice.',
      options: TF,
      correct: 1,
    },
    {
      qtype: 'mc',
      text: 'What does "begin with the end in mind" mean before a client meeting?',
      options: [
        'Plan to end the meeting early',
        'Visualise the client agreeing, choosing the funds and signing the forms, then lead the conversation towards that outcome',
        'Start the meeting by showing the closing slide',
        'Decide in advance that the client probably won\'t buy',
      ],
      correct: 1,
    },
  ],

  // Module 5 — Basic Portfolio Management
  5: [
    {
      qtype: 'mc',
      text: 'Asset allocation means spreading an investment across different asset classes (such as stocks, bonds and cash) based on what?',
      options: [
        'Whichever fund performed best last year',
        'The investor\'s goals, risk tolerance and time horizon',
        'The fund with the lowest sales charge',
        'An equal split across every fund available',
      ],
      correct: 1,
    },
    {
      qtype: 'mc',
      text: 'In asset allocation, what does "return optimisation" mainly mean for an adviser?',
      options: [
        'Always choosing the highest-risk funds to maximise return',
        'Managing the client\'s expectations — giving them what they want, not what the adviser wants',
        'Switching funds every month to chase the top performer',
        'Promising the client a fixed return',
      ],
      correct: 1,
    },
    {
      qtype: 'mc',
      text: 'You are planning a 10-year education fund for a client\'s child. What is the recommended approach?',
      options: [
        'Keep it all in money market for the full 10 years',
        'Stay fully in equities right up to the day the money is needed',
        'Go mainly into equities in the early years, then switch to bonds or lower-risk funds around years 8–9 to protect the capital',
        'Put it all in a single country-specific fund',
      ],
      correct: 2,
    },
    {
      qtype: 'mc',
      text: 'A client will need the money in only 1 to 2 years. Which funds are suitable?',
      options: [
        'Country-specific funds',
        'Small-to-mid cap funds',
        'Money market or bond funds',
        'Sectoral or thematic funds',
      ],
      correct: 2,
    },
    {
      qtype: 'mc',
      text: 'Why are big-cap funds generally less volatile?',
      options: [
        'Big companies are well established and stable, and focus on paying dividends',
        'Big-cap funds invest mostly in fixed deposits',
        'Big-cap funds are guaranteed by the government',
        'Big companies grow faster than small companies',
      ],
      correct: 0,
    },
    {
      qtype: 'mc',
      text: 'What makes a "flexi" fund different?',
      options: [
        'It can only invest in small companies',
        'The fund manager is free to decide how much goes into equities and how much into bonds',
        'It invests only in one country',
        'Investors can withdraw without any charges',
      ],
      correct: 1,
    },
    {
      qtype: 'mc',
      text: 'A new client has RM10,000 to invest from EPF. Following the agency\'s guideline, how many funds should you start with?',
      options: ['1 fund', '2 funds', '4 funds', '6 funds'],
      correct: 1,
    },
    {
      qtype: 'tf',
      text: 'For a low-risk client investing from EPF, putting the money into a money market or bond fund is recommended.',
      options: TF,
      correct: 1,
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
