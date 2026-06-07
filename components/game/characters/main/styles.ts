/** Main character — heart balloon (default player / NPC accessory). */
export const MAIN_CHARACTER_STYLES = `
  .ch-ballons{position:absolute;left:84.8%;z-index:1;width:150px;height:150px;top:-70px;transform:translateX(-50%) scale(1,1.1);}
  .ch-ballons:before{content:"";position:absolute;left:20px;top:106px;z-index:1;width:2px;height:60px;background:#000;}
  .ch-heart{position:relative;animation:ch-heart 2s 1s infinite alternate;}
  .ch-heart span{width:60px;height:100px;background:#ef4023;position:absolute;left:5px;top:0;border-radius:50px 50px 0 0;transform:rotate(45deg);}
  .ch-heart span:last-child{right:113px;left:initial;transform:scale(-1,1) rotate(45deg);}
  @keyframes ch-heart{0%{transform:scale(.8);top:22px;right:11px;}to{transform:scale(1.2);top:-21px;right:-11px;}}
`;
