(function () {
    "use strict";
  
    const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
    const lerp = (a, b, t) => a + (b - a) * t;
    const ease = (t) => t * t * (3 - 2 * t);
    const dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
    const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  
    function drawHeart(ctx, x, y, size, color, stroke) {
      ctx.save();
      ctx.translate(Math.round(x), Math.round(y));
      ctx.scale(size, size);
      ctx.beginPath();
      ctx.moveTo(0, -0.3);
      ctx.bezierCurveTo(0, -0.6, -0.4, -0.6, -0.5, -0.35);
      ctx.bezierCurveTo(-0.8, 0.1, -0.2, 0.45, 0, 0.7);
      ctx.bezierCurveTo(0.2, 0.45, 0.8, 0.1, 0.5, -0.35);
      ctx.bezierCurveTo(0.4, -0.6, 0, -0.6, 0, -0.3);
      if (color) { ctx.fillStyle = color; ctx.fill(); }
      if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 0.06; ctx.stroke(); }
      ctx.restore();
    }
  
    class Confetti {
      constructor(x, y) {
        this.x = x; this.y = y;
        this.size = 3 + Math.random() * 4;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = -Math.random() * 5 - 2;
        this.rot = Math.random() * Math.PI * 2;
        this.rotSpeed = (Math.random() - 0.5) * 0.25;
        this.color = ["#ff6fa3","#ffb3c7","#ffd1dc","#ffb86c","#ff8fb1"][(Math.random()*5)|0];
        this.alpha = 1; this.life = 0;
      }
      update(dt, g) {
        this.vy += g * dt;
        this.x += this.vx * dt * 60;
        this.y += this.vy * dt * 60;
        this.rot += this.rotSpeed * dt * 60;
        this.life += dt;
        this.alpha = clamp(1 - this.life / 3.2, 0, 1);
      }
      draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.translate(this.x|0, this.y|0);
        ctx.rotate(this.rot);
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);
        ctx.restore();
      }
    }
  
    class Petal {
      constructor(w, h) {
        this.x = Math.random() * w;
        this.y = -20 - Math.random() * 100;
        this.vx = -12 + Math.random() * 24;
        this.vy = 18 + Math.random() * 26;
        this.ang = Math.random() * Math.PI * 2;
        this.spin = (Math.random() - 0.5) * 1.2;
        this.color = Math.random() < 0.6 ? "#ffc1d8" : "#ffe0eb";
        this.size = 4 + Math.random() * 4;
        this.life = 0;
      }
      update(dt, w, h) {
        this.ang += this.spin * dt;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.vx += Math.sin(this.ang * 1.2) * 2 * dt;
        this.life += dt;
        if (this.y > h + 30) this.life = 999;
      }
      draw(ctx) {
        ctx.save();
        ctx.translate(this.x|0, this.y|0);
        ctx.rotate(this.ang);
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.size * 0.8, this.size, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  
    class HeartParticle {
      constructor(x, y, tx, ty, color) {
        this.x = x; this.y = y; this.sx = x; this.sy = y;
        this.tx = tx; this.ty = ty; this.t = 0;
        this.speed = 0.8 + Math.random() * 0.6;
        this.color = color; this.size = 12 + Math.random()*8;
        this.done = false; this.wob = Math.random()*Math.PI*2;
      }
      update(dt) {
        if (this.done) return;
        this.t += dt / this.speed;
        if (this.t >= 1) { this.t = 1; this.done = true; }
        const e = ease(this.t);
        this.x = lerp(this.sx, this.tx, e);
        this.y = lerp(this.sy, this.ty, e) - Math.sin(e * Math.PI) * 20;
        this.wob += dt * 7;
      }
      draw(ctx) {
        const s = (this.size/20) * (1 + Math.sin(this.wob) * 0.08);
        drawHeart(ctx, this.x, this.y, s, this.color, "#00000022");
      }
    }
  
    class Emote {
      constructor(x, y, type) {
        this.x = x; this.y = y; this.t = 0; this.type = type; this.life = 1.1;
      }
      update(dt) { this.t += dt; }
      get done() { return this.t >= this.life; }
      draw(ctx) {
        const k = 1 - clamp(this.t / this.life, 0, 1);
        const y = this.y - (1 - k) * 30;
        const a = k;
        ctx.save();
        ctx.globalAlpha = a;
        if (this.type === "heart") drawHeart(ctx, this.x, y, 0.9, "#ff6fa3", "#b33c69");
        else drawHeart(ctx, this.x, y, 0.8, "#ffd1dc", "#bf6b86");
        ctx.restore();
      }
    }
  
    class InputManager {
      constructor() {
        this.pressed = new Set();
        this._onKeyDown = (e) => {
          const k = e.key;
          this.pressed.add(k);
          if (["ArrowLeft", "ArrowRight", " ", "k", "l", "i", "o", "a", "d", "f", "g", "q", "e"].includes(k)) e.preventDefault();
        };
        this._onKeyUp = (e) => this.pressed.delete(e.key);
        window.addEventListener("keydown", this._onKeyDown);
        window.addEventListener("keyup", this._onKeyUp);
      }
      isDown(key) { return this.pressed.has(key); }
      pressKey(key) { if (key) this.pressed.add(key); }
      releaseKey(key) { if (key) this.pressed.delete(key); }
    }
  
    class Player {
      constructor({ name, role, tint, x, y, facing, controls }) {
        this.name = name; this.role = role;
        this.tint = tint;
        this.x = x; this.y = y;
        this.width = 120; this.height = 150;
        this.speed = 150;
        this.facing = facing || 1;
        this.controls = controls;
  
        this.kissCooldown = 0.8;
        this.hugCooldown = 1.4;
        this.blowCooldown = 0.9;
        this.heartCooldown = 1.2;
  
        this.lastKissAt = -Infinity;
        this.lastHugAt = -Infinity;
        this.lastBlowAt = -Infinity;
        this.lastHeartAt = -Infinity;
  
        this.animTime = 0;
        this.action = "idle"; // idle | kiss | hug | blow | heart
        this.actionT = 0;
        this.expressionTime = 0;
        this.blinkT = 0.6 + Math.random() * 2.4;
        this.blinkDur = 0;
        this.eyeLook = 0;
        this.joy = 0;
  
        this.armReach = 0;
  
        // Reaction to received love
        this.reactType = null; // 'kiss' | 'hug' | 'blow' | 'heart'
        this.reactT = 0;
        this.reactDur = 0;
      }
      setSize(h) {
        this.height = h;
        this.width = h * 0.8;
        this.speed = 140 + (h - 140) * 0.25;
      }
      getCenter() { return { x: this.x + this.width/2, y: this.y + this.height/2 }; }
  
      canKiss(now) { return now - this.lastKissAt >= this.kissCooldown; }
      canHug(now) { return now - this.lastHugAt >= this.hugCooldown; }
      canBlow(now) { return now - this.lastBlowAt >= this.blowCooldown; }
      canHeart(now) { return now - this.lastHeartAt >= this.heartCooldown; }
  
      performKiss(now) { this.lastKissAt = now; this.action = "kiss"; this.actionT = 0; this.expressionTime = 0.5; this.joy = Math.min(1, this.joy + 0.4); }
      performHug(now) { this.lastHugAt = now; this.action = "hug"; this.actionT = 0; this.expressionTime = 0.7; this.joy = Math.min(1, this.joy + 0.6); }
      performBlow(now) { this.lastBlowAt = now; this.action = "blow"; this.actionT = 0; this.expressionTime = 0.45; this.joy = Math.min(1, this.joy + 0.35); }
      performHeart(now) { this.lastHeartAt = now; this.action = "heart"; this.actionT = 0; this.expressionTime = 0.6; this.joy = Math.min(1, this.joy + 0.5); }
  
      receiveLove(type) {
        this.reactType = type;
        this.reactT = 0;
        this.reactDur = type === "hug" ? 0.5 : 0.35;
      }
  
      updateHuman(input, dt, bounds) {
        let h = 0;
        if (input.isDown(this.controls.left)) h -= 1;
        if (input.isDown(this.controls.right)) h += 1;
        this.x += h * this.speed * dt;
        if (h !== 0) this.facing = Math.sign(h);
        this.x = clamp(this.x, bounds.left, bounds.right - this.width);
      }
  
      update(dt, targetCenter) {
        this.animTime += dt;
        this.joy = Math.max(0, this.joy - dt * 0.25);
        if (this.expressionTime > 0) this.expressionTime -= dt;
        if (this.blinkDur > 0) { this.blinkDur -= dt; }
        else { this.blinkT -= dt; if (this.blinkT <= 0) { this.blinkDur = 0.1; this.blinkT = 1.6 + Math.random() * 2.6; } }
  
        // Action timing and reach curve
        if (this.action !== "idle") {
          const total = this.action === "kiss" ? 0.9 : this.action === "hug" ? 1.3 : this.action === "blow" ? 0.8 : 1.0;
          this.actionT += dt / total;
          if (this.actionT >= 1) { this.actionT = 0; this.action = "idle"; }
        }
        const reachIn = this.action === "kiss" ? 0.5 : this.action === "hug" ? 0.6 : this.action === "blow" ? 0.45 : 0.55;
        const t = clamp(this.actionT / reachIn, 0, 1);
        const retract = clamp((this.actionT - reachIn) / (1 - reachIn), 0, 1);
        this.armReach = ease(t) * (1 - retract);
  
        if (targetCenter) {
          const dx = targetCenter.x - (this.x + this.width/2);
          this.eyeLook = clamp(dx / 300, -1, 1);
        }
  
        // Reaction timing
        if (this.reactType) {
          this.reactT += dt;
          if (this.reactT >= this.reactDur) {
            this.reactType = null;
            this.reactT = 0;
          }
        }
      }
  
      drawArm(ctx, sx, sy, tx, ty, thickness, color, handColor) {
        const midx = (sx + tx) / 2, midy = (sy + ty) / 2;
        const dx = tx - sx, dy = ty - sy;
        const len = Math.hypot(dx, dy) || 1;
        const nx = -dy / len, ny = dx / len;
        const elbowOffset = 14;
        const cx = midx + nx * elbowOffset;
        const cy = midy + ny * elbowOffset;
  
        ctx.strokeStyle = color;
        ctx.lineWidth = thickness;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.quadraticCurveTo(cx, cy, tx, ty);
        ctx.stroke();
  
        ctx.fillStyle = handColor;
        ctx.beginPath();
        ctx.ellipse(tx, ty, thickness * 0.6, thickness * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
      }
  
      drawBear(ctx, cx, cy, bob, targetForArms) {
        // Receiver reaction squash/back-lean
        let reactScale = 1, reactRot = 0, reactYOffset = 0;
        if (this.reactType) {
          const k = 1 - clamp(this.reactT / this.reactDur, 0, 1);
          if (this.reactType === "hug") { reactScale = 1 + 0.04 * k; reactRot = -this.facing * 0.02 * k; reactYOffset = -2 * k; }
          else { reactScale = 1 + 0.03 * k; reactRot = this.facing * 0.015 * k; reactYOffset = -1 * k; }
        }
  
        // Squash/stretch by current action
        let sx = 1, sy = 1, rot = 0;
        if (this.action === "kiss") { sx = 1.05; sy = 0.95; rot = this.facing * 0.02; }
        if (this.action === "hug") { sx = 0.96; sy = 1.04; rot = -this.facing * 0.02; }
        if (this.action === "blow") { sx = 1.03; sy = 0.97; }
        if (this.action === "heart") { sx = 0.98; sy = 1.02; }
        const joyScale = 1 + this.joy * 0.05;
  
        ctx.save();
        ctx.translate(cx|0, (cy + bob + reactYOffset)|0);
        ctx.rotate(rot + reactRot);
        ctx.scale(sx * joyScale * reactScale, sy * joyScale * reactScale);
        ctx.translate((-this.width/2)|0, (-this.height/2)|0);
  
        // Shadow
        ctx.fillStyle = "#0000002a";
        ctx.beginPath();
        ctx.ellipse(this.width/2, this.height - 8, this.width*0.36, 10, 0, 0, Math.PI*2);
        ctx.fill();
  
        // Body
        ctx.fillStyle = this.tint.body;
        ctx.strokeStyle = "#3a2a35";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(10, 30, this.width - 20, this.height - 40, 30);
        ctx.fill(); ctx.stroke();
  
        // Belly
        ctx.fillStyle = this.tint.belly;
        ctx.beginPath();
        ctx.roundRect(this.width/2 - (this.width*0.26), this.height*0.48, this.width*0.52, this.height*0.34, 24);
        ctx.fill();
  
        // Legs
        const hipY = this.height - 44;
        const lHipX = this.width * 0.42;
        const rHipX = this.width * 0.58;
        const step = Math.sin(this.animTime * 4) * 4;
        const footY = this.height - 8;
        const lFootX = lHipX - 4 + step * 0.25;
        const rFootX = rHipX + 4 - step * 0.25;
  
        const legCol = "#3a2a35";
        const legW = 8;
        this.drawArm(ctx, lHipX, hipY, lFootX, footY, legW, legCol, this.tint.paw);
        this.drawArm(ctx, rHipX, hipY, rFootX, footY, legW, legCol, this.tint.paw);
  
        // Arms
        const shoulderY = this.height * 0.48;
        const lShoulderX = this.width * 0.32;
        const rShoulderX = this.width * 0.68;
  
        const armCol = "#3a2a35";
        const handCol = this.tint.paw;
        const armW = 10;
  
        let leftTX = lShoulderX, leftTY = shoulderY + 14;
        let rightTX = rShoulderX, rightTY = shoulderY + 14;
  
        if (targetForArms) {
          const toward = Math.sign(targetForArms.x - (this.x + this.width/2)) || this.facing;
          if (this.action === "kiss") {
            if (toward > 0) { rightTX = lerp(rShoulderX, this.width + 30, this.armReach); rightTY = lerp(shoulderY, shoulderY - 6, this.armReach); }
            else { leftTX = lerp(lShoulderX, -30, this.armReach); leftTY = lerp(shoulderY, shoulderY - 6, this.armReach); }
          } else if (this.action === "hug") {
            const hugOut = 60 + this.armReach * 70;
            const fwd = this.armReach * 20;
            leftTX = lShoulderX - hugOut * 0.6 * toward - fwd * toward;
            rightTX = rShoulderX + hugOut * 0.6 * toward + fwd * toward;
            leftTY = shoulderY - 8;
            rightTY = shoulderY - 8;
          } else if (this.action === "blow") {
            // One hand up near mouth, other on belly
            if (toward > 0) { rightTX = rShoulderX + 8; rightTY = shoulderY - 12; leftTX = lShoulderX - 6; }
            else { leftTX = lShoulderX - 8; leftTY = shoulderY - 12; rightTX = rShoulderX + 6; }
          } else if (this.action === "heart") {
            // Both hands meet in front to shape a heart
            const meetX = this.width * 0.5 + toward * 8;
            const meetY = shoulderY - 2;
            leftTX = lerp(lShoulderX, meetX - 8, this.armReach);
            rightTX = lerp(rShoulderX, meetX + 8, this.armReach);
            leftTY = lerp(shoulderY + 10, meetY, this.armReach);
            rightTY = lerp(shoulderY + 10, meetY, this.armReach);
          }
        }
  
        this.drawArm(ctx, lShoulderX, shoulderY, leftTX, leftTY, armW, armCol, handCol);
        this.drawArm(ctx, rShoulderX, shoulderY, rightTX, rightTY, armW, armCol, handCol);
  
        // Head and face
        const headCX = this.width/2;
        const headCY = 34;
  
        // Ears
        ctx.fillStyle = this.tint.body;
        ctx.beginPath(); ctx.ellipse(headCX - 28, headCY - 10, 14, 12, 0, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(headCX + 28, headCY - 10, 14, 12, 0, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = this.tint.belly;
        ctx.beginPath(); ctx.ellipse(headCX - 28, headCY - 10, 7, 6, 0, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(headCX + 28, headCY - 10, 7, 6, 0, 0, Math.PI*2); ctx.fill();
  
        // Face
        ctx.fillStyle = this.tint.body;
        ctx.strokeStyle = "#3a2a35";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(headCX - 40, headCY - 26, 80, 58, 26);
        ctx.fill(); ctx.stroke();
  
        // Cheeks (stronger if reacting)
        const blushA = this.reactType ? 1 : 0.8;
        ctx.fillStyle = "#ff9dbb";
        ctx.globalAlpha = blushA;
        ctx.beginPath(); ctx.ellipse(headCX - 22, headCY + 10, 9, 6, 0, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(headCX + 22, headCY + 10, 9, 6, 0, 0, Math.PI*2); ctx.fill();
        ctx.globalAlpha = 1;
  
        // Eyes
        const eyesClosed = this.expressionTime > 0 || this.blinkDur > 0 || this.reactType === "kiss";
        const pupilOffset = clamp(this.eyeLook, -1, 1) * 2;
        ctx.fillStyle = "#3a2a35";
        if (eyesClosed) {
          ctx.fillRect((headCX - 18 - 4)|0, (headCY - 4)|0, 8, 2);
          ctx.fillRect((headCX + 18 - 4)|0, (headCY - 4)|0, 8, 2);
        } else {
          ctx.beginPath(); ctx.arc(headCX - 18 + pupilOffset, headCY - 4, 3, 0, Math.PI*2); ctx.fill();
          ctx.beginPath(); ctx.arc(headCX + 18 + pupilOffset, headCY - 4, 3, 0, Math.PI*2); ctx.fill();
          ctx.fillStyle = "#ffffffcc";
          ctx.fillRect((headCX - 19)|0, (headCY - 6)|0, 2, 2);
          ctx.fillRect((headCX + 17)|0, (headCY - 6)|0, 2, 2);
        }
  
        // Nose/mouth
        ctx.fillStyle = "#3a2a35";
        ctx.beginPath(); ctx.arc(headCX, headCY + 2, 2, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = "#3a2a35"; ctx.lineWidth = 2;
        if (this.action === "kiss" || this.reactType === "kiss") {
          ctx.beginPath(); ctx.arc(headCX, headCY + 8, 2.5, 0, Math.PI*2); ctx.stroke();
        } else if (this.action === "hug" || this.reactType === "hug") {
          ctx.beginPath(); ctx.arc(headCX, headCY + 10, 7, 0.1, Math.PI - 0.1); ctx.stroke();
        } else {
          ctx.beginPath(); ctx.arc(headCX, headCY + 8, 5, 0.2, Math.PI - 0.2); ctx.stroke();
        }
  
        ctx.restore();
      }
  
      draw(ctx, targetCenter) {
        const bob = Math.sin(this.animTime * 2.0) * (3 + this.joy * 2);
        const c = this.getCenter();
        this.drawBear(ctx, c.x, this.y + this.height/2, bob, targetCenter);
      }
    }
  
    class LoveMeter {
      constructor() { this.value = 0; this.max = 100; this.displayValue = 0; }
      add(points) { this.value = clamp(this.value + points, 0, this.max); }
      update(dt) { this.displayValue = lerp(this.displayValue, this.value, clamp(dt * 7, 0, 1)); }
      draw(ctx, w) {
        const width = Math.min(720, w - 40), height = 18;
        const x = (w - width) / 2, y = 54; // moved down to avoid overlap
  
        ctx.save();
        ctx.fillStyle = "#ffd9ea";
        ctx.fillRect(x-4, y-4, width+8, height+8);
        ctx.strokeStyle = "#ff9bc0";
        ctx.lineWidth = 2;
        ctx.strokeRect(x-4, y-4, width+8, height+8);
  
        ctx.fillStyle = "#ffeef5";
        ctx.fillRect(x, y, width, height);
        const grad = ctx.createLinearGradient(x, y, x + width, y);
        grad.addColorStop(0, "#ffb3c7");
        grad.addColorStop(1, "#ff6fa3");
        ctx.fillStyle = grad;
        ctx.fillRect(x, y, (this.displayValue/this.max) * width, height);
  
        ctx.fillStyle = "#7b556d";
        ctx.font = "12px 'Press Start 2P', monospace";
        ctx.textAlign = "center";
        ctx.fillText("LOVE METER " + Math.round(this.displayValue) + "%", x + width/2, y + height + 14);
        ctx.restore();
      }
    }
  
    class Game {
      constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.input = new InputManager();
  
        this.love = new LoveMeter();
        this.hearts = [];
        this.emotes = [];
        this.confetti = [];
        this.petals = [];
        this.celebrating = false;
        this.celebrationTime = 0;
        this.screenPulse = 0;
  
        this.bounds = { left: 40, right: this.canvas.width - 40 };
  
        this.p1 = new Player({
          name: "Prateek", role: "bubu", tint: { body: "#f6c6d6", belly: "#ffe5ef", paw: "#f4a9c3" },
          x: 160, y: 0, facing: 1,
          controls: { left: "a", right: "d", kiss: "f", hug: "g", blow: "q", heart: "e" },
        });
        this.p2 = new Player({
          name: "Vanya", role: "dudu", tint: { body: "#ffffff", belly: "#fff3f7", paw: "#ffd1dc" },
          x: this.canvas.width - 280, y: 0, facing: -1,
          controls: { left: "ArrowLeft", right: "ArrowRight", kiss: "k", hug: "l", blow: "i", heart: "o" },
        });
  
        this.p1.target = this.p2;
        this.p2.target = this.p1;
  
        this.lastTime = 0;
        this.loop = this.loop.bind(this);
  
        this.updateTouchHandlers();
  
        requestAnimationFrame(this.loop);
      }
  
      resize() {
        const dpr = window.devicePixelRatio || 1;
        this.canvas.style.width = "100vw";
        this.canvas.style.height = `${window.innerHeight}px`;
        const displayWidth = Math.floor(this.canvas.clientWidth * dpr);
        const displayHeight = Math.floor(this.canvas.clientHeight * dpr);
        if (this.canvas.width !== displayWidth || this.canvas.height !== displayHeight) {
          this.canvas.width = displayWidth;
          this.canvas.height = displayHeight;
        }
        this.bounds.right = this.canvas.width - 40;
  
        const targetH = clamp(this.canvas.height * (isTouch ? 0.5 : 0.46), 160, 360);
        this.p1.setSize(targetH);
        this.p2.setSize(targetH);
  
        const groundY = this.canvas.height - (isTouch ? 110 : 130);
        this.p1.y = groundY - this.p1.height;
        this.p2.y = groundY - this.p2.height;
  
        this.p1.x = clamp(this.p1.x, this.bounds.left, this.bounds.right - this.p1.width);
        this.p2.x = clamp(this.p2.x, this.bounds.left, this.bounds.right - this.p2.width);
        if (this.p2.x < this.p1.x + 80) this.p2.x = this.p1.x + 80;
      }
  
      triggerActions(player, now, force) {
        const pC = player.getCenter();
        const tC = player.target.getCenter();
        const d = dist(pC.x, pC.y, tC.x, tC.y);
  
        // Kiss
        if (force.kiss && player.canKiss(now)) {
          player.performKiss(now);
          const n = 7 + (Math.random() * 3) | 0;
          for (let i = 0; i < n; i++) {
            const jitterX = (Math.random() - 0.5) * 34;
            const jitterY = (Math.random() - 0.5) * 18;
            const sx = pC.x + player.facing * (player.width*0.18) + jitterX;
            const sy = pC.y - player.height*0.22 + jitterY;
            const ex = tC.x + (Math.random() - 0.5) * 28;
            const ey = tC.y - player.height*0.28 + (Math.random() - 0.5) * 26;
            this.hearts.push(new HeartParticle(sx, sy, ex, ey, Math.random()<0.5?"#ff6fa3":"#ffb3c7"));
          }
          const effective = d < 150;
          if (effective) player.target.receiveLove("kiss");
          const facingBonus = player.facing === Math.sign(tC.x - pC.x) ? 1 : 0;
          const proximity = d < 150 ? (d < 95 ? 9 : 5) : 0;
          const points = proximity + (facingBonus ? 2 : 0);
          if (points > 0) this.love.add(points);
        }
  
        // Hug
        if (force.hug && player.canHug(now)) {
          player.performHug(now);
          if (d < 110) {
            const cx = (pC.x + tC.x) / 2;
            const cy = (pC.y + tC.y) / 2 - 10;
            for (let i = 0; i < 18; i++) {
              const ang = (i / 18) * Math.PI * 2;
              const r = 26 + Math.random() * 28;
              this.hearts.push(new HeartParticle(cx, cy, cx + Math.cos(ang) * r, cy + Math.sin(ang) * r, "#ffb3c7"));
            }
            player.target.receiveLove("hug");
            this.screenPulse = 0.28;
            this.love.add(18);
          } else {
            this.hearts.push(new HeartParticle(pC.x, pC.y - 26, pC.x, pC.y - 60, "#ffd1dc"));
            this.love.add(2);
          }
        }
  
        // Blow Kiss
        if (force.blow && player.canBlow(now)) {
          player.performBlow(now);
          const mouthX = pC.x + player.facing * 18;
          const mouthY = pC.y - player.height*0.24;
          for (let i = 0; i < 6; i++) {
            const ex = tC.x + (Math.random() - 0.5) * 40;
            const ey = tC.y - 40 + (Math.random() - 0.5) * 30;
            this.hearts.push(new HeartParticle(mouthX, mouthY, ex, ey, i%2 ? "#ff8fb1" : "#ffd1dc"));
          }
          if (d < 180) { player.target.receiveLove("kiss"); this.love.add(d < 110 ? 8 : 4); }
        }
  
        // Heart Hands
        if (force.heart && player.canHeart(now)) {
          player.performHeart(now);
          const midX = (pC.x + tC.x) / 2;
          const midY = (pC.y + tC.y) / 2 - 16;
          drawHeart(this.ctx, midX, midY, 28/100, "#ff6fa3", "#b33c69");
          for (let i = 0; i < 12; i++) {
            const ang = (i / 12) * Math.PI * 2;
            const r = 18 + Math.random() * 22;
            this.hearts.push(new HeartParticle(midX, midY, midX + Math.cos(ang) * r, midY + Math.sin(ang) * r, i%2?"#ffb3c7":"#ffd1dc"));
          }
          if (d < 160) { player.target.receiveLove("heart"); this.love.add(d < 100 ? 12 : 6); }
        }
      }
  
      update(dt) {
        this.love.update(dt);
        this.p1.updateHuman(this.input, dt, this.bounds);
        this.p2.updateHuman(this.input, dt, this.bounds);
        this.p1.update(dt, this.p1.target.getCenter());
        this.p2.update(dt, this.p2.target.getCenter());
  
        const now = performance.now() / 1000;
        const p1c = this.p1.controls, p2c = this.p2.controls;
        this.triggerActions(this.p1, now, {
          kiss: this.input.isDown(p1c.kiss),
          hug: this.input.isDown(p1c.hug),
          blow: this.input.isDown(p1c.blow),
          heart: this.input.isDown(p1c.heart),
        });
        this.triggerActions(this.p2, now, {
          kiss: this.input.isDown(p2c.kiss),
          hug: this.input.isDown(p2c.hug),
          blow: this.input.isDown(p2c.blow),
          heart: this.input.isDown(p2c.heart),
        });
  
        for (let i = this.hearts.length - 1; i >= 0; i--) { const h = this.hearts[i]; h.update(dt); if (h.done) this.hearts.splice(i, 1); }
        for (let i = this.emotes.length - 1; i >= 0; i--) { const e = this.emotes[i]; e.update(dt); if (e.done) this.emotes.splice(i, 1); }
        for (let i = this.confetti.length - 1; i >= 0; i--) {
          const c = this.confetti[i]; c.update(dt, 0.08);
          if (c.y > this.canvas.height + 24 || c.alpha <= 0) this.confetti.splice(i, 1);
        }
  
        if (this.petals.length < 42 && Math.random() < 0.05) this.petals.push(new Petal(this.canvas.width, this.canvas.height));
        for (let i = this.petals.length - 1; i >= 0; i--) { const p = this.petals[i]; p.update(dt, this.canvas.width, this.canvas.height); if (p.life > 900) this.petals.splice(i, 1); }
  
        if (!this.celebrating && this.love.value >= this.love.max) this.startCelebration();
        if (this.celebrating) {
          this.celebrationTime += dt;
          for (let i = 0; i < 10; i++) this.confetti.push(new Confetti(Math.random() * this.canvas.width, -10));
        }
  
        if (this.screenPulse > 0) this.screenPulse = Math.max(0, this.screenPulse - dt * 0.7);
      }
  
      startCelebration() {
        this.celebrating = true; this.celebrationTime = 0;
        for (let i = 0; i < 220; i++) {
          const x = Math.random() * this.canvas.width;
          const y = Math.random() * (this.canvas.height * 0.35);
          this.confetti.push(new Confetti(x, y));
        }
      }
  
      drawBackground(ctx, w, h) {
        const t = performance.now() / 1000;
  
        // Sky
        const sky = ctx.createLinearGradient(0, 0, 0, h);
        sky.addColorStop(0, "#ffe3ef");
        sky.addColorStop(1, "#ffd4e6");
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, w, h);
  
        // Heart clouds
        ctx.save();
        ctx.globalAlpha = 0.25;
        for (let i = 0; i < 6; i++) {
          const x = ((t * 16) + i * 220) % (w + 260) - 130;
          drawHeart(ctx, x, h * 0.22 + Math.sin(t + i) * 6, 40/100, "#ffffff", "#ffd1dc");
        }
        ctx.restore();
  
        // Tree line (midground)
        const horizon = h - 190;
        ctx.fillStyle = "#e9b4c9";
        for (let i = 0; i < w; i += 40) {
          ctx.beginPath();
          ctx.ellipse(i + 20, horizon + (Math.sin((i+t)*0.01)*3), 40, 16, 0, 0, Math.PI*2);
          ctx.fill();
        }
  
        // Pond + bridge
        const pondY = h - 150;
        const pondW = w * 0.5;
        const water = ctx.createLinearGradient(0, pondY, 0, pondY + 80);
        water.addColorStop(0, "#ffeaf3");
        water.addColorStop(1, "#ffd8e9");
        ctx.fillStyle = water;
        ctx.beginPath();
        ctx.ellipse(w/2, pondY + 40, pondW * 0.45, 60, 0, 0, Math.PI*2);
        ctx.fill();
        ctx.strokeStyle = "#d391a9";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(w/2, pondY + 20, 120, Math.PI*0.05, Math.PI - Math.PI*0.05);
        ctx.stroke();
  
        // Pathway
        const baseY = h - 160;
        const pathTop = baseY + 14, pathBottom = h;
        ctx.fillStyle = "#ffe4ee";
        ctx.beginPath();
        ctx.moveTo((w * 0.32)|0, pathTop|0);
        ctx.lineTo((w * 0.68)|0, pathTop|0);
        ctx.lineTo((w * 0.92)|0, pathBottom|0);
        ctx.lineTo((w * 0.08)|0, pathBottom|0);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "#ffbfd4";
        ctx.lineWidth = 1;
        for (let y = pathTop; y < pathBottom; y += 14) {
          const tY = (y - pathTop) / (pathBottom - pathTop);
          const half = lerp(w * 0.2, w * 0.03, tY);
          const center = w / 2;
          ctx.beginPath();
          ctx.moveTo((center - half)|0, y|0);
          ctx.lineTo((center + half)|0, y|0);
          ctx.stroke();
        }
  
        // Benches
        const bench = (bx, by, scale) => {
          ctx.save();
          ctx.translate(bx, by);
          ctx.scale(scale, scale);
          ctx.fillStyle = "#e9b4c9";
          ctx.fillRect(-40, 0, 80, 8);
          ctx.fillRect(-40, -12, 80, 8);
          ctx.fillRect(-40, -24, 80, 8);
          ctx.fillStyle = "#cf87a4";
          ctx.fillRect(-38, 8, 8, 18);
          ctx.fillRect(30, 8, 8, 18);
          ctx.restore();
        };
        bench(w*0.2, baseY + 34, 1.0);
        bench(w*0.8, baseY + 40, 1.1);
  
        // Lamp posts
        const lamp = (lx) => {
          ctx.save();
          ctx.translate(lx, baseY - 12);
          ctx.fillStyle = "#cf87a4";
          ctx.fillRect(-3, -60, 6, 60);
          ctx.beginPath(); ctx.arc(0, -62, 6, 0, Math.PI*2); ctx.fill();
          const g = ctx.createRadialGradient(0, -68, 0, 0, -68, 50);
          g.addColorStop(0, "rgba(255,210,210,0.5)");
          g.addColorStop(1, "rgba(255,210,210,0)");
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(0, -68, 50, 0, Math.PI*2); ctx.fill();
          ctx.restore();
        };
        lamp(120); lamp(w - 120);
  
        // Foreground flowerbeds
        for (let i = 0; i < 6; i++) {
          const fx = (i / 5) * w + Math.sin(t + i) * 8;
          const fy = h - 28 + Math.sin(t * 0.5 + i) * 2;
          ctx.fillStyle = i % 2 ? "#ffb3c7" : "#ffd1dc";
          ctx.beginPath();
          ctx.ellipse(fx, fy, 50, 16, 0, 0, Math.PI*2);
          ctx.fill();
        }
  
        // Ambient petals
        for (const p of this.petals) p.draw(ctx);
      }
  
      drawCelebrationOverlay(ctx, w, h) {
        const size = Math.min(w, h) * 0.22;
        ctx.save();
        ctx.globalAlpha = 0.18; ctx.fillStyle = "#ff6fa3"; ctx.fillRect(0, 0, w, h);
        ctx.restore();
        drawHeart(ctx, w / 2, h / 2 - 12, size / 100, "#ff6fa3", "#b33c69");
        ctx.fillStyle = "#7b556d";
        ctx.font = `20px 'Press Start 2P', monospace`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("VANTEEK", w / 2, h / 2 - 12);
        ctx.fillStyle = "#a76687";
        ctx.font = "12px 'Press Start 2P', monospace";
        ctx.fillText("LOVE ACHIEVED!", w / 2, h / 2 + size * 0.36);
      }
  
      draw() {
        const ctx = this.ctx, w = this.canvas.width, h = this.canvas.height;
        ctx.imageSmoothingEnabled = false;
  
        this.drawBackground(ctx, w, h);
  
        if (this.screenPulse > 0) {
          ctx.save();
          ctx.globalAlpha = this.screenPulse * 0.35;
          ctx.fillStyle = "#ffb3c7";
          ctx.fillRect(0, 0, w, h);
          ctx.restore();
        }
  
        const p1C = this.p1.getCenter();
        const p2C = this.p2.getCenter();
        this.p1.draw(ctx, p2C);
        this.p2.draw(ctx, p1C);
  
        for (const e of this.emotes) e.draw(ctx);
        for (const hrt of this.hearts) hrt.draw(ctx);
        for (const c of this.confetti) c.draw(ctx);
  
        this.love.draw(ctx, w);
  
        if (this.celebrating) this.drawCelebrationOverlay(ctx, w, h);
      }
  
      loop(ts) {
        this.resize();
        const dt = Math.min(0.05, (ts - this.lastTime) / 1000 || 0.016);
        this.lastTime = ts;
        this.update(dt);
        this.draw();
        requestAnimationFrame(this.loop);
      }
  
      updateTouchHandlers() {
        const input = this.input;
        function attach(el) {
          const key = el.dataset.key;
          const release = () => input.releaseKey(key);
          el.addEventListener("pointerdown", (e) => { e.preventDefault(); el.setPointerCapture(e.pointerId); input.pressKey(key); });
          el.addEventListener("pointerup", release);
          el.addEventListener("pointercancel", release);
          el.addEventListener("lostpointercapture", release);
          el.addEventListener("pointerout", release);
        }
        ["p1-left","p1-right","p1-kiss","p1-hug","p1-blow","p1-heart","p2-left","p2-right","p2-kiss","p2-hug","p2-blow","p2-heart"].forEach(id => {
          const el = document.getElementById(id);
          if (el) attach(el);
        });
      }
    }
  
    // Splash -> Start overlay flow
    const canvas = document.getElementById("game");
    let game = null;
  
    function showStart() {
      document.getElementById("startOverlay").style.display = "grid";
    }
  
    function startGame() {
      document.getElementById("startOverlay").style.display = "none";
      game = new Game(canvas);
    }
  
    window.addEventListener("load", () => {
      const splash = document.getElementById("splashOverlay");
      setTimeout(() => {
        splash.style.opacity = "0";
        setTimeout(() => {
          splash.style.display = "none";
          showStart();
        }, 300);
      }, 2000);
    });
  
    document.getElementById("startBtn").addEventListener("click", startGame);
    document.getElementById("restartBtn").addEventListener("click", () => {
      if (!game) return;
      startGame();
    });
  })();
