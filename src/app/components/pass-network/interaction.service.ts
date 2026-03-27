import { computed, Injectable, signal } from '@angular/core';

@Injectable()
export class InteractionService {
  readonly selectedPlayerId = signal<string | null>(null);
  readonly hoveredPlayerId = signal<string | null>(null);
  readonly tooltipAnchor = signal<{ x: number; top: number; bottom: number } | null>(null);

  /** The player whose connections should be highlighted — click takes precedence over hover */
  readonly activePlayerId = computed(() => this.selectedPlayerId() ?? this.hoveredPlayerId());

  selectPlayer(playerId: string): void {
    if (this.selectedPlayerId() === playerId) {
      this.selectedPlayerId.set(null);
    } else {
      this.selectedPlayerId.set(playerId);
    }
  }

  hoverPlayer(playerId: string): void {
    this.hoveredPlayerId.set(playerId);
  }

  unhoverPlayer(): void {
    this.hoveredPlayerId.set(null);
  }

  clearSelection(): void {
    this.selectedPlayerId.set(null);
  }
}
