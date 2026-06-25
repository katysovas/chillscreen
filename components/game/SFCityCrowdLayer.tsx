'use client';

import { memo, useCallback } from 'react';
import NPC from './NPC';
import RemotePlayer from './RemotePlayer';
import type { CharacterDef } from './characters';
import { easelHandLoadout } from '@/lib/easel/brushLoadout';
import { easelPaintingLabelForNpc } from '@/lib/easel/paintingLabel';
import { activePainterNpcIds } from '@/lib/easel/session';
import { activeChatDrawingForNpc } from '@/lib/easel/chatNpcDrawings';
import type { ChatNpcDrawingSession } from '@/lib/easel/types';
import type { CompareDrawPin } from '@/lib/easel/runDrawModelCompare';
import type { VenueRoute } from '@/lib/venueSlugs';
import type { EaselSessionSync } from '@/lib/easel/types';
import type { ChatLine } from '@/lib/chatLines';
import type { RemoteAmbientMessage, RemotePlayerState } from '@/lib/multiplayer/useMultiplayer';
import { getNpcConvoHold } from '@/lib/npcConvoHold';
import { rpsPairBubbleSide, rpsPairChatSpreadPx } from '@/lib/autopilot/rps';

type SFCityCrowdLayerProps = {
  cast: CharacterDef[];
  greetingNpc: number | null;
  greetNpcX: number;
  npcTyping: boolean;
  npcMessages: ChatLine[];
  npcChatLabel: (npcId: string, fallback: string) => string;
  isNpcChatConnected: (npcIndex: number, npcId: string) => boolean;
  isNpcInPairConvo: (npcId: string) => boolean;
  activeEaselSession: EaselSessionSync | null;
  easelStageSlug: string | undefined;
  easelLayoutRoute?: VenueRoute;
  chatNpcDrawings: ChatNpcDrawingSession[];
  compareDrawPins: CompareDrawPin[];
  festieDimNpcIds: Set<string>;
  spaceFloat: boolean;
  onEaselStationed: (npcId: string) => void;
  remoteIds: string[];
  remoteStateRef: React.RefObject<Map<string, RemotePlayerState>>;
  ambientRef: React.RefObject<Map<string, RemoteAmbientMessage>>;
  peerChatId: string | null;
  peerTyping: boolean;
  peerMessages: ChatLine[];
  isPlayerChatConnected: (playerId: string) => boolean;
  playerMessages: Map<string, ChatLine[]>;
  npcPublicMessages: Map<string, ChatLine[]>;
  ownerFestieNpcId?: string | null;
  autopilotOn?: boolean;
  ownerFestieAttractWx?: number;
  ownerFestiePaused?: boolean;
  ownerFestieJumpBurstKey?: number;
  rpsPairIds?: readonly [string, string] | null;
};

function SFCityCrowdLayer({
  cast,
  greetingNpc,
  greetNpcX,
  npcTyping,
  npcMessages,
  npcChatLabel,
  isNpcChatConnected,
  isNpcInPairConvo,
  activeEaselSession,
  easelStageSlug,
  easelLayoutRoute,
  chatNpcDrawings,
  compareDrawPins,
  festieDimNpcIds,
  spaceFloat,
  onEaselStationed,
  remoteIds,
  remoteStateRef,
  ambientRef,
  peerChatId,
  peerTyping,
  peerMessages,
  isPlayerChatConnected,
  playerMessages,
  npcPublicMessages,
  ownerFestieNpcId = null,
  autopilotOn = false,
  ownerFestieAttractWx,
  ownerFestiePaused = false,
  ownerFestieJumpBurstKey = 0,
  rpsPairIds = null,
}: SFCityCrowdLayerProps) {
  const handleEaselStationed = useCallback(
    (npcId: string) => onEaselStationed(npcId),
    [onEaselStationed],
  );

  return (
    <>
      {cast.map((cfg, i) => {
        const chatConnected = isNpcChatConnected(i, cfg.id);
        const npcLabel = npcChatLabel(cfg.id, cfg.name);
        const isPainting = activePainterNpcIds(activeEaselSession).has(cfg.id);
        const chatPromptDrawing = activeChatDrawingForNpc(chatNpcDrawings, cfg.id);
        const chatPromptPainting = chatPromptDrawing?.status === 'painting';
        const comparePin = compareDrawPins.find(p => p.npcId === cfg.id);
        const chatPromptDrawingLabel = chatPromptPainting
          ? chatPromptDrawing?.topic ?? null
          : comparePin?.topic ?? null;
        const chatPromptCanvasWorldX = chatPromptPainting
          ? chatPromptDrawing?.canvasWorldX ?? null
          : comparePin?.canvasWorldX ?? null;
        const easelPaintingLabel = isPainting
          ? easelPaintingLabelForNpc(cfg.id, activeEaselSession)
          : null;
        const baseLoadout = cfg.loadout;
        const easelPaintingSlot = isPainting
          ? activeEaselSession?.slots.find(s => s.npc === cfg.id && s.status === 'painting')?.slot
          : undefined;
        const isDrawing = isPainting || chatPromptPainting || Boolean(comparePin);
        const ownerAvatarSuppressed = Boolean(
          ownerFestieNpcId && cfg.id === ownerFestieNpcId && !autopilotOn,
        );
        const inRpsPair = rpsPairIds?.includes(cfg.id) ?? false;
        let pairChatBubbleSide: 'left' | 'right' | undefined;
        let pairChatSpreadPx = 0;
        if (inRpsPair && rpsPairIds) {
          const [idA, idB] = rpsPairIds;
          const holdA = getNpcConvoHold(idA);
          const holdB = getNpcConvoHold(idB);
          const myHold = getNpcConvoHold(cfg.id);
          const partnerHold = cfg.id === idA ? holdB : holdA;
          if (myHold != null && partnerHold != null) {
            pairChatBubbleSide = rpsPairBubbleSide(myHold, partnerHold);
            pairChatSpreadPx = rpsPairChatSpreadPx(myHold, partnerHold);
          }
        }
        return (
          <NPC
            key={cfg.id}
            characterId={cfg.id}
            index={i}
            {...cfg}
            loadout={easelHandLoadout(baseLoadout, isDrawing)}
            stageAnchor={cfg.stageAnchor}
            easelPaintingSlot={easelPaintingSlot}
            easelStageSlug={isPainting ? easelStageSlug : undefined}
            easelLayoutRoute={isPainting ? easelLayoutRoute : undefined}
            onEaselStationed={isPainting ? handleEaselStationed : undefined}
            easelPaintingLabel={easelPaintingLabel}
            chatPromptDrawingLabel={chatPromptDrawingLabel}
            chatPromptCanvasWorldX={chatPromptCanvasWorldX}
            startX={cfg.startX}
            entryDelay={cfg.entryDelay}
            paused={chatConnected || ownerAvatarSuppressed || inRpsPair || (ownerFestieNpcId === cfg.id && autopilotOn && ownerFestiePaused)}
            ownerAvatarSuppressed={ownerAvatarSuppressed}
            wanderAttractWorldX={
              ownerAvatarSuppressed || !autopilotOn || cfg.id !== ownerFestieNpcId || inRpsPair
                ? undefined
                : ownerFestieAttractWx
            }
            jumpBurstKey={ownerFestieNpcId === cfg.id && autopilotOn ? ownerFestieJumpBurstKey : 0}
            pairChatBubbleSide={pairChatBubbleSide}
            pairChatSpreadPx={pairChatSpreadPx}
            greeting={greetingNpc === i}
            connectGlow={inRpsPair || (ownerFestieNpcId === cfg.id && autopilotOn && !rpsPairIds)}
            chatConnected={chatConnected}
            pairChatIndicator={isNpcInPairConvo(cfg.id)}
            dimmed={festieDimNpcIds.has(cfg.id)}
            greetFacing={greetNpcX < 50 ? 'right' : 'left'}
            greetingChat={greetingNpc === i ? {
              name: npcLabel,
              npcTyping,
              messages: npcMessages,
            } : undefined}
            publicMessages={npcPublicMessages.get(cfg.id)}
            spaceFloat={spaceFloat}
            crowdSize={cast.length}
          />
        );
      })}
      {remoteIds.map((pid, remoteIndex) => (
        <RemotePlayer
          key={pid}
          id={pid}
          crowdIndex={cast.length + remoteIndex}
          crowdTotal={cast.length + remoteIds.length}
          stateRef={remoteStateRef}
          ambientRef={ambientRef}
          greeting={peerChatId === pid}
          chatConnected={isPlayerChatConnected(pid)}
          greetingChat={peerChatId === pid ? {
            name: remoteStateRef.current?.get(pid)?.name ?? 'Wanderer',
            npcTyping: peerTyping,
            messages: peerMessages,
          } : undefined}
          publicMessages={playerMessages.get(pid)}
          spaceFloat={spaceFloat}
        />
      ))}
    </>
  );
}

export default memo(SFCityCrowdLayer);
