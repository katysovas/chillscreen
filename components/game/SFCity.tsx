'use client';
import { useState, useEffect, useRef } from 'react';
import Character from './Character';
import NPC, { screenPctToWorldX, worldXToScreenPct } from './NPC';
import { NpcChatOverlay, PlayerChatOverlay } from './ConnectChatOverlay';
import { playerBubbleSide } from './ChatBubble';
import { VenueRoadSigns } from './VenueRoadSigns';
import { CHAR_BOTTOM } from './groundLayout';
import Cinema, { CINEMA_SCALE, CINEMA_HEIGHT } from './Cinema';
import Concert, { CONCERT_SCALE, CONCERT_HEIGHT, CONCERT_WIDTH } from './Concert';
import {
  cinemaLiveTile,
  concertLiveTile,
  venueInFocus,
  isVenueInView,
  cinemaMidX,
  concertMidX,
  VIEW_WIDTH,
  START_WORLD_OFF,
} from '@/lib/venues';
import { getConcertInView, subscribeConcertInView } from '@/lib/concertNow';
import CHARACTERS from './characters';
import {
  getPlayerName,
  setPlayerName as savePlayerName,
  isValidPlayerName,
} from '@/lib/playerStorage';
import { pickFallbackReply, type ChatTurn } from '@/lib/npcChat';
import { fetchNpcReplyWithTyping } from '@/lib/npcChatClient';
import { getCinemaNowPlaying, subscribeCinemaNowPlaying } from '@/lib/cinemaNow';
import { getConcertNowPlaying, subscribeConcertNowPlaying } from '@/lib/concertNowPlaying';
import { GROUND_TREE_XS } from '@/lib/sleepingCats';
import { gameWorldOffRef } from '@/lib/gameWorldRef';
import { isNearConcert } from '@/lib/concertDance';
import { loadCinemaVideos } from '@/lib/cinemaVideoPool';
import { SleepingCatsGround } from './SleepingCat';
import { LovingCarLayer } from './LovingCar';
import { SKY_CREATURES_KF, SkyCreaturesLayer } from './SkyCreatures';

// ─── Keyframes & character CSS ───────────────────────────────────────────────
const KF = `
  @keyframes cloud1 { 0%,100%{transform:translateX(0)}  50%{transform:translateX(16px)} }
  @keyframes cloud2 { 0%,100%{transform:translateX(0)}  50%{transform:translateX(-12px)} }
  @keyframes cloud3 { 0%,100%{transform:translateX(0)}  50%{transform:translateX(9px)} }
  @keyframes sw1    { 0%,100%{transform:rotate(-1.5deg)} 50%{transform:rotate(1.5deg)} }
  @keyframes sw2    { 0%,100%{transform:rotate(-1deg)}   50%{transform:rotate(1deg)} }
  @keyframes sw3    { 0%,100%{transform:rotate(-2.2deg)} 50%{transform:rotate(2.2deg)} }
  @keyframes fdi       { from{opacity:0} to{opacity:1} }
  @keyframes greet-pop { 0%,100%{transform:translateX(-50%) scale(1) translateY(0);} 50%{transform:translateX(-50%) scale(1.18) translateY(-6px);} }
  @keyframes chat-in-left  { from{opacity:0;} to{opacity:1;} }
  @keyframes chat-in-right { from{opacity:0;} to{opacity:1;} }
  ${SKY_CREATURES_KF}

  .ch-wrapper{width:500px;height:240px;position:relative;}
  .ch-animal{position:relative;animation:ch-animal 2s 1s infinite alternate;}
  .ch-body{background:#cccccc;border:2px solid #000;width:170px;height:170px;border-radius:30px;margin:0 auto;position:relative;}
  .ch-body:before{content:"";position:absolute;left:5px;right:5px;bottom:10px;top:0;border-radius:30px;background:#fff;}
  .ch-ears{position:absolute;top:0;left:50%;right:-10px;height:20px;width:180px;transform:translateX(-50%);}
  .ch-ears:before,.ch-ears:after{content:"";background:#000;width:15px;height:30px;float:left;border-radius:10px;transform:rotate(-45deg);}
  .ch-ears:after{float:right;transform:rotate(45deg);}
  /* ch-ballons has NO animation — only the heart (ch-heart) bounces.
     The string therefore stays fixed relative to ch-animal and never
     disconnects from the hand. Only the character and the heart shape bounce. */
  .ch-ballons{position:absolute;left:84.8%;z-index:1;width:150px;height:150px;top:-70px;transform:translateX(-50%) scale(1,1.1);}
  .ch-ballons:before{content:"";position:absolute;left:20px;top:106px;z-index:1;width:2px;height:60px;background:#000;}
  .ch-heart{position:relative;animation:ch-heart 2s 1s infinite alternate;}
  .ch-heart span{width:60px;height:100px;background:#ef4023;position:absolute;left:5px;top:0;border-radius:50px 50px 0 0;transform:rotate(45deg);}
  .ch-heart span:last-child{right:113px;left:initial;transform:scale(-1,1) rotate(45deg);}
  .ch-eyes{position:absolute;left:50%;width:130px;top:24px;transform:translateX(-50%);}
  .ch-eyes:before,.ch-eyes:after{content:"";background:#000;width:10px;height:10px;border-radius:50%;float:right;animation:ch-eyes 2s 1s infinite alternate;}
  .ch-eyes:after{float:left;}
  .ch-nose{position:absolute;left:50%;top:30px;width:20px;height:20px;transform:translateX(-50%);}
  .ch-nose:before{content:"";position:absolute;left:50%;top:7px;bottom:4px;background:#938E8F;z-index:9;width:2px;transform:translateX(-50%);}
  .ch-nose:after{content:"";position:absolute;width:0;height:0;top:0;left:50%;border:8px solid transparent;border-top-color:#000;border-radius:8px;transform:translateX(-50%);}
  .ch-nose span{width:6px;height:8px;border:2px solid #938E8F;border-radius:50%;position:absolute;left:0;bottom:0;transform:rotate(-10deg);}
  .ch-nose span:last-child{right:0;left:inherit;transform:rotate(10deg);}
  .ch-nose span:before{content:"";background:#fff;position:absolute;left:-3px;right:-3px;bottom:3px;top:-3px;}
  .ch-left-hand{position:absolute;left:5px;top:70px;width:35px;height:60px;}
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
  .ch-legs span{width:10px;height:20px;border-right:2px solid #605d5e;border-left:2px solid #605d5e;display:inline-block;margin:0 20px;position:relative;top:-8px;z-index:1;animation:ch-right-leg 2s 1s infinite alternate;transform:rotate(5deg);}
  .ch-legs span:before{content:"";width:25px;height:10px;position:absolute;border-radius:0 20px 20px 20px;border:2px solid #000;left:-2px;bottom:-12px;}
  .ch-legs span:after{content:"";background:rgba(200,200,200,.4);right:0;left:0;position:absolute;bottom:-2px;height:7px;}
  .ch-legs span:first-child{animation:ch-left-leg 2s 1s infinite alternate;transform:rotate(-5deg);}
  .ch-legs span:first-child:before{right:-2px;left:inherit;border-radius:20px 0 20px 20px;}
  .ch-walking .ch-animal{animation-duration:.36s!important;}
  /* Cute quick march: each leg does a small lift-and-plant (mostly vertical),
     a tiny forward tilt, half a cycle out of phase. Fast tempo, little swing. */
  .ch-walking .ch-legs span{animation:ch-step-a .36s ease-in-out infinite!important;transform-origin:top center!important;}
  .ch-walking .ch-legs span:first-child{animation:ch-step-b .36s ease-in-out infinite!important;transform-origin:top center!important;}
  /* Foot stays flat to the ground with just a tiny tip, keeping it cute not floppy. */
  .ch-walking .ch-legs span:before{animation:ch-foot-a .36s ease-in-out infinite!important;transform-origin:center top;}
  .ch-walking .ch-legs span:first-child:before{animation:ch-foot-b .36s ease-in-out infinite!important;transform-origin:center top;}
  .ch-walking .ch-right-hand{animation-duration:.36s!important;animation-delay:0s!important;}
  /* Concert dance — quick vertical bounce; feet keep stepping while walking */
  .ch-dancing .ch-animal{animation:ch-dance-bounce .28s ease-in-out infinite alternate!important;}
  .ch-dancing:not(.ch-walking) .ch-legs span,.ch-dancing:not(.ch-walking) .ch-legs span:first-child{animation:none!important;}
  .ch-dancing:not(.ch-walking) .ch-legs span{transform:rotate(5deg)!important;}
  .ch-dancing:not(.ch-walking) .ch-legs span:first-child{transform:rotate(-5deg)!important;}
  .ch-dancing .ch-right-hand{animation:none!important;transform:rotate(-47deg)!important;}
  .ch-dancing .ch-left-hand{animation:ch-dance-left-sway 1.15s ease-in-out infinite alternate!important;transform-origin:88% 12%;}
  .ch-dancing .ch-heart,.ch-dancing .ch-eyes:before,.ch-dancing .ch-eyes:after{animation:none!important;}
  @keyframes ch-dance-bounce{
    from{transform:translateY(0);}
    to{transform:translateY(-26px);}
  }
  @keyframes ch-dance-left-sway{
    from{transform:rotate(-5deg);}
    to{transform:rotate(9deg);}
  }
  /* Leg lifts up then stamps down; small ±10° tilt so it steps, not swings. */
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
  /* Tiny toe tip on the lift, flat on the plant. */
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
  @keyframes ch-heart{0%{transform:scale(.8);top:22px;right:11px;}to{transform:scale(1.2);top:-21px;right:-11px;}}
  @keyframes ch-eyes{from{width:10px;height:10px;}to{width:15px;height:15px;}}
  @keyframes ch-animal{from{bottom:0;}to{bottom:22px;}}
  @keyframes ch-right-hand{from{transform:rotate(-47deg);top:70px;}to{transform:rotate(-80deg);top:50px;}}
  @keyframes ch-left-leg{0%{transform:rotate(-5deg);}100%{transform:rotate(-30deg);}}
  @keyframes ch-right-leg{0%{transform:rotate(5deg);}100%{transform:rotate(30deg);}}
  /* Natural jump arc: fast up (decelerate), then gravity-fall back down (accelerate). */
  @keyframes ch-jump-outer{
    0%  { transform:translateY(0);      animation-timing-function:cubic-bezier(0.215,0.61,0.355,1); }
    42% { transform:translateY(-100px); animation-timing-function:cubic-bezier(0.55,0.055,0.675,0.19); }
    100%{ transform:translateY(0); }
  }
`;

// ─── Parallax factors ─────────────────────────────────────────────────────────
const SKY_F = 0.08;
const MID_F = 0.35;
const GND_F = 1.0;

const SKY_TILE = 2000;
const MID_TILE = 2600;
const GND_TILE = 3600;

function nearTiles(vx: number, tileW: number): number[] {
  const t0 = Math.floor(vx / tileW) - 1;
  return [t0, t0 + 1, t0 + 2];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Cloud({ x, y, s = 1, anim = 'cloud1', del = 0 }: {
  x: number; y: number; s?: number; anim?: string; del?: number;
}) {
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}
      style={{ animation: `${anim} ${18 + del * 3}s ease-in-out infinite`, animationDelay: `${del}s` }}>
      <ellipse cx={60} cy={22} rx={70} ry={20} fill="#edf2f8" />
      <circle cx={28} cy={12} r={22} fill="#f2f7fc" />
      <circle cx={58} cy={2}  r={28} fill="#f5f9fd" />
      <circle cx={88} cy={9}  r={24} fill="#f2f7fc" />
      <circle cx={112} cy={16} r={18} fill="#edf2f8" />
      <ellipse cx={62} cy={28} rx={58} ry={11} fill="rgba(170,195,225,.28)" />
    </g>
  );
}

function Victorian({ x, y, col, w = 66, h = 148 }: {
  x: number; y: number; col: string; w?: number; h?: number;
}) {
  const win = 'rgba(150,200,230,.72)';
  return (
    <g>
      <ellipse cx={x + w * 0.35} cy={y + 5} rx={w * 0.62} ry={8} fill="rgba(20,40,80,.2)" />
      <rect x={x} y={y - h} width={w} height={h} fill={col} />
      <rect x={x} y={y - h} width={10} height={h} fill="rgba(0,20,60,.22)" />
      <rect x={x + w - 8} y={y - h} width={8} height={h} fill="rgba(255,220,120,.12)" />
      <polygon points={`${x+w/2},${y-h-26} ${x-4},${y-h} ${x+w+4},${y-h}`} fill="#7a6858" />
      <polygon points={`${x+w/2},${y-h-26} ${x-4},${y-h} ${x+w/2+2},${y-h}`} fill="rgba(0,0,0,.22)" />
      <rect x={x-4} y={y-h-2} width={w+8} height={7} fill="#f0e8d0" />
      <polygon points={`${x+w/2},${y-h-22} ${x+2},${y-h} ${x+w-2},${y-h}`} fill="none" stroke="#f0e8d0" strokeWidth={1.8} />
      <rect x={x+4}  y={y-h+16} width={25} height={58} fill={col} />
      <rect x={x+4}  y={y-h+16} width={25} height={3}  fill="#f0e8d0" />
      <rect x={x+4}  y={y-h+71} width={25} height={3}  fill="#f0e8d0" />
      <rect x={x+4}  y={y-h+16} width={2}  height={58} fill="rgba(0,0,0,.12)" />
      <rect x={x+38} y={y-h+16} width={25} height={58} fill={col} />
      <rect x={x+38} y={y-h+16} width={25} height={3}  fill="#f0e8d0" />
      <rect x={x+38} y={y-h+71} width={25} height={3}  fill="#f0e8d0" />
      <rect x={x+7}  y={y-h+22} width={19} height={24} fill={win} />
      <rect x={x+41} y={y-h+22} width={19} height={24} fill={win} />
      <rect x={x+7}  y={y-h+82} width={19} height={22} fill={win} opacity={.85} />
      <rect x={x+41} y={y-h+82} width={19} height={22} fill={win} opacity={.85} />
      <rect x={x} y={y-h+80} width={w} height={4} fill="#e8dcc8" opacity={.9} />
      <rect x={x+23} y={y-h+116} width={20} height={32} rx={2} fill="rgba(90,140,170,.65)" />
      <rect x={x+18} y={y-4} width={30} height={4} rx={1} fill="#d8c8a0" />
    </g>
  );
}

function StreetTree({ x, y, h = 190, sp = 88 }: {
  x: number; y: number; h?: number; sp?: number;
}) {
  const tw = Math.round(h * 0.072);
  return (
    <g>
      <ellipse cx={x+sp*.3} cy={y+6} rx={sp*.58} ry={11} fill="rgba(20,50,0,.22)" />
      <rect x={x-tw/2} y={y-h*.52} width={tw} height={h*.52} fill="#5a3e28" rx={2} />
      <rect x={x+tw/2-3} y={y-h*.52} width={3} height={h*.52} fill="rgba(255,170,60,.14)" />
      <circle cx={x-sp*.14} cy={y-h*.72} r={sp*.5}  fill="#1e6820" />
      <circle cx={x+sp*.18} cy={y-h*.76} r={sp*.48} fill="#256825" />
      <circle cx={x}        cy={y-h*.64} r={sp*.54} fill="#2d7828" />
      <circle cx={x-sp*.28} cy={y-h*.62} r={sp*.38} fill="#348030" />
      <circle cx={x+sp*.32} cy={y-h*.67} r={sp*.42} fill="#2e7a2a" />
      <circle cx={x+sp*.1}  cy={y-h*.84} r={sp*.2}  fill="#3a9230" opacity={.55} />
      <ellipse cx={x}       cy={y-h*.57} rx={sp*.52} ry={sp*.18} fill="rgba(0,30,0,.22)" />
    </g>
  );
}

function LampPost({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <ellipse cx={x+16} cy={y+5} rx={13} ry={4} fill="rgba(20,40,80,.2)" />
      <rect x={x-3} y={y-118} width={6} height={118} fill="#5a5848" rx={2} />
      <rect x={x+1} y={y-118} width={2} height={118} fill="rgba(255,210,100,.18)" rx={1} />
      <rect x={x-1} y={y-124} width={32} height={3} rx={1} fill="#5a5848" />
      <circle cx={x+30} cy={y-121} r={9}  fill="#fff8d8" opacity={.92} />
      <circle cx={x+30} cy={y-121} r={16} fill="rgba(255,240,160,.32)" />
    </g>
  );
}

// ─── Layers ───────────────────────────────────────────────────────────────────

function SkyLayer({ worldOff }: { worldOff: number }) {
  const vx    = worldOff * SKY_F;
  const tiles = nearTiles(vx, SKY_TILE);
  return (
    <svg viewBox={`${vx} 0 1400 900`} width="100%" height="100%"
      preserveAspectRatio="xMidYMid slice"
      style={{ position: 'absolute', inset: 0 }}>
      <defs>
        <linearGradient id="skyday" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#18509a" />
          <stop offset="38%"  stopColor="#3878cc" />
          <stop offset="72%"  stopColor="#7ab8e8" />
          <stop offset="100%" stopColor="#c0daf4" />
        </linearGradient>
        <filter id="sunf"><feGaussianBlur stdDeviation="10" /></filter>
        <filter id="sunf2"><feGaussianBlur stdDeviation="22" /></filter>
      </defs>
      {tiles.map(t => (
        <g key={t} transform={`translate(${t * SKY_TILE},0)`}>
          <rect x={0} y={0} width={SKY_TILE} height={900} fill="url(#skyday)" />
          <rect x={0} y={640} width={SKY_TILE} height={100} fill="rgba(200,225,248,.16)" />
          <circle cx={1500} cy={108} r={52}  fill="#ffe760" />
          <circle cx={1500} cy={108} r={82}  fill="rgba(255,240,80,.24)"  filter="url(#sunf)" />
          <circle cx={1500} cy={108} r={125} fill="rgba(255,220,60,.1)"   filter="url(#sunf2)" />
          <path d="M0,665 Q300,618 600,638 Q900,655 1200,615 Q1600,580 2000,605 L2000,730 L0,730 Z"
            fill="rgba(185,208,230,.2)" />
          <Cloud x={80}   y={95}  s={1.1} anim="cloud2" del={0} />
          <Cloud x={360}  y={68}  s={1.4} anim="cloud1" del={3} />
          <Cloud x={660}  y={110} s={0.9} anim="cloud3" del={5} />
          <Cloud x={960}  y={72}  s={1.2} anim="cloud2" del={2} />
          <Cloud x={1250} y={100} s={1.0} anim="cloud1" del={7} />
          <Cloud x={1540} y={78}  s={1.3} anim="cloud3" del={4} />
          <Cloud x={1780} y={112} s={0.85} anim="cloud2" del={6} />
          <g transform="translate(500,255)" opacity={.55}
            style={{ animation: 'sw2 5s ease-in-out infinite' }}>
            <path d="M0,0 L9,-6 L18,0"   stroke="#2a4070" strokeWidth={2}   fill="none" />
            <path d="M24,4 L33,-2 L42,4" stroke="#2a4070" strokeWidth={1.8} fill="none" />
            <path d="M48,1 L57,-5 L66,1" stroke="#2a4070" strokeWidth={1.6} fill="none" />
          </g>
          <g transform="translate(1300,220)" opacity={.42}
            style={{ animation: 'sw1 6s ease-in-out infinite' }}>
            <path d="M0,0 L9,-5 L18,0"   stroke="#2a4070" strokeWidth={1.8} fill="none" />
            <path d="M22,3 L31,-2 L40,3" stroke="#2a4070" strokeWidth={1.5} fill="none" />
          </g>
        </g>
      ))}
    </svg>
  );
}

function MidLayer({ worldOff }: { worldOff: number }) {
  const vx          = worldOff * MID_F;
  const tiles       = nearTiles(vx, MID_TILE);
  const cinemaLive  = cinemaLiveTile(vx);
  const concertLive = concertLiveTile(vx);
  const focus       = venueInFocus(vx);
  const cinemaFoW   = 360 * CINEMA_SCALE;
  const cinemaFoH   = CINEMA_HEIGHT * CINEMA_SCALE;
  const cinemaFoY   = 670 - cinemaFoH;
  const cinemaHalf  = Math.ceil(cinemaFoW / 2) + 24;
  const concertFoW  = CONCERT_WIDTH * CONCERT_SCALE;
  const concertFoH  = CONCERT_HEIGHT * CONCERT_SCALE;
  const concertFoY  = 670 - concertFoH;
  const concertHalf = Math.ceil(concertFoW / 2) + 24;
  return (
    <svg viewBox={`${vx} 0 1400 900`} width="100%" height="100%"
      preserveAspectRatio="xMidYMid slice"
      style={{ position: 'absolute', inset: 0 }}>
      <defs>
        <linearGradient id="atmo" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="rgba(180,205,235,0)" />
          <stop offset="100%" stopColor="rgba(180,205,235,.18)" />
        </linearGradient>
      </defs>
      {tiles.map(t => (
        <g key={t} transform={`translate(${t * MID_TILE},0)`}>
          <path d="M0,565 Q300,510 650,535 Q1000,558 1350,500 Q1700,452 2000,472 Q2300,490 2600,465 L2600,900 L0,900 Z" fill="#bac8d5" />
          <path d="M0,598 Q300,548 650,572 Q1000,595 1350,544 Q1700,505 2000,525 Q2300,542 2600,518 L2600,900 L0,900 Z" fill="#9aaa98" />
          <path d="M380,660 Q600,600 820,630 Q960,648 1100,662 L1100,900 L380,900 Z" fill="#8a9e82" />
          <g opacity={.42}>
            <rect x={55}  y={390} width={14} height={225} fill="#b0bcc8" />
            <rect x={38}  y={412} width={46} height={7}   fill="#b0bcc8" />
            <rect x={38}  y={455} width={46} height={7}   fill="#b0bcc8" />
            <rect x={215} y={390} width={14} height={225} fill="#b0bcc8" />
            <rect x={198} y={412} width={46} height={7}   fill="#b0bcc8" />
            <rect x={198} y={455} width={46} height={7}   fill="#b0bcc8" />
            <path d="M10,390 Q62,460 62,615 Q62,460 228,390" stroke="#a8b4c0" strokeWidth={2.5} fill="none" />
            <rect x={10} y={613} width={320} height={7} fill="#b0bcc8" />
            <rect x={10} y={390} width={320} height={240} fill="rgba(185,208,235,.35)" />
          </g>
          <Victorian x={488} y={652} col="#6a7ec8" w={63} h={145} />
          <Victorian x={558} y={654} col="#c8a030" w={63} h={148} />
          <Victorian x={628} y={656} col="#7a9a58" w={63} h={152} />
          <Victorian x={698} y={658} col="#c87840" w={63} h={148} />
          <Victorian x={768} y={660} col="#a05888" w={63} h={145} />
          {([[250,658,'#a0a8b8',55,120],[310,656,'#a8b0c0',58,128],[838,660,'#b8b090',60,138],[902,662,'#a8a888',58,128]] as [number,number,string,number,number][]).map(([x,y,c,w,h],i)=>(
            <g key={i}>
              <rect x={x} y={y-h} width={w} height={h} fill={c} />
              <rect x={x} y={y-h} width={8}  height={h} fill="rgba(0,20,60,.18)" />
              <polygon points={`${x+w/2},${y-h-18} ${x-3},${y-h} ${x+w+3},${y-h}`} fill="#8a8880" />
              <rect x={x+6}  y={y-h+20} width={14} height={18} fill="rgba(140,180,210,.5)" />
              <rect x={x+30} y={y-h+20} width={14} height={18} fill="rgba(140,180,210,.5)" />
            </g>
          ))}
          <g>
            <polygon points="1318,660 1370,280 1422,660" fill="#c8ccd8" />
            <polygon points="1318,660 1370,280 1344,660" fill="rgba(0,20,60,.2)" />
            {Array.from({length:18},(_,i)=>(
              <line key={i} x1={1318+i*5.8} y1={660} x2={1318+i*5.8+(660-280)/18} y2={280+i*(660-280)/18} stroke="rgba(150,200,230,.22)" strokeWidth={1} />
            ))}
            <rect x={1368} y={248} width={4} height={32} fill="#a8acb8" />
          </g>
          {([
            {x:1150,y:660,w:72,h:185,c:'#c0c8d5'},
            {x:1230,y:660,w:58,h:210,c:'#c8d0dc'},
            {x:1460,y:660,w:85,h:168,c:'#b8c2cc'},
            {x:1558,y:660,w:62,h:195,c:'#c0cad5'},
            {x:1632,y:660,w:75,h:158,c:'#bac4d0'},
          ]).map((b,i)=>(
            <g key={i}>
              <rect x={b.x} y={b.y-b.h} width={b.w} height={b.h} fill={b.c} />
              <rect x={b.x}       y={b.y-b.h} width={11}     height={b.h} fill="rgba(0,20,60,.22)" />
              <rect x={b.x+b.w-9} y={b.y-b.h} width={9}      height={b.h} fill="rgba(255,230,140,.12)" />
              {Array.from({length:Math.floor((b.h-15)/22)},(_,r)=>
                Array.from({length:Math.floor((b.w-14)/16)},(_,c)=>(
                  <rect key={`${r}-${c}`} x={b.x+8+c*16} y={b.y-b.h+8+r*22} width={11} height={14} rx={1}
                    fill="rgba(140,200,240,.55)" opacity={(i+r+c)%5===0 ? .2 : .65} />
                ))
              ).flat()}
              <rect x={b.x-2} y={b.y-b.h-4} width={b.w+4} height={5} fill="rgba(0,20,60,.3)" />
            </g>
          ))}
          <g opacity={.72}>
            <path d="M1880,670 Q1960,610 2040,650 L2040,900 L1880,900 Z" fill="#8a9880" />
            <rect x={1920} y={548} width={80} height={122} fill="#d0c8b8" />
            <rect x={1920} y={548} width={12} height={122} fill="rgba(0,20,60,.2)" />
            <rect x={1934} y={388} width={52} height={162} fill="#d8d0c0" rx={26} />
            <rect x={1934} y={388} width={12} height={162} fill="rgba(0,20,60,.18)" rx={6} />
            <ellipse cx={1960} cy={388} rx={26} ry={8} fill="#c8c0b0" />
            <rect x={1952} y={358} width={16} height={32} fill="#c0b8a8" />
          </g>
          {(() => {
            const concertX = concertMidX(t);
            if (concertX == null || !isVenueInView(vx, t, concertX, concertHalf)) return null;
            const concertFoX = concertX - concertFoW / 2;
            return (
              <>
                <g>
                  <ellipse cx={concertX} cy={668} rx={145} ry={14} fill="rgba(10,40,24,.25)" />
                  <rect x={concertX - 145} y={656} width={290} height={14} fill="#7a8a82" rx={3} />
                  <rect x={concertX - 145} y={656} width={290} height={4} fill="rgba(56,216,128,.1)" rx={2} />
                </g>
                <foreignObject
                  x={concertFoX}
                  y={concertFoY}
                  width={concertFoW}
                  height={concertFoH}
                  style={{ overflow: 'visible' }}
                >
                  <div
                    {...({ xmlns: 'http://www.w3.org/1999/xhtml' } as React.HTMLAttributes<HTMLDivElement>)}
                    style={{
                      width: CONCERT_WIDTH,
                      transform: `scale(${CONCERT_SCALE})`,
                      transformOrigin: 'top left',
                      pointerEvents: t === concertLive && focus === 'concert' ? 'auto' : 'none',
                    }}
                  >
                    <Concert live={t === concertLive && focus === 'concert'} />
                  </div>
                </foreignObject>
              </>
            );
          })()}
          {(() => {
            const cinemaX = cinemaMidX(t);
            if (cinemaX == null || !isVenueInView(vx, t, cinemaX, cinemaHalf)) return null;
            const cinemaFoX = cinemaX - cinemaFoW / 2;
            return (
              <>
                <g>
                  <ellipse cx={cinemaX} cy={668} rx={105} ry={14} fill="rgba(20,40,80,.2)" />
                  <rect x={cinemaX - 105} y={656} width={210} height={14} fill="#8a9488" rx={3} />
                  <rect x={cinemaX - 105} y={656} width={210} height={4} fill="rgba(255,230,140,.08)" rx={2} />
                </g>
                <foreignObject
                  x={cinemaFoX}
                  y={cinemaFoY}
                  width={cinemaFoW}
                  height={cinemaFoH}
                  style={{ overflow: 'visible' }}
                >
                  <div
                    {...({ xmlns: 'http://www.w3.org/1999/xhtml' } as React.HTMLAttributes<HTMLDivElement>)}
                    style={{
                      width: 360,
                      transform: `scale(${CINEMA_SCALE})`,
                      transformOrigin: 'top left',
                      pointerEvents: t === cinemaLive ? 'auto' : 'none',
                    }}
                  >
                    <Cinema live={t === cinemaLive} />
                  </div>
                </foreignObject>
              </>
            );
          })()}
          {[420,840,1070,1740,1840,2200,2450].map((x,i)=>(
            <g key={i} transform={`translate(${x},660)`}
              style={{animation:`sw${1+i%3} ${5+i*.8}s ease-in-out infinite`,transformOrigin:`0 0`,animationDelay:`${i*.6}s`}}>
              <rect x={-5} y={-80} width={10} height={80} fill="#3a2a18" rx={2} />
              <circle cx={0}   cy={-80} r={36} fill="#1e5c1e" />
              <circle cx={-18} cy={-68} r={26} fill="#246024" />
              <circle cx={18}  cy={-72} r={28} fill="#206420" />
              <circle cx={0}   cy={-98} r={20} fill="#288028" opacity={.7} />
            </g>
          ))}
          <rect x={0} y={0} width={MID_TILE} height={900} fill="url(#atmo)" />
        </g>
      ))}
    </svg>
  );
}

/** Street signs — ground parallax so they stay fixed on the sidewalk (not mid-layer drift). */
function VenueSignsLayer({ worldOff }: { worldOff: number }) {
  const vxGnd = worldOff * GND_F;
  const tiles = nearTiles(vxGnd, GND_TILE);
  const GND   = 685;
  return (
    <svg
      viewBox={`${vxGnd} 0 ${VIEW_WIDTH} 900`}
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid slice"
      style={{ position: 'absolute', inset: 0, zIndex: 6, pointerEvents: 'none' }}
    >
      {tiles.map(t => (
        <g key={t} transform={`translate(${t * GND_TILE},0)`}>
          <VenueRoadSigns y={GND + 12} groundTile={GND_TILE} />
        </g>
      ))}
    </svg>
  );
}

function GroundLayer({ worldOff }: { worldOff: number }) {
  const vx    = worldOff * GND_F;
  const tiles = nearTiles(vx, GND_TILE);
  const GND   = 685;
  const TREES = GROUND_TREE_XS;
  const LAMPS = [380,700,1060,1400,1740,2080,2420,2760,3100];

  return (
    <svg viewBox={`${vx} 0 1400 900`} width="100%" height="100%"
      preserveAspectRatio="xMidYMid slice"
      style={{ position: 'absolute', inset: 0 }}>
      {tiles.map(t => (
        <g key={t} transform={`translate(${t * GND_TILE},0)`}>
          <rect x={0} y={GND+25} width={GND_TILE} height={215} fill="#b0a878" />
          <rect x={0} y={GND+25} width={GND_TILE} height={12}  fill="rgba(0,0,0,.08)" />
          {Array.from({length:Math.ceil(GND_TILE/80)},(_,i)=>(
            <rect key={i} x={i*80} y={GND+90} width={50} height={5} rx={2} fill="rgba(220,210,160,.45)" />
          ))}
          <rect x={0} y={GND-5} width={GND_TILE} height={30} fill="#c8b882" />
          <rect x={0} y={GND+22} width={GND_TILE} height={6} fill="#a89870" />
          {Array.from({length:Math.ceil(GND_TILE/62)},(_,i)=>(
            <line key={i} x1={i*62} y1={GND-5} x2={i*62} y2={GND+22} stroke="rgba(0,0,0,.07)" strokeWidth={2} />
          ))}
          <line x1={0} y1={GND+8} x2={GND_TILE} y2={GND+8} stroke="rgba(0,0,0,.05)" strokeWidth={1.5} />
          <line x1={0} y1={GND+55} x2={GND_TILE} y2={GND+55} stroke="#706850" strokeWidth={4} />
          <line x1={0} y1={GND+68} x2={GND_TILE} y2={GND+68} stroke="#706850" strokeWidth={4} />
          {Array.from({length:Math.ceil(GND_TILE/40)},(_,i)=>(
            <rect key={i} x={i*40} y={GND+52} width={6} height={19} fill="#605840" opacity={.6} />
          ))}
          {TREES.map((x,i)=>(<ellipse key={i} cx={x+28} cy={GND+8} rx={50} ry={11} fill="rgba(20,50,0,.2)" />))}
          {TREES.map((x,i)=>(
            <g key={i} style={{animation:`sw${1+i%3} ${5+i*.4}s ease-in-out infinite`,transformOrigin:`${x}px ${GND}px`,animationDelay:`${i*.45}s`}}>
              <StreetTree x={x} y={GND} h={195+i%4*12} sp={88+i%3*8} />
            </g>
          ))}
          <SleepingCatsGround tile={t} gndY={GND} />
          {LAMPS.map((x,i)=>(<LampPost key={i} x={x} y={GND} />))}
          {[560,1850,3050].map((x,i)=>(
            <g key={i} transform={`translate(${x},${GND})`}>
              <ellipse cx={8} cy={6} rx={10} ry={4} fill="rgba(20,40,80,.18)" />
              <rect x={2} y={-30} width={12} height={30} rx={3} fill="#c83028" />
              <rect x={0} y={-32} width={16} height={6}  rx={2} fill="#e03830" />
              <rect x={4} y={-38} width={8}  height={8}  rx={1} fill="#c02820" />
              <rect x={-2} y={-20} width={6} height={5} rx={1} fill="#b82820" />
              <rect x={12} y={-20} width={6} height={5} rx={1} fill="#b82820" />
            </g>
          ))}
          {[920,2180,3380].map((x,i)=>(
            <g key={i} transform={`translate(${x},${GND})`}>
              <ellipse cx={32} cy={6} rx={38} ry={7} fill="rgba(20,40,80,.16)" />
              <rect x={4}  y={-28} width={5} height={28} rx={2} fill="#6a5038" />
              <rect x={54} y={-28} width={5} height={28} rx={2} fill="#6a5038" />
              <rect x={0}  y={-30} width={63} height={6}  rx={2} fill="#8a6840" />
              <rect x={0}  y={-26} width={63} height={5}  rx={2} fill="#9a7848" />
              <rect x={2}  y={-50} width={59} height={5}  rx={2} fill="#8a6840" />
              <rect x={8}  y={-50} width={5}  height={22} rx={2} fill="#6a5038" />
              <rect x={50} y={-50} width={5}  height={22} rx={2} fill="#6a5038" />
            </g>
          ))}
          {[880,2200].map((x,i)=>(
            <g key={i} transform={`translate(${x},${GND})`}>
              <rect x={-2} y={-105} width={4} height={105} fill="#5a5848" />
              <rect x={-28} y={-108} width={56} height={14} rx={2} fill="#2040a0" />
              <rect x={-18} y={-104} width={36} height={2} fill="rgba(255,255,255,.8)" rx={1} />
              <rect x={-18} y={-100} width={28} height={2} fill="rgba(255,255,255,.6)" rx={1} />
            </g>
          ))}
        </g>
      ))}
    </svg>
  );
}

// ─── Mobile D-pad button ──────────────────────────────────────────────────────

function DPadBtn({
  label, onStart, onEnd,
}: { label: string; onStart: () => void; onEnd: () => void }) {
  return (
    <button
      onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); onStart(); }}
      onPointerUp={onEnd}
      onPointerCancel={onEnd}
      style={{
        width: 56, height: 56, borderRadius: 12,
        border: '1px solid rgba(255,255,255,.2)',
        background: 'rgba(0,0,0,.35)',
        backdropFilter: 'blur(6px)',
        color: 'rgba(255,255,255,.6)',
        fontSize: 22,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        userSelect: 'none', touchAction: 'none',
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );
}

// ─── NPC cast ─────────────────────────────────────────────────────────────────

// Characters are defined in characters.ts (names, personalities, AI chat).

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function SFCity() {
  const worldRef   = useRef(START_WORLD_OFF);
  const keysRef    = useRef({ left: false, right: false });
  const facingRef  = useRef<'left' | 'right'>('right');
  const walkingRef = useRef(false);
  const rafRef     = useRef<number | null>(null);
  const jumpingRef = useRef(false);

  // ── Greeting / collision ───────────────────────────────────────────────────
  // Each NPC reports its world-x each frame (same coordinate space as worldRef).
  const npcWorldXRefs     = useRef(
    CHARACTERS.map(c => screenPctToWorldX(c.startX, START_WORLD_OFF)),
  );
  const greetingRef       = useRef<number | null>(null);
  const nearNpcRef        = useRef<number | null>(null);
  const disconnectUntil   = useRef(0);

  const [worldOff,    setWorldOff]    = useState(() => START_WORLD_OFF);
  const [facing,      setFacing]      = useState<'left' | 'right'>('right');
  const [walking,     setWalking]     = useState(false);
  const [jumping,     setJumping]     = useState(false);
  const [playerDancing, setPlayerDancing] = useState(false);
  const [npcDancing,  setNpcDancing]  = useState<boolean[]>(() => CHARACTERS.map(() => false));
  const playerDancingRef = useRef(false);
  const npcDancingRef    = useRef<boolean[]>(CHARACTERS.map(() => false));
  const [greetingNpc, setGreetingNpc] = useState<number | null>(null);
  const [nearNpc,     setNearNpc]     = useState<number | null>(null);
  const [greetNpcX,   setGreetNpcX]   = useState(50);
  // ── Player chat ─────────────────────────────────────────────────────────────
  type ChatMode = null | 'name' | 'chat';
  const [playerName,    setPlayerName]    = useState<string | null>(null);
  const [chatMode,      setChatMode]      = useState<ChatMode>(null);
  const [nameDraft,     setNameDraft]     = useState('');
  const [chatDraft,     setChatDraft]     = useState('');
  const [playerMessage, setPlayerMessage] = useState<string | null>(null);
  const [npcMessage,    setNpcMessage]    = useState<string | null>(null);
  const [npcTyping,     setNpcTyping]     = useState(false);
  const [chatHistory,   setChatHistory]   = useState<ChatTurn[]>([]);
  const [chatSendTick,  setChatSendTick]  = useState(0);
  const [cinemaNowPlaying, setCinemaNowPlaying]   = useState<string | null>(null);
  const [concertNowPlaying, setConcertNowPlaying] = useState<string | null>(null);
  const chatInputRef = useRef<HTMLInputElement | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const playerNameRef = useRef<string | null>(null);
  const chatAbortRef = useRef<AbortController | null>(null);
  const sentMessageRef = useRef('');
  const chatHistoryRef = useRef<ChatTurn[]>([]);
  const cinemaNowRef  = useRef<string | null>(null);
  const concertNowRef = useRef<string | null>(null);
  const greetingSessionRef = useRef<number | null>(null);

  useEffect(() => { setPlayerName(getPlayerName()); }, []);
  useEffect(() => { loadCinemaVideos(); }, []);

  useEffect(() => { playerNameRef.current = playerName; }, [playerName]);
  useEffect(() => { chatHistoryRef.current = chatHistory; }, [chatHistory]);
  useEffect(() => {
    cinemaNowRef.current = cinemaNowPlaying;
  }, [cinemaNowPlaying]);
  useEffect(() => {
    concertNowRef.current = concertNowPlaying;
  }, [concertNowPlaying]);
  useEffect(() => {
    setCinemaNowPlaying(getCinemaNowPlaying());
    return subscribeCinemaNowPlaying(() => {
      setCinemaNowPlaying(getCinemaNowPlaying());
    });
  }, []);
  useEffect(() => {
    setConcertNowPlaying(getConcertNowPlaying());
    return subscribeConcertNowPlaying(() => {
      setConcertNowPlaying(getConcertNowPlaying());
    });
  }, []);

  // Clear conversation on disconnect
  useEffect(() => {
    if (greetingNpc !== null) return;
    chatAbortRef.current?.abort();
    setNpcMessage(null);
    setNpcTyping(false);
    setChatHistory([]);
    setChatSendTick(0);
    sentMessageRef.current = '';
    greetingSessionRef.current = null;
  }, [greetingNpc]);

  // AI greeting when connecting to an NPC
  useEffect(() => {
    if (greetingNpc === null) return;
    if (greetingSessionRef.current === greetingNpc) return;
    greetingSessionRef.current = greetingNpc;

    chatAbortRef.current?.abort();
    const controller = new AbortController();
    chatAbortRef.current = controller;

    const character = CHARACTERS[greetingNpc];
    setNpcTyping(true);
    setNpcMessage(null);
    setChatHistory([]);
    setPlayerMessage(null);
    setChatSendTick(0);
    sentMessageRef.current = '';
    setChatMode(playerName ? 'chat' : null);

    fetchNpcReplyWithTyping(
      {
        characterId: character.id,
        playerName: playerName ?? 'friend',
        isGreeting: true,
        cinemaNowPlaying: cinemaNowRef.current,
        concertNowPlaying: concertNowRef.current,
      },
      controller.signal,
      () => {
        setNpcTyping(true);
        setNpcMessage(null);
      },
      reply => {
        setNpcTyping(false);
        setNpcMessage(reply);
        setChatHistory([{ role: 'assistant', content: reply }]);
      },
    ).catch(err => {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setNpcTyping(false);
      setNpcMessage(`Hey! I'm ${character.name}.`);
    });

    if (playerName) {
      setTimeout(() => chatInputRef.current?.focus(), 120);
    }

    return () => controller.abort();
  }, [greetingNpc, playerName]);

  // AI reply when the player sends a message
  useEffect(() => {
    if (chatSendTick === 0 || greetingNpc === null) return;

    chatAbortRef.current?.abort();
    const controller = new AbortController();
    chatAbortRef.current = controller;

    const character = CHARACTERS[greetingNpc];
    const message = sentMessageRef.current;

    fetchNpcReplyWithTyping(
      {
        characterId: character.id,
        playerName: playerName ?? 'friend',
        message,
        history: chatHistoryRef.current,
        cinemaNowPlaying: cinemaNowRef.current,
        concertNowPlaying: concertNowRef.current,
      },
      controller.signal,
      () => {
        setNpcTyping(true);
        setNpcMessage(null);
      },
      reply => {
        setNpcTyping(false);
        setNpcMessage(reply);
        setChatHistory(prev => [
          ...prev,
          { role: 'user', content: message },
          { role: 'assistant', content: reply },
        ]);
        setTimeout(() => chatInputRef.current?.focus(), 0);
      },
    ).catch(err => {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setNpcTyping(false);
      setNpcMessage(pickFallbackReply(character));
      setTimeout(() => chatInputRef.current?.focus(), 0);
    });

    return () => controller.abort();
  }, [chatSendTick, greetingNpc, playerName]);

  const handleSendMessage = (text: string) => {
    sentMessageRef.current = text;
    setPlayerMessage(text);
    setChatDraft('');
    setChatSendTick(t => t + 1);
  };

  const handleSaveName = () => {
    const trimmed = nameDraft.trim();
    if (!isValidPlayerName(trimmed)) return;
    savePlayerName(trimmed);
    setPlayerName(trimmed);
    setNameDraft('');
    setChatMode('chat');
    setTimeout(() => chatInputRef.current?.focus(), 30);
  };

  // ── Audio ──────────────────────────────────────────────────────────────────
  const TRACKS = ['/audio/1.mp3', '/audio/2.mp3', '/audio/3.mp3'];
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [muted,  setMuted] = useState(false);

  useEffect(() => {
    const src = TRACKS[Math.floor(Math.random() * TRACKS.length)];
    const el  = new Audio(src);
    el.loop   = true;
    el.volume = 0.35;
    el.muted  = muted;
    audioRef.current = el;

    const tryPlay = () => el.play().catch(() => {});
    tryPlay();
    // Fallback: play on first interaction if autoplay is blocked
    window.addEventListener('keydown',     tryPlay, { once: true });
    window.addEventListener('pointerdown', tryPlay, { once: true });

    return () => {
      el.pause();
      window.removeEventListener('keydown',     tryPlay);
      window.removeEventListener('pointerdown', tryPlay);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = muted;
  }, [muted]);

  useEffect(() => {
    const syncBgAudio = () => {
      const el = audioRef.current;
      if (!el) return;
      if (getConcertInView()) {
        el.pause();
      } else if (!muted) {
        el.play().catch(() => {});
      }
    };
    syncBgAudio();
    return subscribeConcertInView(syncBgAudio);
  }, [muted]);

  useEffect(() => {
    const SPEED      = 3.5;
    const GREET_DIST = 5; // % of viewport — must be quite close to "touch"

    const triggerJump = () => {
      if (jumpingRef.current) return;
      jumpingRef.current = true;
      setJumping(true);
      setTimeout(() => { jumpingRef.current = false; setJumping(false); }, 560);
    };

    const connectToNpc = (i: number, screenPct: number) => {
      greetingRef.current = i;
      setGreetingNpc(i);
      setGreetNpcX(screenPct);
      setNearNpc(null);
      nearNpcRef.current = null;
      const towardNpc = screenPct < 50 ? 'left' : 'right';
      facingRef.current = towardNpc;
      setFacing(towardNpc);
      setWalking(false);
      walkingRef.current = false;
    };

    const disconnect = () => {
      greetingRef.current = null;
      setGreetingNpc(null);
      disconnectUntil.current = Date.now() + 2000;
      setChatMode(null);
      setNameDraft('');
      setChatDraft('');
      setPlayerMessage(null);
    };

    const openChatPanel = () => {
      if (!playerNameRef.current) {
        setChatMode('name');
        setTimeout(() => nameInputRef.current?.focus(), 30);
      } else {
        setChatMode('chat');
        setTimeout(() => chatInputRef.current?.focus(), 30);
      }
    };

    const onDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (greetingRef.current !== null) {
          disconnect();
          triggerJump();
        } else {
          setChatMode(null);
          setNameDraft('');
          setChatDraft('');
        }
        return;
      }

      // Let the chat input handle its own keys without interference
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;

      if (['ArrowLeft',  'a', 'A'].includes(e.key)) { keysRef.current.left  = true;  e.preventDefault(); }
      if (['ArrowRight', 'd', 'D'].includes(e.key)) { keysRef.current.right = true;  e.preventDefault(); }
      if (['ArrowUp', 'w', 'W', ' '].includes(e.key)) {
        e.preventDefault();
        if (greetingRef.current !== null) {
          disconnect();
          triggerJump();
        } else {
          triggerJump();
        }
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (greetingRef.current !== null) {
          openChatPanel();
        } else if (
          nearNpcRef.current !== null
          && Date.now() > disconnectUntil.current
        ) {
          const i = nearNpcRef.current;
          const width = window.innerWidth;
          const screenPct = worldXToScreenPct(
            npcWorldXRefs.current[i], worldRef.current, width,
          );
          connectToNpc(i, screenPct);
        }
      }
    };
    const onUp = (e: KeyboardEvent) => {
      if (['ArrowLeft',  'a', 'A'].includes(e.key)) keysRef.current.left  = false;
      if (['ArrowRight', 'd', 'D'].includes(e.key)) keysRef.current.right = false;
    };
    window.addEventListener('keydown', onDown, true);
    window.addEventListener('keyup',   onUp);

    const updateDanceState = (off: number) => {
      const width = window.innerWidth;
      const greeting = greetingRef.current;

      const playerNear = greeting === null && isNearConcert(off, off, width);
      if (playerNear !== playerDancingRef.current) {
        playerDancingRef.current = playerNear;
        setPlayerDancing(playerNear);
      } else if (greeting !== null && playerDancingRef.current) {
        playerDancingRef.current = false;
        setPlayerDancing(false);
      }

      const next = npcWorldXRefs.current.map((wx, i) =>
        greeting === i ? false : isNearConcert(wx, off, width),
      );
      if (next.some((v, i) => v !== npcDancingRef.current[i])) {
        npcDancingRef.current = next;
        setNpcDancing([...next]);
      }
    };

    const loop = () => {
      // While greeting, freeze the player completely
      if (greetingRef.current !== null) {
        if (walkingRef.current) { walkingRef.current = false; setWalking(false); }
        updateDanceState(worldRef.current);
        gameWorldOffRef.current = worldRef.current;
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      const { left, right } = keysRef.current;
      let isWalking = false;

      if (left && !right) {
        worldRef.current -= SPEED;
        if (facingRef.current !== 'left') { facingRef.current = 'left'; setFacing('left'); }
        isWalking = true;
      } else if (right && !left) {
        worldRef.current += SPEED;
        if (facingRef.current !== 'right') { facingRef.current = 'right'; setFacing('right'); }
        isWalking = true;
      }

      if (isWalking !== walkingRef.current) {
        walkingRef.current = isWalking;
        setWalking(isWalking);
      }
      if (isWalking) setWorldOff(worldRef.current);

      // Proximity check only — connection requires Enter.
      if (greetingRef.current === null) {
        const width = window.innerWidth;
        const greetDistPx = (GREET_DIST / 100) * width;
        let inRange: number | null = null;
        if (Date.now() > disconnectUntil.current) {
          for (let i = 0; i < npcWorldXRefs.current.length; i++) {
            const npcWorldX = npcWorldXRefs.current[i];
            const screenPct = worldXToScreenPct(npcWorldX, worldRef.current, width);
            const distPx    = Math.abs(npcWorldX - worldRef.current);
            if (screenPct >= 5 && screenPct <= 95 && distPx < greetDistPx) {
              inRange = i;
              break;
            }
          }
        }
        if (inRange !== nearNpcRef.current) {
          nearNpcRef.current = inRange;
          setNearNpc(inRange);
        }
      } else if (nearNpcRef.current !== null) {
        nearNpcRef.current = null;
        setNearNpc(null);
      }

      updateDanceState(worldRef.current);
      gameWorldOffRef.current = worldRef.current;
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('keydown', onDown, true);
      window.removeEventListener('keyup',   onUp);
    };
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative', animation: 'fdi 1.5s ease' }}>
      <style>{KF}</style>

      <SkyLayer         worldOff={worldOff} />
      <SkyCreaturesLayer />
      <MidLayer         worldOff={worldOff} />
      <GroundLayer      worldOff={worldOff} />
      <VenueSignsLayer  worldOff={worldOff} />

      <LovingCarLayer />

      {/* Autonomous NPCs */}
      {CHARACTERS.map((cfg, i) => (
        <NPC
          key={cfg.id}
          {...cfg}
          worldOff={worldOff}
          paused={greetingNpc === i}
          greeting={greetingNpc === i}
          greetFacing={greetNpcX < 50 ? 'right' : 'left'}
          dancing={npcDancing[i]}
          onMove={wx => { npcWorldXRefs.current[i] = wx; }}
          greetingChat={greetingNpc === i ? {
            name: cfg.name,
            npcTyping,
            npcMessage,
          } : undefined}
        />
      ))}

      {/* Player — world scrolls, character stays centred */}
      <div style={{
        position: 'absolute',
        left: '50%',
        bottom: CHAR_BOTTOM,
        zIndex: greetingNpc !== null ? 200 : 20,
      }}>
        <div style={{ animation: jumping ? 'ch-jump-outer 0.55s linear' : 'none' }}>
          <Character
            walking={walking}
            facing={facing}
            dancing={playerDancing}
            bubbleSide={playerBubbleSide(greetNpcX)}
            chatOverlay={greetingNpc !== null ? (
              <PlayerChatOverlay
                npcScreenX={greetNpcX}
                chatMode={chatMode}
                playerName={playerName}
                playerMessage={playerMessage}
                nameDraft={nameDraft}
                setNameDraft={setNameDraft}
                chatDraft={chatDraft}
                setChatDraft={setChatDraft}
                onSaveName={handleSaveName}
                onSendMessage={handleSendMessage}
                chatInputRef={chatInputRef}
                nameInputRef={nameInputRef}
              />
            ) : undefined}
          />
        </div>
      </div>

      {/* Proximity hint — touching but not yet connected */}
      {nearNpc !== null && greetingNpc === null && (
        <div style={{
          position: 'absolute', bottom: 22, left: '50%', transform: 'translateX(-50%)',
          zIndex: 40, pointerEvents: 'none',
          background: 'rgba(0,0,0,0.38)', backdropFilter: 'blur(8px)',
          borderRadius: 40, padding: '7px 18px',
          border: '1px solid rgba(255,255,255,0.12)',
          color: 'rgba(255,255,255,0.7)', fontSize: 11,
          letterSpacing: 2, textTransform: 'uppercase',
          fontFamily: "Georgia,'Times New Roman',serif",
        }}>
          ↵ connect with {CHARACTERS[nearNpc]?.name}
        </div>
      )}

      {/* Greeting status bar */}
      {greetingNpc !== null && chatMode !== 'chat' && chatMode !== 'name' && (
        <div style={{
          position: 'absolute', bottom: 22, left: '50%', transform: 'translateX(-50%)',
          zIndex: 40, pointerEvents: 'none',
          background: 'rgba(0,0,0,0.38)', backdropFilter: 'blur(8px)',
          borderRadius: 40, padding: '7px 18px',
          border: '1px solid rgba(255,255,255,0.12)',
          color: 'rgba(255,255,255,0.7)', fontSize: 11,
          letterSpacing: 2, textTransform: 'uppercase',
          fontFamily: "Georgia,'Times New Roman',serif",
          display: 'flex', gap: 16,
        }}>
          <span>↑ or esc · say goodbye to {CHARACTERS[greetingNpc]?.name}</span>
          <span style={{ color: 'rgba(255,255,255,0.4)' }}>|</span>
          <span>{playerName ? '↵ chat' : '↵ enter name'}</span>
        </div>
      )}

      {/* Vignette */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 30,
        background: 'radial-gradient(ellipse 92% 90% at 50% 46%, transparent 38%, rgba(0,0,0,.5) 100%)',
      }} />

      {/* City label */}
      <div style={{
        position: 'absolute', top: 22, left: 28, zIndex: 40, pointerEvents: 'none',
        fontFamily: "Georgia,'Times New Roman',serif",
        color: 'rgba(255,255,255,.55)', fontSize: 12, letterSpacing: 5, textTransform: 'uppercase',
      }}>
        San Francisco
      </div>

      {/* Keyboard hint + mute — hidden on mobile, bottom-right */}
      <div className="hidden md:flex" style={{
        position: 'absolute', bottom: 22, right: 22,
        gap: 10, alignItems: 'center', zIndex: 40,
      }}>
        {['←', '→', '↑'].map((k, i) => (
          <div key={i} style={{
            width: 30, height: 30, borderRadius: 7,
            border: '1px solid rgba(255,255,255,.2)',
            background: 'rgba(0,0,0,.3)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'rgba(255,255,255,.45)', fontSize: 14,
            pointerEvents: 'none',
          }}>{k}</div>
        ))}
        <div style={{ color: 'rgba(255,255,255,.2)', fontSize: 9, letterSpacing: 3, fontFamily: 'Georgia,serif', pointerEvents: 'none' }}>
          A · D · W · walk & jump
        </div>
        <button onClick={() => setMuted(m => !m)} title={muted ? 'Unmute' : 'Mute'} style={{
          width: 30, height: 30, borderRadius: 7,
          border: '1px solid rgba(255,255,255,.2)',
          background: 'rgba(0,0,0,.3)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: muted ? 'rgba(255,255,255,.25)' : 'rgba(255,255,255,.6)',
          fontSize: 14, cursor: 'pointer',
        }}>
          {muted ? '🔇' : '🔊'}
        </button>
      </div>

      {/* Mobile D-pad + mute — shown only on touch devices */}
      <div className="flex md:hidden" style={{
        position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)',
        gap: 12, zIndex: 40, alignItems: 'center',
      }}>
        <DPadBtn label="←"
          onStart={() => { keysRef.current.left = true; }}
          onEnd={()   => { keysRef.current.left = false; }} />
        <DPadBtn label="↑"
          onStart={() => {
            if (!jumpingRef.current) {
              jumpingRef.current = true;
              setJumping(true);
              setTimeout(() => { jumpingRef.current = false; setJumping(false); }, 560);
            }
          }}
          onEnd={() => {}} />
        <DPadBtn label="→"
          onStart={() => { keysRef.current.right = true; }}
          onEnd={()   => { keysRef.current.right = false; }} />
        <button onClick={() => setMuted(m => !m)} style={{
          width: 56, height: 56, borderRadius: 12,
          border: '1px solid rgba(255,255,255,.2)',
          background: 'rgba(0,0,0,.35)', backdropFilter: 'blur(6px)',
          color: muted ? 'rgba(255,255,255,.25)' : 'rgba(255,255,255,.6)',
          fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
        }}>
          {muted ? '🔇' : '🔊'}
        </button>
      </div>

    </div>
  );
}
