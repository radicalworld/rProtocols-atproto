// src/lib/atp.ts
import { AtpAgent } from '@atproto/api';

export function makeAgent() {
  const service = import.meta.env.VITE_PDS_URL as string;
  if (!service) throw new Error('VITE_PDS_URL not set');
  return new AtpAgent({ service });
}