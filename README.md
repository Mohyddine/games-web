# Tic-Tac-Toe Frontend

This project is the browser client for a live two-player Tic-Tac-Toe game built
with Next.js, React, and Socket.IO. The frontend is responsible for the user
experience: session setup, room flow, match UI, player display, validation,
notifications, and reconnect behavior. The backend remains the source of truth
for the actual game state, session data, name validation, room rules, and any
duplicate-name resolution.

The app is intentionally lightweight and fast, but it still provides the full
multiplayer loop:

- the player must choose a valid username before entering the app
- the player can create a game room or join a room with a code
- the waiting room shows connected players and room details
- the game starts with a countdown and the board becomes active
- turns are timed and tracked by the backend
- the result is shown immediately after the match ends
- rematches, leaving a room, and reconnection are all handled in the live flow

## How to play

Tic-Tac-Toe is played on a 3x3 board. Players alternate turns, placing either
an X or an O in one empty square. A player wins by placing three matching marks
in a row, column, or diagonal.

If the board fills without a winner, the game ends in a draw.

The frontend makes this feel intuitive:

- the board is shown clearly with the current turn highlighted
- the timer shows how long the active player has to move
- the result screen explains whether the player won, lost, or drew
- the app shows the current room code and waiting state before the match begins

## Game rules and backend authority

The backend defines the actual game logic and authoritative state. The frontend
only reflects that state in a user-friendly way. The backend handles:

- session creation and restoration
- username validation and allowed character rules
- room creation and join logic
- symbol assignment (X/O)
- turn order and turn timer enforcement
- board result determination
- draw detection
- disconnect and reconnect handling
- rematch lifecycle
- duplicate-name display name handling inside a room

This is important because the UI must never generate a fallback player name. A
player must enter a valid username, and all names displayed during the room/game
experience are taken from the backend response, including any `displayName`
created when two players share the same base name.

## Username and session flow

Before entering the application, the user must choose a username on the session
screen.

The mandatory frontend rules are:

- required
- 2–20 characters
- letters, numbers, and spaces only
- trim leading/trailing spaces before sending
- preserve capitalization

If the backend rejects the input with `INVALID_NAME`, the frontend displays a
clear in-page validation message without using `alert()`. There are no default
names, generated usernames, random placeholders, or silent fallback values.

The session is stored in an HTTP-only cookie and restored on refresh when the
browser has previously created a valid session.

## Pages and user flow

### 1. Session page

The session page is the entry gate to the app.

What it does:

- shows a clear prompt: "Choose your username"
- asks the player to enter a name in a dedicated input
- validates the name before continuing
- prevents submission when the field is empty or invalid
- calls the backend session endpoint only with a valid name
- redirects automatically to Home once the session is ready

This screen intentionally blocks access to the game until a valid name exists.

### 2. Home page

The home screen is the main landing area after the session is created.

What it does:

- welcomes the current player by their backend-provided name
- shows the selected username in a clean, readable card or header
- lets the player create a new room
- lets the player join an existing room using a five-character code
- redirects to the waiting room if a room is already active
- blocks access if the session is missing or the name is empty

### 3. Waiting room page

The waiting room is where players confirm the room is ready before the match
starts.

What it does:

- displays the room code in a stylized card
- lets players copy the code
- shows players currently in the room
- indicates the host/guest role
- waits for the second player to join
- redirects to the game when the countdown begins

### 4. Game page

The game page is the live match screen.

What it does:

- shows the active room code and socket connection status
- renders the board and current turn
- shows both players with backend-assigned names or display names
- highlights whose turn it is
- prevents moves outside the current player's turn
- handles disconnect/reconnect warning states
- shows the result once a winner is determined or the board fills
- supports rematch requests and leaving the room

### 5. Result / rematch experience

After the board ends, the result screen shows:

- whether the player won, lost, or drew
- the final round status
- an option to request a rematch
- a prompt to accept or decline an incoming rematch request

The current result reflects the backend's authoritative winner state, not a UI
calculation.

## Frontend architecture

```text
src/
├── app/
│   ├── session/         Session entry and username validation
│   ├── home/            Create or join a room
│   ├── waiting/         Waiting room and player list
│   ├── game/            Live board and match screen
│   ├── layout.tsx       Global application layout
│   └── page.tsx         Initial redirect to session/home
├── components/
│   ├── game/            Board, player cards, turn indicator, overlays
│   └── ui/              Shared controls such as Button and Input
├── context/
│   ├── SessionContext   Creates/restores session and stores player identity
│   └── RoomContext      Restores room state and syncs live socket updates
├── lib/
│   ├── api.ts           REST client for sessions and room endpoints
│   ├── config.ts        Public backend URL config
│   └── socket.ts        Socket.IO client setup
├── types/
│   ├── api.ts           REST response and session types
│   ├── game.ts          Game/room/player domain types
│   └── socket.ts        Socket event typing
├── app/globals.css      Design tokens, animations, and application polish
└── README.md            Frontend documentation
```

## Real-time communication model

The frontend uses two communication paths:

1. REST requests for session and room state
2. Socket.IO events for live updates while inside a room

Examples:

- `session` creation and restoration via REST
- `room:create` and `room:join` via REST
- room updates via socket room events
- turn and board changes via game events
- disconnects, reconnections, and rematches via socket notifications

The constants and event names remain aligned with the backend contract, and the
frontend does not invent new protocols or alter payload shapes.

## Design and UX goals

The interface is built to feel intentional, polished, and easy to use on both
mobile and desktop screens.

Key UX principles:

- no generated names or placeholder usernames
- strong white space and readable typography
- clear validation states
- visible loading indicators during session or room operations
- smooth transitions between session, home, waiting, and game screens
- consistent names and display names across the entire play session
- minimal friction when joining or creating a room

## Configuration

Copy the example environment file if you want to override the backend origin:

```bash
cp .env.example .env.local
```

The app expects these public variables:

| Variable | Purpose | Default |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | REST backend URL | `https://games-api.codewithmehyo.com` |
| `NEXT_PUBLIC_SOCKET_URL` | Socket.IO backend URL | `https://games-api.codewithmehyo.com` |

If these values are not present, the frontend falls back to the hosted backend
origin used by the project.

## PWA and SEO

The app exposes the standard PWA and search-engine endpoints:

- `/manifest.webmanifest` describes the installable app and its icons.
- `/robots.txt` allows public discovery while excluding room and game screens.
- `/sitemap.xml` lists the public entry routes.
- `/sw.js` provides a small network-first service worker for previously visited
  documents.

Set `NEXT_PUBLIC_SITE_URL` to the production origin (for example,
`https://play.example.com`) so canonical URLs, Open Graph URLs, robots, and the
sitemap use the deployed domain. It defaults to `http://localhost:3000` for
local development.

## Development and validation

Run the frontend checks locally:

```bash
npm install
npm run lint
npm run build
```

This keeps the frontend validation focused on the app itself without modifying
backend behavior, REST contract shape, or Socket.IO event layouts.

## Summary

This frontend is a complete browser client for a real-time Tic-Tac-Toe game.
It enforces the required username experience, keeps the session flow secure and
clear, provides room creation/joining, tracks live game state, and reflects the
backend-authoritative results and names throughout the entire user journey.

The key design rule is simple: no player enters the app without a valid name,
and no frontend-generated fallback names are ever shown.
