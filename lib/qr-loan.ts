const validId = (id: string) => id.length > 0 && id.length <= 150 && !/[\x00-\x1f\x7f]/.test(id);

export function parseLoanQr(value: string, allowLegacyShort = false): string | null {
  const raw = value.trim();
  if (allowLegacyShort && validId(raw) && !/[?#]/.test(raw) && !raw.startsWith('/') && !/^[a-z][a-z0-9+.-]*:/i.test(raw)) {
    return raw;
  }
  try {
    const relative = /^(?:\?|(?:\/)?borrow_request\.php\?|\/user\/borrow\?)/.test(raw);
    const input = raw.startsWith('?') ? '/borrow_request.php' + raw : raw;
    const url = allowLegacyShort && relative ? new URL(input, 'https://daam.invalid') : new URL(input);
    const legacy = /(?:^|\/)borrow_request\.php$/.test(url.pathname);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password ||
        (!legacy && url.pathname !== '/user/borrow')) return null;
    const keys = allowLegacyShort && legacy ? ['asset_id', 'da_id', 'id', 'q'] : ['asset_id', 'da_id'];
    const ids = keys.flatMap(key => url.searchParams.getAll(key));
    const id = ids[0]?.trim() ?? '';
    return ids.length === 1 && validId(id) ? id : null;
  } catch {
    return null;
  }
}
