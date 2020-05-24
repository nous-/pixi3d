import * as PIXI from "pixi.js"

import { Mesh3D } from "./mesh/mesh"
import { MeshShader } from "./mesh/mesh-shader"

/**
 * Factory for creating materials.
 */
export interface MaterialFactory {
  /** Creates a new material from the specified source. */
  create(source: unknown): Material
}

/**
 * Materials are used to render a single mesh.
 */
export abstract class Material {
  protected _shader?: MeshShader

  /** Value indicating if the material is valid to render. */
  get valid() {
    return true
  }

  /** Draw mode used to render a mesh. */
  drawMode = PIXI.DRAW_MODES.TRIANGLES

  /** Value indicating if the material is transparent. */
  transparent = false

  /** Value indicating if the material is double sided. */
  doubleSided = false

  /**
   * Creates a shader used to render a mesh.
   * @param mesh Mesh to use.
   * @param renderer Renderer to use.
   */
  abstract createShader(mesh: Mesh3D, renderer: PIXI.Renderer): MeshShader

  /**
   * Updates the uniforms for the specified shader.
   * @param mesh Mesh to use.
   * @param shader Shader for updating uniforms.
   */
  abstract updateUniforms?(mesh: Mesh3D, shader: MeshShader): void

  /**
   * Renders the specified mesh  with this material.
   * @param mesh Mesh to render.
   * @param renderer Renderer to use.
   * @param state The state to use.
   */
  render(mesh: Mesh3D, renderer: PIXI.Renderer, state?: PIXI.State) {
    if (!this.valid) {
      return
    }
    if (!this._shader) {
      this._shader = this.createShader(mesh, renderer)
    }
    if (this.updateUniforms) {
      this.updateUniforms(mesh, this._shader)
    }
    this._shader.render(mesh, renderer, state, this.drawMode)
  }
}