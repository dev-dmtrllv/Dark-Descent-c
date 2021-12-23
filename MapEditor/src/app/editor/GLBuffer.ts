import { Editor } from "./Editor";
import { Vector2 } from "./Vector2";

export class GLBuffer
{
	public use(gl: WebGLRenderingContext)
	{
		gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
	}

	private static _defaultBuffer: GLBuffer | null = null;

	public static get defaultBuffer(): GLBuffer
	{
		if (!this._defaultBuffer)
		{
			this._defaultBuffer = new GLBuffer(Editor.get().canvasRenderer.gl, [
				new Vector2(-1.0, 1.0),
				new Vector2(1.0, 1.0),
				new Vector2(-1.0, -1.0),
				new Vector2(1.0, -1.0),
			]);
		}
		return this._defaultBuffer as GLBuffer;
	}

	public readonly buffer: WebGLBuffer;

	public constructor(gl: WebGLRenderingContext, positions: Vector2[])
	{
		const b = gl.createBuffer()!;
		gl.bindBuffer(gl.ARRAY_BUFFER, b);

		const p = positions.map(p => [p.x, p.y]).flat();
		console.log(p);

		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(p), gl.STATIC_DRAW);

		this.buffer = b;
	}
}
