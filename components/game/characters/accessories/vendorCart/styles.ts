export const VENDOR_CART_STYLES = `
  .ch-vcart-wrap{position:absolute;left:330px;top:55px;width:130px;height:165px;z-index:3;pointer-events:none;}
  .ch-vcart-pole{position:absolute;left:50%;top:0;width:5px;height:44px;margin-left:-2px;background:linear-gradient(90deg,#7a5c10,#d4a830,#7a5c10);}
  .ch-vcart-awning{position:absolute;top:0;left:-8px;right:-8px;height:28px;background:repeating-linear-gradient(90deg,var(--cart-awning,#e8520a) 0 18px,#fff5e0 18px 36px);border-radius:3px 3px 0 0;box-shadow:0 2px 0 rgba(0,0,0,.12);}
  .ch-vcart-awning:after{content:"";position:absolute;bottom:-12px;left:0;right:0;height:14px;background:radial-gradient(circle at 10px -1px,transparent 10px,var(--cart-awning,#e8520a) 11px) 0 0/20px 100%,radial-gradient(circle at 10px -1px,transparent 10px,#fff5e0 11px) 10px 0/20px 100%;}
  .ch-vcart-body{position:absolute;top:40px;left:10px;right:10px;height:76px;background:linear-gradient(180deg,#f7f0d8,#e0d4a8);border:2.5px solid #6b5a2a;border-radius:5px 5px 2px 2px;}
  .ch-vcart-display{position:absolute;top:8px;left:8px;right:8px;height:34px;background:#fffbf0;border:2px solid #6b5a2a;border-radius:2px;display:flex;align-items:center;justify-content:center;font-size:20px;line-height:1;}
  .ch-vcart-shelf{position:absolute;top:112px;left:6px;right:6px;height:10px;background:#6b5a2a;border-radius:2px;}
  .ch-vcart-handle{position:absolute;top:88px;left:-36px;width:46px;height:9px;background:linear-gradient(180deg,#c4a420,#8b6914);border-radius:4px;border:1px solid rgba(0,0,0,.18);}
  .ch-vcart-wheel{position:absolute;top:118px;width:32px;height:32px;border-radius:50%;background:radial-gradient(circle at 38% 38%,#aaa,#555 55%,#2a2a2a);border:3px solid #1a1a1a;}
  .ch-vcart-wheel:before{content:"";position:absolute;inset:5px;border-radius:50%;border:1.5px solid rgba(255,255,255,.15);}
  .ch-vcart-wheel:after{content:"";position:absolute;left:50%;top:50%;width:7px;height:7px;margin:-3.5px;border-radius:50%;background:#ccc;border:1px solid #555;}
  .ch-vcart-wheel-l{left:8px;}
  .ch-vcart-wheel-r{right:8px;}
`;
