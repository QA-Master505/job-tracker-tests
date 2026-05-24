import * as fs from 'fs';
import * as path from 'path';

const TICKET_FILE = path.join(process.cwd(), '.jira-tickets.json');
type TicketMap = Record<string, string>;

function readTicketMap(): TicketMap {
  try {
    return JSON.parse(fs.readFileSync(TICKET_FILE, 'utf-8')) as TicketMap;
  } catch {
    return {};
  }
}

function writeTicketMap(map: TicketMap): void {
  try {
    fs.writeFileSync(TICKET_FILE, JSON.stringify(map, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[JiraTracker] Failed to write ticket file:', err);
  }
}

export function saveTicketKey(testTitle: string, ticketKey: string): void {
  const map = readTicketMap();
  map[testTitle] = ticketKey;
  writeTicketMap(map);
}

export function loadAllTicketKeys(): TicketMap {
  return readTicketMap();
}

export function deleteTicketKey(testTitle: string): void {
  const map = readTicketMap();
  delete map[testTitle];
  writeTicketMap(map);
}
