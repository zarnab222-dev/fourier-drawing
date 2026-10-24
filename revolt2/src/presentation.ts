import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export function createPresentation(renderer:THREE.WebGLRenderer,scene:THREE.Scene,camera:THREE.PerspectiveCamera) {
  const room=new RoomEnvironment();
  const pmrem=new THREE.PMREMGenerator(renderer);
  const environment=pmrem.fromScene(room,.04);
  scene.environment=environment.texture;
  scene.environmentIntensity=.45;
  room.dispose();pmrem.dispose();
  const composer=new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene,camera));
  const bloom=new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),.12,.45,1.55);
  composer.addPass(bloom);
  const grade=new ShaderPass({uniforms:{tDiffuse:{value:null}},vertexShader:`varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`uniform sampler2D tDiffuse; varying vec2 vUv; void main(){vec3 c=texture2D(tDiffuse,vUv).rgb;vec2 q=vUv-.5;float vignette=1.-.48*dot(q,q); c*=vignette;gl_FragColor=vec4(c,1.);}`});
  composer.addPass(grade);composer.addPass(new OutputPass());
  // Instanced tread marks have a fixed memory cost, regardless of race duration.
  const marks=new THREE.InstancedMesh(new THREE.PlaneGeometry(.19,.42),new THREE.MeshBasicMaterial({color:0x090d10,transparent:true,opacity:.32,depthWrite:false}),360);
  marks.frustumCulled=false;marks.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const transform=new THREE.Object3D();transform.scale.setScalar(0);transform.updateMatrix();for(let i=0;i<360;i++)marks.setMatrixAt(i,transform.matrix);scene.add(marks);
  let next=0,last=new THREE.Vector3(1000,0,0);
  const motesGeometry=new THREE.BufferGeometry(),points=new Float32Array(180*3);
  for(let i=0;i<180;i++){points[i*3]=Math.sin(i*127.1)*35;points[i*3+1]=.8+(Math.sin(i*13.7)*.5+.5)*13;points[i*3+2]=Math.cos(i*91.7)*27;}
  motesGeometry.setAttribute('position',new THREE.BufferAttribute(points,3));
  const motes=new THREE.Points(motesGeometry,new THREE.PointsMaterial({color:0xffd8a1,size:.025,transparent:true,opacity:.34,depthWrite:false}));scene.add(motes);
  return {resize(){composer.setSize(innerWidth,innerHeight);},render(){composer.render();},update(car:THREE.Group,drifting:boolean,speed:number,time:number){
    motes.position.y=Math.sin(time*.13)*.2;
    if(drifting&&speed>5&&last.distanceToSquared(car.position)>.09){last.copy(car.position);for(const side of [-.68,.68]){transform.position.set(side,.057,-.6).applyAxisAngle(THREE.Object3D.DEFAULT_UP,car.rotation.y).add(car.position);transform.position.y=.058;transform.rotation.set(-Math.PI/2,0,-car.rotation.y);transform.scale.setScalar(1);transform.updateMatrix();marks.setMatrixAt(next++%360,transform.matrix);}marks.instanceMatrix.needsUpdate=true;}
  }};
}

