// Quiz questions drafted from each module's video, keyed by module number (videos.position).
// On startup, a module that has no questions yet gets these loaded as a DRAFT quiz;
// an admin still has to press "Approve" in Videos & quizzes before it goes live.
// Modules that already have questions (added or edited in the admin screen) are never touched.
//
// qtype: 'mc' (multiple choice) or 'tf' (true/false). correct = index into options (0-based).

const TF = ['True', 'False'];

module.exports = {
  // Module 1 — Introduction to Jumpstart and My Market Prospecting List
  1: [
    {
      qtype: 'mc',
      text: 'What is the main objective of Buffalo Jumpstart?',
      options: [
        'To pass the licensing exam',
        'To give you the essential skills and materials to go out and close your first case',
        'To learn how to trade stocks',
        'To recruit new advisers into your team',
      ],
      correct: 1,
    },
    {
      qtype: 'mc',
      text: 'Advisers fall into three types. Which group is the agency\'s training mainly designed to help?',
      options: [
        'The 10% self-starters who figure it out on their own',
        'The group who will not succeed no matter what',
        'The 70% who can do as well as the top 10% with training and guidance',
        'Only advisers with an investment background',
      ],
      correct: 2,
    },
    {
      qtype: 'mc',
      text: 'Who should be the very first unit trust account you open?',
      options: ['Your parents', 'Your closest friend', 'Yourself', 'A retiree'],
      correct: 2,
    },
    {
      qtype: 'mc',
      text: 'A prospect already invests with another unit trust company. What is the recommended approach?',
      options: [
        'Point out that the other company performs badly',
        'Never criticise the competitor — suggest diversifying some money into Manulife funds they can\'t get elsewhere',
        'Tell them to redeem everything and switch over immediately',
        'Give up on the prospect',
      ],
      correct: 1,
    },
    {
      qtype: 'mc',
      text: 'The "local tour guide in Brazil" analogy explains which Manulife advantage?',
      options: [
        'Lower sales charges',
        'Overseas funds managed by Manulife\'s own teams based in those countries, who know the local market best',
        'A wider range of local Malaysian funds',
        'Free overseas trips for advisers',
      ],
      correct: 1,
    },
    {
      qtype: 'mc',
      text: 'What is your prospecting assignment in the first week?',
      options: [
        'List 10 names',
        'List 50 names',
        'List 100 names on the prospecting list',
        'Call 20 strangers',
      ],
      correct: 2,
    },
    {
      qtype: 'mc',
      text: 'When you are new, which prospects should you approach first, and why?',
      options: [
        'Your cold list (strangers), because they have no bias',
        'Your warm list (people who know you), because they are more forgiving while you are still learning',
        'Only wealthy business owners',
        'Retirees only, because they have the most money',
      ],
      correct: 1,
    },
    {
      qtype: 'mc',
      text: 'At a wedding dinner or social gathering, what is the right "above the line" approach?',
      options: [
        'Try to close everyone at the table',
        'Simply let people know what you do, and follow up later only with those who show interest',
        'Avoid mentioning your business at all',
        'Hand out application forms',
      ],
      correct: 1,
    },
  ],

  // Module 2 — What is Unit Trust & What-if Analysis Presentation
  2: [
    {
      qtype: 'mc',
      text: 'Before presenting to a new prospect, what is the first question you should ask?',
      options: [
        '"How much money do you have?"',
        '"Are you doing any form of investment at the moment?"',
        '"Which fund do you want to buy?"',
        '"Can I have your IC?"',
      ],
      correct: 1,
    },
    {
      qtype: 'mc',
      text: 'In the simplest terms, how does a unit trust work?',
      options: [
        'The bank lends your money to other customers',
        'Many investors pool their money, and professional fund managers invest it for them',
        'You buy shares directly on the stock exchange yourself',
        'The government guarantees a fixed return',
      ],
      correct: 1,
    },
    {
      qtype: 'mc',
      text: 'What is the role of the trustee in a unit trust?',
      options: [
        'To sell the fund to investors',
        'To pick the shares the fund buys',
        'To hold investors\' money safely and supervise that the fund manager invests according to the fund\'s objectives',
        'To set the sales charge',
      ],
      correct: 2,
    },
    {
      qtype: 'tf',
      text: 'If the fund management company goes bankrupt, investors lose their money because it is held by the fund manager.',
      options: TF,
      correct: 1,
    },
    {
      qtype: 'mc',
      text: 'What is the adviser\'s role in the unit trust picture?',
      options: [
        'To manage the fund\'s daily share trading',
        'To act as the trustee',
        'To sit between the investor and the funds, choosing the right funds for the investor',
        'To audit the fund house',
      ],
      correct: 2,
    },
    {
      qtype: 'mc',
      text: 'Which of these is NOT a benefit of unit trust?',
      options: [
        'Professional management',
        'Diversification across many shares with small capital',
        'A guaranteed return',
        'High liquidity — you can sell any time',
      ],
      correct: 2,
    },
    {
      qtype: 'mc',
      text: 'What are the three ways a client can invest in unit trust?',
      options: [
        'Cash, EPF, and PRS',
        'Cash, credit card, and personal loan',
        'EPF, SOCSO, and insurance',
        'Shares, bonds, and gold',
      ],
      correct: 0,
    },
    {
      qtype: 'mc',
      text: 'When preparing a What-if Analysis, how should you choose the initial investment amount?',
      options: [
        'Always use RM100,000',
        'Always use RM1,000',
        'Match it to the prospect\'s background — e.g. around RM5,000–10,000 for a fresh graduate, more for someone in their 40s',
        'Use the largest amount the system allows',
      ],
      correct: 2,
    },
  ],

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
    {
      qtype: 'mc',
      text: 'In which year did EPF introduce the Members Investment Scheme?',
      options: ['1986', '1996', '2006', '2016'],
      correct: 1,
    },
    {
      qtype: 'mc',
      text: 'Under the restructured EPF accounts, what share of each monthly contribution goes into Account 1 (Akaun Persaraan)?',
      options: ['50%', '60%', '75%', '90%'],
      correct: 2,
    },
  ],

  // Module 8 — Proven Game Plan for Success
  8: [
    {
      qtype: 'mc',
      text: 'What are the three categories of business in the game plan?',
      options: [
        'EPF scheme, cash investment, and regular savings plan',
        'Insurance, property, and stocks',
        'Fixed deposits, bonds, and gold',
        'Recruitment, training, and events',
      ],
      correct: 0,
    },
    {
      qtype: 'mc',
      text: 'Why is EPF business described as "repeat" sales?',
      options: [
        'The client must reinvest every month by law',
        'Once a client starts, they can top up again from EPF every quarter',
        'EPF automatically doubles the investment each year',
        'The adviser earns the same commission twice on each sale',
      ],
      correct: 1,
    },
    {
      qtype: 'mc',
      text: 'Comparing the same amount of sales, which generally pays the adviser a higher commission rate?',
      options: [
        'EPF investment',
        'Cash investment',
        'Both pay exactly the same',
        'Neither — commission is a fixed monthly amount',
      ],
      correct: 1,
    },
    {
      qtype: 'mc',
      text: 'What is the recommended balance between EPF and cash business?',
      options: [
        'Only EPF — never cash',
        'Only cash — never EPF',
        'Roughly half and half, or around 60% cash and 40% EPF',
        '90% regular savings and 10% everything else',
      ],
      correct: 2,
    },
    {
      qtype: 'tf',
      text: 'At Manulife, once you meet the minimum sales for the next level, your promotion and higher commission rate come automatically — no need to apply or get a boss\'s approval.',
      options: TF,
      correct: 0,
    },
    {
      qtype: 'mc',
      text: 'What is the regular savings plan (RSP) game plan described in the module?',
      options: [
        'Close one RM5,000 lump sum a week for 6 months',
        'Close one case a day with RM500 monthly savings, for 24 months',
        'Close one RM100 case a month for 10 years',
        'Convert all EPF clients into RSP',
      ],
      correct: 1,
    },
    {
      qtype: 'mc',
      text: 'On which dates each month are regular savings plan auto-deductions made?',
      options: ['1st and 15th', '5th and 20th', '10th and 28th', 'Last working day only'],
      correct: 2,
    },
    {
      qtype: 'mc',
      text: 'Why should you monitor your regular savings plan clients\' deductions?',
      options: [
        'To check the fund price every day',
        'Many clients use a separate account for the deduction and may forget to transfer money into it',
        'Because the deduction amount changes every month',
        'Because the company does not record the deductions',
      ],
      correct: 1,
    },
    {
      qtype: 'mc',
      text: 'How can a long-serving adviser earn more commission with similar or even lower sales than in earlier years?',
      options: [
        'Commission rates are doubled after 10 years',
        'Career benefits and group overriding build up as passive income',
        'Senior advisers charge clients higher fees',
        'They only sell cash investment',
      ],
      correct: 1,
    },
    {
      qtype: 'tf',
      text: 'To succeed in this business you need to be an extrovert with a sales background.',
      options: TF,
      correct: 1,
    },
  ],

  // Module 7 — Crisis Proof Your Clients
  7: [
    {
      qtype: 'mc',
      text: 'Which of these is NOT a reason for crisis-proofing your clients?',
      options: [
        'Helping clients stay calm during a crisis',
        'Avoiding panic redemptions at the wrong time',
        'Guaranteeing that the client\'s investment will never fall in value',
        'Getting clients to top up and stay invested with you for life',
      ],
      correct: 2,
    },
    {
      qtype: 'mc',
      text: 'Driven by the emotional cycle of investing, what do many investors end up doing?',
      options: [
        'Buying low and selling high',
        'Buying high and selling low',
        'Investing a fixed amount every month',
        'Never selling at all',
      ],
      correct: 1,
    },
    {
      qtype: 'mc',
      text: 'What are the three criteria of a good investment decision?',
      options: [
        'Clear mind, good discipline, and emotional distance',
        'High return, low risk, and short holding period',
        'Lowest fees, biggest fund, and newest fund',
        'Good timing, insider tips, and quick switching',
      ],
      correct: 0,
    },
    {
      qtype: 'mc',
      text: 'Before you can help clients manage their emotions during a crisis, what must you do first?',
      options: [
        'Memorise every fund\'s daily price',
        'Manage your own emotions',
        'Get approval from the fund house',
        'Switch all clients into money market',
      ],
      correct: 1,
    },
    {
      qtype: 'mc',
      text: 'What is the "magic paper"?',
      options: [
        'The fund\'s prospectus',
        'A printed What-if Analysis that you can circle, highlight and draw on while presenting',
        'The client\'s EPF statement',
        'The account opening form',
      ],
      correct: 1,
    },
    {
      qtype: 'mc',
      text: 'In the first year, the What-if Analysis may show the investment value below the FD line. What mainly causes this, and how should you describe it?',
      options: [
        'The fund is performing badly — suggest switching',
        'The sales charge — explain openly that this is normal',
        'A calculation error — ignore that part of the chart',
        'Market manipulation — warn the client',
      ],
      correct: 1,
    },
    {
      qtype: 'mc',
      text: 'During a market crisis, what are the only two things a client should do?',
      options: [
        'Sell everything, or switch to FD',
        'Top up if they have extra money, or stay invested and do nothing',
        'Stop the monthly investment, or redeem half',
        'Wait for the news, or move to another fund house',
      ],
      correct: 1,
    },
    {
      qtype: 'mc',
      text: 'In the "child struggling at school" analogy, what does sending the child for tuition represent?',
      options: [
        'Redeeming the investment',
        'Switching to a different fund house',
        'Topping up the investment',
        'Stopping the monthly saving plan',
      ],
      correct: 2,
    },
    {
      qtype: 'mc',
      text: 'Why do you ask the client, "Do you want me to inform you when there\'s a great opportunity?"',
      options: [
        'So you have their permission to text them to top up later, without presenting all over again',
        'So you can add them to a marketing mailing list',
        'Because it is a compliance requirement',
        'To find out whether they have other advisers',
      ],
      correct: 0,
    },
    {
      qtype: 'tf',
      text: 'Successful investing is about time in the market, not timing the market.',
      options: TF,
      correct: 0,
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
    {
      qtype: 'mc',
      text: 'At a first EPF presentation, what outcome should you aim to leave with — even if the client hasn\'t decided how much to invest?',
      options: [
        'A promise to call them next month',
        'The EPF documents signed, so you can check how much they are eligible to invest',
        'Their bank account number',
        'Nothing — the first meeting is only for education',
      ],
      correct: 1,
    },
    {
      qtype: 'mc',
      text: 'After the client has answered your alternative-choice question, what is a simple final step to move into the close?',
      options: [
        'Ask "Are you sure you want to go ahead?"',
        'Ask "Can I have your IC?" and get the forms ready',
        'Give them the brochure to take home',
        'Start the presentation again from the beginning',
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
    {
      qtype: 'mc',
      text: 'Where does a Greater China fund invest?',
      options: [
        'China only',
        'China, Hong Kong and Taiwan',
        'China, Japan and Korea',
        'All of Asia including Japan',
      ],
      correct: 1,
    },
    {
      qtype: 'mc',
      text: 'On the agency\'s fund chart, unit trust risk levels run from 1 to 5. What does level 5 mean?',
      options: [
        'The lowest risk, like money market',
        'A medium-risk balanced fund',
        'The highest risk',
        'The fund is not EPF-approved',
      ],
      correct: 2,
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
    {
      qtype: 'mc',
      text: 'How does the right way to invest in unit trust differ from trading the stock market?',
      options: [
        'Stock market: buy and wait. Unit trust: wait and buy',
        'Stock market: wait and buy. Unit trust: buy and wait',
        'Both should be bought and sold quickly for small gains',
        'Both should only be bought when the market is at its lowest',
      ],
      correct: 1,
    },
    {
      qtype: 'mc',
      text: 'Besides reinvested distributions, what is the second "secret" that helps unit trust returns keep stacking up over the long term?',
      options: [
        'The fund keeps the same shares forever',
        'The fund manager keeps switching into the most promising shares as the market changes',
        'The fund house guarantees a minimum return each year',
        'The investor switches funds every few months',
      ],
      correct: 1,
    },
  ],
};
