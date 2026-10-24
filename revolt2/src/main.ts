import * as THREE from 'three';
import { createWorld, trackPoint, TRACK_WIDTH } from './world';
import './style.css';
import { createCar } from './car';
import { createPresentation } from './presentation';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const canvas = $<HTMLCanvasElement>('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
const scene = new THREE.Scene();
createWorld(scene);
const camera = new THREE.PerspectiveCamera(48, innerWidth / innerHeight, .1, 260);
const presentation = createPresentation(renderer,scene,camera);
let overview = false;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const samples = Array.from({length: 600}, (_, i) => trackPoint(i / 600));
const circuitLength = samples.reduce((sum,p,i) => sum + p.distanceTo(samples[(i+1)%600]), 0);
type Mode = 'intro' | 'countdown' | 'race' | 'paused' | 'finish';
let mode: Mode = 'intro', previousMode: Mode = 'race';
let player = createCar(0xd8fa48); scene.add(player);
const rivals = [0xf17e54, 0x7eb8cd, 0xb89edf].map((color,i) => {
 const car = createCar(color); scene.add(car); return {car, progress: -.018*(i+1), pace: 10.7 + i*.32};
});
let position = trackPoint(0), velocity = new THREE.Vector3(), yaw = Math.PI/2;
let progress = 0, lastT = 0, elapsed = 0, charge = 1, countdown = 3;
let steerVisual = 0, audioEnabled = false, oscillator: OscillatorNode | undefined, gain: GainNode | undefined, audioContext: AudioContext | undefined;
const keys = new Set<string>();
const actions: Record<string,string> = {ArrowUp:'forward',KeyW:'forward',ArrowDown:'brake',KeyS:'brake',ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',Space:'drift',ShiftLeft:'boost',ShiftRight:'boost'};
const formatTime = (t:number) => `${Math.floor(t/60).toString().padStart(2,'0')}:${(t%60).toFixed(2).padStart(5,'0')}`;
function direction(t:number) { return trackPoint(t+.001).sub(trackPoint(t)).normalize(); }
function nearest(p: THREE.Vector3) { let index=0, distance=Infinity; samples.forEach((s,i)=>{const d=(p.x-s.x)**2+(p.z-s.z)**2;if(d<distance){distance=d;index=i;}}); return {t:index/600, point:samples[index], distance:Math.sqrt(distance)}; }
function placeCar(car:THREE.Group,t:number,lane=0) {const p=trackPoint(t), d=direction(t);car.position.copy(p).add(new THREE.Vector3(d.z,0,-d.x).multiplyScalar(lane));car.rotation.y=Math.atan2(d.x,d.z);}
function reset() {
 position.copy(trackPoint(0));velocity.set(0,0,0);yaw=Math.atan2(direction(0).x,direction(0).z);progress=0;lastT=0;elapsed=0;charge=1;countdown=3;
 rivals.forEach((r,i)=>{r.progress=-.018*(i+1);placeCar(r.car,r.progress,(i%2?1:-1)*1.3);});
 player.position.copy(position);player.rotation.set(0,yaw,0);keys.clear();
}
function start() {reset();mode='countdown';document.body.classList.add('playing');$('intro').hidden=true;$('finish').hidden=true;$('hud').hidden=false;$('countdown').hidden=false;$('message').textContent='';$('pause').textContent='pause';camera.position.copy(position).add(new THREE.Vector3(-9,6,2));}
function recover() {const n=nearest(position);position.copy(n.point);velocity.set(0,0,0);yaw=Math.atan2(direction(n.t).x,direction(n.t).z);lastT=n.t;}
function pause() {if(mode==='race'||mode==='countdown'){previousMode=mode;mode='paused';keys.clear();$('message').textContent='paused';$('pause').textContent='resume';}else if(mode==='paused'){mode=previousMode;$('message').textContent='';$('pause').textContent='pause';}}
$('start').onclick=start;$('again').onclick=start;$('pause').onclick=pause;$('reset').onclick=()=>{if(mode!=='intro')recover();};
$('view').onclick=()=>{overview=!overview;$('view').textContent=overview?'inspect your ride ↗':'explore the circuit ↗';};
$('help').onclick=()=>{$('message').textContent=$('message').textContent?'':'wasd / arrows · space drift · shift boost · r recover · esc pause';};
$('sound').onclick=()=>{
 audioEnabled=!audioEnabled;$('sound').textContent=audioEnabled?'sound on':'sound off';
 if(audioEnabled&&!audioContext){audioContext=new AudioContext();oscillator=audioContext.createOscillator();gain=audioContext.createGain();oscillator.type='sawtooth';gain.gain.value=0;const filter=audioContext.createBiquadFilter();filter.type='lowpass';filter.frequency.value=500;oscillator.connect(filter);filter.connect(gain);gain.connect(audioContext.destination);oscillator.start();}if(audioEnabled)void audioContext?.resume();
};
document.querySelectorAll<HTMLButtonElement>('[data-color]').forEach(button=>button.onclick=()=>{const color=Number(button.dataset.color);scene.remove(player);player.traverse(object=>{if(object instanceof THREE.Mesh){object.geometry.dispose();const materials=Array.isArray(object.material)?object.material:[object.material];materials.forEach(m=>m.dispose());}});player=createCar(color);scene.add(player);document.querySelectorAll('[data-color]').forEach(b=>{b.classList.remove('active');b.setAttribute('aria-pressed','false');});button.classList.add('active');button.setAttribute('aria-pressed','true');});
addEventListener('keydown',e=>{if(actions[e.code]){e.preventDefault();keys.add(actions[e.code]);}if(e.repeat)return;if(e.code==='Escape')pause();if(e.code==='KeyR'&&mode!=='intro')recover();if(e.code==='Enter'&&(mode==='intro'||mode==='finish'))start();});
addEventListener('keyup',e=>{if(actions[e.code])keys.delete(actions[e.code]);});
addEventListener('blur',()=>{keys.clear();if(mode==='race'||mode==='countdown')pause();});
document.querySelectorAll<HTMLElement>('[data-control]').forEach(button=>{button.addEventListener('pointerdown',e=>{e.preventDefault();button.setPointerCapture(e.pointerId);keys.add(button.dataset.control!);});for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,()=>keys.delete(button.dataset.control!));});
const map=document.createElement('canvas');map.width=240;map.height=170;map.id='minimap';map.setAttribute('aria-label','circuit map with racer positions');$('hud').appendChild(map);const ctx=map.getContext('2d')!;
function drawMap(){ctx.clearRect(0,0,240,170);ctx.lineWidth=13;ctx.strokeStyle='#ffffff22';ctx.beginPath();samples.forEach((p,i)=>{const x=120+p.x*3.5,y=85+p.z*3.5;i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.closePath();ctx.stroke();rivals.forEach(r=>{ctx.fillStyle='#b9b8b0';ctx.beginPath();ctx.arc(120+r.car.position.x*3.5,85+r.car.position.z*3.5,3,0,Math.PI*2);ctx.fill();});ctx.fillStyle='#deff64';ctx.beginPath();ctx.arc(120+position.x*3.5,85+position.z*3.5,5,0,Math.PI*2);ctx.fill();}
// The fixed step keeps steering and traction consistent across display refresh rates.
const STEP=1/120;
function simulate(dt:number) {
 if(mode==='countdown'){countdown-=dt;$('countdown').textContent=countdown>0?String(Math.ceil(countdown)):'go';if(countdown<=0){mode='race';$('countdown').hidden=true;}return;}
 if(mode!=='race')return;
 elapsed+=dt;
 const f=new THREE.Vector3(Math.sin(yaw),0,Math.cos(yaw));const right=new THREE.Vector3(f.z,0,-f.x);
 const longitudinal=velocity.dot(f), lateral=velocity.dot(right);
 const steering=Number(keys.has('left'))-Number(keys.has('right'));
 const drift=keys.has('drift')&&Math.abs(longitudinal)>4;
 const boosting=keys.has('boost')&&charge>.015&&longitudinal>1;
 charge=THREE.MathUtils.clamp(charge+(boosting?-.28:.085)*dt,0,1);
 const acceleration=(keys.has('forward')?21:0)-(keys.has('brake')?(longitudinal>1?29:10):0);
 velocity.addScaledVector(f,(acceleration-longitudinal*(boosting?.45:.9)+(boosting?17:0))*dt);
 velocity.addScaledVector(right,-lateral*(drift?1.5:9)*dt);
 yaw+=steering*Math.min(Math.abs(longitudinal)/7,1)*1.8*(drift?1.22:1)*Math.sign(longitudinal||1)*dt;
 position.addScaledVector(velocity,dt);
 const n=nearest(position);
 if(n.distance>TRACK_WIDTH/2-.48){const normal=position.clone().sub(n.point);normal.y=0;normal.normalize();position.copy(n.point).addScaledVector(normal,TRACK_WIDTH/2-.48);const outward=velocity.dot(normal);if(outward>0)velocity.addScaledVector(normal,-outward*1.35);velocity.multiplyScalar(.987);}
 let delta=n.t-lastT;if(delta<-.5)delta+=1;if(delta>.5)delta-=1;
 // Only nearby sequential movement can count toward a lap.
 if(Math.abs(delta)<.05)progress+=delta;lastT=n.t;
 rivals.forEach((r,i)=>{r.progress+=r.pace/circuitLength*dt;placeCar(r.car,r.progress,Math.sin(r.progress*15+i)*.65+(i-1)*.7);const difference=position.clone().sub(r.car.position);difference.y=0;if(difference.length()<1.45){difference.normalize();position.addScaledVector(difference,dt*5);velocity.addScaledVector(difference,dt*8);}});
 player.position.copy(position);player.position.y+=Math.sin(elapsed*35)*Math.min(velocity.length()*.0008,.018);
 steerVisual=THREE.MathUtils.damp(steerVisual,steering*longitudinal*.009,7,dt);
 player.rotation.set(THREE.MathUtils.clamp(-acceleration*.0015,-.035,.04),yaw,steerVisual);
 const wheels=player.userData.wheels as THREE.Object3D[]|undefined;wheels?.forEach(w=>w.rotation.x+=longitudinal*dt*2);
 if(progress>=3){mode='finish';$('finish').hidden=false;const rank=1+rivals.filter(r=>r.progress>progress).length;$('result').textContent=`${rank===1?'podium belongs to you.':`p${rank}. one more run?`} ${formatTime(elapsed)}`;let best=Infinity;try{best=Number(localStorage.getItem('revolt2-best'))||Infinity;if(elapsed<best)localStorage.setItem('revolt2-best',String(elapsed));}catch{}$('message').textContent=elapsed<best?'new personal best':'';}
}
let oldTime=performance.now(),accumulator=0,total=0;
function frame(now:number){const dt=Math.min((now-oldTime)/1000,.05);oldTime=now;total+=dt;accumulator+=dt;while(accumulator>=STEP){simulate(STEP);accumulator-=STEP;}
 if(mode==='intro') {placeCar(player,.09);const a=reducedMotion?0:Math.sin(total*.17)*.12;if(overview){camera.clearViewOffset();camera.position.set(39,32,43);camera.lookAt(2,0,0);}else{const offset=new THREE.Vector3(-3.7+a,2.0,4.6).multiplyScalar(innerWidth<=760?1.5:1).applyAxisAngle(THREE.Object3D.DEFAULT_UP,player.rotation.y);camera.position.copy(player.position).add(offset);camera.lookAt(player.position.clone().add(new THREE.Vector3(0,.55,0)));camera.setViewOffset(innerWidth,innerHeight,-innerWidth*(innerWidth>760?.19:0),innerWidth<=760?innerHeight*.23:0,innerWidth,innerHeight);}camera.fov=42;camera.updateProjectionMatrix();rivals.forEach((r,i)=>placeCar(r.car,.3+i*.19));}
 else {camera.clearViewOffset();const f=new THREE.Vector3(Math.sin(yaw),0,Math.cos(yaw));const desired=position.clone().addScaledVector(f,-7.2).add(new THREE.Vector3(0,3.7,0));camera.position.lerp(desired,1-Math.exp(-5*dt));camera.lookAt(position.clone().addScaledVector(f,4).add(new THREE.Vector3(0,.6,0)));camera.fov=THREE.MathUtils.damp(camera.fov,48+velocity.length()*.4,3,dt);camera.updateProjectionMatrix();}
 $('lap').textContent=`${Math.min(3,Math.max(1,Math.floor(progress)+1))} / 3`;$('position').textContent=`${1+rivals.filter(r=>r.progress>progress).length} / 4`;$('time').textContent=formatTime(elapsed);$('speed').textContent=String(Math.round(velocity.length()*3.6));$('boost-fill').style.width=`${charge*100}%`;drawMap();
 if(gain&&oscillator&&audioContext){gain.gain.setTargetAtTime(audioEnabled&&mode==='race'?.026:0,audioContext.currentTime,.08);oscillator.frequency.setTargetAtTime(55+velocity.length()*8,audioContext.currentTime,.06);}
 const pivots=player.userData.frontWheelPivots as THREE.Object3D[]|undefined;pivots?.forEach(p=>p.rotation.y=THREE.MathUtils.damp(p.rotation.y,(Number(keys.has('left'))-Number(keys.has('right')))*.35,10,dt));
 presentation.update(player,mode==='race'&&keys.has('drift'),velocity.length(),total);presentation.render();requestAnimationFrame(frame);
}
function resize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);presentation.resize();}addEventListener('resize',resize);resize();reset();requestAnimationFrame(frame);









