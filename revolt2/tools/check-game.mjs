import fs from 'node:fs';
import assert from 'node:assert/strict';
import ts from 'typescript';
import * as THREE from 'three';

// Run the real simulation functions with a minimal DOM. Rendering is tested in the browser.
const source = fs.readFileSync(new URL('../src/main.ts', import.meta.url), 'utf8');
const js = ts.transpile(source, { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext });
const world = ts.transpile(fs.readFileSync(new URL('../src/world.ts', import.meta.url), 'utf8'), { target: ts.ScriptTarget.ES2022 });
const track = world.slice(world.indexOf('function trackPoint'), world.indexOf('const material'));
const helpers = js.slice(js.indexOf('function direction('), js.indexOf("$('start').onclick"));
const simulation = js.slice(js.indexOf('function simulate('), js.indexOf('let oldTime'));
const sampleSetup = js.slice(js.indexOf('const samples ='), js.indexOf('let mode'));
const elements = new Map();
const $ = id => {
  if (!elements.has(id)) elements.set(id, { textContent: '', hidden: false });
  return elements.get(id);
};
const setup = `
${track}
const TRACK_WIDTH=7;
${sampleSetup}
let mode='intro',previousMode='race',elapsed=0,charge=1,countdown=3.5,progress=0,lastT=0,steerVisual=0,yaw=Math.PI/2;
const position=trackPoint(0),velocity=new THREE.Vector3(),keys=new Set(),player=new THREE.Group(),camera=new THREE.PerspectiveCamera();
const rivals=[0,1,2].map(i=>({car:new THREE.Group(),progress:-.018*(i+1),pace:10.7+i*.32}));
const document={body:{classList:{add(){}}}},localStorage={getItem:()=>null,setItem(){}},formatTime=t=>t.toFixed(2);
${helpers}
${simulation}
return {
 start,pause,recover,simulate,
 state:()=>({mode,progress,elapsed,countdown,charge,position:position.clone(),yaw}),
 drive(speed){
   const n=nearest(position),target=trackPoint(n.t+.035).sub(position);
   const desired=Math.atan2(target.x,target.z),error=Math.atan2(Math.sin(desired-yaw),Math.cos(desired-yaw));
   keys.clear();if(velocity.length()<speed)keys.add('forward');
   if(error>.025)keys.add('left');if(error<-.025)keys.add('right');
 },
 maxRoadDistance:()=>nearest(position).distance,
};`;
const game = new Function('THREE', '$', setup)(THREE, $);
game.start();
assert.equal(game.state().mode, 'countdown');
game.pause();
const countdown = game.state().countdown;
game.simulate(1);
assert.equal(game.state().countdown, countdown, 'pause freezes countdown');
game.pause();
for (let i = 0; i < 421; i++) game.simulate(1 / 120);
assert.equal(game.state().mode, 'race');
let maxRoadDistance = 0;
for (let i = 0; i < 120 * 120 && game.state().mode === 'race'; i++) {
  game.drive(12);
  game.simulate(1 / 120);
  maxRoadDistance = Math.max(maxRoadDistance, game.maxRoadDistance());
  if (i === 600) {
    const before = game.state(); game.pause(); game.simulate(1);
    assert.equal(game.state().elapsed, before.elapsed, 'pause freezes race time');
    assert.deepEqual(game.state().position, before.position, 'pause freezes car');
    game.pause(); game.recover();
    assert.equal(game.state().progress, before.progress, 'recovery cannot grant lap progress');
  }
}
const result = game.state();
assert.equal(result.mode, 'finish', `autopilot must finish; progress=${result.progress}`);
assert.ok(result.progress >= 3 && result.progress < 3.01);
assert.ok(maxRoadDistance < 3.1, 'car stays within track collision boundary');
game.start();
assert.equal(game.state().progress, 0);
assert.equal(game.state().elapsed, 0);
assert.equal(game.state().mode, 'countdown');
console.log(`PASS: 3 laps in ${result.elapsed.toFixed(2)}s; countdown, pause, recovery, restart; max road offset ${maxRoadDistance.toFixed(2)}m`);
