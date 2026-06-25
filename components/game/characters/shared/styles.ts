/** Base sprite — body, face, hands, legs, walk / dance / jump animations. */
export const SHARED_CHARACTER_STYLES = `
  .ch-wrapper{width:500px;height:240px;position:relative;will-change:transform;}
  .ch-animal{position:relative;animation:ch-animal 2s 1s infinite alternate;}
  .ch-body{background:#cccccc;border:2px solid #000;width:170px;height:170px;border-radius:30px;margin:0 auto;position:relative;}
  .ch-body:before{content:"";position:absolute;left:5px;right:5px;bottom:10px;top:0;border-radius:30px;background:#fff;}
  .ch-ears{position:absolute;top:0;left:50%;right:-10px;height:20px;width:180px;transform:translateX(-50%);}
  .ch-ears:before,.ch-ears:after{content:"";background:#000;width:15px;height:30px;float:left;border-radius:10px;transform:rotate(-45deg);}
  .ch-ears:after{float:right;transform:rotate(45deg);}
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
  .ch-drums-prop .ch-body{position:relative;z-index:2;}
  .ch-drums-prop .ch-legs{position:relative;z-index:1;}
  .ch-legs span{width:10px;height:20px;border-right:2px solid #605d5e;border-left:2px solid #605d5e;display:inline-block;margin:0 20px;position:relative;top:-8px;z-index:1;animation:ch-right-leg 2s 1s infinite alternate;transform:rotate(5deg);}
  .ch-legs span:before{content:"";width:25px;height:10px;position:absolute;border-radius:0 20px 20px 20px;border:2px solid #000;left:-2px;bottom:-12px;}
  .ch-legs span:after{content:"";background:rgba(200,200,200,.4);right:0;left:0;position:absolute;bottom:-2px;height:7px;}
  .ch-legs span:first-child{animation:ch-left-leg 2s 1s infinite alternate;transform:rotate(-5deg);}
  .ch-legs span:first-child:before{right:-2px;left:inherit;border-radius:20px 0 20px 20px;}
  .ch-walking .ch-animal{animation-duration:.36s!important;}
  .ch-walking .ch-legs span{animation:ch-step-a .36s ease-in-out infinite!important;transform-origin:top center!important;}
  .ch-walking .ch-legs span:first-child{animation:ch-step-b .36s ease-in-out infinite!important;transform-origin:top center!important;}
  .ch-walking .ch-legs span:before{animation:ch-foot-a .36s ease-in-out infinite!important;transform-origin:center top;}
  .ch-walking .ch-legs span:first-child:before{animation:ch-foot-b .36s ease-in-out infinite!important;transform-origin:center top;}
  .ch-walking .ch-right-hand{animation-duration:.36s!important;animation-delay:0s!important;}
  .ch-hand-prop:not(.ch-walking):not(.ch-space-float) .ch-right-hand{
    animation:none!important;
    transform:rotate(-47deg)!important;
    top:70px!important;
  }
  .ch-space-float .ch-animal{animation:ch-space-float-bob 5.2s ease-in-out infinite!important;}
  .ch-space-float .ch-legs span,.ch-space-float .ch-legs span:first-child{
    animation:ch-space-float-legs 5.2s ease-in-out infinite!important;
    transform-origin:top center!important;
  }
  .ch-space-float .ch-right-hand{animation:ch-space-float-hand 4.8s ease-in-out infinite alternate!important;}
  .ch-space-float-moving .ch-animal{animation-duration:3.6s!important;}
  .ch-space-float-moving .ch-legs span,.ch-space-float-moving .ch-legs span:first-child{animation-duration:3.6s!important;}
  .ch-dancing .ch-animal{animation:ch-dance-bounce .28s ease-in-out infinite alternate!important;}
  .ch-dancing{animation:ch-dance-sway .56s ease-in-out infinite;transform-origin:bottom center;}
  .ch-dancing:not(.ch-walking) .ch-legs span{
    animation:ch-dance-stomp .56s ease-in-out infinite!important;
    transform-origin:top center!important;
  }
  .ch-dancing:not(.ch-walking) .ch-legs span:first-child{
    animation:ch-dance-stomp-l .56s ease-in-out .28s infinite!important;
    transform-origin:top center!important;
  }
  .ch-dancing:not(.ch-guitar-prop):not(.ch-free-hand-right) .ch-left-hand,
  .ch-dancing:not(.ch-guitar-prop):not(.ch-free-hand-right).ch-walking .ch-left-hand{
    animation:ch-dance-party-sway-left 1.15s ease-in-out infinite alternate!important;
    transform-origin:88% 8%;
  }
  .ch-dancing.ch-free-hand-right:not(.ch-guitar-prop) .ch-right-hand,
  .ch-dancing.ch-free-hand-right:not(.ch-guitar-prop).ch-walking .ch-right-hand{
    animation:ch-dance-party-sway-right 1.15s ease-in-out infinite alternate!important;
    transform-origin:12% 8%;
  }
  .ch-dancing.ch-free-hand-left .ch-right-hand,
  .ch-dancing.ch-free-hand-left.ch-walking .ch-right-hand{
    animation:ch-dance-held-bob .56s ease-in-out infinite alternate!important;
  }
  .ch-dancing.ch-free-hand-right .ch-left-hand,
  .ch-dancing.ch-free-hand-right.ch-walking .ch-left-hand{
    animation:ch-dance-held-bob .56s ease-in-out infinite alternate!important;
  }
  .ch-dancing.ch-guitar-prop.ch-free-hand-left .ch-left-hand,
  .ch-dancing.ch-guitar-prop.ch-free-hand-left.ch-walking .ch-left-hand{
    animation:ch-dance-guitar-left-sway 1.1s ease-in-out infinite alternate!important;
    transform-origin:85% 10%;
  }
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
  @keyframes ch-dance-guitar-left-sway{
    from{transform:rotate(-16deg);}
    to{transform:rotate(16deg);}
  }
  @keyframes ch-dance-happy-eyes{
    0%,60%,100%{height:10px;width:10px;border-radius:50%;}
    75%{height:4px;width:12px;border-radius:50% 50% 0 0;}
  }
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
  @keyframes ch-eyes{from{width:10px;height:10px;}to{width:15px;height:15px;}}
  @keyframes ch-animal{from{bottom:0;}to{bottom:22px;}}
  @keyframes ch-right-hand{from{transform:rotate(-47deg);top:70px;}to{transform:rotate(-80deg);top:50px;}}
  @keyframes ch-left-leg{0%{transform:rotate(-5deg);}100%{transform:rotate(-30deg);}}
  @keyframes ch-right-leg{0%{transform:rotate(5deg);}100%{transform:rotate(30deg);}}
  @keyframes ch-jump-outer{
    0%  { transform:translateY(0);      animation-timing-function:cubic-bezier(0.215,0.61,0.355,1); }
    42% { transform:translateY(-100px); animation-timing-function:cubic-bezier(0.55,0.055,0.675,0.19); }
    100%{ transform:translateY(0); }
  }
  @keyframes ch-space-float-bob{
    0%,100%{transform:translateY(0);}
    50%{transform:translateY(-14px);}
  }
  @keyframes ch-space-float-legs{
    0%,100%{transform:rotate(-6deg);}
    50%{transform:rotate(6deg);}
  }
  @keyframes ch-space-float-hand{
    from{transform:rotate(-52deg) translateY(0);}
    to{transform:rotate(-68deg) translateY(-6px);}
  }
`;
