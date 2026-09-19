# Real-Time Multiplayer Games

This is the browser client for a lightweight multiplayer game arena built with Next.js, React, and Socket.IO. Players create a room, join with a code, and play either XO or RPS in a live match against a friend.

## Purpose

- Host a 1v1 room in seconds
- Join with a five-character room code
- Play XO or multi-round RPS
- Use the backend as the source of truth for state, results, and timing
- Experience a responsive app-style interface with sound and theme support

## Supported games

### XO

- Classic 3x3 board
- Turn-based logic with backend validation
- Win and draw handling
- Countdown and reconnect support through Socket.IO

### RPS

- Multi-round match flow with 1–10 rounds
- Round count selected by the room creator
- Private moves submitted before reveal
- Round-by-round tracking and final match winner
- Automatic round progression and rematch flow

### Game cards

- The home screen presents each game as a compact app-style icon tile
- Selection is based on tap/click without radio controls
- Each game has a custom SVG icon to keep the UI simple and mobile-friendly

## RPS flow

1. Choose RPS on the home screen
2. Select the number of rounds from 1 to 10
3. Create the room and share the code
4. Each round begins with a synchronized countdown
5. Players pick Rock, Paper, or Scissors
6. Choices remain hidden until both players submit
7. The backend reveals both selections and announces the winner
8. The match advances automatically to the next round
9. After the final round, the result is shown with rematch options

## Scoring and match rules

- The room creator selects the total number of rounds for RPS
- Each round winner gets one point
- Draws are tracked separately
- The overall match winner is based on total round wins
- Match history is shown from backend state and resets on rematch

## Sound controls

- A global sound toggle is available from the game UI
- Sound cues are short, non-verbal, and game-specific
- Muted state is persisted in local storage
- Browser autoplay restrictions are handled safely without breaking gameplay

## Light/dark mode

- Light and dark mode are controlled by a global theme toggle
- The selected theme is stored locally and applied across lobby and game screens
- The app remains polished without adding unnecessary UI libraries

## Environment variables

The app reads public environment values for backend connectivity.

Example:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
npm run start
```

## Notes

- The backend is the source of truth for the actual game state.
- The frontend does not persist match state in localStorage.
- The app keeps the existing architecture intact while improving responsiveness and clarity.
