/** WebGL simplex-noise trip patterns for the mystery sticker overlay. */

export const STICKER_TRIP_PATTERN_COUNT = 8;

export type TripShaderConfig = {
  id: number;
  durationMs: number;
  pattern: number;
  seed: number;
  speed: number;
  scale: number;
  intensity: number;
  phase: number;
  blendMode: string;
};

export const VERTEX_SHADER = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

export const FRAGMENT_SHADER = `
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_envelope;
uniform float u_pattern;
uniform float u_seed;
uniform float u_speed;
uniform float u_scale;
uniform float u_intensity;
uniform float u_phase;

vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 mod289(vec4 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x) {
  return mod289(((x * 34.0) + 1.0) * x);
}

vec4 taylorInvSqrt(vec4 r) {
  return 1.79284291400159 - 0.85373472095314 * r;
}

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod289(i);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

float perlin3(vec3 coord, float x) {
  return x * abs(snoise(coord));
}

vec3 classicNoiseColor(float n, vec2 uv) {
  return vec3(
    1.0 - (1.0 - sin(n + 5.0 * uv.x + u_seed)) / 2.0,
    1.0 - (1.0 - cos(n + 5.0 * uv.y + u_seed * 1.2 + u_phase)) / 2.0,
    1.0 - (1.0 + sin(n + 5.0 * uv.x + u_seed * 0.8 - u_phase)) / 2.0
  );
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  vec3 coord = vec3(uv * u_scale + u_seed * 0.07, -u_time * u_speed);
  float n = 0.0;
  vec3 color = vec3(0.0);
  float pat = floor(u_pattern + 0.5);

  if (pat < 0.5) {
    n = perlin3(coord, 10.0 + u_seed * 2.0);
    color = classicNoiseColor(n, uv);
  } else if (pat < 1.5) {
    float n1 = perlin3(coord, 10.0);
    float n2 = perlin3(coord + vec3(u_seed * 0.1, u_phase * 0.05, 0.0), n1 * 4.0);
    n = perlin3(coord * 1.35, n2 * 3.0);
    color = classicNoiseColor(n, uv * 1.2);
  } else if (pat < 2.5) {
    vec2 centered = uv * 2.0 - 1.0;
    centered.x *= u_resolution.x / max(u_resolution.y, 1.0);
    float r = length(centered);
    float a = atan(centered.y, centered.x);
    vec3 polar = vec3(r * (4.0 + u_seed * 0.05), a * 2.5, -u_time * u_speed);
    n = perlin3(polar, 12.0 + u_seed);
    color = vec3(
      0.5 + 0.5 * sin(n + r * 6.0 + u_phase),
      0.5 + 0.5 * cos(n * 1.2 + a * 3.0 + u_seed),
      0.5 + 0.5 * sin(n * 0.9 - r * 4.0 + u_phase * 1.3)
    );
  } else if (pat < 3.5) {
    n = sin(uv.x * (8.0 + u_seed * 0.2) + u_time * u_speed * 2.0 + u_phase);
    n += sin(uv.y * (9.0 + u_seed * 0.15) + u_time * u_speed * 1.6);
    n += sin((uv.x + uv.y) * (6.0 + u_seed * 0.1) + u_time * u_speed);
    n /= 3.0;
    color = vec3(
      sin(n * 3.14159) * 0.5 + 0.5,
      sin(n * 3.14159 + 2.094) * 0.5 + 0.5,
      sin(n * 3.14159 + 4.188) * 0.5 + 0.5
    );
  } else if (pat < 4.5) {
    float nr = perlin3(coord + vec3(u_seed, u_phase, 0.0), 10.0);
    float ng = perlin3(coord + vec3(0.0, u_seed * 1.7, u_phase), 10.0);
    float nb = perlin3(coord + vec3(u_phase, 0.0, u_seed * 2.1), 10.0);
    n = (nr + ng + nb) / 3.0;
    color = vec3(
      abs(nr) / 8.0,
      abs(ng) / 8.0,
      abs(nb) / 8.0
    );
    color = clamp(color, 0.0, 1.0);
  } else if (pat < 5.5) {
    float w = perlin3(coord, 18.0 + u_seed);
    n = sin(uv.x * 38.0 + w * 6.0 + u_seed + u_time * u_speed);
    n *= cos(uv.y * 32.0 + w * 5.0 - u_phase);
    color = vec3(
      0.5 + 0.5 * sin(n * 6.0 + u_phase),
      0.5 + 0.5 * cos(n * 5.0 + u_seed),
      0.5 + 0.5 * sin(n * 7.0 - u_phase * 0.7)
    );
  } else if (pat < 6.5) {
    vec2 warp = uv + vec2(
      perlin3(vec3(uv * (2.5 + u_seed * 0.03), u_time * u_speed * 0.4), 8.0),
      perlin3(vec3(uv * (2.5 + u_seed * 0.03) + 5.0, u_time * u_speed * 0.4), 8.0)
    ) * 0.18;
    vec3 warped = vec3(warp * u_scale, -u_time * u_speed);
    n = perlin3(warped, 10.0 + u_seed * 0.5);
    color = classicNoiseColor(n, warp);
  } else {
    n = perlin3(
      coord,
      perlin3(
        coord,
        perlin3(
          coord,
          perlin3(coord, 100.0 + u_seed * 3.0) * 4.0
        ) * 3.0
      ) * 2.0
    );
    color = vec3(
      0.5 + 0.5 * sin(n * 0.4 + uv.x * 8.0 + u_phase),
      0.5 + 0.5 * cos(n * 0.35 + uv.y * 7.0 + u_seed),
      0.5 + 0.5 * sin(n * 0.45 + (uv.x + uv.y) * 5.0)
    );
  }

  float alpha = u_intensity * u_envelope * (0.42 + 0.38 * abs(sin(n * 0.08 + u_phase)));
  alpha = clamp(alpha, 0.0, 0.88);
  color = clamp(color, 0.0, 1.0);
  gl_FragColor = vec4(color, alpha);
}
`;

const BLEND_MODES = ['screen', 'soft-light', 'overlay', 'lighten', 'plus-lighter'] as const;

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

export function buildTripShaderConfig(id: number): TripShaderConfig {
  return {
    id,
    durationMs: Math.floor(randomBetween(8_000, 14_000)),
    pattern: Math.floor(randomBetween(0, STICKER_TRIP_PATTERN_COUNT)),
    seed: randomBetween(0, 100),
    speed: randomBetween(0.35, 1.1),
    scale: randomBetween(1.8, 4.5),
    intensity: randomBetween(0.75, 1.0),
    phase: randomBetween(0, Math.PI * 2),
    blendMode: pick(BLEND_MODES),
  };
}

export function compileShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.warn('[sticker-trip] shader compile failed', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export function createStickerTripProgram(gl: WebGLRenderingContext) {
  const vs = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  if (!vs || !fs) return null;

  const program = gl.createProgram();
  if (!program) return null;

  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn('[sticker-trip] program link failed', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }

  return program;
}

export type StickerTripUniforms = {
  resolution: WebGLUniformLocation | null;
  time: WebGLUniformLocation | null;
  envelope: WebGLUniformLocation | null;
  pattern: WebGLUniformLocation | null;
  seed: WebGLUniformLocation | null;
  speed: WebGLUniformLocation | null;
  scale: WebGLUniformLocation | null;
  intensity: WebGLUniformLocation | null;
  phase: WebGLUniformLocation | null;
};

export function getStickerTripUniforms(
  gl: WebGLRenderingContext,
  program: WebGLProgram,
): StickerTripUniforms {
  return {
    resolution: gl.getUniformLocation(program, 'u_resolution'),
    time: gl.getUniformLocation(program, 'u_time'),
    envelope: gl.getUniformLocation(program, 'u_envelope'),
    pattern: gl.getUniformLocation(program, 'u_pattern'),
    seed: gl.getUniformLocation(program, 'u_seed'),
    speed: gl.getUniformLocation(program, 'u_speed'),
    scale: gl.getUniformLocation(program, 'u_scale'),
    intensity: gl.getUniformLocation(program, 'u_intensity'),
    phase: gl.getUniformLocation(program, 'u_phase'),
  };
}
