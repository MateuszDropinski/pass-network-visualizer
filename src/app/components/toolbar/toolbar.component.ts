import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { StatsbombAdapterService } from '../../services/statsbomb-adapter.service';
import { MatchData } from '../../models/match.model';
import { AI_PROMPT } from '../../constants/ai-prompt.constant';

const SNACKBAR_DURATION = 3000;
const SAMPLE_FILE = 'sample-barcelona-alaves-statsbomb.json';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [MatButtonModule, MatSnackBarModule, MatIconModule, MatMenuModule],
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.scss',
})
export class ToolbarComponent {
  @Input() loading = false;
  @Input() hasData = false;
  @Output() matchDataLoaded = new EventEmitter<MatchData>();
  @Output() loadingChange = new EventEmitter<boolean>();
  @Output() exportImage = new EventEmitter<void>();
  @Output() exportPdf = new EventEmitter<void>();

  private readonly snackBar = inject(MatSnackBar);
  private readonly statsbombAdapter = inject(StatsbombAdapterService);
  private readonly http = inject(HttpClient);

  loadSample(): void {
    this.loadingChange.emit(true);
    this.http.get<unknown[]>(SAMPLE_FILE).subscribe({
      next: raw => {
        try {
          const matchData = this.statsbombAdapter.convert(raw);
          this.matchDataLoaded.emit(matchData);
          this.showSnackbar('Sample match loaded — Barcelona vs Deportivo Alavés');
        } catch {
          this.showSnackbar('Failed to load sample match');
        } finally {
          this.loadingChange.emit(false);
        }
      },
      error: () => {
        this.showSnackbar('Failed to load sample match');
        this.loadingChange.emit(false);
      },
    });
  }

  importStatsBomb(): void {
    this.openFilePicker(file => {
      this.loadingChange.emit(true);
      // Use setTimeout to let the spinner render before blocking parse
      setTimeout(() => {
        try {
          const raw = JSON.parse(file);
          const matchData = this.statsbombAdapter.convert(raw);
          this.matchDataLoaded.emit(matchData);
          this.showSnackbar('StatsBomb data loaded successfully');
        } catch {
          this.showSnackbar('Failed to load StatsBomb file — please check the format');
        } finally {
          this.loadingChange.emit(false);
        }
      }, 50);
    });
  }

  copyAiPrompt(): void {
    navigator.clipboard.writeText(AI_PROMPT).then(
      () => this.showSnackbar('Prompt copied to clipboard!'),
      () => this.showSnackbar('Failed to copy prompt to clipboard'),
    );
  }

  importJson(): void {
    this.openFilePicker(file => {
      this.loadingChange.emit(true);
      setTimeout(() => {
        try {
          let data: MatchData;
          try {
            data = JSON.parse(file);
          } catch (e) {
            console.error('[Import JSON] File is not valid JSON:', e);
            this.showImportError();
            return;
          }

          const errors = this.validateMatchData(data);
          if (errors.length > 0) {
            errors.forEach(err => console.error(`[Import JSON] ${err}`));
            this.showImportError();
            return;
          }

          this.matchDataLoaded.emit(data);
          this.showSnackbar('Match data loaded successfully');
        } finally {
          this.loadingChange.emit(false);
        }
      }, 50);
    });
  }

  private validateMatchData(data: unknown): string[] {
    const errors: string[] = [];
    if (!data || typeof data !== 'object') {
      errors.push('Root value must be an object.');
      return errors;
    }

    const d = data as Record<string, unknown>;

    if (!d['match'] || typeof d['match'] !== 'object') {
      errors.push('Missing or invalid "match" object.');
    } else {
      const m = d['match'] as Record<string, unknown>;
      if (typeof m['home'] !== 'string') errors.push('match.home must be a string.');
      if (typeof m['away'] !== 'string') errors.push('match.away must be a string.');
    }

    if (!d['coordinateSystem'] || typeof d['coordinateSystem'] !== 'object') {
      errors.push('Missing or invalid "coordinateSystem" object.');
    } else {
      const cs = d['coordinateSystem'] as Record<string, unknown>;
      if (typeof cs['x'] !== 'number' || cs['x'] <= 0) errors.push('coordinateSystem.x must be a positive number.');
      if (typeof cs['y'] !== 'number' || cs['y'] <= 0) errors.push('coordinateSystem.y must be a positive number.');
    }

    if (!Array.isArray(d['teams'])) {
      errors.push('Missing or invalid "teams" array.');
    } else {
      const teams = d['teams'] as unknown[];
      if (teams.length === 0) errors.push('"teams" array is empty — at least one team is required.');

      teams.forEach((team, ti) => {
        if (!team || typeof team !== 'object') {
          errors.push(`teams[${ti}] is not an object.`);
          return;
        }
        const t = team as Record<string, unknown>;
        if (typeof t['name'] !== 'string') errors.push(`teams[${ti}].name must be a string.`);
        if (!Array.isArray(t['players'])) {
          errors.push(`teams[${ti}].players must be an array.`);
        } else {
          (t['players'] as unknown[]).forEach((player, pi) => {
            if (!player || typeof player !== 'object') {
              errors.push(`teams[${ti}].players[${pi}] is not an object.`);
              return;
            }
            const p = player as Record<string, unknown>;
            if (typeof p['id'] !== 'string') errors.push(`teams[${ti}].players[${pi}].id must be a string.`);
            if (typeof p['name'] !== 'string') errors.push(`teams[${ti}].players[${pi}].name must be a string.`);
          });
        }
        if (!Array.isArray(t['events'])) {
          errors.push(`teams[${ti}].events must be an array.`);
        } else {
          (t['events'] as unknown[]).forEach((event, ei) => {
            if (!event || typeof event !== 'object') {
              errors.push(`teams[${ti}].events[${ei}] is not an object.`);
              return;
            }
            const e = event as Record<string, unknown>;
            if (typeof e['fromId'] !== 'string') errors.push(`teams[${ti}].events[${ei}].fromId must be a string.`);
            if (typeof e['toId'] !== 'string') errors.push(`teams[${ti}].events[${ei}].toId must be a string.`);
          });
        }
      });
    }

    return errors;
  }

  private showImportError(): void {
    this.snackBar.open(
      'Import failed — open browser DevTools console (F12) for details',
      'OK',
      {
        duration: 8000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        panelClass: 'dark-snackbar-error',
      },
    );
  }

  private openFilePicker(onLoad: (content: string) => void): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => onLoad(reader.result as string);
      reader.readAsText(file);
    });
    input.click();
  }

  private showSnackbar(message: string): void {
    this.snackBar.open(message, 'OK', {
      duration: SNACKBAR_DURATION,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: 'dark-snackbar',
    });
  }
}
