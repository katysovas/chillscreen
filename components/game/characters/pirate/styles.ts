/** Pirate player variant — tricorn, eyepatch, cutlass, sash, baggy pants. */
export const PIRATE_CHARACTER_STYLES = `
  .ch-outfit-pirate .ch-body{background:linear-gradient(180deg,#fff 0%,#fff 48%,#1e3354 52%,#152840 100%);}
  .ch-outfit-pirate .ch-body:before{top:0;bottom:auto;height:88px;background:#ffffff;border-radius:28px 28px 6px 6px;}
  .ch-outfit-pirate .ch-body:after{content:"";position:absolute;left:-4px;right:-4px;top:90px;height:16px;background:linear-gradient(90deg,#8b0000,#c0392b 20%,#e74c3c 50%,#c0392b 80%,#8b0000);z-index:9;border-top:2px solid #6a0000;border-bottom:2px solid #6a0000;box-shadow:0 2px 4px rgba(0,0,0,.3);}
  .ch-pirate-pants{position:absolute;left:50%;top:104px;transform:translateX(-50%);width:162px;height:78px;z-index:3;pointer-events:none;background:linear-gradient(180deg,#2a4468,#1e3354 35%,#152840 70%,#0e1828);border:2.5px solid #000;border-radius:6px 6px 28px 28px;box-shadow:inset 0 -12px 0 rgba(0,0,0,.18),inset 8px 0 12px rgba(0,0,0,.12),inset -8px 0 12px rgba(0,0,0,.12);}
  .ch-pirate-pants:before{content:"";position:absolute;left:14px;right:14px;top:8px;height:10px;background:rgba(255,255,255,.06);border-radius:4px;}
  .ch-outfit-pirate .ch-legs{height:78px;}
  .ch-outfit-pirate .ch-legs span{width:26px;height:42px;margin:0 8px;top:0;background:linear-gradient(180deg,#243c5c,#1a2d48 55%,#121f32);border-color:#0a1020;border-left-width:3px;border-right-width:3px;z-index:6;}
  .ch-outfit-pirate .ch-legs span:before{width:38px;height:18px;bottom:-16px;background:linear-gradient(180deg,#5c3d1e,#3d2810);border-color:#000;}
  .ch-outfit-pirate .ch-legs span:after{background:linear-gradient(180deg,#6b4a28,#4a3218);height:10px;bottom:-3px;}
  .ch-eyepatch{position:absolute;right:14px;top:10px;width:32px;height:30px;border-radius:50%;background:radial-gradient(circle at 38% 38%,#2a2a2a,#0a0a0a);border:2.5px solid #000;z-index:11;pointer-events:none;box-shadow:inset 0 0 0 2px #333,0 2px 4px rgba(0,0,0,.5);}
  .ch-eyepatch:before{content:"";position:absolute;left:50%;top:-18px;width:2.5px;height:20px;background:linear-gradient(180deg,#1a1a1a,#333);transform:rotate(15deg);transform-origin:bottom center;border-radius:1px;}
  .ch-eyepatch:after{content:"";position:absolute;right:-14px;top:5px;width:16px;height:2.5px;background:linear-gradient(90deg,#1a1a1a,#333);transform:rotate(-8deg);border-radius:1px;}
  .ch-pirate-earring{position:absolute;right:9px;top:58px;width:16px;height:16px;border:3.5px solid #d4a830;border-radius:50%;z-index:12;pointer-events:none;box-shadow:0 1px 4px rgba(0,0,0,.5),inset 0 0 0 1px rgba(255,200,60,.3);}
  .ch-right-hand .ch-sword{position:absolute;left:4px;top:-18px;width:38px;height:128px;transform:rotate(47deg);transform-origin:50% 92%;z-index:12;pointer-events:none;}
  .ch-sword-blade{position:absolute;bottom:36px;left:50%;width:15px;height:86px;margin-left:-7px;border-radius:6px 2px 1px 1px;background:linear-gradient(90deg,#7a8894 0%,#c8d8e4 18%,#edf2f6 42%,#d0dce6 65%,#8a9aaa 100%);border:1px solid #4a5560;box-shadow:inset -3px 0 5px rgba(0,0,0,.22),0 0 8px rgba(180,210,240,.12);}
  .ch-sword-blade:before{content:"";position:absolute;left:55%;top:10px;bottom:18px;width:2px;background:rgba(0,0,0,.18);border-radius:1px;}
  .ch-sword-blade:after{content:"";position:absolute;bottom:0;left:0;right:0;height:18px;background:linear-gradient(180deg,transparent,rgba(0,0,0,.15));border-radius:0 0 2px 1px;}
  .ch-sword-guard{position:absolute;bottom:32px;left:50%;width:34px;height:9px;margin-left:-17px;background:linear-gradient(180deg,#e8c040,#c49020,#f0d060,#a07818);border:2px solid #222;border-radius:4px;box-shadow:inset 0 -3px 0 rgba(0,0,0,.25),0 2px 4px rgba(0,0,0,.3);}
  .ch-sword-guard:after{content:"";position:absolute;left:50%;top:50%;width:7px;height:7px;margin:-3.5px 0 0 -3.5px;border-radius:50%;background:radial-gradient(circle at 30% 30%,#ff9aa8,#c0392b 60%,#7a0a0a);border:1px solid #222;box-shadow:0 0 4px rgba(200,0,30,.4);}
  .ch-sword-hilt{position:absolute;bottom:0;left:50%;width:14px;height:36px;margin-left:-7px;border:2px solid #222;border-radius:4px;background:linear-gradient(90deg,#3c2410,#7a5218,#9a6c22,#5a3a10);box-shadow:inset 0 -8px 0 rgba(0,0,0,.3);}
  .ch-sword-hilt:before{content:"";position:absolute;left:0;right:0;top:6px;bottom:8px;background:repeating-linear-gradient(180deg,rgba(0,0,0,.25) 0 3px,rgba(255,180,40,.12) 3px 6px);border-radius:2px;}
  .ch-sword-hilt:after{content:"";position:absolute;bottom:-10px;left:50%;width:20px;height:14px;margin-left:-10px;border-radius:50%;background:linear-gradient(180deg,#e8c040,#a07818);border:2px solid #222;box-shadow:0 2px 4px rgba(0,0,0,.3);}
`;
