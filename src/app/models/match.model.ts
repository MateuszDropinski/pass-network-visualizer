export interface MatchInfo {
  home: string;
  away: string;
  competition: string;
}

export interface CoordinateSystem {
  x: number;
  y: number;
}

export interface Player {
  id: string;
  name: string;
  number: number | null;
  isStarter: boolean;
}

export interface PassEvent {
  type: 'pass';
  fromId: string;
  toId: string;
  accurate: boolean | null;
  x: number | null;
  y: number | null;
}

export interface Team {
  id: 'home' | 'away';
  name: string;
  players: Player[];
  events: PassEvent[];
}

export interface MatchData {
  match: MatchInfo;
  coordinateSystem: CoordinateSystem;
  teams: Team[];
}
