import { Injectable } from '@angular/core';
import { MatchData, PassEvent, Team } from '../models/match.model';
import { DiagramData, PassEdge, PlayerNode, PlayerPassDetail } from '../models/diagram.model';

const NODE_SIZE_MIN = 24;
const NODE_SIZE_MAX = 48;
const EDGE_WIDTH_MIN = 1;
const EDGE_WIDTH_MAX = 8;
const EDGE_MIN_PASS_COUNT = 3;

const COLOR_PASS_HIGH = '#4caf50';
const COLOR_PASS_MID = '#ff9800';
const COLOR_PASS_LOW = '#f44336';
const COLOR_PASS_NEUTRAL = '#888888';

@Injectable({ providedIn: 'root' })
export class MatchCalculatorService {
  calculateForTeam(data: MatchData, teamId: 'home' | 'away', pitchWidth: number, pitchHeight: number, startersOnly: boolean): DiagramData {
    const team = data.teams.find(t => t.id === teamId);
    if (!team) return { nodes: [], edges: [], passDetails: new Map() };

    // Filter players and events based on mode
    const players = startersOnly
      ? team.players.filter(p => p.isStarter !== false)
      : team.players;
    const playerIds = new Set(players.map(p => p.id));
    const events = startersOnly
      ? team.events.filter(e => playerIds.has(e.fromId) && playerIds.has(e.toId))
      : team.events;

    const filteredTeam: Team = { ...team, players, events };

    const nodes = this.buildNodes(filteredTeam, data.coordinateSystem.x, data.coordinateSystem.y, pitchWidth, pitchHeight);
    const edges = this.buildEdges(filteredTeam);
    const passDetails = this.buildPassDetails(filteredTeam);

    return { nodes, edges, passDetails };
  }

  private buildNodes(team: Team, coordX: number, coordY: number, pitchWidth: number, pitchHeight: number): PlayerNode[] {
    const passesFromPlayer = new Map<string, PassEvent[]>();
    const passesToPlayer = new Map<string, number>();

    for (const event of team.events) {
      if (!passesFromPlayer.has(event.fromId)) passesFromPlayer.set(event.fromId, []);
      passesFromPlayer.get(event.fromId)!.push(event);
      passesToPlayer.set(event.toId, (passesToPlayer.get(event.toId) ?? 0) + 1);
    }

    const maxPassesMade = Math.max(0, ...Array.from(passesFromPlayer.values()).map(e => e.length));

    return team.players.map(player => {
      const events = passesFromPlayer.get(player.id) ?? [];
      const totalPassesMade = events.length;

      const eventsWithCoords = events.filter(e => e.x !== null && e.y !== null);
      let x: number;
      let y: number;

      if (eventsWithCoords.length > 0) {
        const avgX = eventsWithCoords.reduce((sum, e) => sum + e.x!, 0) / eventsWithCoords.length;
        const avgY = eventsWithCoords.reduce((sum, e) => sum + e.y!, 0) / eventsWithCoords.length;
        x = (avgX / coordX) * pitchWidth;
        y = (avgY / coordY) * pitchHeight;
      } else {
        // Default position: center of team's half
        x = team.id === 'home' ? pitchWidth * 0.25 : pitchWidth * 0.75;
        y = pitchHeight * 0.5;
      }

      const nodeSize = maxPassesMade > 0
        ? NODE_SIZE_MIN + ((totalPassesMade / maxPassesMade) * (NODE_SIZE_MAX - NODE_SIZE_MIN))
        : NODE_SIZE_MIN;

      const accurateCount = events.filter(e => e.accurate === true).length;
      const accuracyRate = totalPassesMade > 0 ? accurateCount / totalPassesMade : 0;

      return {
        playerId: player.id,
        teamId: team.id,
        name: player.name,
        number: player.number,
        x,
        y,
        totalPassesMade,
        totalPassesReceived: passesToPlayer.get(player.id) ?? 0,
        accuracyRate,
        nodeSize,
      };
    });
  }

  private buildPassDetails(team: Team): Map<string, PlayerPassDetail[]> {
    const playerMap = new Map(team.players.map(p => [p.id, p]));

    // Count directional passes and accurate passes: fromId → toId
    const dirMap = new Map<string, { total: number; accurate: number }>();
    for (const event of team.events) {
      const key = `${event.fromId}→${event.toId}`;
      if (!dirMap.has(key)) dirMap.set(key, { total: 0, accurate: 0 });
      const entry = dirMap.get(key)!;
      entry.total++;
      if (event.accurate === true) entry.accurate++;
    }

    const result = new Map<string, PlayerPassDetail[]>();
    for (const player of team.players) {
      const details: PlayerPassDetail[] = [];
      for (const partner of team.players) {
        if (partner.id === player.id) continue;
        const toData = dirMap.get(`${player.id}→${partner.id}`);
        const fromData = dirMap.get(`${partner.id}→${player.id}`);
        const to = toData?.total ?? 0;
        const from = fromData?.total ?? 0;
        if (to === 0 && from === 0) continue;
        details.push({
          partnerId: partner.id,
          partnerName: partner.name,
          partnerNumber: partner.number,
          passesTo: to,
          accurateTo: toData?.accurate ?? 0,
          passesFrom: from,
          accurateFrom: fromData?.accurate ?? 0,
        });
      }
      // Sort by total exchange volume descending
      details.sort((a, b) => (b.passesTo + b.passesFrom) - (a.passesTo + a.passesFrom));
      result.set(player.id, details);
    }
    return result;
  }

  private buildEdges(team: Team): PassEdge[] {
    // Aggregate pass pairs undirected: combine A→B and B→A into one edge
    const pairMap = new Map<string, { playerA: string; playerB: string; count: number; accurateCount: number; hasAccuracyData: boolean }>();

    for (const event of team.events) {
      const [a, b] = event.fromId < event.toId
        ? [event.fromId, event.toId]
        : [event.toId, event.fromId];
      const key = `${a}↔${b}`;
      if (!pairMap.has(key)) pairMap.set(key, { playerA: a, playerB: b, count: 0, accurateCount: 0, hasAccuracyData: false });
      const entry = pairMap.get(key)!;
      entry.count++;
      if (event.accurate !== null) {
        entry.hasAccuracyData = true;
        if (event.accurate) entry.accurateCount++;
      }
    }

    // Filter by minimum pass count
    const pairs = Array.from(pairMap.values()).filter(v => v.count >= EDGE_MIN_PASS_COUNT);

    const maxCount = Math.max(0, ...pairs.map(v => v.count));

    return pairs.map(({ playerA, playerB, count, accurateCount, hasAccuracyData }) => {
      const accuracyRate = hasAccuracyData ? accurateCount / count : -1;
      const edgeWidth = maxCount > 0
        ? EDGE_WIDTH_MIN + ((count / maxCount) * (EDGE_WIDTH_MAX - EDGE_WIDTH_MIN))
        : EDGE_WIDTH_MIN;

      let edgeColor: string;
      if (!hasAccuracyData) {
        edgeColor = COLOR_PASS_NEUTRAL;
      } else if (accuracyRate >= 0.8) {
        edgeColor = COLOR_PASS_HIGH;
      } else if (accuracyRate >= 0.6) {
        edgeColor = COLOR_PASS_MID;
      } else {
        edgeColor = COLOR_PASS_LOW;
      }

      return {
        fromPlayerId: playerA,
        toPlayerId: playerB,
        teamId: team.id,
        passCount: count,
        accurateCount,
        accuracyRate: hasAccuracyData ? accuracyRate : 0,
        edgeWidth,
        edgeColor,
      };
    });
  }
}
