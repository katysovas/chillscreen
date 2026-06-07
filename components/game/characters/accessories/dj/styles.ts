export const DJ_STYLES = `
  .ch-dj-phones{position:absolute;left:50%;top:-20px;width:198px;height:68px;transform:translateX(-50%);z-index:14;pointer-events:none;}
  .ch-dj-phones-band{position:absolute;left:4px;right:4px;top:2px;height:22px;border:4px solid #222;border-bottom:none;border-radius:56px 56px 0 0;background:var(--dj-phone-color,#2c2c34);}
  .ch-dj-phones-cup{position:absolute;top:18px;width:44px;height:46px;border:2px solid #222;border-radius:12px;background:linear-gradient(180deg,#444,var(--dj-phone-color,#2c2c34) 40%,#1a1a22);}
  .ch-dj-phones-cup:before{content:"";position:absolute;inset:7px 8px 10px;border-radius:6px;background:radial-gradient(circle at 50% 40%,#6a6a78,#2a2a32);}
  .ch-dj-phones-cup-l{left:0;}
  .ch-dj-phones-cup-r{right:0;}
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
`;
