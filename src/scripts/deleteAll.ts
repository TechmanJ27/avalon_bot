import {database} from '../database.js'

database
    .prepare(`DELETE FROM nominations`)
    .run();