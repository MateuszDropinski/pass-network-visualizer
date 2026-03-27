import { Component, ElementRef, inject, OnInit, signal, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PassNetworkComponent } from './components/pass-network/pass-network.component';
import { LegendComponent } from './components/legend/legend.component';
import { ToolbarComponent } from './components/toolbar/toolbar.component';
import { PitchComponent } from './components/pitch/pitch';
import { StatsbombAdapterService } from './services/statsbomb-adapter.service';
import { MatchCalculatorService } from './services/match-calculator.service';
import { MatchData } from './models/match.model';
import { DiagramData } from './models/diagram.model';

type TeamView = 'home' | 'both' | 'away';

@Component({
  selector: 'app-root',
  imports: [
    PassNetworkComponent,
    LegendComponent,
    ToolbarComponent,
    PitchComponent,
    MatButtonToggleModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  @ViewChild('exportArea', { static: true }) exportArea!: ElementRef<HTMLElement>;

  pitchWidth = 0;
  pitchHeight = 0;
  matchData: MatchData | null = null;
  homeDiagramData: DiagramData | null = null;
  awayDiagramData: DiagramData | null = null;
  homeTeamName = '';
  awayTeamName = '';
  startersOnly = true;
  teamView: TeamView = 'both';
  loading = signal(false);

  private readonly http = inject(HttpClient);
  private readonly statsbombAdapter = inject(StatsbombAdapterService);
  private readonly calculator = inject(MatchCalculatorService);

  get hasData(): boolean {
    return this.matchData !== null;
  }

  get showHome(): boolean {
    return this.teamView === 'home' || this.teamView === 'both';
  }

  get showAway(): boolean {
    return this.teamView === 'away' || this.teamView === 'both';
  }

  ngOnInit(): void {
    this.calculatePitchDimensions();
  }

  onMatchDataLoaded(data: MatchData): void {
    this.matchData = data;
    this.homeTeamName = data.match.home;
    this.awayTeamName = data.match.away;
    this.recalculate();
  }

  onTeamViewChange(view: TeamView): void {
    this.teamView = view;
  }

  onPlayersToggle(value: 'starters' | 'all'): void {
    this.startersOnly = value === 'starters';
    this.recalculate();
  }

  async exportAsImage(): Promise<void> {
    const { toPng } = await import('html-to-image');
    const dataUrl = await toPng(this.exportArea.nativeElement, {
      backgroundColor: '#0f0f0f',
      pixelRatio: 2,
    });
    const link = document.createElement('a');
    const home = this.homeTeamName || 'home';
    const away = this.awayTeamName || 'away';
    link.download = `pass-network-${home}-vs-${away}.png`;
    link.href = dataUrl;
    link.click();
  }

  exportAsPdf(): void {
    window.print();
  }

  private calculatePitchDimensions(): void {
    const legendHeight = 80;
    const toggleHeight = 48;
    const gap = 16;
    const availableWidth = window.innerWidth - gap;
    const availableHeight = window.innerHeight - legendHeight - toggleHeight;

    // Each pitch gets half the available width
    let pw = Math.floor(availableWidth / 2);
    let ph = Math.round(pw * (68 / 105));

    if (ph > availableHeight) {
      ph = availableHeight;
      pw = Math.round(ph * (105 / 68));
    }

    this.pitchWidth = pw;
    this.pitchHeight = ph;
  }

  private recalculate(): void {
    if (!this.matchData) return;
    this.homeDiagramData = this.calculator.calculateForTeam(
      this.matchData, 'home', this.pitchWidth, this.pitchHeight, this.startersOnly
    );
    this.awayDiagramData = this.calculator.calculateForTeam(
      this.matchData, 'away', this.pitchWidth, this.pitchHeight, this.startersOnly
    );
  }
}
