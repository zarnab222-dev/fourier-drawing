# little hungers

A local browser toy. Scatter edible notes. Pull and release soft creatures.
Their meals become phrases. Feeding produces offspring. Fast collisions combine
creatures and interleave their phrases. Nearby creatures can exchange notes.

Run `node server.cjs` from this directory. Open http://127.0.0.1:4186.
The toy also works when `index.html` is served by another static web server.
It has no external assets, network services, or package dependencies.

Run `node verify.cjs` for the simulation check. This checks growth, inherited
phrases, fusion, population limits, numerical stability, narrow layout bounds,
and reset. The canvas interaction and 390 × 844 layout were also checked in a
running browser. Audio uses browser synthesis and starts only after a gesture.

The original Fourier Drawing app is separate and unchanged.
