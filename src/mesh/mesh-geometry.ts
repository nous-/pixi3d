import * as PIXI from "pixi.js"
import { MeshShader } from "./mesh-shader"

export interface MeshGeometryAttribute {
  buffer: ArrayBuffer
  stride: number | undefined
}

export class MeshGeometry extends PIXI.Geometry {
  private _shaders: string[] = []

  indices?: MeshGeometryAttribute
  positions?: MeshGeometryAttribute
  uvs?: MeshGeometryAttribute[]
  normals?: MeshGeometryAttribute
  tangents?: MeshGeometryAttribute
  weights?: number[]
  morphTargets?: {
    positions?: MeshGeometryAttribute
    normals?: MeshGeometryAttribute
    tangents?: MeshGeometryAttribute
  }[]

  addAttribute(id: string, buffer?: PIXI.Buffer | number[], size?: number, normalized?: boolean, type?: number, stride?: number, start?: number): MeshGeometry {
    if (this.getAttribute(id)) {
      return this
    }
    return <MeshGeometry>super.addAttribute(
      id, buffer, size, normalized, type, stride, start)
  }

  addIndex(buffer?: PIXI.Buffer | number[]) {
    if (this.getIndex()) {
      return this
    }
    return <MeshGeometry>super.addIndex(buffer)
  }

  addShaderAttributes(shader: MeshShader) {
    shader.addShaderAttributes(this)
    this._shaders.push(shader.name)
  }

  hasShaderAttributes(material: MeshShader) {
    return this._shaders.indexOf(material.name) >= 0
  }
}