import { Component, computed, inject, input } from '@angular/core';
import { Edge, NgDiagramBaseEdgeComponent, NgDiagramEdgeTemplate } from 'ng-diagram';
import { PassEdge } from '../../models/diagram.model';
import { InteractionService } from './interaction.service';

export interface PassEdgeData {
  passEdge: PassEdge;
}

@Component({
  selector: 'app-pass-edge',
  imports: [NgDiagramBaseEdgeComponent],
  template: `
    <ng-diagram-base-edge
      [edge]="edge()"
      [stroke]="strokeColor()"
      [strokeWidth]="strokeWidth()"
      [strokeOpacity]="opacity()"
    />
  `,
  styles: [`
    :host {
      transition: opacity 0.2s ease;
    }
  `],
})
export class PassEdgeComponent implements NgDiagramEdgeTemplate<PassEdgeData> {
  readonly edge = input.required<Edge<PassEdgeData>>();
  private readonly interaction = inject(InteractionService);

  private readonly passEdge = computed(() => this.edge().data.passEdge);

  readonly strokeColor = computed(() => this.passEdge().edgeColor);
  readonly strokeWidth = computed(() => this.passEdge().edgeWidth);

  readonly opacity = computed(() => {
    const active = this.interaction.activePlayerId();
    if (!active) return 0.85; // minimum opacity so thin edges stay visible on dark pitch
    const edge = this.passEdge();
    if (edge.fromPlayerId === active || edge.toPlayerId === active) return 1;
    return 0.15;
  });
}
