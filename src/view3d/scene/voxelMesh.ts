import {
  BoxGeometry,
  Color,
  InstancedMesh,
  Matrix4,
  MeshStandardMaterial,
  SRGBColorSpace,
} from 'three';
import type { Field } from '@/core/grayScott3d';
import { type Palette, paletteTable, TABLE_SIZE, tableIndex } from '@/shared/palette';
import type { Display } from '../types';

/**
 * Size of one cube. Slightly smaller than a cell, so you can see the cells that make up the shape.
 * At 1 the cubes would merge into one smooth surface
 */
const CELL_SIZE = 0.9;

/**
 * Draws the cells that have enough v, as cubes in one InstancedMesh.
 * Only those cells are written, packed from the start. mesh.count sets how many to draw.
 */
export type VoxelMesh = {
  mesh: InstancedMesh;
  /** Writes the cubes again. Call it after the field or the display changes */
  update: (field: Field, display: Display) => void;
  dispose: () => void;
};

/**
 * The palette's colors in linear space, the space instance colors are read in.
 *
 * @param palette Which colors
 * @returns r, g, b (0–1) for each table entry, side by side
 */
function linearTable(palette: Palette): Float32Array {
  const srgb = paletteTable(palette);
  const linear = new Float32Array(TABLE_SIZE * 3);
  const color = new Color();
  for (let i = 0; i < TABLE_SIZE; i++) {
    color.setRGB(srgb[i * 3] / 255, srgb[i * 3 + 1] / 255, srgb[i * 3 + 2] / 255, SRGBColorSpace);
    linear.set([color.r, color.g, color.b], i * 3);
  }
  return linear;
}

/**
 * Makes an InstancedMesh with room for every cell.
 *
 * @param size Cells on each side of the grid
 */
export function createVoxelMesh(size: number): VoxelMesh {
  const count = size ** 3;
  const geometry = new BoxGeometry(CELL_SIZE, CELL_SIZE, CELL_SIZE);
  const material = new MeshStandardMaterial({ roughness: 0.45, metalness: 0.05 });
  const mesh = new InstancedMesh(geometry, material, count);
  // The number of cubes changes every frame. Turn off frustumCulled so the camera check never hides the whole mesh
  mesh.frustumCulled = false;
  // The first setColorAt creates instanceColor. Call it before drawing, or the shader is built without colors
  mesh.setColorAt(0, new Color());
  // Every cube has the same size and no rotation, so start them all as the identity matrix
  // and later write only the position (elements 12–14) for each cube
  const identity = new Matrix4();
  for (let i = 0; i < count; i++) {
    mesh.setMatrixAt(i, identity);
  }
  mesh.count = 0;
  const matrices = mesh.instanceMatrix.array as Float32Array;
  const colors = mesh.instanceColor!.array as Float32Array;
  // Shift that puts the grid's center at (0, 0, 0)
  const half = size / 2 - 0.5;

  let table: { palette: string; colors: Float32Array } = {
    palette: '',
    colors: new Float32Array(),
  };

  return {
    mesh,
    update: (field, display) => {
      if (table.palette !== display.palette) {
        table = { palette: display.palette, colors: linearTable(display.palette) };
      }
      // With the cut on, only the half with x below the center is drawn, so the cut face looks toward +x
      const lastX = display.cut ? Math.floor(size / 2) : size;
      let drawn = 0;
      for (let z = 0; z < size; z++) {
        for (let y = 0; y < size; y++) {
          for (let x = 0; x < lastX; x++) {
            const v = field.v[(z * size + y) * size + x];
            if (v < display.threshold) {
              continue;
            }
            matrices[drawn * 16 + 12] = x - half;
            matrices[drawn * 16 + 13] = y - half;
            matrices[drawn * 16 + 14] = z - half;
            const c = tableIndex(v) * 3;
            colors[drawn * 3] = table.colors[c];
            colors[drawn * 3 + 1] = table.colors[c + 1];
            colors[drawn * 3 + 2] = table.colors[c + 2];
            drawn++;
          }
        }
      }
      mesh.count = drawn;
      mesh.instanceMatrix.needsUpdate = true;
      mesh.instanceColor!.needsUpdate = true;
    },
    dispose: () => {
      geometry.dispose();
      material.dispose();
      mesh.dispose();
    },
  };
}
