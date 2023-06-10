import { Knex, knex as setupKnex } from 'knex'

const knexConfig: Knex.Config = {
  client: 'sqlite',
  connection: {
    filename: './tmp/app.db',
  },
}

export const knex = setupKnex(knexConfig)
