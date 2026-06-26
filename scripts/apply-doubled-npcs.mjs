/**
 * Apply doubled NPC pools with realistic first names — no API required.
 * Run: node scripts/apply-doubled-npcs.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const CHANNEL_DIR = join(process.cwd(), 'data', 'generated-npcs', 'channels');

function read(channel) {
  try {
    return JSON.parse(readFileSync(join(CHANNEL_DIR, `${channel}.json`), 'utf8'));
  } catch {
    return [];
  }
}

function write(channel, npcs) {
  const seen = new Set();
  const deduped = npcs.filter(n => {
    const key = n.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  writeFileSync(join(CHANNEL_DIR, `${channel}.json`), `${JSON.stringify(deduped, null, 2)}\n`);
  console.log(`${channel}: ${deduped.length} NPCs`);
}

function merge(channel, additions, replace = false) {
  const base = replace ? [] : read(channel);
  write(channel, [...base, ...additions]);
}

const ADDITIONS = {
  bumbershoot: [
    { name: 'gina', archetype: 'chiller', outfit: 'none', prop: 'shades-glasses-yellow', vibe: 'layering for seattle weather', personalityNotes: 'Packed for rain, sun, and wind simultaneously. Treats her jacket like a mood ring.' },
    { name: 'harold', archetype: 'wanderer', outfit: 'hippie', prop: null, vibe: 'chasing the quieter stage', personalityNotes: 'Heard the second stage has shorter lines and better sightlines. Will walk there eventually.' },
    { name: 'iris', archetype: 'dancer', outfit: 'none', prop: 'party-glowsticks', vibe: 'puddle dancing specialist', personalityNotes: 'Found a reflective puddle and treats it like a spotlight. Unbothered by wet shoes.' },
    { name: 'jack', archetype: 'vendor', outfit: 'none', prop: 'drink-lemonade', vibe: 'lemonade stand vs the drizzle', personalityNotes: 'Sells lemonade and narrates weather like a sportscaster. Ice is holding.' },
    { name: 'kendra', archetype: 'hustler', outfit: 'undercover-cop', prop: null, vibe: 'undercover at a rainy park show', personalityNotes: 'Raincoat as disguise. Notes suspicious umbrella formations. Comedy only.' },
    { name: 'liam', archetype: 'chiller', outfit: 'pirate', prop: 'food-pizza', vibe: 'sharing pizza under a tarp', personalityNotes: 'Claimed tarp real estate early. Shares slices only with people who compliment the setup.' },
  ],
  cinema: [
    { name: 'maria', archetype: 'wanderer', outfit: 'hippie', prop: null, vibe: 'hunting the best blanket angle', personalityNotes: 'Walks the lawn testing sightlines like a surveyor. Has rejected four spots on principle.' },
    { name: 'nathan', archetype: 'dancer', outfit: 'none', prop: 'party-glowsticks', vibe: 'dancing during the credits roll', personalityNotes: 'Treats rolling credits as a second act. The music in his head is better than the score.' },
    { name: 'olivia', archetype: 'chiller', outfit: 'none', prop: 'drink-coffee', vibe: 'coffee and a double feature', personalityNotes: 'Balancing caffeine and a three-hour runtime. Will not admit she might nap during act two.' },
    { name: 'paul', archetype: 'vendor', outfit: 'pirate', prop: 'food-popcorn', vibe: 'popcorn economics on the lawn', personalityNotes: 'Tracks butter-to-kernel ratios like a CFO. Offers upgrades nobody asked for.' },
  ],
  coachella: [
    { name: 'andrew', archetype: 'wanderer', outfit: 'none', prop: 'drink-water', vibe: 'desert shoe survival mode', personalityNotes: 'Sand in every shoe. Has accepted it philosophically. Still dancing.' },
    { name: 'brittany', archetype: 'dancer', outfit: 'hippie', prop: 'party-glowsticks', vibe: 'golden hour dance convert', personalityNotes: 'Waits all day for the light to hit right, then commits fully for twelve minutes.' },
    { name: 'chris', archetype: 'vendor', outfit: 'none', prop: 'food-tacos', vibe: 'taco line philosopher', personalityNotes: 'Runs the line like a TED talk. Every customer gets a desert survival tip.' },
    { name: 'danielle', archetype: 'chiller', outfit: 'none', prop: 'shades-glasses-blue', vibe: 'mist tent schedule keeper', personalityNotes: 'Has mist tent times written on her arm. Shares the schedule unprompted.' },
    { name: 'frank', archetype: 'hustler', outfit: 'undercover-cop', prop: null, vibe: 'undercover in full festival regalia', personalityNotes: 'Bandana and sunglasses at noon. Notes wristband colors. Comedy only.' },
    { name: 'heather', archetype: 'chiller', outfit: 'hippie', prop: 'hat-lady', vibe: 'wind vs hat ongoing battle', personalityNotes: 'Lost one hat, bought another, refuses a chin strap on principle.' },
    { name: 'ivan', archetype: 'dancer', outfit: 'none', prop: 'hand-boombox', vibe: 'bass chaser across the field', personalityNotes: 'Follows sub bass like a homing beacon. Phone compass unused.' },
    { name: 'julia', archetype: 'wanderer', outfit: 'pirate', prop: null, vibe: 'art installation tourist', personalityNotes: 'Maps the grounds by sculptures and shade. Gets lost between installations happily.' },
    { name: 'keith', archetype: 'vendor', outfit: 'none', prop: 'drink-beer', vibe: 'cold beer mission at sunset', personalityNotes: 'Ice math is his religion. Sundown rush is his Super Bowl.' },
    { name: 'linda', archetype: 'chiller', outfit: 'none', prop: 'food-pizza', vibe: 'slice fairness enforcer', personalityNotes: 'Diagonal cuts only. Keeps a mental ledger of who owes who a crust.' },
    { name: 'miguel', archetype: 'dancer', outfit: 'hippie', prop: 'party-confetti', vibe: 'confetti wind scientist', personalityNotes: 'Studies gust patterns before every throw. Data-driven celebration.' },
    { name: 'nora', archetype: 'wanderer', outfit: 'none', prop: 'shades-glasses-circle', vibe: 'looking for camp row seven', personalityNotes: 'Camp was near a flag. The flag moved. Still confident.' },
  ],
  edc: [
    { name: 'grant', archetype: 'chiller', outfit: 'none', prop: 'drink-water', vibe: 'hydration checkpoint captain', personalityNotes: 'Counts sips like reps. Offers water to strangers with coach energy.' },
    { name: 'helen', archetype: 'dancer', outfit: 'hippie', prop: 'party-glowsticks', vibe: 'led accessory maximalist', personalityNotes: 'More glow than person. Adds a piece every hour.' },
    { name: 'isaac', archetype: 'wanderer', outfit: 'pirate', prop: 'hand-boombox', vibe: 'found friends, lost them, found bass', personalityNotes: 'Group chat dead. Bass alive. Priorities sorted.' },
    { name: 'jade', archetype: 'vendor', outfit: 'none', prop: 'food-hotdog', vibe: 'midnight hot dog philosopher', personalityNotes: 'Night shift vendor with opinions about neon and mustard ratios.' },
    { name: 'kurt', archetype: 'hustler', outfit: 'undercover-cop', prop: 'mask-3', vibe: 'undercover at the rail', personalityNotes: 'Mask as cover. Mutters about kandi trades. Comedy only.' },
    { name: 'lily', archetype: 'chiller', outfit: 'none', prop: 'shades-glasses-optic', vibe: 'rest spot connoisseur', personalityNotes: 'Catalogs every calm pocket near the speakers. Shares coordinates quietly.' },
  ],
  forest: [
    { name: 'amber', archetype: 'chiller', outfit: 'hippie', prop: 'drink-lemonade', vibe: 'firefly census taker', personalityNotes: 'Counts fireflies by grove. Suspects they have shift schedules.' },
    { name: 'brandon', archetype: 'dancer', outfit: 'none', prop: 'party-glowsticks', vibe: 'laser path follower', personalityNotes: 'Treats laser lines like dance floor tape. Never crosses a beam wrong.' },
    { name: 'carmen', archetype: 'wanderer', outfit: 'pirate', prop: null, vibe: 'totem landmark navigator', personalityNotes: 'Navigates by glowing totems only. Paper maps are for tourists.' },
    { name: 'diego', archetype: 'vendor', outfit: 'none', prop: 'food-tacos', vibe: 'midnight taco forest outpost', personalityNotes: 'Sells tacos where the trail gets weird. Knows every shortcut.' },
    { name: 'elise', archetype: 'hustler', outfit: 'undercover-cop', prop: 'shades-glasses-blue', vibe: 'undercover among the string lights', personalityNotes: 'Glow paint on boots. Stakeout notes about suspicious hula hoops. Comedy only.' },
    { name: 'felix', archetype: 'dancer', outfit: 'hippie', prop: 'hand-boombox', vibe: 'secret set believer', personalityNotes: 'Swears bass from the deep trees is a real set. Following it nightly.' },
  ],
  'outside-lands': [
    { name: 'george', archetype: 'chiller', outfit: 'none', prop: 'drink-coffee', vibe: 'sf fog veteran', personalityNotes: 'Has seen this fog before. Brought the right jacket. Smug but helpful.' },
    { name: 'hannah', archetype: 'dancer', outfit: 'hippie', prop: 'party-glowsticks', vibe: 'hill climb dancer', personalityNotes: 'Treats every uphill walk as a warm-up. Dances at the top as reward.' },
    { name: 'ian', archetype: 'vendor', outfit: 'none', prop: 'food-hotdog', vibe: 'cart on the grade', personalityNotes: 'Brakes are a lifestyle. Sells dogs with hill-related small talk.' },
    { name: 'janet', archetype: 'wanderer', outfit: 'pirate', prop: 'shades-glasses-yellow', vibe: 'finding the quiet beer garden', personalityNotes: 'Heard the garden has shorter lines. Will get there eventually.' },
    { name: 'kyle', archetype: 'hustler', outfit: 'none', prop: null, vibe: 'wristband upgrade schemes', personalityNotes: 'Has three plans and zero wristbands. Still optimistic.' },
    { name: 'laura', archetype: 'chiller', outfit: 'hippie', prop: 'food-pizza', vibe: 'lawn picnic organizer', personalityNotes: 'Brought a spreadsheet for slice allocation. Friends tolerate her.' },
  ],
  'silent-disco': [
    { name: 'aaron', archetype: 'chiller', outfit: 'none', prop: 'hat-headphones', vibe: 'channel switcher regret', personalityNotes: 'Switched channels mid-song once. Still processing the trauma.' },
    { name: 'brenda', archetype: 'dancer', outfit: 'hippie', prop: 'party-glowsticks', vibe: 'off-beat observer', personalityNotes: 'Watches people on wrong channels dance. Finds it art.' },
    { name: 'colin', archetype: 'wanderer', outfit: 'none', prop: 'drink-beer', vibe: 'headphone battery anxiety', personalityNotes: 'Carrying backup batteries like ammunition. Offers them at a markup.' },
    { name: 'donna', archetype: 'vendor', outfit: 'pirate', prop: 'food-pizza', vibe: 'pizza between channels', personalityNotes: 'Sells slices to people who forgot which channel they picked.' },
    { name: 'eddie', archetype: 'hustler', outfit: 'undercover-cop', prop: null, vibe: 'undercover with giant headphones', personalityNotes: 'Headphones as cover. Notes who is lip-syncing wrong. Comedy only.' },
    { name: 'fiona', archetype: 'chiller', outfit: 'none', prop: 'shades-glasses-blue', vibe: 'silent disco first timer', personalityNotes: 'Still learning the etiquette. Apologizes to people dancing to different songs.' },
    { name: 'gary', archetype: 'dancer', outfit: 'hippie', prop: 'party-confetti', vibe: 'channel anthem specialist', personalityNotes: 'Knows which song is on each channel by crowd movement alone.' },
    { name: 'haley', archetype: 'wanderer', outfit: 'none', prop: null, vibe: 'bathroom line during the drop', personalityNotes: 'Timed the bathroom run wrong. Heard the drop from the porta line.' },
    { name: 'jason', archetype: 'chiller', outfit: 'pirate', prop: 'hand-boombox', vibe: 'boombox purist on principle', personalityNotes: 'Keeps the boombox off but visible. Makes a point.' },
    { name: 'karen', archetype: 'vendor', outfit: 'none', prop: 'drink-lemonade', vibe: 'lemonade at the headphone check', personalityNotes: 'Sells drinks where people swap channels. Knows the peak switch times.' },
    { name: 'martin', archetype: 'dancer', outfit: 'none', prop: 'party-glowsticks', vibe: 'green channel loyalist', personalityNotes: 'Will argue green is objectively best. Has never tried red fairly.' },
    { name: 'nicole', archetype: 'chiller', outfit: 'hippie', prop: 'shades-glasses-optic', vibe: 'people-watching the silent crowd', personalityNotes: 'Finds the silent dancing deeply funny. Narrates it softly to herself.' },
  ],
  'which-stage': [
    { name: 'amber', archetype: 'dancer', outfit: 'hippie', prop: 'party-glowsticks', vibe: 'jam band transition expert', personalityNotes: 'Knows when a jam is about to peak. Moves closer preemptively.' },
    { name: 'brent', archetype: 'chiller', outfit: 'none', prop: 'drink-water', vibe: 'camp hydration officer', personalityNotes: 'Tracks who has not refilled. Passive-aggressive water reminders.' },
    { name: 'cindy', archetype: 'wanderer', outfit: 'pirate', prop: null, vibe: 'lost since the opener', personalityNotes: 'Friends were at the rail. Rail relocated. Still searching.' },
    { name: 'doug', archetype: 'vendor', outfit: 'none', prop: 'food-hotdog', vibe: 'late night dog vendor', personalityNotes: 'Peak sales after midnight. Has strong opinions about condiment ratios.' },
    { name: 'emily', archetype: 'chiller', outfit: 'hippie', prop: 'hat-lady', vibe: 'sun hat strategy at the farm', personalityNotes: 'Reapplies sunscreen on a timer. The hat is non-negotiable.' },
    { name: 'fred', archetype: 'hustler', outfit: 'undercover-cop', prop: null, vibe: 'undercover at the campground stage', personalityNotes: 'Flannel and binoculars. Notes tie-dye patterns. Comedy only.' },
    { name: 'gloria', archetype: 'dancer', outfit: 'none', prop: 'hand-boombox', vibe: 'rail spot defender', personalityNotes: 'Held the rail since soundcheck. Will explain why politely.' },
    { name: 'henry', archetype: 'chiller', outfit: 'none', prop: 'food-pizza', vibe: 'festival pizza historian', personalityNotes: 'Compares every slice to 2019. Nobody asked but everyone listens.' },
  ],
};

/** Full replace — fantasy names → realistic first names, space-themed. */
const DEEP_SPACE_REPLACE = [
  { name: 'marcus', archetype: 'chiller', outfit: 'hippie', prop: 'shades-glasses-blue', vibe: 'naming stars he definitely did not discover', personalityNotes: 'Has unofficial names for constellations and gets quietly offended when people use the boring official ones. Tracks satellites like weather.' },
  { name: 'priya', archetype: 'wanderer', outfit: 'none', prop: null, vibe: 'zero gravity posture on solid ground', personalityNotes: 'Walks like she is still adjusting to gravity after a long orbit. Pauses to look up every thirty seconds like the sky might change.' },
  { name: 'derek', archetype: 'dancer', outfit: 'hippie', prop: 'party-glowsticks', vibe: 'glowsticks as bioluminescent algae', personalityNotes: 'Treats glowsticks like deep-sea creatures. Moves slow and floaty until the bass hits, then commits fully.' },
  { name: 'tina', archetype: 'vendor', outfit: 'none', prop: 'drink-water', vibe: 'hydration officer for long space watches', personalityNotes: 'Hands out water like a mission-critical supply drop. Tracks who has not sipped in twenty minutes.' },
  { name: 'sam', archetype: 'chiller', outfit: 'none', prop: 'food-popcorn', vibe: 'floating snack bowl energy', personalityNotes: 'Eats popcorn like she is in zero-g — minimal hand motion, maximum focus on the screen. Crunch volume is a personal shame.' },
  { name: 'jess', archetype: 'hustler', outfit: 'undercover-cop', prop: null, vibe: 'undercover at a lunar screening', personalityNotes: 'Convinced the space theme is perfect cover. Takes notes on suspicious blanket formations. Comedy only.' },
  { name: 'kyle', archetype: 'wanderer', outfit: 'pirate', prop: 'hand-boombox', vibe: 'orbiting the speaker stack', personalityNotes: 'Found the sweet spot near the subs and treats it like a space station dock. Rarely leaves.' },
  { name: 'amanda', archetype: 'dancer', outfit: 'none', prop: 'party-confetti', vibe: 'meteor shower timing', personalityNotes: 'Times confetti to bass drops like re-entry events. Wind is always wrong.' },
  { name: 'robert', archetype: 'chiller', outfit: 'hippie', prop: 'drink-coffee', vibe: 'night watch coffee ritual', personalityNotes: 'Double-cupped for a long orbit shift. Treats caffeine like fuel cells.' },
  { name: 'elena', archetype: 'vendor', outfit: 'none', prop: 'food-pizza', vibe: 'pizza delivery to the observation deck', personalityNotes: 'Sells slices like rations to stargazers. Tracks who saved crust for later.' },
  { name: 'james', archetype: 'dancer', outfit: 'none', prop: 'party-glowsticks', vibe: 'slow drift until the drop', personalityNotes: 'Floats through the crowd until the bass hits, then snaps into full commit mode.' },
  { name: 'natalie', archetype: 'chiller', outfit: 'none', prop: 'shades-glasses-yellow', vibe: 'tracking the international space station pass', personalityNotes: 'Has an app for satellite passes and narrates flyovers to anyone nearby. Calm evangelist.' },
];

for (const [channel, additions] of Object.entries(ADDITIONS)) {
  merge(channel, additions);
}

write('deep-space', DEEP_SPACE_REPLACE);

console.log('Done — NPC pools doubled with real names.');
