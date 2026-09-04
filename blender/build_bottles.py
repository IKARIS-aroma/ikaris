"""
Builds one 3D bottle per fragrance in bottle-params.json, using the
faceted, diamond-cut round flacon + studded ball cap (source/untitled.fbx,
textures/*.png) as shared base geometry. Per product: BaseColor/Metallic/
Roughness are all replaced with flat values (the source textures carry a
blotchy patina in all three, confirmed against the asset's own reference
render — not a relinking bug); only the Normal map survives, since the
jewel-cut sparkle comes from that bump against the facet geometry. A baked
IKARIS label plate (assets/labels/<slug>.png) is applied to the body.
Exports assets/models/bottle-<slug>.glb for each.

Run headless: blender --background --python blender/build_bottles.py [-- slug1 slug2 ...]
"""
import bpy
import bmesh
import json
import math
import os
import sys
from mathutils import Vector

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PARAMS_PATH = os.path.join(ROOT, "blender", "bottle-params.json")
OUT_DIR = os.path.join(ROOT, "assets", "models")
SOURCE_FBX = os.path.join(ROOT, "source", "untitled.fbx")
TEX_DIR = os.path.join(ROOT, "textures")
SCALE = 1.0


def hex_to_rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) / 255.0 for i in (0, 2, 4))


def clear_scene():
    for obj in list(bpy.data.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
    for block in list(bpy.data.meshes):
        bpy.data.meshes.remove(block)
    for block in list(bpy.data.materials):
        bpy.data.materials.remove(block)
    for block in list(bpy.data.images):
        bpy.data.images.remove(block)
    for block in list(bpy.data.cameras):
        bpy.data.cameras.remove(block)
    for block in list(bpy.data.lights):
        bpy.data.lights.remove(block)


def world_bounds(obj):
    corners = [obj.matrix_world @ Vector(c) for c in obj.bound_box]
    xs, ys, zs = [c.x for c in corners], [c.y for c in corners], [c.z for c in corners]
    return (min(xs), max(xs)), (min(ys), max(ys)), (min(zs), max(zs))


def relink_textures():
    for img in bpy.data.images:
        local_path = os.path.join(TEX_DIR, img.name)
        if os.path.exists(local_path):
            img.filepath = local_path
            img.reload()
    for mat in bpy.data.materials:
        if not mat.use_nodes:
            continue
        for node in mat.node_tree.nodes:
            if node.type == 'TEX_IMAGE' and node.image:
                if any(k in node.image.name for k in ('Normal', 'Roughness', 'Metallic')):
                    node.image.colorspace_settings.name = 'Non-Color'


def clean_material(mat, color_hex, metallic, roughness):
    """The source textures carry a blotchy/patina artifact visible in
    BaseColor, Roughness AND Metallic alike (confirmed against the asset's
    own turntable reference — not a relinking bug). Disconnect all three and
    replace with flat per-product values; keep ONLY the Normal map, since the
    jewel-cut sparkle comes from that bump against the facet geometry, not
    from any of the patchy maps."""
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    bsdf = nodes.get("Principled BSDF")
    for socket_name, value in (('Base Color', (*hex_to_rgb(color_hex), 1.0)), ('Metallic', metallic), ('Roughness', roughness)):
        for link in list(links):
            if link.to_node == bsdf and link.to_socket.name == socket_name:
                links.remove(link)
        bsdf.inputs[socket_name].default_value = value

    # The Normal map itself also carries the same corrupted/blotchy data
    # (this is what actually produced the white patches even after
    # BaseColor/Metallic/Roughness were flattened) — the diamond-cut facets
    # are real geometry already, so dial the map's contribution right down
    # rather than removing it outright, keeping a touch of extra micro-glint
    # without the artifact.
    normal_map_node = nodes.get("Normal Map")
    if normal_map_node:
        normal_map_node.inputs['Strength'].default_value = 0.15


def make_label_material(image_path):
    # A plain metal plaque, not a transparent decal — the label PNG now
    # carries its own opaque background (see generator/build-labels.js), so
    # this just needs to read as brushed metal behind it.
    mat = bpy.data.materials.new("Label")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    bsdf = nodes.get("Principled BSDF")
    bsdf.inputs['Roughness'].default_value = 0.3
    bsdf.inputs['Metallic'].default_value = 0.6
    tex = nodes.new("ShaderNodeTexImage")
    tex.image = bpy.data.images.load(image_path)
    links.new(tex.outputs['Color'], bsdf.inputs['Base Color'])
    links.new(tex.outputs['Alpha'], bsdf.inputs['Alpha'])
    mat.blend_method = 'BLEND'
    return mat


ELONGATE = (0.88, 0.88, 1.24)  # thinner + taller: the source model reads a
# little short and stout at 1:1 — the same non-uniform factor is applied to
# both body and cap (around their shared origin) so the neck/cap continue
# to line up after the stretch.


def append_base_model():
    bpy.ops.import_scene.fbx(filepath=SOURCE_FBX)
    relink_textures()
    body = bpy.data.objects["Cylinder"]
    cap = bpy.data.objects["Sphere"]

    for obj in (body, cap):
        obj.location = Vector((obj.location.x * ELONGATE[0] * SCALE, obj.location.y * ELONGATE[1] * SCALE, obj.location.z * ELONGATE[2] * SCALE))
        obj.scale = Vector((obj.scale.x * ELONGATE[0] * SCALE, obj.scale.y * ELONGATE[1] * SCALE, obj.scale.z * ELONGATE[2] * SCALE))
    bpy.context.view_layer.update()

    (_, _), (_, _), (bz0, _) = world_bounds(body)
    for obj in (body, cap):
        obj.location.z -= bz0
    bpy.context.view_layer.update()
    return body, cap


def build_bottle(p):
    body, cap = append_base_model()

    body_mat = body.material_slots[0].material
    cap_mat = cap.material_slots[0].material
    # Metallic (not dielectric) so the faceted highlights pick up the base
    # colour's tint rather than reflecting neutral white — at low metallic, a
    # near-black colour still reads as light grey overall because every one
    # of the hundreds of tiny facets throws back an achromatic white
    # highlight under studio lighting, washing out the actual hue.
    clean_material(body_mat, p['glassColor'], metallic=0.75, roughness=0.09)
    cap_roughness = {'gold': 0.18, 'silver': 0.22, 'gunmetal': 0.35}.get(p['capMetal'], 0.2)
    clean_material(cap_mat, p['capColor'], metallic=1.0, roughness=cap_roughness)

    label_mat = make_label_material(os.path.join(ROOT, p['labelPath']))

    # ---- Label: a curved band that wraps the bottle's own curvature,
    # rather than a flat plane sitting in front of it — reads as an applied
    # label following the glass, not a floating card. ----
    (bx0, bx1), (by0, by1), (bz0, bz1) = world_bounds(body)
    body_radius = (bx1 - bx0) / 2
    body_h = bz1 - bz0
    label_h = body_h * 0.32
    label_center_z = bz0 + body_h * 0.46
    arc_degrees = 105
    segments = 28
    wrap_radius = body_radius * 1.015  # a hair proud of the facet peaks

    bm = bmesh.new()
    uv_layer = bm.loops.layers.uv.new()
    half = math.radians(arc_degrees) / 2
    top_row, bottom_row = [], []
    for i in range(segments + 1):
        t = i / segments
        theta = -half + t * (2 * half)
        x = wrap_radius * math.sin(theta)
        y_pos = -wrap_radius * math.cos(theta)
        top_row.append(bm.verts.new((x, y_pos, label_center_z + label_h / 2)))
        bottom_row.append(bm.verts.new((x, y_pos, label_center_z - label_h / 2)))
    bm.verts.ensure_lookup_table()
    for i in range(segments):
        f = bm.faces.new((bottom_row[i], bottom_row[i + 1], top_row[i + 1], top_row[i]))
        u0, u1 = i / segments, (i + 1) / segments
        f.loops[0][uv_layer].uv = (u0, 0)
        f.loops[1][uv_layer].uv = (u1, 0)
        f.loops[2][uv_layer].uv = (u1, 1)
        f.loops[3][uv_layer].uv = (u0, 1)
    bm.normal_update()
    # This is an open strip, not a closed volume, so recalc_face_normals'
    # "outside" heuristic isn't reliable — check each face against the
    # actual outward radial direction and flip explicitly where wrong.
    for i, f in enumerate(bm.faces):
        t_mid = (i + 0.5) / segments
        theta_mid = -half + t_mid * (2 * half)
        outward = (math.sin(theta_mid), -math.cos(theta_mid), 0)
        dot = f.normal.x * outward[0] + f.normal.y * outward[1] + f.normal.z * outward[2]
        if dot < 0:
            f.normal_flip()
    bm.normal_update()
    label_mesh = bpy.data.meshes.new("LabelMesh")
    bm.to_mesh(label_mesh)
    bm.free()
    label_mesh.materials.append(label_mat)
    label_obj = bpy.data.objects.new("Label", label_mesh)
    bpy.context.collection.objects.link(label_obj)

    body.name = "Glass"
    cap.name = "Metal"
    label_obj.name = "Label"

    out_path = os.path.join(OUT_DIR, f"bottle-{p['slug']}.glb")
    bpy.ops.export_scene.gltf(filepath=out_path, export_format='GLB', export_materials='EXPORT', export_apply=True)
    print("EXPORTED:", out_path)


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    with open(PARAMS_PATH, 'r', encoding='utf-8') as f:
        products = json.load(f)
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    only = set(argv) if argv else None
    for p in products:
        if only and p['slug'] not in only:
            continue
        clear_scene()
        build_bottle(p)


main()
