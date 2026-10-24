import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { surfaceTexture, contactTexture, windowTexture } from './materials';

export const TRACK_WIDTH = 7;
export function trackPoint(t: number): THREE.Vector3 {
  const a = t * Math.PI * 2;
  return new THREE.Vector3(Math.sin(a) * 24, 0, Math.cos(a) * 16);
}

const material = (color: number, roughness = .75, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
function box(w: number, h: number, d: number, mat: THREE.Material, x = 0, y = 0, z = 0): THREE.Mesh {
  const smallest = Math.min(w, h, d);
  const geometry = smallest > .16 ? new RoundedBoxGeometry(w, h, d, 1, Math.min(.09, smallest * .13)) : new THREE.BoxGeometry(w, h, d);
  const mesh = new THREE.Mesh(geometry, mat);
  mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true;
  return mesh;
}
function cylinder(r: number, h: number, mat: THREE.Material, x = 0, y = 0, z = 0, top = r): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(top, r, h, 32), mat);
  mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true;
  return mesh;
}
function textTexture(text: string, bg: string, fg: string, width = 512, height = 256): THREE.CanvasTexture {
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = bg; ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `900 ${Math.min(height * .37, width / (text.length * .62))}px Arial`;
  ctx.fillText(text, width / 2, height / 2);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; return texture;
}
function label(text: string, w: number, h: number, bg: string, fg = '#ffffff'): THREE.Mesh {
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: textTexture(text, bg, fg), roughness: .8, side: THREE.DoubleSide }));
}

export function createWorld(scene: THREE.Scene): void {
  scene.background = new THREE.Color('#19282e');
  scene.fog = new THREE.Fog('#19282e', 65, 155);
  scene.add(new THREE.HemisphereLight('#adc8ef', '#61472f', .58));
  const sun = new THREE.DirectionalLight('#ffd7a0', 3); sun.position.set(-22, 38, 15); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); sun.shadow.camera.left = -55; sun.shadow.camera.right = 55;
  sun.shadow.camera.top = 45; sun.shadow.camera.bottom = -45; sun.shadow.normalBias = .03; sun.shadow.bias = -.0003;
  scene.add(sun);
  const fill = new THREE.DirectionalLight('#94bfff', 1.5); fill.position.set(25, 22, -45); scene.add(fill);

  // The enclosing wall gives the low camera a readable workshop backdrop.
  const wallMaterial = new THREE.MeshStandardMaterial({color:0x26373d,roughness:.92});
  scene.add(box(1,38,125,wallMaterial,-57,18,0));
  scene.add(box(1,38,125,wallMaterial,57,18,0));
  scene.add(box(114,38,1,wallMaterial,0,18,57));
  const brickMaterial=material(0x38484c);
  for(let y=2;y<28;y+=3)scene.add(box(.04,.035,110,brickMaterial,56.48,y,0));
  const studioPoster=label('make something move.',21,9,'#c0b790','#182d35');
  studioPoster.rotation.y=-Math.PI/2;studioPoster.position.set(56.4,17,14);scene.add(studioPoster);
  const coffee=material(0xc4c1a3,.23);
  scene.add(cylinder(2.3,4.8,coffee,35,2.4,7));
  scene.add(cylinder(2.12,.02,material(0x211510,.18),35,4.81,7));
  const mugRim=new THREE.Mesh(new THREE.TorusGeometry(2.22,.13,12,48),coffee);
  mugRim.rotation.x=Math.PI/2;mugRim.position.set(35,4.81,7);scene.add(mugRim);
  const handle=new THREE.Mesh(new THREE.TorusGeometry(1.4,.29,12,32),coffee);
  handle.position.set(37.4,2.5,7);handle.castShadow=true;scene.add(handle);
  const shutter = material(0x354a50,.48,.35);
  for(let y=1;y<23;y+=1.15) scene.add(box(.25,.92,24,shutter,-56.4,y,12));
  for(const z of [-.6,24.6])scene.add(box(.65,25,.25,material(0x15252d),-56,12,z));
  const wallSign=label('after hours / racing club',18,3.2,'#172831','#d8e6d7');wallSign.rotation.y=Math.PI/2;wallSign.position.set(-56.3,27,12);scene.add(wallSign);
  const strip=new THREE.Mesh(new THREE.BoxGeometry(.2,.12,22),new THREE.MeshStandardMaterial({color:0xb2dcff,emissive:0x8fc8ef,emissiveIntensity:2}));strip.position.set(-56,24,12);scene.add(strip);
  const oak = surfaceTexture('oak'); oak.repeat.set(10, 16);
  const wood = new THREE.MeshStandardMaterial({ map: oak, bumpMap: oak, bumpScale: .055, roughness: .47, color: 0xd9c3a8 });
  const dark = material(0x172328), cream = material(0xe3d6bb), orange = material(0xe27a36, .45);
  scene.add(box(160, .5, 140, wood, 0, -.3, 0));
  const jointMat = material(0x38291d);
  for (let z = -65; z < 70; z += 7) {
    scene.add(box(155, .006, .035, jointMat, 0, -.044, z));
    for (let x = -72 + ((Math.round(z / 7) % 2) * 12); x < 80; x += 24) scene.add(box(.035, .006, 7, jointMat, x, -.044, z + 3.5));
  }
  const contactMat = new THREE.MeshBasicMaterial({ map: contactTexture(), transparent: true, depthWrite: false, opacity: .75 });
  function contact(x: number, z: number, w: number, d: number) {
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(w, d), contactMat); shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(x, -.039, z); scene.add(shadow);
  }

  // Each pair of vertices spans the road. The indexed triangles form one closed ribbon.
  const positions: number[] = [], uv: number[] = [], indices: number[] = [];
  const samples = 256;
  for (let i = 0; i <= samples; i++) {
    const p = trackPoint(i / samples), next = trackPoint(i / samples + .001);
    const tangent = next.sub(p).normalize(), normal = new THREE.Vector3(-tangent.z, 0, tangent.x);
    for (const side of [-1, 1]) { const v = p.clone().addScaledVector(normal, side * TRACK_WIDTH / 2); positions.push(v.x, .035, v.z); uv.push(i / 8, (side + 1) / 2); }
    if (i < samples) { const j = i * 2; indices.push(j, j + 1, j + 2, j + 1, j + 3, j + 2); }
  }
  const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geometry.setIndex(indices); geometry.computeVertexNormals();
  const asphalt = surfaceTexture('asphalt');
  const road = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ map: asphalt, bumpMap: asphalt, bumpScale: .027, roughness: .82 })); road.receiveShadow = true; scene.add(road);
  const white = material(0xc5c6ae), red = material(0xc25739);
  const curbGeometry = new THREE.BoxGeometry(.46, .12, .84);
  const curbWhite = new THREE.InstancedMesh(curbGeometry, white, 160), curbRed = new THREE.InstancedMesh(curbGeometry, red, 160);
  curbWhite.receiveShadow = curbRed.receiveShadow = true;
  scene.add(curbWhite, curbRed);
  const curbTransform = new THREE.Object3D(); let whiteIndex = 0, redIndex = 0;
  const dashMaterial = material(0x859185);
  for (let i = 0; i < 160; i++) {
    const t = i / 160, p = trackPoint(t), tangent = trackPoint(t + .001).sub(p).normalize();
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x);
    for (const side of [-1, 1]) {
      curbTransform.position.copy(p).addScaledVector(normal, side * (TRACK_WIDTH / 2 + .08)); curbTransform.position.y = .065;
      curbTransform.rotation.y = Math.atan2(tangent.x, tangent.z); curbTransform.updateMatrix();
      if (i % 4 < 2) curbWhite.setMatrixAt(whiteIndex++, curbTransform.matrix); else curbRed.setMatrixAt(redIndex++, curbTransform.matrix);
    }
    if (i % 4 === 0) {
      const dash = box(.1, .009, .8, dashMaterial); dash.position.copy(p); dash.position.y = .043;
      dash.rotation.y = Math.atan2(tangent.x, tangent.z); scene.add(dash);
    }
  }
  for (let i = 0; i < 10; i++) for (let j = 0; j < 2; j++) scene.add(box(.65, .018, TRACK_WIDTH / 10, (i + j) % 2 ? dark : white, j * .65, .05, 16 - TRACK_WIDTH / 2 + (i + .5) * TRACK_WIDTH / 10));

  // Small race furniture makes the driving route legible against the oversized room.
  function cone(x: number, z: number) { const g = new THREE.Group(); g.add(box(.72, .08, .72, dark, 0, .04)); g.add(cylinder(.27, .85, orange, 0, .48, 0, .045)); g.add(cylinder(.19, .17, white, 0, .48, 0, .155)); g.position.set(x, 0, z); scene.add(g); }
  [[-6, 20.5], [-8, 20.2], [5, 20.5], [7, 20.2], [28, -1], [28, 1], [-28, -2], [-28, 0], [0, -20.5]].forEach(([x,z]) => cone(x,z));
  function sign(x: number, z: number, rotation: number, text: string) {
    const g = new THREE.Group(); g.add(box(5, 1.5, .2, dark, 0, 1.25));
    g.add(box(.13, 1.4, .13, dark, -1.7, .65), box(.13, 1.4, .13, dark, 1.7, .65));
    const face = label(text, 4.7, 1.2, '#263238', '#f5d062'); face.position.set(0, 1.25, .11); g.add(face);
    g.position.set(x, 0, z); g.rotation.y = rotation; scene.add(g);
  }
  sign(-14, -21, 0, 'tiny cars. big trouble.'); sign(14, -21, -.25, 'revolt / workshop');
  const gate = new THREE.Group();
  gate.add(box(.35, 4.6, .35, dark, 0, 2.3, -4.35), box(.35, 4.6, .35, dark, 0, 2.3, 4.35));
  gate.add(box(.5, 1, 9.1, orange, 0, 4.65, 0));
  const gateLabel = label('start / finish', 8.5, .8, '#ef713a', '#202a2c'); gateLabel.rotation.y = -Math.PI / 2; gateLabel.position.set(-.26, 4.65, 0); gate.add(gateLabel);
  gate.scale.y = 1.7; gate.position.set(0, 0, 16); scene.add(gate);
  const led = new THREE.MeshStandardMaterial({ color: 0xffc870, emissive: 0xffb34f, emissiveIntensity: 2.5 });
  gate.add(box(.08, .07, 8.6, led, -.28, 4.15, 0));

  function paintCan(x: number, z: number, r: number, h: number, color: number, title: string) {
    const g = new THREE.Group(); const colorMat = material(color);
    g.add(cylinder(r, h, colorMat, 0, h / 2), cylinder(r * 1.03, .16, material(0xadb7b4, .3, .8), 0, h));
    g.add(cylinder(r * 1.02, .1, material(0xadb7b4, .3, .8), 0, .1));
    const face = label(title, r * 1.6, h * .45, '#eee9d7', '#303c3e'); face.position.set(0, h * .54, r + .015); g.add(face);
    const handle = new THREE.Mesh(new THREE.TorusGeometry(r * 1.08, .05, 6, 32, Math.PI), material(0x9ba9aa, .3, .8));
    handle.position.y = h * .7; g.add(handle); g.position.set(x, 0, z); g.rotation.y = -.25; scene.add(g);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(r * .92, .07, 8, 40), material(0x657273, .25, .85)); rim.rotation.x = Math.PI / 2; rim.position.y = h + .1; g.add(rim);
    const batch = label('atelier / premium enamel', r * 1.4, h * .13, '#eee9d7', '#686450'); batch.position.set(0, h * .26, r + .02); g.add(batch);
    contact(x, z, r * 3.3, r * 3.3);
  }
  paintCan(-11, -3, 2.6, 6, 0xf0ba43, 'sunshine'); paintCan(-15, -7, 2, 4.7, 0x4f9298, 'studio'); paintCan(32, 20, 3.2, 7.5, 0xd55e42, 'colour');
  function book(x: number, z: number, w: number, d: number, h: number, color: number, angle: number) {
    const g = new THREE.Group(), cover = material(color);
    g.add(box(w, h, d, cream, 0, h / 2)); g.add(box(w + .2, .1, d + .2, cover, 0, h + .04), box(w + .2, .1, d + .2, cover, 0, .05));
    g.add(box(.15, h, d + .2, cover, -w / 2, h / 2));
    for (let i = 1; i < 5; i++) g.add(box(w, .015, .025, material(0xbdb399), 0, i * h / 5, d / 2 + .002));
    g.position.set(x, 0, z); g.rotation.y = angle; scene.add(g); contact(x, z, w * 1.5, d * 1.5); return g;
  }
  book(10, 2, 7, 9, 1.2, 0x48666b, -.35); const b = book(10, 2, 6.6, 8.6, .8, 0xce754b, -.18); b.position.y = 1.3;
  const top = label('field notes', 4.8, 1.6, '#ce754b', '#f5e8ca'); top.rotation.x = -Math.PI / 2; top.rotation.z = .18; top.position.set(10, 2.26, 2); scene.add(top);
  function carton(x: number, z: number, w: number, h: number, d: number, angle: number) {
    const cardboard = surfaceTexture('paper');
    const g = new THREE.Group(); g.add(box(w, h, d, new THREE.MeshStandardMaterial({ map: cardboard, color: 0xb18a57, roughness: .92, bumpMap: cardboard, bumpScale: .025 }), 0, h / 2));
    g.add(box(.8, .012, d + .02, material(0xcbaa78), 0, h + .01));
    const tag = label('fragile ↑', w * .6, h * .28, '#ddc69d', '#5b4836'); tag.position.set(0, h * .55, d / 2 + .01); g.add(tag);
    g.position.set(x, 0, z); g.rotation.y = angle; scene.add(g); contact(x, z, w * 1.5, d * 1.5);
  }
  carton(-34, -17, 10, 9, 9, .14); carton(-33, -17, 8, 6, 8, -.12);
  carton(24, -28, 12, 12, 10, -.1); carton(39, -25, 10, 7, 8, .1);
  // Giant workbench legs and pegboard give the circuit its toy scale.
  const benchMat = material(0x304b4b, .5, .3);
  for (const x of [-42, 42]) for (const z of [-34]) scene.add(box(2.8, 27, 2.8, benchMat, x, 13.5, z));
  scene.add(box(96, 2, 14, material(0x795b3f), 0, 27, -34));
  const plaster = surfaceTexture('plaster'); plaster.repeat.set(7, 3);
  scene.add(box(150, 42, 1, new THREE.MeshStandardMaterial({ map: plaster, roughness: .95, bumpMap: plaster, bumpScale: .08 }), 0, 20, -48));
  scene.add(box(150, 1.5, 1.2, benchMat, 0, .75, -47.3));
  const peg = box(38, 15, .6, material(0x907650), -20, 19, -46.8); scene.add(peg);
  const holeMat = material(0x392e21);
  const holes = new THREE.InstancedMesh(new THREE.CircleGeometry(.09, 6), holeMat, 126); let holeIndex = 0;
  const holeTransform = new THREE.Object3D();
  for (let x = -37; x < -2; x += 2) for (let y = 13; y < 26; y += 2) { holeTransform.position.set(x, y, -46.46); holeTransform.updateMatrix(); holes.setMatrixAt(holeIndex++, holeTransform.matrix); }
  scene.add(holes);
  const glassTexture = windowTexture();
  const windowGlass = new THREE.MeshStandardMaterial({ map: glassTexture, emissiveMap: glassTexture, emissive: 0xffffff, emissiveIntensity: 1.1, roughness: .25 });
  scene.add(box(24, 19, .65, dark, 21, 22, -46.9));
  scene.add(box(22.7, 17.7, .2, windowGlass, 21, 22, -46.4));
  for (const x of [9.4, 17.2, 24.8, 32.6]) scene.add(box(.36, 18.5, .8, benchMat, x, 22, -46.1));
  for (const y of [13, 22, 31]) scene.add(box(23.7, .36, .8, benchMat, 21, y, -46.1));
  scene.add(box(26, .65, 2.5, wood, 21, 12.6, -45.8));
  function screwdriver(x: number, z: number, angle: number, color: number) {
    const g = new THREE.Group(); const shaft = cylinder(.11, 6, material(0xb2bfc0, .25, .8), 0, 0, 2); shaft.rotation.x = Math.PI / 2; g.add(shaft);
    const grip = cylinder(.6, 3.8, material(color), 0, 0, -2.6); grip.rotation.x = Math.PI / 2; g.add(grip);
    for (const a of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) g.add(box(.12, .15, 2.8, dark, Math.cos(a) * .52, Math.sin(a) * .52, -2.6));
    g.position.set(x, .62, z); g.rotation.y = angle; scene.add(g);
  }
  screwdriver(0, -5, 1.1, 0xe0753e); screwdriver(-32, 13, -.8, 0x54868c);
  const ruler = new THREE.Group(); ruler.add(box(14, .12, 1.8, material(0xdbad54), 0, .09));
  for (let i = 0; i <= 28; i++) ruler.add(box(.035, .008, i % 2 ? .35 : .65, dark, -6.8 + i * .485, .155, -.48));
  ruler.position.set(0, 0, -10); ruler.rotation.y = -.12; scene.add(ruler);
  const lamp = new THREE.Group(), lampMat = material(0x415f5b, .45, .3);
  lamp.add(cylinder(2.7, .45, lampMat, 0, .23));
  const arm = (a: THREE.Vector3, b: THREE.Vector3) => {
    const beam = box(.32, a.distanceTo(b), .32, lampMat); beam.position.copy(a).add(b).multiplyScalar(.5);
    beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()); lamp.add(beam);
    const joint = new THREE.Mesh(new THREE.SphereGeometry(.45, 12, 12), metalLamp); joint.position.copy(b); lamp.add(joint);
  };
  const metalLamp = material(0x98aaa4, .25, .8);
  arm(new THREE.Vector3(0, .5, 0), new THREE.Vector3(-2, 7, 0));
  arm(new THREE.Vector3(-2, 7, 0), new THREE.Vector3(3, 11, 0));
  const shade = cylinder(2.1, 2.1, lampMat, 3, 10, 0, .65); lamp.add(shade);
  const bulb = cylinder(1.8, .04, new THREE.MeshStandardMaterial({ color: 0xffe6b3, emissive: 0xffc36b, emissiveIntensity: 1.3 }), 3, 8.94); lamp.add(bulb);
  lamp.position.set(33, 0, -5); lamp.rotation.y = Math.PI; scene.add(lamp);
  const lampPool = new THREE.SpotLight('#ffbd73', 620, 34, .86, .72, 2);
  lampPool.position.set(30, 8.9, -5); lampPool.target.position.set(25, 0, -5); scene.add(lampPool, lampPool.target);
  contact(33, -5, 8, 8);
  const warmPool = new THREE.PointLight('#ffb36a', 180, 32, 2); warmPool.position.set(-10, 9, 5); scene.add(warmPool);
  const cableCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(33, .12, -5), new THREE.Vector3(37, .12, -3), new THREE.Vector3(39, .12, -10),
    new THREE.Vector3(34, .12, -16), new THREE.Vector3(38, .12, -28), new THREE.Vector3(40, .12, -44),
  ]);
  const cable = new THREE.Mesh(new THREE.TubeGeometry(cableCurve, 64, .09, 6, false), dark); cable.castShadow = true; scene.add(cable);
  const blueprintCanvas = document.createElement('canvas'); blueprintCanvas.width = 1024; blueprintCanvas.height = 768;
  const drawing = blueprintCanvas.getContext('2d')!;
  drawing.fillStyle = '#224e63'; drawing.fillRect(0, 0, 1024, 768);
  drawing.strokeStyle = '#badbc321'; drawing.lineWidth = 1;
  for (let i = 0; i < 1024; i += 32) { drawing.beginPath(); drawing.moveTo(i, 0); drawing.lineTo(i, 768); drawing.stroke(); }
  for (let i = 0; i < 768; i += 32) { drawing.beginPath(); drawing.moveTo(0, i); drawing.lineTo(1024, i); drawing.stroke(); }
  drawing.strokeStyle = '#b1d2cd'; drawing.lineWidth = 3;
  drawing.strokeRect(42, 42, 940, 684);
  drawing.strokeRect(310, 170, 370, 360); drawing.strokeRect(360, 270, 270, 155);
  for (const x of [245, 680]) for (const y of [205, 440]) { drawing.strokeRect(x, y, 90, 90); for (let j = 0; j < 8; j++) { drawing.beginPath(); drawing.moveTo(x, y + j * 12); drawing.lineTo(x + 90, y + j * 12); drawing.stroke(); } }
  drawing.beginPath(); drawing.moveTo(215, 590); drawing.lineTo(805, 590); drawing.moveTo(215, 578); drawing.lineTo(215, 602); drawing.moveTo(805, 578); drawing.lineTo(805, 602); drawing.stroke();
  drawing.fillStyle = '#d5dfcf'; drawing.font = '24px monospace'; drawing.fillText('revolt / chassis development', 65, 95);
  drawing.font = '16px monospace'; drawing.fillText('scale 1:10   /   workshop series 02', 65, 692); drawing.fillText('280 mm', 480, 620);
  const blueprintTexture = new THREE.CanvasTexture(blueprintCanvas); blueprintTexture.colorSpace = THREE.SRGBColorSpace; blueprintTexture.anisotropy = 8;
  const blueprint = new THREE.Mesh(new THREE.PlaneGeometry(11, 8.25), new THREE.MeshStandardMaterial({ map: blueprintTexture, roughness: .84 }));
  blueprint.rotation.set(-Math.PI / 2, 0, -.13); blueprint.position.set(-5, -.025, 7); blueprint.receiveShadow = true; scene.add(blueprint);
  const pencil = new THREE.Group(); const pencilBody = new THREE.Mesh(new THREE.CylinderGeometry(.16, .16, 7.5, 6), material(0xc69740, .5)); pencilBody.rotation.z = Math.PI / 2; pencil.add(pencilBody);
  const pencilTip = new THREE.Mesh(new THREE.ConeGeometry(.16, .65, 6), cream); pencilTip.rotation.z = -Math.PI / 2; pencilTip.position.x = 4.05; pencil.add(pencilTip);
  const graphite = new THREE.Mesh(new THREE.ConeGeometry(.065, .23, 6), dark); graphite.rotation.z = -Math.PI / 2; graphite.position.x = 4.39; pencil.add(graphite);
  pencil.position.set(-5, .17, 10); pencil.rotation.y = -.22; scene.add(pencil);
  const tape = new THREE.Mesh(new THREE.TorusGeometry(2, .7, 12, 40), material(0xdac591)); tape.rotation.x = Math.PI / 2; tape.position.set(2, .75, 5); tape.castShadow = true; scene.add(tape);
  contact(2, 5, 7, 7);
  for (let i = 0; i < 8; i++) {
    const nut = new THREE.Mesh(new THREE.TorusGeometry(.27, .12, 4, 6), material(0x798789, .3, .8));
    nut.rotation.x = Math.PI / 2; nut.position.set(-5 + Math.sin(i * 4) * 2, .15, 2 + Math.cos(i * 7) * 2); nut.castShadow = true; scene.add(nut);
  }
}


