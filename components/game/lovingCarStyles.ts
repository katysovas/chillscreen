export const LVC_CSS = `
  .lvc-layer {
    position: absolute;
    inset: 0;
    z-index: 25;
    pointer-events: none;
    overflow: visible;
    will-change: transform;
    contain: layout style paint;
  }

  .lvc-runner {
    position: absolute;
    bottom: 11%;
    left: 0;
    will-change: left;
  }
  @keyframes lvc-wheel {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  @keyframes lvc-wheel-shadow {
    0%, 20%, 40%, 45%, 60%, 80%, 100% { top: 0; }
    70% { top: 3px; }
    30%, 90% { top: 6px; }
  }
  @keyframes lvc-body-bounce {
    0%, 20%, 40%, 45%, 60%, 80%, 100% { top: 0; }
    70% { top: 3px; }
    30%, 90% { top: 6px; }
  }
  @keyframes lvc-glare {
    from { left: 100%; }
    to { left: -100%; }
  }
  @keyframes lvc-curtain {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(2px); }
  }
  @keyframes lvc-love1 {
    0% { opacity: 0; transform: scale(0.2) rotate(0deg) translate3d(100px, 0, 0); }
    50% { opacity: 1; }
    100% { opacity: 0; transform: scale(0.8) rotate(-40deg) translate3d(-50px, -400px, 0); }
  }
  @keyframes lvc-love2 {
    0% { opacity: 0; transform: scale(0.3) rotate(0deg) translate3d(100px, 0, 0); }
    50% { opacity: 1; }
    100% { opacity: 0; transform: scale(0.7) rotate(-50deg) translate3d(-80px, -450px, 0); }
  }
  @keyframes lvc-love3 {
    0% { opacity: 0; transform: scale(0.3) rotate(0deg) translate3d(100px, 0, 0); }
    50% { opacity: 1; }
    100% { opacity: 0; transform: scale(0.65) rotate(-60deg) translate3d(-40px, -400px, 0); }
  }
  @keyframes lvc-love4 {
    0% { opacity: 0; transform: scale(0.2) rotate(0) translate3d(0, 0, 0); }
    50% { opacity: 1; }
    100% { opacity: 0; transform: scale(0.6) rotate(-25deg) translate3d(100px, -200px, 0); }
  }
  @keyframes lvc-love5 {
    0% { opacity: 0; transform: scale(0.2) rotate(0) translate3d(0, 0, 0); }
    50% { opacity: 1; }
    100% { opacity: 0; transform: scale(0.5) rotate(-20deg) translate3d(200px, -250px, 0); }
  }

  .lvc-root { box-sizing: border-box; pointer-events: none; }
  .lvc-root *, .lvc-root *::before, .lvc-root *::after { box-sizing: border-box; }

  .lvc-stage {
    position: relative;
    width: 500px;
    height: 220px;
    transform: scale(var(--lvc-scale, 0.35));
    transform-origin: left bottom;
  }

  .lvc-vehicle-body {
    width: 500px;
    height: 220px;
    position: absolute;
    left: 0;
    bottom: 33px;
    z-index: 9;
    border-radius: 15px 60px 0 15px;
  }

  .lvc-wrap-body {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    animation: lvc-body-bounce 3s infinite ease;
  }

  .lvc-body-cover {
    position: absolute;
    border: solid 5px #4b1a61;
    width: 100%;
    background-color: #c6edff;
    height: 100%;
    left: 0;
    top: 0;
    overflow: hidden;
    border-radius: 15px 60px 0 15px;
  }

  .lvc-top-roof {
    position: absolute;
    left: 0;
    top: 0;
    background-color: #ffe400;
    border-bottom: solid 4px #4b1a61;
    width: 100%;
    height: 14px;
  }

  .lvc-rooftop {
    background-color: #fa7775;
    border: solid 4px #4b1a61;
    border-bottom: none;
    bottom: 100%;
    overflow: hidden;
    position: absolute;
  }
  .lvc-rooftop::after {
    content: "";
    position: absolute;
    left: 0;
    bottom: 0;
    width: 100%;
    background-color: #f56d6b;
    height: 50%;
  }
  .lvc-rooftop-back { width: 60px; left: 20%; height: 15px; border-radius: 4px 4px 0 0; }
  .lvc-rooftop-front { width: 80px; left: 40%; height: 25px; border-radius: 4px 20px 0 0; }

  .lvc-indi {
    width: 24px;
    height: 10px;
    box-shadow: 0 3px 0 #b0dff5;
    position: absolute;
    border: solid 3px #4b1a61;
    left: 10px;
    background-color: #ffa700;
  }
  .lvc-indi-top { top: 24px; }
  .lvc-indi-bottom { bottom: 60px; }

  .lvc-back-window {
    height: 53%;
    top: 14%;
    left: 50px;
    width: 190px;
    position: absolute;
  }
  .lvc-window-base {
    width: 100%;
    height: 12px;
    background-color: #abec39;
    border-radius: 10px;
    border: solid 3px #4b1a61;
    box-shadow: 0 3px 0 rgba(0,0,0,0.15);
    position: relative;
    z-index: 1;
  }
  .lvc-window-base-bottom {
    bottom: 0;
    position: absolute;
    left: 0;
  }
  .lvc-sun-shade {
    background-color: #fa7775;
    border: solid 4px #4b1a61;
    border-top: none;
    width: 90%;
    margin-left: 4.5%;
    height: 23px;
    position: relative;
    z-index: 0;
  }
  .lvc-curtain {
    position: relative;
    width: 90%;
    margin-left: 5%;
    font-size: 0;
    z-index: 2;
    white-space: nowrap;
  }
  .lvc-curtain span {
    height: 15px;
    border-radius: 0 0 15px 15px;
    display: inline-block;
    background-color: #fa7775;
    border: solid 4px #4b1a61;
    border-top: none;
    box-shadow: 0 3px 0 rgba(0,0,0,0.15);
    margin-left: -4px;
    animation: lvc-curtain 0.5s infinite linear;
  }
  .lvc-curtain span:nth-child(even) { background-color: #fff; }
  .lvc-curtain-back span { width: calc(12.5% + 2px); }
  .lvc-curtain-front span { width: calc(33.33% + 2px); }

  .lvc-glass-wrap-back {
    background-color: #f5f4f1;
    border-left: solid 4px #4b1a61;
    height: 60px;
    width: 80%;
    margin-left: 9%;
    margin-top: -10px;
    border-right: solid 4px #4b1a61;
    padding: 2px 5px;
    font-size: 0;
  }
  .lvc-glass {
    background-color: #9fd4ef;
    overflow: hidden;
    border: solid 3px #4b1a61;
    border-radius: 6px;
    height: 100%;
    display: inline-block;
    position: relative;
    z-index: 0;
  }
  .lvc-glass::after {
    content: "";
    position: absolute;
    background-color: rgba(63, 157, 201, 0.5);
    width: 100%;
    border-radius: 0 0 10px 10px;
    height: 60%;
    top: 0;
    left: 0;
  }
  .lvc-glass-pair .lvc-glass { width: 46%; }
  .lvc-glass-pair .lvc-glass + .lvc-glass { margin-left: 4%; }

  .lvc-light {
    width: 130%;
    height: 100%;
    position: absolute;
    top: -7px;
    left: -45%;
    opacity: 0.5;
    z-index: 0;
    transform: rotate(115deg);
    animation: lvc-glare 2s infinite linear;
  }
  .lvc-light span {
    width: 100%;
    display: block;
    margin-bottom: 2px;
    background-color: #fff;
  }
  .lvc-light1 { height: 10px; }
  .lvc-light2 { height: 3px; }
  .lvc-light3 { height: 6px; }

  .lvc-front-window {
    top: 14%;
    right: 20px;
    width: 70px;
    height: 60%;
    position: absolute;
  }
  .lvc-front-window .lvc-window-base { height: 10px; }
  .lvc-front-glass-wrap {
    height: 40px;
    width: 80%;
    margin-left: 9%;
    margin-top: -10px;
    border: solid 4px #4b1a61;
    border-top: none;
    background-color: #9fd4ef;
    border-radius: 0 0 10px 10px;
    padding: 2px 5px;
    overflow: hidden;
    position: relative;
  }
  .lvc-front-glass-wrap .lvc-light {
    width: 120%;
    left: -15%;
    opacity: 0.4;
    animation-duration: 1.5s;
  }

  .lvc-air-hole {
    position: absolute;
    width: 100%;
    bottom: 5px;
    padding-top: 5px;
  }
  .lvc-air-hole span {
    width: 30px;
    height: 5px;
    background-color: #f5f4f1;
    display: block;
    margin: auto;
    border-radius: 20px;
    border: solid 2px #4b1a61;
  }
  .lvc-air-hole span + span { margin-top: 1px; }

  .lvc-main-door {
    position: absolute;
    right: 120px;
    bottom: 0;
    border: solid 4px #4b1a61;
    border-radius: 10px 10px 0 0;
    width: 80px;
    height: 80%;
    z-index: 9;
    background-color: #f5f4f1;
  }
  .lvc-main-door::after {
    content: "";
    position: absolute;
    left: 0;
    bottom: 0;
    width: 100%;
    height: 11%;
    background-color: #e8e7e4;
  }
  .lvc-door-glass {
    background-color: #8fcae6;
    border: solid 3px #4b1a61;
    border-radius: 10px;
    width: 85%;
    height: 60px;
    margin-top: 5px;
    display: inline-block;
    overflow: hidden;
    position: relative;
  }
  .lvc-door-glass::after {
    content: "";
    position: absolute;
    background-color: rgba(255,255,255,0.3);
    width: 100%;
    border-radius: 12px 12px 10px 10px;
    height: 60%;
    bottom: 0;
    left: 0;
  }
  .lvc-door-light span {
    height: 70%;
    margin-top: 15%;
    display: inline-block;
    background-color: #5ba8cc;
  }
  .lvc-door-light .lvc-light1 { width: 15px; border-radius: 10px 0 0 10px; }
  .lvc-door-light .lvc-light2 { width: 10px; border-radius: 0 10px 10px 0; }
  .lvc-door-handle {
    background-color: #fa7775;
    border: solid 3px #4b1a61;
    width: 10px;
    height: 22px;
    position: absolute;
    right: 5px;
    bottom: 40%;
    border-radius: 20px;
  }
  .lvc-door-handle::before {
    content: "";
    position: absolute;
    width: 50%;
    border-radius: 20px;
    background-color: rgba(255,255,255,0.3);
    height: 100%;
  }

  .lvc-side-guard {
    background-color: #fa7775;
    border-top: solid 4px #4b1a61;
    bottom: 4px;
    position: absolute;
    left: 4px;
    width: calc(100% - 8px);
    height: 50px;
    border-radius: 0 0 0 10px;
  }
  .lvc-side-guard-shade {
    position: absolute;
    left: 0;
    border-radius: 0 0 0 15px;
    bottom: 0;
    width: 100%;
    background-color: #f56d6b;
    height: 40%;
  }
  .lvc-bumper {
    position: absolute;
    border: solid 4px #4b1a61;
    background-color: #a6a6a6;
    border-radius: 4px;
  }
  .lvc-bumper-front {
    right: -12px;
    width: 22px;
    height: 22px;
    bottom: -10px;
  }
  .lvc-bumper-back {
    width: 29px;
    top: 11px;
    box-shadow: 0 3px 0 rgba(0,0,0,0.15);
    left: -15px;
    height: 18px;
  }
  .lvc-front-indicator {
    width: 26px;
    height: 11px;
    box-shadow: 0 3px 0 #f56d6b;
    position: absolute;
    border: solid 3px #4b1a61;
    right: 10px;
    background-color: #ffe400;
    top: 5px;
  }

  .lvc-wheel-wrap {
    width: 80px;
    height: 80px;
    position: absolute;
    z-index: 9;
    bottom: -40px;
  }
  .lvc-wheel-wrap-back { left: 80px; }
  .lvc-wheel-wrap-front { right: 70px; }
  .lvc-wheel-shadow {
    width: 100%;
    height: 100%;
    display: block;
    border-top: solid 40px #4b1a61;
    border-radius: 50%;
    position: relative;
    animation: lvc-wheel-shadow 3s infinite ease;
  }
  .lvc-wheel {
    width: 76%;
    height: 76%;
    left: 12%;
    top: 12%;
    position: absolute;
    font-size: 0;
    border-radius: 50%;
  }
  .lvc-wheel::after {
    content: "";
    top: 1px;
    left: 2px;
    height: 100%;
    position: absolute;
    width: calc(100% - 4px);
    box-shadow: inset 0 7px 0 #747474;
    border-radius: 50%;
    z-index: 9;
  }
  .lvc-wheel-outer {
    position: absolute;
    width: 100%;
    background-color: #a6a6a6;
    border: solid 3px #4b1a61;
    border-radius: 50%;
    top: 0;
    left: 0;
    height: 100%;
    animation: lvc-wheel 0.4s infinite linear;
  }
  .lvc-wheel-outer::after {
    content: "";
    position: absolute;
    width: 10px;
    height: 5px;
    background-color: #b8b8b8;
    top: 5px;
    left: 16px;
    z-index: 8;
    border-radius: 50%;
  }
  .lvc-wheel-cup {
    width: 60%;
    height: 60%;
    margin-top: 20%;
    display: inline-block;
    position: relative;
    background-color: #8fcae6;
    border: solid 3px #3d1450;
    border-radius: 50%;
    transform: rotate(45deg);
    padding: 5px 4px;
  }
  .lvc-wheel-cup span {
    display: inline-block;
    width: 6px;
    height: 6px;
    margin: 1px;
    background-color: #a6a6a6;
    border-radius: 50%;
    border: solid 1px #3d1450;
  }

  .lvc-love {
    width: 34px;
    height: 34px;
    position: relative;
    display: inline-block;
    font-size: 0;
    transform: rotate(30deg);
  }
  .lvc-love-circle {
    background-color: #fe1239;
    width: 24px;
    height: 24px;
    position: absolute;
    border-radius: 50%;
    display: inline-block;
  }
  .lvc-love-circle1 { left: 0; bottom: 0; }
  .lvc-love-circle2 { right: 0; top: 0; }
  .lvc-love-square {
    background-color: #fe1239;
    width: 24px;
    height: 24px;
    position: absolute;
    right: 0;
    bottom: 0;
  }

  .lvc-love-front {
    position: absolute;
    right: 24%;
    bottom: 30%;
    z-index: 8;
    transform: rotate(50deg);
  }
  .lvc-love-front .lvc-love-wrap { opacity: 0; position: absolute; left: 0; top: 0; }
  .lvc-love-front .lvc-love-wrap:nth-child(1) { animation: lvc-love1 5s infinite ease-in 0.5s; }
  .lvc-love-front .lvc-love-wrap:nth-child(2) { animation: lvc-love1 5s infinite ease-in 1s; }
  .lvc-love-front .lvc-love-wrap:nth-child(3) { animation: lvc-love1 5s infinite ease-in 1.5s; }
  .lvc-love-front .lvc-love-wrap:nth-child(4) { animation: lvc-love1 5s infinite ease-in 2s; }
  .lvc-love-front .lvc-love-wrap:nth-child(5) { animation: lvc-love2 6s infinite ease-in 2.5s; }
  .lvc-love-front .lvc-love-wrap:nth-child(6) { animation: lvc-love2 6s infinite ease-in 3s; }
  .lvc-love-front .lvc-love-wrap:nth-child(7) { animation: lvc-love2 6s infinite ease-in 3.5s; }
  .lvc-love-front .lvc-love-wrap:nth-child(8) { animation: lvc-love2 6s infinite ease-in 4s; }
  .lvc-love-front .lvc-love-wrap:nth-child(9) { animation: lvc-love3 4s infinite ease-in 4.5s; }
  .lvc-love-front .lvc-love-wrap:nth-child(10) { animation: lvc-love3 4s infinite ease-in 5s; }
  .lvc-love-front .lvc-love-wrap:nth-child(11) { animation: lvc-love3 4s infinite ease-in 5.5s; }
  .lvc-love-front .lvc-love-wrap:nth-child(12) { animation: lvc-love3 4s infinite ease-in 6s; }

  .lvc-love-back {
    position: absolute;
    left: 18%;
    bottom: 20%;
    z-index: 5;
    transform: rotate(-90deg);
  }
  .lvc-love-back .lvc-love { transform: rotate(100deg); }
  .lvc-love-back .lvc-love-wrap { position: absolute; left: 0; top: 0; }
  .lvc-love-back .lvc-love-wrap:nth-child(1) { animation: lvc-love4 4s infinite ease-in 0s; }
  .lvc-love-back .lvc-love-wrap:nth-child(2) { animation: lvc-love4 4s infinite ease-in 0.5s; }
  .lvc-love-back .lvc-love-wrap:nth-child(3) { animation: lvc-love4 4s infinite ease-in 1s; }
  .lvc-love-back .lvc-love-wrap:nth-child(4) { animation: lvc-love4 4s infinite ease-in 1.5s; }
  .lvc-love-back .lvc-love-wrap:nth-child(5) { animation: lvc-love5 3s infinite ease-in 2.5s; }
  .lvc-love-back .lvc-love-wrap:nth-child(6) { animation: lvc-love5 3s infinite ease-in 3s; }
  .lvc-love-back .lvc-love-wrap:nth-child(7) { animation: lvc-love5 3s infinite ease-in 3.5s; }
  .lvc-love-back .lvc-love-wrap:nth-child(8) { animation: lvc-love5 3s infinite ease-in 4s; }
`;
