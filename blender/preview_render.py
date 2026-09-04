"""
Loads one exported bottle .glb into a proper studio setup — infinity-cove
backdrop, three-point softbox lighting, glare/bloom compositing — and
renders a PNG. This is a QA tool: if it doesn't look like a real product
shot, the model/materials need work before touching the Three.js viewer.

Usage: blender --background --python blender/preview_render.py -- <slug>
"""
import bpy
import sys
import os
import math

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else ["noir"]
slug = argv[0]
glb_path = os.path.join(ROOT, "assets", "models", f"bottle-{slug}.glb")
out_path = os.path.join(ROOT, "blender", f"preview-{slug}.png")

# Direct bpy.data manipulation, not select_all()+delete() — that operator
# pair is unreliable under --background (no window/selection context) and
# can silently leave the default startup Camera/Cube/Light in the scene
# alongside whatever we import next, which is exactly what was blowing out
# every render (two cameras, extra default light).
for obj in list(bpy.data.objects):
    bpy.data.objects.remove(obj, do_unlink=True)
for block in list(bpy.data.cameras):
    bpy.data.cameras.remove(block)
for block in list(bpy.data.lights):
    bpy.data.lights.remove(block)
for block in list(bpy.data.meshes):
    bpy.data.meshes.remove(block)

bpy.ops.import_scene.gltf(filepath=glb_path)
# Find the tallest imported mesh extent to frame the camera automatically.
imported = [o for o in bpy.context.selected_objects if o.type == 'MESH']
max_z = max((o.dimensions.z + o.location.z for o in imported), default=1.2)
bottle_top = 0
for o in imported:
    top = o.matrix_world.translation.z + o.dimensions.z
    bottle_top = max(bottle_top, top)

# ---------------- Backdrop: large flat floor + wall, guaranteed full frame
# coverage (no bend-modifier math that can leave gaps at frame edges). ----------------
backdrop_mat = bpy.data.materials.new("Backdrop")
backdrop_mat.use_nodes = True
bsdf = backdrop_mat.node_tree.nodes.get("Principled BSDF")
bsdf.inputs['Base Color'].default_value = (0.02, 0.02, 0.024, 1.0)
bsdf.inputs['Roughness'].default_value = 0.4

bpy.ops.mesh.primitive_plane_add(size=30, location=(0, 0, 0))
floor = bpy.context.object
floor.name = "Floor"
floor.data.materials.append(backdrop_mat)

bpy.ops.mesh.primitive_plane_add(size=30, location=(0, 4, 15), rotation=(math.radians(90), 0, 0))
wall = bpy.context.object
wall.name = "Wall"
wall.data.materials.append(backdrop_mat)

# ---------------- Softbox lighting (emissive planes, visible in reflections) ----------------
def add_softbox(name, location, rotation, size, energy, color=(1, 1, 1)):
    bpy.ops.mesh.primitive_plane_add(size=size, location=location, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    mat = bpy.data.materials.new(name + "Mat")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    for n in list(nodes):
        nodes.remove(n)
    emission = nodes.new("ShaderNodeEmission")
    emission.inputs['Color'].default_value = (*color, 1.0)
    emission.inputs['Strength'].default_value = energy
    output = nodes.new("ShaderNodeOutputMaterial")
    mat.node_tree.links.new(emission.outputs['Emission'], output.inputs['Surface'])
    obj.data.materials.append(mat)
    # Light the scene and show up in glass/metal reflections, but stay
    # invisible to direct camera rays — a softbox panel sitting right in
    # frame just blows out as a flat white rectangle instead of reading as
    # illumination.
    obj.visible_camera = False
    obj.visible_diffuse = True
    obj.visible_glossy = True
    obj.visible_transmission = True
    return obj

add_softbox("KeyLight", (1.6, -1.8, 2.0), (math.radians(55), 0, math.radians(42)), 1.8, 35)
add_softbox("FillLight", (-1.8, -1.2, 1.0), (math.radians(70), 0, math.radians(-55)), 1.6, 10, color=(0.95, 0.85, 0.7))
add_softbox("RimLight", (0, 1.6, 1.6), (math.radians(-60), 0, 0), 1.4, 22)
add_softbox("TopLight", (0, -0.3, 3.2), (math.radians(90), 0, 0), 2.2, 14)

world = bpy.data.worlds.new("World")
bpy.context.scene.world = world
world.use_nodes = True
world.node_tree.nodes["Background"].inputs[0].default_value = (0.015, 0.015, 0.018, 1)
world.node_tree.nodes["Background"].inputs[1].default_value = 0.4

# ---------------- Camera, framed to the bottle's full height ----------------
cam_target_z = bottle_top * 0.52
bpy.ops.object.camera_add(location=(0, -3.0, cam_target_z), rotation=(math.radians(90), 0, 0))
cam = bpy.context.object
cam.data.lens = 85
bpy.context.scene.camera = cam
# Aim precisely at the bottle centre with a Track-To constraint rather than
# hand-tuned rotation, so framing stays correct across differently-sized bottles.
bpy.ops.object.empty_add(location=(0, 0, cam_target_z))
target = bpy.context.object
track = cam.constraints.new('TRACK_TO')
track.target = target
track.track_axis = 'TRACK_NEGATIVE_Z'
track.up_axis = 'UP_Y'

# ---------------- Render settings ----------------
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.samples = 200
scene.cycles.use_denoising = True
scene.render.resolution_x = 900
scene.render.resolution_y = 1125
scene.view_settings.view_transform = 'AgX'
scene.view_settings.look = 'AgX - Medium High Contrast'

scene.render.filepath = out_path
bpy.ops.render.render(write_still=True)
print("RENDERED:", out_path)
