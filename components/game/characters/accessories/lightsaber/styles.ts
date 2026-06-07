export const LIGHTSABER_STYLES = `
  .ch-right-hand .ch-saber{position:absolute;left:4px;top:-58px;width:30px;height:130px;transform:rotate(47deg);transform-origin:50% 92%;z-index:12;pointer-events:none;}
  .ch-saber-hilt{position:absolute;bottom:0;left:50%;width:16px;height:38px;margin-left:-8px;border:2px solid #222;border-radius:4px;background:#5a5a62;box-shadow:inset 0 -6px 0 rgba(0,0,0,.25);}
  .ch-saber-guard{position:absolute;bottom:35px;left:50%;width:24px;height:7px;margin-left:-12px;background:linear-gradient(#d4a830,#8a7020);border:2px solid #222;border-radius:2px;}
  .ch-saber-blade{position:absolute;bottom:40px;left:50%;width:10px;height:84px;margin-left:-5px;border-radius:4px 4px 2px 2px;background:linear-gradient(90deg,rgba(255,255,255,.85),var(--saber-blade,#FFE566) 35%,var(--saber-blade,#FFE566) 65%,rgba(255,255,255,.7));box-shadow:0 0 10px 3px var(--saber-blade,#FFE566),0 0 20px 4px rgba(255,230,100,.45);animation:ch-saber-hum 2.2s ease-in-out infinite alternate;}
  .ch-saber-glow{position:absolute;bottom:40px;left:50%;width:22px;height:78px;margin-left:-11px;border-radius:8px;opacity:.22;filter:blur(7px);animation:ch-saber-hum 2.2s ease-in-out infinite alternate;}
  @keyframes ch-saber-hum{from{opacity:.85;filter:brightness(1);}to{opacity:1;filter:brightness(1.15);}}
  .ch-dancing .ch-saber-blade,.ch-dancing .ch-saber-glow{animation:ch-saber-hum .45s ease-in-out infinite alternate!important;}
`;
