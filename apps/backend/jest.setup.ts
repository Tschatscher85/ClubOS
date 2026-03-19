// Umgebungsvariablen aus .env laden (fuer Datenbank-Verbindung etc.)
// Zuerst Root-.env laden, dann Backend-.env (ueberschreibt Root-Werte)
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '.env') });
