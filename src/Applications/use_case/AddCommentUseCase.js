const AddComment = require('../../Domains/threads/entities/AddComment');
const AddedComment = require('../../Domains/threads/entities/AddedComment');

class AddCommentUseCase {
  constructor({ threadRepository }) {
    this._threadRepository = threadRepository;
  }

  async execute(useCasePayload, credentials) {
    const { threadId, content } = useCasePayload;

    // Validasi credentials untuk mendapatkan userId
    if (!credentials) {
      throw new Error('ADD_COMMENT_USE_CASE.NOT_AUTHENTICATED');
    }

    await this._threadRepository.verifyThreadExistence(threadId);
    // Validasi dan buat objek komentar baru
    const addComment = new AddComment({ content });

    // Tambahkan komentar ke dalam thread dengan menggunakan credentials
    const addedComment = await this._threadRepository.addCommentToThread(threadId, {
      content: addComment.content,
      owner: credentials, // Menggunakan userId untuk kepemilikan komentar
    });

    // Kembalikan instance AddedComment dengan data lengkap
    return new AddedComment({
      id: addedComment.id,
      content: addedComment.content,
      owner: addedComment.owner, // Data owner dari hasil repository
    });
  }
}

module.exports = AddCommentUseCase;
