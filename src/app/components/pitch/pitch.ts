import { Component, input } from '@angular/core';

@Component({
  selector: 'app-pitch',
  templateUrl: './pitch.html',
  styleUrl: './pitch.scss',
})
export class PitchComponent {
  readonly width = input.required<number>();
  readonly height = input.required<number>();

  // Corner arc SVG paths (in pitch meter coords, viewBox handles scaling)
  readonly cornerArcs = [
    'M 1,0 A 1,1 0 0 0 0,1',         // top-left
    'M 104,0 A 1,1 0 0 1 105,1',      // top-right
    'M 0,67 A 1,1 0 0 0 1,68',        // bottom-left
    'M 105,67 A 1,1 0 0 1 104,68',    // bottom-right
  ];
}
