import { db, EndpointError } from 'sdk';
import { eq } from 'sdk/db';
import { players } from '../schema.js';

export default async function (input, ctx) {
  const user = ctx?.initData?.user;
  if (!user || !user.id) {
    throw new EndpointError('Unauthorized: Telegram user data required', { code: 'UNAUTHORIZED' });
  }

  let player = await db.select().from(players).where(eq(players.telegramId, user.id)).get();
  if (!player) {
    await db.insert(players).values({
      telegramId: user.id,
      username: user.username || user.first_name || 'Batyr',
      coins: 5000,
      bucks: 10,
      trophies: 0
    });
    player = await db.select().from(players).where(eq(players.telegramId, user.id)).get();
  }

  return player;
}
