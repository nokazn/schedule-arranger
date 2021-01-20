import $ from 'jquery';
import type { AvailabilityAttributes } from '~/entities';

$('.availability-toggle-button').each((i, e) => {
  const button = $(e);

  button.on('click', () => {
    const scheduleId = button.data('schedule-id') as string;
    const userId = button.data('user-id') as string;
    const candidateId = button.data('candidate-id') as string;
    const availability = parseInt(button.data('availability'), 10);
    const nextAvailability = (availability + 1) % 3;
    $.post(
      `/schedules/${scheduleId}/users/${userId}/candidates/${candidateId}`,
      {
        availability: nextAvailability,
      },
      (data: AvailabilityAttributes) => {
        button.data('availability', data.availability);
        const availabilityLabels = ['欠', '?', '出'];
        button.text(availabilityLabels[data.availability]);
      },
    ).catch((err) => {
      console.error(err);
      alert('更新が失敗しました。');
    });
  });
});
