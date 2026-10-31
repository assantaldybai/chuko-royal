import { table, integer, text } from 'sdk/db';

export const players = table('players', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  telegramId: integer('telegram_id').notNull(),
  username: text('username'),
  coins: integer('coins').default(5000),
  bucks: integer('bucks').default(10),
  trophies: integer('trophies').default(0),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP')
});
