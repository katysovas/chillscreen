export const CHARACTER_STYLES = `
  .ch-wrapper{width:500px;height:240px;position:relative;}
  .ch-animal{position:relative;animation:ch-animal 2s 1s infinite alternate;}
  .ch-body{background:#cccccc;border:2px solid #000;width:170px;height:170px;border-radius:30px;margin:0 auto;position:relative;}
  .ch-body:before{content:"";position:absolute;left:5px;right:5px;bottom:10px;top:0;border-radius:30px;background:#fff;}
  .ch-ears{position:absolute;top:0;left:50%;right:-10px;height:20px;width:180px;transform:translateX(-50%);}
  .ch-ears:before,.ch-ears:after{content:"";background:#000;width:15px;height:30px;float:left;border-radius:10px;transform:rotate(-45deg);}
  .ch-ears:after{float:right;transform:rotate(45deg);}
  /* ch-ballons has NO animation — only the heart (ch-heart) bounces.
     The string therefore stays fixed relative to ch-animal and never
     disconnects from the hand. Only the character and the heart shape bounce. */
  .ch-ballons{position:absolute;left:84.8%;z-index:1;width:150px;height:150px;top:-70px;transform:translateX(-50%) scale(1,1.1);}
  .ch-ballons:before{content:"";position:absolute;left:20px;top:106px;z-index:1;width:2px;height:60px;background:#000;}
  .ch-heart{position:relative;animation:ch-heart 2s 1s infinite alternate;}
  .ch-heart span{width:60px;height:100px;background:#ef4023;position:absolute;left:5px;top:0;border-radius:50px 50px 0 0;transform:rotate(45deg);}
  .ch-heart span:last-child{right:113px;left:initial;transform:scale(-1,1) rotate(45deg);}
  .ch-globe-wrap{position:absolute;left:84.8%;z-index:1;width:80px;height:80px;top:-55px;transform:translateX(-50%);}
  .ch-globe-wrap:before{content:"";position:absolute;left:38px;top:72px;width:2px;height:50px;background:#000;}
  .ch-globe{width:72px;height:72px;border-radius:50%;border:2px solid #222;background:radial-gradient(circle at 35% 35%,rgba(255,255,255,.35),var(--globe-color,#6eafd1) 45%,#2a6080 100%);animation:ch-globe-spin 8s linear infinite;}
  @keyframes ch-globe-spin{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}
  .ch-prop-wrap{position:absolute;left:84.8%;z-index:1;width:80px;height:90px;top:-55px;transform:translateX(-50%);pointer-events:none;}
  .ch-prop-wrap:before{content:"";position:absolute;left:50%;top:78px;width:2px;height:50px;background:#000;transform:translateX(-50%);}
  .ch-prop{position:relative;left:50%;transform:translateX(-50%);border:2px solid #222;}
  .ch-prop-globe-body{width:72px;height:72px;top:0;border-radius:50%;background:radial-gradient(circle at 35% 35%,rgba(255,255,255,.35),var(--prop-color,#6eafd1) 45%,#2a6080 100%);animation:ch-globe-spin 8s linear infinite;}
  .ch-prop-guitar-body{width:52px;height:68px;top:4px;border-radius:22px 22px 16px 16px;background:linear-gradient(180deg,var(--prop-color,#d4a373),#8b5a2b);}
  .ch-prop-guitar-body:after{content:"";position:absolute;left:50%;top:-28px;width:8px;height:32px;margin-left:-4px;background:linear-gradient(180deg,#5c3d1e,var(--prop-color,#d4a373));border:2px solid #222;border-radius:4px;}
  .ch-prop-chefHat-body{width:58px;height:52px;top:8px;border-radius:8px 8px 4px 4px;background:var(--prop-color,#fff);box-shadow:inset 0 -8px 0 rgba(0,0,0,.08);}
  .ch-prop-chefHat-body:before{content:"";position:absolute;left:-8px;right:-8px;top:-18px;height:28px;border-radius:50%;background:var(--prop-color,#fff);border:2px solid #222;}
  .ch-prop-compass-body{width:64px;height:64px;top:6px;border-radius:50%;background:radial-gradient(circle at 50% 50%,#f5f0dc 0%,#d4c896 70%);box-shadow:inset 0 0 0 4px var(--prop-color,#b5a642);}
  .ch-prop-compass-body:after{content:"";position:absolute;left:50%;top:50%;width:4px;height:28px;margin:-14px 0 0 -2px;background:linear-gradient(180deg,#c0392b 0 50%,#2c3e50 50% 100%);border-radius:2px;}
  /* Microphone — mounted on the right fist */
  .ch-right-hand .ch-mic{position:absolute;left:-20px;top:-34px;width:54px;height:118px;transform:rotate(58deg);transform-origin:50% 88%;z-index:12;pointer-events:none;}
  .ch-mic-handle{position:absolute;bottom:0;left:50%;width:14px;height:56px;margin-left:-7px;border:2px solid #222;border-radius:0 0 6px 6px;background:linear-gradient(90deg,#666,#999 45%,#555);}
  .ch-mic-head{position:absolute;bottom:50px;left:50%;width:48px;height:48px;margin-left:-24px;border:2px solid #222;border-radius:50%;background:radial-gradient(circle at 35% 30%,#888,var(--mic-color,#2c3e50) 55%,#1a2530);}
  .ch-mic-grille{position:absolute;bottom:62px;left:50%;width:34px;height:22px;margin-left:-17px;border-radius:50%;background:repeating-linear-gradient(90deg,rgba(0,0,0,.35) 0 2px,transparent 2px 5px);opacity:.55;pointer-events:none;}
  /* DJ — headphones on head, speaker in right hand */
  .ch-dj-phones{position:absolute;left:50%;top:-20px;width:198px;height:68px;transform:translateX(-50%);z-index:14;pointer-events:none;}
  .ch-dj-phones-band{position:absolute;left:4px;right:4px;top:2px;height:22px;border:4px solid #222;border-bottom:none;border-radius:56px 56px 0 0;background:var(--dj-phone-color,#2c2c34);}
  .ch-dj-phones-cup{position:absolute;top:18px;width:44px;height:46px;border:2px solid #222;border-radius:12px;background:linear-gradient(180deg,#444,var(--dj-phone-color,#2c2c34) 40%,#1a1a22);}
  .ch-dj-phones-cup:before{content:"";position:absolute;inset:7px 8px 10px;border-radius:6px;background:radial-gradient(circle at 50% 40%,#6a6a78,#2a2a32);}
  .ch-dj-phones-cup-l{left:0;}
  .ch-dj-phones-cup-r{right:0;}
  /* Necklace — chain on neck, pendant with symbol (e.g. ₿) */
  .ch-necklace{position:absolute;left:50%;top:34px;width:170px;height:88px;transform:translateX(-50%);z-index:9;pointer-events:none;}
  .ch-necklace-chain{position:absolute;left:50%;top:0;width:166px;height:30px;margin-left:-83px;border:3px solid var(--chain-color,#c9a227);border-top:none;border-radius:0 0 50% 50%;box-sizing:border-box;}
  .ch-necklace-link{position:absolute;left:50%;top:26px;width:4px;height:16px;margin-left:-2px;background:var(--chain-color,#c9a227);border-radius:1px;}
  .ch-necklace-pendant{position:absolute;left:50%;top:40px;width:68px;height:68px;margin-left:-34px;border:3px solid #222;border-radius:50%;background:radial-gradient(circle at 32% 28%,#ffcc66,var(--pendant-color,#f7931a) 52%,#a85a08);box-shadow:inset 0 -6px 0 rgba(0,0,0,.15),0 4px 8px rgba(0,0,0,.18);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:44px;line-height:1;color:#fff;text-shadow:0 2px 5px rgba(0,0,0,.5);font-family:system-ui,-apple-system,sans-serif;}
  .ch-right-hand .ch-dj-speaker{position:absolute;left:-32px;top:-12px;width:118px;height:100px;transform:rotate(38deg);transform-origin:50% 92%;z-index:12;pointer-events:none;}
  .ch-boom-handle{position:absolute;bottom:74px;left:50%;width:56px;height:23px;margin-left:-28px;border:3px solid #222;border-bottom:none;border-radius:28px 28px 0 0;background:linear-gradient(180deg,#888,#555);box-shadow:inset 0 -4px 0 rgba(0,0,0,.2);}
  .ch-boom-handle:before{content:"";position:absolute;left:10px;right:10px;top:6px;height:10px;border:2px solid #222;border-bottom:none;border-radius:14px 14px 0 0;background:#666;}
  .ch-boom-body{position:absolute;bottom:18px;left:50%;width:110px;height:60px;margin-left:-55px;border:2px solid #222;border-radius:7px;background:linear-gradient(180deg,#d8d0c4 0%,#a8a090 45%,#8a8278 100%);box-shadow:inset 0 2px 0 rgba(255,255,255,.35),inset 0 -4px 8px rgba(0,0,0,.15);}
  .ch-boom-body:after{content:"";position:absolute;left:5px;right:5px;top:5px;height:4px;border-radius:2px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.5) 20%,rgba(255,255,255,.5) 80%,transparent);}
  .ch-boom-woofer{position:absolute;top:10px;width:33px;height:33px;border:2px solid #222;border-radius:50%;background:radial-gradient(circle,#1a1a1a 0 35%,#2a2a2a 36% 50%,var(--dj-speaker-color,#e04f8e) 51% 68%,#1a1a1a 69% 100%);}
  .ch-boom-woofer:before{content:"";position:absolute;inset:6px;border-radius:50%;border:1px solid rgba(255,255,255,.12);background:repeating-radial-gradient(circle at center,rgba(0,0,0,.5) 0 1px,transparent 1px 3px);}
  .ch-boom-woofer-l{left:8px;}
  .ch-boom-woofer-r{right:8px;}
  .ch-boom-center{position:absolute;left:50%;top:9px;width:36px;height:42px;margin-left:-18px;border:2px solid #222;border-radius:4px;background:linear-gradient(180deg,#3a3a42,#222);}
  .ch-boom-tape{position:absolute;left:5px;right:5px;top:6px;height:17px;border:1px solid #111;border-radius:2px;background:linear-gradient(180deg,#2a2a32,#1a1a22);}
  .ch-boom-tape:before{content:"";position:absolute;left:4px;top:4px;width:10px;height:10px;border-radius:50%;background:#444;box-shadow:12px 0 0 #444;}
  .ch-boom-panel{position:absolute;left:4px;right:4px;bottom:5px;height:10px;border-radius:2px;background:repeating-linear-gradient(90deg,#c44 0 2px,#3a3 2px 4px,#fc4 4px 6px,#3a3 6px 8px);}
  .ch-boom-grip{position:absolute;bottom:0;left:50%;width:18px;height:20px;margin-left:-9px;border:2px solid #222;border-radius:0 0 6px 6px;background:linear-gradient(90deg,#666,#999 50%,#666);}
  /* ── Vendor cart ─────────────────────────────────────────────────────────
     Floats inside .ch-animal, absolutely positioned to the right of the body.
     The handle bar visually connects the character's right hand to the cart. */
  .ch-vcart-wrap{position:absolute;left:330px;top:55px;width:130px;height:165px;z-index:3;pointer-events:none;}
  /* Awning pole */
  .ch-vcart-pole{position:absolute;left:50%;top:0;width:5px;height:44px;margin-left:-2px;background:linear-gradient(90deg,#7a5c10,#d4a830,#7a5c10);}
  /* Striped awning body */
  .ch-vcart-awning{position:absolute;top:0;left:-8px;right:-8px;height:28px;background:repeating-linear-gradient(90deg,var(--cart-awning,#e8520a) 0 18px,#fff5e0 18px 36px);border-radius:3px 3px 0 0;box-shadow:0 2px 0 rgba(0,0,0,.12);}
  /* Scalloped fringe below awning */
  .ch-vcart-awning:after{content:"";position:absolute;bottom:-12px;left:0;right:0;height:14px;background:radial-gradient(circle at 10px -1px,transparent 10px,var(--cart-awning,#e8520a) 11px) 0 0/20px 100%,radial-gradient(circle at 10px -1px,transparent 10px,#fff5e0 11px) 10px 0/20px 100%;}
  /* Cart body */
  .ch-vcart-body{position:absolute;top:40px;left:10px;right:10px;height:76px;background:linear-gradient(180deg,#f7f0d8,#e0d4a8);border:2.5px solid #6b5a2a;border-radius:5px 5px 2px 2px;}
  /* Display/window on the cart front */
  .ch-vcart-display{position:absolute;top:8px;left:8px;right:8px;height:34px;background:#fffbf0;border:2px solid #6b5a2a;border-radius:2px;display:flex;align-items:center;justify-content:center;font-size:20px;line-height:1;}
  /* Bottom shelf/frame */
  .ch-vcart-shelf{position:absolute;top:112px;left:6px;right:6px;height:10px;background:#6b5a2a;border-radius:2px;}
  /* Handle bar connecting character's right hand to the cart */
  .ch-vcart-handle{position:absolute;top:88px;left:-36px;width:46px;height:9px;background:linear-gradient(180deg,#c4a420,#8b6914);border-radius:4px;border:1px solid rgba(0,0,0,.18);}
  /* Wheels */
  .ch-vcart-wheel{position:absolute;top:118px;width:32px;height:32px;border-radius:50%;background:radial-gradient(circle at 38% 38%,#aaa,#555 55%,#2a2a2a);border:3px solid #1a1a1a;}
  .ch-vcart-wheel:before{content:"";position:absolute;inset:5px;border-radius:50%;border:1.5px solid rgba(255,255,255,.15);}
  .ch-vcart-wheel:after{content:"";position:absolute;left:50%;top:50%;width:7px;height:7px;margin:-3.5px;border-radius:50%;background:#ccc;border:1px solid #555;}
  .ch-vcart-wheel-l{left:8px;}
  .ch-vcart-wheel-r{right:8px;}

  /* Lightsaber — mounted on the right fist */
  .ch-right-hand .ch-saber{position:absolute;left:4px;top:-18px;width:30px;height:130px;transform:rotate(47deg);transform-origin:50% 92%;z-index:12;pointer-events:none;}
  .ch-saber-hilt{position:absolute;bottom:0;left:50%;width:16px;height:38px;margin-left:-8px;border:2px solid #222;border-radius:4px;background:#5a5a62;box-shadow:inset 0 -6px 0 rgba(0,0,0,.25);}
  .ch-saber-guard{position:absolute;bottom:35px;left:50%;width:24px;height:7px;margin-left:-12px;background:linear-gradient(#d4a830,#8a7020);border:2px solid #222;border-radius:2px;}
  .ch-saber-blade{position:absolute;bottom:40px;left:50%;width:10px;height:84px;margin-left:-5px;border-radius:4px 4px 2px 2px;background:linear-gradient(90deg,rgba(255,255,255,.85),var(--saber-blade,#FFE566) 35%,var(--saber-blade,#FFE566) 65%,rgba(255,255,255,.7));box-shadow:0 0 10px 3px var(--saber-blade,#FFE566),0 0 20px 4px rgba(255,230,100,.45);animation:ch-saber-hum 2.2s ease-in-out infinite alternate;}
  .ch-saber-glow{position:absolute;bottom:40px;left:50%;width:22px;height:78px;margin-left:-11px;border-radius:8px;opacity:.22;filter:blur(7px);animation:ch-saber-hum 2.2s ease-in-out infinite alternate;}
  @keyframes ch-saber-hum{from{opacity:.85;filter:brightness(1);}to{opacity:1;filter:brightness(1.15);}}
  .ch-dancing .ch-saber-blade,.ch-dancing .ch-saber-glow{animation:ch-saber-hum .45s ease-in-out infinite alternate!important;}
  .ch-eyes{position:absolute;left:50%;width:130px;top:24px;transform:translateX(-50%);}
  .ch-eyes:before,.ch-eyes:after{content:"";background:#000;width:10px;height:10px;border-radius:50%;float:right;animation:ch-eyes 2s 1s infinite alternate;}
  .ch-eyes:after{float:left;}
  .ch-nose{position:absolute;left:50%;top:30px;width:20px;height:20px;transform:translateX(-50%);}
  .ch-nose:before{content:"";position:absolute;left:50%;top:7px;bottom:4px;background:#938E8F;z-index:9;width:2px;transform:translateX(-50%);}
  .ch-nose:after{content:"";position:absolute;width:0;height:0;top:0;left:50%;border:8px solid transparent;border-top-color:#000;border-radius:8px;transform:translateX(-50%);}
  .ch-nose span{width:6px;height:8px;border:2px solid #938E8F;border-radius:50%;position:absolute;left:0;bottom:0;transform:rotate(-10deg);}
  .ch-nose span:last-child{right:0;left:inherit;transform:rotate(10deg);}
  .ch-nose span:before{content:"";background:#fff;position:absolute;left:-3px;right:-3px;bottom:3px;top:-3px;}
  .ch-left-hand{position:absolute;left:25px;top:55px;width:35px;height:60px;}
  .ch-left-hand:before{content:"";position:absolute;left:0;top:-10px;right:0;background:#fff;height:13px;z-index:9;}
  .ch-left-hand:after{content:"";border:2px solid #000;position:absolute;left:5px;right:4px;bottom:-18px;height:30px;z-index:0;border-radius:19px;box-shadow:inset 25px 0 0 rgba(0,0,0,.2);transform:rotate(-20deg);}
  .ch-left-hand span{background:#fff;border-left:2px solid #000;width:15px;height:65px;position:absolute;border-radius:50%;left:0;top:0;}
  .ch-left-hand span:before{content:"";position:absolute;left:0;right:0;bottom:0;background:#fff;height:5px;}
  .ch-left-hand span:after{content:"";background:#fff;border-radius:0 0 30px 30px;position:absolute;bottom:-6px;left:3.3px;right:-11.5px;height:27px;z-index:9;box-shadow:inset 4px 0 0 rgba(0,0,0,.2);transform:rotate(-15deg);}
  .ch-left-hand span:last-child{left:25px;top:-3px;}
  .ch-left-hand span:last-child:after{display:none;}
  .ch-right-hand{position:absolute;right:-26px;top:70px;width:35px;height:60px;animation:ch-right-hand 2s 1s infinite alternate;transform:rotate(-47deg);}
  .ch-right-hand:before{content:"";border:2px solid #000;width:19.2px;height:30px;position:absolute;border-radius:0 0 30px 30px;bottom:-6px;background:rgba(200,200,200,.5);z-index:9;right:0;transform:rotate(-30deg);}
  .ch-right-hand:after{content:"";width:19.5px;height:18px;background:rgba(220,220,220,.6);position:absolute;bottom:10px;z-index:9;right:6.4px;transform:rotate(-30deg);}
  .ch-right-hand span{border-left:2px solid #000;width:10px;height:40px;position:absolute;border-radius:50%;right:0;top:0;}
  .ch-right-hand span:first-child:before{content:"";border:2px solid #000;position:absolute;background:#ddd;right:-3px;bottom:-26px;width:20px;height:16px;z-index:10;border-radius:15px 20px 20px 18px;transform:rotate(57deg);}
  .ch-right-hand span:first-child:after{content:"";position:absolute;bottom:-9px;right:-4px;width:6px;height:9px;border:2px solid #000;border-left:0;border-radius:10px 30px 30px 10px;z-index:10;background:#ddd;transform:rotate(-29deg);}
  .ch-right-hand span:last-child{right:20px;top:5px;}
  .ch-right-hand span:last-child:before{content:"";position:absolute;left:0;right:5px;top:0;background:rgba(220,220,220,.5);height:5px;}
  .ch-right-hand span:last-child:after{content:"";position:absolute;left:0;top:2px;width:18.7px;height:35px;background:rgba(220,220,220,.5);border-radius:0 0 10px 10px;}
  .ch-legs{margin:0 auto;text-align:center;height:60px;}
  .ch-legs span{width:10px;height:20px;border-right:2px solid #605d5e;border-left:2px solid #605d5e;display:inline-block;margin:0 20px;position:relative;top:-8px;z-index:1;animation:ch-right-leg 2s 1s infinite alternate;transform:rotate(5deg);}
  .ch-legs span:before{content:"";width:25px;height:10px;position:absolute;border-radius:0 20px 20px 20px;border:2px solid #000;left:-2px;bottom:-12px;}
  .ch-legs span:after{content:"";background:rgba(200,200,200,.4);right:0;left:0;position:absolute;bottom:-2px;height:7px;}
  .ch-legs span:first-child{animation:ch-left-leg 2s 1s infinite alternate;transform:rotate(-5deg);}
  .ch-legs span:first-child:before{right:-2px;left:inherit;border-radius:20px 0 20px 20px;}
  .ch-walking .ch-animal{animation-duration:.36s!important;}
  /* Cute quick march: each leg does a small lift-and-plant (mostly vertical),
     a tiny forward tilt, half a cycle out of phase. Fast tempo, little swing. */
  .ch-walking .ch-legs span{animation:ch-step-a .36s ease-in-out infinite!important;transform-origin:top center!important;}
  .ch-walking .ch-legs span:first-child{animation:ch-step-b .36s ease-in-out infinite!important;transform-origin:top center!important;}
  /* Foot stays flat to the ground with just a tiny tip, keeping it cute not floppy. */
  .ch-walking .ch-legs span:before{animation:ch-foot-a .36s ease-in-out infinite!important;transform-origin:center top;}
  .ch-walking .ch-legs span:first-child:before{animation:ch-foot-b .36s ease-in-out infinite!important;transform-origin:center top;}
  .ch-walking .ch-right-hand{animation-duration:.36s!important;animation-delay:0s!important;}
  /* ── Concert dance ────────────────────────────────────────────────────────
     Five layers of motion so the character looks like it's actually having fun:
     1. ch-animal bounce  — fast up/down (unchanged, 0.28s)
     2. ch-wrapper sway   — ±3° body rock synced to 2× bounce period (0.56s)
     3. Leg stomp         — alternating lifts when standing still
     4. Arm raise         — wider arc (36°) + raised higher; secondary bob on held hand
     5. Happy eyes        — periodic ^^ squint
  */
  .ch-dancing .ch-animal{animation:ch-dance-bounce .28s ease-in-out infinite alternate!important;}
  /* 2. Whole-body sway — rotates around feet so the character leans L/R */
  .ch-dancing{animation:ch-dance-sway .56s ease-in-out infinite;transform-origin:bottom center;}
  /* 3. Alternating leg stomp when standing; walk cycle takes over when moving */
  .ch-dancing:not(.ch-walking) .ch-legs span{
    animation:ch-dance-stomp .56s ease-in-out infinite!important;
    transform-origin:top center!important;
  }
  .ch-dancing:not(.ch-walking) .ch-legs span:first-child{
    animation:ch-dance-stomp-l .56s ease-in-out .28s infinite!important;
    transform-origin:top center!important;
  }
  /* 4a. Free hand — wider, higher arc */
  .ch-dancing.ch-free-hand-left .ch-left-hand,
  .ch-dancing.ch-free-hand-left.ch-walking .ch-left-hand{
    animation:ch-dance-party-sway-left 1.15s ease-in-out infinite alternate!important;
    transform-origin:88% 8%;
  }
  .ch-dancing.ch-free-hand-right .ch-right-hand,
  .ch-dancing.ch-free-hand-right.ch-walking .ch-right-hand{
    animation:ch-dance-party-sway-right 1.15s ease-in-out infinite alternate!important;
    transform-origin:12% 8%;
  }
  /* 4b. Held hand — subtle secondary bob instead of frozen solid */
  .ch-dancing.ch-free-hand-left .ch-right-hand,
  .ch-dancing.ch-free-hand-left.ch-walking .ch-right-hand{
    animation:ch-dance-held-bob .56s ease-in-out infinite alternate!important;
  }
  .ch-dancing.ch-free-hand-right .ch-left-hand,
  .ch-dancing.ch-free-hand-right.ch-walking .ch-left-hand{
    animation:ch-dance-held-bob .56s ease-in-out infinite alternate!important;
  }
  /* 5. Happy squint every ~1.4 s */
  .ch-dancing .ch-eyes:before,.ch-dancing .ch-eyes:after{
    animation:ch-dance-happy-eyes 1.4s ease-in-out infinite!important;
  }
  @keyframes ch-dance-bounce{
    from{transform:translateY(0);}
    to{transform:translateY(-26px);}
  }
  @keyframes ch-dance-sway{
    0%,100%{transform:rotate(-3deg);}
    50%{transform:rotate(3deg);}
  }
  @keyframes ch-dance-stomp{
    0%,55%,100%{transform:rotate(5deg) translateY(0);}
    25%{transform:rotate(8deg) translateY(-9px);}
  }
  @keyframes ch-dance-stomp-l{
    0%,55%,100%{transform:rotate(-5deg) translateY(0);}
    25%{transform:rotate(-8deg) translateY(-9px);}
  }
  @keyframes ch-dance-party-sway-left{
    from{transform:rotate(162deg) translate(34px,-24px);}
    to{transform:rotate(198deg) translate(34px,-24px);}
  }
  @keyframes ch-dance-party-sway-right{
    from{transform:rotate(-162deg) translate(-34px,-24px);}
    to{transform:rotate(-198deg) translate(-34px,-24px);}
  }
  @keyframes ch-dance-held-bob{
    from{transform:rotate(-47deg) translateY(0);}
    to{transform:rotate(-47deg) translateY(-8px);}
  }
  @keyframes ch-dance-happy-eyes{
    0%,60%,100%{height:10px;width:10px;border-radius:50%;}
    75%{height:4px;width:12px;border-radius:50% 50% 0 0;}
  }
  /* Leg lifts up then stamps down; small ±10° tilt so it steps, not swings. */
  @keyframes ch-step-a{
    0%{transform:rotate(-9deg) translateY(0);}
    50%{transform:rotate(9deg) translateY(-11px);}
    100%{transform:rotate(-9deg) translateY(0);}
  }
  @keyframes ch-step-b{
    0%{transform:rotate(9deg) translateY(-11px);}
    50%{transform:rotate(-9deg) translateY(0);}
    100%{transform:rotate(9deg) translateY(-11px);}
  }
  /* Tiny toe tip on the lift, flat on the plant. */
  @keyframes ch-foot-a{
    0%{transform:rotate(0deg);}
    50%{transform:rotate(-14deg);}
    100%{transform:rotate(0deg);}
  }
  @keyframes ch-foot-b{
    0%{transform:rotate(-14deg);}
    50%{transform:rotate(0deg);}
    100%{transform:rotate(-14deg);}
  }
  @keyframes ch-heart{0%{transform:scale(.8);top:22px;right:11px;}to{transform:scale(1.2);top:-21px;right:-11px;}}
  @keyframes ch-eyes{from{width:10px;height:10px;}to{width:15px;height:15px;}}
  @keyframes ch-animal{from{bottom:0;}to{bottom:22px;}}
  @keyframes ch-right-hand{from{transform:rotate(-47deg);top:70px;}to{transform:rotate(-80deg);top:50px;}}
  @keyframes ch-left-leg{0%{transform:rotate(-5deg);}100%{transform:rotate(-30deg);}}
  @keyframes ch-right-leg{0%{transform:rotate(5deg);}100%{transform:rotate(30deg);}}
  /* Natural jump arc: fast up (decelerate), then gravity-fall back down (accelerate). */
  @keyframes ch-jump-outer{
    0%  { transform:translateY(0);      animation-timing-function:cubic-bezier(0.215,0.61,0.355,1); }
    42% { transform:translateY(-100px); animation-timing-function:cubic-bezier(0.55,0.055,0.675,0.19); }
    100%{ transform:translateY(0); }
  }
`;
