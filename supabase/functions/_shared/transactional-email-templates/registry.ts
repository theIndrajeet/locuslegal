/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as updatesBroadcast } from './updates-broadcast.tsx'
import { template as newVacancy } from './new-vacancy.tsx'
import { template as newBarChallenge } from './new-bar-challenge.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'updates-broadcast': updatesBroadcast,
  'new-vacancy': newVacancy,
  'new-bar-challenge': newBarChallenge,
}
