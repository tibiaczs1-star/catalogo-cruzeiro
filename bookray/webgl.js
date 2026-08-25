(() => {
  const canvas = document.querySelector(".hero-webgl");
  if (!canvas) return;

  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const coarsePointer = matchMedia("(pointer: coarse)");
  if (reduceMotion.matches || coarsePointer.matches || navigator.connection?.saveData) return;

  const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: false,
    depth: false,
    powerPreference: "low-power",
    preserveDrawingBuffer: false,
  });
  if (!gl) return;

  const vertexSource = `
    attribute vec2 position;
    varying vec2 uv;
    void main() {
      uv = position * 0.5 + 0.5;
      gl_Position = vec4(position, 0.0, 1.0);
    }
  `;

  const fragmentSource = `
    precision mediump float;
    varying vec2 uv;
    uniform float time;
    uniform vec2 pointer;
    uniform vec2 resolution;

    float grain(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
      vec2 p = uv;
      p.x *= resolution.x / max(resolution.y, 1.0);
      vec2 focus = vec2(0.76 + (pointer.x - 0.5) * 0.08, 0.32 + (pointer.y - 0.5) * 0.05);
      focus.x *= resolution.x / max(resolution.y, 1.0);

      float glow = smoothstep(0.72, 0.0, distance(p, focus));
      float ribbon = sin((p.x * 2.4 + p.y * 3.1) + time * 0.18) * 0.5 + 0.5;
      ribbon *= smoothstep(0.68, 0.08, abs(p.y - (0.42 + sin(p.x * 2.0 + time * 0.12) * 0.08)));
      float texture = grain(gl_FragCoord.xy + time) * 0.035;

      vec3 signal = vec3(0.95, 0.09, 0.035);
      vec3 gold = vec3(0.96, 0.70, 0.20);
      vec3 color = mix(signal, gold, ribbon * 0.34);
      float alpha = glow * (0.10 + ribbon * 0.09) + texture;
      gl_FragColor = vec4(color, alpha);
    }
  `;

  function compile(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  const vertex = compile(gl.VERTEX_SHADER, vertexSource);
  const fragment = compile(gl.FRAGMENT_SHADER, fragmentSource);
  if (!vertex || !fragment) return;

  const program = gl.createProgram();
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;

  gl.useProgram(program);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
    gl.STATIC_DRAW,
  );
  const position = gl.getAttribLocation(program, "position");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  const timeUniform = gl.getUniformLocation(program, "time");
  const pointerUniform = gl.getUniformLocation(program, "pointer");
  const resolutionUniform = gl.getUniformLocation(program, "resolution");
  const pointer = { x: 0.5, y: 0.5 };
  const startedAt = performance.now();
  let frame = 0;
  let active = true;

  function resize() {
    const bounds = canvas.getBoundingClientRect();
    const ratio = Math.min(devicePixelRatio || 1, 1.5);
    const width = Math.max(1, Math.round(bounds.width * ratio));
    const height = Math.max(1, Math.round(bounds.height * ratio));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
    }
  }

  function draw(now) {
    if (!active) return;
    resize();
    gl.uniform1f(timeUniform, (now - startedAt) / 1000);
    gl.uniform2f(pointerUniform, pointer.x, pointer.y);
    gl.uniform2f(resolutionUniform, canvas.width, canvas.height);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    frame = requestAnimationFrame(draw);
  }

  addEventListener(
    "pointermove",
    (event) => {
      pointer.x = event.clientX / innerWidth;
      pointer.y = 1 - event.clientY / innerHeight;
    },
    { passive: true },
  );

  document.addEventListener("visibilitychange", () => {
    active = !document.hidden;
    cancelAnimationFrame(frame);
    if (active) frame = requestAnimationFrame(draw);
  });

  document.documentElement.classList.add("webgl-ready");
  frame = requestAnimationFrame(draw);
})();
