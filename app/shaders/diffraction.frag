#include <flutter/runtime_effect.glsl>

// --- Spectral Zucconi 6 --------------------------------------------

// Based on GPU Gems
// Optimised by Alan Zucconi

float saturate (float x)
{
    return min(1.0, max(0.0,x));
}

vec3 saturate (vec3 x)
{
    return min(vec3(1.,1.,1.), max(vec3(0.,0.,0.),x));
}

vec3 bump3y (vec3 x, vec3 yoffset)
{
    vec3 y = vec3(1.,1.,1.) - x * x;
    y = saturate(y-yoffset);
    return y;
}

vec3 spectral_zucconi6 (float x)
{
    const vec3 c1 = vec3(3.54585104, 2.93225262, 2.41593945);
    const vec3 x1 = vec3(0.69549072, 0.49228336, 0.27699880);
    const vec3 y1 = vec3(0.02312639, 0.15225084, 0.52607955);

    const vec3 c2 = vec3(3.90307140, 3.21182957, 3.96587128);
    const vec3 x2 = vec3(0.11748627, 0.86755042, 0.66077860);
    const vec3 y2 = vec3(0.84897130, 0.88445281, 0.73949448);

    return
    bump3y(c1 * (x - x1), y1) +
    bump3y(c2 * (x - x2), y2);
}

// --- Spectral Zucconi 6 --------------------------------------------

uniform vec2 resoltion;
uniform vec2 textureSize;
uniform vec2 offset;
uniform sampler2D texture0;

out vec4 fragColor;

const vec3 ambient = vec3(1., 1., 1.25);

void main() {
    vec2 uv = FlutterFragCoord().xy / resoltion;

    // --- 2D Bilinear -----------------------------------------------
    // This is equivalent to FilterQuality.low

    vec2 st = uv * textureSize - 0.5;

    vec2 iuv = floor( st );
    vec2 fuv = fract( st );

    vec4 a = texture(texture0, (iuv + vec2(0.5,0.5)) / textureSize);
    vec4 b = texture(texture0, (iuv + vec2(1.5,0.5)) / textureSize);
    vec4 c = texture(texture0, (iuv + vec2(0.5,1.5)) / textureSize);
    vec4 d = texture(texture0, (iuv + vec2(1.5,1.5)) / textureSize);

    vec4 clr = mix(
                    mix(a, b, fuv.x),
                    mix(c, d, fuv.x),
                    fuv.y);

    // --- 2D Bilinear -----------------------------------------------

    vec3 normal = normalize(clr.xyz * 2. - 1.);
    normal.x = 0. - normal.x;

    float dst = distance(uv, offset);
    vec3 dr = vec3(normalize(uv - offset), 1.);
    float dp = pow(dot(normal, dr), 2.);
    float cdst = (dst - (dp * .5));

    vec3 color = spectral_zucconi6(cdst);
    color = mix(color, ambient, .25);

    fragColor = vec4(color, 1.0);
}