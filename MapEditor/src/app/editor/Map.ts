import { Serializable, SerializedType } from "app/Serializable";
import { action, computed, makeAutoObservable, observable } from "mobx";
import { Editor } from "./Editor";
import { MapRenderer } from "./MapRenderer";
import { Platform } from "./Platform";
import { UnityProject } from "./UnityProject";
import { Vector2 } from "./Vector2";
import fs from "fs";
import { Texture } from "./Texture";
import { Layer } from "./Layer";

export class Map implements Serializable<SerializedMapData>
{
	private _name: string;
	private _offset: Vector2 = Vector2.zero;
	public get name() { return this._name; }

	private _path: string;
	public get path() { return this._path; }

	private _isDirty: boolean = false;
	public get isDirty() { return this._isDirty; }

	public readonly renderer: MapRenderer;
	public readonly project: UnityProject;

	public get offset() { return this._offset; }

	public set offset(offset: Vector2)
	{
		if (!Vector2.equals(this._offset, offset))
		{
			this._isDirty = true;
			this._offset = offset;
		}
	}

	@observable
	private _layers: Layer[] = [new Layer(this)];

	@observable
	private _activeLayerIndex: number = 0;

	@observable
	private _backgroundLayerOffsetSensitivity: number = 100; // percentage

	@observable
	private _size: Vector2 = new Vector2(640, 480);

	@computed
	public get size() { return this._size; }

	@action
	public setSize(size: Vector2) { this._size = size; }

	@observable
	private _isOpen: boolean = false;

	@computed
	public get isOpen() { return this._isOpen; }

	@computed
	public get layers() { return [...this._layers]; }

	@computed
	public get LayerSensitivity() { return this._backgroundLayerOffsetSensitivity; }

	@computed
	public get activeLayer() { return this._layers[this._activeLayerIndex]; }

	public constructor(project: UnityProject, name: string, path: string);
	public constructor(project: UnityProject, name: string, path: string, width: number, height: number);
	public constructor(project: UnityProject, name: string, path: string, width?: number, height?: number)
	{
		this.project = project;
		this._name = name;
		this._path = path;
		this.renderer = new MapRenderer(this);
		if (width && height)
			this._size = new Vector2(width, height);
		makeAutoObservable(this);
	}

	public parse(data: SerializedType<SerializedMapData>)
	{
		const size = new Vector2(data.size.x, data.size.y);
		this.setSize(size);
		return { name: data.name, size };
	}

	public serialize(): SerializedType<SerializedMapData>
	{
		return { name: this.name, size: this.size.serialize() };
	}

	@action
	public readonly open = () => 
	{
		if (!this._isOpen)
		{
			this._isOpen = true;
			Editor.get().addToOpenMaps(this);
		}
	}

	public edit({ name, width, height }: { name: string, width: string, height: string })
	{
		this._size.setX(+width);
		this._size.setY(+height);

		if (name && (name !== this._name))
		{
			this._name = name;
			const p = this.project.renameMapFile(this, name);
			this._path = p;
		}

		this.sync();
	}

	public sync()
	{
		fs.writeFileSync(this._path, JSON.stringify(this.serialize()), "utf-8");
	}

	@action
	public removeLayer(index: number)
	{
		if (this._layers.length > 1)
		{
			const l = [...this._layers];
			l.splice(index, 1);
			this._layers = l;

			if (this._activeLayerIndex > this._layers.length - 1)
				this._activeLayerIndex = this._layers.length - 1;
		}
	}

	@action
	public addLayer() { this._layers = [...this._layers, new Layer(this)]; this._activeLayerIndex = this._layers.length - 1; }
}

type SerializedMapData = {
	name: string;
	size: Vector2;
};
