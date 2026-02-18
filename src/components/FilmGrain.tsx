import { useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const grainVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const grainFragmentShader = `
  precision highp float;
  uniform float uTime;
  uniform vec2 uResolution;
  varying vec2 vUv;

  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
  }

  float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  void main() {
    vec2 uv = vUv;
    vec2 screenUv = gl_FragCoord.xy / uResolution;

    // Multi-octave film grain
    float grain = 0.0;
    grain += random(screenUv * 1000.0 + uTime * 3.7) * 0.5;
    grain += noise(screenUv * 500.0 + uTime * 2.1) * 0.3;
    grain += noise(screenUv * 200.0 - uTime * 1.3) * 0.2;

    // Subtle vignette darkening at edges
    float vignette = 1.0 - smoothstep(0.4, 1.4, length(screenUv - 0.5) * 1.8);

    // Combine: mostly transparent with subtle grain
    float alpha = grain * 0.055 * vignette;

    // Very slight warm/cool color variation in grain
    vec3 color = mix(
      vec3(0.95, 0.9, 0.8),
      vec3(0.8, 0.85, 0.95),
      noise(screenUv * 50.0 + uTime * 0.5)
    );

    gl_FragColor = vec4(color, alpha);
  }
`;

function GrainPlane() {
  const { geometry, material, mesh } = useMemo(() => {
    const geo = new THREE.PlaneGeometry(2, 2);
    const mat = new THREE.ShaderMaterial({
      vertexShader: grainVertexShader,
      fragmentShader: grainFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      },
      transparent: true,
      depthWrite: false,
      depthTest: false,
    });
    const m = new THREE.Mesh(geo, mat);
    return { geometry: geo, material: mat, mesh: m };
  }, []);

  const { scene } = useThree();

  useEffect(() => {
    scene.add(mesh);
    return () => {
      scene.remove(mesh);
      geometry.dispose();
      material.dispose();
    };
  }, [scene, mesh, geometry, material]);

  useFrame(({ clock }) => {
    material.uniforms.uTime.value = clock.getElapsedTime();
    material.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
  });

  return null;
}

export function FilmGrain() {
  return (
    <div id="three-grain" aria-hidden="true">
      <Canvas
        gl={{ alpha: true, antialias: false, powerPreference: 'low-power' }}
        camera={{ position: [0, 0, 1] }}
        style={{ pointerEvents: 'none' }}
        dpr={1}
      >
        <GrainPlane />
      </Canvas>
    </div>
  );
}
