import { Component, computed, inject, input } from '@angular/core';
import { NgDiagramNodeTemplate, NgDiagramPortComponent, SimpleNode } from 'ng-diagram';
import { PlayerNode } from '../../models/diagram.model';
import { InteractionService } from './interaction.service';

export interface PlayerNodeData {
  playerNode: PlayerNode;
}

@Component({
  selector: 'app-player-node',
  imports: [NgDiagramPortComponent],
  template: `
    <div
      class="player-node"
      [style.width.px]="size()"
      [style.height.px]="size()"
      [style.background-color]="color()"
      [style.font-size.px]="fontSize()"
      [style.opacity]="opacity()"
      [class.highlighted]="isActive()"
      (mouseenter)="onMouseEnter($event)"
      (mouseleave)="onMouseLeave()"
      (click)="onClick($event)"
    >
      {{ label() }}
    </div>
    <ng-diagram-port id="center" type="both" side="top" class="center-port" style="top: 50%" />
  `,
  styles: [`
    :host {
      display: contents;
    }
    .player-node {
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1.5px solid rgba(255, 255, 255, 0.25);
      color: white;
      font-weight: 600;
      font-family: Roboto, sans-serif;
      pointer-events: auto;
      box-sizing: border-box;
      cursor: pointer;
      transition: opacity 0.2s ease;
    }
    .player-node.highlighted {
      border-color: rgba(255, 255, 255, 0.8);
      box-shadow: 0 0 8px rgba(255, 255, 255, 0.3);
    }
    .center-port {
      --ngd-port-size: 1px;
      opacity: 0;
      pointer-events: none;
    }
  `],
})
export class PlayerNodeComponent implements NgDiagramNodeTemplate<PlayerNodeData> {
  readonly node = input.required<SimpleNode<PlayerNodeData>>();
  private readonly interaction = inject(InteractionService);

  readonly playerNode = computed(() => this.node().data.playerNode);

  readonly size = computed(() => {
    const w = this.node().size?.width;
    return typeof w === 'number' ? w : 32;
  });

  readonly color = computed(() =>
    this.playerNode().teamId === 'home'
      ? 'var(--color-home, #4a9eff)'
      : 'var(--color-away, #ff6b4a)'
  );

  readonly label = computed(() =>
    this.playerNode().number?.toString() ?? '-'
  );

  readonly fontSize = computed(() => Math.max(8, this.size() * 0.35));

  readonly isActive = computed(() =>
    this.interaction.activePlayerId() === this.playerNode().playerId
  );

  readonly opacity = computed(() => {
    const active = this.interaction.activePlayerId();
    if (!active) return 1;
    if (active === this.playerNode().playerId) return 1;
    return 0.4;
  });

  onMouseEnter(event: MouseEvent): void {
    const el = event.target as HTMLElement;
    const rect = el.getBoundingClientRect();
    this.interaction.hoverPlayer(this.playerNode().playerId);
    this.interaction.tooltipAnchor.set({
      x: rect.left + rect.width / 2,
      top: rect.top,
      bottom: rect.bottom,
    });
  }

  onMouseLeave(): void {
    this.interaction.unhoverPlayer();
    this.interaction.tooltipAnchor.set(null);
  }

  onClick(event: MouseEvent): void {
    event.stopPropagation();
    this.interaction.selectPlayer(this.playerNode().playerId);
  }
}
