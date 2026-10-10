/* Original, rotating daily affirmations. All visitors follow the Oman calendar. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else {
    root.MehanniAffirmations = api;
    const list = document.getElementById('affirmation-list');
    const dateLabel = document.getElementById('affirmation-date');
    if (!list || !dateLabel) return;
    let displayedDay;
    function refresh() {
      const daily = api.forDate(new Date());
      if (displayedDay === daily.key) return;
      daily.affirmations.forEach(item => {
        const quote = document.getElementById('affirmation-' + item.theme);
        if (quote) quote.textContent = item.text;
      });
      dateLabel.textContent = daily.label;
      dateLabel.dateTime = daily.key;
      displayedDay = daily.key;
    }
    refresh();
    setInterval(refresh, 30000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
    window.addEventListener('pageshow', refresh);
    window.addEventListener('focus', refresh);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const timeZone = 'Asia/Muscat';
  const dateParts = new Intl.DateTimeFormat('en-GB', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' });
  const dateLabel = new Intl.DateTimeFormat('en-GB', { timeZone, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const themes = {
    confidence: [
      'I can begin before I feel completely ready.',
      'My voice matters, and I can share my ideas.',
      'I have something valuable to offer today.',
      'I can take one brave step at a time.',
      'I am allowed to be a beginner.',
      'I can face a challenge with patience and courage.',
      'My effort deserves recognition, including my own.',
      'I can ask questions without having all the answers.',
      'I bring my own strengths to every new experience.',
      'I can try again with a little more understanding.',
      'I do not need to be perfect to make a difference.',
      'I can make room for new possibilities.',
      'I am proud of the steps I have already taken.',
      'I can speak with kindness and confidence.',
      'I can choose a small action that moves me forward.',
      'My ideas are worth exploring.',
      'I can be nervous and still be brave.',
      'I trust myself to learn what I do not know yet.',
      'I can celebrate my progress without comparing it.',
      'I am more than one difficult moment.',
      'I can make thoughtful choices for my day.',
      'I have the courage to ask for support.',
      'I can welcome an opportunity at my own pace.',
      'I bring curiosity, creativity and care to my work.',
      'I can give myself another chance.',
      'I can stand by my values and listen to others.',
      'I am building confidence through practice.',
      'I can start with what I have and grow from there.',
      'My quiet achievements count, too.',
      'I can meet today with an open mind.'
    ],
    learning: [
      'Every question gives me a new place to begin.',
      'Small steps can lead to meaningful progress.',
      'I can learn from a mistake and keep moving.',
      'A little practice today helps me grow.',
      'I give myself time to understand new ideas.',
      'I can stay curious when something feels difficult.',
      'I can find a different way when one approach does not work.',
      'I can improve through patient, purposeful practice.',
      'I can learn something useful from the people around me.',
      'My learning journey has room for pauses and fresh starts.',
      'I can notice one thing I understand better today.',
      'I can turn a big task into manageable steps.',
      'I can listen, reflect and try something new.',
      'I can enjoy discovering how things work.',
      'I can learn at my own pace and still move forward.',
      'What I do not know yet is an invitation to explore.',
      'I can use feedback to strengthen my next attempt.',
      'I can practise a new skill without expecting instant results.',
      'I can make space for learning in an ordinary day.',
      'I can build on what I already understand.',
      'I can share what I know and learn from what others share.',
      'I can be proud of thoughtful effort, not only results.',
      'A fresh perspective can help me see a new solution.',
      'I can take a break and return with renewed attention.',
      'I can make progress even when it feels gradual.',
      'I can connect a new idea to something familiar.',
      'I can learn by trying, noticing and adjusting.',
      'I can make today a day of discovery.',
      'I can keep growing through curiosity and practice.',
      'I never have to stop learning.'
    ],
    kindness: [
      'I can offer myself the patience I offer a friend.',
      'A kind word can make someone’s day a little brighter.',
      'I can listen with care and respond thoughtfully.',
      'I can make room for rest as well as effort.',
      'I can notice and appreciate a small good thing today.',
      'I can encourage someone without judging their journey.',
      'I deserve respect, and I can show respect to others.',
      'I can be gentle with myself on a difficult day.',
      'I can celebrate someone else’s success with an open heart.',
      'I can choose words that help people feel welcome.',
      'I can pause, breathe and begin again.',
      'I can care for others while respecting my own needs.',
      'I can thank someone who has helped me learn.',
      'I can bring a little warmth to my classroom or home.',
      'I can recognise the effort behind another person’s progress.',
      'I can make kindness part of a small everyday action.',
      'I can disagree respectfully and remain curious.',
      'I can leave space for feelings without judging them.',
      'I can welcome help and offer it when I am able.',
      'I can appreciate today without needing it to be perfect.',
      'I can be patient with a process that takes time.',
      'I can help create a place where people feel included.',
      'I can choose encouragement over harsh self-talk.',
      'I can notice the people who make my day better.',
      'I can give my attention to one meaningful moment.',
      'I can care about my goals and my well-being together.',
      'I can make room for a little joy today.',
      'I can honour my own path and respect another person’s.',
      'I can offer understanding even when experiences differ.',
      'I can end the day with gratitude for one small thing.'
    ]
  };
  function forDate(date) {
    const parts = Object.fromEntries(dateParts.formatToParts(date).filter(p => p.type !== 'literal').map(p => [p.type, p.value]));
    const key = parts.year + '-' + parts.month + '-' + parts.day;
    const day = Math.floor(Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day)) / 86400000);
    const affirmations = Object.entries(themes).map(([theme, choices], index) => {
      const selection = ((day + index * 7) % choices.length + choices.length) % choices.length;
      return { theme, text: choices[selection] };
    });
    return { key, label: dateLabel.format(date), affirmations };
  }
  return { forDate, timeZone };
});
