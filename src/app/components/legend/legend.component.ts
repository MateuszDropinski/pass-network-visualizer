import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-legend',
  standalone: true,
  template: `
    <footer class="legend">
      <div class="legend-section">
        <span class="legend-title">Pass Accuracy</span>
        <div class="legend-items">
          <span class="legend-item"><span class="dot high"></span> ≥80%</span>
          <span class="legend-item"><span class="dot mid"></span> 60–79%</span>
          <span class="legend-item"><span class="dot low"></span> &lt;60%</span>
        </div>
      </div>

      <div class="divider"></div>

      <div class="legend-section">
        <span class="legend-title">Pass Volume</span>
        <div class="legend-items centered">
          <span class="legend-item">
            <svg width="90" height="16" viewBox="0 0 90 16">
              <line x1="0" y1="8" x2="30" y2="8" stroke="var(--color-text-muted)" stroke-width="1.5" />
              <line x1="30" y1="8" x2="60" y2="8" stroke="var(--color-text)" stroke-opacity="0.6" stroke-width="3.5" />
              <line x1="60" y1="8" x2="90" y2="8" stroke="var(--color-text)" stroke-opacity="0.8" stroke-width="6" />
            </svg>
          </span>
          <span class="label-row">
            <span class="label-muted">Few</span>
            <span class="label-muted">Many</span>
          </span>
        </div>
      </div>

      <div class="divider"></div>

      <div class="legend-section">
        <span class="legend-title">Player Involvement</span>
        <div class="legend-items circles centered">
          <svg width="90" height="32" viewBox="0 0 90 32">
            <circle cx="8" cy="22" r="6" fill="var(--color-text-muted)" />
            <circle cx="36" cy="18" r="10" fill="var(--color-text)" fill-opacity="0.6" />
            <circle cx="72" cy="14" r="13" fill="var(--color-text)" fill-opacity="0.8" />
          </svg>
          <span class="label-row">
            <span class="label-muted">Few</span>
            <span class="label-muted">Many</span>
          </span>
        </div>
      </div>

      <div class="divider"></div>

      <div class="legend-section">
        <span class="legend-title">Teams</span>
        <div class="legend-items">
          <span class="legend-item"><span class="dot home"></span> {{ homeTeam }}</span>
          <span class="legend-item"><span class="dot away"></span> {{ awayTeam }}</span>
        </div>
      </div>
    </footer>
  `,
  styles: `
    .legend {
      display: flex;
      align-items: flex-start;
      justify-content: center;
      gap: 20px;
      padding: 10px 24px;
      background: var(--color-surface);
      border-top: 1px solid var(--color-border);
    }

    .legend-section {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .legend-title {
      font-size: 11px;
      font-weight: 600;
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .legend-items {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .legend-items.centered {
      align-items: center;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: var(--color-text);
      opacity: 0.85;
    }

    .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .dot.high { background: var(--color-pass-high); }
    .dot.mid { background: var(--color-pass-mid); }
    .dot.low { background: var(--color-pass-low); }
    .dot.home { background: var(--color-home); }
    .dot.away { background: var(--color-away); }

    .label-row {
      display: flex;
      justify-content: space-between;
      width: 90px;
    }

    .label-muted {
      font-size: 11px;
      color: var(--color-text-muted);
    }

    .divider {
      width: 1px;
      align-self: stretch;
      background: var(--color-border);
    }
  `,
})
export class LegendComponent {
  @Input() homeTeam = 'Home';
  @Input() awayTeam = 'Away';
}
