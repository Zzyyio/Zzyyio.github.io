#version 300 es
precision highp float;
uniform sampler2D a,b,obstacles;
uniform int mode;
uniform vec2 size,point,force,gridScale;
uniform vec2 hueRange;
uniform vec3 ink;
uniform float dt,decay,speedMax,radius,viscosity,vorticity;
out vec4 color;
bool solid(ivec2 p){ivec2 d=textureSize(obstacles,0);return any(lessThan(p,ivec2(0)))||any(greaterThanEqual(p,d))||texelFetch(obstacles,clamp(p,ivec2(0),d-1),0).r>.5;}
vec4 get(sampler2D t,ivec2 p){return texelFetch(t,clamp(p,ivec2(0),textureSize(t,0)-1),0);}
vec4 interp(sampler2D t,vec2 p){
 vec2 q=p-.5;ivec2 base=ivec2(floor(q));vec2 f=fract(q);vec4 total=vec4(0);float weight=0.;
 for(int j=0;j<2;j++)for(int i=0;i<2;i++){ivec2 cell=base+ivec2(i,j);float w=(i==0?1.-f.x:f.x)*(j==0?1.-f.y:f.y);if(!solid(cell)){total+=get(t,cell)*w;weight+=w;}}
 return total/max(weight,1e-6);
}
void main(){ivec2 p=ivec2(gl_FragCoord.xy);vec2 x=gl_FragCoord.xy;vec4 c=get(a,p);
// Solid appearance is rendered by the screen-resolution SVG layer.
if(mode!=7&&mode!=8&&solid(p)){color=vec4(0);return;}

// Approximate curl on the stored grid: omega = dv/dx - du/dy.
if(mode==11){float omega=.5*(get(a,p+ivec2(1,0)).y-get(a,p-ivec2(1,0)).y-get(a,p+ivec2(0,1)).x+get(a,p-ivec2(0,1)).x);color=vec4(omega,0,0,1);return;}
if(mode==12){
 vec2 gradient=.5*vec2(abs(get(b,p+ivec2(1,0)).x)-abs(get(b,p-ivec2(1,0)).x),abs(get(b,p+ivec2(0,1)).x)-abs(get(b,p-ivec2(0,1)).x));
 vec2 normal=gradient/max(length(gradient),1e-5);
 vec2 acceleration=vorticity*get(b,p).x*vec2(normal.y,-normal.x);
 // Limit only the added acceleration to prevent runaway feedback at high settings.
 acceleration*=min(1.,1000./max(length(acceleration/gridScale),1e-5));
 color=vec4(c.xy+dt*acceleration,0,1);return;
}
if(mode==10){color=c;return;}
if(mode==9){vec2 k=viscosity*dt*gridScale*gridScale;vec2 horizontal=get(a,p+ivec2(1,0)).xy+get(a,p-ivec2(1,0)).xy;vec2 vertical=get(a,p+ivec2(0,1)).xy+get(a,p-ivec2(0,1)).xy;vec2 v=(get(b,p).xy+k.x*horizontal+k.y*vertical)/(1.+2.*(k.x+k.y));if(solid(p+ivec2(1,0)))v.x=0.;if(solid(p+ivec2(0,1)))v.y=0.;color=vec4(v,0,1);return;}
if(mode==0){vec2 target=x-dt*get(b,p).xy;vec2 delta=target-x;
// Stop backtraces at the first solid cell, including thin obstacle crossings.
float steps=clamp(ceil(length(delta)*2.),1.,512.);vec2 safe=x;
for(int i=1;i<=512;i++){if(float(i)>steps)break;vec2 q=x+delta*(float(i)/steps);if(solid(ivec2(floor(q))))break;safe=q;}
color=interp(a,safe)*exp(-decay*dt);return;}
if(mode==1){vec2 offset=(x-point)/gridScale;float w=exp(-dot(offset,offset)/(radius*radius));color=c+vec4(force,0,0)*w;return;}
if(mode==2){vec2 offset=(x-point)/gridScale;float w=exp(-dot(offset,offset)/(radius*radius));color=vec4(min(c.rgb+ink*w,vec3(8)),1);return;}
// Face velocities: x/y store the right/top face flux. Left/bottom exterior flux is zero.
if(mode==3){vec2 v=c.xy;float l=p.x==0?0.:get(a,p-ivec2(1,0)).x;float d=p.y==0?0.:get(a,p-ivec2(0,1)).y;color=vec4(v.x-l+v.y-d,0,0,1);return;}
if(mode==4){float sum=0.;float n=0.;if(!solid(p-ivec2(1,0))){sum+=get(a,p-ivec2(1,0)).x;n++;}if(!solid(p-ivec2(0,1))){sum+=get(a,p-ivec2(0,1)).x;n++;}if(!solid(p+ivec2(1,0))){sum+=get(a,p+ivec2(1,0)).x;n++;}if(!solid(p+ivec2(0,1))){sum+=get(a,p+ivec2(0,1)).x;n++;}color=vec4((sum-get(b,p).x)/max(n,1.),0,0,1);return;}
if(mode==5){float pressure=get(b,p).x;vec2 v=c.xy-vec2(get(b,p+ivec2(1,0)).x-pressure,get(b,p+ivec2(0,1)).x-pressure);if(solid(p+ivec2(1,0)))v.x=0.;if(solid(p+ivec2(0,1)))v.y=0.;color=vec4(v,0,1);return;}
if(mode==6){if(solid(p+ivec2(1,0)))c.x=0.;if(solid(p+ivec2(0,1)))c.y=0.;color=c;return;}
vec2 uv=gl_FragCoord.xy/vec2(textureSize(b,0)); // display uses normalized coordinates supplied via canvas size
vec4 sampleValue=interp(a,gl_FragCoord.xy/size*vec2(textureSize(a,0)));
if(mode==7){float t=clamp(length(sampleValue.xy/gridScale)/speedMax,0.,1.);float hue=mix(hueRange.x,hueRange.y,t);vec3 rgb=clamp(abs(fract(vec3(hue)+vec3(0.,2./3.,1./3.))*6.-3.)-1.,0.,1.);color=vec4(rgb,1);}
else color=vec4(1.-exp(-sampleValue.rgb),1);
}
