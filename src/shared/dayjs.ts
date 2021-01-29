import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(timezone);
dayjs.tz.setDefault('Asia/Tokyo');

export default dayjs;
