/** Reviewed, flat Firestore export format. Never accepts Clerk bindings or source-video URLs. */
export function validateLegacyExport(value) {
  const require = (ok, message) => {
    if (!ok) throw new Error('Invalid legacy export: ' + message);
  };
  require(value?.version === 1 &&
    ['users', 'projects', 'billingEvents'].every((key) =>
      Array.isArray(value[key]),
    ), 'expected version 1 with users, projects and billingEvents arrays');
  const id = (value) => typeof value === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(value);
  const integer = (value, min = 0) =>
    Number.isSafeInteger(value) && value >= min && value <= 2147483647;
  const date = (value) => {
    require(typeof value === 'string' && Number.isFinite(Date.parse(value)), 'invalid timestamp');
    return new Date(value).toISOString();
  };
  const users = new Set(),
    emails = new Set(),
    projects = new Set(),
    events = new Set();
  for (const user of value.users) {
    require(id(user.uid) && !users.has(user.uid), 'invalid or duplicate account ID');
    users.add(user.uid);
    require(typeof user.email === 'string' &&
      user.email === user.email.trim().toLowerCase() &&
      user.email.length <= 254 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email) &&
      !emails.has(user.email), 'invalid or duplicate email');
    emails.add(user.email);
    require(typeof user.name === 'string' &&
      user.name.length <= 120 &&
      integer(user.credits) &&
      ['free', 'pro', 'team'].includes(user.plan) &&
      typeof user.isPro === 'boolean', 'invalid account values');
    date(user.createdAt);
    date(user.updatedAt);
  }
  for (const project of value.projects) {
    require(id(project.id) &&
      !projects.has(project.id) &&
      users.has(project.userId), 'duplicate project or missing owner');
    projects.add(project.id);
    require(typeof project.title === 'string' &&
      project.title.trim().length > 0 &&
      project.title.length <= 200 &&
      typeof project.transcriptText === 'string' &&
      project.transcriptText.length <= 150000, 'invalid project text');
    require(Array.isArray(project.words) &&
      project.words.length <= 12000 &&
      project.words.every(
        (word) =>
          typeof word?.word === 'string' &&
          word.word.trim().length > 0 &&
          word.word.length <= 500 &&
          Number.isFinite(word.start) &&
          Number.isFinite(word.end) &&
          word.start >= 0 &&
          word.end >= word.start &&
          word.end <= 86400,
      ), 'invalid caption timing');
    const style = project.styleSettings;
    require(style &&
      typeof style === 'object' &&
      !Array.isArray(style) &&
      JSON.stringify(style).length <= 16384 &&
      ['9:16', '1:1', '16:9'].includes(style.aspectRatio) &&
      ['top', 'center', 'bottom'].includes(style.position), 'invalid styles');
    for (const [key, min, max] of [
      ['fontSize', 1, 200],
      ['captionXPercent', 0, 100],
      ['captionYPercent', 0, 100],
      ['maxWordsPerScreen', 1, 30],
      ['wordsPerScreen', 1, 30],
      ['progressBarHeight', 1, 30],
    ])
      if (style[key] !== undefined)
        require(Number.isFinite(style[key]) &&
          style[key] >= min &&
          style[key] <= max, 'invalid numeric style');
    require(typeof project.hasDeductedCredit === 'boolean' &&
      integer(project.revision ?? 0), 'invalid project flags');
    date(project.createdAt);
    date(project.updatedAt);
  }
  for (const event of value.billingEvents) {
    require(typeof event.deliveryIdHash === 'string' &&
      /^[a-f0-9]{64}$/.test(event.deliveryIdHash) &&
      !events.has(event.deliveryIdHash) &&
      users.has(event.userId), 'invalid delivery hash or owner');
    events.add(event.deliveryIdHash);
    require(integer(event.credits, 1) &&
      (event.plan === null || ['pro', 'team'].includes(event.plan)), 'invalid billing values');
    date(event.appliedAt);
  }
  return value;
}
