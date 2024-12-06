const AddThreadUseCase = require('../../../../Applications/use_case/AddThreadUseCase');
const AddCommentUseCase = require('../../../../Applications/use_case/AddCommentUseCase');
const DeleteCommentUseCase = require('../../../../Applications/use_case/DeleteCommentUseCase');
const GetThreadDetailUseCase = require('../../../../Applications/use_case/GetThreadDetailUseCase');

class ThreadsHandler {
  constructor(container) {
    this._container = container;

    this.postThreadHandler = this.postThreadHandler.bind(this);
    this.postCommentThreadHandler = this.postCommentThreadHandler.bind(this);
    this.deleteCommentThreadHandler = this.deleteCommentThreadHandler.bind(this);
    this.getCommentThreadHandler = this.getCommentThreadHandler.bind(this);
  }

  // Create a new thread
  async postThreadHandler(request, h) {
    const addThreadUseCase = this._container.getInstance(AddThreadUseCase.name);

    // Extract userId from credentials
    const { id: userId } = request.auth.credentials;

    // Pass userId to use case
    const addedThread = await addThreadUseCase.execute(
      request.payload,
      userId, // Include userId as the owner
    );

    const response = h.response({
      status: 'success',
      data: {
        addedThread,
      },
    });
    response.code(201);
    return response;
  }

  // Add a comment to an existing thread
  async postCommentThreadHandler(request, h) {
    const addCommentUseCase = this._container.getInstance(AddCommentUseCase.name);
    const { threadId } = request.params;

    // Extract userId from credentials
    const { id: userId } = request.auth.credentials;

    // Pass userId and other data to use case
    const addedComment = await addCommentUseCase.execute({
      content: request.payload.content,
      threadId, // Include userId as the owner
    }, userId);

    const response = h.response({
      status: 'success',
      data: {
        addedComment,
      },
    });
    response.code(201);
    return response;
  }

  // Delete a comment from a thread
  async deleteCommentThreadHandler(request, h) {
    const deleteCommentUseCase = this._container.getInstance(DeleteCommentUseCase.name);
    const { threadId, commentId } = request.params;

    // Extract userId from credentials
    const { id: userId } = request.auth.credentials;

    // Pass userId and other data to use case
    await deleteCommentUseCase.execute({
      threadId,
      commentId,
    }, userId);

    const response = h.response({
      status: 'success',
    });
    response.code(200);
    return response;
  }

  // Get thread details with comments
  async getCommentThreadHandler(request) {
    const getThreadDetailUseCase = this._container.getInstance(GetThreadDetailUseCase.name);
    const { threadId } = request.params;

    const threadDetail = await getThreadDetailUseCase.execute(threadId);

    return {
      status: 'success',
      data: {
        thread: threadDetail.thread,
      },
    };
  }
}

module.exports = ThreadsHandler;
