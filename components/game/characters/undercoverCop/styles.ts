/** Undercover cop — tourist shirt, peeking uniform, badge, shades, notepad. */
export const UNDERCOVER_COP_STYLES = `
  .ch-outfit-undercover-cop .ch-body{background:linear-gradient(180deg,#f4e4bc 0%,#e8c878 38%,#1a2f4f 42%,#14263d 100%);}
  .ch-outfit-undercover-cop .ch-body:before{top:0;bottom:auto;height:92px;background:repeating-linear-gradient(135deg,#f7e6a8 0 10px,#e8b84a 10px 20px);border-radius:28px 28px 8px 8px;border:2px solid #c4922e;}
  .ch-outfit-undercover-cop .ch-body:after{content:"";position:absolute;left:8px;right:8px;top:94px;height:14px;background:linear-gradient(90deg,#1a2f4f,#243b5c,#1a2f4f);z-index:8;border:2px solid #0d1828;border-radius:2px;}
  .ch-outfit-undercover-cop .ch-legs span{background:linear-gradient(180deg,#243b5c,#14263d);border-color:#0d1828;}
  .ch-outfit-undercover-cop .ch-legs span:before{background:linear-gradient(180deg,#2a2a2a,#111);border-color:#000;}
  .ch-outfit-undercover-cop .ch-left-hand{display:none;}
  .ch-cop-badge{position:absolute;left:50%;top:72px;width:42px;height:48px;margin-left:-21px;transform:translateX(-50%) scaleX(var(--ch-mirror,1));z-index:12;pointer-events:none;background:radial-gradient(circle at 35% 30%,#fff4c2,#d4af37 45%,#9a7b1a 100%);border:2.5px solid #7a6010;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,.35),inset 0 -4px 0 rgba(0,0,0,.15);}
  .ch-cop-badge-star{display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-size:22px;line-height:1;color:#1a2f4f;font-weight:900;text-shadow:0 1px 0 rgba(255,255,255,.35);}
  .ch-cop-shades{position:absolute;left:50%;top:18px;width:118px;height:34px;margin-left:-59px;transform:scaleX(var(--ch-mirror,1));z-index:13;pointer-events:none;}
  .ch-cop-shades-lens{position:absolute;top:4px;width:46px;height:26px;border-radius:6px;background:linear-gradient(180deg,#1a2530 0%,#0a1018 100%);border:2.5px solid #222;box-shadow:inset 0 -6px 10px rgba(255,255,255,.08),0 2px 4px rgba(0,0,0,.4);}
  .ch-cop-shades-lens-l{left:4px;}
  .ch-cop-shades-lens-r{right:4px;}
  .ch-cop-shades-bridge{position:absolute;left:50%;top:10px;width:14px;height:8px;margin-left:-7px;background:#222;border-radius:2px;}
  .ch-cop-earpiece{position:absolute;right:18px;top:54px;width:18px;height:28px;border:2px solid #222;border-radius:10px 14px 14px 10px;background:linear-gradient(180deg,#333,#111);z-index:11;pointer-events:none;transform:scaleX(var(--ch-mirror,1));}
  .ch-cop-earpiece:after{content:"";position:absolute;right:-8px;top:10px;width:16px;height:2px;background:#222;transform:rotate(-18deg);}
  .ch-right-hand .ch-cop-notepad{position:absolute;left:-6px;top:-8px;width:52px;height:68px;transform:rotate(24deg);transform-origin:80% 90%;z-index:12;pointer-events:none;}
  .ch-cop-notepad-paper{position:absolute;inset:0;background:linear-gradient(180deg,#fff,#f2efe6);border:2px solid #444;border-radius:4px;box-shadow:2px 3px 0 rgba(0,0,0,.25);}
  .ch-cop-notepad-paper:before{content:"";position:absolute;left:6px;right:6px;top:10px;height:2px;background:#c8c4bc;box-shadow:0 8px 0 #c8c4bc,0 16px 0 #c8c4bc,0 24px 0 #c8c4bc;}
  .ch-cop-notepad-pen{position:absolute;right:-6px;bottom:8px;width:8px;height:34px;border-radius:3px;background:linear-gradient(90deg,#1a4fa0,#2e6fd4);border:1.5px solid #12325f;transform:rotate(12deg);}
`;
