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

/** Set to an NPC id to spawn only that character immediately (testing). */
const TEST_SPAWN_NPC_ID: string | null = null;
/** Equip gas mask on a cinema NPC at startup (testing). */
const TEST_NPC_MASK_ON_LOAD = false;
const TEST_NPC_MASK_ID = 'gen-cinema-vanessa';
const TEST_NPC_MASK_ITEM = 'mask-gasmask' as const;

type SFCityCrowdLayerProps = {
  cast: CharacterDef[];
  greetingNpc: number | null;
  greetNpcX: number;
  npcTyping: boolean;
  npcMessages: ChatLine[];
  npcChatLabel: (npcId: string, fallback: string) => string;
  isNpcChatConnected: (npcIndex: number, npcId: string) => boolean;
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
  ownerFestieVendorAttractWx?: number;
};

function SFCityCrowdLayer({
  cast,
  greetingNpc,
  greetNpcX,
  npcTyping,
  npcMessages,
  npcChatLabel,
  isNpcChatConnected,
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
  ownerFestieVendorAttractWx,
}: SFCityCrowdLayerProps) {
  const handleEaselStationed = useCallback(
    (npcId: string) => onEaselStationed(npcId),
    [onEaselStationed],
  );

  return (
    <>
      {cast.map((cfg, i) => {
        if (TEST_SPAWN_NPC_ID && cfg.id !== TEST_SPAWN_NPC_ID) return null;
        const testing = TEST_SPAWN_NPC_ID === cfg.id;
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
        const baseLoadout = TEST_NPC_MASK_ON_LOAD && cfg.id === TEST_NPC_MASK_ID
          ? { ...(cfg.loadout ?? {}), mask: TEST_NPC_MASK_ITEM }
          : cfg.loadout;
        const easelPaintingSlot = isPainting
          ? activeEaselSession?.slots.find(s => s.npc === cfg.id && s.status === 'painting')?.slot
          : undefined;
        const isDrawing = isPainting || chatPromptPainting || Boolean(comparePin);
        const ownerAvatarSuppressed = Boolean(
          ownerFestieNpcId && cfg.id === ownerFestieNpcId && !autopilotOn,
        );
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
            startX={testing ? 55 : cfg.startX}
            entryDelay={testing ? 0 : cfg.entryDelay}
            paused={chatConnected || ownerAvatarSuppressed}
            ownerAvatarSuppressed={ownerAvatarSuppressed}
            wanderAttractWorldX={
              ownerAvatarSuppressed || !autopilotOn || cfg.id !== ownerFestieNpcId
                ? undefined
                : ownerFestieVendorAttractWx
            }
            greeting={greetingNpc === i}
            connectGlow={ownerFestieNpcId === cfg.id && autopilotOn}
            chatConnected={chatConnected}
            dimmed={festieDimNpcIds.has(cfg.id)}
            greetFacing={greetNpcX < 50 ? 'right' : 'left'}
            greetingChat={greetingNpc === i ? {
              name: npcLabel,
              npcTyping,
              messages: npcMessages,
            } : undefined}
            publicMessages={npcPublicMessages.get(cfg.id)}
            spaceFloat={spaceFloat}
          />
        );
      })}
      {remoteIds.map(pid => (
        <RemotePlayer
          key={pid}
          id={pid}
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
