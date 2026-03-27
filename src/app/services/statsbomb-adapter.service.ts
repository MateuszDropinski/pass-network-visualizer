import { Injectable } from '@angular/core';
import { MatchData, PassEvent, Player, Team } from '../models/match.model';

@Injectable({ providedIn: 'root' })
export class StatsbombAdapterService {
  convert(rawData: any[]): MatchData {
    const startingXiEvents = rawData.filter(e => e.type?.name === 'Starting XI');
    if (startingXiEvents.length < 2) {
      throw new Error(`Expected 2 Starting XI events, found ${startingXiEvents.length}`);
    }

    // Determine home team from the first event's possession_team
    const firstEvent = rawData[0];
    const homeTeamId: number = firstEvent.possession_team?.id;

    const homeXi = startingXiEvents.find(e => e.team?.id === homeTeamId)!;
    const awayXi = startingXiEvents.find(e => e.team?.id !== homeTeamId)!;

    const homeTeamName: string = homeXi.team.name;
    const awayTeamName: string = awayXi.team.name;

    // Build player maps per team: statsbombPlayerId → Player
    const homePlayers = this.buildPlayerMap(homeXi.tactics.lineup);
    const awayPlayers = this.buildPlayerMap(awayXi.tactics.lineup);

    // Convert pass events, adding substitutes dynamically
    const homeEvents: PassEvent[] = [];
    const awayEvents: PassEvent[] = [];

    for (const event of rawData) {
      if (event.type?.name !== 'Pass') continue;

      const teamId: number = event.team?.id;
      const isHome = teamId === homeTeamId;
      const playerMap = isHome ? homePlayers : awayPlayers;
      const events = isHome ? homeEvents : awayEvents;

      const fromSbId: number = event.player?.id;
      const toSbId: number = event.pass?.recipient?.id;

      if (!fromSbId || !toSbId) continue;

      // Add substitute dynamically if not in starting XI
      if (!playerMap.has(fromSbId)) {
        playerMap.set(fromSbId, {
          id: `p${playerMap.size + 1}`,
          name: event.player.name,
          number: null,
          isStarter: false,
        });
      }
      if (!playerMap.has(toSbId)) {
        // Recipient might be on the opposing team — skip if so
        const opposingMap = isHome ? awayPlayers : homePlayers;
        if (opposingMap.has(toSbId)) continue;
        playerMap.set(toSbId, {
          id: `p${playerMap.size + 1}`,
          name: event.pass.recipient.name,
          number: null,
          isStarter: false,
        });
      }

      const fromPlayer = playerMap.get(fromSbId)!;
      const toPlayer = playerMap.get(toSbId);
      if (!toPlayer) continue;

      events.push({
        type: 'pass',
        fromId: fromPlayer.id,
        toId: toPlayer.id,
        accurate: event.pass?.outcome == null ? true : false,
        x: event.location?.[0] ?? null,
        y: event.location?.[1] ?? null,
      });
    }

    const toTeam = (
      id: 'home' | 'away',
      name: string,
      playerMap: Map<number, Player>,
      events: PassEvent[]
    ): Team => ({
      id,
      name,
      players: Array.from(playerMap.values()),
      events,
    });

    return {
      match: {
        home: homeTeamName,
        away: awayTeamName,
        competition: 'Unknown',
      },
      coordinateSystem: { x: 120, y: 80 },
      teams: [
        toTeam('home', homeTeamName, homePlayers, homeEvents),
        toTeam('away', awayTeamName, awayPlayers, awayEvents),
      ],
    };
  }

  private buildPlayerMap(lineup: any[]): Map<number, Player> {
    const map = new Map<number, Player>();
    lineup.forEach((entry, index) => {
      map.set(entry.player.id, {
        id: `p${index + 1}`,
        name: entry.player.name,
        number: entry.jersey_number ?? null,
        isStarter: true,
      });
    });
    return map;
  }
}
