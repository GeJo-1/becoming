/* ==========================================================================
   BECOMING — MULTI-PAGE APPLICATION (MPA) ENGINE (script.js)
   Works across: index.html, week.html, journey.html, journal.html,
   pause.html, thoughts.html, and settings.html
   ========================================================================== */

window.Becoming = window.Becoming || {};

(function (app) {
  'use strict';

  /* ------------------------------------------------------------------------
     1. STORAGE KEYS, DEFAULT PREFERENCES & PAGE MAP
     ------------------------------------------------------------------------ */
  const STORAGE_KEYS = {
    PREFS: 'becoming_v1_prefs',
    COMPLETIONS: 'becoming_v1_completions',
    JOURNAL: 'becoming_v1_journal',
    THOUGHTS: 'becoming_v1_thoughts',
    PAUSES: 'becoming_v1_pauses',
    WEEKLY_REFLECTIONS: 'becoming_v1_weekly_reflections'
  };

  const PAGE_FILES = {
    today: 'index.html',
    week: 'week.html',
    journey: 'journey.html',
    journal: 'journal.html',
    pause: 'pause.html',
    thoughts: 'thoughts.html',
    settings: 'settings.html'
  };

  const DEFAULT_PREFS = {
    version: 1,
    theme: 'dark', // 'dark' | 'light' | 'system'
    reducedMotion: false,
    startSection: 'today',
    defaultDuration: 'any', // 'any' | 'short' | 'medium' | 'long'
    preferredCategories: [],
    hiddenActivities: [],
    swappedActivities: {} // { "YYYY-MM-DD": { slotIndex: "replacementActivityId" } }
  };

  const GROUNDED_GREETINGS = [
    'Make room for yourself.',
    'Welcome back to your space.',
    "There's no perfect way to begin.",
    'A little more room to be yourself.',
    'You are allowed to begin again.',
    'Growth without the pressure.'
  ];

  const JOURNAL_PROMPTS = [
    "What's been on your mind?",
    'What do you wish you could express without worrying about being judged?',
    'What are you finding difficult to accept?',
    'What would you say to someone you care about who felt this way?',
    'What do you need more of right now?',
    'What is something you want to understand about yourself?'
  ];

  const WEEKLY_CHECKIN_PROMPTS = [
    'What is one small way you treated yourself with patience recently?',
    'When did you feel most comfortable being yourself this week?',
    'What is something you handled better than you gave yourself credit for?',
    'Is there an expectation you have been carrying that you are allowed to set down?',
    'What helped you feel grounded or supported over the past few days?'
  ];

  const PAUSE_MODE_DESCRIPTIONS = {
    silence: 'Sit quietly with a simple timer and no required breathing pattern. Leave whenever you are ready.',
    breathing: 'Follow the softly expanding underwater sphere at an unhurried pace. Stop or leave at any time.',
    open: 'A timer-free space for rest, prayer, reflection, or simply doing nothing.'
  };

  /* ------------------------------------------------------------------------
     2. SAFE DOM HELPER UTILITIES
     ------------------------------------------------------------------------ */
  function byId(id) {
    return document.getElementById(id);
  }

  function on(id, eventName, handler) {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener(eventName, handler);
    }
  }

  function setText(id, text) {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = text;
    }
  }

  function getCurrentPage() {
    if (document.body && document.body.dataset && document.body.dataset.page) {
      return document.body.dataset.page;
    }
    return 'today';
  }

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /* ------------------------------------------------------------------------
     3. CUSTOM SVG ICON LIBRARY (ZERO EMOJIS)
     ------------------------------------------------------------------------ */
  const CATEGORY_ICONS = {
    'Self-awareness': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/></svg>',
    'Self-respect': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l2.9 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l7.1-1.01L12 2z"/></svg>',
    'Body care': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>',
    'Self-acceptance': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>',
    'Personal direction': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>',
    'Self-trust': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>',
    'Emotional awareness': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12c2-4 5-6 10-6s8 2 10 6c-2 4-5 6-10 6s-8-2-10-6Z"/><circle cx="12" cy="12" r="2.5"/></svg>',
    'Curiosity': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>',
    'Rest': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>',
    'Self-care': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M7 20h10"/><path d="M10 20c5.5-2.5.8-6.4 3-10"/><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z"/><path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z"/></svg>',
    'Physical wellbeing': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>',
    'Self-compassion': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>',
    'Presence': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12c3-5 6-5 9 0s6 5 9 0"/><path d="M3 17c3-5 6-5 9 0s6 5 9 0" opacity="0.5"/></svg>',
    'Connection': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    'Courage': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z"/></svg>',
    'Creativity': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>'
  };

/* ------------------------------------------------------------------------
     4. THE COMPLETE 7-DAY, 35-ACTIVITY CANONICAL SCHEDULE
     ------------------------------------------------------------------------ */
  const WEEKLY_PLAN = [
    {
      dayIndex: 1,
      dayName: 'Monday',
      shortName: 'Mon',
      theme: 'Reconnect with yourself',
      themeDescription: 'Theme: Getting to know yourself',
      activities: [
        {
          id: 'mon-1',
          weekday: 'Monday',
          title: 'Sit in Silence Without Your Phone',
          duration: '5 minutes',
          durationBucket: 'short',
          defaultTimerSeconds: 300,
          category: 'Self-awareness',
          purpose: 'Start the week by giving your mind a quiet moment away from screens and notifications.',
          instructions: 'Sit in silence for 5 minutes without your phone.',
          smallerVersion: 'Set your phone aside and sit quietly for 1 minute.',
          reflectionPrompt: 'What did you notice when you sat with yourself without your phone?'
        },
        {
          id: 'mon-2',
          weekday: 'Monday',
          title: '3 Things You Like About Your Character',
          duration: '3–5 minutes',
          durationBucket: 'short',
          defaultTimerSeconds: 240,
          category: 'Self-respect',
          purpose: 'Recognize the real qualities, values, and character traits you already carry.',
          instructions: 'Write down 3 things you genuinely like about your personality, values, or character.',
          smallerVersion: 'Write down or name 1 thing you genuinely appreciate about your character.',
          reflectionPrompt: 'Which of these three qualities do you want to remember most this week?'
        },
        {
          id: 'mon-3',
          weekday: 'Monday',
          title: '10–15 Push-Ups or Comfortable Movement',
          duration: '3–5 minutes',
          durationBucket: 'short',
          defaultTimerSeconds: 180,
          category: 'Body care',
          purpose: 'Wake up your body with manageable strength and care at your own level.',
          instructions: 'Do 10–15 push-ups, using knee push-ups if needed, or another comfortable movement.',
          smallerVersion: 'Do 5 comfortable push-ups (wall or knee push-ups count) or stretch your arms and chest.',
          reflectionPrompt: 'How did your body feel after moving?'
        },
        {
          id: 'mon-4',
          weekday: 'Monday',
          title: '2 Minutes in the Mirror Without Flaw-Searching',
          duration: '2 minutes',
          durationBucket: 'short',
          defaultTimerSeconds: 120,
          category: 'Self-acceptance',
          purpose: 'Practise seeing yourself as a whole person rather than a list of things to fix.',
          instructions: 'Spend 2 minutes looking in the mirror without searching for flaws.',
          smallerVersion: 'Look at yourself in the mirror for 30 seconds with a neutral, kind expression.',
          reflectionPrompt: 'What was it like to look at yourself without immediately critiquing your appearance?'
        },
        {
          id: 'mon-5',
          weekday: 'Monday',
          title: 'One Thing to Get Better At This Week',
          duration: '3 minutes',
          durationBucket: 'short',
          defaultTimerSeconds: 180,
          category: 'Personal direction',
          purpose: 'Choose a single realistic focus for the week ahead without overwhelming yourself.',
          instructions: 'Write down one thing you want to get better at this week.',
          smallerVersion: 'Choose one word or skill you want to practise gently this week.',
          reflectionPrompt: 'What is one small way you can practise this during the week?'
        }
      ]
    },
    {
      dayIndex: 2,
      dayName: 'Tuesday',
      shortName: 'Tue',
      theme: 'Build self-trust',
      themeDescription: 'Theme: Keeping promises to yourself',
      activities: [
        {
          id: 'tue-1',
          weekday: 'Tuesday',
          title: '15–20 Minute Walk & Notice Your Surroundings',
          duration: '15–20 minutes',
          durationBucket: 'long',
          defaultTimerSeconds: 900,
          category: 'Body care',
          purpose: 'Step outside, clear your head, and pay attention to the world around you.',
          instructions: 'Take a 15–20 minute walk and notice your surroundings.',
          smallerVersion: 'Take a 5-minute walk or step outside and notice three details around you.',
          reflectionPrompt: 'What caught your attention while you were walking?'
        },
        {
          id: 'tue-2',
          weekday: 'Tuesday',
          title: '10 Minutes on a Postponed Task',
          duration: '10 minutes',
          durationBucket: 'medium',
          defaultTimerSeconds: 600,
          category: 'Self-trust',
          purpose: 'Build self-trust by showing yourself that you can begin without needing perfection.',
          instructions: "Complete one task you've been putting off for 10 minutes.",
          smallerVersion: 'Spend 2 minutes doing the very first step of the task.',
          reflectionPrompt: 'How did it feel to finally make a dent in this task?'
        },
        {
          id: 'tue-3',
          weekday: 'Tuesday',
          title: '30-Second Voice Note Without Self-Criticism',
          duration: '2 minutes',
          durationBucket: 'short',
          defaultTimerSeconds: 30,
          category: 'Emotional awareness',
          purpose: 'Allow your natural voice and thoughts to exist without nitpicking how you sound.',
          instructions: 'Record a 30-second voice note about your day without repeatedly replaying it to criticise your voice.',
          smallerVersion: 'Record a 10-second voice note or speak one honest sentence out loud.',
          reflectionPrompt: 'What did you talk about, and how did it feel to let it stand without over-analysing it?',
          specialWorkspace: 'voice'
        },
        {
          id: 'tue-4',
          weekday: 'Tuesday',
          title: 'Learn Something New for 10 Minutes',
          duration: '10 minutes',
          durationBucket: 'medium',
          defaultTimerSeconds: 600,
          category: 'Curiosity',
          purpose: 'Feed your mind with a topic, skill, or idea that genuinely interests you.',
          instructions: 'Learn something new for 10 minutes.',
          smallerVersion: 'Spend 2 minutes reading or watching one short explanation of something new.',
          reflectionPrompt: 'What new idea or fact did you learn today?'
        },
        {
          id: 'tue-5',
          weekday: 'Tuesday',
          title: 'One Promise You Kept to Yourself Today',
          duration: '3 minutes',
          durationBucket: 'short',
          defaultTimerSeconds: 180,
          category: 'Self-trust',
          purpose: 'Prove to yourself that your word to yourself matters, even in small moments.',
          instructions: 'Write down one promise you kept to yourself today, however small.',
          smallerVersion: 'Name one small thing you followed through on today.',
          reflectionPrompt: 'What promise did you keep to yourself today?'
        }
      ]
    },
    {
      dayIndex: 3,
      dayName: 'Wednesday',
      shortName: 'Wed',
      theme: 'Care for your body',
      themeDescription: 'Theme: Respect, not punishment',
      activities: [
        {
          id: 'wed-1',
          weekday: 'Wednesday',
          title: '2 Sets of 8–12 Comfortable Push-Ups',
          duration: '5 minutes',
          durationBucket: 'short',
          defaultTimerSeconds: 300,
          category: 'Body care',
          purpose: 'Build physical strength from a place of respect rather than punishment.',
          instructions: 'Do 2 sets of 8–12 push-ups, choosing a variation that feels comfortable.',
          smallerVersion: 'Do 1 set of 5–8 comfortable push-ups at your own pace.',
          reflectionPrompt: 'Which variation felt most supportive for your body today?'
        },
        {
          id: 'wed-2',
          weekday: 'Wednesday',
          title: 'Stretch Gently for 5–10 Minutes',
          duration: '5–10 minutes',
          durationBucket: 'medium',
          defaultTimerSeconds: 300,
          category: 'Rest',
          purpose: 'Release stored tightness in your shoulders, back, or legs without forcing anything.',
          instructions: 'Stretch gently for 5–10 minutes.',
          smallerVersion: 'Stretch your neck, shoulders, and back gently for 1–2 minutes.',
          reflectionPrompt: 'Where was your body holding tension today?'
        },
        {
          id: 'wed-3',
          weekday: 'Wednesday',
          title: 'Shower & Grooming Because You Deserve Care',
          duration: '10–15 minutes',
          durationBucket: 'long',
          defaultTimerSeconds: 600,
          category: 'Self-care',
          purpose: 'Treat personal hygiene and grooming as an act of self-respect, not a performance for others.',
          instructions: 'Take a proper shower and spend time on grooming because you deserve care.',
          smallerVersion: 'Wash your face, moisturize, or tidy up one part of your personal care routine.',
          reflectionPrompt: 'How did taking unhurried care of yourself shift how you feel?'
        },
        {
          id: 'wed-4',
          weekday: 'Wednesday',
          title: 'Satisfying Meal & Hydration',
          duration: '5–10 minutes',
          durationBucket: 'medium',
          defaultTimerSeconds: 300,
          category: 'Physical wellbeing',
          purpose: 'Fuel and hydrate your body consistently throughout the day.',
          instructions: 'Eat a satisfying meal and drink water throughout the day.',
          smallerVersion: 'Drink a full glass of water right now and check in on your hunger.',
          reflectionPrompt: 'How have you nourished and hydrated yourself today?'
        },
        {
          id: 'wed-5',
          weekday: 'Wednesday',
          title: 'Sit Quietly for 5 Minutes & Breathe Naturally',
          duration: '5 minutes',
          durationBucket: 'short',
          defaultTimerSeconds: 300,
          category: 'Rest',
          purpose: 'Let your nervous system settle without trying to control every thought.',
          instructions: 'Sit quietly for 5 minutes, breathing naturally and letting thoughts come and go.',
          smallerVersion: 'Sit quietly for 1 minute and take a few natural, unhurried breaths.',
          reflectionPrompt: 'How did it feel to let your thoughts pass without chasing them?'
        }
      ]
    },
    {
      dayIndex: 4,
      dayName: 'Thursday',
      shortName: 'Thu',
      theme: 'Heal your inner voice',
      themeDescription: 'Theme: Changing how you speak to yourself',
      activities: [
        {
          id: 'thu-1',
          weekday: 'Thursday',
          title: 'Name One Hurtful Belief From Growing Up',
          duration: '5 minutes',
          durationBucket: 'short',
          defaultTimerSeconds: 300,
          category: 'Self-awareness',
          purpose: 'Bring an old self-critical belief into the light so it no longer operates in the background.',
          instructions: 'Write down one hurtful thing you learned to believe about yourself growing up.',
          smallerVersion: 'Write one sentence starting with "Growing up, I sometimes felt that I had to..."',
          reflectionPrompt: 'What old belief did you notice, and where did it come from?'
        },
        {
          id: 'thu-2',
          weekday: 'Thursday',
          title: "'Would I Say This to Someone I Love?'",
          duration: '5–10 minutes',
          durationBucket: 'medium',
          defaultTimerSeconds: 300,
          category: 'Self-compassion',
          purpose: 'Offer yourself the same fairness and warmth you naturally give to people you care about.',
          instructions: "Ask yourself: 'Would I say this to someone I love?' Write a kinder, more balanced response.",
          smallerVersion: 'Write one fair, compassionate sentence you would say to a close friend in your shoes.',
          reflectionPrompt: 'What is the kinder, more balanced response you wrote for yourself?'
        },
        {
          id: 'thu-3',
          weekday: 'Thursday',
          title: 'Listen to One Song Without Scrolling',
          duration: '3–5 minutes',
          durationBucket: 'short',
          defaultTimerSeconds: 240,
          category: 'Presence',
          purpose: 'Experience a song you love with your full attention instead of background noise.',
          instructions: 'Listen to one song you enjoy without scrolling on your phone.',
          smallerVersion: 'Listen closely to 1 minute of a song you love with your eyes closed.',
          reflectionPrompt: 'Which song did you choose, and what stood out when you just listened?'
        },
        {
          id: 'thu-4',
          weekday: 'Thursday',
          title: 'Short Letter to Your Younger Self',
          duration: '5–10 minutes',
          durationBucket: 'medium',
          defaultTimerSeconds: 300,
          category: 'Self-compassion',
          purpose: 'Remind the younger version of you that they always deserved patience and kindness.',
          instructions: 'Write a short letter to your younger self, reminding them that they deserved kindness.',
          smallerVersion: 'Write one reassuring sentence to your younger self.',
          reflectionPrompt: 'What message did your younger self need to hear most?'
        },
        {
          id: 'thu-5',
          weekday: 'Thursday',
          title: '5 Minutes of Meditation or Silence',
          duration: '5 minutes',
          durationBucket: 'short',
          defaultTimerSeconds: 300,
          category: 'Rest',
          purpose: 'End your inner-voice practice with a calm, quiet pause.',
          instructions: 'Spend 5 minutes meditating or sitting in silence.',
          smallerVersion: 'Sit in quiet stillness for 1 minute.',
          reflectionPrompt: 'How does your mind feel after taking 5 minutes of quiet?'
        }
      ]
    },
    {
      dayIndex: 5,
      dayName: 'Friday',
      shortName: 'Fri',
      theme: 'Practise being yourself',
      themeDescription: 'Theme: Living without constant fear of judgment',
      activities: [
        {
          id: 'fri-1',
          weekday: 'Friday',
          title: 'Start a Conversation First',
          duration: '5–10 minutes',
          durationBucket: 'medium',
          defaultTimerSeconds: 300,
          category: 'Connection',
          purpose: 'Practise initiating connection without waiting for permission or overthinking.',
          instructions: 'Start a conversation with someone instead of waiting for them to approach you.',
          smallerVersion: 'Say hello first or send a genuine check-in message to someone you know.',
          reflectionPrompt: 'How did it feel to initiate the conversation?'
        },
        {
          id: 'fri-2',
          weekday: 'Friday',
          title: 'Take a Casual Picture for Yourself',
          duration: '2–5 minutes',
          durationBucket: 'short',
          defaultTimerSeconds: 180,
          category: 'Self-acceptance',
          purpose: 'Capture a moment purely for your own memory without worrying about social media or approval.',
          instructions: "Take a casual picture of a moment you want to remember; you don't have to post it.",
          smallerVersion: 'Snap one quick photo of your surroundings or write a line about a moment from today.',
          reflectionPrompt: 'What moment did you choose to remember for yourself?',
          specialWorkspace: 'memory'
        },
        {
          id: 'fri-3',
          weekday: 'Friday',
          title: 'Give a Genuine Compliment Without Comparing',
          duration: '2–5 minutes',
          durationBucket: 'short',
          defaultTimerSeconds: 180,
          category: 'Connection',
          purpose: 'Celebrate someone else’s strength or kindness while standing securely in your own worth.',
          instructions: 'Give a genuine compliment to someone without comparing yourself with them.',
          smallerVersion: 'Send a brief note of appreciation or thank someone sincerely.',
          reflectionPrompt: 'What did you appreciate about them, and how did it feel to say it freely?'
        },
        {
          id: 'fri-4',
          weekday: 'Friday',
          title: '10–15 Minutes of Enjoyable Movement',
          duration: '10–15 minutes',
          durationBucket: 'long',
          defaultTimerSeconds: 600,
          category: 'Body care',
          purpose: 'Move your body in a way that feels freeing, fun, and unselfconscious.',
          instructions: 'Do 10–15 minutes of enjoyable movement, such as dancing, walking or cycling safely.',
          smallerVersion: 'Put on one song and move or walk comfortably for 2–3 minutes.',
          reflectionPrompt: 'What kind of movement did you choose today?'
        },
        {
          id: 'fri-5',
          weekday: 'Friday',
          title: 'Do One Small Thing Despite Fear of Judgment',
          duration: '5–10 minutes',
          durationBucket: 'medium',
          defaultTimerSeconds: 300,
          category: 'Courage',
          purpose: 'Loosen the grip of other people’s opinions by taking one small, authentic action.',
          instructions: "Do one small thing you've avoided because you were worried about what people might think.",
          smallerVersion: 'Take the first 2-minute step toward something you have held back on.',
          reflectionPrompt: 'What did you do, and what did it teach you about your own courage?'
        }
      ]
    },
    {
      dayIndex: 6,
      dayName: 'Saturday',
      shortName: 'Sat',
      theme: 'Enjoy your own company',
      themeDescription: 'Theme: Discovering who you are beyond your insecurities',
      activities: [
        {
          id: 'sat-1',
          weekday: 'Saturday',
          title: '20 Minutes on Something You Enjoy',
          duration: '20 minutes',
          durationBucket: 'long',
          defaultTimerSeconds: 1200,
          category: 'Curiosity',
          purpose: 'Give yourself unhurried time to sink into an interest purely because you enjoy it.',
          instructions: 'Spend 20 minutes doing something you enjoy or want to explore.',
          smallerVersion: 'Spend 5 minutes on a hobby or interest you enjoy.',
          reflectionPrompt: 'How did you spend this time with yourself?'
        },
        {
          id: 'sat-2',
          weekday: 'Saturday',
          title: 'Short Bodyweight Workout (Squats, Push-Ups, Plank)',
          duration: '10 minutes',
          durationBucket: 'medium',
          defaultTimerSeconds: 600,
          category: 'Body care',
          purpose: 'Feel capable and grounded in your body through a structured bodyweight session.',
          instructions: 'Try a short bodyweight workout: 2 sets of 10 squats, 8 push-ups at a suitable variation, and a 20-second plank.',
          smallerVersion: 'Do 1 set of 5 squats, 4 comfortable push-ups, and a 10-second plank.',
          reflectionPrompt: 'How did you feel after completing the sets?'
        },
        {
          id: 'sat-3',
          weekday: 'Saturday',
          title: 'Go Somewhere Pleasant or Spend Time Outdoors',
          duration: '15–20 minutes',
          durationBucket: 'long',
          defaultTimerSeconds: 900,
          category: 'Presence',
          purpose: 'Change your environment and enjoy being out in the world on your own terms.',
          instructions: 'Go somewhere pleasant or spend time outdoors, if practical and safe.',
          smallerVersion: 'Step outside or sit by an open window for a few quiet minutes.',
          reflectionPrompt: 'Where did you go, and what felt refreshing about the space?'
        },
        {
          id: 'sat-4',
          weekday: 'Saturday',
          title: 'Make Something (Meal, Playlist, Drawing, Project)',
          duration: '15–20 minutes',
          durationBucket: 'long',
          defaultTimerSeconds: 900,
          category: 'Creativity',
          purpose: 'Express your taste and creativity by bringing something small into existence.',
          instructions: "Make something, whether it's a meal, a playlist, a drawing or a small project.",
          smallerVersion: 'Add 3 songs to a playlist, sketch something simple, or prep a small snack.',
          reflectionPrompt: 'What did you make today?'
        },
        {
          id: 'sat-5',
          weekday: 'Saturday',
          title: '10 Minutes Without Your Phone',
          duration: '10 minutes',
          durationBucket: 'medium',
          defaultTimerSeconds: 600,
          category: 'Presence',
          purpose: 'Notice your own thoughts and feelings when you are not distracted by a screen.',
          instructions: 'Spend 10 minutes without your phone and notice what you think and feel.',
          smallerVersion: 'Put your phone in another room or face-down for 2 minutes.',
          reflectionPrompt: 'What thoughts or feelings surfaced when your phone was out of reach?'
        }
      ]
    },
    {
      dayIndex: 7,
      dayName: 'Sunday',
      shortName: 'Sun',
      theme: 'Reflect and reset',
      themeDescription: 'Theme: Becoming your own safe place',
      activities: [
        {
          id: 'sun-1',
          weekday: 'Sunday',
          title: "One Thing You're Proud of From This Week",
          duration: '3–5 minutes',
          durationBucket: 'short',
          defaultTimerSeconds: 240,
          category: 'Self-trust',
          purpose: 'Acknowledge your effort and growth before a new week begins.',
          instructions: "Write down one thing you're proud of from this week.",
          smallerVersion: 'Name one moment from this week that you handled well.',
          reflectionPrompt: 'What are you proud of from this week?'
        },
        {
          id: 'sun-2',
          weekday: 'Sunday',
          title: 'One Moment You Were Too Hard on Yourself',
          duration: '5–10 minutes',
          durationBucket: 'medium',
          defaultTimerSeconds: 300,
          category: 'Emotional awareness',
          purpose: 'Learn from moments of self-criticism so you can become a safer place for yourself.',
          instructions: 'Identify one moment you were too hard on yourself and what you would like to do differently.',
          smallerVersion: 'Notice one moment you judged yourself harshly and offer yourself a fairer thought.',
          reflectionPrompt: 'What happened, and how would you like to respond to yourself next time?'
        },
        {
          id: 'sun-3',
          weekday: 'Sunday',
          title: '5–10 Minutes of Silence, Prayer, or Meditation',
          duration: '5–10 minutes',
          durationBucket: 'medium',
          defaultTimerSeconds: 300,
          category: 'Rest',
          purpose: 'Center yourself in stillness, prayer, or meditation in whatever way feels right to you.',
          instructions: 'Take 5–10 minutes to sit in silence, pray or meditate if you wish.',
          smallerVersion: 'Take 1–2 quiet minutes to pause, pray, or breathe.',
          reflectionPrompt: 'What brought you a sense of peace during this quiet time?'
        },
        {
          id: 'sun-4',
          weekday: 'Sunday',
          title: 'Gentle Stretching or a Relaxed Walk',
          duration: '10 minutes',
          durationBucket: 'medium',
          defaultTimerSeconds: 600,
          category: 'Body care',
          purpose: 'Unwind physical tension as the week comes to a close.',
          instructions: 'Do some gentle stretching or take a relaxed walk.',
          smallerVersion: 'Stretch your shoulders and back comfortably for 1–2 minutes.',
          reflectionPrompt: 'How does your body feel after slowing down?'
        },
        {
          id: 'sun-5',
          weekday: 'Sunday',
          title: 'One Thing to Explore or Practise Next Week',
          duration: '3–5 minutes',
          durationBucket: 'short',
          defaultTimerSeconds: 240,
          category: 'Personal direction',
          purpose: 'Step into the new week with curiosity and self-support.',
          instructions: "Choose one thing you'd like to explore, practise or experience next week.",
          smallerVersion: 'Write down one intention or interest for next week.',
          reflectionPrompt: 'What would you like to explore, practise, or experience next week?'
        }
      ]
    }
  ];

  const ACTIVITY_BY_ID = {};
  const ALL_CATEGORIES = [];
  WEEKLY_PLAN.forEach(function (day) {
    day.activities.forEach(function (act) {
      ACTIVITY_BY_ID[act.id] = act;
      if (!ALL_CATEGORIES.includes(act.category)) {
        ALL_CATEGORIES.push(act.category);
      }
    });
  });

  /* ------------------------------------------------------------------------
     5. TIMEZONE-SAFE LOCAL DATE UTILITIES
     ------------------------------------------------------------------------ */
  function getLocalDateKey(dateObj) {
    const d = dateObj instanceof Date ? dateObj : new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
  }

  function parseLocalDateKey(dateKey) {
    if (!dateKey || typeof dateKey !== 'string') return new Date();
    const parts = dateKey.split('-').map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) return new Date();
    return new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
  }

  function getIsoWeekday(dateObj) {
    const d = dateObj instanceof Date ? dateObj : new Date();
    const day = d.getDay();
    return day === 0 ? 7 : day;
  }

  function formatReadableDate(dateObj, includeWeekday) {
    const d = dateObj instanceof Date ? dateObj : parseLocalDateKey(dateObj);
    const options = includeWeekday
      ? { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }
      : { month: 'short', day: 'numeric', year: 'numeric' };
    return d.toLocaleDateString(undefined, options);
  }

  function formatTimestamp(isoString) {
    if (!isoString) return '';
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function getWeekDatesForOffset(weekOffset) {
    const offset = Number(weekOffset) || 0;
    const now = new Date();
    const currentIsoDay = getIsoWeekday(now);
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (currentIsoDay - 1) + offset * 7, 12, 0, 0);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i, 12, 0, 0);
      days.push({
        dayIndex: i + 1,
        dateObj: d,
        dateKey: getLocalDateKey(d),
        dayNumber: d.getDate()
      });
    }
    return days;
  }

  /* ------------------------------------------------------------------------
     6. SAFE LOCALSTORAGE ENGINE
     ------------------------------------------------------------------------ */
  function cloneData(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function safeReadStorage(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return cloneData(fallback);
      const parsed = JSON.parse(raw);
      return parsed !== null && parsed !== undefined ? parsed : cloneData(fallback);
    } catch (err) {
      return cloneData(fallback);
    }
  }

  function safeWriteStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      showToast('Could not save data locally. Browser storage may be full or restricted.');
      return false;
    }
  }

  function getPrefs() {
    const saved = safeReadStorage(STORAGE_KEYS.PREFS, DEFAULT_PREFS);
    return Object.assign({}, cloneData(DEFAULT_PREFS), saved);
  }

  function savePrefs(newPrefs) {
    const merged = Object.assign({}, getPrefs(), newPrefs);
    return safeWriteStorage(STORAGE_KEYS.PREFS, merged);
  }

  function getCompletions() {
    const data = safeReadStorage(STORAGE_KEYS.COMPLETIONS, {});
    return typeof data === 'object' && data !== null && !Array.isArray(data) ? data : {};
  }

  function saveCompletions(completionsObj) {
    return safeWriteStorage(STORAGE_KEYS.COMPLETIONS, completionsObj);
  }

  function getJournalEntries() {
    const list = safeReadStorage(STORAGE_KEYS.JOURNAL, []);
    return Array.isArray(list) ? list : [];
  }

  function saveJournalEntries(list) {
    return safeWriteStorage(STORAGE_KEYS.JOURNAL, list);
  }

  function getThoughtReflections() {
    const list = safeReadStorage(STORAGE_KEYS.THOUGHTS, []);
    return Array.isArray(list) ? list : [];
  }

  function saveThoughtReflections(list) {
    return safeWriteStorage(STORAGE_KEYS.THOUGHTS, list);
  }

  function getWeeklyReflections() {
    const list = safeReadStorage(STORAGE_KEYS.WEEKLY_REFLECTIONS, []);
    return Array.isArray(list) ? list : [];
  }

  function saveWeeklyReflections(list) {
    return safeWriteStorage(STORAGE_KEYS.WEEKLY_REFLECTIONS, list);
  }

  function downloadTextFile(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType || 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 500);
  }

  /* ------------------------------------------------------------------------
     7. TOAST & CUSTOM CONFIRMATION DIALOG
     ------------------------------------------------------------------------ */
  let toastTimeout = null;
  function showToast(message) {
    const toast = byId('sanctuary-toast');
    if (!toast) return;
    toast.textContent = message;
    toast.hidden = false;
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(function () {
      toast.hidden = true;
    }, 3600);
  }

  let pendingConfirmCallback = null;
  function requestConfirm(options) {
    const backdrop = byId('confirm-modal-backdrop');
    const titleEl = byId('confirm-modal-title');
    const descEl = byId('confirm-modal-desc');
    const acceptBtn = byId('confirm-accept-btn');
    if (!backdrop || !titleEl || !descEl || !acceptBtn) return;

    titleEl.textContent = options.title || 'Confirm Action';
    descEl.textContent = options.description || 'Are you sure you want to proceed?';
    acceptBtn.textContent = options.confirmText || 'Confirm';
    pendingConfirmCallback = options.onConfirm || null;
    backdrop.hidden = false;
    acceptBtn.focus();
  }

  function closeConfirmModal() {
    const backdrop = byId('confirm-modal-backdrop');
    if (backdrop) backdrop.hidden = true;
    pendingConfirmCallback = null;
  }

  /* ------------------------------------------------------------------------
     8. THEME & MOTION APPLICATION
     ------------------------------------------------------------------------ */
  function applyThemeAndMotion() {
    const prefs = getPrefs();
    let effectiveTheme = prefs.theme || 'dark';
    if (effectiveTheme === 'system') {
      effectiveTheme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    document.documentElement.setAttribute('data-theme', effectiveTheme);

    const metaTheme = byId('meta-theme-color');
    if (metaTheme) {
      metaTheme.setAttribute('content', effectiveTheme === 'light' ? '#F0FAF9' : '#061317');
    }

    const osReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isReduced = Boolean(prefs.reducedMotion || osReduced);
    document.documentElement.setAttribute('data-reduced-motion', isReduced ? 'true' : 'false');
  }

  /* ------------------------------------------------------------------------
     9. SCHEDULE RESOLUTION & COMPLETION HELPERS
     ------------------------------------------------------------------------ */
  function getDayPlanByIsoIndex(isoDayIndex) {
    return WEEKLY_PLAN.find(function (d) {
      return d.dayIndex === isoDayIndex;
    }) || WEEKLY_PLAN[0];
  }

  function getResolvedActivitiesForDate(dateKey) {
    const dateObj = parseLocalDateKey(dateKey);
    const isoDay = getIsoWeekday(dateObj);
    const dayPlan = getDayPlanByIsoIndex(isoDay);
    const prefs = getPrefs();
    const hiddenSet = new Set(prefs.hiddenActivities || []);
    const daySwaps = (prefs.swappedActivities && prefs.swappedActivities[dateKey]) || {};

    const resolved = [];
    let hiddenCountForDay = 0;

    dayPlan.activities.forEach(function (originalAct, slotIndex) {
      const swappedId = daySwaps[slotIndex];
      const act = (swappedId && ACTIVITY_BY_ID[swappedId]) ? ACTIVITY_BY_ID[swappedId] : originalAct;
      if (hiddenSet.has(act.id)) {
        hiddenCountForDay += 1;
      } else {
        resolved.push({
          slotIndex: slotIndex,
          activity: act,
          isSwapped: Boolean(swappedId && swappedId !== originalAct.id),
          originalActivityId: originalAct.id
        });
      }
    });

    return {
      dayPlan: dayPlan,
      items: resolved,
      hiddenCount: hiddenCountForDay,
      hasSwaps: Object.keys(daySwaps).length > 0
    };
  }

  function getCompletionRecord(dateKey, activityId) {
    const all = getCompletions();
    const list = all[dateKey] || [];
    return list.find(function (item) {
      return item.activityId === activityId;
    }) || null;
  }

  function isActivityCompletedOnDate(dateKey, activityId) {
    return Boolean(getCompletionRecord(dateKey, activityId));
  }

  function getDateCompletionsList(dateKey) {
    const all = getCompletions();
    return Array.isArray(all[dateKey]) ? all[dateKey] : [];
  }

  function setActivityCompletion(dateKey, activityId, details) {
    const todayKey = getLocalDateKey();
    if (dateKey > todayKey) {
      showToast('Future dates cannot be marked complete ahead of time.');
      return false;
    }

    const all = getCompletions();
    if (!Array.isArray(all[dateKey])) {
      all[dateKey] = [];
    }

    const existingIndex = all[dateKey].findIndex(function (r) {
      return r.activityId === activityId;
    });

    const record = {
      activityId: activityId,
      dateKey: dateKey,
      completed: true,
      timestamp: new Date().toISOString(),
      duration: (details && details.duration) || (ACTIVITY_BY_ID[activityId] ? ACTIVITY_BY_ID[activityId].duration : ''),
      reflection: (details && typeof details.reflection === 'string') ? details.reflection.trim() : '',
      memoryPhotoDataUrl: (details && details.memoryPhotoDataUrl) || null,
      usedSmaller: Boolean(details && details.usedSmaller)
    };

    if (existingIndex >= 0) {
      all[dateKey][existingIndex] = record;
    } else {
      all[dateKey].push(record);
    }

    saveCompletions(all);
    refreshCurrentPage();
    return true;
  }

  function removeActivityCompletion(dateKey, activityId) {
    const all = getCompletions();
    if (!Array.isArray(all[dateKey])) return;
    all[dateKey] = all[dateKey].filter(function (r) {
      return r.activityId !== activityId;
    });
    if (all[dateKey].length === 0) {
      delete all[dateKey];
    }
    saveCompletions(all);
    refreshCurrentPage();
  }

  function refreshCurrentPage() {
    renderTodaySpace();
    renderWeekView();
    renderJourneyView();
    renderJournalView();
    renderThoughtStudioView();
    renderSettingsView();
  }

  /* ------------------------------------------------------------------------
     10. RENDER PAGE 1: TODAY'S SPACE (index.html)
     ------------------------------------------------------------------------ */
  function renderTodaySpace() {
    const layoutEl = byId('today-activities-layout');
    if (!layoutEl) return;

    const todayKey = getLocalDateKey();
    const resolved = getResolvedActivitiesForDate(todayKey);
    const todayCompletions = getDateCompletionsList(todayKey);
    const completedCount = todayCompletions.length;

    setText('today-theme-pill', resolved.dayPlan.dayName + ' · ' + resolved.dayPlan.theme);
    setText('today-day-heading', resolved.dayPlan.dayName + ' — ' + resolved.dayPlan.theme);
    setText('today-theme-desc', resolved.dayPlan.themeDescription);

    if (completedCount === 0) {
      setText('today-status-text', 'Choose one small thing to begin.');
    } else if (completedCount === 1) {
      setText('today-status-text', 'You made some space for yourself today.');
    } else {
      setText('today-status-text', "You've already shown up for yourself today.");
    }

    const badge = byId('today-participation-badge');
    if (badge) {
      if (completedCount >= 1) {
        badge.textContent = 'You showed up for yourself today';
        badge.classList.add('is-participated');
      } else {
        badge.textContent = 'Completing 1 activity counts as a full day';
        badge.classList.remove('is-participated');
      }
    }

    const hiddenBanner = byId('today-hidden-banner');
    const hiddenBannerText = byId('today-hidden-banner-text');
    if (hiddenBanner && hiddenBannerText) {
      if (resolved.hiddenCount > 0) {
        hiddenBanner.hidden = false;
        hiddenBannerText.textContent =
          resolved.hiddenCount === 1
            ? '1 activity for today is hidden based on your preferences.'
            : resolved.hiddenCount + ' activities for today are hidden based on your preferences.';
      } else {
        hiddenBanner.hidden = true;
      }
    }

    layoutEl.innerHTML = '';

    if (resolved.items.length === 0) {
      layoutEl.innerHTML =
        '<div class="empty-state-box">All activities for today are currently hidden. Use the button above or visit Settings to restore them.</div>';
      return;
    }

    let focalIndex = resolved.items.findIndex(function (item) {
      return !isActivityCompletedOnDate(todayKey, item.activity.id);
    });
    if (focalIndex === -1) focalIndex = 0;

    const focalCol = document.createElement('div');
    focalCol.className = 'today-focal-slot';
    focalCol.appendChild(createActivityCardElement(resolved.items[focalIndex], todayKey, true));

    const streamCol = document.createElement('div');
    streamCol.className = 'today-stream-slot';

    resolved.items.forEach(function (item, idx) {
      if (idx !== focalIndex) {
        streamCol.appendChild(createActivityCardElement(item, todayKey, false));
      }
    });

    layoutEl.appendChild(focalCol);
    layoutEl.appendChild(streamCol);
  }

  function createActivityCardElement(resolvedItem, dateKey, isFocal) {
    const act = resolvedItem.activity;
    const record = getCompletionRecord(dateKey, act.id);
    const isDone = Boolean(record);
    const iconSvg = CATEGORY_ICONS[act.category] || CATEGORY_ICONS['Self-awareness'];

    const article = document.createElement('article');
    article.className = 'activity-card' + (isFocal ? ' activity-card--focal' : '') + (isDone ? ' is-completed' : '');

    const eyebrowHtml = isFocal
      ? '<div class="focal-eyebrow"><span>Suggested Starting Point</span></div>'
      : '';

    const smallerPreviewHtml = isFocal
      ? '<div class="activity-card__smaller-note"><strong>Smaller option:</strong> ' + escapeHtml(act.smallerVersion) + '</div>'
      : '';

    article.innerHTML =
      '<div>' +
        eyebrowHtml +
        '<div class="activity-card__top">' +
          '<div class="activity-card__meta">' +
            '<span class="category-tag">' + escapeHtml(act.category) + '</span>' +
            '<span class="duration-tag">' + escapeHtml(act.duration) + '</span>' +
            (resolvedItem.isSwapped ? '<span class="duration-tag">Swapped</span>' : '') +
          '</div>' +
          '<div class="activity-card__icon-box" aria-hidden="true">' + iconSvg + '</div>' +
        '</div>' +
        '<h3 class="activity-card__title">' + escapeHtml(act.title) + '</h3>' +
        '<p class="activity-card__desc">' + escapeHtml(act.instructions) + '</p>' +
        smallerPreviewHtml +
      '</div>' +
      '<div class="activity-card__footer">' +
        '<button type="button" class="btn ' + (isFocal ? 'btn--primary' : 'btn--subtle') + ' btn--sm" data-open-activity="' + act.id + '" data-date-key="' + dateKey + '" data-slot-index="' + resolvedItem.slotIndex + '">' +
          '<span>' + (isDone ? 'Revisit activity' : 'Open invitation') + '</span>' +
        '</button>' +
        '<button type="button" class="complete-toggle-btn ' + (isDone ? 'is-done' : '') + '" data-quick-toggle="' + act.id + '" data-date-key="' + dateKey + '" aria-pressed="' + (isDone ? 'true' : 'false') + '">' +
          '<span>' + (isDone ? 'Completed' : 'Mark complete') + '</span>' +
        '</button>' +
      '</div>';

    return article;
  }

  function handleChooseForMe() {
    const todayKey = getLocalDateKey();
    const resolved = getResolvedActivitiesForDate(todayKey);
    const prefs = getPrefs();

    const uncompleted = resolved.items.filter(function (item) {
      return !isActivityCompletedOnDate(todayKey, item.activity.id);
    });

    if (uncompleted.length === 0) {
      if (resolved.items.length === 0) {
        showToast("All of today's activities are currently hidden.");
        return;
      }
      const randomRevisit = resolved.items[Math.floor(Math.random() * resolved.items.length)];
      showToast("You've already completed today's activities. Opening one if you'd like to revisit it.");
      openActivityModal(randomRevisit.activity.id, todayKey, randomRevisit.slotIndex);
      return;
    }

    const preferredCats = Array.isArray(prefs.preferredCategories) ? prefs.preferredCategories : [];
    const prefDuration = prefs.defaultDuration || 'any';

    let pool = uncompleted.filter(function (item) {
      const catMatch = preferredCats.length === 0 || preferredCats.includes(item.activity.category);
      const durMatch = prefDuration === 'any' || item.activity.durationBucket === prefDuration;
      return catMatch && durMatch;
    });

    if (pool.length === 0 && preferredCats.length > 0) {
      pool = uncompleted.filter(function (item) {
        return preferredCats.includes(item.activity.category);
      });
    }
    if (pool.length === 0 && prefDuration !== 'any') {
      pool = uncompleted.filter(function (item) {
        return item.activity.durationBucket === prefDuration;
      });
    }
    if (pool.length === 0) {
      pool = uncompleted;
    }

    const chosen = pool[Math.floor(Math.random() * pool.length)];
    openActivityModal(chosen.activity.id, todayKey, chosen.slotIndex);
  }

  /* ------------------------------------------------------------------------
     11. RENDER PAGE 2: YOUR WEEK (week.html)
     ------------------------------------------------------------------------ */
  let currentWeekOffset = 0;
  let selectedWeekDayIndex = getIsoWeekday(new Date());

  function renderWeekView() {
    const ribbon = byId('week-day-selector');
    const container = byId('week-activities-container');
    if (!ribbon || !container) return;

    const weekDays = getWeekDatesForOffset(currentWeekOffset);
    const todayKey = getLocalDateKey();

    if (weekDays.length === 7) {
      setText(
        'week-date-range',
        formatReadableDate(weekDays[0].dateObj, false) + ' – ' + formatReadableDate(weekDays[6].dateObj, false)
      );
    }

    const returnCurrentBtn = byId('week-current-btn');
    if (returnCurrentBtn) {
      returnCurrentBtn.hidden = currentWeekOffset === 0;
    }

    ribbon.innerHTML = '';
    weekDays.forEach(function (dayInfo) {
      const plan = getDayPlanByIsoIndex(dayInfo.dayIndex);
      const dayCompletions = getDateCompletionsList(dayInfo.dateKey);
      const hasParticipated = dayCompletions.length > 0;
      const isSelected = dayInfo.dayIndex === selectedWeekDayIndex;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.role = 'tab';
      btn.setAttribute('aria-selected', isSelected ? 'true' : 'false');
      btn.className =
        'week-day-tab' +
        (isSelected ? ' is-active' : '') +
        (hasParticipated ? ' has-participated' : '');

      btn.innerHTML =
        '<span class="day-tab-short">' + escapeHtml(plan.shortName) + (dayInfo.dateKey === todayKey ? ' · Today' : '') + '</span>' +
        '<span class="day-tab-num">' + dayInfo.dayNumber + '</span>' +
        '<span class="day-tab-theme">' + escapeHtml(plan.theme) + '</span>' +
        '<span class="day-tab-dot" aria-hidden="true"></span>';

      btn.addEventListener('click', function () {
        selectedWeekDayIndex = dayInfo.dayIndex;
        renderWeekView();
      });

      ribbon.appendChild(btn);
    });

    const activeDayObj = weekDays.find(function (d) {
      return d.dayIndex === selectedWeekDayIndex;
    }) || weekDays[0];

    const resolved = getResolvedActivitiesForDate(activeDayObj.dateKey);
    const dayCompletions = getDateCompletionsList(activeDayObj.dateKey);
    const isFutureDate = activeDayObj.dateKey > todayKey;

    setText('week-selected-day-name', resolved.dayPlan.dayName);
    setText('week-selected-date', formatReadableDate(activeDayObj.dateObj, false));
    setText('week-selected-theme', resolved.dayPlan.theme);
    setText('week-selected-desc', resolved.dayPlan.themeDescription);

    const statusEl = byId('week-selected-status');
    if (statusEl) {
      if (isFutureDate) {
        statusEl.textContent = 'Upcoming day (Preview)';
        statusEl.className = 'duration-tag';
      } else if (dayCompletions.length > 0) {
        statusEl.textContent = 'Participated (' + dayCompletions.length + ' completed)';
        statusEl.className = 'status-tag';
      } else {
        statusEl.textContent = 'Open space';
        statusEl.className = 'duration-tag';
      }
    }

    const restoreDayBtn = byId('week-restore-day-btn');
    if (restoreDayBtn) {
      restoreDayBtn.hidden = !resolved.hasSwaps;
      restoreDayBtn.onclick = function () {
        const prefs = getPrefs();
        if (prefs.swappedActivities && prefs.swappedActivities[activeDayObj.dateKey]) {
          delete prefs.swappedActivities[activeDayObj.dateKey];
          savePrefs(prefs);
          renderWeekView();
          showToast('Restored original activities for ' + resolved.dayPlan.dayName + '.');
        }
      };
    }

    container.innerHTML = '';
    if (resolved.items.length === 0) {
      container.innerHTML =
        '<div class="empty-state-box">All activities for this day are hidden in your Settings.</div>';
      return;
    }

    resolved.items.forEach(function (item) {
      const act = item.activity;
      const isDone = isActivityCompletedOnDate(activeDayObj.dateKey, act.id);
      const iconSvg = CATEGORY_ICONS[act.category] || CATEGORY_ICONS['Self-awareness'];

      const row = document.createElement('article');
      row.className = 'week-activity-row' + (isDone ? ' is-completed' : '');

      row.innerHTML =
        '<div class="activity-card__icon-box" aria-hidden="true">' + iconSvg + '</div>' +
        '<div>' +
          '<div class="activity-card__meta" style="margin-bottom:0.35rem;">' +
            '<span class="category-tag">' + escapeHtml(act.category) + '</span>' +
            '<span class="duration-tag">' + escapeHtml(act.duration) + '</span>' +
            (item.isSwapped ? '<span class="duration-tag">Swapped</span>' : '') +
          '</div>' +
          '<h3 class="activity-card__title">' + escapeHtml(act.title) + '</h3>' +
          '<p class="activity-card__desc" style="margin-bottom:0.35rem;">' + escapeHtml(act.instructions) + '</p>' +
          '<p style="font-size:0.82rem;color:var(--text-muted);"><strong>Smaller option:</strong> ' + escapeHtml(act.smallerVersion) + '</p>' +
        '</div>' +
        '<div style="display:flex;flex-direction:column;gap:0.5rem;align-items:flex-end;">' +
          '<button type="button" class="btn btn--subtle btn--sm" data-open-activity="' + act.id + '" data-date-key="' + activeDayObj.dateKey + '" data-slot-index="' + item.slotIndex + '">' +
            (isFutureDate ? 'Preview details' : isDone ? 'Revisit' : 'Open') +
          '</button>' +
          (!isFutureDate
            ? '<button type="button" class="complete-toggle-btn ' + (isDone ? 'is-done' : '') + '" data-quick-toggle="' + act.id + '" data-date-key="' + activeDayObj.dateKey + '">' +
                (isDone ? 'Completed' : 'Mark complete') +
              '</button>'
            : '') +
        '</div>';

      container.appendChild(row);
    });
  }

  /* ------------------------------------------------------------------------
     12. ACTIVITY DETAIL MODAL, TIMER, VOICE & PHOTO WORKSPACES
     ------------------------------------------------------------------------ */
  let activeModalContext = {
    activityId: null,
    dateKey: null,
    slotIndex: 0,
    usingSmaller: false,
    memoryPhotoDataUrl: null
  };

  let modalTimerState = {
    running: false,
    targetSeconds: 300,
    remainingSeconds: 300,
    endTimestamp: null,
    intervalId: null
  };

  let mediaRecorder = null;
  let audioChunks = [];
  let recordedAudioUrl = null;

  function openActivityModal(activityId, dateKey, slotIndex) {
    const backdrop = byId('activity-modal-backdrop');
    const act = ACTIVITY_BY_ID[activityId];
    if (!backdrop || !act) return;

    const targetDateKey = dateKey || getLocalDateKey();
    const todayKey = getLocalDateKey();
    const isFuture = targetDateKey > todayKey;
    const record = getCompletionRecord(targetDateKey, activityId);

    activeModalContext = {
      activityId: activityId,
      dateKey: targetDateKey,
      slotIndex: typeof slotIndex === 'number' ? slotIndex : 0,
      usingSmaller: Boolean(record && record.usedSmaller),
      memoryPhotoDataUrl: (record && record.memoryPhotoDataUrl) || null
    };

    setText('modal-activity-category', act.category);
    setText('modal-activity-duration', act.duration);

    const statusPill = byId('modal-activity-status-pill');
    if (statusPill) statusPill.hidden = !record;

    setText('modal-activity-title', act.title);
    setText('modal-activity-purpose', act.purpose || '');
    setText('modal-activity-instructions', act.instructions);
    setText('modal-activity-smaller', act.smallerVersion);

    setModalApproachTab(activeModalContext.usingSmaller);

    stopModalTimer();
    modalTimerState.targetSeconds = act.defaultTimerSeconds || 300;
    modalTimerState.remainingSeconds = modalTimerState.targetSeconds;
    updateModalTimerDisplay();

    const voiceWorkspace = byId('modal-voice-workspace');
    if (voiceWorkspace) {
      cleanupVoiceRecorder();
      voiceWorkspace.hidden = act.specialWorkspace !== 'voice';
    }

    const memoryWorkspace = byId('modal-memory-workspace');
    const previewWrap = byId('memory-photo-preview-wrap');
    const previewImg = byId('memory-photo-preview');
    if (memoryWorkspace) {
      memoryWorkspace.hidden = act.specialWorkspace !== 'memory';
      if (activeModalContext.memoryPhotoDataUrl && previewWrap && previewImg) {
        previewImg.src = activeModalContext.memoryPhotoDataUrl;
        previewWrap.hidden = false;
      } else if (previewWrap) {
        previewWrap.hidden = true;
      }
    }

    setText('modal-reflection-prompt', 'Optional reflection: "' + act.reflectionPrompt + '"');
    const reflectionInput = byId('modal-reflection-input');
    if (reflectionInput) {
      reflectionInput.value = (record && record.reflection) ? record.reflection : '';
    }

    const completeBtn = byId('modal-complete-btn');
    if (completeBtn) {
      if (isFuture) {
        completeBtn.disabled = true;
        completeBtn.textContent = 'Scheduled for ' + formatReadableDate(targetDateKey, false);
      } else {
        completeBtn.disabled = false;
        completeBtn.textContent = record ? 'Save Changes' : 'Mark as Complete';
      }
    }

    backdrop.hidden = false;
    const closeBtn = byId('modal-close-btn');
    if (closeBtn) closeBtn.focus();
  }

  function closeActivityModal() {
    stopModalTimer();
    cleanupVoiceRecorder();
    const backdrop = byId('activity-modal-backdrop');
    if (backdrop) backdrop.hidden = true;
  }

  function setModalApproachTab(useSmaller) {
    activeModalContext.usingSmaller = Boolean(useSmaller);
    const stdTab = byId('modal-standard-tab');
    const smTab = byId('modal-smaller-tab');
    const stdBox = byId('modal-instructions-box');
    const smBox = byId('modal-smaller-box');
    if (!stdTab || !smTab || !stdBox || !smBox) return;

    if (useSmaller) {
      stdTab.classList.remove('is-active');
      smTab.classList.add('is-active');
      stdBox.hidden = true;
      smBox.hidden = false;
      if (!modalTimerState.running) {
        modalTimerState.targetSeconds = 60;
        modalTimerState.remainingSeconds = 60;
        updateModalTimerDisplay();
      }
    } else {
      stdTab.classList.add('is-active');
      smTab.classList.remove('is-active');
      stdBox.hidden = false;
      smBox.hidden = true;
    }
  }

  function updateModalTimerDisplay() {
    const el = byId('modal-timer-display');
    const btn = byId('modal-timer-toggle-btn');
    if (!el) return;
    const mins = String(Math.floor(modalTimerState.remainingSeconds / 60)).padStart(2, '0');
    const secs = String(modalTimerState.remainingSeconds % 60).padStart(2, '0');
    el.textContent = mins + ':' + secs;
    if (btn) {
      btn.textContent = modalTimerState.running ? 'Pause timer' : 'Start timer';
    }
  }

  function toggleModalTimer() {
    if (modalTimerState.running) {
      modalTimerState.running = false;
      if (modalTimerState.intervalId) clearInterval(modalTimerState.intervalId);
      updateModalTimerDisplay();
    } else {
      if (modalTimerState.remainingSeconds <= 0) {
        modalTimerState.remainingSeconds = modalTimerState.targetSeconds;
      }
      modalTimerState.running = true;
      modalTimerState.endTimestamp = Date.now() + modalTimerState.remainingSeconds * 1000;
      modalTimerState.intervalId = setInterval(function () {
        const msLeft = modalTimerState.endTimestamp - Date.now();
        if (msLeft <= 0) {
          modalTimerState.remainingSeconds = 0;
          stopModalTimer();
          showToast('Timer finished. Take your time or mark complete whenever you are ready.');
        } else {
          modalTimerState.remainingSeconds = Math.ceil(msLeft / 1000);
          updateModalTimerDisplay();
        }
      }, 250);
      updateModalTimerDisplay();
    }
  }

  function stopModalTimer() {
    modalTimerState.running = false;
    if (modalTimerState.intervalId) {
      clearInterval(modalTimerState.intervalId);
      modalTimerState.intervalId = null;
    }
    updateModalTimerDisplay();
  }

  function startVoiceRecording() {
    const statusText = byId('voice-status-text');
    const recordBtn = byId('voice-record-btn');
    const stopBtn = byId('voice-stop-btn');
    if (!statusText || !recordBtn || !stopBtn) return;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      statusText.textContent = 'Voice recording is unavailable here. Feel free to use the reflection box below.';
      return;
    }

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(function (stream) {
        audioChunks = [];
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = function (e) {
          if (e.data.size > 0) audioChunks.push(e.data);
        };
        mediaRecorder.onstop = function () {
          stream.getTracks().forEach(function (t) {
            t.stop();
          });
          const blob = new Blob(audioChunks, { type: 'audio/webm' });
          if (recordedAudioUrl) URL.revokeObjectURL(recordedAudioUrl);
          recordedAudioUrl = URL.createObjectURL(blob);
          const player = byId('voice-audio-player');
          if (player) {
            player.src = recordedAudioUrl;
            player.hidden = false;
          }
          statusText.textContent = 'Recorded privately in memory. You do not have to listen to it.';
          recordBtn.hidden = false;
          recordBtn.textContent = 'Record again';
          stopBtn.hidden = true;
        };
        mediaRecorder.start();
        statusText.textContent = 'Recording privately...';
        recordBtn.hidden = true;
        stopBtn.hidden = false;
      })
      .catch(function () {
        statusText.textContent = 'Microphone permission declined or unavailable. You can write a sentence below instead.';
      });
  }

  function stopVoiceRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }
  }

  function cleanupVoiceRecorder() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }
    if (recordedAudioUrl) {
      URL.revokeObjectURL(recordedAudioUrl);
      recordedAudioUrl = null;
    }
    const player = byId('voice-audio-player');
    const statusText = byId('voice-status-text');
    const recordBtn = byId('voice-record-btn');
    const stopBtn = byId('voice-stop-btn');
    if (player) {
      player.hidden = true;
      player.removeAttribute('src');
    }
    if (statusText) statusText.textContent = 'Ready';
    if (recordBtn) {
      recordBtn.hidden = false;
      recordBtn.textContent = 'Start recording';
    }
    if (stopBtn) stopBtn.hidden = true;
  }

  function handleMemoryPhotoUpload(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
      const img = new Image();
      img.onload = function () {
        const canvas = document.createElement('canvas');
        const maxDim = 360;
        let w = img.width;
        let h = img.height;
        if (w > h && w > maxDim) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else if (h > maxDim) {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.78);
        activeModalContext.memoryPhotoDataUrl = dataUrl;

        const previewWrap = byId('memory-photo-preview-wrap');
        const previewImg = byId('memory-photo-preview');
        if (previewWrap && previewImg) {
          previewImg.src = dataUrl;
          previewWrap.hidden = false;
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function openSwapModal() {
    const backdrop = byId('swap-modal-backdrop');
    const listEl = byId('swap-options-list');
    if (!backdrop || !listEl) return;

    const currentActId = activeModalContext.activityId;
    const prefs = getPrefs();
    const hiddenSet = new Set(prefs.hiddenActivities || []);
    listEl.innerHTML = '';

    WEEKLY_PLAN.forEach(function (day) {
      day.activities.forEach(function (candidate) {
        if (candidate.id === currentActId || hiddenSet.has(candidate.id)) return;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'swap-option-item';
        btn.innerHTML =
          '<div>' +
            '<div style="font-weight:600;font-size:0.94rem;">' + escapeHtml(candidate.title) + '</div>' +
            '<div style="font-size:0.8rem;color:var(--text-secondary);">' +
              escapeHtml(candidate.weekday) + ' · ' + escapeHtml(candidate.category) + ' · ' + escapeHtml(candidate.duration) +
            '</div>' +
          '</div>' +
          '<span class="text-link-btn">Select</span>';

        btn.addEventListener('click', function () {
          const currentPrefs = getPrefs();
          if (!currentPrefs.swappedActivities) currentPrefs.swappedActivities = {};
          if (!currentPrefs.swappedActivities[activeModalContext.dateKey]) {
            currentPrefs.swappedActivities[activeModalContext.dateKey] = {};
          }
          currentPrefs.swappedActivities[activeModalContext.dateKey][activeModalContext.slotIndex] = candidate.id;
          savePrefs(currentPrefs);
          backdrop.hidden = true;
          closeActivityModal();
          refreshCurrentPage();
          showToast('Swapped in "' + candidate.title + '" for this day.');
        });

        listEl.appendChild(btn);
      });
    });

    backdrop.hidden = false;
  }

  /* ------------------------------------------------------------------------
     13. RENDER PAGE 3: MY JOURNEY (journey.html)
     ------------------------------------------------------------------------ */
  let calViewYear = new Date().getFullYear();
  let calViewMonth = new Date().getMonth();
  let selectedCalendarDateKey = null;
  let currentWeeklyPromptIndex = 0;

  function renderJourneyView() {
    const gridEl = byId('journey-calendar-grid');
    if (!gridEl) return;

    const completionsMap = getCompletions();
    const weeklyReflections = getWeeklyReflections();

    const participatedDateKeys = Object.keys(completionsMap).filter(function (k) {
      return Array.isArray(completionsMap[k]) && completionsMap[k].length > 0;
    });

    let totalCompletedActivities = 0;
    let totalActivityReflections = 0;
    const categoryCounts = {};
    const flatTimeline = [];
    const allSavedReflections = [];

    participatedDateKeys.forEach(function (dateKey) {
      const dayRecords = completionsMap[dateKey];
      dayRecords.forEach(function (rec) {
        totalCompletedActivities += 1;
        const act = ACTIVITY_BY_ID[rec.activityId];
        const category = act ? act.category : 'Self-awareness';
        const title = act ? act.title : 'Completed Activity';

        categoryCounts[category] = (categoryCounts[category] || 0) + 1;

        flatTimeline.push({
          dateKey: dateKey,
          timestamp: rec.timestamp || dateKey + 'T12:00:00',
          title: title,
          category: category,
          usedSmaller: Boolean(rec.usedSmaller),
          reflection: rec.reflection || ''
        });

        if ((rec.reflection && rec.reflection.trim().length > 0) || rec.memoryPhotoDataUrl) {
          totalActivityReflections += 1;
          allSavedReflections.push({
            dateKey: dateKey,
            timestamp: rec.timestamp || dateKey + 'T12:00:00',
            title: title,
            prompt: act ? act.reflectionPrompt : '',
            text: rec.reflection || '',
            memoryPhotoDataUrl: rec.memoryPhotoDataUrl || null
          });
        }
      });
    });

    weeklyReflections.forEach(function (wRef) {
      allSavedReflections.push({
        dateKey: wRef.dateKey,
        timestamp: wRef.timestamp,
        title: 'Weekly Check-In',
        prompt: wRef.prompt,
        text: wRef.text,
        memoryPhotoDataUrl: null
      });
    });

    setText('journey-days-count', String(participatedDateKeys.length));
    setText('journey-activities-count', String(totalCompletedActivities));
    setText('journey-reflections-count', String(totalActivityReflections + weeklyReflections.length));

    renderParticipationCalendar(completionsMap);

    const catListEl = byId('journey-categories-list');
    if (catListEl) {
      const exploredEntries = Object.entries(categoryCounts).sort(function (a, b) {
        return b[1] - a[1];
      });
      if (exploredEntries.length === 0) {
        catListEl.innerHTML =
          '<div class="empty-state-box">As you complete activities, the themes you spend time with will gently appear here.</div>';
      } else {
        catListEl.innerHTML = exploredEntries
          .map(function (entry) {
            return (
              '<div class="category-stat-row">' +
                '<span>' + escapeHtml(entry[0]) + '</span>' +
                '<span class="category-stat-count">' + entry[1] + (entry[1] === 1 ? ' time' : ' times') + '</span>' +
              '</div>'
            );
          })
          .join('');
      }
    }

    flatTimeline.sort(function (a, b) {
      return b.timestamp.localeCompare(a.timestamp);
    });

    const timelineListEl = byId('journey-timeline-list');
    if (timelineListEl) {
      if (flatTimeline.length === 0) {
        timelineListEl.innerHTML =
          "<div class=\"empty-state-box\">Your timeline is currently empty. Completing any single activity in Today's Space will begin your record.</div>";
      } else {
        timelineListEl.innerHTML = flatTimeline
          .map(function (item) {
            return (
              '<article class="timeline-item">' +
                '<div class="timeline-item__top">' +
                  '<div class="activity-card__meta">' +
                    '<span class="category-tag">' + escapeHtml(item.category) + '</span>' +
                    (item.usedSmaller ? '<span class="duration-tag">Smaller version</span>' : '') +
                  '</div>' +
                  '<span class="header-date">' + escapeHtml(formatReadableDate(item.dateKey, false)) + '</span>' +
                '</div>' +
                '<h3 class="activity-card__title" style="margin-bottom:0.2rem;">' + escapeHtml(item.title) + '</h3>' +
                (item.reflection
                  ? '<p class="reflection-card__text">"' + escapeHtml(item.reflection) + '"</p>'
                  : '') +
              '</article>'
            );
          })
          .join('');
      }
    }

    allSavedReflections.sort(function (a, b) {
      return (b.timestamp || '').localeCompare(a.timestamp || '');
    });

    const reflectionsListEl = byId('journey-reflections-list');
    if (reflectionsListEl) {
      if (allSavedReflections.length === 0) {
        reflectionsListEl.innerHTML =
          '<div class="empty-state-box">No reflections saved yet. Whenever you choose to answer an optional reflection after an activity or weekly check-in, it will be kept here.</div>';
      } else {
        reflectionsListEl.innerHTML = allSavedReflections
          .map(function (ref) {
            const photoHtml = ref.memoryPhotoDataUrl
              ? '<div style="margin-top:0.65rem;"><img src="' + ref.memoryPhotoDataUrl + '" alt="Saved memory" class="memory-preview-img" /></div>'
              : '';
            return (
              '<article class="reflection-card">' +
                '<div class="reflection-card__top">' +
                  '<strong>' + escapeHtml(ref.title) + '</strong>' +
                  '<span class="header-date">' + escapeHtml(formatReadableDate(ref.dateKey, false)) + '</span>' +
                '</div>' +
                (ref.prompt
                  ? '<p style="font-size:0.84rem;color:var(--text-secondary);">' + escapeHtml(ref.prompt) + '</p>'
                  : '') +
                (ref.text ? '<p class="reflection-card__text">' + escapeHtml(ref.text) + '</p>' : '') +
                photoHtml +
              '</article>'
            );
          })
          .join('');
      }
    }
  }

  function renderParticipationCalendar(completionsMap) {
    const labelEl = byId('cal-month-label');
    const gridEl = byId('journey-calendar-grid');
    const detailEl = byId('journey-day-detail');
    if (!labelEl || !gridEl) return;

    const firstDayOfMonth = new Date(calViewYear, calViewMonth, 1, 12, 0, 0);
    const daysInMonth = new Date(calViewYear, calViewMonth + 1, 0).getDate();
    labelEl.textContent = firstDayOfMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

    const rawDay = firstDayOfMonth.getDay();
    const isoStartDay = rawDay === 0 ? 7 : rawDay;
    const leadingBlanks = isoStartDay - 1;
    const todayKey = getLocalDateKey();

    gridEl.innerHTML = '';

    for (let b = 0; b < leadingBlanks; b++) {
      const emptyCell = document.createElement('div');
      emptyCell.className = 'cal-day cal-day--empty';
      emptyCell.setAttribute('aria-hidden', 'true');
      gridEl.appendChild(emptyCell);
    }

    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const cellDate = new Date(calViewYear, calViewMonth, dayNum, 12, 0, 0);
      const cellKey = getLocalDateKey(cellDate);
      const records = Array.isArray(completionsMap[cellKey]) ? completionsMap[cellKey] : [];
      const hasParticipated = records.length > 0;
      const isToday = cellKey === todayKey;
      const isSelected = cellKey === selectedCalendarDateKey;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className =
        'cal-day' +
        (isToday ? ' cal-day--today' : '') +
        (hasParticipated ? ' cal-day--participated' : '') +
        (isSelected ? ' is-selected' : '');

      btn.setAttribute(
        'aria-label',
        formatReadableDate(cellDate, false) + (hasParticipated ? ' — Participated' : ' — No recorded activities')
      );

      btn.innerHTML =
        '<span>' + dayNum + '</span>' +
        (hasParticipated ? '<span class="cal-day__dot" aria-hidden="true"></span>' : '');

      btn.addEventListener('click', function () {
        selectedCalendarDateKey = cellKey;
        renderParticipationCalendar(completionsMap);
        renderCalendarDayInspector(cellKey, records);
      });

      gridEl.appendChild(btn);
    }

    if (selectedCalendarDateKey) {
      const activeRecords = Array.isArray(completionsMap[selectedCalendarDateKey])
        ? completionsMap[selectedCalendarDateKey]
        : [];
      renderCalendarDayInspector(selectedCalendarDateKey, activeRecords);
    } else if (detailEl) {
      detailEl.hidden = true;
    }
  }

  function renderCalendarDayInspector(dateKey, records) {
    const detailEl = byId('journey-day-detail');
    if (!detailEl) return;
    detailEl.hidden = false;

    const readable = formatReadableDate(dateKey, true);
    if (!records || records.length === 0) {
      detailEl.innerHTML =
        '<strong>' + escapeHtml(readable) + '</strong>' +
        '<p style="color:var(--text-secondary);margin-top:0.25rem;">A quiet day with no recorded activities.</p>';
      return;
    }

    const itemsHtml = records
      .map(function (r) {
        const act = ACTIVITY_BY_ID[r.activityId];
        const title = act ? act.title : r.activityId;
        return '<li>' + escapeHtml(title) + (r.usedSmaller ? ' <em>(smaller version)</em>' : '') + '</li>';
      })
      .join('');

    detailEl.innerHTML =
      '<strong>' + escapeHtml(readable) + '</strong>' +
      '<p style="color:var(--accent-soft);margin-top:0.2rem;">You showed up for yourself on this day:</p>' +
      '<ul style="margin-top:0.4rem;padding-left:1.2rem;color:var(--text-secondary);">' +
        itemsHtml +
      '</ul>';
  }

  /* ------------------------------------------------------------------------
     14. RENDER PAGE 4: JOURNAL (journal.html)
     ------------------------------------------------------------------------ */
  function renderJournalView() {
    const listEl = byId('journal-entries-list');
    if (!listEl) return;

    const promptsContainer = byId('journal-prompts-list');
    if (promptsContainer && promptsContainer.children.length === 0) {
      JOURNAL_PROMPTS.forEach(function (promptText) {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'prompt-chip';
        chip.textContent = promptText;
        chip.addEventListener('click', function () {
          const textarea = byId('journal-content-input');
          if (!textarea) return;
          const prefix = textarea.value.trim().length > 0 ? '\n\n' : '';
          textarea.value = textarea.value + prefix + promptText + '\n';
          textarea.focus();
        });
        promptsContainer.appendChild(chip);
      });
    }

    renderJournalArchiveList();
  }

  function renderJournalArchiveList() {
    const listEl = byId('journal-entries-list');
    if (!listEl) return;

    const searchInput = byId('journal-search-input');
    const editingInput = byId('journal-editing-id');
    const editingId = editingInput ? editingInput.value : '';
    const query = (searchInput && searchInput.value) ? searchInput.value.trim().toLowerCase() : '';

    const entries = getJournalEntries().slice().sort(function (a, b) {
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });

    const filtered = entries.filter(function (entry) {
      if (!query) return true;
      const inTitle = (entry.title || '').toLowerCase().includes(query);
      const inContent = (entry.content || '').toLowerCase().includes(query);
      return inTitle || inContent;
    });

    if (filtered.length === 0) {
      listEl.innerHTML =
        '<div class="empty-state-box">' +
          (query
            ? 'No saved entries match your search.'
            : 'Your journal is empty. Write whenever you want a private place to think.') +
        '</div>';
      return;
    }

    listEl.innerHTML = '';
    filtered.forEach(function (entry) {
      const card = document.createElement('article');
      card.className = 'journal-entry-card' + (entry.id === editingId ? ' is-active' : '');

      const displayTitle =
        entry.title && entry.title.trim().length > 0 ? entry.title.trim() : 'Untitled Entry';
      const dateLabel = formatTimestamp(entry.createdAt);
      const editedNote =
        entry.updatedAt && entry.updatedAt !== entry.createdAt
          ? ' · Edited ' + formatTimestamp(entry.updatedAt)
          : '';

      card.innerHTML =
        '<h3 class="journal-entry-card__title">' + escapeHtml(displayTitle) + '</h3>' +
        '<div class="journal-entry-card__date">' + escapeHtml(dateLabel + editedNote) + '</div>' +
        '<p class="journal-entry-card__excerpt">' + escapeHtml(entry.content) + '</p>' +
        '<div class="journal-entry-card__actions">' +
          '<button type="button" class="text-link-btn" data-journal-edit="' + entry.id + '">Read / Edit</button>' +
          '<button type="button" class="text-link-btn" style="color:var(--danger-color);" data-journal-delete="' + entry.id + '">Delete</button>' +
        '</div>';

      listEl.appendChild(card);
    });
  }

  function resetJournalEditor() {
    const editId = byId('journal-editing-id');
    const titleIn = byId('journal-title-input');
    const contentIn = byId('journal-content-input');
    if (editId) editId.value = '';
    if (titleIn) titleIn.value = '';
    if (contentIn) contentIn.value = '';
    setText('journal-editor-mode', 'New Entry');
    setText('journal-editor-meta', 'Blank page ready');
    renderJournalArchiveList();
  }

  function handleSaveJournalEntry() {
    const editIdEl = byId('journal-editing-id');
    const titleEl = byId('journal-title-input');
    const contentEl = byId('journal-content-input');
    if (!titleEl || !contentEl) return;

    const editingId = editIdEl ? editIdEl.value : '';
    const titleVal = titleEl.value.trim();
    const contentVal = contentEl.value.trim();

    if (!contentVal && !titleVal) {
      showToast('Write a few words before saving your entry.');
      return;
    }

    const entries = getJournalEntries();
    const nowIso = new Date().toISOString();

    if (editingId) {
      const idx = entries.findIndex(function (e) {
        return e.id === editingId;
      });
      if (idx >= 0) {
        entries[idx].title = titleVal;
        entries[idx].content = contentVal;
        entries[idx].updatedAt = nowIso;
      }
      saveJournalEntries(entries);
      showToast('Journal entry updated.');
    } else {
      entries.push({
        id: 'jrnl_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
        title: titleVal,
        content: contentVal,
        createdAt: nowIso,
        updatedAt: nowIso
      });
      saveJournalEntries(entries);
      showToast('Journal entry saved locally.');
    }

    resetJournalEditor();
  }

  function exportJournalAsTxt() {
    const entries = getJournalEntries().slice().sort(function (a, b) {
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });
    if (entries.length === 0) {
      showToast('No journal entries to export yet.');
      return;
    }

    const lines = [
      'BECOMING — PRIVATE JOURNAL EXPORT (UNENCRYPTED PLAIN TEXT)',
      'Exported on: ' + new Date().toLocaleString(),
      '==========================================================',
      ''
    ];

    entries.forEach(function (e) {
      lines.push('Title: ' + (e.title && e.title.trim() ? e.title.trim() : 'Untitled Entry'));
      lines.push('Created: ' + formatTimestamp(e.createdAt));
      if (e.updatedAt && e.updatedAt !== e.createdAt) {
        lines.push('Last Edited: ' + formatTimestamp(e.updatedAt));
      }
      lines.push('----------------------------------------------------------');
      lines.push(e.content || '');
      lines.push('');
      lines.push('==========================================================');
      lines.push('');
    });

    downloadTextFile('becoming-journal-' + getLocalDateKey() + '.txt', lines.join('\n'), 'text/plain;charset=utf-8');
    showToast('Downloaded journal (.TXT).');
  }

  function exportJournalAsJson() {
    const entries = getJournalEntries();
    if (entries.length === 0) {
      showToast('No journal entries to export yet.');
      return;
    }
    const payload = {
      application: 'Becoming',
      exportType: 'journal_entries',
      exportedAt: new Date().toISOString(),
      encrypted: false,
      entries: entries
    };
    downloadTextFile(
      'becoming-journal-' + getLocalDateKey() + '.json',
      JSON.stringify(payload, null, 2),
      'application/json;charset=utf-8'
    );
    showToast('Downloaded journal (.JSON).');
  }

  /* ------------------------------------------------------------------------
     15. RENDER PAGE 5: PAUSE CHAMBER (pause.html)
     ------------------------------------------------------------------------ */
  let pauseState = {
    mode: 'silence',
    status: 'idle',
    targetDurationSec: 300,
    startTimestampMs: null,
    accumulatedElapsedMs: 0,
    intervalId: null,
    soundEnabled: false
  };

  let audioCtx = null;
  let tideGainNode = null;
  let tideLfoId = null;

  function startAmbientSound() {
    if (!pauseState.soundEnabled || pauseState.status !== 'running') return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      if (!audioCtx) audioCtx = new AudioContextClass();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      stopAmbientSoundNodes();

      const bufferSize = audioCtx.sampleRate * 3;
      const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = output[i];
        output[i] *= 0.18;
      }

      const whiteNoise = audioCtx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 260;

      tideGainNode = audioCtx.createGain();
      tideGainNode.gain.setValueAtTime(0.01, audioCtx.currentTime);
      tideGainNode.gain.linearRampToValueAtTime(0.12, audioCtx.currentTime + 1.5);

      whiteNoise.connect(filter);
      filter.connect(tideGainNode);
      tideGainNode.connect(audioCtx.destination);
      whiteNoise.start(0);

      pauseState._noiseNode = whiteNoise;

      let phase = 0;
      tideLfoId = setInterval(function () {
        if (!audioCtx || !tideGainNode || pauseState.status !== 'running') return;
        phase += 0.25;
        const level = 0.08 + Math.sin(phase) * 0.04;
        tideGainNode.gain.setTargetAtTime(level, audioCtx.currentTime, 0.4);
      }, 400);
    } catch (e) {}
  }

  function stopAmbientSoundNodes() {
    if (tideLfoId) {
      clearInterval(tideLfoId);
      tideLfoId = null;
    }
    if (pauseState._noiseNode) {
      try {
        pauseState._noiseNode.stop();
        pauseState._noiseNode.disconnect();
      } catch (e) {}
      pauseState._noiseNode = null;
    }
    if (tideGainNode) {
      try {
        tideGainNode.disconnect();
      } catch (e) {}
      tideGainNode = null;
    }
  }

  function formatClock(totalSeconds) {
    const clamped = Math.max(0, Math.floor(totalSeconds));
    const mins = String(Math.floor(clamped / 60)).padStart(2, '0');
    const secs = String(clamped % 60).padStart(2, '0');
    return mins + ':' + secs;
  }

  function getTotalElapsedMs() {
    if (pauseState.status === 'running' && pauseState.startTimestampMs) {
      return pauseState.accumulatedElapsedMs + (Date.now() - pauseState.startTimestampMs);
    }
    return pauseState.accumulatedElapsedMs;
  }

  function syncPauseVisualizerUI() {
    const visualizer = byId('pause-visualizer');
    const timerDisplay = byId('pause-timer-display');
    if (!visualizer || !timerDisplay) return;

    const phaseLabel = byId('pause-phase-label');
    const startBtn = byId('pause-start-btn');
    const pauseBtn = byId('pause-pause-btn');
    const resumeBtn = byId('pause-resume-btn');
    const restartBtn = byId('pause-restart-btn');
    const endBtn = byId('pause-end-btn');
    const durationGroup = byId('pause-duration-group');

    visualizer.setAttribute('data-state', pauseState.status);
    visualizer.setAttribute('data-mode', pauseState.mode);

    if (durationGroup) {
      durationGroup.style.visibility = pauseState.mode === 'open' ? 'hidden' : 'visible';
    }

    const elapsedSec = getTotalElapsedMs() / 1000;
    const isOpenEnded = pauseState.mode === 'open' || pauseState.targetDurationSec === 0;

    if (pauseState.status === 'idle') {
      if (phaseLabel) {
        phaseLabel.textContent =
          pauseState.mode === 'breathing'
            ? 'Unhurried breathing'
            : pauseState.mode === 'open'
            ? 'Timer-free rest'
            : 'Ready when you are';
      }
      timerDisplay.textContent = isOpenEnded ? 'Open' : formatClock(pauseState.targetDurationSec);

      if (startBtn) startBtn.hidden = false;
      if (pauseBtn) pauseBtn.hidden = true;
      if (resumeBtn) resumeBtn.hidden = true;
      if (restartBtn) restartBtn.hidden = true;
      if (endBtn) endBtn.hidden = true;
      return;
    }

    if (startBtn) startBtn.hidden = true;
    if (pauseBtn) pauseBtn.hidden = pauseState.status !== 'running';
    if (resumeBtn) resumeBtn.hidden = pauseState.status !== 'paused';
    if (restartBtn) restartBtn.hidden = false;
    if (endBtn) endBtn.hidden = false;

    if (isOpenEnded) {
      timerDisplay.textContent = formatClock(elapsedSec);
    } else {
      const remainingSec = Math.ceil(pauseState.targetDurationSec - elapsedSec);
      timerDisplay.textContent = formatClock(remainingSec);
    }

    if (phaseLabel) {
      if (pauseState.status === 'paused') {
        phaseLabel.textContent = 'Paused';
      } else if (pauseState.mode === 'breathing') {
        const cyclePos = elapsedSec % 10;
        phaseLabel.textContent = cyclePos < 5 ? 'Breathe in gently...' : 'Release slowly...';
      } else if (pauseState.mode === 'open') {
        phaseLabel.textContent = 'Resting in open space';
      } else {
        phaseLabel.textContent = 'Sitting in stillness';
      }
    }
  }

  function tickPauseTimer() {
    if (pauseState.status !== 'running') return;
    const elapsedSec = getTotalElapsedMs() / 1000;
    const isOpenEnded = pauseState.mode === 'open' || pauseState.targetDurationSec === 0;

    if (!isOpenEnded && elapsedSec >= pauseState.targetDurationSec) {
      completePauseSession(true);
      return;
    }
    syncPauseVisualizerUI();
  }

  function startPauseSession() {
    const checkinPanel = byId('pause-checkin-panel');
    if (checkinPanel) checkinPanel.hidden = true;

    pauseState.status = 'running';
    pauseState.accumulatedElapsedMs = 0;
    pauseState.startTimestampMs = Date.now();

    if (pauseState.intervalId) clearInterval(pauseState.intervalId);
    pauseState.intervalId = setInterval(tickPauseTimer, 200);

    startAmbientSound();
    syncPauseVisualizerUI();
  }

  function pausePauseSession() {
    if (pauseState.status !== 'running') return;
    pauseState.accumulatedElapsedMs += Date.now() - pauseState.startTimestampMs;
    pauseState.startTimestampMs = null;
    pauseState.status = 'paused';

    if (pauseState.intervalId) {
      clearInterval(pauseState.intervalId);
      pauseState.intervalId = null;
    }
    stopAmbientSoundNodes();
    syncPauseVisualizerUI();
  }

  function resumePauseSession() {
    if (pauseState.status !== 'paused') return;
    pauseState.status = 'running';
    pauseState.startTimestampMs = Date.now();

    if (pauseState.intervalId) clearInterval(pauseState.intervalId);
    pauseState.intervalId = setInterval(tickPauseTimer, 200);

    startAmbientSound();
    syncPauseVisualizerUI();
  }

  function restartPauseSession() {
    stopAmbientSoundNodes();
    pauseState.accumulatedElapsedMs = 0;
    pauseState.startTimestampMs = Date.now();
    pauseState.status = 'running';

    if (pauseState.intervalId) clearInterval(pauseState.intervalId);
    pauseState.intervalId = setInterval(tickPauseTimer, 200);

    startAmbientSound();
    syncPauseVisualizerUI();
  }

  function completePauseSession(showCheckin) {
    const totalElapsedSec = Math.round(getTotalElapsedMs() / 1000);
    if (pauseState.intervalId) {
      clearInterval(pauseState.intervalId);
      pauseState.intervalId = null;
    }
    stopAmbientSoundNodes();

    pauseState.status = 'idle';
    pauseState.startTimestampMs = null;
    pauseState.accumulatedElapsedMs = 0;
    syncPauseVisualizerUI();

    if (showCheckin) {
      const checkinPanel = byId('pause-checkin-panel');
      const noteInput = byId('pause-checkin-note');
      if (checkinPanel) {
        checkinPanel.hidden = false;
        checkinPanel.setAttribute('data-last-duration', String(totalElapsedSec));
      }
      if (noteInput) {
        noteInput.value = '';
        noteInput.focus();
      }
    }
  }

  /* ------------------------------------------------------------------------
     16. RENDER PAGE 6: THOUGHT STUDIO (thoughts.html)
     ------------------------------------------------------------------------ */
  let currentThoughtStep = 1;

  function setThoughtStudioStep(stepNumber) {
    const target = Math.max(1, Math.min(5, Number(stepNumber) || 1));
    currentThoughtStep = target;

    document.querySelectorAll('.step-pill[data-thought-step]').forEach(function (pill) {
      const s = Number(pill.getAttribute('data-thought-step'));
      const isActive = s === target;
      pill.classList.toggle('is-active', isActive);
      pill.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    document.querySelectorAll('.ts-step-pane[data-ts-pane]').forEach(function (pane) {
      const s = Number(pane.getAttribute('data-ts-pane'));
      pane.hidden = s !== target;
      pane.classList.toggle('is-active', s === target);
    });

    const prevBtn = byId('ts-prev-btn');
    const nextBtn = byId('ts-next-btn');
    if (prevBtn) prevBtn.disabled = target === 1;
    if (nextBtn) nextBtn.disabled = target === 5;
  }

  function resetThoughtStudioForm() {
    if (!byId('ts-step1-input')) return;
    byId('ts-editing-id').value = '';
    byId('ts-step1-input').value = '';
    byId('ts-step2-context').value = '';
    byId('ts-step2-feeling').value = '';
    byId('ts-step2-fear').value = '';
    byId('ts-step3-supports').value = '';
    byId('ts-step3-omits').value = '';
    byId('ts-step4-balanced').value = '';
    byId('ts-step5-next').value = '';
    setText('ts-save-btn', 'Save Reflection');
    setThoughtStudioStep(1);
  }

  function handleSaveThoughtReflection() {
    if (!byId('ts-step1-input')) return;
    const editingId = byId('ts-editing-id').value;
    const fields = {
      notice: byId('ts-step1-input').value.trim(),
      context: byId('ts-step2-context').value.trim(),
      feeling: byId('ts-step2-feeling').value.trim(),
      fear: byId('ts-step2-fear').value.trim(),
      supports: byId('ts-step3-supports').value.trim(),
      omits: byId('ts-step3-omits').value.trim(),
      balanced: byId('ts-step4-balanced').value.trim(),
      nextStep: byId('ts-step5-next').value.trim()
    };

    const hasAnyContent = Object.values(fields).some(function (val) {
      return val.length > 0;
    });

    if (!hasAnyContent) {
      showToast('Write a response in any step before saving.');
      return;
    }

    const list = getThoughtReflections();
    const nowIso = new Date().toISOString();

    if (editingId) {
      const idx = list.findIndex(function (item) {
        return item.id === editingId;
      });
      if (idx >= 0) {
        list[idx] = Object.assign({}, list[idx], fields, { updatedAt: nowIso });
      }
      saveThoughtReflections(list);
      showToast('Thought reflection updated.');
    } else {
      list.push(
        Object.assign(
          {
            id: 'ts_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
            createdAt: nowIso,
            updatedAt: nowIso
          },
          fields
        )
      );
      saveThoughtReflections(list);
      showToast('Thought reflection saved.');
    }

    resetThoughtStudioForm();
    renderThoughtStudioView();
  }

  function renderThoughtStudioView() {
    const listEl = byId('ts-saved-list');
    if (!listEl) return;

    const reflections = getThoughtReflections().slice().sort(function (a, b) {
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });

    if (reflections.length === 0) {
      listEl.innerHTML =
        '<div class="empty-state-box">No saved thought reflections yet. You can save any reflection—even if you only fill out one step.</div>';
      return;
    }

    listEl.innerHTML = '';
    reflections.forEach(function (item) {
      const card = document.createElement('article');
      card.className = 'ts-saved-card';
      const headline = item.notice || item.balanced || 'Guided Reflection';

      card.innerHTML =
        '<div class="journal-entry-card__date">' + escapeHtml(formatTimestamp(item.createdAt)) + '</div>' +
        '<div class="ts-saved-card__thought">' + escapeHtml(headline) + '</div>' +
        (item.balanced
          ? '<div class="ts-saved-card__balance"><strong>Balanced view:</strong> ' + escapeHtml(item.balanced) + '</div>'
          : '') +
        (item.nextStep
          ? '<div style="font-size:0.82rem;color:var(--text-secondary);"><strong>Next step:</strong> ' + escapeHtml(item.nextStep) + '</div>'
          : '') +
        '<div class="journal-entry-card__actions">' +
          '<button type="button" class="text-link-btn" data-ts-edit="' + item.id + '">Revisit / Edit</button>' +
          '<button type="button" class="text-link-btn" style="color:var(--danger-color);" data-ts-delete="' + item.id + '">Delete</button>' +
        '</div>';

      listEl.appendChild(card);
    });
  }

  /* ------------------------------------------------------------------------
     17. RENDER PAGE 7: SETTINGS & PERSONALIZATION (settings.html)
     ------------------------------------------------------------------------ */
  function renderSettingsView() {
    const catGrid = byId('setting-categories-grid');
    if (!catGrid) return;

    const prefs = getPrefs();

    document.querySelectorAll('.choice-chip[data-theme-choice]').forEach(function (chip) {
      const choice = chip.getAttribute('data-theme-choice');
      const isSelected = (prefs.theme || 'dark') === choice;
      chip.classList.toggle('is-active', isSelected);
      chip.setAttribute('aria-checked', isSelected ? 'true' : 'false');
    });

    const motionToggle = byId('setting-reduced-motion');
    if (motionToggle) motionToggle.checked = Boolean(prefs.reducedMotion);

    const startSelect = byId('setting-start-section');
    if (startSelect) startSelect.value = prefs.startSection || 'today';

    const durationSelect = byId('setting-default-duration');
    if (durationSelect) durationSelect.value = prefs.defaultDuration || 'any';

    const selectedCats = Array.isArray(prefs.preferredCategories) ? prefs.preferredCategories : [];
    catGrid.innerHTML = '';
    ALL_CATEGORIES.forEach(function (categoryName) {
      const isSelected = selectedCats.includes(categoryName);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'category-filter-chip' + (isSelected ? ' is-active' : '');
      btn.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
      btn.textContent = categoryName;

      btn.addEventListener('click', function () {
        const currentPrefs = getPrefs();
        const currentList = Array.isArray(currentPrefs.preferredCategories)
          ? currentPrefs.preferredCategories.slice()
          : [];
        const idx = currentList.indexOf(categoryName);
        if (idx >= 0) {
          currentList.splice(idx, 1);
        } else {
          currentList.push(categoryName);
        }
        savePrefs({ preferredCategories: currentList });
        renderSettingsView();
      });

      catGrid.appendChild(btn);
    });

    const hiddenListEl = byId('setting-hidden-list');
    const restoreAllBtn = byId('setting-restore-all-hidden');
    if (hiddenListEl) {
      const hiddenIds = Array.isArray(prefs.hiddenActivities) ? prefs.hiddenActivities : [];
      if (restoreAllBtn) restoreAllBtn.hidden = hiddenIds.length === 0;

      if (hiddenIds.length === 0) {
        hiddenListEl.innerHTML =
          '<div class="empty-state-box">No activities are currently hidden. All 35 weekly invitations are active.</div>';
      } else {
        hiddenListEl.innerHTML = '';
        hiddenIds.forEach(function (actId) {
          const act = ACTIVITY_BY_ID[actId];
          if (!act) return;
          const row = document.createElement('div');
          row.className = 'hidden-activity-item';
          row.innerHTML =
            '<div>' +
              '<strong>' + escapeHtml(act.title) + '</strong>' +
              '<span style="color:var(--text-secondary);font-size:0.8rem;margin-left:0.5rem;">(' +
                escapeHtml(act.weekday) + ' · ' + escapeHtml(act.category) +
              ')</span>' +
            '</div>' +
            '<button type="button" class="text-link-btn" data-restore-hidden-id="' + act.id + '">Restore</button>';
          hiddenListEl.appendChild(row);
        });
      }
    }
  }

  function exportCompleteBackupJson() {
    const backupPayload = {
      application: 'Becoming — Digital Sanctuary',
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      encrypted: false,
      privacyNote: 'Unencrypted JSON backup of your local Becoming data. Store it in a private location.',
      data: {
        preferences: getPrefs(),
        completions: getCompletions(),
        journal: getJournalEntries(),
        thoughtReflections: getThoughtReflections(),
        weeklyReflections: getWeeklyReflections(),
        pauses: safeReadStorage(STORAGE_KEYS.PAUSES, [])
      }
    };

    downloadTextFile(
      'becoming-full-backup-' + getLocalDateKey() + '.json',
      JSON.stringify(backupPayload, null, 2),
      'application/json;charset=utf-8'
    );
    showToast('Complete JSON backup downloaded.');
  }

  /* ------------------------------------------------------------------------
     18. INITIALIZE CURRENT PAGE & SHARED LISTENERS
     ------------------------------------------------------------------------ */
  function initBecomingApp() {
    applyThemeAndMotion();

    // Honor "Preferred Starting Section" once per browser session when opening index.html
    try {
      const currentPage = getCurrentPage();
      if (currentPage === 'today' && !sessionStorage.getItem('becoming_session_started')) {
        sessionStorage.setItem('becoming_session_started', 'true');
        const startPref = getPrefs().startSection || 'today';
        if (startPref !== 'today' && PAGE_FILES[startPref]) {
          window.location.replace(PAGE_FILES[startPref]);
          return;
        }
      } else {
        sessionStorage.setItem('becoming_session_started', 'true');
      }
    } catch (e) {}

    // Header Greeting & Local Date (present on all 7 pages)
    const idx = new Date().getDate() % GROUNDED_GREETINGS.length;
    setText('header-greeting', GROUNDED_GREETINGS[idx]);
    setText('header-date', formatReadableDate(new Date(), true));

    // Quick Theme Toggle in Header
    on('quick-theme-btn', 'click', function () {
      const currentAttr = document.documentElement.getAttribute('data-theme');
      const nextTheme = currentAttr === 'light' ? 'dark' : 'light';
      savePrefs({ theme: nextTheme });
      applyThemeAndMotion();
      renderSettingsView();
    });

    // Today's Space listeners
    on('choose-for-me-btn', 'click', handleChooseForMe);
    on('today-restore-hidden-btn', 'click', function () {
      savePrefs({ hiddenActivities: [] });
      refreshCurrentPage();
      showToast('Restored all hidden activities.');
    });

    // Your Week listeners
    on('week-prev-btn', 'click', function () {
      currentWeekOffset -= 1;
      renderWeekView();
    });
    on('week-next-btn', 'click', function () {
      currentWeekOffset += 1;
      renderWeekView();
    });
    on('week-current-btn', 'click', function () {
      currentWeekOffset = 0;
      selectedWeekDayIndex = getIsoWeekday(new Date());
      renderWeekView();
    });

    // Activity Modal listeners
    on('modal-close-btn', 'click', closeActivityModal);
    on('modal-cancel-btn', 'click', closeActivityModal);
    on('activity-modal-backdrop', 'click', function (e) {
      if (e.target.id === 'activity-modal-backdrop') closeActivityModal();
    });
    on('modal-standard-tab', 'click', function () {
      setModalApproachTab(false);
    });
    on('modal-smaller-tab', 'click', function () {
      setModalApproachTab(true);
    });
    on('modal-timer-toggle-btn', 'click', toggleModalTimer);
    on('modal-timer-reset-btn', 'click', function () {
      stopModalTimer();
      modalTimerState.remainingSeconds = modalTimerState.targetSeconds;
      updateModalTimerDisplay();
    });

    document.querySelectorAll('[data-modal-timer-set]').forEach(function (chip) {
      chip.addEventListener('click', function () {
        stopModalTimer();
        const secs = Number(chip.getAttribute('data-modal-timer-set')) || 300;
        modalTimerState.targetSeconds = secs;
        modalTimerState.remainingSeconds = secs;
        updateModalTimerDisplay();
      });
    });

    on('voice-record-btn', 'click', startVoiceRecording);
    on('voice-stop-btn', 'click', stopVoiceRecording);
    on('memory-photo-input', 'change', handleMemoryPhotoUpload);
    on('memory-photo-remove-btn', 'click', function () {
      activeModalContext.memoryPhotoDataUrl = null;
      const wrap = byId('memory-photo-preview-wrap');
      const input = byId('memory-photo-input');
      if (wrap) wrap.hidden = true;
      if (input) input.value = '';
    });

    on('modal-complete-btn', 'click', function () {
      const refInput = byId('modal-reflection-input');
      const reflectionText = refInput ? refInput.value : '';
      const ok = setActivityCompletion(activeModalContext.dateKey, activeModalContext.activityId, {
        reflection: reflectionText,
        usedSmaller: activeModalContext.usingSmaller,
        memoryPhotoDataUrl: activeModalContext.memoryPhotoDataUrl
      });
      if (ok) {
        closeActivityModal();
        showToast('Saved to your space.');
      }
    });

    on('modal-hide-btn', 'click', function () {
      const act = ACTIVITY_BY_ID[activeModalContext.activityId];
      if (!act) return;
      const prefs = getPrefs();
      const hidden = Array.isArray(prefs.hiddenActivities) ? prefs.hiddenActivities : [];
      if (!hidden.includes(act.id)) {
        hidden.push(act.id);
        savePrefs({ hiddenActivities: hidden });
      }
      closeActivityModal();
      refreshCurrentPage();
      showToast('Hidden "' + act.title + '". You can restore it anytime in Settings.');
    });

    on('modal-swap-btn', 'click', openSwapModal);
    on('swap-modal-close-btn', 'click', function () {
      const sb = byId('swap-modal-backdrop');
      if (sb) sb.hidden = true;
    });
    on('swap-modal-backdrop', 'click', function (e) {
      if (e.target.id === 'swap-modal-backdrop') e.target.hidden = true;
    });

    // My Journey listeners
    on('cal-prev-btn', 'click', function () {
      calViewMonth -= 1;
      if (calViewMonth < 0) {
        calViewMonth = 11;
        calViewYear -= 1;
      }
      renderParticipationCalendar(getCompletions());
    });
    on('cal-next-btn', 'click', function () {
      calViewMonth += 1;
      if (calViewMonth > 11) {
        calViewMonth = 0;
        calViewYear += 1;
      }
      renderParticipationCalendar(getCompletions());
    });
    on('journey-new-prompt-btn', 'click', function () {
      currentWeeklyPromptIndex = (currentWeeklyPromptIndex + 1) % WEEKLY_CHECKIN_PROMPTS.length;
      setText('journey-weekly-prompt-text', '"' + WEEKLY_CHECKIN_PROMPTS[currentWeeklyPromptIndex] + '"');
    });
    on('journey-save-weekly-btn', 'click', function () {
      const input = byId('journey-weekly-reflection-input');
      const val = input ? input.value.trim() : '';
      if (!val) {
        showToast('Write a short reflection first, or leave it for whenever you feel ready.');
        return;
      }
      const list = getWeeklyReflections();
      list.push({
        id: 'wkref_' + Date.now(),
        dateKey: getLocalDateKey(),
        timestamp: new Date().toISOString(),
        prompt: WEEKLY_CHECKIN_PROMPTS[currentWeeklyPromptIndex],
        text: val
      });
      saveWeeklyReflections(list);
      input.value = '';
      renderJourneyView();
      showToast('Weekly reflection saved to My Journey.');
    });

    document.querySelectorAll('.history-tab[data-journey-tab]').forEach(function (tabBtn) {
      tabBtn.addEventListener('click', function () {
        const target = tabBtn.getAttribute('data-journey-tab');
        document.querySelectorAll('.history-tab[data-journey-tab]').forEach(function (b) {
          const isMatch = b.getAttribute('data-journey-tab') === target;
          b.classList.toggle('is-active', isMatch);
          b.setAttribute('aria-selected', isMatch ? 'true' : 'false');
        });
        const tlPanel = byId('journey-timeline-panel');
        const rfPanel = byId('journey-reflections-panel');
        if (tlPanel) tlPanel.hidden = target !== 'timeline';
        if (rfPanel) rfPanel.hidden = target !== 'reflections';
      });
    });

    // Journal listeners
    on('journal-prompts-toggle', 'click', function () {
      const drawer = byId('journal-prompts-drawer');
      const toggle = byId('journal-prompts-toggle');
      if (!drawer || !toggle) return;
      const isHidden = drawer.hidden;
      drawer.hidden = !isHidden;
      toggle.setAttribute('aria-expanded', isHidden ? 'true' : 'false');
    });
    on('journal-save-btn', 'click', handleSaveJournalEntry);
    on('journal-clear-btn', 'click', resetJournalEditor);
    on('journal-search-input', 'input', renderJournalArchiveList);
    on('journal-export-txt-btn', 'click', exportJournalAsTxt);
    on('journal-export-json-btn', 'click', exportJournalAsJson);

    // Pause listeners
    document.querySelectorAll('.pause-mode-tab[data-pause-mode]').forEach(function (tab) {
      tab.addEventListener('click', function () {
        const newMode = tab.getAttribute('data-pause-mode');
        if (pauseState.status !== 'idle') completePauseSession(false);
        pauseState.mode = newMode;

        document.querySelectorAll('.pause-mode-tab[data-pause-mode]').forEach(function (t) {
          const isMatch = t.getAttribute('data-pause-mode') === newMode;
          t.classList.toggle('is-active', isMatch);
          t.setAttribute('aria-selected', isMatch ? 'true' : 'false');
        });

        if (PAUSE_MODE_DESCRIPTIONS[newMode]) {
          setText('pause-mode-description', PAUSE_MODE_DESCRIPTIONS[newMode]);
        }
        syncPauseVisualizerUI();
      });
    });

    document.querySelectorAll('.duration-pill[data-pause-duration]').forEach(function (pill) {
      pill.addEventListener('click', function () {
        const secs = Number(pill.getAttribute('data-pause-duration'));
        pauseState.targetDurationSec = secs;
        document.querySelectorAll('.duration-pill[data-pause-duration]').forEach(function (p) {
          p.classList.toggle('is-active', Number(p.getAttribute('data-pause-duration')) === secs);
        });
        if (pauseState.status === 'idle') syncPauseVisualizerUI();
      });
    });

    on('pause-sound-btn', 'click', function () {
      const soundBtn = byId('pause-sound-btn');
      const soundWavePath = byId('sound-wave-path');
      pauseState.soundEnabled = !pauseState.soundEnabled;
      if (soundBtn) soundBtn.setAttribute('aria-pressed', pauseState.soundEnabled ? 'true' : 'false');
      setText('pause-sound-label', pauseState.soundEnabled ? 'Sound: Ocean Tide' : 'Sound: Off');
      if (soundWavePath) soundWavePath.setAttribute('opacity', pauseState.soundEnabled ? '1' : '0.35');
      if (pauseState.soundEnabled && pauseState.status === 'running') {
        startAmbientSound();
      } else {
        stopAmbientSoundNodes();
      }
    });

    on('pause-start-btn', 'click', startPauseSession);
    on('pause-pause-btn', 'click', pausePauseSession);
    on('pause-resume-btn', 'click', resumePauseSession);
    on('pause-restart-btn', 'click', restartPauseSession);
    on('pause-end-btn', 'click', function () {
      completePauseSession(true);
    });
    on('pause-checkin-dismiss-btn', 'click', function () {
      const cp = byId('pause-checkin-panel');
      if (cp) cp.hidden = true;
    });
    on('pause-checkin-save-btn', 'click', function () {
      const noteIn = byId('pause-checkin-note');
      const cp = byId('pause-checkin-panel');
      const durationSec = cp ? Number(cp.getAttribute('data-last-duration') || 0) : 0;
      const list = safeReadStorage(STORAGE_KEYS.PAUSES, []);
      const validList = Array.isArray(list) ? list : [];
      validList.push({
        id: 'pause_' + Date.now(),
        dateKey: getLocalDateKey(),
        timestamp: new Date().toISOString(),
        mode: pauseState.mode,
        durationSeconds: durationSec,
        note: noteIn ? noteIn.value.trim() : ''
      });
      safeWriteStorage(STORAGE_KEYS.PAUSES, validList);
      if (cp) cp.hidden = true;
      showToast('Saved to your quiet space.');
    });

    document.addEventListener('visibilitychange', function () {
      if (!document.hidden && pauseState.status === 'running') {
        tickPauseTimer();
      }
    });

    // Thought Studio listeners
    document.querySelectorAll('.step-pill[data-thought-step]').forEach(function (pill) {
      pill.addEventListener('click', function () {
        setThoughtStudioStep(Number(pill.getAttribute('data-thought-step')));
      });
    });
    on('ts-prev-btn', 'click', function () {
      if (currentThoughtStep > 1) setThoughtStudioStep(currentThoughtStep - 1);
    });
    on('ts-next-btn', 'click', function () {
      if (currentThoughtStep < 5) setThoughtStudioStep(currentThoughtStep + 1);
    });
    on('ts-reset-btn', 'click', resetThoughtStudioForm);
    on('ts-save-btn', 'click', handleSaveThoughtReflection);

    // Settings listeners
    document.querySelectorAll('.choice-chip[data-theme-choice]').forEach(function (chip) {
      chip.addEventListener('click', function () {
        const themeChoice = chip.getAttribute('data-theme-choice');
        savePrefs({ theme: themeChoice });
        applyThemeAndMotion();
        renderSettingsView();
        showToast('Theme updated.');
      });
    });

    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', function () {
      if (getPrefs().theme === 'system') applyThemeAndMotion();
    });

    on('setting-reduced-motion', 'change', function (e) {
      savePrefs({ reducedMotion: e.target.checked });
      applyThemeAndMotion();
      showToast(e.target.checked ? 'Reduced motion enabled.' : 'Standard motion restored.');
    });

    on('setting-start-section', 'change', function (e) {
      savePrefs({ startSection: e.target.value });
      showToast('Preferred starting section saved.');
    });

    on('setting-default-duration', 'change', function (e) {
      savePrefs({ defaultDuration: e.target.value });
      showToast('Preferred activity duration updated.');
    });

    on('setting-restore-all-hidden', 'click', function () {
      savePrefs({ hiddenActivities: [] });
      renderSettingsView();
      showToast('All hidden activities restored.');
    });

    on('data-export-all-btn', 'click', exportCompleteBackupJson);
    on('data-export-journal-btn', 'click', exportJournalAsTxt);

    on('data-reset-activities-btn', 'click', function () {
      requestConfirm({
        title: 'Reset Activity History',
        description: 'This will clear all completed activity records and weekly check-ins. Your journal entries, thought reflections, and settings will not be touched.',
        confirmText: 'Reset Activity History',
        onConfirm: function () {
          saveCompletions({});
          safeWriteStorage(STORAGE_KEYS.WEEKLY_REFLECTIONS, []);
          refreshCurrentPage();
          showToast('Activity history has been reset.');
        }
      });
    });

    on('data-reset-thoughts-btn', 'click', function () {
      requestConfirm({
        title: 'Delete Saved Thought Reflections',
        description: 'This will permanently delete all saved reflections from Thought Studio.',
        confirmText: 'Delete Thought Reflections',
        onConfirm: function () {
          saveThoughtReflections([]);
          resetThoughtStudioForm();
          renderThoughtStudioView();
          showToast('All Thought Studio reflections deleted.');
        }
      });
    });

    on('data-clear-all-btn', 'click', function () {
      requestConfirm({
        title: 'Clear All Application Data',
        description: 'This will permanently remove all completed activities, journal entries, thought reflections, pause notes, and custom preferences stored in this browser.',
        confirmText: 'Clear Everything',
        onConfirm: function () {
          Object.values(STORAGE_KEYS).forEach(function (k) {
            localStorage.removeItem(k);
          });
          applyThemeAndMotion();
          refreshCurrentPage();
          showToast('All local application data has been cleared.');
        }
      });
    });

    // Confirmation Modal listeners
    on('confirm-cancel-btn', 'click', closeConfirmModal);
    on('confirm-accept-btn', 'click', function () {
      const cb = pendingConfirmCallback;
      closeConfirmModal();
      if (typeof cb === 'function') cb();
    });

    // Delegated click handler for dynamically rendered cards across all pages
    document.addEventListener('click', function (e) {
      const openBtn = e.target.closest('[data-open-activity]');
      if (openBtn) {
        openActivityModal(
          openBtn.getAttribute('data-open-activity'),
          openBtn.getAttribute('data-date-key') || getLocalDateKey(),
          Number(openBtn.getAttribute('data-slot-index') || 0)
        );
        return;
      }

      const toggleBtn = e.target.closest('[data-quick-toggle]');
      if (toggleBtn) {
        const actId = toggleBtn.getAttribute('data-quick-toggle');
        const dKey = toggleBtn.getAttribute('data-date-key') || getLocalDateKey();
        if (isActivityCompletedOnDate(dKey, actId)) {
          removeActivityCompletion(dKey, actId);
          showToast('Completion removed.');
        } else {
          if (setActivityCompletion(dKey, actId, {})) {
            showToast('Saved. One small step counts.');
          }
        }
        return;
      }

      const restoreBtn = e.target.closest('[data-restore-hidden-id]');
      if (restoreBtn) {
        const actId = restoreBtn.getAttribute('data-restore-hidden-id');
        const prefs = getPrefs();
        const updated = (prefs.hiddenActivities || []).filter(function (id) {
          return id !== actId;
        });
        savePrefs({ hiddenActivities: updated });
        renderSettingsView();
        showToast('Activity restored to your schedule.');
        return;
      }

      const jrnlEditBtn = e.target.closest('[data-journal-edit]');
      if (jrnlEditBtn) {
        const id = jrnlEditBtn.getAttribute('data-journal-edit');
        const entry = getJournalEntries().find(function (item) {
          return item.id === id;
        });
        if (!entry) return;
        byId('journal-editing-id').value = entry.id;
        byId('journal-title-input').value = entry.title || '';
        byId('journal-content-input').value = entry.content || '';
        setText('journal-editor-mode', 'Editing Saved Entry');
        setText('journal-editor-meta', 'Created ' + formatTimestamp(entry.createdAt));
        renderJournalArchiveList();
        byId('journal-content-input').focus();
        return;
      }

      const jrnlDelBtn = e.target.closest('[data-journal-delete]');
      if (jrnlDelBtn) {
        const id = jrnlDelBtn.getAttribute('data-journal-delete');
        requestConfirm({
          title: 'Delete Journal Entry',
          description: 'Are you sure you want to permanently delete this journal entry from your browser?',
          confirmText: 'Delete Entry',
          onConfirm: function () {
            const remaining = getJournalEntries().filter(function (item) {
              return item.id !== id;
            });
            saveJournalEntries(remaining);
            if (byId('journal-editing-id') && byId('journal-editing-id').value === id) {
              resetJournalEditor();
            } else {
              renderJournalArchiveList();
            }
            showToast('Journal entry deleted.');
          }
        });
        return;
      }

      const tsEditBtn = e.target.closest('[data-ts-edit]');
      if (tsEditBtn) {
        const id = tsEditBtn.getAttribute('data-ts-edit');
        const item = getThoughtReflections().find(function (r) {
          return r.id === id;
        });
        if (!item) return;
        byId('ts-editing-id').value = item.id;
        byId('ts-step1-input').value = item.notice || '';
        byId('ts-step2-context').value = item.context || '';
        byId('ts-step2-feeling').value = item.feeling || '';
        byId('ts-step2-fear').value = item.fear || '';
        byId('ts-step3-supports').value = item.supports || '';
        byId('ts-step3-omits').value = item.omits || '';
        byId('ts-step4-balanced').value = item.balanced || '';
        byId('ts-step5-next').value = item.nextStep || '';
        setText('ts-save-btn', 'Update Reflection');
        setThoughtStudioStep(1);
        byId('ts-step1-input').focus();
        showToast('Loaded reflection into Thought Studio.');
        return;
      }

      const tsDelBtn = e.target.closest('[data-ts-delete]');
      if (tsDelBtn) {
        const id = tsDelBtn.getAttribute('data-ts-delete');
        requestConfirm({
          title: 'Delete Thought Reflection',
          description: 'Remove this saved reflection from your browser?',
          confirmText: 'Delete Reflection',
          onConfirm: function () {
            const remaining = getThoughtReflections().filter(function (r) {
              return r.id !== id;
            });
            saveThoughtReflections(remaining);
            if (byId('ts-editing-id') && byId('ts-editing-id').value === id) {
              resetThoughtStudioForm();
            }
            renderThoughtStudioView();
            showToast('Thought reflection deleted.');
          }
        });
      }
    });

    // Global Escape key to close any open modal on the current page
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        const cm = byId('confirm-modal-backdrop');
        const sm = byId('swap-modal-backdrop');
        const am = byId('activity-modal-backdrop');
        if (cm && !cm.hidden) closeConfirmModal();
        else if (sm && !sm.hidden) sm.hidden = true;
        else if (am && !am.hidden) closeActivityModal();
      }
    });

    // Render whichever page is currently open!
    refreshCurrentPage();
    syncPauseVisualizerUI();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBecomingApp);
  } else {
    initBecomingApp();
  }
})(window.Becoming);

if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('./sw.js').catch(function () {});
  });
}
