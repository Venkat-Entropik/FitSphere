import type { Exercise } from '../types/workout-record.types';

/**
 * Curated "how to" videos and form cues, keyed by exercise id. Every YouTube id below was checked
 * against YouTube's oEmbed endpoint (the video exists and allows embedding). Videos belong to their
 * creators and play from YouTube; to swap one, change its `youtubeId`.
 */
type Media = Pick<Exercise, 'video' | 'cues'>;

const m = (youtubeId: string, title: string, cues: string[]): Media => ({
  video: { youtubeId, title },
  cues,
});

export const EXERCISE_MEDIA: Record<string, Media> = {
  'incline-db-press': m('awEEyL5zGvU', 'How to do the incline dumbbell press', [
    'Set the bench to a slight incline, around 30–45°.',
    'Keep your shoulder blades pulled back and down.',
    'Lower under control and press the dumbbells up over your chest.',
  ]),
  'bench-press': m('0cXAp6WhSj4', 'How to do the barbell bench press', [
    'Plant your feet and pull your shoulder blades back before unracking.',
    'Lower the bar to your lower chest with elbows about 45° from your torso.',
    'Press up and slightly back, keeping your wrists stacked over your elbows.',
  ]),
  'cable-fly': m('ETtXO4FW1EU', 'How to do cable flyes', [
    'Stand centred between the cables with a slight forward lean.',
    'Keep a soft bend in your elbows and sweep your arms in an arc.',
    'Squeeze your chest at the front; do not turn it into a press.',
  ]),
  'weighted-dips': m('JannOlicL4w', 'How to do weighted dips', [
    'Start with a lighter load and add weight gradually.',
    'Keep your torso slightly forward and elbows close for triceps focus.',
    'Lower to a comfortable depth and press to full lockout.',
  ]),
  'rope-pushdown': m('vPeQu_L-1n0', 'How to do rope tricep pushdowns', [
    'Pin your elbows to your sides; only your forearms move.',
    'Push down until your arms are fully extended and spread the rope.',
    'Let the rope rise under control; do not let the weight stack slam.',
  ]),
  'overhead-press': m('nNMR9fRGRjQ', 'How to do the overhead press', [
    'Hold the bar just outside your shoulders with your glutes and abs tight.',
    'Press straight up, moving your head back slightly then through.',
    'Finish with the bar over mid-foot and your ribs down.',
  ]),
  'lateral-raise': m('OK1k6NdNo1I', 'How to do dumbbell lateral raises', [
    'Raise your arms out to the sides up to about shoulder height.',
    'Keep your shoulders down and avoid swinging the weights.',
    'Lower slowly; stop short of letting the dumbbells rest on your thighs.',
  ]),
  deadlift: m('8luF-t9o1AM', 'How to set up the conventional deadlift', [
    'Stand with feet hip-width apart and the bar over mid-foot.',
    'Brace your core, keep your back flat, and push the floor away.',
    'Stand tall at the top, then lower the bar by hinging your hips back.',
  ]),
  'barbell-row': m('kBWAon7ItDw', 'How to do the barbell row', [
    'Hinge forward with a flat back and the bar close to your legs.',
    'Pull the bar towards your lower ribs, driving your elbows back.',
    'Lower under control without letting your torso rise to cheat.',
  ]),
  'lat-pulldown': m('rpkWBC1gCcE', 'How to do the lat pulldown', [
    'Set the thigh pad snug and grip the bar slightly wider than your shoulders.',
    'Lean back a little and pull your elbows down towards your ribs.',
    'Let the bar rise slowly; avoid swinging your torso.',
  ]),
  'seated-row': m('EU7bOadUsNI', 'How to do the seated cable row', [
    'Sit tall with your chest up and a neutral back.',
    'Pull the handle to your lower ribs and squeeze your shoulder blades together.',
    'Extend your arms with control without rounding your lower back.',
  ]),
  'barbell-curl': m('KCH2RlxbIbo', 'How to do the barbell curl', [
    'Grip the bar about shoulder-width with palms up and elbows by your sides.',
    'Curl without swinging your torso.',
    'Lower slowly to full arm extension.',
  ]),
  squat: m('QLbMsabhBqY', 'How to do the barbell back squat', [
    'Set the bar across your upper back and brace your core.',
    'Keep your chest up and knees tracking over your toes as you sit down.',
    'Drive up through your whole foot to stand.',
  ]),
  'leg-press': m('cDGOn-yfKJA', 'How to do the leg press', [
    'Place your feet about shoulder-width apart on the platform.',
    'Lower until your knees bend comfortably, keeping your lower back on the pad.',
    'Press up without locking your knees hard at the top.',
  ]),
  'romanian-deadlift': m('lKLYvNGz6mk', 'How to do the Romanian deadlift', [
    'Start standing with a soft bend in your knees.',
    'Push your hips back and slide the bar down your thighs with a flat back.',
    'Stop when you feel a hamstring stretch, then drive your hips forward.',
  ]),
  'leg-curl': m('3gZm9wGTsEo', 'How to do the lying leg curl', [
    'Line your knees up with the machine pivot and set the pad above your heels.',
    'Curl your heels towards your glutes without lifting your hips.',
    'Lower slowly and avoid using momentum.',
  ]),
  'calf-raise': m('4HQ8Am9IuME', 'How to do the standing calf raise', [
    'Rise as high as you can onto the balls of your feet.',
    'Pause at the top, then lower slowly for a full stretch.',
    'Avoid bouncing at the bottom.',
  ]),
  plank: m('mwlp75MS6Rg', 'How to do a plank', [
    'Stack your elbows under your shoulders with your body in a straight line.',
    'Brace your abs and squeeze your glutes; keep breathing.',
    'Stop when your hips sag or pike.',
  ]),
};
