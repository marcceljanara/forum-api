const Hapi = require('@hapi/hapi');
const Jwt = require('@hapi/jwt'); // Tambahkan ini untuk mendukung JWT
const ClientError = require('../../Commons/exceptions/ClientError');
const DomainErrorTranslator = require('../../Commons/exceptions/DomainErrorTranslator');
const users = require('../../Interfaces/http/api/users');
const authentications = require('../../Interfaces/http/api/authentications');
const threads = require('../../Interfaces/http/api/threads');
require('dotenv').config();

const createServer = async (container) => {
  const server = Hapi.server({
    host: process.env.HOST,
    port: process.env.PORT,
  });

  // Registrasi plugin JWT
  await server.register(Jwt);

  // Definisi strategy autentikasi threads
  server.auth.strategy('threads_jwt', 'jwt', {
    keys: process.env.ACCESS_TOKEN_KEY, // Kunci untuk verifikasi token
    verify: {
      aud: false,
      iss: false,
      sub: false,
      maxAgeSec: process.env.ACCESS_TOKEN_AGE, // Maksimal umur token
    },
    validate: (artifacts) => ({
      isValid: true,
      credentials: {
        id: artifacts.decoded.payload.id, // ID pengguna dari payload JWT
      },
    }),
  });

  // Registrasi plugin
  await server.register([
    {
      plugin: users,
      options: { container },
    },
    {
      plugin: authentications,
      options: { container },
    },
    {
      plugin: threads,
      options: { container },
    },
  ]);

  server.route({
    method: 'GET',
    path: '/',
    handler: () => ({
      value: 'Hello world!!',
    }),
  });

  server.ext('onPreResponse', (request, h) => {
    // Mendapatkan konteks response dari request
    const { response } = request;

    if (response instanceof Error) {
      // Bila response error, tangani sesuai kebutuhan
      const translatedError = DomainErrorTranslator.translate(response);

      // Penanganan client error secara internal
      if (translatedError instanceof ClientError) {
        const newResponse = h.response({
          status: 'fail',
          message: translatedError.message,
        });
        newResponse.code(translatedError.statusCode);
        return newResponse;
      }

      // Mempertahankan penanganan client error oleh Hapi secara native, seperti 404, dll.
      if (!translatedError.isServer) {
        return h.continue;
      }

      // Penanganan server error sesuai kebutuhan
      const newResponse = h.response({
        status: 'error',
        message: 'terjadi kegagalan pada server kami',
      });
      newResponse.code(500);
      return newResponse;
    }

    // Jika bukan error, lanjutkan dengan response sebelumnya (tanpa terintervensi)
    return h.continue;
  });

  return server;
};

module.exports = createServer;
