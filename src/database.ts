import sqlite from 'node:sqlite';
import { Database } from 'node:sqlite';
const database = new Database('../database');

export function newWar() {
  database.exec(`
    CREATE TABLE data(
      key INTEGER PRIMARY KEY,
      value TEXT
    ) STRICT
  `);
}

export function getWar() {
  
}

export function newTeam() {
  database.exec(`
    CREATE TABLE data(
      key INTEGER PRIMARY KEY,
      value TEXT
    ) STRICT
  `);
}

