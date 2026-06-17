'use client';

import { useCallback, useState } from 'react';
import { stripNpcChatterDots } from '@/lib/messageFilter';
import { mergeStageChatter, type StageChatterMessage } from '@/lib/stageChatter/types';

export type StageChatterState = {
  messages: StageChatterMessage[];
  typingSenders: string[];
  loadHistory: (messages: StageChatterMessage[]) => void;
  appendMessage: (sender: string, text: string, ts?: number) => void;
  setTyping: (sender: string, typing: boolean) => void;
};

export function useStageChatter(): StageChatterState {
  const [messages, setMessages] = useState<StageChatterMessage[]>([]);
  const [typingSenders, setTypingSenders] = useState<string[]>([]);

  const loadHistory = useCallback((history: StageChatterMessage[]) => {
    if (history.length === 0) return;
    setMessages(prev => mergeStageChatter(prev, history));
  }, []);

  const appendMessage = useCallback((sender: string, text: string, ts = Date.now()) => {
    const cleaned = sender.startsWith('npc:') ? stripNpcChatterDots(text) : text;
    setMessages(prev => mergeStageChatter(prev, [{ sender, text: cleaned, ts }]));
    setTypingSenders(prev => prev.filter(item => item !== sender));
  }, []);

  const setTyping = useCallback((sender: string, typing: boolean) => {
    setTypingSenders(prev => {
      if (typing) {
        if (prev.includes(sender)) return prev;
        return [...prev, sender];
      }
      return prev.filter(item => item !== sender);
    });
  }, []);

  return { messages, typingSenders, loadHistory, appendMessage, setTyping };
}
