export interface PlayerNode {
  playerId: string;
  teamId: 'home' | 'away';
  name: string;
  number: number | null;
  x: number;
  y: number;
  totalPassesMade: number;
  totalPassesReceived: number;
  accuracyRate: number;
  nodeSize: number;
}

export interface PassEdge {
  fromPlayerId: string;
  toPlayerId: string;
  teamId: 'home' | 'away';
  passCount: number;
  accurateCount: number;
  accuracyRate: number;
  edgeWidth: number;
  edgeColor: string;
}

export interface PlayerPassDetail {
  partnerId: string;
  partnerName: string;
  partnerNumber: number | null;
  passesTo: number;
  accurateTo: number;
  passesFrom: number;
  accurateFrom: number;
}

export interface DiagramData {
  nodes: PlayerNode[];
  edges: PassEdge[];
  /** Map from playerId to directional pass details with each partner */
  passDetails: Map<string, PlayerPassDetail[]>;
}
