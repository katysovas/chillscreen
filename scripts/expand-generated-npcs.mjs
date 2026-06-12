#!/usr/bin/env node
/** Merge stage NPC expansions into data/generated-npcs.json (dedupe by name). */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dataPath = join(root, 'data/generated-npcs.json');

/** @type {Record<string, object[]>} */
const ADDITIONS = {
  'silent-disco': [
    { name: 'olivia', archetype: 'dancer', outfit: 'hippie', prop: 'party-glowsticks', vibe: 'syncing glowstick throws to the beat', personalityNotes: 'Treats glowstick choreography like a sport. Times throws to drops and gets visibly annoyed when the crowd misses the cue.' },
    { name: 'marcus', archetype: 'vendor', outfit: 'none', prop: 'drink-water', vibe: 'hydration evangelist with spare bottles', personalityNotes: 'Hands out water like a street preacher. Tracks who looks dehydrated from across the dance floor.' },
    { name: 'ruby', archetype: 'hustler', outfit: 'none', prop: null, vibe: 'trying to trade headphones for a better channel', personalityNotes: 'Believes channel two is objectively superior and is working barter deals all night. Keeps a mental ledger of failed trades.' },
    { name: 'devon', archetype: 'wanderer', outfit: 'pirate', prop: 'hat-pirate-bandana', vibe: 'lost his crew, found the bass', personalityNotes: 'Separated from friends hours ago and is navigating by headphone color clusters. Confident he is almost reunited.' },
    { name: 'alana', archetype: 'chiller', outfit: 'none', prop: 'shades-glasses-circle', vibe: 'people-watching silent dancers like a nature doc', personalityNotes: 'Narrates mismatched headphone dancing in hushed awe. Finds the whole concept deeply funny and deeply beautiful.' },
    { name: 'cody', archetype: 'dancer', outfit: 'none', prop: 'hand-boombox', vibe: 'forgot his headphones, still vibing', personalityNotes: 'Showed up without headphones and is guessing the beat from body language. Surprisingly accurate, deeply committed.' },
  ],
  'which-stage': [
    { name: 'emily', archetype: 'chiller', outfit: 'hippie', prop: 'food-hotdog', vibe: 'camp stove nostalgia at a festival', personalityNotes: 'Misses cooking at camp and treats every hot dog like a taste of home. Compares condiment stations to family recipes.' },
    { name: 'travis', archetype: 'wanderer', outfit: 'none', prop: null, vibe: 'following a totem he does not recognize', personalityNotes: 'Got separated and is tailing a random totem convinced it belongs to his group. Too proud to ask.' },
    { name: 'paige', archetype: 'dancer', outfit: 'hippie', prop: 'party-glowsticks', vibe: 'jam-band spin energy, no notes', personalityNotes: 'Treats every extended jam like a personal challenge. Has a spin move for each instrument solo.' },
    { name: 'andre', archetype: 'vendor', outfit: 'none', prop: 'drink-coffee', vibe: 'selling coffee at midnight like it is normal', personalityNotes: 'Runs a coffee situation at an hour that makes no sense. Defends the business model with tired confidence.' },
    { name: 'chloe', archetype: 'hustler', outfit: 'undercover-cop', prop: 'shades-glasses-blue', vibe: 'undercover at a jam fest, very serious', personalityNotes: 'Convinced tie-dye is perfect cover. Mutters observations about hula hoops and drum circles. Comedy only, never threatening.' },
    { name: 'garrett', archetype: 'chiller', outfit: 'none', prop: 'drink-beer', vibe: 'holding down the same patch of grass all night', personalityNotes: 'Claimed a spot at noon and has not moved. Treats encroachers like trespassers with mellow disappointment.' },
    { name: 'mia', archetype: 'dancer', outfit: 'pirate', prop: null, vibe: 'convinced the jam will never end', personalityNotes: 'Fully prepared for a three-hour song and has snacks in her pockets. Cheers when the band teases ending then keeps playing.' },
    { name: 'owen', archetype: 'wanderer', outfit: 'hippie', prop: 'hand-boombox', vibe: 'recording the set for posterity', personalityNotes: 'Holds a boombox up like a nineties concert photo. Worried about tape hiss and crowd noise in equal measure.' },
    { name: 'fiona', archetype: 'chiller', outfit: 'none', prop: 'food-pizza', vibe: 'splitting one pizza across four sets', personalityNotes: 'Budgeting festival food like a spreadsheet. Each slice is assigned to a specific headliner.' },
    { name: 'colin', archetype: 'vendor', outfit: 'pirate', prop: 'food-tacos', vibe: 'pirate taco stand at the farm', personalityNotes: 'Leaned into the costume and now cannot take it off without disappointing regulars. The eyepatch is functional.' },
  ],
  coachella: [
    { name: 'isabel', archetype: 'dancer', outfit: 'hippie', prop: 'party-confetti', vibe: 'golden hour confetti timing expert', personalityNotes: 'Waits for the perfect sunset angle before any confetti throw. Treats light like a co-conspirator.' },
    { name: 'marco', archetype: 'chiller', outfit: 'none', prop: 'shades-glasses-blue', vibe: 'dust in everything, still smiling', personalityNotes: 'Accepts desert dust as a lifestyle. Cleans sunglasses every four minutes with ritual calm.' },
    { name: 'tara', archetype: 'hustler', outfit: 'none', prop: null, vibe: 'working a wristband upgrade angle', personalityNotes: 'Has three theories about how VIP access really works. Tests one per hour with cheerful persistence.' },
    { name: 'vincent', archetype: 'wanderer', outfit: 'pirate', prop: 'drink-lemonade', vibe: 'art installation tourist with no map', personalityNotes: 'Got distracted by sculptures two hours ago and is now finding new ones by accident. Happy about it.' },
    { name: 'naomi', archetype: 'vendor', outfit: 'none', prop: 'food-fries', vibe: 'fries stand losing the lunch rush', personalityNotes: 'Tracks the sun like an enemy that kills appetite. Salts fresh batches like hope.' },
    { name: 'peter', archetype: 'chiller', outfit: 'hippie', prop: null, vibe: 'outfit planned since january', personalityNotes: 'Every accessory was chosen in winter and she will explain why if you stand nearby. The look is non-negotiable.' },
  ],
  cinema: [
    { name: 'helen', archetype: 'chiller', outfit: 'hippie', prop: 'food-popcorn', vibe: 'critiquing the projection angle', personalityNotes: 'Has strong opinions about keystone correction from a lawn chair. Mumbles like a film professor on a date.' },
    { name: 'ian', archetype: 'wanderer', outfit: 'none', prop: 'drink-water', vibe: 'arrived late, refuses to ask what he missed', personalityNotes: 'Walked in mid-scene and is piecing together the plot from reactions alone. Too proud to ask anyone.' },
    { name: 'rosa', archetype: 'dancer', outfit: 'none', prop: 'party-glowsticks', vibe: 'accidentally brought rave gear to movie night', personalityNotes: 'Realized glowsticks were a mistake during the quiet opening. Keeps them off with visible self-control.' },
    { name: 'grant', archetype: 'vendor', outfit: 'none', prop: 'food-popcorn', vibe: 'second job: unofficial blanket rental', personalityNotes: 'Brought extra blankets and is quietly monetizing them with friends of friends. Very soft business model.' },
    { name: 'elena', archetype: 'chiller', outfit: 'none', prop: 'shades-glasses-optic', vibe: 'pretending the screen glare is intentional', personalityNotes: 'Sitting at a bad angle and reframing it as an artistic choice. Adjusts glasses instead of moving.' },
    { name: 'noah', archetype: 'hustler', outfit: 'undercover-cop', prop: null, vibe: 'undercover at outdoor cinema', personalityNotes: 'Thinks a hoodie and notebook blend in at movie night. Scribbles observations about snack trafficking. Comedy only.' },
    { name: 'sasha', archetype: 'wanderer', outfit: 'pirate', prop: 'drink-lemonade', vibe: 'dressed up for a film she has not heard of', personalityNotes: 'Showed up in full pirate because the poster looked adventurous. Will not research the plot mid-screening.' },
    { name: 'dylan', archetype: 'chiller', outfit: 'none', prop: 'hand-boombox', vibe: 'brought speakers to an outdoor movie', personalityNotes: 'Brought a boombox out of habit and keeps checking that it stays off. The temptation is real.' },
    { name: 'violet', archetype: 'dancer', outfit: 'hippie', prop: null, vibe: 'dancing only during credits', personalityNotes: 'Sits perfectly still for the whole film then unleashes during credits. Treats the stinger as a finale drop.' },
    { name: 'omar', archetype: 'vendor', outfit: 'none', prop: 'food-pizza', vibe: 'pizza box tetris in the dark', personalityNotes: 'Navigating narrow blanket aisles with a pizza box like a pilot. Apologizes in whispers to everyone.' },
    { name: 'quinn', archetype: 'chiller', outfit: 'none', prop: 'drink-coffee', vibe: 'coffee at night screening, no regrets', personalityNotes: 'Knows the coffee was a mistake and has accepted the consequences. Watching the plot twist wide awake.' },
    { name: 'jade', archetype: 'wanderer', outfit: 'hippie', prop: 'hat-lady', vibe: 'fought the fog for a good seat', personalityNotes: 'Moved three times as fog rolled in. Tracks weather like an enemy of visibility.' },
    { name: 'reese', archetype: 'dancer', outfit: 'none', prop: 'party-confetti', vibe: 'saved confetti for the happy ending', personalityNotes: 'Has one confetti cannon reserved for the kiss scene or equivalent. Will be devastated if there is none.' },
    { name: 'hugo', archetype: 'chiller', outfit: 'pirate', prop: 'food-popcorn', vibe: 'narrates trailers to himself', personalityNotes: 'Mumbles trailer reactions like a podcast only he can hear. Rates each preview on a private scale.' },
  ],
  forest: [
    { name: 'aria', archetype: 'dancer', outfit: 'hippie', prop: 'party-glowsticks', vibe: 'matching dance moves to laser patterns', personalityNotes: 'Believes the lasers are choreography instructions. Follows them literally and surprisingly well.' },
    { name: 'blake', archetype: 'chiller', outfit: 'none', prop: 'drink-water', vibe: 'hydration station in the woods', personalityNotes: 'Set up near a path with spare water and judgment for people who skip it. Mellow but firm.' },
    { name: 'carmen', archetype: 'wanderer', outfit: 'pirate', prop: null, vibe: 'following fireflies like breadcrumbs', personalityNotes: 'Navigation system is bioluminescence. Confident until the fireflies split up, then philosophical.' },
    { name: 'diego', archetype: 'vendor', outfit: 'none', prop: 'food-tacos', vibe: 'taco stand at the tree line', personalityNotes: 'Sells tacos where forest meets dance floor. Worries about raccoons and customers in equal measure.' },
    { name: 'eve', archetype: 'hustler', outfit: 'none', prop: 'hand-boombox', vibe: 'selling directions to the secret grove', personalityNotes: 'Claims to know a better spot deeper in the woods. Directions get vaguer the more people ask.' },
    { name: 'frank', archetype: 'chiller', outfit: 'hippie', prop: 'shades-glasses-green', vibe: 'convinced the trees absorb bass', personalityNotes: 'Has a theory that certain pines resonate with sub frequencies. Tests it by leaning against trunks.' },
    { name: 'gina', archetype: 'dancer', outfit: 'none', prop: 'party-glowsticks', vibe: 'glowstick trail for lost friends', personalityNotes: 'Leaves a glowstick breadcrumb path back to camp. Checks every ten minutes that nobody stole her system.' },
    { name: 'henry', archetype: 'wanderer', outfit: 'none', prop: 'drink-beer', vibe: 'beer warm, vibe still good', personalityNotes: 'Warm beer in the woods hits different and he will defend that take. Sips slowly, no complaints.' },
    { name: 'iris', archetype: 'chiller', outfit: 'undercover-cop', prop: 'shades-glasses-optic', vibe: 'undercover in glowing woods', personalityNotes: 'Neon vest was a tactical error. Pretends the glow paint is part of the plan. Comedy only.' },
    { name: 'joel', archetype: 'vendor', outfit: 'pirate', prop: 'drink-lemonade', vibe: 'lemonade with a side of lore', personalityNotes: 'Every sale comes with a story about the forest stage history. Stories get longer as the night goes.' },
    { name: 'kira', archetype: 'dancer', outfit: 'hippie', prop: null, vibe: 'dancing with shadows on purpose', personalityNotes: 'Uses tree shadows as dance partners when the crowd thins. Not embarrassed, fully committed.' },
    { name: 'liam', archetype: 'wanderer', outfit: 'none', prop: 'hand-boombox', vibe: 'recording forest acoustics', personalityNotes: 'Holds a boombox up to capture how bass sounds between trees. Science project energy.' },
  ],
  'outside-lands': [
    { name: 'alex', archetype: 'chiller', outfit: 'none', prop: 'shades-glasses-blue', vibe: 'fog rolled in, outfit did not', personalityNotes: 'Underdressed for SF fog and refusing to admit it. Shivers with dignity between songs.' },
    { name: 'bella', archetype: 'dancer', outfit: 'hippie', prop: 'party-glowsticks', vibe: 'dancing through the marine layer', personalityNotes: 'Treats fog like a stage effect installed for her. Spins disappear and reappear dramatically.' },
    { name: 'carson', archetype: 'vendor', outfit: 'none', prop: 'food-hotdog', vibe: 'hot dog cart vs the hill', personalityNotes: 'Pushed a cart up a SF hill and will tell you about it for the rest of the night. Still selling.' },
    { name: 'diana', archetype: 'wanderer', outfit: 'pirate', prop: 'drink-coffee', vibe: 'coffee at an outdoor show, classic sf', personalityNotes: 'Balancing coffee and crowd sway like a lifelong local. Unfazed by anything except line cutters.' },
    { name: 'ethan', archetype: 'hustler', outfit: 'none', prop: null, vibe: 'scalping nothing but confidence', personalityNotes: 'Has no tickets to sell but radiates deal-making energy. Working on something, unclear what.' },
    { name: 'faith', archetype: 'chiller', outfit: 'hippie', prop: 'food-pizza', vibe: 'splitting pizza on the lawn', personalityNotes: 'Fair slice division is her whole personality tonight. Has a system involving diagonal cuts.' },
    { name: 'gavin', archetype: 'dancer', outfit: 'none', prop: 'hand-boombox', vibe: 'boombox for the walk over', personalityNotes: 'Carried a boombox across the city for vibes. Keeps volume low out of respect, barely.' },
    { name: 'hazel', archetype: 'vendor', outfit: 'none', prop: 'drink-lemonade', vibe: 'lemonade stand with bay views', personalityNotes: 'Sells lemonade with a view and prices it accordingly. Mentions the view every third sale.' },
    { name: 'ivan', archetype: 'wanderer', outfit: 'none', prop: null, vibe: 'missed the opener, catching the vibe', personalityNotes: 'Arrived late and is reconstructing the setlist from t-shirt references. Happy anyway.' },
    { name: 'june', archetype: 'chiller', outfit: 'undercover-cop', prop: 'shades-glasses-optic', vibe: 'undercover at sf concert', personalityNotes: 'Thinks Patagonia vest is invisible camouflage. Notes crowd density like a census. Comedy only.' },
    { name: 'kurt', archetype: 'dancer', outfit: 'pirate', prop: 'party-confetti', vibe: 'confetti in the fog, risky', personalityNotes: 'Timing confetti throws around wind patterns. Treats meteorology as a hobby.' },
    { name: 'lyric', archetype: 'chiller', outfit: 'hippie', prop: 'drink-water', vibe: 'hydration and house music', personalityNotes: 'Refills everyone’s water like a camp counselor. Hums along to whatever subgenre is playing.' },
    { name: 'miles', archetype: 'wanderer', outfit: 'none', prop: 'food-tacos', vibe: 'taco break between sets', personalityNotes: 'Optimizes set gaps for taco consumption. Has missed encores before and would again.' },
    { name: 'nora', archetype: 'hustler', outfit: 'none', prop: 'hat-headphones', vibe: 'selling playlist recommendations', personalityNotes: 'Offers unsolicited playlist swaps for cash or snacks. Confidence exceeds demand.' },
    { name: 'oscar', archetype: 'vendor', outfit: 'pirate', prop: 'food-fries', vibe: 'fries with fog seasoning', personalityNotes: 'Claims salt air improves the fries. Customers are skeptical but keep buying.' },
    { name: 'penny', archetype: 'dancer', outfit: 'none', prop: 'party-glowsticks', vibe: 'glowsticks visible through fog', personalityNotes: 'Loves that fog makes glowsticks look like floating signals. Waves them like airport guidance.' },
    { name: 'quincy', archetype: 'chiller', outfit: 'none', prop: 'shades-glasses-circle', vibe: 'found the sound sweet spot', personalityNotes: 'Spent an hour finding perfect acoustics on the hill. Will move if one person stands in front of him.' },
    { name: 'rhea', archetype: 'wanderer', outfit: 'hippie', prop: 'drink-beer', vibe: 'beer garden expat on the lawn', personalityNotes: 'Escapes the beer garden lines for the main lawn. Compares both experiences out loud.' },
  ],
  bumbershoot: [
    { name: 'aiden', archetype: 'chiller', outfit: 'none', prop: 'drink-coffee', vibe: 'seattle coffee at the stage', personalityNotes: 'Double cupped and calm. Treats drizzle as background noise, not weather.' },
    { name: 'brooke', archetype: 'dancer', outfit: 'hippie', prop: 'party-glowsticks', vibe: 'dancing in light rain', personalityNotes: 'Rain activates her. Spins faster when drops pick up. Has no backup plan indoors.' },
    { name: 'curtis', archetype: 'vendor', outfit: 'none', prop: 'food-hotdog', vibe: 'hot dog cart under cloudy skies', personalityNotes: 'Seattle hot dog lore in every transaction. Onions are a philosophy, not a topping.' },
    { name: 'delia', archetype: 'wanderer', outfit: 'pirate', prop: null, vibe: 'lost poncho, found the pit', personalityNotes: 'Gave up on rain gear and embraced the pit. Hair is a problem for tomorrow.' },
    { name: 'edgar', archetype: 'hustler', outfit: 'undercover-cop', prop: 'shades-glasses-blue', vibe: 'undercover at seattle fest', personalityNotes: 'Flannel as disguise. Writes notes about crowd surfing statistics. Comedy only.' },
    { name: 'freya', archetype: 'chiller', outfit: 'hippie', prop: 'food-pizza', vibe: 'sharing pizza in the rain', personalityNotes: 'Umbrella over pizza, not people. Priorities are clear and she owns them.' },
    { name: 'george', archetype: 'dancer', outfit: 'none', prop: 'hand-boombox', vibe: 'grunge-adjacent dancing', personalityNotes: 'Moves like a nineties music video extra. Minimal expression, maximum commitment.' },
    { name: 'hattie', archetype: 'vendor', outfit: 'none', prop: 'drink-lemonade', vibe: 'lemonade when it is fifty degrees', personalityNotes: 'Selling cold lemonade in cool weather like a dare. Customers respect the hustle.' },
    { name: 'isaac', archetype: 'wanderer', outfit: 'none', prop: 'shades-glasses-optic', vibe: 'looking for friends since soundcheck', personalityNotes: 'Has been searching since doors and treats each new song as a checkpoint. Still hopeful.' },
    { name: 'jolene', archetype: 'chiller', outfit: 'pirate', prop: 'drink-beer', vibe: 'craft beer in a plastic cup', personalityNotes: 'Opinions about hops and stage placement. Moves one step left when bass drops.' },
    { name: 'kellen', archetype: 'dancer', outfit: 'hippie', prop: 'party-confetti', vibe: 'confetti cannon saved for encore', personalityNotes: 'One confetti shot reserved for the final song. Guards it like an heirloom.' },
    { name: 'lydia', archetype: 'hustler', outfit: 'none', prop: null, vibe: 'working a merch line shortcut', personalityNotes: 'Knows a path that saves four minutes at merch. Selling directions for snacks.' },
    { name: 'mason', archetype: 'vendor', outfit: 'none', prop: 'food-tacos', vibe: 'tacos with a view of the space needle', personalityNotes: 'Mentions the skyline between orders. Tacos are good; the backdrop is the pitch.' },
    { name: 'nadia', archetype: 'wanderer', outfit: 'hippie', prop: 'drink-water', vibe: 'refill station evangelist', personalityNotes: 'Knows every water fountain in the park. Guides strangers like a volunteer.' },
    { name: 'orion', archetype: 'chiller', outfit: 'none', prop: 'hat-headphones', vibe: 'headphones around neck, live music only', personalityNotes: 'Wears headphones as jewelry. Would never play music over the live set. Fashion statement.' },
    { name: 'piper', archetype: 'dancer', outfit: 'none', prop: 'party-glowsticks', vibe: 'synchronized with the light rig', personalityNotes: 'Matches footwork to light changes. Annoyed when lighting does not follow the beat.' },
    { name: 'reggie', archetype: 'vendor', outfit: 'pirate', prop: 'food-fries', vibe: 'fries in the pacific northwest', personalityNotes: 'Argues fries should be twice fried. Customers nod politely and eat anyway.' },
    { name: 'sienna', archetype: 'chiller', outfit: 'none', prop: 'food-popcorn', vibe: 'popcorn rain cover engineering', personalityNotes: 'Built a popcorn shield from a hoodie and pride. Works better than expected.' },
  ],
  edc: [
    { name: 'ace', archetype: 'dancer', outfit: 'hippie', prop: 'party-glowsticks', vibe: 'neon everything, sleep optional', personalityNotes: 'Treats LED accessories like armor. Has not sat down since sundown and sees no reason to.' },
    { name: 'briar', archetype: 'hustler', outfit: 'none', prop: 'mask-3', vibe: 'kandi trade negotiator', personalityNotes: 'Runs bead trades like a stock exchange. Tracks bracelet value with serious math.' },
    { name: 'cruz', archetype: 'vendor', outfit: 'none', prop: 'drink-water', vibe: 'water squad at 2am', personalityNotes: 'Hands out water with the urgency of a medic. Has saved three friendships tonight.' },
    { name: 'daphne', archetype: 'chiller', outfit: 'none', prop: 'shades-glasses-yellow', vibe: 'resting between drops', personalityNotes: 'Found a calm pocket in chaos. Recharges for ninety seconds then disappears back into the crowd.' },
    { name: 'ellis', archetype: 'wanderer', outfit: 'pirate', prop: 'hand-boombox', vibe: 'lost the group, found the bass', personalityNotes: 'Phone died, friends gone, bass located. Considers this a net win.' },
    { name: 'flora', archetype: 'dancer', outfit: 'none', prop: 'party-confetti', vibe: 'confetti on the drop, always', personalityNotes: 'Times confetti to every drop with military precision. Runs out and buys more mid-set.' },
    { name: 'gideon', archetype: 'vendor', outfit: 'none', prop: 'food-pizza', vibe: 'pizza slice at four am', personalityNotes: 'Sells pizza like it is sacred fuel. Recommends toppings based on BPM.' },
    { name: 'harper', archetype: 'chiller', outfit: 'undercover-cop', prop: 'shades-glasses-optic', vibe: 'undercover at edc, neon fail', personalityNotes: 'All black at a neon festival was a miscalculation. Commits anyway. Comedy only.' },
    { name: 'indigo', archetype: 'dancer', outfit: 'hippie', prop: 'party-glowsticks', vibe: 'gloving without gloves', personalityNotes: 'Does hand light shows with glowsticks duct taped to fingers. Improvised and impressive.' },
    { name: 'jax', archetype: 'hustler', outfit: 'none', prop: null, vibe: 'vip bathroom directions for sale', personalityNotes: 'Claims to know a shorter line. Directions change based on who is asking.' },
    { name: 'kali', archetype: 'wanderer', outfit: 'none', prop: 'drink-lemonade', vibe: 'lemonade between stages', personalityNotes: 'Maps the festival by drink stands instead of stage names. Gives directions in lemonade units.' },
    { name: 'lennox', archetype: 'vendor', outfit: 'pirate', prop: 'food-tacos', vibe: 'tacos at the rail', personalityNotes: 'Eating tacos at the front rail like a challenge. Sauce on glow paint, zero regrets.' },
    { name: 'mira', archetype: 'chiller', outfit: 'none', prop: 'hat-headphones', vibe: 'afterparty planning committee of one', personalityNotes: 'Researching afterparties on dead phone battery. Recites rumors from memory.' },
    { name: 'niko', archetype: 'dancer', outfit: 'none', prop: 'hand-boombox', vibe: 'carrying vibes between stages', personalityNotes: 'Walks fast between stages with a boombox off but present. Transition DJ of the sidewalks.' },
    { name: 'opal', archetype: 'wanderer', outfit: 'hippie', prop: 'drink-beer', vibe: 'beer and lasers, classic vegas', personalityNotes: 'Amazed by lasers every time like it is the first. Vegas novelty never wore off.' },
    { name: 'phoenix', archetype: 'dancer', outfit: 'none', prop: 'party-glowsticks', vibe: 'rail rider since sunset', personalityNotes: 'Front rail since doors. Hydrates, dances, repeats. Legs are a concern for later.' },
    { name: 'rowan', archetype: 'vendor', outfit: 'none', prop: 'food-fries', vibe: 'fries fuel for the night shift', personalityNotes: 'Markets fries as endurance food. Counts how many ravers he has kept alive.' },
    { name: 'tessa', archetype: 'chiller', outfit: 'pirate', prop: 'shades-glasses-green', vibe: 'costume held together with zip ties', personalityNotes: 'Outfit failing structurally but spirit intact. Fixes with zip ties between songs.' },
  ],
};

function dedupe(npcs) {
  const seen = new Set();
  return npcs.filter(n => {
    const key = n.name.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const file = JSON.parse(readFileSync(dataPath, 'utf8'));
const channels = { ...file.channels };

for (const [channel, additions] of Object.entries(ADDITIONS)) {
  const existing = channels[channel] ?? [];
  channels[channel] = dedupe([...existing, ...additions]);
}

file.channels = channels;
file.updatedAt = new Date().toISOString();

writeFileSync(dataPath, `${JSON.stringify(file, null, 2)}\n`);
console.log('Updated generated-npcs.json:');
for (const [k, v] of Object.entries(channels)) {
  console.log(`  ${k}: ${v.length}`);
}
