import { type FastifyPluginAsync } from 'fastify';
import { Readable } from 'node:stream';

async function* createNdJsonStream(chunks: AsyncGenerator<object>) {
  for await (const chunk of chunks) {
    // Format response chunks in Newline delimited JSON
    // see https://github.com/ndjson/ndjson-spec
    yield JSON.stringify(chunk) + '\n';
  }
}

const root: FastifyPluginAsync = async (fastify, options): Promise<void> => {
  fastify.get('/', async function (request, reply) {
    return { message: 'server up' };
  });

  fastify.post('/chat', async function (request, reply) {
    const { messages } = request.body as any;
    try {
      return await fastify.chat.run(messages);
    } catch (_error: unknown) {
      const error = _error as Error;
      fastify.log.error(error);
      return reply.internalServerError(error.message);
    }
  });

  fastify.post('/chat/stream', async function (request, reply) {
    const { messages } = request.body as any;
    try {
      const chunks = createNdJsonStream(await fastify.chat.runWithStreaming(messages));
      return reply.type('application/x-ndjson').send(Readable.from(chunks));
    } catch (_error: unknown) {
      const error = _error as Error;
      fastify.log.error(error);
      return reply.internalServerError(error.message);
    }
  });
};

export default root;
