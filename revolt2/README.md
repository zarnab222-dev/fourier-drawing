# revolt / 02

An original single-player RC arcade racer. Three laps, three rivals, one workshop circuit.

## Run

Use `npm install`, then `npm run dev`. Use `npm run build` for TypeScript validation and the production bundle.

## Controls

- WASD or arrows: accelerate, brake/reverse, steer.
- Space: drift. Shift: rechargeable boost.
- R: recover to the track. Escape: pause.
- Touch buttons provide steering, throttle, brake, and boost.

## Structure

`src/world.ts` creates the original procedural workshop and cars. `src/main.ts` runs driving at 120 simulation steps per second, race progress, audio, and camera updates. `src/style.css` styles the interface.

TypeScript's `Mode` union constrains valid race states during type checking. It disappears from the built JavaScript. Three.js vectors, meshes, and renderer calls remain and execute through browser WebGL. DOM element types catch incorrect property access before build; they do not validate HTML at runtime.

Physics use longitudinal acceleration and separate lateral traction. Drift reduces lateral grip. This is an arcade model on a flat circuit, not a suspension or rigid-body simulator. The game has no multiplayer or campaign.

Design adaptations: paint choices update the visible car, so the choice has an explicit destination. Bounded body roll shows steering force. All geometry and labels are original. No game assets from the references are included.

Vercel project: revolt2. Requested production domain: revolt2.shin86.dev. Deploy from this directory with `npx vercel deploy --prod`. The Vercel project is disconnected from the parent repository to avoid deploying the unrelated root app.

## Visual revision

The garage now uses a close camera and an optional circuit overview. `car.ts` builds shaped body sections, clearcoat paint, treaded tires, and detailed suspension. `materials.ts` creates seeded surface textures. `presentation.ts` adds environment reflections, restrained bloom, vignette, dust, and a bounded pool of drift marks. Fonts are bundled locally.

The `Section` tuple in `car.ts` names four numbers for each body cross section. This type exists only during checking. The generated vertex buffers remain at runtime and are uploaded to WebGL. Instanced meshes reuse geometry for repeated details while supplying a separate transform for each instance.

Validation: production build and `node tools/check-game.mjs`; browser inspection of garage, circuit overview, race HUD, paint selection, and 390px phone layout. The simulation completes three laps and checks pause, recovery, restart, and track containment.
