import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// Cross sections describe the shell from tail to nose. All dimensions are world units.
type Section = readonly [z: number, halfWidth: number, bottom: number, top: number];
function shell(sections: readonly Section[], material: THREE.Material): THREE.Mesh {
  const positions: number[] = [], indices: number[] = [], count = 16;
  for (const [z, width, bottom, top] of sections) {
    for (let j = 0; j < count; j++) {
      const a = j / count * Math.PI * 2;
      positions.push(Math.cos(a) * width, bottom + (Math.sin(a) + 1) / 2 * (top - bottom), z);
    }
  }
  for (let i = 0; i < sections.length - 1; i++) for (let j = 0; j < count; j++) {
    const a = i * count + j, b = i * count + (j + 1) % count, c = a + count, d = b + count;
    indices.push(a, b, c, b, d, c);
  }
  for (let j = 1; j < count - 1; j++) {
    indices.push(0, j + 1, j);
    const end = (sections.length - 1) * count;
    indices.push(end, end + j, end + j + 1);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  return new THREE.Mesh(geometry, material);
}

export function createCar(color: number): THREE.Group {
  const car = new THREE.Group(), body = new THREE.Group(); car.add(body);
  const paint = new THREE.MeshPhysicalMaterial({ color, roughness: .34, metalness: .12, clearcoat: .85, clearcoatRoughness: .24 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x14191c, roughness: .42, metalness: .2 });
  const rubber = new THREE.MeshStandardMaterial({ color: 0x171a1c, roughness: .91 });
  const treadMaterial = new THREE.MeshStandardMaterial({ color: 0x222528, roughness: .84 });
  const aluminum = new THREE.MeshStandardMaterial({ color: 0xbcc5cc, metalness: .92, roughness: .25 });
  const gunmetal = new THREE.MeshStandardMaterial({ color: 0x4a555e, metalness: .85, roughness: .3 });
  const gold = new THREE.MeshStandardMaterial({ color: 0xffb958, metalness: .75, roughness: .24 });
  const glass = new THREE.MeshPhysicalMaterial({ color: 0x122932, roughness: .2, metalness: .35, clearcoat: .7 });
  const whiteLight = new THREE.MeshStandardMaterial({ color: 0xe4f8ff, emissive: 0xcceeff, emissiveIntensity: 2.5 });
  const redLight = new THREE.MeshStandardMaterial({ color: 0xff3929, emissive: 0xff2110, emissiveIntensity: 1.8 });
  function box(parent: THREE.Object3D, size: number[], position: number[], mat: THREE.Material, radius = .035): THREE.Mesh {
    const mesh = new THREE.Mesh(new RoundedBoxGeometry(size[0], size[1], size[2], 2, radius), mat);
    mesh.position.set(position[0], position[1], position[2]); parent.add(mesh); return mesh;
  }
  function rod(parent: THREE.Object3D, from: number[], to: number[], radius: number, mat: THREE.Material): THREE.Mesh {
    const a = new THREE.Vector3(...from as [number, number, number]), b = new THREE.Vector3(...to as [number, number, number]);
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, a.distanceTo(b), 8), mat);
    mesh.position.copy(a).add(b).multiplyScalar(.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.sub(a).normalize()); parent.add(mesh); return mesh;
  }
  box(body, [1.05, .14, 1.92], [0, .31, 0], dark);
  body.add(shell([[-.86,.26,.4,.63],[-.65,.49,.4,.77],[-.1,.53,.41,.8],[.45,.43,.4,.68],[.93,.28,.4,.51],[1,.16,.42,.48]],paint));
  body.add(shell([[-.59,.24,.69,.83],[-.37,.3,.69,1.03],[-.03,.29,.69,1.06],[.36,.19,.62,.82],[.48,.1,.62,.67]],glass));
  const roof = box(body,[.5,.045,.36],[0,1.039,-.17],paint); roof.rotation.x = -.06;
  // Exposed cage, side sill and wishbones retain the open-wheel RC silhouette.
  for (const side of [-1,1]) {
    rod(body,[side*.31,.7,-.6],[side*.31,1.035,-.3],.025,dark);
    rod(body,[side*.31,1.035,-.3],[side*.3,1.055,-.02],.025,dark);
    rod(body,[side*.3,1.055,-.02],[side*.23,.68,.43],.025,dark);
    const sill = box(body,[.1,.14,1.12],[side*.49,.48,-.09],dark); sill.rotation.y = side*.03;
    const headlight = box(body,[.25,.047,.04],[side*.255,.557,.855],whiteLight,.012); headlight.rotation.y = side*.17;
    box(body,[.22,.055,.04],[side*.29,.6,-.838],redLight,.012);
  }
  box(body,[1.14,.13,.16],[0,.35,1.01],dark);
  box(body,[.9,.1,.13],[0,.34,-1],dark);
  for (const side of [-1,1]) {
    const support = box(body,[.055,.36,.11],[side*.34,.87,-.84],gunmetal); support.rotation.x = -.22;
  }
  const wing = box(body,[1.46,.065,.37],[0,1.075,-.94],paint); wing.rotation.x = -.13;
  for (const side of [-1,1]) box(body,[.035,.19,.43],[side*.73,1.11,-.94],dark,.013);
  rod(body,[-.36,.75,-.6],[-.46,1.67,-.66],.009,dark);
  const antennaTip = new THREE.Mesh(new THREE.SphereGeometry(.025,8,6),paint); antennaTip.position.set(-.46,1.67,-.66); body.add(antennaTip);

  const wheels: THREE.Group[] = [], frontWheelPivots: THREE.Group[] = [];
  const matrix = new THREE.Object3D();
  for (const side of [-1,1]) for (const z of [-.67,.68]) {
    const x = side*.73;
    rod(car,[side*.29,.34,z-.16],[x,.37,z],.037,gunmetal);
    rod(car,[side*.29,.34,z+.16],[x,.37,z],.037,gunmetal);
    const bottom = new THREE.Vector3(side*.64,.4,z), top = new THREE.Vector3(side*.36,.75,z-.06);
    rod(body,bottom.toArray(),top.toArray(),.035,aluminum);
    const coilPoints: THREE.Vector3[] = [], delta = top.clone().sub(bottom);
    const coilAxis = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),delta.clone().normalize());
    for (let j = 0; j <= 64; j++) {
      const a = j / 64 * Math.PI * 12;
      coilPoints.push(new THREE.Vector3(Math.cos(a)*.066,j/64*delta.length(),Math.sin(a)*.066).applyQuaternion(coilAxis).add(bottom));
    }
    body.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(coilPoints),64,.012,5,false),gold));
    const pivot = new THREE.Group(); pivot.position.set(x,.375,z); car.add(pivot);
    const wheel = new THREE.Group(); wheel.name = `wheel-${side}-${z}`; pivot.add(wheel); wheels.push(wheel);
    if (z > 0) frontWheelPivots.push(pivot);
    const profile = [[.22,-.168],[.3,-.168],[.345,-.135],[.362,-.08],[.362,.08],[.345,.135],[.3,.168],[.22,.168]].map(([r,y])=>new THREE.Vector2(r,y));
    const tire = new THREE.Mesh(new THREE.LatheGeometry(profile,40),rubber); tire.rotation.z = Math.PI/2; wheel.add(tire);
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(.237,.237,.285,32),dark); rim.rotation.z = Math.PI/2; wheel.add(rim);
    for (const face of [-1,1]) {
      const lip = new THREE.Mesh(new THREE.TorusGeometry(.215,.018,8,32),aluminum); lip.rotation.y = Math.PI/2; lip.position.x = face*.151; wheel.add(lip);
    }
    const spokes = new THREE.InstancedMesh(new THREE.BoxGeometry(.032,.15,.035),aluminum,12);
    for (let i = 0; i < 12; i++) {
      const a = (i%6)/6*Math.PI*2;
      matrix.position.set(i<6?-.153:.153,Math.cos(a)*.12,Math.sin(a)*.12); matrix.rotation.set(a,0,0); matrix.updateMatrix(); spokes.setMatrixAt(i,matrix.matrix);
    }
    wheel.add(spokes);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(.067,.067,.33,6),gold); hub.rotation.z = Math.PI/2; wheel.add(hub);
    const tread = new THREE.InstancedMesh(new THREE.BoxGeometry(.145,.052,.067),treadMaterial,64);
    for (let i = 0; i < 64; i++) {
      const a = (i%32)/32*Math.PI*2 + (i<32?0:.065);
      matrix.position.set(i<32?-.083:.083,Math.cos(a)*.369,Math.sin(a)*.369);
      matrix.rotation.set(a,0,i<32?.19:-.19); matrix.updateMatrix(); tread.setMatrixAt(i,matrix.matrix);
    }
    wheel.add(tread);
  }
  function decal(text: string, width: number, height: number): THREE.Mesh {
    const canvas = document.createElement('canvas'); canvas.width=512; canvas.height=256;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle='#11191c'; ctx.fillRect(0,0,512,256);
    ctx.strokeStyle='#eff5de'; ctx.lineWidth=10; ctx.strokeRect(14,14,484,228);
    ctx.fillStyle='#eff5de'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font=`italic 900 ${text==='02'?208:118}px Arial`; ctx.fillText(text,256,135);
    const map = new THREE.CanvasTexture(canvas); map.colorSpace=THREE.SRGBColorSpace; map.anisotropy=4;
    return new THREE.Mesh(new THREE.PlaneGeometry(width,height),new THREE.MeshStandardMaterial({map,roughness:.38,polygonOffset:true,polygonOffsetFactor:-2}));
  }
  const number = decal('02',.34,.26); number.position.set(0,.697,.49); number.rotation.x=-Math.PI/2-.28; body.add(number);
  const sponsor = decal('revolt',.64,.23); sponsor.position.set(0,1.115,-.94); sponsor.rotation.x=-Math.PI/2-.13; body.add(sponsor);
  for (const side of [-1,1]) {
    const sideNumber=decal('02',.36,.19); sideNumber.position.set(side*.512,.595,-.25); sideNumber.rotation.y=side*Math.PI/2; body.add(sideNumber);
  }
  car.traverse(node=>{if(node instanceof THREE.Mesh){node.castShadow=true;node.receiveShadow=true;}});
  car.userData.wheels=wheels; car.userData.frontWheelPivots=frontWheelPivots; car.userData.body=body;
  return car;
}

