# Cat Park

A hillside lawn where eight cats play keep-away with your tennis balls, nap, hide, climb trees and come by for food. There are no rounds. Balls keep dropping from trees and rolling in from the edges, so you can play as long as you like.

A new park is just grass, trees and the feeding station. Everything else you build with the balls you catch.

## How it plays

- **Catch balls**: touch a loose ball to pop it. Each catch puts a ball token in the wallet at the top left. A ball you knock out of a cat's mouth is worth 3.
- **Spend tokens**: the + drawer is the shop. Drag an item onto the lawn to buy it. Tools in the dock (keys 1-6) show a price: tap once to pick, tap again to buy. Bigger items open as your lifetime catches grow, shown by the dots in the wallet.
- **Shape the lawn**: the axe clears trees, three per token. The path tool paints gravel, four tiles per token, and erased tiles go back into stock.
- **Refunds**: drop a bought item on the trash spot for half back, or all of it within 10 seconds of placing. Tools, care items, toys and collars are kept for good.
- **Answer requests**: cats ask for things in bubbles that use the same icon as the tray item. Every sixth catch drops a free care item in the tray, and the shop sells the one you want. Hold it near a cat and it comes running. Drop it on the cat to wake it up and send it off to play.
- **Collars**: buy one from the slot at the end of the tray. Put it on a cat to give it a name and pick its breed. Each next collar costs more.
- **Happy cats**: petting, brushing, feeding and play make a cat happier. Happy cats carry their tails high and purr. Ignored ones get grumpy.

Click trees, the food bowl or anything you've built. Drag props, balls and cats. Double-click a cat to have it follow you, and press Space to call everyone over.

## Saved parks

Type a first and last name to open your park. There is no password: the name is the key, so anyone who types the same name opens the same park. Next time the browser offers to continue as you, or lets someone else start their own.

Everything saves on its own, to the browser and to `api/park.ts`. On Vercel saves go to the connected Blob store. Locally they go to SQLite in `.data/parks.sqlite`, so there's nothing to set up. Loading checks the wallet and everything owned against what was earned and spent. The server also turns away saves that earn faster than anyone can play, and the park then reloads from the server's copy.

```bash
npm install
npm run dev
npm test
```

Built with Vite, React, TypeScript and Motion.
