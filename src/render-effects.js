import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {SSAOPass} from 'three/addons/postprocessing/SSAOPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';

// Contact occlusion is computed at a bounded resolution. Moving cameras and the
// light profile use the direct renderer; a stationary view receives the finish.
export function createRenderEffects(renderer,scene,camera){
 const composer=new EffectComposer(renderer),beauty=new RenderPass(scene,camera),ao=new SSAOPass(scene,camera,320,240,12),output=new OutputPass();
 ao.kernelRadius=.65;ao.minDistance=.00008;ao.maxDistance=.008;
 ao.copyMaterial.fragmentShader=ao.copyMaterial.fragmentShader.replace('gl_FragColor = opacity * texel;','gl_FragColor = vec4(mix(vec3(1.0), texel.rgb, opacity), texel.a);');ao.copyMaterial.uniforms.opacity.value=.72;
 ao.normalMaterial.onBeforeRender=(_renderer,_scene,_camera,_geometry,object)=>{ao.normalMaterial.clippingPlanes=object.material?.clippingPlanes||null;};
 const originalOverride=ao._overrideVisibility.bind(ao);
 ao._overrideVisibility=()=>{originalOverride();scene.traverse(object=>{if(object.visible&&(object.isSprite||(object.isMesh&&(object.material?.transparent||object.name==='contact-shadow')))){object.visible=false;ao._visibilityCache.push(object);}});};
 composer.addPass(beauty);composer.addPass(ao);composer.addPass(output);
 let width=0,height=0,ratio=0;
 function size(w,h){const nextRatio=renderer.getPixelRatio();if(width===w&&height===h&&ratio===nextRatio)return;width=w;height=h;ratio=nextRatio;composer.setPixelRatio(ratio);composer.setSize(w,h);const scale=Math.min(.65,640/(w*ratio));ao.setSize(Math.max(1,Math.round(w*ratio*scale)),Math.max(1,Math.round(h*ratio*scale)));}
 return {size,render(nextCamera){beauty.camera=ao.camera=nextCamera;ao.ssaoMaterial.defines.PERSPECTIVE_CAMERA=nextCamera.isPerspectiveCamera?1:0;ao.ssaoMaterial.uniforms.cameraNear.value=nextCamera.near;ao.ssaoMaterial.uniforms.cameraFar.value=nextCamera.far;ao.ssaoMaterial.uniforms.cameraProjectionMatrix.value.copy(nextCamera.projectionMatrix);ao.ssaoMaterial.uniforms.cameraInverseProjectionMatrix.value.copy(nextCamera.projectionMatrixInverse);composer.render();},dispose(){composer.dispose();ao.dispose();output.dispose();}};
}
