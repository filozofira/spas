/**
 * Script to create test fixture ZIP files with proper schema files
 * Run with: node test/scripts/create-fixtures.js
 */

const archiver = require('archiver');
const fs = require('fs');
const path = require('path');

const fixturesDir = path.join(__dirname, '../fixtures');

// Ensure fixtures directory exists
if (!fs.existsSync(fixturesDir)) {
  fs.mkdirSync(fixturesDir, { recursive: true });
}

/**
 * Create a ZIP archive with the given files
 */
function createArchive(filename, files) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(path.join(fixturesDir, filename));
    const archive = archiver('zip', { zlib: { level: 1 } });

    output.on('close', () => {
      console.log(`✓ Created ${filename} (${archive.pointer()} bytes)`);
      resolve();
    });

    archive.on('error', (err) => reject(err));
    archive.pipe(output);

    // Add all files to the archive
    for (const [filePath, content] of Object.entries(files)) {
      const contentStr = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
      archive.append(contentStr, { name: filePath });
    }

    archive.finalize();
  });
}

// Example event schema
const orderCreatedSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id: 'https://example.com/schemas/events/order-created.schema.json',
  title: 'OrderCreated',
  type: 'object',
  required: ['orderId', 'customerId', 'amount'],
  properties: {
    orderId: { type: 'string', format: 'uuid' },
    customerId: { type: 'string', format: 'uuid' },
    amount: { type: 'number', minimum: 0 },
    currency: { type: 'string', pattern: '^[A-Z]{3}$' }
  }
};

// Example endpoint schema
const createOrderSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id: 'https://example.com/schemas/endpoints/create-order.schema.json',
  title: 'CreateOrderRequest',
  type: 'object',
  required: ['customerId', 'items'],
  properties: {
    customerId: { type: 'string', format: 'uuid' },
    items: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        required: ['productId', 'quantity'],
        properties: {
          productId: { type: 'string' },
          quantity: { type: 'integer', minimum: 1 }
        }
      }
    }
  }
};

// 1. Valid service with schemas
const validServiceMetadata = {
  schemaVersion: 'design-time-metadata-v1',
  id: 'test-service',
  name: 'Test Service',
  description: 'Test service with schemas',
  version: '1.0.0',
  boundedContext: 'testing',
  capabilities: ['test', 'order-processing'],
  endpoints: [
    {
      name: 'CreateOrder',
      type: 'Command',
      protocol: 'Http',
      methodPath: 'POST /api/orders',
      version: '1.0',
      schemaRef: 'schemas/endpoints/create-order.schema.json'
    }
  ],
  events: [
    {
      type: 'OrderCreated',
      version: '1.0',
      schemaRef: 'schemas/events/order-created.schema.json'
    }
  ],
  consistency: { commands: 'ACID', queries: 'STRONG' },
  network: { requiredEgress: [] },
  security: { dataClassification: ['internal'] },
  license: 'MIT'
};

// 2. Checksum service with schemas
const checksumServiceMetadata = {
  ...validServiceMetadata,
  id: 'checksum-service',
  name: 'Checksum Service',
  description: 'Service for checksum verification testing'
};

// 3. Duplicate service
const dupServiceMetadata = {
  ...validServiceMetadata,
  id: 'dup-service',
  name: 'Duplicate Service'
};

// 4. Service with correct ID for path validation
const correctIdServiceMetadata = {
  ...validServiceMetadata,
  id: 'correct-id',
  name: 'Correct ID Service'
};

// 5. Invalid metadata (missing required field)
const invalidMetadata = {
  schemaVersion: 'design-time-metadata-v1',
  id: 'invalid-service',
  // Missing required 'name', 'version', 'boundedContext'
  description: 'Invalid service'
};

async function main() {
  console.log('Creating test fixture archives...\n');

  // 1. valid-service.zip - Complete service with schemas
  await createArchive('valid-service.zip', {
    'spas.json': validServiceMetadata,
    'schemas/endpoints/create-order.schema.json': createOrderSchema,
    'schemas/events/order-created.schema.json': orderCreatedSchema
  });

  // 2. checksum-service.zip - For checksum verification tests
  await createArchive('checksum-service.zip', {
    'spas.json': checksumServiceMetadata,
    'schemas/endpoints/create-order.schema.json': createOrderSchema,
    'schemas/events/order-created.schema.json': orderCreatedSchema
  });

  // 3. dup-service.zip - For duplicate detection tests
  await createArchive('dup-service.zip', {
    'spas.json': dupServiceMetadata,
    'schemas/endpoints/create-order.schema.json': createOrderSchema,
    'schemas/events/order-created.schema.json': orderCreatedSchema
  });

  // 4. correct-id.zip - For path authority validation
  await createArchive('correct-id.zip', {
    'spas.json': correctIdServiceMetadata,
    'schemas/endpoints/create-order.schema.json': createOrderSchema,
    'schemas/events/order-created.schema.json': orderCreatedSchema
  });

  // 5. invalid-metadata.zip - Missing required fields
  await createArchive('invalid-metadata.zip', {
    'spas.json': invalidMetadata
  });

  // 6. no-metadata.zip - Missing spas.json entirely
  await createArchive('no-metadata.zip', {
    'dummy.txt': 'This archive has no spas.json file'
  });

  console.log('\n✅ All test fixtures created successfully!');
}

main().catch(console.error);
