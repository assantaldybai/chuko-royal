import { db, EndpointError } from 'sdk';
import { eq } from 'sdk/db';
import { players } from '../schema.js';

export default async function (input, ctx) {
  const user = ctx?.initData?.user;
  if (!user || !user.id) {
    throw new EndpointError('Unauthorized: Telegram user data required', { code: 'UNAUTHORIZED' });
  }

  const coinsEarned = Number(input?.coinsEarned || 0);
  const trophiesEarned = Number(input?.trophiesEarned || 0);

  let player = await db.select().from(players).where(eq(players.telegramId, user.id)).get();
  if (!player) {
    await db.insert(players).values({
      telegramId: user.id,
      username: user.username || user.first_name || 'Batyr',
      coins: Math.max(0, 5000 + coinsEarned),
      bucks: 10,
      trophies: Math.max(0, trophiesEarned)
    });
    player = await db.select().from(players).where(eq(players.telegramId, user.id)).get();
  } else {
    await db.update(players).set({
      coins: Math.max(0, (player.coins || 0) + coinsEarned),
      trophies: Math.max(0, (player.trophies || 0) + trophiesEarned)
    }).where(eq(players.telegramId, user.id));
    player = await db.select().from(players).where(eq(players.telegramId, user.id)).get();
  }

  return { ok: true, player };
}
