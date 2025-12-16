# Game Service

### Setup

```bash
# Install tsx
cd services/game-service
npm i -D tsx

# Run
npm run simulate
```


### Event Loop

For Achtung/Curve Fever, the server state per session is basically:

- players[]: position (x,y), direction/angle, speed, alive/dead.
- trails[]: the line segments each player has left behind (including “gaps”).
- arena: width/height, wall behavior.
- tick: integer tick counter.
- config: speed, turn rate, gap frequency/length, player radius, etc.

