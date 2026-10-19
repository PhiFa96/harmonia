import { contentMessages } from '@harmonia/i18n/content-messages';
import levelThreeExercise from './level-three-exercise.json' with { type: 'json' };
import levelFourExercise from './level-four-exercise.json' with { type: 'json' };
// Texte der Oberfläche auf Englisch (US). Muss alle Schlüssel aus de.ts haben.

import type { Messages } from './types.ts';

export const enUS = {
  voice: {
    privacy:
      'The microphone processes sound on your device. Captured pitches are saved as exercise answers; no audio recording is saved or uploaded. The microphone stops when you leave or move to the background.',
    helpTone: 'Play help tone (counts as a hint)',
    detected: 'Detected: {{note}}',
    waiting: 'Waiting for a sustained note…',
    capture: 'Use this note',
    progress: '{{count}} of {{total}} notes captured',
    retry: 'Record notes again',
    skip: 'Skip this microphone exercise',
  },
  tuner: {
    title: 'Tuner',
    entry: 'Check your pitch while singing or playing.',
    open: 'Open tuner',
    intro: 'Play or sing one sustained note in a quiet place.',
    privacyTitle: 'Microphone access',
    privacy:
      'The microphone starts only when you press the button. Audio is processed on this device, never saved or uploaded. It stops when you leave or move to the background.',
    reference: 'Reference A: {{hz}} Hz',
    start: 'Start microphone',
    stop: 'Stop microphone',
    requesting: 'Requesting microphone access…',
    permission: 'Microphone access denied. Allow access in device settings and try again.',
    interrupted: 'Microphone connection interrupted. Start it again.',
    unavailable: 'The microphone is unavailable. Check your device and browser permissions.',
    silent: 'Waiting for a note…',
    unstable: 'Hold one note a little longer.',
    frequency: '{{hz}} Hz',
    cents: '{{cents}} cents',
    direction_low: 'Too low',
    direction_center: 'In tune',
    direction_high: 'Too high',
    scale: 'Center is in tune; left is low, right is high.',
  },
  friends: {
    title: 'Friends and friend quests',
    entry: 'Learn with invited friends and reach a weekly goal together.',
    open: 'Open friends',
    guest: 'You need an account and an internet connection for friendships.',
    rules:
      'Friends join only through an invitation link or code. There is no contact or name search. Friends can see your current learning streak and league tier. A quest counts only newly confirmed XP after it starts; the week ends Monday at 00:00 UTC.',
    loading: 'Loading friends…',
    refresh: 'Refresh friends',
    error_auth: 'Please sign in again.',
    error_missing: 'This invitation or friendship is no longer available.',
    error_retry: 'Another change is in progress. Try again.',
    error_limit: 'A friend list is full (50 friends maximum).',
    error_quest_active: 'One person already has a quest this week.',
    error_unavailable: 'Confirmed friend status could not be loaded.',
    inviteTitle: 'Invitation',
    createInvite: 'Create invitation link',
    inviteExpiry: 'Valid until {{date}}',
    share: 'Share or copy link',
    shareMessage: 'Harmonia friendship: {{link}}\nInvitation code: {{code}}',
    code: 'Invitation code or link',
    accept: 'Accept invitation',
    listTitle: 'Your friends',
    empty: 'No confirmed friends yet.',
    friend: 'Friend {{count}}',
    stats: 'Learning streak: {{streak}} days · League tier: {{tier}}',
    startQuest: 'Start a weekly quest together',
    remove: 'Remove',
    block: 'Block',
    confirmRemove: 'Remove this friendship and any active quest together?',
    confirmBlock: 'Block this person and end any active quest together?',
    confirm: 'Confirm',
    cancel: 'Cancel',
    questTitle: 'Weekly quest',
    questEmpty: 'Choose a confirmed friend this week. Goal: 300 new XP together.',
    questUsed:
      'Your weekly quest has already started or ended. You can start another from Monday (UTC).',
    questPartner: 'With friend {{number}}',
    questProgress: 'You: {{own}} XP · Friend: {{friend}} XP · Goal: {{target}} XP',
    questActive: 'Runs through Sunday (UTC).',
    questCompleted: 'Complete! You both earned a quest badge.',
    badges: 'Quest badges: {{count}}',
    blockedTitle: 'Blocked people',
    blocked: 'Blocked person {{count}}',
    unblock: 'Unblock',
  },
  puzzle: {
    title: 'Daily puzzle',
    entry: 'One shared question every day. Difficulty rises through Sunday.',
    open: "Open today's puzzle",
    guest: 'You need an account and an internet connection for your puzzle streak.',
    loading: 'Loading puzzle…',
    error: 'The puzzle could not be loaded or confirmed. Try again.',
    newDay: 'A new puzzle day has begun. Load today’s puzzle.',
    reload: 'Reload puzzle',
    day: 'Puzzle for {{day}}',
    streak_one: 'Puzzle streak: {{count}} day',
    streak_other: 'Puzzle streak: {{count}} days',
    reset: 'New puzzle at midnight ({{zone}}).',
    difficulty: 'Difficulty level {{count}}',
    unavailable: 'No approved puzzle is available for this day yet.',
    oneAttempt: "One attempt for today's puzzle",
    correct: 'Solved!',
    incorrect: 'Not solved today.',
    tomorrow: 'The next puzzle arrives tomorrow.',
    share: 'Share or copy result',
    shareText: 'Harmonia puzzle {{day}} {{symbol}} · Streak: {{streak}}',
  },
  duel: {
    title: 'Duels',
    entry: 'Play for three minutes against another person or a real recorded Rush run.',
    open: 'Open duels',
    guest: 'You need an account and an internet connection for duels.',
    loading: 'Loading duel progress…',
    error: 'Confirmed duel progress could not be loaded. Try again.',
    reload: 'Reload progress',
    kind_live: 'Live duel',
    kind_friend: 'Invitation duel',
    kind_ghost: 'Ghost duel',
    ghostDisclosure:
      'You are playing against a recording of a real Rush run. The ghost is not live, and this duel does not change your rating.',
    friendDisclosure:
      'This duel was started through an invitation link and does not change your rating.',
    time: 'Time remaining: {{time}}',
    startIn: 'Starts in {{seconds}} seconds',
    scores: 'You: {{own}} points · Opponent: {{rival}} points',
    starting: 'Both sides will start shortly.',
    running: 'The clock keeps running during connection loss. Only confirmed answers count.',
    question_one: 'Question {{count}} · Difficulty level {{difficulty}}',
    question_other: 'Question {{count}} · Difficulty level {{difficulty}}',
    progress: 'Duel time',
    outcome_win: 'Won',
    outcome_loss: 'Lost',
    outcome_draw: 'Draw',
    finalScore: 'You: {{own}} points · Opponent: {{rival}} points',
    rating: 'Duel rating: {{before}} → {{after}}',
    unrated: 'This duel does not affect your rating.',
    reward:
      'Live duels award 10 XP for a win and 3 XP for a loss or draw, up to 50 XP per UTC day.',
    searching: 'Finding an opponent…',
    ghostWait:
      'After about ten seconds, a real recorded run may stand in. Without a suitable recording, the search continues.',
    cancel: 'Stop searching',
    find: 'Find a live duel',
    invite: 'Create invitation link',
    inviteReady: 'Invitation ready',
    share: 'Share or copy link',
    shareMessage: 'Harmonia duel: {{link}}\nInvitation code: {{code}}',
    acceptTitle: 'Accept an invitation',
    inviteCode: 'Invitation code',
    accept: 'Accept invitation',
    rules:
      'Three minutes, the same questions, and 10–50 points per correct answer. Live opponents are matched by duel rating. Invitations and ghosts are unrated and grant no XP. Answers are checked by the server.',
  },
  exam: {
    title: 'Exam practice',
    entry: 'Simulate an entrance exam in music theory and ear training.',
    open: 'Open exam templates',
    intro:
      'Original practice simulation for college preparation. Questions come from Harmonia; requirements and passing thresholds vary by institution. There are no hints or solutions during the attempt. Skipped and unanswered questions earn zero points.',
    unavailable: 'Exam practice becomes available when course content is approved.',
    template_foundation: 'Foundations and ear training',
    template_advanced: 'Advanced preparation',
    templateDetails: '{{count}} questions · {{minutes}} minutes · {{points}} points',
    start: 'Start exam',
    remaining: 'Time left: {{time}}',
    noHints: 'No hints or instant feedback',
    submitEarly: 'Submit exam early',
    confirmSubmit: 'Unanswered questions earn zero points. Submit now?',
    confirmYes: 'Submit now',
    continue: 'Continue exam',
    result: 'Exam results',
    end_completed: 'You completed every question.',
    end_submitted: 'You submitted early.',
    end_timeout: 'Time is up.',
    points: '{{points}} of {{maximum}} points',
    area_theory: 'Music theory',
    area_aural: 'Ear training',
    areaPoints: '{{points}}/{{maximum}} points · {{correct}}/{{count}} correct',
    recommendations: 'Suggested lessons',
    noRecommendations: 'You answered every question correctly.',
    openLesson: 'Open lesson',
    lockedLesson: 'Still locked in the learning path',
    openPath: 'Open learning path',
    newExam: 'Choose another exam',
  },
  rush: {
    title: 'Theory Rush',
    entry:
      'How many questions can you answer? Race the clock or keep going until your third mistake.',
    open: 'Open Theory Rush',
    guest:
      'Sign in to start a verified run and join the leaderboards. You can use the free practice exercises without an account.',
    account: 'Go to account',
    mode_three: '3 minutes',
    mode_five: '5 minutes',
    mode_survival: 'Survival',
    scope_day: 'Today',
    scope_week: 'This week',
    scope_all: 'All time',
    scope_friends: 'Friends',
    rules:
      'Three mistakes end any run. Survival has no time limit. Questions get harder in stages and may include material from later course units. Hints are turned off during a run.',
    scoring:
      'A correct answer earns 10 to 50 points, depending on its difficulty level. A completed run earns 1 XP per correct answer, up to 30 XP. Abandoned runs earn no XP. Rush does not unlock lessons, award coins, or add qualifying days to your streak.',
    running:
      'An internet connection is required. The timer keeps running when you leave this screen or lose your connection. Answers count once the server confirms them.',
    loading: 'Loading run data…',
    source: 'Theory Rush does not have any reviewed questions available yet.',
    limit: 'You have used today’s run allowance.',
    fast: 'Please wait a moment and check your answer again.',
    error:
      'The connection was interrupted or this run continued on another device. Reload the confirmed progress.',
    reload: 'Load confirmed progress',
    time: 'Time remaining: {{time}}',
    noTimer: 'No time limit · Ends after three mistakes',
    score: '{{score}} points · Mistakes: {{mistakes}} of 3',
    question_one: 'Question {{count}} · Difficulty level {{difficulty}}',
    question_other: 'Question {{count}} · Difficulty level {{difficulty}}',
    progress: 'Mistakes until the run ends',
    showResult: 'View result',
    stop: 'End run',
    abandon: 'Abandon run',
    abandonConfirm:
      'Abandon this run? It will not appear on the leaderboard or earn XP. It will still use one start from your daily allowance.',
    keepPlaying: 'Keep playing',
    result: 'Run confirmed',
    abandoned: 'Run abandoned',
    resultScore: '{{score}} points · {{correct}} correct · {{mistakes}} mistakes',
    reward: '{{xp}} XP has been credited.',
    noReward: 'This abandoned run earns no XP or leaderboard entry.',
    allowance:
      'Starts today: {{remaining}} of {{limit}} remaining. Resets at {{date}} (midnight UTC). Every started run counts, including abandoned runs.',
    start: 'Start run',
    upgrade: 'View subscriptions',
    leaderboard: 'Leaderboards',
    boardRules:
      'Your best confirmed run counts for each mode and question bank. Days and weeks reset at midnight UTC; weeks start on Monday. Ties are decided by fewer mistakes, then the earlier finish. Other accounts appear without names or profile details.',
    friendsPending: 'The friends leaderboard is currently unavailable.',
    friendsIntro:
      'This shows your best run and the best runs of mutually confirmed friends. Blocked or removed connections do not count.',
    empty: 'There are no confirmed runs for this selection yet.',
    ownRank: 'Rank {{rank}} · You · {{score}} points',
    rank: 'Rank {{rank}} · Learner · {{score}} points',
    back: 'Back to practice',
  },
  leagues: {
    globalPushTitle: 'Allow system notifications',
    globalPushBody:
      'This permission covers learning reminders and league results. You select each category separately. Turning it off deselects both categories. Account changes need confirmation from the server.',
    title: 'Leagues',
    intro:
      'Learn at your own pace and collect confirmed XP in a weekly group. Your league reflects activity, not musical proficiency.',
    guestTitle: 'Learn together',
    guest:
      'With an account, your first confirmed XP each week place you in a group. Your private profile name stays hidden.',
    account: 'Sign in or create an account',
    loading: 'Loading your league…',
    error: 'Your league could not be updated. Check your connection and try again.',
    stale: 'This leaderboard shows the last update. Positions may change before it refreshes.',
    refresh: 'Refresh league',
    empty:
      'No group yet this week. You will join one when new lesson XP are confirmed by the server.',
    week: 'Week from {{start}} to {{end}}',
    boundary:
      'The week changes on Monday at 00:00 UTC. In your local time, this week ends on {{date}}.',
    xpRule:
      'Only XP confirmed by the server this week count. XP earned offline count in the week they are uploaded. Earlier XP are not added retrospectively.',
    group_one: '{{count}} person in your group',
    group_other: '{{count}} people in your group',
    capacity: 'Up to {{count}} people per group.',
    you: 'You',
    alias: 'Learner {{number}}',
    row: 'Rank {{rank}} · {{name}} · {{xp}} XP',
    row_promoted: 'Provisional promotion place',
    row_relegated: 'Provisional relegation place',
    row_stayed: 'Provisionally staying in this league',
    forecast: 'The highlighted places are provisional. Results become final after the week ends.',
    rules:
      'In a full group, the top {{count}} move up and the bottom {{count}} move down. In smaller groups, at most half move in each direction. Ties are decided by who joined the group first. You cannot move down from pp or up from fff.',
    privacy:
      'Others see only your identifier within this group and your weekly XP. Your identifier is only valid within this group. Names, email addresses and account identifiers are never shown.',
    resultTitle: 'Your weekly result',
    result: 'Week starting {{date}}: rank {{rank}} with {{xp}} XP.',
    result_promoted: 'Promoted to the {{level}} league.',
    result_relegated: 'Next week you will learn in the {{level}} league.',
    result_stayed: 'You stay in the {{level}} league.',
    ack: 'Mark as read',
    actionError: 'Your change could not be saved. Please try again.',
    levelsTitle: 'The seven leagues',
    levelsBody:
      'The names come from musical dynamic markings. Here they name your league, not how loudly you should play or sing.',
    pushTitle: 'League result notifications',
    pushBody:
      'You can receive a notification when your weekly result is ready. Learning reminders have a separate setting. Across both categories, at most one delivery attempt per day, at your chosen reminder time and outside quiet hours from 9 PM to 8 AM.',
    pushWeb:
      'On the web, results appear here in the app. System notifications are intended for the iOS and Android apps.',
    pushUnavailable:
      'System notifications require persistent storage and a configured mobile device. Your result remains available here.',
    pushPermission:
      'Notifications are blocked in system settings. Allow them there, then try again.',
    pushPending:
      'League notifications are selected. Server registration is not yet confirmed; you can always find your result here.',
    pushRegistered: 'League notifications are set up on this device.',
    level_pp: 'pp · $t(glossary:dynamicPianissimo)',
    meaning_pp: 'very soft',
    level_p: 'p · $t(glossary:dynamicPiano)',
    meaning_p: 'soft',
    level_mp: 'mp · $t(glossary:dynamicMezzoPiano)',
    meaning_mp: 'moderately soft',
    level_mf: 'mf · $t(glossary:dynamicMezzoForte)',
    meaning_mf: 'moderately loud',
    level_f: 'f · $t(glossary:dynamicForte)',
    meaning_f: 'loud',
    level_ff: 'ff · $t(glossary:dynamicFortissimo)',
    meaning_ff: 'very loud',
    level_fff: 'fff · $t(glossary:dynamicFortississimo)',
    meaning_fff: 'extremely loud',
  },

  review: {
    title: 'Review',
    intro: 'Refresh what you have learned. Your answers determine when it comes up again.',
    empty: 'Nothing is due right now. Keep learning or check back later.',
    new: 'After your first lessons, learned skills and knowledge cards will appear here.',
    due: '{{skills}} skills and {{cards}} knowledge cards are due.',
    open: 'See reviews',
    skillsTitle: 'Due skills',
    skillsStart: 'Review skills',
    cardsTitle: 'Due knowledge cards',
    cardOpen: 'Open card: {{title}}',
    recall:
      'What do you remember about this? Try recalling it yourself first. Then reveal the explanation and example.',
    reveal: 'Reveal explanation',
    rate: 'How well did you remember?',
    again: 'Did not remember',
    hard: 'Hard',
    good: 'Remembered',
    easy: 'Easy',
    ratingHelp:
      'Rate your recall before revealing the answer. Choose “Did not remember” if you needed the explanation.',
    scheduled: 'Next review: {{date}}',
    saving: 'Saving review …',
    saved: 'Review saved.',
    error: 'Could not save. Your rating is kept so you can retry.',
    retry: 'Try saving again',
    back: 'Back to reviews',
    next: 'Next due: {{date}}',
    noRewards:
      'This review refreshes what you have learned. It does not unlock lessons or award XP or coins.',
    backlog: 'Several reviews are waiting. Even a short session helps. You can pause at any time.',
    memory: 'You are learning without persistent storage. Reviews are kept only for this session.',
  },
  adaptive: {
    weaknessTitle: 'Practice weak skills',
    weaknessIntro:
      'Ten questions covering up to three skills you find difficult in material you have already reached. No course unlocks, XP, or coins.',
    weaknessEmpty:
      'First answer a few questions independently. Once a skill you have reached has at least two answers, you can practice it here.',
    weaknessStart: 'Start focused practice',
    lessonHint:
      'The order and review questions reflect your learning so far. All new questions are included; suitable questions aim for about 70–85% success.',
    practiceLabel: 'Focused practice',
    returnPractice: 'Back to practice',
    focusSkills: 'Your focus: {{skills}}',
    practiceResult:
      'Your independent answers help select future questions. This practice session does not unlock lessons or award XP or coins.',
  },
  privacy: {
    title: 'Privacy and data',
    body: 'You control optional processing. Learning also works without analytics or marketing.',
    retentionTitle: 'How long is learning data kept?',
    retention:
      'Individual answers and detailed learning evidence are kept for twelve months. Compact, verified progress and learning statistics remain after that.',
    choices: 'Your consents',
    analytics: 'Usage analytics',
    inactive: 'Inactive',
    marketing: 'Marketing emails',
    optionalLater:
      'Marketing is currently inactive. Each optional purpose requires its own information and your explicit choice.',
    pending:
      'Your change still needs to be saved and, if applicable, synced with your account. Withdrawal stops local processing immediately.',
    retry: 'Sync changes again',
    exportTitle: 'Take your data with you',
    exportBody:
      'Download your account and local learning data as a JSON file. Access keys and session tokens are excluded. Keep the file private.',
    guestBody:
      'As a guest, you can download learning data saved on this device. There is no server account.',
    export: 'Download data',
    exported: 'The file has been handed over for saving or sharing.',
    deleteTitle: 'Delete account',
    deleteBody:
      'Account deletion removes your account and learning data. It does not cancel ongoing store or web subscriptions. Check subscription management first.',
    delete: 'Open account deletion',
    confirmTitle: 'Permanently delete account?',
    confirmBody:
      'This deletes your account, answers, progress and tutor history. Data belonging to this account is also removed from this device. You remain responsible for any previously saved export.',
    ackSubscriptions:
      'I understand that deleting my account does not cancel ongoing subscriptions.',
    confirmDelete: 'Permanently delete account',
    cancel: 'Cancel',
    deleted: 'Account and own learning data deleted',
    externalPending:
      'Erasure requests with external providers are still being processed. The receipt confirms account deletion, not completed erasure at those providers.',
    externalCompleted:
      'The documented provider requests are complete. You can save the erasure receipt.',
    saveReceipt: 'Save erasure receipt',
    working: 'Processing your request …',
    error_consent: 'Your choice could not be saved yet. Please try again.',
    error_export: 'The full export could not be created. Check your connection and try again.',
    error_delete:
      'Deletion could not be fully confirmed. Try again; the same request will continue processing.',
    error_reauth: 'Confirm your email sign-in again before deleting your account.',
  },
  legal: {
    title: 'Legal information',
    preparation:
      'Harmonia is still in preparation. Reviewed legal documents and operator details must be ready before publication.',
    withdrawal: 'Withdrawal information',
    aiTitle: 'About the AI tutor',
    aiBody:
      'The tutor is AI and can make mistakes. A separate music theory engine grades exercises. AI answers do not replace expert review.',
  },

  paywall: {
    title: 'Compare subscriptions',
    energy: 'Learning energy',
    unlimited: 'Unlimited learning energy',
    remaining: '{{count}} of {{total}} energy points',
    refill: 'One energy point refills every {{minutes}} minutes, up to the maximum.',
    nextEnergy: 'Next energy point at {{time}}.',
    reservation:
      'A new session reserves one point per exercise. Hints and mistake review within that session use no additional energy.',
    loading: 'Checking access …',
    accessError: 'Access could not be checked. Check your connection and try starting again.',
    compare: 'Free, Premium and Max',
    reason_settings: 'Choose the option that fits your learning.',
    reason_onboarding: 'You can start for free and skip this choice.',
    reason_limit:
      'You need more energy for this new session. Wait for it to refill or explore Premium.',
    reason_premium: 'This course level requires Premium.',
    reason_tutor: 'The AI tutor is included in Premium and Max and has its own allowance.',
    skip: 'Continue for free',
    close: 'Back to learning',
    course_free: 'Published foundations through level 2',
    course_premium: 'All published course levels',
    course_max: 'All published course levels',
    energyLimited: 'Learning energy refills over time',
    tutor_free: 'No AI tutor',
    tutor_premium: 'AI tutor with its own allowance',
    tutor_max: 'AI tutor with an increased allowance',
    maxPreparing: 'Max is in preparation. Additional features will only be offered when available.',
    learningRule:
      'Prerequisites and the passing threshold are the same for everyone. A subscription does not skip learning steps.',
    monthly: 'Monthly',
    annual: 'Annual',
    unavailable:
      'Subscriptions are currently unavailable for purchase. You can continue learning for free.',
    purchaseTerms:
      'Displayed prices come from the store. Its purchase confirmation and the linked contract terms apply. No free trial is promised.',
    terms: 'Contract terms',
    privacy: 'Privacy',
    imprint: 'Legal notice',
  },
  cancellation: {
    title: 'Cancel contracts here',
    body: 'Submit a cancellation declaration for your web subscription without signing in. Manage Apple App Store or Google Play subscriptions in the respective store.',
    name: 'Full name',
    email: 'Contract email address',
    contract: 'Contract identifier (optional)',
    product: 'Which web subscription?',
    ordinary: 'Ordinary cancellation',
    extraordinary: 'Extraordinary cancellation',
    reason: 'Reason for cancellation',
    date: 'Requested end date',
    dateBody: 'Choose the earliest possible date or enter a date as YYYY-MM-DD.',
    earliest: 'Earliest possible',
    continue: 'Review cancellation',
    review: 'Review your cancellation',
    reviewBody:
      'The next button submits this cancellation declaration. Confirmation of the contract end is processed separately.',
    submit: 'Cancel now',
    edit: 'Edit details',
    received: 'Cancellation declaration received',
    receipt: 'Receipt {{id}} · {{time}}',
    receivedBody:
      'Your declaration has been saved. Contract matching, the end date and confirmation are still being processed. This confirms receipt, not a completed contract cancellation.',
    download: 'Save receipt',
    error_schema:
      'Check your name, email address, date and the reason for an extraordinary cancellation.',
    error_send:
      'Receipt could not be confirmed. Try again; the same declaration will not be saved twice.',
    sending: 'Sending cancellation declaration …',
  },

  billing: {
    tier_free: 'Free',
    tier_premium: 'Premium',
    tier_max: 'Max',
    title: 'Subscription',
    accountBound:
      'Your subscription belongs to your Harmonia account and works across your devices.',
    signInBody: 'Sign in to your account before purchasing or restoring a subscription.',
    signIn: 'Go to account',
    status: 'Your access: {{tier}}',
    ends: 'Canceled. Access until {{date}}.',
    validUntil: 'Access until {{date}}.',
    billingIssue: 'There is a payment issue. Check your payment in subscription management.',
    simulation: 'Local subscription test. No payment is taken.',
    loading: 'Loading subscription…',
    unconfigured: 'Subscription purchases have not been set up here yet.',
    error: 'Your subscription status could not be loaded. Please try again.',
    offers: 'Available subscriptions',
    noOffers: 'No suitable offer is currently available.',
    monthly: '{{price}} per month',
    annual: '{{price}} per year',
    renewal:
      'Renews automatically at the displayed price until canceled. The purchase confirmation shows the binding terms.',
    buyMonthly: 'Subscribe to {{tier}} monthly',
    buyAnnual: 'Subscribe to {{tier}} yearly',
    manageExisting:
      'Manage your existing subscription with its provider to avoid a second subscription.',
    purchased: 'Your subscription is active.',
    pending:
      'Your purchase completed. Access is still being confirmed. Refresh the status; do not purchase again.',
    restored: 'Your subscription has been restored.',
    none: 'No active subscription was found for this account.',
    canceled: 'Purchase canceled.',
    storePending: 'Your payment is awaiting confirmation from the provider. Do not purchase again.',
    restore: 'Restore purchases',
    restoreBody:
      'Use the Harmonia account that made the original purchase. On the web, your account is checked again; on iOS and Android, your store account is checked as well.',
    refresh: 'Refresh status',
    manage: 'Manage or cancel subscription',
    linkError: 'Subscription management could not be opened. Please try again.',
  },
  tutor: {
    title: 'AI tutor',
    disclosure:
      'You are talking to an AI. It can make mistakes. Compare explanations with the sources and report unsuitable answers.',
    premium: 'The AI tutor is included in Premium and Max. Free practice remains available.',
    guest: 'Sign in to your account to use the tutor and your private history.',
    signIn: 'Go to account',
    practice: 'Practice freely',
    newChat: 'Start a new question',
    history: 'View conversations',
    hideHistory: 'Close conversations',
    emptyHistory: 'No saved conversations yet.',
    conversation: 'Conversation on {{date}} · {{language}}',
    openConversation: 'Open conversation',
    moreConversations: 'Load more conversations',
    older: 'Load older messages',
    historyLimit:
      'Up to 1000 messages are displayed here. Start a new conversation for further questions.',
    delete: 'Delete conversation',
    deleteTitle: 'Delete this conversation?',
    deleteBody:
      'All messages, sources and reports for this conversation will be permanently deleted. This does not reset your daily allowance.',
    confirmDelete: 'Permanently delete',
    cancel: 'Cancel',
    deleted: 'Conversation deleted.',
    questionLabel: 'Your music question',
    placeholder: 'What would you like to know about music?',
    send: 'Send question',
    stop: 'Stop answer',
    sending: 'The AI tutor is answering …',
    you: 'You',
    assistant: 'AI tutor',
    simulation: 'Local test · This answer is simulated.',
    language: 'Answer language: {{language}}',
    task: 'Your exercise',
    why: 'Why? Explain with AI',
    aiHint: 'Add AI hint {{level}}',
    aiSolution: 'Explain solution with AI',
    requestExplain:
      'Please explain my checked answer and show a suitable verified example if it helps the explanation.',
    requestHint:
      'Please expand the current hint with a thinking prompt. Do not reveal the solution.',
    requestSolution:
      'Please explain the solution to this exercise directly. Use a verified example if it helps.',
    taskSend_explain: 'Request explanation',
    taskSend_hint: 'Request AI hint',
    taskSend_solution: 'Request solution explanation',
    continue: 'Further question about the explanation',
    source: 'Source {{number}}: {{title}} – {{heading}}',
    sources: 'Sources for this answer',
    previewSource: 'Internal source · Subject review is still pending.',
    noSource: 'This answer has no verified source reference from the Harmonia library.',
    invalidSource: 'A source reference could not be verified and is not linked.',
    example: 'Verified notation example',
    invalidExample: 'An example could not be verified and is not displayed.',
    report: 'Report AI answer',
    reportTitle: 'Report this AI answer',
    reportLabel: 'What should be improved?',
    reportBody:
      'This report is linked to your account and this exact saved answer. Please do not include personal information.',
    reportSent: 'Your report was saved. Thank you.',
    reportError: 'The report is not yet confirmed. Resend it with the same details or cancel.',
    reportSubmit: 'Send report',
    reportSending: 'Sending report …',
    report_incorrect: 'Factually incorrect',
    report_unclear: 'Unclear',
    report_inappropriate: 'Inappropriate',
    report_technical: 'Technical error',
    reportCategoryOther: 'Something else',
    remaining: '{{remaining}} of {{limit}} questions left today',
    reset: 'Daily allowance renews: {{date}}',
    refresh: 'Refresh status and allowance',
    accountLoading: 'Loading allowance …',
    accountError: 'Your allowance could not be loaded.',
    retry: 'Retrieve the same answer again',
    retryHint:
      'The original request is preserved. Retrieving it again does not start a second paid answer.',
    status_complete: 'Answer completed.',
    status_refused: 'The tutor declined this request.',
    status_partial: 'This answer is incomplete.',
    status_failed: 'The answer could not be created.',
    status_cancelled: 'The answer was stopped.',
    suggestionIntervals: 'How do I determine an interval?',
    suggestionRhythm: 'How do pulse and tempo differ?',
    suggestionSources: 'How do I check a musical source?',
    error_auth: 'Please sign in again.',
    error_unconfigured: 'The account service is not available yet.',
    error_unavailable: 'The AI tutor is currently unavailable. You can continue practicing.',
    error_subscription:
      'New tutor answers require Premium or Max. Your previous conversations remain readable.',
    error_quota: 'Your daily allowance is used up. You can ask again tomorrow.',
    error_rate: 'Please wait a moment before asking again.',
    error_budget: 'No further tutor answers can currently be created today.',
    error_busy: 'An answer is still running. Wait briefly and retrieve the same request again.',
    error_context: 'The conversation context no longer matches. Start a new question.',
    error_deleted: 'This conversation was deleted. Start a new question.',
    error_content:
      'The exercise is no longer available in this version. Open it again from the learning path.',
    error_network:
      'The connection was interrupted. The part of the answer already received remains visible.',
    error_protocol: 'The answer could not be fully read. Retrieve the same request again.',
    error_cancelled:
      'You stopped the answer. A request that already started may have used your allowance.',
    error_history:
      'The answer is complete, but its saved history could not be loaded. Retrieve the same request again.',
    error_storage: 'Completion was not confirmed. Retrieve the same request again.',
  },
  article: {
    title: 'Library source',
    loading: 'Checking source …',
    unavailable:
      'This source is unavailable in this app version. The article has changed, been withdrawn or has not yet been published.',
    retry: 'Check source again',
    back: 'Back',
    draft: 'Internal preview · This article is still awaiting subject review.',
    version: 'Article version {{version}}',
    sourceLanguage: 'Language of the cited source: {{language}}',
    citedSection: 'Cited section',
    sections: 'Sections in this article',
  },
  motivation: {
    writeError:
      'The change was not saved. Your previous progress remains intact; please try the change again.',
    details: 'View streak and protection',
    purchaseRejected:
      'A protection purchase was declined and not charged. Check your balance and reserve after syncing.',
    openSettings: 'Open device settings',
    coinRules: '{{first}} coins for a first passed lesson, {{repeat}} for a passed repeat.',
    dailyTitle: 'Your daily goal',
    dailyProgress: '{{xp}} of {{goal}} XP',
    goalReached: 'Daily goal reached. Well practiced!',
    goalRemaining: '{{xp}} XP left to reach your daily goal.',
    series_one: '{{count}} learning day in a row',
    series_other: '{{count}} learning days in a row',
    longest_one: 'Longest streak: {{count}} learning day',
    longest_other: 'Longest streak: {{count}} learning days',
    stock: 'Streak protection: {{available}} of 2 in reserve',
    nextFreeze_one: '{{count}} successful learning day until your next free protection.',
    nextFreeze_other: '{{count}} successful learning days until your next free protection.',
    coins_one: '{{count}} coin',
    coins_other: '{{count}} coins',
    buyFreeze: 'Buy streak protection for {{cost}} coins',
    buyError: 'The protection could not be purchased. Check your balance and available reserve.',
    estimated: 'Calculated on this device. Your account confirms XP and coins after syncing.',
    travel: 'Your streak accounts for time zone changes when traveling.',
    loadError: 'Your motivation progress could not be loaded. Saved data remains intact.',
    syncError: 'Not synced yet. Your learning evidence and purchases remain on this device.',
    retry: 'Sync again',
    remindersTitle: 'Learning reminders',
    remindersBody:
      'A friendly reminder at your chosen local time if you have not practiced today. At most one per day, with quiet hours from 9 PM to 8 AM.',
    remindersEnabled: 'Enable learning reminders',
    allowNotifications: 'Allow notifications',
    webReminders: 'Web push will follow later. You can save your preferred time here.',
    memoryReminders: 'Reminders are not set up in a temporary session.',
    permissionDenied:
      'Notifications are turned off in the operating system. You can allow them in device settings.',
    localReminder:
      'Local reminders are scheduled on this device. They also work without an account.',
    remoteReminder: 'Push reminders are enabled for your account.',
    notificationError:
      'The reminders could not be set up. You can keep learning and try again later.',
    retirePending: 'Turning off earlier push reminders is waiting for a connection.',
    notificationTitle: 'Time for a little music',
    notificationBody: 'A little practice fits into your day. Harmonia is here for you.',
    notificationChannel: 'Learning reminders',
    coinsEarned_one: '+{{count}} coin',
    coinsEarned_other: '+{{count}} coins',
    protectionHint:
      'Protection preserves an existing streak on a missed day. It awards no XP and does not count as a learning day.',
    coinHint:
      'Passed lessons earn coins. A protection purchase is booked once; you can keep at most two protections in reserve.',
  },
  report: {
    title: 'Report an error',
    queueTitle: 'Content reports',
    intro: 'What is wrong with this task? Choose an area and describe the error if you wish.',
    category: 'Area',
    'category-question': 'Question',
    'category-answer': 'Answer or grading',
    'category-feedback': 'Explanation or hint',
    'category-notation': 'Score',
    'category-audio': 'Audio example',
    'category-translation': 'Language or translation',
    'category-other': 'Something else',
    message: 'Description (optional, up to 2000 characters)',
    placeholder: 'What did you notice? What should happen instead?',
    privacy:
      'The report includes the task, its variant, your input and hints. For placement questions, it also includes the test so far. Please leave out personal information. It does not change your learning progress.',
    guest:
      'As a guest, you save the report on this device. The next time you sign in, it is assigned to that account and sent.',
    account:
      'The report stays on this device until it has been sent. We retry if there is a network problem.',
    memory:
      'This session uses temporary storage. The report is lost when you close it and will not be sent.',
    submit: 'Save report',
    saving: 'Saving report …',
    saved: 'Report saved',
    saveError: 'The report could not be saved. Your text is still here. Please try again.',
    loadError: 'The report storage could not be loaded. Saved reports will not be overwritten.',
    retry: 'Try again',
    sending: 'Sending reports …',
    networkError: 'Not sent yet. Your reports remain saved. Please try again later.',
    unavailableSource:
      'A task source is no longer available. Its report remains on this device and can be retried.',
    queue: '{{pending}} pending · {{sent}} sent',
    noDraft: 'Open “Report an error” from a task so we can include its context.',
    cancel: 'Back without saving',
    back: 'Back to the task',
  },
  content: contentMessages['en-US'],
  flow: {
    mix: '{{newCount}} questions on the current material and {{repeatCount}} review questions.',
    newMaterial: 'Current material',
    repetition: 'Reinforce what you know',
    errorPractice: 'Practice mistakes with a new variation',
    resumeTitle: 'Your lesson is waiting',
    resumeHint: 'Your introduction, answers and hints are saved. Continue where you left off.',
    resume: 'Resume lesson',
    newAttempt: 'Start a new attempt',
    changed: 'The questions have been updated',
    changedHint:
      'Your saved attempt no longer matches the current questions. Start with the new version.',
    pauseTitle: 'Pause this lesson?',
    pauseHint: 'You can resume this attempt later. Discarding it awards no XP or progress.',
    continueHere: 'Keep learning here',
    pauseLeave: 'Save and return to the learning path',
    discard: 'Discard attempt',
    pause: 'Pause or stop',
    saveError: 'Your current progress could not be saved. Try again before leaving.',
    saved: 'Your current progress is saved on this device.',
    xp_one: '+{{count}} XP',
    xp_other: '+{{count}} XP',
    streak_one: '{{count}} day learning streak',
    streak_other: '{{count}} day learning streak',
    localReward: 'Calculated locally. Your account confirms XP on the server after syncing.',
  },
  placement: {
    title: 'Placement test',
    open: 'View placement',
    offer: 'Find a suitable starting point. Take or repeat the test whenever you like.',
    requested: 'Your test is ready. Find your starting point now.',
    unavailable:
      'The placement test needs reviewed course exercises. None are available in this app version yet. You can practice freely meanwhile.',
    intro:
      '15–25 tasks sample the key skills in levels 1–2. Difficulty adapts to your answers in each subject area.',
    rules:
      'No time limit. Pause or finish early whenever you like. Hints help you but do not count as independent answers. Skip listening tasks without a penalty. The test awards no XP.',
    start: 'Start test',
    restart: 'Start again with the current tasks',
    retake: 'Repeat placement test',
    resume: 'Continue test',
    paused: 'Your unfinished test is saved. Continue where you left off.',
    savedResult: 'Your last placement is saved. View the results or take another test.',
    viewResult: 'View result',
    progress: 'Task {{current}} · at most {{max}}',
    progressLabel: 'Placement test progress',
    hearingPaused:
      'Listening tasks are skipped. They count as neither errors nor evidence of listening ability.',
    pause: 'Pause and go back',
    pauseHint: 'Going back pauses the test. A checked answer is also preserved when you continue.',
    finishEarly: 'Finish test now',
    close: 'Back to learning',
    discard: 'Discard unfinished test',
    changed:
      'The tasks or saved history no longer match this app version. Start a new test; your lessons are preserved.',
    loadError: 'Your test could not be loaded. Try again. Saved data will not be overwritten.',
    saving: 'Saving your test …',
    saveError: 'Your test has not been saved yet. Try again before closing the app.',
    resultTitle: 'Your starting point',
    resultBody:
      'Placement is estimated separately for each subject area. Choose a recommended start or revisit the basics freely.',
    partialTitle: 'Preliminary result',
    partialBody:
      'You finished the test early. This sample is too small to skip units. Recommendations start with the basics.',
    summary:
      '{{answered}} answered · {{correct}} independently correct · {{assisted}} with help · {{skipped}} skipped',
    estimateHint:
      'An estimate from a few tasks, not a qualification or proof of every skill. Level 2 is the ceiling of this test.',
    notRated: 'Not enough evidence to estimate a level',
    foundation: 'Basic skills not yet reliably demonstrated',
    level: 'Estimated level: {{level}}',
    areaEvidence:
      '{{independent}} independently answered · {{correct}} correct · {{assisted}} with help · {{skipped}} skipped',
    uncertain: 'The sample is small or inconsistent. Reviewing the basics is recommended here.',
    startPoint: 'Starting point: {{title}}',
    startLearning: 'Continue learning here',
    startNamed: 'Continue learning: {{title}}',
    testedHint:
      'Units estimated as tested remain available for optional practice. They do not count as completed lessons.',
    testedUnit: 'Tested · {{title}} · optional review',
    prerequisite: 'Helpful foundation first: {{title}}',
    overallStart: 'Recommended first step',
  },
  onboarding: {
    brand: 'Harmonia',
    progress: 'Step {{current}} of {{total}}',
    progressLabel: 'Setup progress',
    continue: 'Continue',
    back: 'Back',
    finish: 'Start learning',
    finishError:
      'Your setup could not be completed. Try again or confirm your sign-in again. Your preferences stay available here.',
    loading: 'Preparing your learning space …',
    loadError:
      'Your saved preferences could not be loaded. Try again or start for this session only.',
    retry: 'Try again',
    temporary: 'Start for this session only',
    temporaryHint:
      'Your preferences stay available during this session. They are not saved after you close it.',
    saveError:
      'Your latest preferences have not been saved yet. Try again; they remain visible here.',
    saving: 'Saving your preferences …',
    languageTitle: 'Music starts with you.',
    languageBody: 'Choose your language. You will try your first question in a moment.',
    languageDevice: 'Same as device',
    languageDeviceBody: 'Follows your device language.',
    languageDeBody: 'German note names and terminology.',
    languageUsBody: 'English with American music terminology.',
    languageUkBody: 'English with British music terminology.',
    goalTitle: 'What would you like to achieve?',
    goalBody: 'Choose what matters most to you today. You can change your preferences later.',
    goal_hobby: 'Music as a hobby',
    goal_hobbyBody: 'Understand music and try it for yourself.',
    goal_school: 'School or lessons',
    goal_schoolBody: 'Learn the basics and solve questions confidently.',
    goal_exam: 'Entrance exam',
    goal_examBody: 'Develop your knowledge and listening skills.',
    goal_ensemble: 'Choir or ensemble',
    goal_ensembleBody: 'Understand written music and musical relationships.',
    experienceTitle: 'Where are you starting?',
    experienceBody: 'There is no wrong self-assessment. It does not replace a placement test.',
    experience_new: 'I am just starting',
    experience_newBody: 'No previous knowledge needed.',
    experience_basics: 'I know some basics',
    experience_basicsBody: 'I have read music or made music before.',
    experience_experienced: 'I have experience',
    experience_experiencedBody: 'I want to find gaps and keep learning.',
    placementTitle: 'Find your starting point',
    placementBody:
      'A short adaptive test finds your starting point. Would you like to take it after setup or try the basics first?',
    placement_later: 'Try the basics first',
    placement_requested: 'Take the test after setup',
    placementHint:
      'Find the test in Learn and Profile whenever you like. Only the test changes your estimated level.',
    dailyTitle: 'A small daily habit',
    dailyBody:
      'Choose your daily goal. Experience points (XP) will be awarded for solved questions later.',
    dailyOption: '{{count}} XP a day',
    dailyHint: 'You can adjust your goal to fit your day at any time.',
    remindersTitle: 'Learn in your own rhythm',
    remindersBody:
      'You decide whether you would like learning reminders later. Saving this preference does not enable notifications.',
    reminderConsent: 'Save a preference for learning reminders',
    reminderHint:
      'You can withdraw your consent in your profile at any time. We will ask separately for permission before enabling reminders.',
    reminderTime: 'Preferred time',
    timeOption: '{{time}}',
    miniTitle: 'Your first small question',
    miniBody:
      'Read the two $t(glossary:notehead_other) from left to right. Higher on the page means a higher pitch; lower means a lower pitch. You do not need note names yet.',
    miniProgress: 'One question to try',
    miniProgressLabel: 'Mini-question progress',
    miniNext: 'Choose my starting profile',
    audioStart: 'Start sound',
    audioStop: 'Stop playback',
    audioHint: 'Tap to hear the two pitches. You can also solve the question without sound.',
    audioError: 'The sound could not be started. Try again or use the written example to answer.',
    accountTitle: 'Your learning is yours.',
    accountBody: 'Start as a guest or sign in by email. Your answers so far stay on this device.',
    account_guest: 'Learn as a guest',
    account_guestBody: 'No email address, with progress saved locally.',
    account_email: 'Sign in by email',
    account_emailBody: 'A code confirms your address; a new account is created automatically.',
    ageConfirmed: 'I am at least 16 years old',
    localProgress:
      'Your learning progress is currently saved on this device. An account does not yet sync it to other devices.',
    profileTitle: 'Your learning setup',
    profileSummary: '{{goal}} · {{experience}}',
    profileEdit: 'Adjust learning goals',
    profileRestart: 'Review setup again',
    profileDaily: 'Daily goal',
    profileReminder: 'Reminder preference',
    reminderOff: 'Off',
    reminderOn: 'Saved: {{time}}',
    profilePlacement: 'Placement',
    placementLater: 'Decide later',
    placementRequested: 'Test requested',
    profileAccount: 'Account',
    guestLabel: 'Guest on this device',
    signedIn: 'Signed in: {{email}}',
    signedOut: 'Currently signed out',
    accountOpen: 'Sign in by email',
    learnWelcome: 'Your learning setup is ready.',
    learnPreference: 'Your goal: {{goal}} · {{count}} XP a day',
    learnPlacement: 'Your placement preference is saved. Start the test from your learning area.',
    editTitle: 'Your learning goals',
    editBody: 'Changes take effect immediately and are saved on this device.',
    done: 'Back to profile',
  },
  auth: {
    apple: 'Sign in with Apple',
    google: 'Sign in with Google',
    oauthError: 'Sign-in could not be completed. Please start again.',
    oauthWorking: 'Completing secure sign-in…',

    title: 'Sign in',
    email: 'Email address',
    emailPlaceholder: 'name@example.com',
    send: 'Send code',
    sending: 'Sending code …',
    code: 'Six-digit code',
    verify: 'Confirm address',
    verifying: 'Checking code …',
    sent: 'If this address can be used, your code will be in your inbox. Check your spam folder too.',
    resend: 'Send a new code',
    resendWait: 'Send a new code in {{seconds}} seconds',
    changeEmail: 'Use a different email address',
    invalidEmail: 'Enter a complete email address.',
    invalidCode: 'Enter the six-digit code from your email.',
    sendError: 'The code could not be sent. Check your connection and try again.',
    verifyError:
      'The code is invalid, expired, or could not be checked. Check it or request a new code.',
    unavailable:
      'Email sign-in is not available here yet. You can keep learning locally as a guest.',
    signedIn: 'You are signed in as {{email}}.',
    signOut: 'Sign out on this device',
    signOutError: 'Sign-out could not be completed. Try again.',
    sessionError: 'Your sign-in could not be loaded. Try again.',
    privacy:
      'Choosing “Send code” uses your email address for sign-in. We do not send a learning newsletter.',
    ageHint: 'First confirm that you are at least 16 years old.',
    back: 'Back to profile',
  },
  tabs: {
    learn: 'Learn',
    practice: 'Practice',
    profile: 'Profile',
  },
  placeholder: 'Something is being built here.',
  learn: {
    unavailable: 'New lessons are being prepared. You can already practise freely.',
    exampleScale: 'Example: C major scale in $t(glossary:notes.quarter_other)',
  },
  practice: {
    input: 'Input',
    input_staff: 'Staff',
    input_piano: 'Piano',
    intervalTitle: 'Enter an interval',
    intervalTask: 'Place a major third above C4.',
    intervalHint:
      'Tap the staff to place the note. Drag to move it; the bar below adds an accidental.',
    keyboardHint: 'With a keyboard: Tab to the note, then use the up and down arrows to move it.',
    placed: 'Placed: {{note}}',
    nothingPlaced: 'No note placed yet.',
    accidentals: '$t(glossary:accidental_other)',
    remove: 'Delete',
    check: 'Check',
    correct: 'Correct, that is the major third.',
    wrong: 'Not quite. Try again.',
    correctTitle: 'Correct!',
    wrongTitle: 'Not quite',
  },
  exercise: {
    ...levelThreeExercise['en-US'],
    ...levelFourExercise['en-US'],
    type_SIGHT_SING: 'Sight singing',
    type_SING_INTERVAL: 'Sing an interval',
    type_PLAY_BACK: 'Sing back a melody',
    question_SIGHT_SING: 'Sing the written pitch.',
    question_SING_INTERVAL: 'Listen to the starting pitch, then sing the ascending {{interval}}.',
    question_PLAY_BACK: 'Listen to the short melody, then sing its three notes in order.',
    voiceExplanation:
      'Target notes: {{notes}}. Allowed difference per note: ±{{tolerance}} cents; the octave matters.',
    voiceOctaveError:
      'The pitch class matches, but the octave does not. Target notes: {{notes}}. Allowed difference: ±{{tolerance}} cents.',
    voiceHint1: 'Listen to the starting pitch and hold each sung note steadily.',
    voiceHint2: 'Sing each note separately with a short pause between them.',
    solutionImage: 'Solution score',
    sourceReplay: 'Play the source example',
    keyReplay: 'Example: $t(glossary:major) or natural $t(glossary:minor) $t(glossary:scale_one)',
    listeningCell: 'Cell {{count}}',
    'contextQuestion_crossbar-duration':
      'How many quarter-note values does the first pitch last across the barline?',
    'contextHint1_crossbar-duration':
      'Follow the tie into the next measure. Silence before the first pitch is not part of its sounding duration.',
    'contextHint2_crossbar-duration':
      'Add the last note value of the first measure and its tied continuation at the start of the second.',
    'contextExplain_crossbar-duration':
      'The barline does not interrupt the tie. There is only one onset; both note values add to one sounding duration.',
    'contextQuestion_jazz-roots':
      'Which social context does this fictional jazz teaching dossier document?',
    'contextHint1_jazz-roots':
      'Identify whether the source describes local music-making, relocation or the production of a recording.',
    'contextHint2_jazz-roots':
      'Community, migration and the recording business are different levels. None of these sources alone proves a first origin.',
    'contextExplain_jazz-roots':
      'Classification follows the social activity explicitly described. African American musical practice, migration and media businesses interact but are not interchangeable.',
    contextSocial_neighbourhood:
      'Fictional neighbourhood report, {{year}}: African American musicians organize local performances and exchange musical ideas within their community.',
    contextSocial_migration:
      'Fictional travel account, {{year}}: musicians move from the southern United States to a northern city and build new musical networks there.',
    'contextSocial_recording-business':
      'Fictional studio file, {{year}}: a company hires musicians, produces a record and distributes it commercially.',
    contextSocialOption_neighbourhood: 'Local community life and musical exchange',
    contextSocialOption_migration: 'Migration and new musical networks',
    'contextSocialOption_recording-business': 'Commercial recording production and distribution',
    listeningSubdivision: '{{count}} equal subdivisions per beat',
    listeningPosition: 'Note {{count}} changed',
    listeningMajorScale: 'Major scale',
    listeningMinorScale: 'Natural minor',
    question_CHORD_DIATONIC:
      'Build the diatonic triad on degree {{degree}} in {{key}}. Use natural minor; given root: {{bass}}.',
    'question_listening_rhythm-choice-dotted':
      'Which complete score matches the dotted rhythm you heard?',
    'question_listening_pulse-subdivision':
      'How many equal subdivisions form one beat? Include the higher starting note as the first part.',
    'question_listening_rhythm-completion':
      'Listen to the complete measure. Which cell supplies the missing fourth quarter-note beat in the written outline?',
    'question_listening_scale-mode':
      'Listen to the ascending scale from tonic to octave. Is it major or natural minor?',
    'question_listening_melodic-memory':
      'Listen to A and B. Which of the four notes changed in the second example?',
    'listeningExplanation_rhythm-choice-dotted':
      'The comparison uses actual onsets, rests and durations, including dots. Answer: {{answer}}.',
    'listeningExplanation_pulse-subdivision':
      'The higher tone marks each beat start. Equal subdivisions up to the next start form the group. Answer: {{answer}}. A heard group alone does not determine a time signature.',
    'listeningExplanation_rhythm-completion':
      'The first three quarter-note beats match the outline. The final cell is compared with the actual sound of beat four. Answer: {{answer}}.',
    'listeningExplanation_scale-mode':
      'Distances are compared from the first note. Major and natural minor differ especially on degrees 3, 6 and 7. Answer: {{answer}}.',
    'listeningExplanation_melodic-memory':
      'Both sources contain four equal-duration notes; exactly one sounding pitch differs at its position. Answer: {{answer}}.',
    listeningOutline: 'Outline: beat four is missing. Each option spans one quarter-note value.',
    contextEvent: 'Measure {{measure}}, event {{index}}: {{duration}}. {{positions}}',
    contextPosition:
      'Notehead {{index}}, {{steps}} letter-name steps from the bottom line; visible accidental: {{sign}}.',
    contextSign_none: 'none',
    contextSign_sharp: 'sharp',
    contextSign_flat: 'flat',
    contextSign_natural: 'natural',
    contextSign_doubleSharp: 'double sharp',
    contextSign_doubleFlat: 'double flat',
    contextResult: '{{explanation}} Answer: {{answer}}.',
    contextFraction: '{{fraction}} × quarter-note value',
    contextDegree: 'Degree {{count}}',
    contextPattern: 'Semitone steps: {{pattern}}',
    contextYes: 'Yes',
    contextNo: 'No',
    contextRole_root: 'root',
    contextRole_third: 'third',
    contextRole_fifth: 'fifth',
    contextScore: 'Written source',
    contextKey: 'Key: {{key}}',
    contextDossier:
      'Fictional European teaching dossier: composition year {{year}}. Stated feature: {{feature}}. The piano example is an original teaching model.',
    contextDocument:
      'Fictional source dated {{year}}: {{medium}}. Consider only what this medium documents.',
    'contextComparison_same-event':
      'Two reports date the same performance to {{year}} and {{secondYear}}, respectively. Their independence is unknown.',
    'contextComparison_work-recording':
      'Source A gives composition year {{year}}. Source B gives recording date {{secondYear}}.',
    'contextComparison_advertised-performed':
      'A programme from {{year}} advertises performing forces. A report from {{secondYear}} describes the forces that actually performed at the same event.',
    contextFeature_monophony: '$t(glossary:monophony) in singing',
    contextFeature_imitation: '$t(glossary:imitation) in vocal $t(glossary:polyphony)',
    contextFeature_continuo: '$t(glossary:continuo)',
    contextFeature_phrases: 'regular periodic phrases',
    contextFeature_chromaticism: 'Expanded $t(glossary:chromaticism)',
    contextFeature_electronics: 'electronic sound production',
    contextMedium_recording: '$t(glossary:recording_one)',
    contextMedium_programme: '$t(glossary:programmeSource_one)',
    contextMedium_report: '$t(glossary:report_one)',
    contextMedium_broadcast: '$t(glossary:broadcast_one)',
    contextMedium_stream: '$t(glossary:stream_one)',
    'contextOption_recorded-performance': 'Documented sound of a recorded performance',
    'contextOption_advertised-event': 'Advertised event; actual execution remains unverified',
    'contextOption_reported-view': 'Preserved view of the report’s author',
    'contextOption_mediated-distribution': 'Distribution through a media channel',
    'contextOption_invented-origin': 'Proof of the musical style’s very first origin',
    'contextOption_universal-style': 'Proof about every musician and work in this tradition',
    'contextOption_different-date-roles': 'Composition and recording date different events',
    'contextOption_intention-performance':
      'Announcement and actual performance are different claims',
    'contextOption_unresolved-conflict': 'Unresolved conflict; additional evidence is needed',
    'contextOption_agreement-not-proof': 'Agreement; independence remains unproven',
    type_CONTEXT_CHOICE: 'Musical relationships',
    question_CONTEXT_CHOICE: 'Examine the source shown.',
    'contextQuestion_accidental-scope':
      'Name note {{target}}, including its octave. Check barlines, naturals and register.',
    'contextHint1_accidental-scope':
      'An accidental applies within the measure to the same letter name in the same octave.',
    'contextHint2_accidental-scope':
      'At the barline, the key signature applies again. A natural cancels the alteration previously in force.',
    'contextExplain_accidental-scope':
      'The target note’s actual spelling accounts for the accidental state in its measure and register.',
    'contextQuestion_enharmonic-spelling':
      'Which different spelling sounds like the written note on an equal-tempered piano?',
    'contextHint1_enharmonic-spelling': 'Compare sounding keys, not just letters.',
    'contextHint2_enharmonic-spelling':
      'C-sharp and D-flat share a key. E-sharp is the F key; B-sharp reaches the next C key.',
    'contextExplain_enharmonic-spelling':
      'Enharmonic spellings preserve the sounding key but change the written letter name. The octave number can change.',
    'contextQuestion_dotted-duration':
      'How many quarter-note values does the first dotted note last?',
    'contextHint1_dotted-duration': 'One dot adds half of the original value.',
    'contextHint2_dotted-duration':
      'Dotted eighth = eighth + sixteenth; dotted quarter = quarter + eighth.',
    'contextExplain_dotted-duration':
      'The first dot multiplies the original value by 3/2. Following rests do not change this note’s duration.',
    'contextQuestion_tied-duration':
      'How many quarter-note values does the first pitch last, including all its ties?',
    'contextHint1_tied-duration': 'A tie joins identical pitches into one continuous sound.',
    'contextHint2_tied-duration':
      'Add only the tied note values. Exclude rests; crossing a barline does not end the tie.',
    'contextExplain_tied-duration':
      'The checked tie chain has one onset. Its continuous duration is the sum of its tied values, including across a barline.',
    contextQuestion_syncopation:
      'Does a note start between quarter-note beats and continue past the next beat?',
    contextHint1_syncopation: 'Find an onset between two beats.',
    contextHint2_syncopation:
      'An eighth on the second half alone is insufficient: its sound must cross the following beat.',
    contextExplain_syncopation:
      'This introductory question checks whether a pitch starting between beats continues across the following quarter-note beat.',
    'contextQuestion_triplet-duration':
      'How many quarter-note values do the first three eighth notes under the triplet number 3 occupy together?',
    'contextHint1_triplet-duration':
      'An eighth-note triplet has three equal eighth notes in the time of two ordinary eighth notes.',
    'contextHint2_triplet-duration':
      'Each triplet eighth is 1/3 of a quarter. Add the three triplet notes, excluding the following note.',
    'contextExplain_triplet-duration':
      'The 3:2 ratio shortens each eighth to two thirds of its ordinary value. Three together equal exactly one quarter-note value.',
    'contextQuestion_interval-inversion':
      'Which interval results when you invert the written simple interval by moving an endpoint by one octave?',
    'contextHint1_interval-inversion': 'The two interval numbers add to 9.',
    'contextHint2_interval-inversion':
      'Perfect stays perfect; minor becomes major; augmented becomes diminished, and conversely.',
    'contextExplain_interval-inversion':
      'Inversion complements the number to 9 and reverses the quality. Unison and octave are the edge case in this model.',
    'contextQuestion_interval-reduction':
      'Which simple interval corresponds to the written distance after removing complete octaves?',
    'contextHint1_interval-reduction': 'An additional octave increases the interval number by 7.',
    'contextHint2_interval-reduction':
      'A ninth corresponds to a second and a tenth to a third. The quality is preserved.',
    'contextExplain_interval-reduction':
      'For compound intervals, subtract 7 from the number for each octave. Preserve the quality; stop reduction at the simple octave.',
    'contextQuestion_scale-pattern':
      'Which semitone pattern describes the seven steps of the ascending scale shown?',
    'contextHint1_scale-pattern': 'Count piano-key steps: whole step = 2, half step = 1.',
    'contextHint2_scale-pattern': 'A major scale has its half steps between degrees 3–4 and 7–8.',
    'contextExplain_scale-pattern':
      'The pattern is calculated from every pair of adjacent sounding pitches, rather than the number of visible accidentals.',
    'contextQuestion_scale-degree':
      'Which degree of the major scale shown is {{focus}}? Count the starting note as 1.',
    'contextHint1_scale-degree':
      'The tonic is degree 1; following letter names are degrees 2, 3 and so on.',
    'contextHint2_scale-degree':
      'Read from the actual starting note. C is not degree 1 in every key.',
    'contextExplain_scale-degree':
      'The degree follows the queried note’s position in this scale. The octave repetition is the tonic again.',
    'contextQuestion_fifth-neighbour':
      'Which key is one fifth {{direction}} from {{key}} on the circle of fifths? Keep the same mode.',
    'contextHint1_fifth-neighbour':
      'An ascending fifth shifts the signature one step towards sharps.',
    'contextHint2_fifth-neighbour':
      'Downwards moves one step towards flats. This can first remove an existing sharp.',
    'contextExplain_fifth-neighbour':
      'Neighbouring circle-of-fifths positions differ by exactly one signature step. Tonic and mode are considered together.',
    'contextQuestion_relative-key': 'Which relative key shares the signature of {{key}}?',
    'contextHint1_relative-key':
      'Relative keys have different tonics and modes but share the same key signature.',
    'contextHint2_relative-key':
      'The relative-minor tonic lies a minor third below the major tonic. Same-tonic minor would be a parallel key.',
    'contextExplain_relative-key':
      'The signature count is unchanged and the mode changes. German Paralleltonart means English relative key, not parallel key.',
    'contextQuestion_chord-member':
      'Which note is the {{role}} of this triad? Its inversion can vary.',
    'contextHint1_chord-member': 'Mentally rearrange the written triad into root position.',
    'contextHint2_chord-member':
      'Root, third and fifth are named from the chord root. The lowest note may have a different role.',
    'contextExplain_chord-member':
      'The engine identifies the complete written triad, then the queried chord-member role. Inversion does not change those roles.',
    'contextQuestion_chord-root': 'What is the root of this written triad?',
    'contextHint1_chord-root': 'Root and lowest sounding note are different concepts.',
    'contextHint2_chord-root':
      'Find the stack of thirds in root position. The bass determines the inversion only.',
    'contextExplain_chord-root':
      'Chord identity follows from all three written notes. A root written above the bass remains the root.',
    'contextQuestion_diatonic-triad':
      'Which triad quality forms on degree {{degree}} in {{key}} when you stack only scale notes in thirds? Minor is natural here.',
    'contextHint1_diatonic-triad':
      'Take degrees n, n+2 and n+4; continue into the next octave above degree seven.',
    'contextHint2_diatonic-triad':
      'Major: major–minor–minor–major–major–minor–diminished. Natural minor follows a different sequence.',
    'contextExplain_diatonic-triad':
      'The three notes are stacked from the actual major or natural-minor scale, then identified as a triad.',
    'contextQuestion_period-context':
      'Which period in the broad European overview fits this teaching dossier’s explicitly stated composition year and feature?',
    'contextHint1_period-context':
      'Use the stated composition year together with the feature; one sonic feature alone cannot date a work.',
    'contextHint2_period-context':
      'The examples lie far from transitions. This is a European overview with overlapping boundaries.',
    'contextExplain_period-context':
      'The teaching dossier supplies a composition year. Classification uses the explicitly taught broad overview and makes no dating claim from the piano model.',
    'contextQuestion_jazz-source':
      'Which statement does this fictional source about a jazz context actually support?',
    'contextHint1_jazz-source':
      'Distinguish a documented performance from the origins of an entire musical tradition.',
    'contextHint2_jazz-source':
      'A recording documents its recorded sound; a programme an announcement; a report its author’s view.',
    'contextExplain_jazz-source':
      'The medium limits the claim. The earliest surviving or commercially issued source does not establish the first musical origin.',
    'contextQuestion_popular-source':
      'Which statement does this fictional source about popular music actually support?',
    'contextHint1_popular-source':
      'Ask whether the source documents sound, an announcement, a view or distribution.',
    'contextHint2_popular-source':
      'Broadcasts and streams document distribution, not automatically a work’s creation or original performing forces.',
    'contextExplain_popular-source':
      'Recording, media channel and composition are different levels. The answer stays at the level actually documented.',
    'contextQuestion_source-comparison':
      'How can you justify the relationship between these two fictional sources?',
    'contextHint1_source-comparison': 'First compare which event or claim each date concerns.',
    'contextHint2_source-comparison':
      'Composition and recording dates can differ. Conflicting dates for the same performance require further evidence.',
    'contextExplain_source-comparison':
      'Matching claims are agreement, not automatic independent corroboration. Different date roles must be distinguished from an unresolved conflict.',
    question_octaveName: 'What is {{name}} in {{system}}?',
    scientificSystem: '$t(glossary:scientificNotation)',
    helmholtzSystem: '$t(glossary:helmholtzNotation)',
    question_grandStaff:
      'Which key matches the only written note on the $t(glossary:grandStaff_one)?',
    octaveNameExplanation:
      '{{source}} and {{answer}} name the same pitch. Scientific octave number {{octave}} starts at C and runs through the following B. Uppercase/lowercase letters and superscript numbers indicate the register in Helmholtz notation.',
    octaveNameHint1:
      'Read the register first: c = C3, c¹ = C4, c² = C5. Each new register starts at C.',
    octaveNameHint2:
      'The number applies to all seven natural notes in that register: b = B3 and b¹ = B4. International B is German H.',
    grandStaffHint1:
      'Find the staff containing the note. The upper staff uses the $t(glossary:trebleClef_one); the lower one uses the $t(glossary:bassClef_one).',
    grandStaffHint2:
      'C4/c¹ lies on the first $t(glossary:ledgerLine_one) below the upper staff and the first above the lower staff. Both spellings belong to the same key.',
    grandStaffDescription:
      'Grand staff: treble clef above, bass clef below. {{description}} The staff in {{silent}} contains a whole-measure rest.',
    type_LISTENING_CHOICE: 'Listen and compare',
    question_listening_pulse:
      'Listen to the two steady pulse groups. How many beats belong to each group? Count the higher starting sound as 1; the next start belongs to the next group.',
    'question_listening_rhythm-compare':
      'Listen to example A and, after the gap, example B. Do they have the same rhythm? Compare starts, sound durations and rests.',
    'question_listening_rhythm-choice':
      'Which of the three scores matches the heard rhythm? All examples use the same pitch.',
    'question_listening_pitch-direction':
      'Listen to the two pitches in sequence. Is the second higher, lower or the same pitch?',
    'question_listening_melody-compare':
      'Listen to melody A and, after the gap, melody B. Do all pitches in the same order and all durations match?',
    question_listening_observation:
      'Which statement describes something you can directly hear in this teaching example?',
    listeningOption: 'Score {{count}}',
    listeningClip: 'Listening example {{count}}',
    listeningPulseCount: 'Pulse group with {{count}} beats',
    listeningSame: 'Same',
    listeningDifferent: 'Different',
    listeningUp: 'Second pitch higher',
    listeningDown: 'Second pitch lower',
    listeningRepeat: 'Same pitch',
    listeningSingle: 'Only one pitch sounds at a time',
    listeningTogether: 'At least two pitches sound together',
    listeningDate: 'The work was certainly composed in 1750',
    listeningPlace: 'The music was certainly performed in a church',
    listeningHint1:
      'Listen to the whole example first. You can stop and replay it. Focus on the property asked about.',
    listeningHint2:
      'Compare beats and rests for rhythm, and pitches for melody. A score describes the sounds; historical claims require additional sources.',
    listeningExplanation_pulse:
      'The higher sound marks the beginning of each group. The evenly spaced beats between two beginnings form one group. Answer: {{answer}}. The next starting sound belongs to the next group.',
    'listeningExplanation_rhythm-compare':
      'The assessment compares actual starts, sound durations and rests in both sound sources. Answer: {{answer}}. Pitch stays the same in these questions.',
    'listeningExplanation_rhythm-choice':
      '{{answer}} has the same starts, sound durations and rests as the played example. The three complete $t(glossary:measure_other) differ audibly.',
    'listeningExplanation_pitch-direction':
      'The second sounding pitch is compared with the first. Answer: {{answer}}. Loudness and duration do not determine higher or lower.',
    'listeningExplanation_melody-compare':
      'The sounding pitches, their order, starts and durations are compared. Answer: {{answer}}. Here, “same” means the same pitches, not just a similar direction.',
    listeningExplanation_observation:
      '{{answer}} can be checked in the sound example. Date and performance venue cannot be established from it alone. This is an original piano teaching model, not a historical recording.',
    orderRule_periods:
      'Order by the conventional broad sequence of European periods; their boundaries can overlap.',
    order_periods_ascending: 'Order the periods from earlier to later.',
    order_periods_descending: 'Order the periods from later to earlier.',
    knowledgeHint_soundSources:
      'Read the described property carefully. Distinguish the term from related categories and consider the limits of the source.',
    knowledgeHistory_soundSources_voice: '$t(glossary:voice_one)',
    knowledgeHistoryDefinition_soundSources_voice:
      'Sound is produced by the vibrating vocal folds of a singing person.',
    knowledgeHistory_soundSources_instrument: '$t(glossary:instrument_one)',
    knowledgeHistoryDefinition_soundSources_instrument:
      'A performer sets a string or a column of air, for example, into vibration.',
    knowledgeHistory_soundSources_recording: '$t(glossary:recording_one)',
    knowledgeHistoryDefinition_soundSources_recording:
      'Stored sound is played back; it can contain voices, instruments or electronic sounds.',
    knowledgeHistory_soundSources_electronic: '$t(glossary:electronicSound)',
    knowledgeHistoryDefinition_soundSources_electronic:
      'An electronic device or program generates the audio signal.',
    knowledgeHint_sourceTypes:
      'Read the described property carefully. Distinguish the term from related categories and consider the limits of the source.',
    knowledgeHistory_sourceTypes_score: '$t(glossary:scoreSource_one)',
    knowledgeHistoryDefinition_sourceTypes_score:
      'A written source specifies pitches, durations and other performance instructions; it is not itself a sounding performance.',
    knowledgeHistory_sourceTypes_recording: '$t(glossary:recording_one)',
    knowledgeHistoryDefinition_sourceTypes_recording:
      'This source documents a particular sounding performance, including its interpretation.',
    knowledgeHistory_sourceTypes_report: '$t(glossary:report_one)',
    knowledgeHistoryDefinition_sourceTypes_report:
      'A person describes a musical event in words; their perspective and memory need to be examined.',
    knowledgeHistory_sourceTypes_programme: '$t(glossary:programmeSource_one)',
    knowledgeHistoryDefinition_sourceTypes_programme:
      'An announcement lists works, performers, venue and date, for example; it alone does not prove that everything happened as announced.',
    knowledgeHint_context:
      'Read the described property carefully. Distinguish the term from related categories and consider the limits of the source.',
    knowledgeHistory_context_place: '$t(glossary:place_one)',
    knowledgeHistoryDefinition_context_place:
      'The question is: where did the performance take place, for example in a concert hall?',
    knowledgeHistory_context_time: '$t(glossary:time_one)',
    knowledgeHistoryDefinition_context_time:
      'The question is: when did the event take place? Composition and recording dates can differ.',
    knowledgeHistory_context_occasion: '$t(glossary:occasion_one)',
    knowledgeHistoryDefinition_context_occasion:
      'The question is: what event was the music part of, for example a wedding?',
    knowledgeHistory_context_author: '$t(glossary:author)',
    knowledgeHistoryDefinition_context_author:
      'The question is: who wrote the music or the report? This is not automatically the same person as the performer.',
    knowledgeHint_periods:
      'Read the described property carefully. Distinguish the term from related categories and consider the limits of the source.',
    knowledgeHistory_periods_medieval: '$t(glossary:medieval)',
    knowledgeHistoryDefinition_periods_medieval:
      'In this broad overview of European art music, roughly 500–1400; boundaries vary by region and topic.',
    knowledgeHistory_periods_renaissance: '$t(glossary:renaissance)',
    knowledgeHistoryDefinition_periods_renaissance:
      'In this broad overview of European art music, roughly 1400–1600, after the Middle Ages and before the Baroque.',
    knowledgeHistory_periods_baroque: '$t(glossary:baroque)',
    knowledgeHistoryDefinition_periods_baroque:
      'In this broad overview of European art music, roughly 1600–1750, after the Renaissance and before the Classical period.',
    knowledgeHistory_periods_classical: '$t(glossary:classicalPeriod)',
    knowledgeHistoryDefinition_periods_classical:
      'In this broad overview of European art music, roughly 1750–1820; overlap with Romanticism is possible.',
    knowledgeHistory_periods_romantic: '$t(glossary:romanticPeriod)',
    knowledgeHistoryDefinition_periods_romantic:
      'In this broad overview of European art music, mainly the nineteenth century, approximately 1800–1900.',
    knowledgeHistory_periods_since1900: '$t(glossary:musicSince1900)',
    knowledgeHistoryDefinition_periods_since1900:
      'In this overview, the twentieth and twenty-first centuries with many coexisting styles; not a single sound style.',
    knowledgeHint_genreContext:
      'Read the described property carefully. Distinguish the term from related categories and consider the limits of the source.',
    knowledgeHistory_genreContext_genre: '$t(glossary:genre_one)',
    knowledgeHistoryDefinition_genreContext_genre:
      'The question is: what kind of work is it, for example an opera or a symphony?',
    knowledgeHistory_genreContext_forces: '$t(glossary:performingForces_one)',
    knowledgeHistoryDefinition_genreContext_forces:
      'The question is: which voices or instruments take part, for example a choir or a string quartet?',
    knowledgeHistory_genreContext_occasion: '$t(glossary:occasion_one)',
    knowledgeHistoryDefinition_genreContext_occasion:
      'The question is: at which specific event was music performed, for example a wedding ceremony?',
    knowledgeHistory_genreContext_function: '$t(glossary:function_one)',
    knowledgeHistoryDefinition_genreContext_function:
      'The question is: what purpose did the music serve, for example dancing, worship or focused listening?',
    knowledgeHint_evidence:
      'Read the described property carefully. Distinguish the term from related categories and consider the limits of the source.',
    knowledgeHistory_evidence_observation: '$t(glossary:observation_one)',
    knowledgeHistoryDefinition_evidence_observation:
      'A statement describes something directly heard, for example two pitches sounding at the same time.',
    knowledgeHistory_evidence_metadata: '$t(glossary:sourceInformation_one)',
    knowledgeHistoryDefinition_evidence_metadata:
      'A labeled source gives authorship, place or date, for example; its reliability must be checked separately.',
    knowledgeHistory_evidence_inference: '$t(glossary:inference_one)',
    knowledgeHistoryDefinition_evidence_inference:
      'An informed conclusion is drawn from observations and sources; it is not identical to direct perception.',
    knowledgeHistory_evidence_uncertainty: '$t(glossary:uncertainty)',
    knowledgeHistoryDefinition_evidence_uncertainty:
      'Missing or conflicting evidence is explicitly identified; sound alone does not establish a certain place or date of origin.',
    question_durationSymbol: 'What value does this {{kind}} symbol have?',
    question_measureGap:
      'Which {{kind}} completes this $t(glossary:measure_one) to exactly four $t(glossary:notes.quarter_other)?',
    measureGapDescription:
      'Four-four $t(glossary:measure_one). Present, in order: {{events}}. One {{kind}} is missing at the end.',
    measureGapExplanation:
      'The given values total {{used}} $t(glossary:notes.quarter_other). 4 − {{used}} = {{missing}}. Missing: {{answer}}. Rests count too; bar lines have no duration.',
    durationSymbolHint1:
      'Look at the shape, fill, stem and flags. For rectangular rests, their position relative to the line matters.',
    durationSymbolHint2:
      'Each step from $t(glossary:notes.whole_one) to $t(glossary:notes.half_one), $t(glossary:notes.quarter_one), $t(glossary:notes.eighth_one) and $t(glossary:notes.sixteenth_one) halves the duration. Rest symbols have matching values.',
    measureGapHint1:
      'Express notes and rests in $t(glossary:notes.quarter_other). Add them, then subtract the total from four.',
    measureGapHint2:
      'One $t(glossary:notes.half_one) equals two $t(glossary:notes.quarter_other); two $t(glossary:notes.eighth_other) or four $t(glossary:notes.sixteenth_other) equal one $t(glossary:notes.quarter_one). The missing value must fit exactly.',
    knowledgeRestDuration:
      'Silence for {{value}} × the duration of a $t(glossary:notes.whole_one).',
    knowledge_barlines_single: '$t(glossary:barline_one)',
    knowledge_barlines_final: '$t(glossary:finalBarline_one)',
    knowledgeDefinition_barlines_single:
      'A thin vertical line separates adjacent $t(glossary:measure_other); it has no duration of its own.',
    knowledgeDefinition_barlines_final:
      'A thin and a thick vertical line mark the end of a piece or complete section.',
    knowledgeHint_rests:
      'Rests have definite durations. The steady pulse continues during silence.',
    knowledgeHint_barlines:
      'One thin line separates $t(glossary:measure_other); thin plus thick marks an ending.',
    durationShape_note_whole: 'Unfilled oval notehead without a stem.',
    durationShape_note_half: 'Unfilled oval notehead with a stem and no flag.',
    durationShape_note_quarter: 'Filled notehead with a stem and no flag.',
    durationShape_note_eighth: 'Filled notehead with a stem and one flag.',
    durationShape_note_sixteenth: 'Filled notehead with a stem and two flags.',
    durationShape_rest_whole: 'Filled rectangle hanging below a short reference line.',
    durationShape_rest_half: 'Filled rectangle sitting on a short reference line.',
    durationShape_rest_quarter: 'Vertical jagged rest symbol with a curved lower end.',
    durationShape_rest_eighth: 'Slanted rest symbol with one hook.',
    durationShape_rest_sixteenth: 'Slanted rest symbol with two hooks.',
    measureGapSlot: 'Missing value',
    measureGapCapacity: 'Target: four $t(glossary:notes.quarter_other) in total',

    knowledgeStart: 'Practice knowledge, matching and ordering',
    knowledgeIntro:
      'Nine questions: identify basic concepts, match their explanations and order note values or pitches.',
    type_KNOWLEDGE_MC: 'Knowledge question',
    type_MATCH: 'Match concepts',
    type_ORDER: 'Build a sequence',
    orderMoveUp: 'Move up',
    orderMoveDown: 'Move down',
    orderRemoveItem: 'Remove',
    question_KNOWLEDGE_MC: 'Which concept matches this explanation? {{definition}}',
    question_MATCH:
      'Match each concept with its explanation. Each explanation belongs to exactly one concept.',
    question_ORDER: 'Put all the items in order {{direction}}. {{rule}}',
    knowledgeExplanation: '{{term}}: {{definition}}',
    knowledgeKeyboard_semitone: '$t(glossary:semitone_one)',
    knowledgeKeyboard_wholeTone: '$t(glossary:wholeTone_one)',
    knowledgeKeyboard_twoBlackKeys: '$t(glossary:twoBlackKeys_one)',
    knowledgeKeyboard_threeBlackKeys: '$t(glossary:threeBlackKeys_one)',
    knowledgeKeyboardDefinition_semitone:
      'Distance between immediately adjacent $t(glossary:pianoKey_other), including black keys. There is no key in between.',
    knowledgeKeyboardDefinition_wholeTone:
      'Distance of two $t(glossary:semitone_other). Exactly one key lies between the start and end on the $t(glossary:keyboard_one).',
    knowledgeKeyboardDefinition_twoBlackKeys:
      'Repeating group of two black keys. The white key immediately to its left is C.',
    knowledgeKeyboardDefinition_threeBlackKeys:
      'Repeating group of three black keys. The white key immediately to its left is F.',
    knowledgeHint_keyboard:
      'Use the black-key groups to find your place and count every key step, including black keys.',
    knowledge_pulse_pulse: '$t(glossary:pulse)',
    knowledge_pulse_rhythm: '$t(glossary:rhythm_one)',
    knowledge_pulse_metronome: '$t(glossary:metronome_one)',
    knowledge_pulse_countIn: '$t(glossary:countIn)',
    knowledge_tempo_tempo: '$t(glossary:tempo)',
    knowledge_tempo_bpm: '$t(glossary:beatsPerMinute)',
    knowledge_tempo_faster: 'Higher $t(glossary:tempo)',
    knowledge_tempo_slower: 'Lower $t(glossary:tempo)',
    knowledge_beatGroup_first: 'First $t(glossary:beat_one)',
    knowledge_beatGroup_duple: '$t(glossary:beatGroup_one) of two $t(glossary:beat_other)',
    knowledge_beatGroup_triple: '$t(glossary:beatGroup_one) of three $t(glossary:beat_other)',
    knowledge_beatGroup_quadruple: '$t(glossary:beatGroup_one) of four $t(glossary:beat_other)',
    knowledgeDefinition_pulse_pulse:
      'Steady underlying beats that provide a timing reference when making music. Their spacing stays equal here.',
    knowledgeDefinition_pulse_rhythm:
      'The sequence of sounding events and rests in time. It can include long and short durations while the underlying beats stay steady.',
    knowledgeDefinition_pulse_metronome:
      'A device or app that produces evenly spaced clicks at a chosen speed.',
    knowledgeDefinition_pulse_countIn:
      'Steady clicks before your entrance. They establish the speed and starting point together.',
    knowledgeDefinition_tempo_tempo:
      'The speed of the underlying beat. It determines how quickly evenly spaced clicks follow one another.',
    knowledgeDefinition_tempo_bpm:
      'The unit for the number of underlying beats in one minute. At 60, consecutive clicks are one second apart.',
    knowledgeDefinition_tempo_faster:
      'More beats per minute than before: the gaps between clicks become shorter.',
    knowledgeDefinition_tempo_slower:
      'Fewer beats per minute than before: the gaps between clicks become longer.',
    knowledgeDefinition_beatGroup_first:
      'Here, the accented counting position that starts a new group. Counting returns to 1; the time interval stays equal.',
    knowledgeDefinition_beatGroup_duple:
      'Repeating count 1–2, 1–2. After the second position, the next group begins.',
    knowledgeDefinition_beatGroup_triple:
      'Repeating count 1–2–3, 1–2–3. After the third position, the next group begins.',
    knowledgeDefinition_beatGroup_quadruple:
      'Repeating count 1–2–3–4, 1–2–3–4. After the fourth position, the next group begins.',
    knowledgeHint_pulse:
      'Distinguish the steady timing reference, the sequence of sounds and rests, the click device and the lead-in before your entrance.',
    knowledgeHint_tempo:
      'Compare speed, its unit and changing click intervals: more beats per minute means shorter intervals.',
    knowledgeHint_beatGroup:
      'Count each position once. After the last position, return to 1; accenting a beat does not change the time interval.',
    type_PULSE_TAP: 'Tap the $t(glossary:pulse)',
    question_PULSE_TAP:
      'After the $t(glossary:countIn), tap every click: {{count}} steady beats at {{bpm}} beats per minute. Listen to one whole group first; recording starts on the next 1.',
    pulseDescription:
      '{{count}} evenly spaced counting positions at {{bpm}} beats per minute. The first is accented; all time intervals are equal.',
    pulseGroup: '{{count}} beats · {{bpm}} BPM · 1 starts the group',
    pulseHint1:
      'Listen to the whole count-in group first. Start tapping on the next accented 1 and tap every click, including unaccented ones.',
    pulseHint2:
      'Tap exactly {{count}} times at evenly spaced intervals at {{bpm}} beats per minute. Holding the button counts as one tap.',
    pulseExplanation:
      '{{matched}} of {{total}} beats within ±{{tolerance}} ms; {{missing}} are missing or outside the window, {{extra}} are extra. {{pattern}} Tap every click once. The accented 1 is no longer than other beats.',
    pulsePattern: 'Beats after recording starts: {{times}} ms.',
    pulseTapHint:
      'Tap every click. With a keyboard, press Space or Enter on this button. Holding a key counts once.',
    pulseWindow:
      'Timing window: ±{{tolerance}} ms. Tap onsets are measured, not how long you hold the button.',
    pulseTarget: 'Beat {{index}}: {{time}} ms',
    knowledgeRaises: 'Raises a natural note by {{distance}}.',
    knowledgeLowers: 'Lowers a natural note by {{distance}}.',
    knowledgeNatural: 'Cancels an existing alteration and restores the natural pitch of the note.',
    knowledgeDuration: 'Value: {{value}} × $t(glossary:notes.whole_one).',
    knowledgeInterval: 'Spans {{positions}}, counting both endpoints, and {{distance}}.',
    knowledgePositions_one: '{{count}} diatonic note position',
    knowledgePositions_other: '{{count}} diatonic note positions',
    knowledgeTriad:
      '$t(glossary:triad_one) in thirds: its notes are {{pattern}} $t(glossary:semitone_other) above the $t(glossary:root_one).',
    knowledgeTriad_major: 'Major $t(glossary:triad_one)',
    knowledgeTriad_minor: 'Minor $t(glossary:triad_one)',
    knowledgeTriad_diminished: 'Diminished $t(glossary:triad_one)',
    knowledgeTriad_augmented: 'Augmented $t(glossary:triad_one)',
    knowledgeScale:
      'Ascending $t(glossary:scale_one): consecutive steps over an octave contain {{pattern}} $t(glossary:semitone_other).',
    knowledgeMeter:
      '{{count}} beats per $t(glossary:measure_one), each with the value {{beat}}. Grouping in denominator units: {{groups}}.',
    knowledgeHint_accidentals:
      'Compare raising, lowering and cancelling an alteration. $t(glossary:sharp_other) and $t(glossary:flat_other) change the natural pitch by one $t(glossary:semitone_one), double signs by two.',
    knowledgeHint_noteValues:
      'Reference for the fractions: $t(glossary:notes.whole_one). A dot adds half of the undotted value.',
    knowledgeHint_intervals:
      'Count the note letters including both endpoints and also the semitone distance. Semitones alone do not determine the spelling.',
    knowledgeHint_triads:
      'Consider the root, third and fifth in thirds. Compare their semitone distances from the root.',
    knowledgeHint_scales:
      'Compare consecutive semitone steps upwards. Classical melodic minor is explicitly considered in its ascending form here.',
    knowledgeHint_meters:
      'Distinguish the number of denominator units from the number of beats. In compound meters, three units form one beat.',
    knowledgeHint_pitches:
      'Compare the octave first, then the pitch within it. German H corresponds to English B.',
    knowledgeHint2_KNOWLEDGE_MC: 'Narrow your choice to these two concepts: {{candidates}}.',
    knowledgeHint2_MATCH: 'Begin with this pair: {{term}} – {{definition}}',
    knowledgeHint2_ORDER: 'The first item is {{first}}.',
    order_noteValues_ascending: 'from shortest to longest duration',
    order_noteValues_descending: 'from longest to shortest duration',
    order_pitches_ascending: 'from lowest to highest',
    order_pitches_descending: 'from highest to lowest',
    orderRule_noteValues: 'The complete note value, including its dot, is compared.',
    orderRule_pitches: 'The octave is part of the pitch.',
    orderExplanation: 'The correct order {{direction}} is: {{sequence}}. {{rule}}',
    matchSelectTerm: 'Select a concept to edit',
    matchDefinitions: 'Choose an explanation for {{term}}',
    matchUnset: 'not matched yet',
    matchFilled: '{{count}} of {{total}} concepts matched.',
    matchClear: 'Clear match',
    matchInstruction:
      'Choose a concept, then an explanation. Choosing an explanation that is already used clears its previous match.',
    orderChoices: 'Available items',
    orderAnswer: 'Your sequence',
    orderEmpty: 'Choose the first item from the options.',
    orderFilled: '{{count}} of {{total}} items ordered.',
    orderPosition: 'Position {{index}}: {{value}}',
    orderUp: 'Move {{value}} up',
    orderDown: 'Move {{value}} down',
    orderRemove: 'Remove {{value}}',
    orderInputHint:
      'Choose the items in your preferred order. Use the buttons to move or remove them.',
    title: 'Read and hear music',
    intro:
      'Practice note names and intervals. Choose an answer and check it. Hints guide you step by step.',
    start: 'Start practice set',
    restart: 'Start a new practice set',
    noteInput: 'Try notation and piano input',
    constructionStart: 'Enter notes and build intervals',
    chooseSet: 'Choose practice set',
    rhythmStart: 'Practice rhythm and meter',
    rhythmIntro:
      'Six questions: tap note onsets after a count-in $t(glossary:measure_one) and identify how $t(glossary:timeSignature_other) are grouped. Stay silent during rests.',
    type_RHYTHM_TAP: 'Tap $t(glossary:rhythm_one)',
    type_METER_IDENTIFY: 'Group the $t(glossary:meter_one)',
    type_PICKUP_IDENTIFY: 'Recognize a $t(glossary:pickup_one)',
    question_RHYTHM_TAP:
      'Tap each note onset in this $t(glossary:measure_one). Each $t(glossary:beat_one) has the value {{beat}}; the $t(glossary:tempo) is {{bpm}} beats per minute. Your recording starts after one count-in $t(glossary:measure_one).',
    question_METER_IDENTIFY:
      'How is this $t(glossary:meter_one) grouped? Choose the number of beats and their note value.',
    question_PICKUP_IDENTIFY:
      'Is the first notated measure before the first bar line a pickup? Compare its duration with the following complete measure.',
    pickupYes: 'Yes, a pickup',
    pickupNo: 'No, a complete measure',
    pickupExplanation:
      '{{meter}} holds {{capacity}} × one quarter-note value. Before the first bar line: {{first}} × one quarter-note value. {{answer}}. The second measure shows the full length.',
    pickupDescription:
      'Time signature {{meter}}. First measure before the bar line: {{events}} A complete measure follows.',
    pickupHint1: 'Add only the note values before the first bar line.',
    pickupHint2:
      'Compare that sum with the numerator of the time signature: 2/4, 3/4 or 4/4. Two eighth notes equal one quarter note.',
    pickupScroll: 'Scroll the notation sideways to see the full following measure.',
    meterOption: '{{count}} beats with the value {{beat}}',
    meterExplanation:
      '{{meter}}: {{count}} beats per $t(glossary:measure_one), each with the value {{beat}}. Each beat divides into {{division}} equal parts. The grouping in denominator units is {{groups}}. The numerator counts denominator units, which are not always the beats.',
    rhythmExplanation:
      '{{matched}} of {{total}} note onsets within ±{{tolerance}} ms; {{missing}} are missing or outside the window, {{extra}} are extra. {{pattern}} Tap note onsets only; stay silent during rests. Any missing or extra tap counts as an error.',
    rhythmPattern: 'Note onsets after the start of the $t(glossary:measure_one): {{times}} ms.',
    rhythmDescription: 'Time signature {{meter}}. {{events}}',
    rhythmEvent: '{{index}}: {{kind}}, {{duration}}.',
    rhythmNote: 'note',
    rhythmRest: 'rest',
    rhythmHint1:
      'Keep counting the beat. Tap only when a note begins, not throughout its duration. Rests have duration but no tap.',
    rhythmHint2:
      'This $t(glossary:measure_one) has {{total}} note onsets. Keep {{count}} steady beats with the value {{beat}} at {{bpm}} beats per minute.',
    meterHint1:
      'The numerator gives the number of units; the denominator gives their note value. In 6/8, 9/8 and 12/8, three eighth notes form one beat.',
    meterHint2: 'Group the units as follows: {{groups}}. Each group forms one beat.',
    rhythmReady: 'Ready for the count-in.',
    rhythmMode: 'Rhythm mode',
    rhythmMode_practice: 'Practice',
    rhythmMode_test: 'Test run',
    rhythmPracticeIntro:
      'Practice the same measure without a score. The test run then starts at the original tempo. Practice counts as help for this question.',
    rhythmPracticeTempo: '{{bpm}} BPM ({{percent}}%)',
    rhythmSlower: 'Slower −5',
    rhythmFaster: 'Faster +5',
    rhythmLoopOn: 'Loop on',
    rhythmLoopOff: 'Loop off',
    rhythmMetronomeTitle: 'Practice metronome',
    rhythmMetronome: 'Metronome: {{mode}}',
    rhythmMetronome_off: 'Off',
    'rhythmMetronome_count-in': 'Count-in only',
    rhythmMetronome_through: 'Throughout',
    rhythmPracticeBegin: 'Start practice',
    rhythmPracticeStop: 'Stop practice',
    rhythmPracticeFinished: 'Practice round complete. Practice again or switch to the test run.',
    rhythmPracticeFeedback:
      'Round {{round}}: {{matched}} of {{total}} onsets matched, {{extras}} extra taps. No score.',
    rhythmPreparing: 'Preparing sound …',
    rhythmCountIn: 'Count-in: {{current}} of {{count}}',
    rhythmRecording: 'Recording: {{current}} of {{count}} beats',
    rhythmFinished: 'Recording complete. Check it or record again.',
    rhythmBegin: 'Count in and record',
    rhythmRetry: 'Record again',
    rhythmCancel: 'Cancel recording',
    rhythmTap: 'Tap now',
    rhythmTapHint:
      'Tap at each note onset. With a keyboard, press Space or Enter on this button. Holding a key counts once.',
    rhythmTapCount_one: '{{count}} tap recorded.',
    rhythmTapCount_other: '{{count}} taps recorded.',
    rhythmWindow:
      'Timing window: ±{{tolerance}} ms. Note onsets are measured, not how long you hold the button.',
    rhythmPreview: 'Listen to the rhythm example',
    rhythmTarget: 'Note onset {{index}}: {{time}} ms',
    rhythmHit: 'matched, offset {{offset}} ms',
    rhythmMiss: 'missing or outside the timing window',
    rhythmExtras: 'Extra taps: {{times}} ms.',
    rhythmLatency:
      'Reported audio delay: {{latency}} ms; taken into account when measuring your taps.',
    chordStart: 'Recognize and write chords',
    harmonyStart: 'Practise harmony and dictation',
    harmonyIntro:
      'Hear cadences, identify scale degrees, and enter short melodies and rhythms by ear.',
    type_CADENCE_IDENTIFY: 'Identify cadence',
    type_FUNCTION_ANALYSIS: 'Identify scale degree',
    type_MELODY_DICTATION: 'Melodic dictation',
    type_RHYTHM_DICTATION: 'Rhythmic dictation',
    question_CADENCE_IDENTIFY: 'Listen to the chord progression in {{key}}. How does it end?',
    question_FUNCTION_ANALYSIS: 'Which scale degree is this chord in {{key}}?',
    question_MELODY_DICTATION:
      'Listen to the melody and enter {{count}} notes in the order heard. The first note is C.',
    question_RHYTHM_DICTATION:
      'Listen to the rhythm and enter the {{count}} note values in the order heard.',
    cadence_authentic: 'Authentic cadence (V–I)',
    cadence_plagal: 'Plagal cadence (IV–I)',
    cadence_half: 'Half cadence (I–V)',
    cadence_deceptive: 'Deceptive cadence (V–vi)',
    cadenceExplanation: 'In {{key}}, the progression ends with {{answer}}.',
    functionExplanation: 'In {{key}}, the chord belongs to {{answer}}.',
    dictationExplanation: 'Heard sequence: {{answer}}.',
    harmonyHint1: 'Listen or look for the starting and ending points first.',
    harmonyHint2: 'Compare the sequence step by step with the offered notes or functions.',
    dictationProgress: '{{count}} of {{total}} entries placed',
    dictationUndo: 'Remove last entry',
    chordIntro:
      'Nine questions: write major, minor, diminished and augmented triads with inversions, recognize them in notation and identify them by ear.',
    type_CHORD_BUILD: 'Write $t(glossary:chord_other)',
    type_CHORD_IDENTIFY: 'Recognize $t(glossary:chord_other)',
    question_CHORD_BUILD:
      'Write {{name}} in close position above {{bass}}. The $t(glossary:bassNote_one) is given; add the two remaining notes.',
    question_CHORD_BUILD_SEVENTH:
      'Write {{name}} in close position above {{bass}}. The bass note is given; add the three remaining notes.',
    question_CHORD_IDENTIFY:
      'Which $t(glossary:chord_one) do you see? Identify its $t(glossary:root_one), quality and $t(glossary:inversion_one).',
    question_CHORD_AURAL:
      'You hear $t(glossary:root_one) {{root}} first, then the $t(glossary:triad_one). Which quality and $t(glossary:inversion_one) do you hear?',
    question_CHORD_AURAL_SEVENTH:
      'You hear the root {{root}} first, then the seventh chord. Which quality and inversion do you hear?',
    chordExplanation:
      '{{name}}: {{notes}}. From $t(glossary:root_one) {{root}}, the intervals are {{third}} and {{fifth}}. The $t(glossary:bassNote_one) is {{bass}}, giving {{inversion}}. Written answers require complete notes, including accidentals and octave. Close position places the remaining chord tones in their next higher registers above the bass note.',
    chordSeventhExplanation:
      '{{name}}: {{notes}}. From root {{root}}, the intervals are {{third}}, {{fifth}}{{extension}}. The bass is {{bass}}, giving {{inversion}}. Written answers require full pitches, including accidentals and octave.',
    chordHint1:
      'Arrange the three letter names mentally in thirds. The bottom note of that arrangement is the $t(glossary:root_one). Compare it with the actual lowest note: root, third or fifth in the bass determines $t(glossary:rootPosition) or $t(glossary:inversion_one).',
    chordSeventhHint1:
      'Arrange four chord notes in thirds. Root, third, fifth or seventh in the bass determines the inversion.',
    chordHint2:
      'The $t(glossary:root_one) is {{root}}. From there you need {{third}} and {{fifth}}. The given or heard $t(glossary:bassNote_one) {{bass}} shows the position; place the other chord tones as close above it as possible.',
    chordSeventhHint2:
      'The root is {{root}}. Find {{third}}, {{fifth}}{{extension}}. The bass {{bass}} shows the inversion; place the remaining notes as close above it as possible.',
    chordAuralHint1:
      'Remember the first single note as the $t(glossary:root_one). Then listen for the lowest note of the $t(glossary:chord_one): compare it with the reference note, including across octaves. Root, third or fifth in the bass determines the position. The intervals between the notes determine the triad quality.',
    chordSeventhAuralHint1:
      'Remember the first note as the root. Then listen for the bass and seventh. Compare root, third, fifth and seventh to determine the inversion.',
    chordPreview: 'Your $t(glossary:chord_one)',
    chordSelectTone: 'Choose a chord tone to edit',
    chordTone: 'Note {{index}}',
    chordToneEmpty: 'not placed yet',
    chordFilled: '{{count}} of 2 answer notes placed.',
    chordFilledSeventh: '{{count}} of 3 answer notes placed.',
    chordInputHint:
      'Choose note 2 or 3 and place it in the right $t(glossary:measure_one). The $t(glossary:bassNote_one) stays fixed on the left. The combined notation shows your $t(glossary:chord_one). You may enter the upper notes in either order.',
    chordInputHintSeventh:
      'Choose note 2, 3 or 4 and place it in the right measure. The bass stays fixed. You may enter the remaining notes in any order.',
    tonalityStart: 'Practise scales and key signatures',
    tonalityIntro:
      'Twelve questions: identify and write major and minor scales, recognise key signatures and build them yourself.',
    type_SCALE_BUILD: 'Write $t(glossary:scale_other)',
    type_SCALE_IDENTIFY: 'Identify $t(glossary:scale_other)',
    type_KEYSIG_BUILD: 'Build $t(glossary:keySignature_other)',
    type_KEYSIG_IDENTIFY: 'Identify $t(glossary:keySignature_other)',
    question_SCALE_BUILD:
      'Write {{type}} {{direction}} from {{tonic}}, over one octave with eight notes. The first note is given.',
    question_SCALE_IDENTIFY:
      'Which scale type do you see? The sequence starts on {{tonic}} and goes {{direction}}.',
    question_KEYSIG_BUILD:
      'Build the $t(glossary:keySignature_one) for {{key}}. Choose the altered notes in the usual notation order.',
    question_KEYSIG_IDENTIFY:
      'Which {{mode}} key has this $t(glossary:keySignature_one)? The mode is given.',
    scaleAscending: 'ascending',
    scaleDescending: 'descending',
    scaleExplanation:
      '{{type}} {{direction}} from {{tonic}}: {{notes}}. The distances, counted in $t(glossary:semitone_other), are {{pattern}}. Order, spelling and octave are part of the answer.',
    melodicDescending:
      'In the classical convention, descending melodic minor is written like natural minor. The sixth and seventh degrees are not raised.',
    scaleHint1:
      'Work through the seven natural notes in the requested direction. Note 8 is the starting note in the next octave. Then determine the accidentals.',
    scaleHint2:
      'Compare the distances: {{pattern}} in $t(glossary:semitone_other). Write each letter once in the appropriate octave before adding the octave note.',
    signatureEmpty: 'no accidentals',
    signatureCount: '{{count}} {{sign}}',
    signatureExplanation:
      '{{key}} has {{signature}}. The order is: {{notes}}. Major and its relative natural minor share a key signature; the given mode determines the answer here.',
    signatureDescription:
      '$t(glossary:keySignature_one): {{signature}}. Altered notes in order: {{notes}}.',
    signatureHint1:
      'Sharp order: {{sharps}}. Flat order: {{flats}}. Always start at the beginning of the relevant sequence.',
    signatureHint2:
      'The required signature has {{signature}}. Read or write these notes at the beginning of the appropriate accidental sequence.',
    scaleDegree: 'Note {{index}}',
    scaleSelectDegree: 'Choose the note to edit',
    scaleInputHint:
      'Choose note 2 to 8. Tap and drag on the staff or use the arrow keys to set its pitch. The accidental controls change the selected note.',
    scaleFilled: '{{count}} of 7 answer notes placed.',
    signatureInput: 'Choose accidentals',
    signatureSharp: '$t(glossary:sharp_one)',
    signatureFlat: '$t(glossary:flat_one)',
    signatureAppend: 'Add {{note}}',
    signatureNoAccidentals: 'No accidentals',
    signatureRemoveLast: 'Remove last accidental',
    signatureEntered: 'Your accidental sequence: {{notes}}',
    signatureNothingEntered: 'No accidental sequence entered yet.',
    constructionIntro:
      'Place notes, find keys and build intervals. Nine questions with hints and explained solutions.',
    type_NOTE_PLACE: 'Place notes',
    type_KEY_FIND: 'Find piano keys',
    type_INTERVAL_BUILD: 'Build intervals',
    question_NOTE_PLACE: 'Write {{note}} on the empty staff. Check its accidental and octave.',
    question_KEY_FIND: 'Find the key for {{note}}. Check the octave.',
    question_KEY_FIND_name: 'Find the key for {{note}}.',
    question_KEY_FIND_score:
      'Play the written note on the $t(glossary:keyboard_one). Check its $t(glossary:noteName_one) and $t(glossary:octave_one).',
    question_INTERVAL_BUILD:
      'Write the second note: {{interval}} from {{from}}. Place it in the empty second measure.',
    writtenPitch:
      'The complete answer is {{note}}. The letter, accidental and octave must match; an equally sounding note with a different spelling does not count here.',
    keyExplanation:
      'The required key sounds as {{note}}. Start from the natural note {{natural}} in the same octave. {{alteration}} Equally sounding spellings belong to the same key; a different octave does not count.',
    keyNameExplanation:
      'The required key sounds as {{note}}. The $t(glossary:naturalNote_one) {{natural}} occurs only once in the shown range. Start there. {{alteration}} Equally sounding spellings belong to the same key.',
    keyHint1:
      'Find the groups of two black keys: C is immediately to their left, and D is between the two black keys. Count from there to the required natural note in the stated octave.',
    keyNameHint1:
      'Find the $t(glossary:twoBlackKeys_other): C is immediately to their left, and D is between their keys. Count along the white keys to the requested $t(glossary:naturalNote_one) in the shown range.',
    keyScoreHint1:
      'First read the $t(glossary:clef_one) and the note position, including its $t(glossary:ledgerLine_other). Work out the complete $t(glossary:noteName_one). Find C in the same $t(glossary:octave_one) on the $t(glossary:keyboard_one), then move to the matching key.',
    keyHint2:
      'First find {{natural}}. {{alteration}} Moving to the immediately adjacent key is one semitone, including between E and F and between B and C.',
    buildHint2:
      'The pitch distance is {{distance}}. First count the natural notes in the requested direction, including the starting note. Then adjust the target note’s accidental.',
    inputSolution: 'This is the solution',
    staffInputHint:
      'Tap the empty measure or adjust the rest with your screen reader. Drag to move your note. Choose its accidental with the controls below.',
    back: 'Back to exercises',
    question_NOTE_NAME: 'What is this note called? Choose the name without its octave.',
    question_NOTE_NAME_octave:
      'What is the written note called, including its $t(glossary:octave_one)?',
    question_INTERVAL_IDENTIFY_VISUAL:
      'Which $t(glossary:interval_one) do you see between these two notes?',
    question_INTERVAL_IDENTIFY_AURAL:
      'Which $t(glossary:interval_one) do you hear between these two notes?',
    type_NOTE_NAME: 'Note names',
    type_INTERVAL_IDENTIFY_VISUAL: 'Read intervals',
    type_interval_number: 'Count the interval number',
    type_interval_direction: 'Read the direction',
    type_interval_motion: 'Repeated note, step or leap',
    type_interval_semitones: 'Count half steps',
    type_interval_quality: 'Identify interval quality',
    type_interval_perfect: 'Check perfect intervals',
    question_interval_semitones:
      'How many half steps separate the two written pitches? Count the moves between adjacent piano keys. The starting key counts as 0.',
    question_interval_quality:
      'What is the full name of the written interval? Check its number and distance in half steps.',
    question_interval_perfect:
      'Is the written interval a perfect fourth, perfect fifth or perfect octave? Check both its number and half-step distance.',
    intervalPerfectYes: 'Yes, a perfect interval',
    intervalPerfectNo: 'No, not a perfect interval here',
    intervalReadingExplanation_semitones:
      '{{from}} → {{to}}: distance {{distance}}. Count moves between immediately adjacent keys, including black keys. The starting key counts as 0; identical pitches have distance 0.',
    intervalReadingExplanation_quality:
      '{{from}} → {{to}}: letter-name sequence {{path}}, interval number {{count}}, sounding distance {{distance}}. Number and distance together give {{answer}}.',
    intervalReadingExplanation_perfect:
      '{{from}} → {{to}}: interval number {{count}}, sounding distance {{distance}}. A perfect fourth has 5 half steps, a perfect fifth 7 and a perfect octave 12. Number and distance must both fit. Answer: {{answer}}.',
    intervalReadingHint_semitones_1:
      'Begin at the first marked key with 0. Each move to the next key counts 1, regardless of key color.',
    intervalReadingHint_semitones_2:
      'E to F and B to C have no intervening black key: one half step. Other adjacent white keys have a black key between them: two half steps.',
    intervalReadingHint_quality_1:
      'Count the letter-name positions first, including the start and destination. Then find the half-step distance between the pitches.',
    intervalReadingHint_quality_2:
      'A minor third has 3 half steps; a major third has 4. Perfect fourth, fifth and octave combine the numbers 4, 5 and 8 with 5, 7 and 12 half steps.',
    intervalReadingHint_perfect_1:
      'A fourth or fifth letter-name position alone is not enough. Also check the number of half steps.',
    intervalReadingHint_perfect_2:
      'Compare number and distance: fourth 4 with 5 half steps, fifth 5 with 7, octave 8 with 12. A distance of 6 half steps meets none of these conditions.',
    question_interval_number:
      'What interval number do the two written notes form? Count the letter-name positions, including both end notes.',
    question_interval_direction: 'How does pitch move from the first written note to the second?',
    question_interval_motion: 'Is the pattern a repeated note, a step or a leap?',
    intervalNumberOption: '{{number}} · {{name}}',
    intervalNumber1: '$t(glossary:unison_one)',
    intervalNumber2: '$t(glossary:second_one)',
    intervalNumber3: '$t(glossary:third_one)',
    intervalNumber4: '$t(glossary:fourth_one)',
    intervalNumber5: '$t(glossary:fifth_one)',
    intervalNumber6: '$t(glossary:sixth_one)',
    intervalNumber7: '$t(glossary:seventh_one)',
    intervalNumber8: '$t(glossary:octave_one)',
    intervalDirectionUp: 'Ascending',
    intervalDirectionDown: 'Descending',
    intervalDirectionSame: 'Same pitch',
    intervalMotionRepeat: '$t(glossary:noteRepetition_one)',
    intervalMotionStep: '$t(glossary:melodicStep_one)',
    intervalMotionLeap: '$t(glossary:melodicLeap_one)',
    intervalReadingExplanation_number:
      '{{from}} → {{to}}: {{path}}. Include both end positions. Number of letter-name positions: {{count}}. Answer: {{answer}}.',
    intervalReadingExplanation_direction:
      '{{from}} → {{to}}: Compare the vertical positions of the two noteheads from left to right. Answer: {{answer}}.',
    intervalReadingExplanation_motion:
      '{{from}} → {{to}}: {{path}}. Interval number {{count}}. A unison is a repeated note, a second is a step; a third or larger is a leap. Answer: {{answer}}.',
    intervalReadingHint_number_1:
      'Begin at the first note with 1. Each next line or space takes you to the next number.',
    intervalReadingHint_number_2:
      'Count the destination note too. Two identical natural pitches form a unison with the number 1.',
    intervalReadingHint_direction_1:
      'Read the left notehead first, then the right. Compare their height on the staff.',
    intervalReadingHint_direction_2:
      'A higher second notehead means ascending; a lower one means descending. The same position here means the same pitch.',
    intervalReadingHint_motion_1:
      'First check whether the two noteheads occupy the same position. Otherwise, count the intervening letter-name positions too.',
    intervalReadingHint_motion_2:
      'The same pitch is a repetition; the immediately adjacent letter-name position is a step. Skipping positions makes a leap.',
    type_INTERVAL_IDENTIFY_AURAL: 'Hear intervals',
    progress: 'Question {{current}} of {{total}}',
    progressLabel: 'Practice set progress',
    answers: 'Choose an answer',
    next: 'Continue',
    finish: 'View results',
    play: 'Listen to the notes',
    replay: 'Listen again',
    stop: 'Stop playback',
    audioError: 'The sound could not start. Try again or skip the listening questions.',
    noHearing: 'Cannot listen right now',
    hearingPaused:
      'Listening questions are skipped in this practice set. You can practice them with headphones in your next set.',
    headphones: 'Listen to the notes before answering. Headphones help in a noisy environment.',
    hint: 'Hint {{level}}',
    solution: 'Explain the answer',
    assisted: 'Answered with a hint',
    hintHeading: 'Your hint',
    complete: 'Practice set complete',
    summary: '{{correct}} of {{answered}} answers correct.',
    independent_one: '{{count}} answer correct without a hint.',
    independent_other: '{{count}} answers correct without a hint.',
    assistedSummary_one: '{{count}} question answered with a hint.',
    assistedSummary_other: '{{count}} questions answered with a hint.',
    skippedSummary_one: '{{count}} listening question skipped; it does not count as a mistake.',
    skippedSummary_other: '{{count}} listening questions skipped; they do not count as mistakes.',
    noAnswers:
      'You skipped the listening questions. Start a new practice set when you can listen again.',
    unknownAnswer: 'Unknown answer',
    up: 'up',
    down: 'down',
    atReference: 'The note is on this exact line.',
    noteSteps_one: 'From there, move {{count}} letter-name step {{direction}}.',
    noteSteps_other: 'From there, move {{count}} letter-name steps {{direction}}.',
    noteExplanation:
      'In the {{clef}}, {{reference}} is on line {{line}} from the bottom. {{steps}} {{alteration}} The note is called {{answer}}.',
    alter_0: 'Without an $t(glossary:accidental_one), the letter name stays unaltered.',
    alter_1: 'The $t(glossary:sharp_one) raises the note by one $t(glossary:semitone_one).',
    alter_2: 'The $t(glossary:doubleSharp_one) raises the note by two $t(glossary:semitone_other).',
    'alter_-1': 'The $t(glossary:flat_one) lowers the note by one $t(glossary:semitone_one).',
    'alter_-2':
      'The $t(glossary:doubleFlat_one) lowers the note by two $t(glossary:semitone_other).',
    diatonicCount_one: '{{count}} letter name',
    diatonicCount_other: '{{count}} letter names',
    halfSteps_one: '{{count}} $t(glossary:semitone_one)',
    halfSteps_other: '{{count}} $t(glossary:semitone_other)',
    intervalExplanation:
      '{{from}} → {{to}} spans {{diatonic}}, counting both end notes, and {{distance}} in pitch. The interval is {{answer}}.',
    noteHint1:
      'Start with the $t(glossary:clef_one). Count lines and spaces before reading the $t(glossary:accidental_one).',
    noteHint2:
      '{{reference}} is on line {{line}} from the bottom. Each next line or space moves to the next letter name.',
    visualHint1:
      'First count letter names, including both end notes. Then find the pitch distance; the spelling is part of the answer.',
    auralHint1:
      'Listen to the notes again. Compare the pitch distance with intervals you already know.',
    intervalHint2: 'The pitch distance is {{distance}}. Compare it with the available answers.',
    notationDescription: '{{clef}}. {{notes}}',
    positionBottom: 'Note {{index}} is on the bottom line. {{alteration}}',
    positionSteps: 'Note {{index}}: Start on the bottom line. {{steps}} {{alteration}}',
  },
  lesson: {
    overview:
      'Your first lesson: ten reading and listening questions. Learn the basics, practice with hints and revisit mistakes with new notation examples.',
    open: 'View lesson',
    openNamed: 'Open {{title}}',
    openAnother: 'Open lesson',
    taskCount_one: '{{count}} question',
    taskCount_other: '{{count}} questions',
    exampleTempo: 'Sound example: {{bpm}} $t(glossary:notes.quarter_other) per minute.',
    scrollExample: 'Scroll the notation sideways to see all the notes.',
    keyboardExample: 'Piano keyboard example; marked keys: {{notes}}.',
    pulseExampleTempo: 'Sound example: {{bpm}} beats per minute, two beat groups.',
    keyboardMarkers: 'Dots mark the keys used in the notation example.',
    scrollKeyboardExample:
      'Scroll the piano keyboard sideways to see all labeled octave registers.',
    start_one: 'Start {{count}} question',
    start_other: 'Start {{count}} questions',
    restart: 'Practice lesson again',
    home: 'Back to learning',
    introProgress: 'Introduction {{current}} of {{total}}',
    introNext: 'Next introduction card',
    example: 'Sound example',
    chooseExample: 'Choose an example',
    progressLabel: 'Lesson progress',
    hearingPaused:
      'Listening questions are skipped for this lesson, including the review. You can listen again with headphones on your next attempt.',
    reviewTitle: 'Revisit your mistakes',
    reviewIntro_one:
      'One question was not correct yet. You will get a new notation example on the same topic. Your first attempt is counted separately.',
    reviewIntro_other:
      '{{count}} questions were not correct yet. You will get new notation examples on the same topics. Your first attempt is counted separately.',
    reviewStart: 'Start review',
    reviewProgress: 'Review {{current}} of {{total}}',
    reviewProgressLabel: 'Review progress',
    roundEnd: 'Finish round',
    complete: 'Lesson finished',
    initialResult: 'First attempt: {{correct}} of {{answered}} correct.',
    accuracy: 'First-attempt accuracy: {{value}}%.',
    reviewResult_one: 'Review: {{correct}} of {{count}} question correct.',
    reviewResult_other: 'Review: {{correct}} of {{count}} questions correct.',
    reviewAssisted_one: 'One review question answered with hints.',
    reviewAssisted_other: '{{count}} review questions answered with hints.',
    reviewSkipped_one: 'One listening question skipped in the review.',
    reviewSkipped_other: '{{count}} listening questions skipped in the review.',
    unresolved_one: 'One question needs more practice. Start a new attempt when you are ready.',
    unresolved_other:
      '{{count}} questions need more practice. Start a new attempt when you are ready.',
    allResolved: 'All answered topics were solved correctly, some during the review.',
    duration: 'Practice time: {{minutes}} min {{seconds}} sec.',
    saving: 'Saving your result on this device …',
    saved: 'Result saved on this device.',
    saveError:
      'Your result has not been saved yet. Keep this page open and try again. Your first attempt and review remain visible here.',
    retrySave: 'Try saving again',
    latestTitle: 'Your last attempt',
    latestSummary: '{{correct}} of {{answered}} correct on the first attempt.',
    latestReview: '{{correct}} of {{total}} review questions correct.',
    latestDate: 'Practiced on {{date}}',
    olderVersion: 'This attempt belongs to an earlier version of the lesson.',
    loadError: 'Saved results could not be loaded. You can still practice.',
    retryLoad: 'Try loading results again',
  },
  piano: {
    settings: 'Customize',
    title: 'Piano keyboard',
    midiDevice: 'MIDI keyboard',
    midiConnect: 'Connect MIDI',
    midiIntro:
      'Connect a USB or already paired Bluetooth MIDI keyboard. Notes are processed only on this device.',
    midiNoDevice: 'No MIDI input found yet. Connect a keyboard and check pairing.',
    midiUnavailable:
      'MIDI is unavailable here or access was denied. Check your browser, device and permissions.',
    midiConnected: 'MIDI: {{device}}',
    midiDisconnected: 'MIDI keyboard disconnected. Reconnect it or choose another device.',
    midiVelocity: 'Velocity {{velocity}}/127',
    midiSustain: 'Sustain on',
    labels: 'Note names',
    labels_none: 'No labels',
    labels_de: 'German (H/B)',
    labels_intl: 'International (B/B♭)',
    range: 'Range',
    range_practice: 'C4–E5',
    range_middle: 'C3–C6',
    range_full: 'Full piano (A0–C8)',
    range_fixed: 'Range: {{from}}–{{to}}',
    eitherName: '{{sharp}} or {{flat}}',
    smaller: '−',
    larger: '+',
    smallerHint: 'Make keys smaller',
    largerHint: 'Make keys larger',
    lower: 'Lower',
    higher: 'Higher',
    moveMode: 'Move',
    playMode: 'Play',
    playHint: 'Touch one or several keys. Move shifts the range without playing.',
    moveHint: 'Swipe left or right. Choose Play to turn the sound back on.',
    shortcutHint:
      'With the piano keyboard focused: the physical keys starting at A play C4–E5 (QWERTY: A W S E D F T G Y H U J K O L P ;). Tab and Space or Enter play individual keys.',
    shortcutFixedHint:
      'With the piano keyboard focused, letter keys only play notes in the shown range. Tab and Space or Enter play individual keys.',
  },
  audioTest: {
    title: 'Audio test',
    intro: 'For latency measurements (P1.16). The tone starts on touch, not on release.',
    tone: 'Tone A4',
    chord: 'C major triad',
    sequence: 'Scale with metronome',
    metronome: 'Metronome 90 BPM',
    stop: 'Stop all',
    notStarted: 'Sound starts with the first tap.',
    sampleRate: 'Sample rate: {{rate}} Hz',
    reportedLatency: 'Latency reported by the system: {{base}} ms processing, {{output}} ms output',
    noReportedLatency: 'The system does not report latency; please measure (see guide).',
    piano_idle: 'Piano: loads with the first tone.',
    piano_loading: 'Loading piano … simple sound until then.',
    piano_ready: 'Piano ready.',
    piano_error: 'Piano could not be loaded; simple sound.',
  },
  highlight: {
    correct: 'correct',
    wrong: 'wrong',
    active: 'selected',
  },
  common: {
    close: 'Close',
  },
  profile: {
    musicSettings: 'Music and profile',
    noteNaming: 'Note names',
    names_auto: 'Follow app language',
    names_de: 'German (H and B)',
    names_intl: 'International (B and B♭)',
    harmonySystem: 'Harmony labels',
    harmony_functions: 'Functions',
    harmony_roman: 'Scale degrees',
    harmony_both: 'Functions and scale degrees',
    sound: 'Sound',
    referencePitch: 'Reference pitch A4',
    hz: '{{value}} Hz',
    musicSettingsHint:
      'Note names and reference pitch apply to new examples and input. The tutor follows your harmony preference where its sources support it. Choose US/UK terminology through the app language.',
    displayName: 'Display name (optional)',
    saveName: 'Save display name',
    syncLoading: 'Loading profile settings…',
    syncError: 'Profile settings could not be fully saved or synced. Please try again.',
    syncLocal: 'These settings are saved on this device.',
    syncSaving: 'Saving profile settings on this device…',
    syncPending: 'Changes are waiting to sync with your account.',
    syncSaved: 'Profile settings synced with your account.',
    soundDisabled: 'Sound is turned off in your settings.',
    enableSound: 'Turn sound on',

    settings: 'Settings',
    language: 'Language',
    languageDevice: 'Same as device',
    appearance: 'Appearance',
    appearanceSystem: 'Same as device',
    appearanceLight: 'Light',
    appearanceDark: 'Dark',
    haptics: 'Vibration',
    reduceMotion: 'Reduce motion',
    reduceMotionHint: 'Applies in addition to the device setting.',
    more: 'More',
    gallery: 'Components (development only)',
    licenses: 'Licenses',
    audioTest: 'Audio test (measurements)',
    fsrsLicense:
      'Review scheduling: ts-fsrs 5.4.2 © 2026 Open Spaced Repetition, MIT License. Full license text under Legal & information.',
    bravuraLicense:
      'Music font Bravura © Steinberg Media Technologies GmbH, SIL Open Font License 1.1',
    figtreeLicense:
      'Typeface Figtree © 2022 The Figtree Project Authors, SIL Open Font License 1.1',
    accidentalsLicense:
      'Accidentals in text: subset of Bravura Text © Steinberg Media Technologies GmbH, SIL Open Font License 1.1, renamed Harmonia Accidentals',
    pianoLicense:
      'Piano sound: Salamander Grand Piano by Alexander Holm, CC BY 3.0 (creativecommons.org/licenses/by/3.0). Modified: selection, shortened, mono, tuning corrected.',
  },
  path: {
    title: 'Your learning path',
    overview: '{{completed}} of {{total}} units passed · {{tested}} estimated by placement',
    rule: 'To pass: at least {{percent}}% correct first-attempt answers. Hints 1–2 are allowed; revealed solutions and skipped tasks do not count as correct.',
    loading: 'Loading your learning path…',
    loadError:
      'Your learning path could not be loaded. Try again or learn temporarily without saving.',
    guest: 'Progress saved on this device. Sign in to sync it with your account.',
    syncing: 'Syncing progress…',
    syncError: 'Sync failed. Your results remain on this device. Sync will retry when connected.',
    synced: 'Progress synced with your account.',
    syncNow: 'Sync now',
    outdated:
      'Some saved attempts belong to another content version. They are retained, but do not unlock this version.',
    areas: 'Learning area',
    allAreas: 'All areas',
    areaHint: 'You can switch areas at any time. Prerequisites may come from other areas.',
    allLevels: 'All levels',
    level: 'Level {{level}}',
    unitPosition: 'Unit {{count}} · Level {{level}}',
    status_locked: 'Locked',
    status_open: 'Open',
    status_completed: 'Passed',
    status_tested: 'Estimated by placement',
    unitProgress: 'Passed lessons',
    lessonProgress: '{{completed}} of {{total}} lessons passed',
    testedHint:
      'Available through your placement estimate. You can practise these lessons at any time; they count as passed only after a passing attempt.',
    prerequisite: 'Prerequisite: {{title}}',
    showLessons: 'Show lessons',
    hideLessons: 'Hide lessons',
    showNamed: 'Show lessons in {{title}}',
    hideNamed: 'Hide lessons in {{title}}',
    lessonLocked:
      'This lesson is still locked. First pass the preceding lessons and prerequisites in your learning path.',
    passed: 'Passed: {{correct}} of {{total}} tasks count towards unlocking.',
    failed:
      'Not passed yet: {{correct}} of {{total}} tasks count. You need at least {{percent}}% to unlock.',
    resultHint:
      'The error review does not change your first-attempt score. An earlier passing attempt remains valid.',
  },
  gallery: {
    contextQuestion: 'Source-based question',
    grandStaff: '$t(glossary:grandStaff_one): learning example',
    durationSymbols: 'Note values and rests',
    keyboardExample: '$t(glossary:keyboard_one): learning example',
    pulseExample: '$t(glossary:pulse): counting groups',
    title: 'Components',
    intro: 'All basic components of the design system. Development builds only.',
    preview: 'Preview',
    text: 'Type',
    sampleDisplay: 'Lesson complete!',
    sampleTitle: 'Which interval do you hear?',
    sampleBody: 'Place a note a major third above C4.',
    sampleMuted: 'Round 3 of 4 · about 4 minutes',
    sampleAccidentals: 'F♯ and G♭ sound the same but are written differently.',
    buttons: 'Buttons',
    primary: 'Check',
    secondary: 'Listen again',
    ghost: 'Skip',
    success: 'Continue',
    danger: 'Got it',
    disabled: 'Locked',
    progress: 'Progress',
    progressValue: '{{done}} of {{total}}',
    more: 'One more round',
    feedback: 'Feedback',
    correctMessage: 'C4–E4 is a major third: three letter names, four $t(glossary:semitone_other).',
    wrongMessage:
      'C4–E♭4 is a minor third. The major third needs one more $t(glossary:semitone_one).',
    replay: 'Listen again',
    card: 'Card',
    cardText: 'Cards hold content such as music examples or statistics.',
    list: 'Lists and switches',
    sheet: 'Bottom sheet',
    openSheet: 'Open sheet',
    sheetTitle: 'Appearance',
    sheetText:
      'Choices or details go here. Close with the button, by tapping outside or with Back.',
  },
  analytics: {
    choiceTitle: 'Optional usage statistics',
    choiceBody:
      'With your consent, Harmonia uses its own Supabase system to analyse active app days, onboarding, lesson starts and verified completions, paywall views, verified purchases, tutor requests and their costs. This includes account association, language, platform and event time. Answers, tutor text, email addresses and advertising IDs are excluded from these statistics. Signed-in accounts only; no retrospective collection. Observation ends after at most twelve months. Withdrawal stops collection immediately on this device; once synced, your previous analytics data is deleted. You can learn just as well without consenting.',
    allow: 'Allow usage statistics',
    unavailable: 'Collection is switched off until legal approval.',
    accountOnly:
      'Guests are not tracked. The optional choice becomes available after sign-in and legal approval.',
  },
  quality: {
    failureTitle: 'Something went wrong.',
    failureBody: 'Try opening this view again. Your saved learning progress will be kept.',
    retryFailed: 'This view is still unavailable. Please try again later.',
    notFound: 'This page could not be found.',
    notFoundBody: 'You can return to your learning area.',
    home: 'Go to learning',
  },
} as const satisfies Messages;
