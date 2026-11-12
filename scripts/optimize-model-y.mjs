// Optional developer tool; these packages are not app/runtime dependencies.
// See docs/model-y-asset.md for source, license, tooling and reproduction.
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
const source=process.argv[2],target=process.argv[3];
if(!source||!target)throw new Error('Usage: node scripts/optimize-model-y.mjs source.glb target.glb');
const toolsRoot=resolve(process.env.MODEL_Y_TOOLS||'/tmp/model-y-tools');
const dependency=path=>import(pathToFileURL(join(toolsRoot,'node_modules',path)).href);
const [{NodeIO},{ALL_EXTENSIONS},{dedup,flatten,join:joinMeshes,weld,simplifyPrimitive,prune,meshopt,getBounds},{MeshoptEncoder,MeshoptSimplifier}]=await Promise.all([
 dependency('@gltf-transform/core/dist/index.js'),dependency('@gltf-transform/extensions/dist/index.js'),dependency('@gltf-transform/functions/dist/index.js'),dependency('meshoptimizer/index.js'),
]);
await Promise.all([MeshoptEncoder.ready,MeshoptSimplifier.ready]);
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder});
const doc=await io.read(source);
// The parked car is viewed through opaque tinted glazing. Interior pieces are
// omitted from this presentation model; the licensed exterior stays intact.
for(const node of doc.getRoot().listNodes())if(node.getExtras().category==='cabin')node.dispose();
// Preserve useful material classes while removing exploration-specific part IDs.
for(const node of doc.getRoot().listNodes())node.setName('').setExtras({});
await doc.transform(dedup(),flatten(),joinMeshes({keepNamed:false}),weld());
for(const mesh of doc.getRoot().listMeshes())for(const prim of mesh.listPrimitives()){const name=prim.getMaterial()?.getName();// Preserve the original body/glass surfaces; decimating thin panels can cause
// visible seams even if the overall silhouette survives.
if(!['body','glass_body'].includes(name))simplifyPrimitive(prim,{simplifier:MeshoptSimplifier,ratio:.12,error:.001});}
await doc.transform(prune(),meshopt({encoder:MeshoptEncoder,level:'high'}));
await io.write(target,doc);
let tris=0;for(const m of doc.getRoot().listMeshes())for(const p of m.listPrimitives())tris+=(p.getIndices()?.getCount()??p.getAttribute('POSITION').getCount())/3;
console.log(JSON.stringify({triangles:tris,meshes:doc.getRoot().listMeshes().length,bounds:getBounds(doc.getRoot().listScenes()[0])}));
