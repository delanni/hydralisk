/**
 * Catch-all Plugin for Hydralisk Extras & Overrides
 * ModulateHue HSV color combine function registration, custom window helpers,
 * and fallback overrides.
 */

if (typeof window !== "undefined" && window.HydraliskPlugins) {
  window.HydraliskPlugins.register({
    id: "hydralisk-extras",
    name: "Hydralisk Shader & Functional Extras",

    onHydraReady(hydra, app) {
      if (!hydra || typeof hydra.setFunction !== "function") return;

      // Register modulateHue as HSV color combination function
      try {
        hydra.setFunction({
          name: "modulateHue",
          type: "combine",
          inputs: [
            {
              type: "color",
              name: "color",
            },
            {
              type: "float",
              name: "amount",
              default: 1,
            },
          ],
          glsl: `
            vec3 _c0rgb = _c0.rgb;
            vec3 _c1rgb = _c1.rgb;
            vec3 _hsv0 = vec3(0.0);
            vec3 _hsv1 = vec3(0.0);

            // RGB to HSV conversion
            vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
            vec4 p0 = mix(vec4(_c0rgb.bg, K.wz), vec4(_c0rgb.gb, K.xy), step(_c0rgb.b, _c0rgb.g));
            vec4 q0 = mix(vec4(p0.xyw, _c0rgb.r), vec4(_c0rgb.r, p0.yzx), step(p0.x, _c0rgb.r));
            float d0 = q0.x - min(q0.w, q0.y);
            float e = 1.0e-10;
            _hsv0 = vec3(abs(q0.z + (q0.w - q0.y) / (6.0 * d0 + e)), d0 / (q0.x + e), q0.x);

            vec4 p1 = mix(vec4(_c1rgb.bg, K.wz), vec4(_c1rgb.gb, K.xy), step(_c1rgb.b, _c1rgb.g));
            vec4 q1 = mix(vec4(p1.xyw, _c1rgb.r), vec4(_c1rgb.r, p1.yzx), step(p1.x, _c1rgb.r));
            float d1 = q1.x - min(q1.w, q1.y);
            _hsv1 = vec3(abs(q1.z + (q1.w - q1.y) / (6.0 * d1 + e)), d1 / (q1.x + e), q1.x);

            // Shift hue of c0 based on hue of c1
            _hsv0.x = fract(_hsv0.x + _hsv1.x * amount);

            // HSV to RGB conversion
            vec4 K2 = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
            vec3 p2 = abs(fract(_hsv0.xxx + K2.xyz) * 6.0 - K2.www);
            vec3 rgb = _hsv0.z * mix(K2.xxx, clamp(p2 - K2.xxx, 0.0, 1.0), _hsv0.y);

            return vec4(rgb, _c0.a);
          `,
        });
        console.log("[hydralisk-extras] Registered modulateHue HSV combine function.");
      } catch (e) {
        console.warn("[hydralisk-extras] Could not register modulateHue:", e);
      }
    },
  });
}
