/**
 * Starts a throwaway PostgreSQL server (embedded-postgres) for tests and
 * local development, so no database install or Supabase project is needed.
 */
import os from 'os';
import fs from 'fs';
import path from 'path';
import net from 'net';
import EmbeddedPostgres from 'embedded-postgres';

const freePort = () => new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, () => {
        const { port } = srv.address();
        srv.close(() => resolve(port));
    });
    srv.on('error', reject);
});

export const startLocalPostgres = async ({ port, persistent = false, dataDir } = {}) => {
    const dir = dataDir || fs.mkdtempSync(path.join(os.tmpdir(), 'incident-tracker-pg-'));
    const pgPort = port || await freePort();
    const server = new EmbeddedPostgres({
        databaseDir: dir,
        user: 'postgres',
        password: 'postgres',
        port: pgPort,
        persistent,
        onLog: () => {},
        onError: () => {}
    });

    if (!fs.existsSync(path.join(dir, 'PG_VERSION'))) await server.initialise();
    await server.start();
    await server.createDatabase('incident_tracker').catch(() => {});

    return {
        url: `postgres://postgres:postgres@127.0.0.1:${pgPort}/incident_tracker`,
        stop: async () => {
            await server.stop();
            if (!persistent) fs.rmSync(dir, { recursive: true, force: true });
        }
    };
};
