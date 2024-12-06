class DeleteCommentUseCase {
  constructor({ threadRepository }) {
    this._threadRepository = threadRepository;
  }

  async execute({ threadId, commentId }, credentials) {
    // Mendapatkan userId dari credentials (sudah terverifikasi)
    const userId = credentials;
    if (!userId) {
      throw new Error('DELETE_COMMENT_USE_CASE.NOT_AUTHENTICATED');
    }

    // // Verifikasi keberadaan thread dan komentar
    await this._threadRepository.verifyThreadExistence(threadId);
    await this._threadRepository.verifyCommentExistence(commentId);

    // // Verifikasi kepemilikan komentar menggunakan userId
    await this._threadRepository.verifyCommentOwnership(commentId, userId);

    // Hapus komentar dari thread
    await this._threadRepository.deleteComment(commentId);
  }
}

module.exports = DeleteCommentUseCase;
