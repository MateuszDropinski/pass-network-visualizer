# Pass Network Visualizer

A football pass network visualization tool that turns match event data into interactive passing diagrams. Built with Angular and [ngDiagram](https://github.com/synergycodes/ng-diagram).

## What It Does

- Visualizes passing connections between players on a football pitch
- Shows pass volume (edge thickness), accuracy (edge color), and player involvement (node size)
- Supports both home and away team networks side by side or individually
- Hover over a player to see detailed passing stats (passes made, received, accuracy)
- Click a player to highlight their passing connections

## How to Import Data

There are two ways to load match data:

### StatsBomb JSON

Click **Import StatsBomb** and select a raw StatsBomb events JSON file. The app converts it automatically.

### Any Data Source (via AI)

1. Click **Copy AI Prompt** — a conversion prompt is copied to your clipboard
2. Paste the prompt into ChatGPT, Claude, or any LLM along with your match data
3. The AI returns a converted JSON file
4. Click **Import JSON** and select the converted file

A sample match file (Barcelona vs Deportivo Alaves, La Liga) is included for quick testing — click **Load Sample Match** to try the app without importing anything.

## Export

- **Export as Image** — downloads the current view as a PNG
- **Export as PDF** — opens browser print dialog with print-optimized styling

## Running Locally

```bash
pnpm install
pnpm start
```

Open `http://localhost:4200` in your browser.

## Built With

- [Angular](https://angular.dev)
- [ngDiagram](https://github.com/synergycodes/ng-diagram) — open-source Angular diagramming library by Synergy Codes
- [Angular Material](https://material.angular.io)
