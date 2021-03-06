import { List } from 'immutable';

import { EventType, ContactType, TaskType } from './pim-types';
import { store } from './store';
import { addError } from './store/actions';

import * as EteSync from 'etesync';

export function syncEntriesToItemMap(
  collection: EteSync.CollectionInfo, entries: List<EteSync.SyncEntry>, base: {[key: string]: ContactType} = {}) {
  const items = base;

  entries.forEach((syncEntry) => {
    // FIXME: this is a terrible hack to handle parsing errors
    let comp;
    try {
      comp = ContactType.parse(syncEntry.content);
    } catch (e) {
      e.message = `${e.message}\nWhile processing: ${syncEntry.content}`;
      store.dispatch(addError(undefined as any, e));
      return;
    }

    // FIXME:Hack
    (comp as any).journalUid = collection.uid;
    const uid = `${collection.uid}|${comp.uid}`;

    if ((syncEntry.action === EteSync.SyncEntryAction.Add) ||
      (syncEntry.action === EteSync.SyncEntryAction.Change)) {
      items[uid] = comp;
    } else if (syncEntry.action === EteSync.SyncEntryAction.Delete) {
      delete items[uid];
    }
  });

  return items;
}

function colorIntToHtml(color: number) {
  if (color === undefined) {
    return '#8BC34A';
  }

  // tslint:disable:no-bitwise
  const blue = color & 0xFF;
  const green = (color >> 8) & 0xFF;
  const red = (color >> 16) & 0xFF;
  const alpha = (color >> 24) & 0xFF;
  // tslint:enable

  function toHex(num: number) {
    const ret = num.toString(16);
    return (ret.length === 1) ? '0' + ret : ret;
  }

  return '#' + toHex(red) + toHex(green) + toHex(blue) +
    ((alpha > 0) ? toHex(alpha) : '');
}

function syncEntriesToCalendarItemMap<T extends EventType>(
  ItemType: any,
  collection: EteSync.CollectionInfo, entries: List<EteSync.SyncEntry>, base: {[key: string]: T} = {}) {
  const items = base;

  const color = colorIntToHtml(collection.color);

  entries.forEach((syncEntry) => {
    // FIXME: this is a terrible hack to handle parsing errors
    let comp;
    try {
      comp = ItemType.parse(syncEntry.content);
    } catch (e) {
      e.message = `${e.message}\nWhile processing: ${syncEntry.content}`;
      store.dispatch(addError(undefined as any, e));
      return;
    }

    if (comp === null) {
      return;
    }

    comp.color = color;

    // FIXME:Hack
    (comp as any).journalUid = collection.uid;
    const uid = `${collection.uid}|${comp.uid}`;

    if ((syncEntry.action === EteSync.SyncEntryAction.Add) ||
      (syncEntry.action === EteSync.SyncEntryAction.Change)) {
      items[uid] = comp;
    } else if (syncEntry.action === EteSync.SyncEntryAction.Delete) {
      delete items[uid];
    }
  });

  return items;
}

export function syncEntriesToEventItemMap(
  collection: EteSync.CollectionInfo, entries: List<EteSync.SyncEntry>, base: {[key: string]: EventType} = {}) {
  return syncEntriesToCalendarItemMap<EventType>(EventType, collection, entries, base);
}

export function syncEntriesToTaskItemMap(
  collection: EteSync.CollectionInfo, entries: List<EteSync.SyncEntry>, base: {[key: string]: TaskType} = {}) {
  return syncEntriesToCalendarItemMap<TaskType>(TaskType, collection, entries, base);
}
