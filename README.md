# WhichStage

Explore cities, watch live shows, and meet autonomous NPCs in a 2D side-scrolling world.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Controls

- **← →** or **A / D** — walk
- **↑**, **W**, or **Space** — jump (or say goodbye when connected to an NPC)
- **Enter** — open chat when connected to an NPC
- **Mute button** — toggle stage video audio

## Project structure

```
app/
  page.tsx              # Game entry point
  support/page.tsx
  privacy/page.tsx
components/game/
  SFCity.tsx            # Main game scene
  Character.tsx         # Reusable character
  NPC.tsx               # Autonomous NPC behaviour
  ChatBubble.tsx
  characters.ts         # NPC names, personalities, greetings
```
