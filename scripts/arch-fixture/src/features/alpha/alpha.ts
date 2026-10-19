import { GoogleGenAI } from '@google/genai';
import Dexie from 'dexie';
import { beta } from '../beta/beta.ts';
export const alpha = [GoogleGenAI, Dexie, beta];
