/** CSS for loadout prop layers (`ch-lo-*`). */
export const LOADOUT_STYLES = `
  /* ── Hats ─────────────────────────────────────────────────────────────── */
  .ch-lo-hat{position:absolute;left:50%;transform:translateX(-50%);z-index:12;pointer-events:none;}
  .ch-lo-hat-beanie{top:-38px;width:120px;height:52px;background:var(--lo-color,#2c3e50);border:2px solid #000;border-radius:40px 40px 8px 8px;box-shadow:inset 0 -8px 0 rgba(0,0,0,.15);}
  .ch-lo-hat-beanie:before{content:"";position:absolute;left:8px;right:8px;top:10px;height:14px;border-radius:20px;background:rgba(255,255,255,.12);}
  .ch-lo-hat-cap{top:-28px;width:130px;height:36px;background:var(--lo-color,#1a5276);border:2px solid #000;border-radius:8px 8px 4px 4px;}
  .ch-lo-hat-cap-bill{position:absolute;left:50%;bottom:-10px;width:88px;height:14px;margin-left:-12px;background:var(--lo-color,#1a5276);border:2px solid #000;border-radius:0 0 40px 40px;transform:rotate(-8deg);}
  .ch-lo-hat-chef{top:-52px;width:110px;height:28px;background:#f0f0f0;border:2px solid #000;border-radius:6px;}
  .ch-lo-hat-chef-poof{position:absolute;left:50%;bottom:100%;width:96px;height:72px;margin-left:-48px;background:var(--lo-color,#f8f8f8);border:2px solid #000;border-radius:50%;box-shadow:inset 0 -12px 0 rgba(0,0,0,.06);}
  .ch-lo-hat-pirate-hat{top:-92px;width:228px;height:116px;}
  .ch-lo-pirate-hat-img{display:block;width:100%;height:100%;object-fit:contain;object-position:center bottom;pointer-events:none;user-select:none;}
  .ch-lo-hat-headphones{top:-96px;width:300px;height:181px;}
  .ch-lo-headphones-img{display:block;width:100%;height:100%;object-fit:contain;object-position:center bottom;transform:scaleX(1.5);transform-origin:center bottom;pointer-events:none;user-select:none;}
  .ch-lo-hat-viking-hat{top:-165px;width:196px;height:196px;}
  .ch-lo-viking-hat-img{display:block;width:100%;height:100%;object-fit:contain;object-position:center bottom;pointer-events:none;user-select:none;}
  .ch-lo-hat-lady-hat{top:-112px;width:300px;height:162px;}
  .ch-lo-lady-hat-img{display:block;width:100%;height:100%;object-fit:contain;object-position:center bottom;pointer-events:none;user-select:none;}
  .ch-lo-hat-hunter-hat{top:-145px;width:220px;height:200px;}
  .ch-lo-hunter-hat-img{display:block;width:100%;height:100%;object-fit:contain;object-position:center bottom;pointer-events:none;user-select:none;}
  .ch-lo-hat-baseball-hat{top:-143px;left:50%;transform:translateX(calc(-50% + 22px));width:380px;height:216px;}
  .ch-lo-baseball-hat-img{display:block;width:100%;height:100%;object-fit:contain;object-position:center bottom;pointer-events:none;user-select:none;}
  .ch-lo-hat-pamela-hat{top:-123px;width:340px;height:184px;}
  .ch-lo-pamela-hat-img{display:block;width:100%;height:100%;object-fit:contain;object-position:center bottom;pointer-events:none;user-select:none;}
  /* ── Sunglasses ───────────────────────────────────────────────────────── */
  .ch-lo-shades{position:absolute;left:50%;top:18px;width:118px;height:28px;transform:translateX(-50%);z-index:11;display:flex;align-items:center;justify-content:center;gap:6px;pointer-events:none;}
  .ch-lo-shades-lens{width:42px;height:22px;background:var(--lo-lens,#222);border:3px solid var(--lo-frame,#111);box-sizing:border-box;}
  .ch-lo-shades-bridge{width:10px;height:3px;background:var(--lo-frame,#111);margin-top:-4px;}
  .ch-lo-shades-round .ch-lo-shades-lens{border-radius:50%;}
  .ch-lo-shades-aviator .ch-lo-shades-lens{border-radius:40% 40% 45% 45%;height:26px;width:46px;}
  .ch-lo-shades-aviator .ch-lo-shades-bridge{width:14px;height:4px;border-radius:2px;}
  .ch-lo-shades-glasses{top:-55px;width:520px;height:173px;display:block;}
  .ch-lo-shades-glasses-blue{top:-55px;width:478px;height:159px;display:block;}
  .ch-lo-shades-glasses-green{top:-55px;width:525px;height:175px;display:block;}
  .ch-lo-shades-glasses-circle{top:-52px;width:500px;height:166px;display:block;}
  .ch-lo-shades-glasses-yellow{top:-52px;width:510px;height:170px;display:block;}
  .ch-lo-shades-glasses-optic{top:-52px;width:510px;height:170px;display:block;}
  .ch-lo-shades-glasses-skiing{top:-40px;width:560px;height:186px;display:block;}
  .ch-lo-glasses-img{display:block;width:100%;height:100%;object-fit:contain;object-position:center;pointer-events:none;user-select:none;}

  /* ── Necklace (pearls — pendant reuses .ch-necklace) ──────────────────── */
  .ch-lo-necklace-pearls{position:absolute;left:50%;top:38px;width:150px;height:50px;transform:translateX(-50%);z-index:9;pointer-events:none;}
  .ch-lo-necklace-pearls:before{content:"";position:absolute;left:50%;top:0;width:148px;height:28px;margin-left:-74px;border:4px dotted var(--lo-color,#f5f0e6);border-top:none;border-radius:0 0 50% 50%;box-sizing:border-box;}
  .ch-lo-necklace-pearls:after{content:"";position:absolute;left:50%;top:22px;width:8px;height:8px;margin-left:-4px;border-radius:50%;background:var(--lo-color,#f5f0e6);border:1px solid rgba(0,0,0,.2);box-shadow:24px 4px 0 var(--lo-color),-24px 4px 0 var(--lo-color),48px 10px 0 var(--lo-color),-48px 10px 0 var(--lo-color);}

  /* ── Tops ───────────────────────────────────────────────────────────── */
  .ch-lo-top{position:absolute;left:50%;top:52px;width:156px;height:88px;transform:translateX(-50%);z-index:8;pointer-events:none;border-radius:24px 24px 8px 8px;}
  .ch-lo-top-tee{background:var(--lo-color,#4a90d9);border:2px solid rgba(0,0,0,.35);box-shadow:inset 0 -12px 0 rgba(0,0,0,.12);}
  .ch-lo-top-sleeve{position:absolute;top:8px;width:28px;height:44px;background:var(--lo-color,#4a90d9);border:2px solid rgba(0,0,0,.35);border-radius:20px;}
  .ch-lo-top-sleeve-l{left:-18px;transform:rotate(12deg);}
  .ch-lo-top-sleeve-r{right:-18px;transform:rotate(-12deg);}
  .ch-lo-top-tank{background:var(--lo-color,#39ff14);border:2px solid rgba(0,0,0,.3);width:120px;height:72px;top:58px;border-radius:18px;box-shadow:inset 0 -8px 0 rgba(0,0,0,.1);}
  .ch-lo-top-tie-dye{background:repeating-linear-gradient(135deg,var(--lo-accent,#e85074) 0 12px,var(--lo-color,#6c5ce7) 12px 24px,#ffd93d 24px 36px,#6bcb77 36px 48px);border:2px solid rgba(0,0,0,.3);box-shadow:inset 0 -10px 0 rgba(0,0,0,.08);}

  /* ── Bottoms ──────────────────────────────────────────────────────────── */
  .ch-lo-bottom{pointer-events:none;z-index:7;}
  .ch-lo-bottom-shorts{position:absolute;left:50%;bottom:-42px;width:130px;height:38px;transform:translateX(-50%);background:var(--lo-color,#5d6d7e);border:2px solid #000;border-radius:4px 4px 14px 14px;}
  .ch-lo-bottom-jeans{position:absolute;left:50%;bottom:-58px;width:34px;height:52px;transform:translateX(-50%);background:var(--lo-color,#2c3e6b);border:2px solid #1a2540;border-radius:0 0 8px 8px;box-shadow:38px 0 0 var(--lo-color),-38px 0 0 var(--lo-color),38px 0 0 #1a2540,-38px 0 0 #1a2540;}
  .ch-lo-bottom-dress{position:absolute;left:50%;top:48px;width:168px;height:148px;transform:translateX(-50%);background:var(--lo-color,#e17055);border:2px solid rgba(0,0,0,.35);border-radius:28px 28px 40px 40px;z-index:8;box-shadow:inset 0 -16px 0 rgba(0,0,0,.1);}
  .ch-lo-bottom-dress:before{content:"";position:absolute;left:50%;top:-8px;width:60px;height:24px;margin-left:-30px;background:var(--lo-color,#e17055);border:2px solid rgba(0,0,0,.35);border-bottom:none;border-radius:20px 20px 0 0;}

  /* ── Hand props ───────────────────────────────────────────────────────── */
  .ch-right-hand .ch-lo-boombox{position:absolute;left:-36px;top:-14px;width:136px;height:112px;transform:rotate(38deg);transform-origin:50% 92%;z-index:12;pointer-events:none;}
  .ch-lo-boombox-img{display:block;width:100%;height:100%;object-fit:contain;object-position:center bottom;pointer-events:none;user-select:none;}
  .ch-right-hand .ch-lo-balloons{position:absolute;left:-108px;top:-195px;width:320px;height:264px;transform:rotate(68deg);transform-origin:50% 92%;z-index:12;pointer-events:none;}
  .ch-lo-balloons-img{display:block;width:100%;height:100%;object-fit:contain;object-position:center bottom;pointer-events:none;user-select:none;}
  .ch-right-hand .ch-lo-balloons-2{position:absolute;left:-108px;top:-195px;width:320px;height:264px;transform:rotate(68deg);transform-origin:50% 92%;z-index:12;pointer-events:none;}
  .ch-lo-balloons-2-img{display:block;width:100%;height:100%;object-fit:contain;object-position:center bottom;pointer-events:none;user-select:none;}
  .ch-right-hand .ch-lo-hotdog{position:absolute;left:-39px;top:18px;width:176px;height:110px;transform:rotate(18deg);transform-origin:50% 88%;z-index:12;pointer-events:none;}
  .ch-lo-hotdog-img{display:block;width:100%;height:100%;object-fit:contain;object-position:center bottom;pointer-events:none;user-select:none;}
  .ch-right-hand .ch-lo-donut{position:absolute;left:-39px;top:18px;width:176px;height:110px;transform:rotate(18deg);transform-origin:50% 88%;z-index:12;pointer-events:none;}
  .ch-lo-donut-img{display:block;width:100%;height:100%;object-fit:contain;object-position:center bottom;pointer-events:none;user-select:none;}
  .ch-right-hand .ch-lo-fries{position:absolute;left:-59px;top:-2px;width:176px;height:110px;transform:rotate(40deg);transform-origin:50% 88%;z-index:12;pointer-events:none;}
  .ch-lo-fries-img{display:block;width:100%;height:100%;object-fit:contain;object-position:center bottom;pointer-events:none;user-select:none;}
  .ch-right-hand .ch-lo-pizza{position:absolute;left:-119px;top:-22px;width:220px;height:138px;transform:rotate(70deg);transform-origin:50% 88%;z-index:12;pointer-events:none;}
  .ch-lo-pizza-img{display:block;width:100%;height:100%;object-fit:contain;object-position:center bottom;pointer-events:none;user-select:none;}
  .ch-right-hand .ch-lo-tacos{position:absolute;left:-79px;top:-42px;width:176px;height:110px;transform:rotate(90deg);transform-origin:50% 88%;z-index:12;pointer-events:none;}
  .ch-lo-tacos-img{display:block;width:100%;height:100%;object-fit:contain;object-position:center bottom;pointer-events:none;user-select:none;}
  .ch-right-hand .ch-lo-popcorn{position:absolute;left:-109px;top:4px;width:220px;height:138px;transform:rotate(70deg);transform-origin:50% 88%;z-index:12;pointer-events:none;}
  .ch-lo-popcorn-img{display:block;width:100%;height:100%;object-fit:contain;object-position:center bottom;pointer-events:none;user-select:none;}
  .ch-right-hand .ch-lo-lollipop{position:absolute;left:-18px;top:-260px;width:182px;height:260px;transform:rotate(110deg);transform-origin:50% 92%;z-index:12;pointer-events:none;}
  .ch-lo-lollipop-img{display:block;width:100%;height:100%;object-fit:contain;object-position:center bottom;pointer-events:none;user-select:none;}
  .ch-right-hand .ch-lo-martini{position:absolute;left:-99px;top:-22px;width:220px;height:138px;transform:rotate(40deg);transform-origin:50% 88%;z-index:12;pointer-events:none;}
  .ch-lo-martini-img{display:block;width:100%;height:100%;object-fit:contain;object-position:center bottom;pointer-events:none;user-select:none;}
  .ch-right-hand .ch-lo-lemonade{position:absolute;left:-99px;top:-42px;width:220px;height:138px;transform:rotate(40deg);transform-origin:50% 88%;z-index:12;pointer-events:none;}
  .ch-lo-lemonade-img{display:block;width:100%;height:100%;object-fit:contain;object-position:center bottom;pointer-events:none;user-select:none;}
  .ch-right-hand .ch-lo-beer{position:absolute;left:-99px;top:-22px;width:220px;height:138px;transform:rotate(40deg);transform-origin:50% 88%;z-index:12;pointer-events:none;}
  .ch-lo-beer-img{display:block;width:100%;height:100%;object-fit:contain;object-position:center bottom;pointer-events:none;user-select:none;}
  .ch-right-hand .ch-lo-bottle{position:absolute;left:-99px;top:-22px;width:220px;height:138px;transform:rotate(40deg);transform-origin:50% 88%;z-index:12;pointer-events:none;}
  .ch-lo-bottle-img{display:block;width:100%;height:100%;object-fit:contain;object-position:center bottom;pointer-events:none;user-select:none;}
  .ch-right-hand .ch-lo-water{position:absolute;left:-99px;top:-22px;width:220px;height:138px;transform:rotate(40deg);transform-origin:50% 88%;z-index:12;pointer-events:none;}
  .ch-lo-water-img{display:block;width:100%;height:100%;object-fit:contain;object-position:center bottom;pointer-events:none;user-select:none;}
  .ch-right-hand .ch-lo-juice{position:absolute;left:-99px;top:-22px;width:220px;height:138px;transform:rotate(40deg);transform-origin:50% 88%;z-index:12;pointer-events:none;}
  .ch-lo-juice-img{display:block;width:100%;height:100%;object-fit:contain;object-position:center bottom;pointer-events:none;user-select:none;}
  .ch-right-hand .ch-lo-glowsticks{position:absolute;left:16px;top:-6px;width:96px;height:96px;transform:rotate(339deg);transform-origin:50% 92%;z-index:12;pointer-events:none;}
  .ch-lo-glowsticks-img{display:block;width:100%;height:100%;object-fit:contain;object-position:center bottom;pointer-events:none;user-select:none;}
`;
