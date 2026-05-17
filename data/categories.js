// Default category seed for the 168-hour audit.
// Users can add/remove/rename rows in the app; this is just the starting template,
// based on Doug McGowan's digital-garden note "168 — Audit Your Week".
//
// Each row has:
//   id          — stable identifier (used as React key analogue + storage key)
//   category    — top-level bucket label
//   sub         — sub-category label (the actual row)
//   group       — emoji / glyph hint for the category (visual only)
//   hint        — short tooltip / helper text shown on the row
//
// Totals are computed on the client. The "TOTAL" line is rendered automatically.

const DEFAULT_ROWS = [
  { id: "work-mandatory",  category: "Work",                 sub: "Mandatory Work",                         group: "💼", hint: "Job hours you're obligated to put in." },
  { id: "work-extra",      category: "Work",                 sub: "Extra Work (Voluntary)",                 group: "💼", hint: "Side projects, optional overtime, freelance." },
  { id: "sleep",           category: "Sleep",                sub: "Sleep",                                  group: "💤", hint: "Aim for 49–56h/week (7–8h × 7)." },
  { id: "eat-group",       category: "Eating w/ People",     sub: "Group Lunches",                          group: "🍽️", hint: "Shared meals — work, friends, ministry." },
  { id: "eat-family",      category: "Eating w/ People",     sub: "Time with Family",                       group: "🍽️", hint: "Family meals + family-only time." },
  { id: "trans-alone",     category: "Transit / Maintenance", sub: "Eating Alone / Housekeeping",           group: "🏠", hint: "Solo meals, tidying, laundry." },
  { id: "trans-commute",   category: "Transit / Maintenance", sub: "Commute (Non-Productive)",              group: "🏠", hint: "Driving where you must pay attention." },
  { id: "trans-hygiene",   category: "Transit / Maintenance", sub: "Hygiene / Getting Dressed",             group: "🏠", hint: "Shower, grooming, dressing." },
  { id: "trans-cook",      category: "Transit / Maintenance", sub: "Cooking",                               group: "🏠", hint: "Meal prep + cleanup." },
  { id: "trans-medical",   category: "Transit / Maintenance", sub: "Medical",                               group: "🏠", hint: "Appointments, recovery." },
  { id: "trans-admin",     category: "Transit / Maintenance", sub: "Organization / Admin",                  group: "🏠", hint: "Email, paperwork, planning." },
  { id: "trans-prod",      category: "Productive Transit",   sub: "Train/Bus (Workable time)",              group: "🚌", hint: "Transit you can read / work during." },
  { id: "god-individual",  category: "God Time",             sub: "Individual (Prayer, Bible consumption)", group: "🕊️", hint: "Prayer, reading, listening to sermons." },
  { id: "god-communal",    category: "God Time",             sub: "Communal (Church, Group)",               group: "🕊️", hint: "Church, small group, TC." },
  { id: "play-friends",    category: "Play",                 sub: "Hangout with Friends",                   group: "🎮", hint: "Non-meal social time with friends." },
  { id: "play-media",      category: "Play",                 sub: "Media (Movies, Scrolling, audio, etc.)", group: "🎮", hint: "Passive entertainment, social media." },
  { id: "play-hobby",      category: "Play",                 sub: "Personal Hobby",                         group: "🎮", hint: "Active leisure (music, sports, craft)." },
  { id: "rest-sabbath",    category: "Rest",                 sub: "Sabbath / Quiet Rest",                   group: "🕊️", hint: "Solitude with God. Not the same as play." },
  { id: "other-exercise",  category: "Other",                sub: "Exercise",                               group: "🏃", hint: "Intentional workout time." },
  { id: "other-travel",    category: "Other",                sub: "Non-Regular Travel",                     group: "🏃", hint: "Trips, long drives, weekend visits." }
];

// Reference definitions — shown in the collapsible "Recommended categories" panel.
const REFERENCE = [
  {
    group: "Work",
    glyph: "💼",
    bullets: [
      "Mandatory work",
      "Extra work (that you choose to do)"
    ]
  },
  {
    group: "Transit Time (Maintenance)",
    glyph: "🏠",
    bullets: [
      "Housekeeping: Hygiene, cooking, getting dressed, organization.",
      "Transport (Non-Productive): Driving (where you must pay attention).",
      "Productive Transport: Train/Bus rides where you can work (log under Work or Study)."
    ]
  },
  {
    group: "God Time",
    glyph: "🕊️",
    bullets: [
      "Individual: Prayer, reading, listening to sermons.",
      "Communal: Church, small group, TC."
    ]
  },
  {
    group: "Eating & People",
    glyph: "🍽️",
    bullets: [
      "Group lunches.",
      "Time with family.",
      "Eating alone usually counts as Housekeeping / Maintenance."
    ]
  },
  {
    group: "Play vs. Rest",
    glyph: "🎮",
    bullets: [
      "Play: hanging out, media, personal hobbies.",
      "Rest (Sabbath) is not the same as play.",
      "Introverts: rest often does NOT overlap with hanging out time.",
      "Extroverts: rest still requires solitude with God."
    ]
  },
  {
    group: "Other",
    glyph: "🏃",
    bullets: [
      "Exercise.",
      "Non-regular travel."
    ]
  }
];

// Reflection prompts — shown collapsed under the verdict panel.
const REFLECTION = {
  ideal: [
    "If your ideal week is **over 168 hours**: what needs to be cut?",
    "If your ideal week is **under 168 hours**: where's the room to be more ambitious?"
  ],
  actual: [
    "If your actual week runs **over 168 hours**: when the rubber meets the road, what *actually* gets dropped first?",
    "If your actual week runs **under 168 hours**: what's filling your “free” time that you aren't accounting for?"
  ],
  vital: [
    "Often the first things to drop are sleep, quiet time, exercise, organization, and time with people.",
    "**Are those actually the least valuable things?**",
    "If not, how do you arrange your weeks so that the *least important* thing drops first?",
    "Remember the Sabbath — it was a command, not a suggestion.",
    "But also remember the Sabbath was made for man, not the other way around."
  ]
};

module.exports = {
  DEFAULT_ROWS,
  REFERENCE,
  REFLECTION,
  TARGET_HOURS: 168
};
