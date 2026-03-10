import { World } from '../ecs/World'
import { editorStore } from './EditorStore'
import { COMPONENT_REGISTRY } from './componentRegistry'

export interface SerializedComponent {
  type: string
  props: Record<string, unknown>
}

export interface SerializedEntity {
  name: string
  components: SerializedComponent[]
}

export interface SerializedScene {
  version: 1
  entities: SerializedEntity[]
}

export function serializeWorld(world: World): SerializedScene {
  return {
    version: 1,
    entities: world.getEntityIds().map(id => ({
      name: world.getEntityName(id),
      components: world.getComponents(id).map(comp => ({
        type: comp.constructor.name,
        props: Object.fromEntries(
          comp.getProps().map(([key, prop]) => [key, prop.serialize()])
        ),
      })),
    })),
  }
}

export function loadScene(scene: SerializedScene, world: World): void {
  world.clear()
  editorStore.select(null)

  for (const entityData of scene.entities) {
    const id = world.createEntity(entityData.name)
    for (const compData of entityData.components) {
      const factory = COMPONENT_REGISTRY[compData.type]
      if (!factory) {
        console.warn(`Unknown component type: "${compData.type}" — skipping`)
        continue
      }
      const comp = factory()
      for (const [key, prop] of comp.getProps()) {
        if (key in compData.props) {
          prop.deserialize(compData.props[key] as never)
          comp.onPropChanged?.(prop)
        }
      }
      world.addComponent(id, comp)
    }
  }
}

const STORAGE_KEY = 'ces-designer-scene'

export function saveToLocalStorage(world: World): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeWorld(world)))
}

export function loadFromLocalStorage(world: World): boolean {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return false
  try {
    const scene = JSON.parse(raw) as SerializedScene
    loadScene(scene, world)
    return true
  } catch (e) {
    console.error('Failed to load saved scene:', e)
    return false
  }
}
