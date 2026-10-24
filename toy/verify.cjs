// Exercise the simulation without a browser clock or audio device.
const vm = require('node:vm');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const element = {style:{}, addEventListener(){}, setAttribute(){}, getContext(){return {setTransform(){}}}};
const sandbox = {console, Math, innerWidth:1280, innerHeight:720, devicePixelRatio:1,
  document:{querySelector(){return element}}, window:{addEventListener(){}}, requestAnimationFrame(){}, assert};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(__dirname+'/toy.js','utf8') + `
assert.equal(creatures.length,3);
food=[];
const parent=creatures[0];
for(let i=0;i<7;i++)eat(parent,{x:parent.x,y:parent.y,note:i});
assert.equal(creatures.length,4,'feeding must produce a child');
assert.equal(births,1);
assert(creatures[3].meal.length>0,'child must inherit a phrase');
const a=creatures[0],b=creatures[1];
a.meal=[1,2];b.meal=[4,5];fuse(a,b);
assert.equal(creatures.length,3);
assert.deepEqual(Array.from(creatures.at(-1).meal),[1,4,2,5]);
for(let tick=0;tick<3600;tick++){
 if(tick%10===0)addFood(random(bounds.l,bounds.r),random(bounds.t,bounds.b));
 update(1/60);
 for(const c of creatures)assert([c.x,c.y,c.r,c.vx,c.vy].every(Number.isFinite));
 assert(creatures.length<=12);assert(food.length<=110);
}
innerWidth=390;innerHeight=844;resize();
for(const c of creatures)assert(c.x>=bounds.l && c.x<=bounds.r);
reset();assert.equal(creatures.length,3);assert.equal(births,0);assert.equal(merges,0);assert.equal(food.length,5);
console.log('PASS: birth, phrase inheritance, fusion, 60-second simulation, population bounds, narrow resize, reset');
`,sandbox);
