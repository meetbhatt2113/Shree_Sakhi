/* Native WebGL health illustrations. No CDN, account, tracking or model downloads. */
(() => {
  'use strict';
  const topics = {
    cycle: {title:'Get to know your cycle.', text:'Explore periods and PCOS at your pace. This simplified illustration shows the uterus, fallopian tubes and ovaries.', link:'periods.html', action:'Explore periods & PCOS', name:'Simplified reproductive system illustration'},
    pregnancy: {title:'A little clarity, every step.', text:'Explore pregnancy questions and care information. This abstract maternity sculpture is an illustration, not a fetal development model.', link:'pregnancy.html', action:'Explore pregnancy', name:'Abstract pregnant person sculpture'},
    wellbeing: {title:'Make space for how you feel.', text:'Explore emotional wellbeing and ways to find support. The heart is a symbol of care, not an anatomical model.', link:'wellbeing.html', action:'Explore wellbeing', name:'Three dimensional heart symbol'}
  };
  const pink=[.88,.38,.57], blush=[1,.67,.73], plum=[.57,.35,.79], cream=[1,.84,.65];
  function geometry(mode, lightweight=false){
    const a=[];
    const add=(p,n,c)=>a.push(...p,...n,...c);
    function mesh(fn,c,U=36,V=22){
      if(lightweight){U=Math.max(10,Math.round(U*.45));V=Math.max(8,Math.round(V*.45));}
      const point=(u,v)=>fn(u,v);
      function vertex(u,v){
        const p=point(u,v),e=.0001,pu=point(u+e,v),pv=point(u,v+e);
        const x=pu.map((q,i)=>q-p[i]),y=pv.map((q,i)=>q-p[i]);
        let n=[x[1]*y[2]-x[2]*y[1],x[2]*y[0]-x[0]*y[2],x[0]*y[1]-x[1]*y[0]];
        let l=Math.hypot(...n)||1;n=n.map(q=>q/l);return [p,n];
      }
      for(let i=0;i<U;i++)for(let j=0;j<V;j++){
        const q=[[i/U,j/V],[(i+1)/U,j/V],[(i+1)/U,(j+1)/V],[i/U,(j+1)/V]].map(([u,v])=>vertex(u,v));
        for(const k of [0,1,2,0,2,3])add(q[k][0],q[k][1],c);
      }
    }
    function ball(x,y,z,sx,sy,sz,c){mesh((u,v)=>{let t=u*Math.PI*2,p=(.0001+v*.9998)*Math.PI;return [x+sx*Math.cos(t)*Math.sin(p),y+sy*Math.cos(p),z+sz*Math.sin(t)*Math.sin(p)]},c)}
    function tube(points,r,c){
      const center=t=>{const s=1-t;return [0,1,2].map(k=>s*s*s*points[0][k]+3*s*s*t*points[1][k]+3*s*t*t*points[2][k]+t*t*t*points[3][k])};
      mesh((u,v)=>{const p=center(u),q=center(u+.0001);let dx=q[0]-p[0],dy=q[1]-p[1],l=Math.hypot(dx,dy)||1;const t=v*Math.PI*2;return [p[0]-dy/l*r*Math.cos(t),p[1]+dx/l*r*Math.cos(t),p[2]+r*Math.sin(t)]},c,40,14);
    }
    function torus(R,r,y,c){mesh((u,v)=>{const t=u*2*Math.PI,s=v*2*Math.PI;return [(R+r*Math.cos(s))*Math.cos(t),y+r*Math.sin(s),(R+r*Math.cos(s))*Math.sin(t)]},c,64,12)}
    if(mode==='cycle'){
      // Stylized closed uterine body with tapering lower section; no pathology representation.
      mesh((u,v)=>{let t=u*Math.PI*2;let y=.58-v*1.65;let w=.10+.66*Math.pow(Math.max(0,Math.sin(Math.PI*v)),.6)*(1-.78*v);return [w*Math.cos(t),y,.63*w*Math.sin(t)]},pink,48,40);
      ball(0,.42,0,.53,.26,.31,pink);
      for(const s of [-1,1]){
        tube([[s*.33,.47,0],[s*1,.96,0],[s*1.78,.83,0],[s*1.54,.28,0]],.105,blush);
        ball(s*1.44,.04,.015,.30,.20,.20,cream);
        for(let i=0;i<4;i++)tube([[s*1.54,.30,0],[s*(1.65+i*.035),.23,.03],[s*(1.70-i*.07),.08,.07],[s*(1.40+i*.09),.025,.12]],.028,blush);
      }
      ball(0,-1.03,0,.115,.19,.105,blush);
      torus(1.42,.045,-1.47,plum);
    }else if(mode==='pregnancy'){
      ball(-.08,1.12,0,.27,.32,.26,cream);
      ball(-.04,.45,0,.38,.51,.27,plum);
      ball(.13,-.02,.20,.52,.62,.45,blush);
      ball(-.04,-.62,0,.39,.48,.29,plum);
      tube([[-.34,.65,0],[-.83,.29,.05],[-.57,-.14,.49],[.15,-.25,.60]],.115,cream);
      tube([[.28,.62,0],[.72,.29,.08],[.62,-.03,.51],[.19,-.16,.62]],.10,cream);
      for(const s of [-1,1]){tube([[s*.19,-.71,0],[s*.21,-.92,0],[s*.23,-1.14,0],[s*.27,-1.40,.02]],.12,plum);ball(s*.27,-1.4,.09,.15,.08,.23,plum)}
      torus(1.02,.047,-1.52,blush);
    }else{
      mesh((u,v)=>{const t=u*2*Math.PI,rr=Math.sin(v*Math.PI);const x=16*Math.pow(Math.sin(t),3)/15;const y=(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t))/15;return [rr*x,rr*y+.17,.43*Math.cos(v*Math.PI)]},pink,80,36);
      torus(1.23,.045,-1.40,plum);
      ball(1.30,.83,-.05,.14,.14,.14,cream);ball(-1.23,.35,.08,.10,.10,.10,blush);
    }
    return new Float32Array(a);
  }
  document.querySelectorAll('[data-health-3d]').forEach(root=>{
    const canvas=root.querySelector('canvas'),status=root.querySelector('.health-status');
    const gl=canvas.getContext('webgl',{alpha:true,antialias:true,preserveDrawingBuffer:true});
    const soft=gl?null:canvas.getContext('2d');
    let mode=root.getAttribute('data-health-3d')||'cycle';if(!topics[mode])mode='cycle';
    function text(){const t=topics[mode];root.querySelector('.health-title').textContent=t.title;root.querySelector('.health-description').textContent=t.text;const link=root.querySelector('.health-link');link.href=t.link;link.textContent=t.action+' ↗';canvas.setAttribute('aria-label',t.name+'. Drag horizontally or use the rotation buttons.');root.querySelectorAll('[data-topic]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.topic===mode)))}
    text();
    if(!gl && !soft){status.textContent='3D is unavailable on this browser. You can still explore every topic below.';root.classList.add('health-fallback');root.querySelectorAll('[data-topic]').forEach(b=>b.addEventListener('click',()=>{mode=b.dataset.topic;text()}));return}
    function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s}
    let prog;
    if(gl)try{
      prog=gl.createProgram();gl.attachShader(prog,shader(gl.VERTEX_SHADER,`attribute vec3 p,n,c;uniform mat3 rot;uniform float aspect,zoom;varying vec3 N,C,P;void main(){vec3 q=rot*p;N=rot*n;C=c;P=q;q.z-=zoom;gl_Position=vec4(q.x*1.95/aspect,q.y*1.95,-1.002*q.z-.2002,-q.z);}`));
      gl.attachShader(prog,shader(gl.FRAGMENT_SHADER,`precision mediump float;varying vec3 N,C,P;void main(){vec3 normal=normalize(N);if(!gl_FrontFacing)normal=-normal;vec3 light=normalize(vec3(-.6,1.,2.));float d=max(dot(normal,light),0.);vec3 view=normalize(vec3(0.,0.,6.)-P);float spec=pow(max(dot(normal,normalize(light+view)),0.),36.);vec3 col=C*(.55+.52*d)+vec3(.22)*spec;gl_FragColor=vec4(col,1.);}`));gl.linkProgram(prog);if(!gl.getProgramParameter(prog,gl.LINK_STATUS))throw Error('Could not link 3D renderer');
    }catch(e){status.textContent='3D could not load. Topic guides remain available.';root.classList.add('health-fallback');return}
    if(gl){gl.useProgram(prog);gl.enable(gl.DEPTH_TEST);gl.clearColor(0,0,0,0);}
    const buf=gl?gl.createBuffer():null;if(gl)gl.bindBuffer(gl.ARRAY_BUFFER,buf);
    if(gl)for(const [i,name] of ['p','n','c'].entries()){const at=gl.getAttribLocation(prog,name);gl.enableVertexAttribArray(at);gl.vertexAttribPointer(at,3,gl.FLOAT,false,36,i*12)}
    const uniforms=gl?Object.fromEntries(['rot','aspect','zoom'].map(n=>[n,gl.getUniformLocation(prog,n)])):{};
    let meshData=null;root.dataset.renderer=gl?'webgl':'software-3d';
    let count=0,yaw=-.18,pitch=.06,zoom=5.4,frame=0,visible=true,last=0;
    const reduced=matchMedia('(prefers-reduced-motion: reduce)');let spin=false;
    function upload(){meshData=geometry(mode,!gl);if(gl)gl.bufferData(gl.ARRAY_BUFFER,meshData,gl.STATIC_DRAW);count=meshData.length/9;root.dataset.rendered=mode;draw()}
    function draw(){
      const b=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,1.75),w=Math.max(1,Math.round(b.width*dpr)),h=Math.max(1,Math.round(b.height*dpr));
      if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}if(gl){gl.viewport(0,0,w,h);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT)}
      const c=Math.cos(yaw),s=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);
      if(!gl){paintSoftware(meshData,w,h,yaw,pitch,zoom);return}
      gl.uniformMatrix3fv(uniforms.rot,false,new Float32Array([c,sp*s,-cp*s,0,cp,sp,s,-sp*c,cp*c]));gl.uniform1f(uniforms.aspect,w/h);gl.uniform1f(uniforms.zoom,zoom);gl.drawArrays(gl.TRIANGLES,0,count);
    }
    function paintSoftware(data,w,h,yaw,pitch,zoom){
      if(!data)return;soft.clearRect(0,0,w,h);
      const c=Math.cos(yaw),s=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);
      const rotate=(x,y,z)=>[c*x+s*z,sp*s*x+cp*y-sp*c*z,-cp*s*x+sp*y+cp*c*z];
      const vertices=[];
      for(let i=0;i<data.length;i+=9){const q=rotate(data[i],data[i+1],data[i+2]);vertices.push({x:w/2+q[0]*.975*h/(zoom-q[2]),y:h/2-q[1]*.975*h/(zoom-q[2]),z:q[2],p:q,n:rotate(data[i+3],data[i+4],data[i+5]),c:[data[i+6],data[i+7],data[i+8]]})}
      const faces=[];for(let i=0;i<vertices.length;i+=3){const a=vertices[i],b=vertices[i+1],c=vertices[i+2];faces.push({a,b,c,z:(a.z+b.z+c.z)/3})}faces.sort((a,b)=>a.z-b.z);
      for(const f of faces){let n=f.a.n.map((v,i)=>(v+f.b.n[i]+f.c.n[i])/3);let len=Math.hypot(...n)||1;n=n.map(v=>v/len);if(n[2]<0)n=n.map(v=>-v);const d=Math.max(0,(-.6*n[0]+n[1]+2*n[2])/Math.sqrt(5.36)),light=.55+.52*d;const rgb=f.a.c.map(v=>Math.round(Math.min(1,v*light)*255));soft.fillStyle=`rgb(${rgb.join(',')})`;soft.beginPath();soft.moveTo(f.a.x,f.a.y);soft.lineTo(f.b.x,f.b.y);soft.lineTo(f.c.x,f.c.y);soft.closePath();soft.fill();}
    }
    function tick(t){frame=0;if(!spin||!visible||document.hidden)return;yaw+=Math.min(t-last,40)*.00025;last=t;draw();frame=requestAnimationFrame(tick)}
    function schedule(){if(spin&&visible&&!document.hidden&&!frame){last=performance.now();frame=requestAnimationFrame(tick)}}
    root.querySelectorAll('[data-topic]').forEach(b=>b.addEventListener('click',()=>{mode=b.dataset.topic;yaw=mode==='pregnancy'?-.42:-.18;pitch=.06;text();upload()}));
    root.querySelectorAll('[data-turn]').forEach(b=>b.addEventListener('click',()=>{yaw+=Number(b.dataset.turn);draw()}));
    root.querySelectorAll('[data-zoom]').forEach(b=>b.addEventListener('click',()=>{zoom=Math.min(7,Math.max(4,zoom+Number(b.dataset.zoom)));draw()}));
    const spinBtn=root.querySelector('[data-spin]');spinBtn.addEventListener('click',()=>{spin=!spin;spinBtn.setAttribute('aria-pressed',String(spin));spinBtn.textContent=spin?'Pause rotation':'Auto rotate';if(!spin){cancelAnimationFrame(frame);frame=0}else schedule()});
    root.querySelector('[data-reset]').addEventListener('click',()=>{yaw=-.18;pitch=.06;zoom=5.4;draw()});
    let drag=null;canvas.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,id:e.pointerId};canvas.setPointerCapture(e.pointerId)});
    canvas.addEventListener('pointermove',e=>{if(!drag)return;yaw+=(e.clientX-drag.x)*.012;pitch=Math.max(-.7,Math.min(.7,pitch+(e.clientY-drag.y)*.006));drag.x=e.clientX;drag.y=e.clientY;draw()});
    for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,()=>drag=null);
    canvas.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();if(e.key==='ArrowLeft')yaw-=.15;if(e.key==='ArrowRight')yaw+=.15;if(e.key==='ArrowUp')pitch=Math.max(-.7,pitch-.1);if(e.key==='ArrowDown')pitch=Math.min(.7,pitch+.1);draw()});
    new ResizeObserver(draw).observe(canvas);
    new IntersectionObserver(([e])=>{visible=e.isIntersecting;if(!visible){cancelAnimationFrame(frame);frame=0}else schedule()}).observe(root);
    document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0}else schedule()});
    canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();spin=false;cancelAnimationFrame(frame);root.classList.add('health-fallback');status.textContent='3D paused by your device. Reload to restore it; topic guides remain available.'});
    reduced.addEventListener('change',()=>{if(reduced.matches){spin=false;cancelAnimationFrame(frame);frame=0;spinBtn.textContent='Auto rotate';spinBtn.setAttribute('aria-pressed','false')}});
    status.textContent='Drag to rotate · use arrow keys or controls';upload();
  });
})();
