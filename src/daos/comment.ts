import type { FindOptions } from 'sequelize';

import { Comment, CommentAttributes } from '~/entities';
import logger from '~/shared/logger';

export interface ICommentDao {
  getAll(option?: FindOptions<CommentAttributes>): Promise<CommentAttributes[]>;
  upsert(comment: CommentAttributes): Promise<CommentAttributes>;
}

class CommentDao implements ICommentDao {
  public getAll(options: FindOptions<CommentAttributes>): Promise<CommentAttributes[]> {
    return Comment.findAll(options)
      .then((comments) => comments.map((c) => c.get()))
      .catch((err: Error) => {
        logger.error(err);
        return [];
      });
  }

  public upsert(comment: CommentAttributes): Promise<CommentAttributes> {
    return Comment.upsert(comment)
      .then(([c]) => c.get())
      .catch((err: Error) => {
        logger.error(err);
        throw err;
      });
  }
}

export default new CommentDao();
