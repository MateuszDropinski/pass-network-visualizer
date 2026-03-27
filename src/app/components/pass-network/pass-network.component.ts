import { afterEveryRender, Component, computed, effect, ElementRef, inject, input, signal, viewChild } from '@angular/core';
import {
  NgDiagramComponent,
  NgDiagramConfig,
  NgDiagramEdgeTemplateMap,
  NgDiagramModelService,
  NgDiagramNodeTemplateMap,
  NgDiagramService,
  initializeModel,
  provideNgDiagram,
} from 'ng-diagram';
import { DiagramData, PlayerPassDetail } from '../../models/diagram.model';
import { PitchComponent } from '../pitch/pitch';
import { PassEdgeComponent, PassEdgeData } from './pass-edge.component';
import { PlayerNodeComponent } from './player-node.component';
import { InteractionService } from './interaction.service';

@Component({
  selector: 'app-pass-network',
  imports: [PitchComponent, NgDiagramComponent],
  providers: [provideNgDiagram(), InteractionService],
  templateUrl: './pass-network.component.html',
  styleUrl: './pass-network.component.scss',
})
export class PassNetworkComponent {
  readonly diagramData = input<DiagramData | null>(null);
  readonly pitchWidth = input.required<number>();
  readonly pitchHeight = input.required<number>();

  private readonly modelService = inject(NgDiagramModelService);
  private readonly ngDiagramService = inject(NgDiagramService);
  private readonly interaction = inject(InteractionService);

  readonly model = initializeModel();

  readonly nodeTemplateMap = new NgDiagramNodeTemplateMap([
    ['player', PlayerNodeComponent],
  ]);

  readonly edgeTemplateMap = new NgDiagramEdgeTemplateMap([
    ['pass', PassEdgeComponent],
  ]);

  readonly config: NgDiagramConfig = {
    nodeDraggingEnabled: false,
    viewportPanningEnabled: false,
    zoom: { min: 1, max: 1, step: 0 },
  };

  private lastDataRef: DiagramData | null = null;
  private readonly tooltipEl = viewChild<ElementRef<HTMLElement>>('tooltipEl');

  readonly tooltipData = computed<{ node: DiagramData['nodes'][number]; x: number; anchorTop: number; anchorBottom: number; details: PlayerPassDetail[] } | null>(() => {
    const hoveredId = this.interaction.hoveredPlayerId();
    const anchor = this.interaction.tooltipAnchor();
    const data = this.diagramData();
    if (!hoveredId || !anchor || !data) return null;

    const node = data.nodes.find(n => n.playerId === hoveredId);
    if (!node) return null;

    const details = data.passDetails.get(hoveredId) ?? [];
    return {
      node,
      x: anchor.x,
      anchorTop: anchor.top,
      anchorBottom: anchor.bottom,
      details,
    };
  });

  readonly tooltipPosition = signal<{ x: number; y: number }>({ x: 0, y: 0 });

  constructor() {
    effect(() => {
      const data = this.diagramData();
      const isInit = this.ngDiagramService.isInitialized();
      if (!data || !isInit) return;
      if (data === this.lastDataRef) return;
      this.lastDataRef = data;
      this.buildModel(data);
    });

    afterEveryRender(() => {
      const tip = this.tooltipData();
      if (!tip) return;

      const el = this.tooltipEl()?.nativeElement;
      if (!el) {
        this.updateTooltipPosition(tip.x, tip.anchorTop - 8);
        return;
      }

      const rect = el.getBoundingClientRect();
      const pad = 8;
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      let x = tip.x;
      // Default: show above node (CSS transform -100% shifts it up)
      let y = tip.anchorTop - 8;

      // Horizontal: center-aligned (CSS transform -50%), clamp by half-width
      const halfW = rect.width / 2;
      if (x - halfW < pad) {
        x = halfW + pad;
      } else if (x + halfW > vw - pad) {
        x = vw - halfW - pad;
      }

      // Vertical: if not enough room above, flip below the node
      if (y - rect.height < pad) {
        y = tip.anchorBottom + 8;
        // When below, CSS transform -100% would push it up — compensate
        y += rect.height;
      }
      if (y > vh - pad) {
        y = vh - pad;
      }

      this.updateTooltipPosition(x, y);
    });
  }

  private updateTooltipPosition(x: number, y: number): void {
    const current = this.tooltipPosition();
    if (current.x === x && current.y === y) return;
    this.tooltipPosition.set({ x, y });
  }

  onBackgroundClick(): void {
    this.interaction.clearSelection();
  }

  private buildModel(data: DiagramData): void {
    // Clear existing model before rebuilding
    const existingNodeIds = this.modelService.nodes().map(n => n.id);
    const existingEdgeIds = this.modelService.edges().map(e => e.id);
    if (existingEdgeIds.length) this.modelService.deleteEdges(existingEdgeIds);
    if (existingNodeIds.length) this.modelService.deleteNodes(existingNodeIds);

    const nodes = data.nodes.map(playerNode => ({
      id: playerNode.playerId,
      position: {
        x: playerNode.x - playerNode.nodeSize / 2,
        y: playerNode.y - playerNode.nodeSize / 2,
      },
      draggable: false,
      resizable: false,
      rotatable: false,
      autoSize: false,
      size: { width: playerNode.nodeSize, height: playerNode.nodeSize },
      type: 'player',
      data: { playerNode },
    }));

    const edges = data.edges.map(passEdge => ({
      id: `${passEdge.fromPlayerId}-${passEdge.toPlayerId}`,
      source: passEdge.fromPlayerId,
      target: passEdge.toPlayerId,
      sourcePort: 'center',
      targetPort: 'center',
      type: 'pass',
      routing: 'polyline' as const,
      data: {
        passEdge,
      } satisfies PassEdgeData,
    }));

    this.modelService.addNodes(nodes);
    this.modelService.addEdges(edges);
  }
}
