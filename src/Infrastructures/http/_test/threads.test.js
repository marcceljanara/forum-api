const pool = require('../../database/postgres/pool');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const CommentsTableTestHelper = require('../../../../tests/CommentsTableTestHelper');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const AuthenticationsTableTestHelper = require('../../../../tests/AuthenticationsTableTestHelper');
const container = require('../../container');
const createServer = require('../createServer');

describe('/threads endpoint', () => {
  afterAll(async () => {
    await pool.end();
  });

  afterEach(async () => {
    await ThreadsTableTestHelper.cleanTable();
    await CommentsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
    await AuthenticationsTableTestHelper.cleanTable();
  });

  const registerAndLoginUser = async (server) => {
    const registerPayload = {
      username: 'johndoe',
      password: 'password',
      fullname: 'John Doe',
    };
    await server.inject({
      method: 'POST',
      url: '/users',
      payload: registerPayload,
    });

    const loginPayload = {
      username: 'johndoe',
      password: 'password',
    };

    const loginResponse = await server.inject({
      method: 'POST',
      url: '/authentications',
      payload: loginPayload,
    });

    const responseJson = JSON.parse(loginResponse.payload);
    const { accessToken } = responseJson.data;
    return accessToken;
  };

  describe('when POST /threads', () => {
    it('should respond with 201 and create a new thread', async () => {
      const server = await createServer(container);
      const accessToken = await registerAndLoginUser(server);

      const threadPayload = {
        title: 'Thread Title',
        body: 'Thread body content.',
      };

      const response = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: threadPayload,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(201);
      expect(responseJson.status).toEqual('success');
      expect(responseJson.data.addedThread).toBeDefined();
      expect(responseJson.data.addedThread).toHaveProperty('id');
      expect(responseJson.data.addedThread).toHaveProperty('title', threadPayload.title);
    });
  });

  describe('when POST /threads/{threadId}/comments', () => {
    it('should respond with 201 and create a new comment', async () => {
      const server = await createServer(container);
      const accessToken = await registerAndLoginUser(server);

      const threadPayload = {
        title: 'Thread Title',
        body: 'Thread body content.',
      };

      const threadResponse = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: threadPayload,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const threadId = JSON.parse(threadResponse.payload).data.addedThread.id;

      const commentPayload = {
        content: 'This is a comment',
      };

      const response = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments`,
        payload: commentPayload,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(201);
      expect(responseJson.status).toEqual('success');
      expect(responseJson.data.addedComment).toBeDefined();
      expect(responseJson.data.addedComment).toHaveProperty('id');
      expect(responseJson.data.addedComment).toHaveProperty('content', commentPayload.content);
    });
  });

  describe('when DELETE /threads/{threadId}/comments/{commentId}', () => {
    it('should respond with 200 and delete a comment', async () => {
      const server = await createServer(container);
      const accessToken = await registerAndLoginUser(server);

      const threadPayload = {
        title: 'Thread Title',
        body: 'Thread body content.',
      };

      const threadResponse = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: threadPayload,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const threadId = JSON.parse(threadResponse.payload).data.addedThread.id;

      const commentPayload = {
        content: 'This is a comment',
      };

      const commentResponse = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments`,
        payload: commentPayload,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const commentId = JSON.parse(commentResponse.payload).data.addedComment.id;

      const response = await server.inject({
        method: 'DELETE',
        url: `/threads/${threadId}/comments/${commentId}`,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(200);
      expect(responseJson.status).toEqual('success');
    });
  });

  describe('when GET /threads/{threadId}', () => {
    it('should respond with 200 and return thread details', async () => {
      const server = await createServer(container);
      const accessToken = await registerAndLoginUser(server);

      const threadPayload = {
        title: 'Thread Title',
        body: 'Thread body content.',
      };

      const threadResponse = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: threadPayload,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const threadId = JSON.parse(threadResponse.payload).data.addedThread.id;

      const response = await server.inject({
        method: 'GET',
        url: `/threads/${threadId}`,
      });

      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(200);
      expect(responseJson.status).toEqual('success');
      expect(responseJson.data.thread).toBeDefined();
      expect(responseJson.data.thread).toHaveProperty('id', threadId);
      expect(responseJson.data.thread).toHaveProperty('title', threadPayload.title);
    });
  });
});
