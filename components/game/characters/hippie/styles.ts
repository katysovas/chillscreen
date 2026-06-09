/** Hippie / Deadhead outfit — tie-dye swirl shirt, peace pendant, bell-bottom jeans. */
export const HIPPIE_CHARACTER_STYLES = `
  .ch-outfit-hippie .ch-body{background:repeating-linear-gradient(135deg,#f24a6e 0 8px,#ff9b2e 8px 16px,#fff24a 16px 24px,#38d4a0 24px 32px,#4a7ef2 32px 40px,#b44ae8 40px 48px);}
  .ch-outfit-hippie .ch-body:before{top:0;bottom:auto;height:92px;border-radius:28px 28px 8px 8px;border:2px solid rgba(0,0,0,.25);background:
    radial-gradient(circle at 50% 42%,
      #fff24a 0 9px,
      #ff9b2e 9px 18px,
      #f24a6e 18px 27px,
      #b44ae8 27px 36px,
      #4a7ef2 36px 45px,
      #38d4a0 45px 54px,
      #fff24a 54px 63px,
      #ff9b2e 63px 72px,
      #f24a6e 72px 81px,
      #b44ae8 81px 90px,
      #4a7ef2 90px 100px);}
  /* Peace pendant on a leather cord */
  .ch-outfit-hippie .ch-body:after{content:"☮";position:absolute;left:50%;top:58px;transform:translateX(-50%);width:34px;height:34px;line-height:34px;text-align:center;font-size:30px;color:#7a5230;z-index:9;border-radius:50%;}
  /* Tie-dye bell-bottoms — diagonal rainbow stripes */
  .ch-outfit-hippie .ch-legs span{background:repeating-linear-gradient(135deg,#f24a6e 0 7px,#ff9b2e 7px 14px,#fff24a 14px 21px,#38d4a0 21px 28px,#4a7ef2 28px 35px,#b44ae8 35px 42px);border-color:#5a2a7a;}
  .ch-outfit-hippie .ch-legs span:before{width:40px;height:16px;bottom:-14px;background:repeating-linear-gradient(45deg,#b44ae8 0 7px,#4a7ef2 7px 14px,#38d4a0 14px 21px,#fff24a 21px 28px,#ff9b2e 28px 35px,#f24a6e 35px 42px);border-color:#5a2a7a;}
  .ch-outfit-hippie .ch-legs span:after{background:linear-gradient(90deg,#f24a6e,#ff9b2e,#fff24a,#38d4a0,#4a7ef2,#b44ae8);height:8px;bottom:-2px;}
  .ch-outfit-hippie .ch-left-hand{display:none;}
  /* Rainbow headband */
  .ch-outfit-hippie .ch-body .ch-eyes:before{content:"";position:absolute;left:-58px;right:-58px;top:-26px;height:12px;background:linear-gradient(90deg,#f24a6e,#ff9b2e,#fff24a,#38d4a0,#4a7ef2,#b44ae8);border:2px solid rgba(0,0,0,.3);border-radius:6px;z-index:13;}
`;
