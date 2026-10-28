import {
  DataTexture,
  LinearFilter,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  RGBAFormat,
  SRGBColorSpace,
} from 'three';
import type { Field } from '@/core/grayScott2d';
import { type Palette, paletteTable, tableIndex } from '@/shared/palette';

/**
 * The field drawn as one picture: 1 cell = 1 pixel of a texture, on a board of width × height.
 */
export type FieldImage = {
  mesh: Mesh;
  /** Paints the amount of v into the texture. Call it after the field changes */
  update: (field: Field, palette: Palette) => void;
  dispose: () => void;
};

/**
 * Makes the board and its texture.
 *
 * @param width  Cells across
 * @param height Cells up
 */
export function createFieldImage(width: number, height: number): FieldImage {
  const pixels = new Uint8Array(width * height * 4).fill(255);
  // Row 0 of a DataTexture is at the bottom of the board, the same as row 0 of the field
  const texture = new DataTexture(pixels, width, height, RGBAFormat);
  texture.colorSpace = SRGBColorSpace;
  // Smooth between cells. The grid is small, and square pixels would hide the round shapes of the pattern
  texture.magFilter = LinearFilter;
  texture.minFilter = LinearFilter;
  const geometry = new PlaneGeometry(width, height);
  const material = new MeshBasicMaterial({ map: texture });
  const mesh = new Mesh(geometry, material);

  let table: { palette: string; colors: Uint8Array } = { palette: '', colors: new Uint8Array() };

  return {
    mesh,
    update: (field, palette) => {
      if (table.palette !== palette) {
        table = { palette, colors: paletteTable(palette) };
      }
      const colors = table.colors;
      for (let i = 0; i < field.v.length; i++) {
        const c = tableIndex(field.v[i]) * 3;
        pixels[i * 4] = colors[c];
        pixels[i * 4 + 1] = colors[c + 1];
        pixels[i * 4 + 2] = colors[c + 2];
      }
      texture.needsUpdate = true;
    },
    dispose: () => {
      texture.dispose();
      geometry.dispose();
      material.dispose();
    },
  };
}
