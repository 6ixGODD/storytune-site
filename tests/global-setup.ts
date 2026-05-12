/**
 * Vitest global setup — runs once in the main process before any workers are spawned.
 * Starts a MongoDB testcontainer and writes its URI into process.env so that
 * worker processes inherit it (forks pool inherits parent env).
 */
import { MongoDBContainer } from '@testcontainers/mongodb';

// Stored so the teardown closure can stop it.
let container: Awaited<ReturnType<InstanceType<typeof MongoDBContainer>['start']>>;

export async function setup() {
    container = await new MongoDBContainer('mongo:7').start();
    // directConnection=true bypasses SDAM, which would otherwise try to resolve
    // the container's internal hostname (e.g. ac4776b78633) from the host.
    process.env['STORYTUNE__MONGODB_URI'] = container.getConnectionString();
    process.env['STORYTUNE__MONGODB_DB_NAME'] = 'storytune_test';
    process.env['STORYTUNE__MONGODB_DIRECT_CONNECTION'] = 'true';
}

export async function teardown() {
    await container?.stop();
}
