# Real-Time Multiplayer Games

This is the browser client for a lightweight multiplayer game arena built with Next.js, React, and Socket.IO. Players may create a room, join with a code, and play either Tic-Tac-Toe or Rock Paper Scissors in a real-time match against a friend.

## Purpose

- Host a 1v1 room in seconds
- Join by a five-character room code
- Play Tic-Tac-Toe or multi-round Rock Paper Scissors
- Use the backend as the source of truth for game state, results, and timing
- Experience a clean, responsive UI with sound and theme support

## Supported games

### Tic-Tac-Toe

- Classic 3x3 board
- Turn-based play with automatic backend validation
- Win/draw handling and room lifecycle controls
- Countdown and reconnect handling via Socket.IO

### Rock Paper Scissors

- Multi-round match flow with 1–10 rounds
- Optional round count selected by the room creator
- Private choice submission with reveal only after both players submit
- Round-by-round score tracking
- Automatic transition to the next round
- Final match result and rematch flow

## Rock Paper Scissors flow

1. Choose Rock Paper Scissors on the home screen
2. Select the number of rounds from 1 to 10
3. Create the room and share the code
4. Each round begins with a synchronized countdown
5. Players choose Rock, Paper, or Scissors
6. The choice remains hidden until both players submit
7. The backend reveals both choices and announces the winner
8. The game automatically advances to the next round
9. After the final round, the match result is shown with a rematch option

## Scoring and match rules

- The creator selects the total number of rounds for RPS
- A round winner is awarded one point
- Draws are tracked separately
- Final match winner is based on total round wins
- Draws are shown explicitly when both players tie the match
- Match history is displayed from the backend state and resets when a new rematch begins

## Sound controls

- Global sound toggle is available from the game UI
- Sound effects are short, aural, non-verbal game cues
- Muted state is persisted in local storage
- Browser autoplay restrictions are handled safely without breaking gameplay

## Light/dark mode

- Light and dark mode are controlled with a global theme toggle
- The selected theme is stored locally and applied across the lobby, game, dialogs, and result states
- The app remains polished without introducing an unnecessary UI library

## Environment variables

The app reads public environment values for the backend connection.

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

- The backend remains the source of truth for the actual game state.
- The frontend does not persist match state in localStorage.
- The app keeps the existing architecture intact while improving responsiveness and clarity.
