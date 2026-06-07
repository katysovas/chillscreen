/** NPC float props — globe, guitar, chef hat, compass. */
export const COLORED_PROP_STYLES = `
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
`;
