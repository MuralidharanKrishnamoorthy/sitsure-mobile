import { isThursdayOrFriday } from './dateUtils';

// Mirrors web SeatBookingView.js isFloor() — matches by floor name word OR floor.id
function isFloor(floor, id) {
  if (!floor) return false;
  const name = String(floor.name || '').toLowerCase();
  return name.split(/\s+/).includes(String(id)) || floor.id === id;
}

export function isFirstFloor(floor) {
  return isFloor(floor, 1);
}

export function isSecondFloor(floor) {
  return isFloor(floor, 2);
}

export function isThirdFloor(floor) {
  return isFloor(floor, 3);
}

export function computeRestrictions({ userGroups, anchorDay, date, activeFloor }) {
  const groups = (userGroups || []).map((g) => g.toUpperCase());
  const anchorGroups = anchorDay
    ? (Array.isArray(anchorDay.groups)
        ? anchorDay.groups
        : typeof anchorDay.groups === 'string'
        ? anchorDay.groups.split(/[,;]+/).map((g) => g.trim())
        : []
      ).map((g) => g.toUpperCase())
    : [];

  const allowedEmails = (anchorDay?.allowed_emails || []).map((e) =>
    String(e).trim().toLowerCase()
  );

  const isSdosOrSdl = groups.includes('SDOS') || groups.includes('SDL') || groups.includes('VENZO');
  const isThurFri = isThursdayOrFriday(date);

  const hasSDOS = anchorGroups.includes('SDOS');
  const hasSDL = anchorGroups.includes('SDL');
  const hasQA = anchorGroups.includes('QA');
  const isAllSurecomp = hasSDOS && hasSDL && hasQA;
  const isSDOSOnly = hasSDOS && !hasSDL && !hasQA;

  // Fix 3: match web exactly — SDL/QA anchor day = exactly 2 groups: SDL AND QA, no SDOS
  const isSDLQAAnchorDay =
    anchorGroups.length === 2 && hasSDL && hasQA && !hasSDOS;

  // Floor restriction: SDOS/SDL restricted to floor 2+ unless Thu/Fri or All Surecomp day
  const restrictToSecondFloor = isSdosOrSdl && !isThurFri && !isAllSurecomp;

  // Fix 1: first floor canBook guard — mirrors web line 343
  // SDOS/SDL on Thu/Fri override: no restriction applies at all
  const isFirstFloorActive = isFirstFloor(activeFloor);
  const isThuFriSdosSdlOverride = isThurFri && isSdosOrSdl;

  let blocked = false;
  let blockReason = '';

  if (isThuFriSdosSdlOverride) {
    // Thu/Fri override: SDOS/SDL can book any floor including floor 1
    return {
      restrictToSecondFloor: false,
      blocked: false,
      blockReason: '',
      isAllSurecomp,
      showFirstFloor: true,
      anchorGroups,
      allowedEmails,
    };
  }

  // First floor only bookable on All Surecomp days (Fix 1)
  if (!isAllSurecomp && isFirstFloorActive) {
    blocked = true;
    blockReason = 'First floor booking is only available on All Surecomp anchor days.';
  }

  // Fix 2: email whitelist only applies on All Surecomp days, mirrors web line 348
  if (!blocked && isAllSurecomp && allowedEmails.length > 0) {
    blocked = true;
    blockReason = 'You are not on the allowed list for today\'s anchor day.';
  }

  // SDOS-only anchor day: SDL/QA users blocked
  if (!blocked && isSDOSOnly && (groups.includes('SDL') || groups.includes('QA'))) {
    blocked = true;
    blockReason = 'This is an SDOS anchor day. SDL and QA users cannot book today.';
  }

  // Fix 3: SDL/QA anchor day: SDOS users blocked — exact match to web condition
  if (!blocked && isSDLQAAnchorDay && groups.includes('SDOS')) {
    blocked = true;
    blockReason = 'This anchor day is for SDL/QA teams. SDOS users cannot book today.';
  }

  return {
    restrictToSecondFloor,
    blocked,
    blockReason,
    isAllSurecomp,
    showFirstFloor: isAllSurecomp || isThurFri,
    anchorGroups,
    allowedEmails,
  };
}

export function canUserBook(userEmail, restrictions) {
  if (restrictions.blocked) {
    // If blocked due to whitelist, check if user is on the list
    if (restrictions.allowedEmails.length > 0) {
      return restrictions.allowedEmails.includes(userEmail?.toLowerCase());
    }
    return false;
  }
  return true;
}
