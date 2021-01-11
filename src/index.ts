import './pre-start'; // Must be the first import
import app from '~/server';

import logger from '~/shared/logger';
import { PORT } from '~/shared/constants';

app.listen(PORT, () => {
  logger.info(`Express server started on port: ${PORT}`);
});
