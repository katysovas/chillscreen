import { installSafariEventRejectionFilter } from '@/lib/suppressSafariEventRejections';
import { schedulePosthogInit } from '@/lib/posthogClient';

installSafariEventRejectionFilter();
schedulePosthogInit();
