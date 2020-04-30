import * as PIXI from "pixi.js"

import { Container3D } from "../container"
import { Matrix4 } from "../math/matrix4"
import { Vector4 } from "../math/vector4"
import { MatrixComponent } from "../matrix/matrix-component"

const mat4 = Matrix4.create()
const vec4 = Vector4.create()

/**
 * Camera is a device from which the world is viewed.
 */
export class Camera3D extends Container3D {
  private _id = 0

  /** Current version id. */
  get id() {
    return (<any>this.transform)._worldID + this._id
  }

  private _projection?: MatrixComponent
  private _view?: MatrixComponent
  private _viewProjection?: MatrixComponent

  /** Main camera which is used by default. */
  static main: Camera3D

  /**
   * Creates a new camera.
   * @param renderer Renderer to use.
   */
  constructor(public renderer: PIXI.Renderer) {
    super()

    this.renderer.on("prerender", () => {
      if (!this._aspect) {
        // When there is no specific aspect set, this is used for the 
        // projection matrix to always update each frame (in case when the 
        // renderer aspect ratio has changed).
        this._id++
      }
      if (!this.parent) {
        this.transform.updateTransform()
      }
    })
    if (!Camera3D.main) {
      Camera3D.main = this
    }
    this.transform.position.z = 5
    this.transform.rotationQuaternion.setEulerAngles(0, 180, 0)
  }

  /**
   * Converts screen coordinates to world coordinates.
   * @param x Screen x coordinate.
   * @param y Screen y coordinate.
   * @param distance Distance from the camera.
   */
  screenToWorld(x: number, y: number, distance: number) {
    let far = this.far

    // Before doing the calculations, the far clip plane is changed to the same 
    // value as distance from the camera. By doing this we can just set z value 
    // for the clip space to 1 and the desired z position will be correct.
    this.far = distance

    let invertedViewProjection = Matrix4.invert(this.viewProjection, mat4)
    let clipSpace = Vector4.set(
      (x / this.renderer.width) * 2 - 1, ((y / this.renderer.height) * 2 - 1) * -1, 1, 1, vec4
    )

    // Reset to the previous value
    this.far = far

    let worldSpace = Vector4.transformMat4(clipSpace, invertedViewProjection, vec4)
    worldSpace[3] = 1.0 / worldSpace[3]
    for (let i = 0; i < 3; i++) {
      worldSpace[i] *= worldSpace[3]
    }
    return {
      x: worldSpace[0], y: worldSpace[1], z: worldSpace[2]
    };
  }

  /**
   * Converts world coordinates to screen coordinates.
   * @param x World x coordinate.
   * @param y World y coordinate.
   * @param z World z coordinate.
   */
  worldToScreen(x: number, y: number, z: number) {
    let worldSpace = Vector4.set(x, y, z, 1, vec4)
    let clipSpace = Vector4.transformMat4(
      Vector4.transformMat4(worldSpace, this.view, vec4), this.projection, vec4
    )
    if (clipSpace[3] !== 0) {
      for (let i = 0; i < 3; i++) {
        clipSpace[i] /= clipSpace[3]
      }
    }
    return {
      x: (clipSpace[0] + 1) / 2 * this.renderer.width,
      y: this.renderer.height - (clipSpace[1] + 1) / 2 * this.renderer.height
    }
  }

  private _fieldOfView = 60
  private _near = 0.1
  private _far = 1000
  private _aspect?: number

  /** Aspect ratio (width divided by height). */
  get aspect() {
    return this._aspect
  }

  set aspect(value: number | undefined) {
    if (this._aspect !== value) {
      this._aspect = value; this._id++
    }
  }

  /** Vertical field of view in degrees. */
  get fieldOfView() {
    return this._fieldOfView
  }

  set fieldOfView(value: number) {
    if (this._fieldOfView !== value) {
      this._fieldOfView = value; this._id++
    }
  }

  /** Near clipping plane distance. */
  get near() {
    return this._near
  }

  set near(value: number) {
    if (this._near !== value) {
      this._near = value; this._id++
    }
  }

  /** Far clipping plane distance. */
  get far() {
    return this._far
  }

  set far(value: number) {
    if (this._far !== value) {
      this._far = value; this._id++
    }
  }

  /** Projection matrix */
  get projection() {
    if (!this._projection) {
      this._projection = new MatrixComponent(this, 16, data => {
        let aspect = this._aspect || this.renderer.width / this.renderer.height
        let fovy = this._fieldOfView * (Math.PI / 180)
        Matrix4.perspective(fovy, aspect, this._near, this._far, data)
      })
    }
    return this._projection.array
  }

  /** View matrix */
  get view() {
    if (!this._view) {
      this._view = new MatrixComponent(this, 16, data => {
        Matrix4.lookAt(this.transform.worldTransform.position, this.transform.worldTransform.direction, this.transform.worldTransform.up, data)
      })
    }
    return this._view.array
  }

  /** View projection matrix */
  get viewProjection() {
    if (!this._viewProjection) {
      this._viewProjection = new MatrixComponent(this, 16, data => {
        Matrix4.multiply(this.projection, this.view, data)
      })
    }
    return this._viewProjection.array
  }

  /** View position (position of the camera as an array). */
  get viewPosition() {
    return this.transform.worldTransform.position
  }
}

PIXI.Renderer.registerPlugin("camera", <any>Camera3D)