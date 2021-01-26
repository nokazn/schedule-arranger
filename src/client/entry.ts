import $ from 'jquery';
import type { AvailabilityAttributes, CommentAttributes } from '~/entities';

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

const buttonSelfComment = $('#self-comment-button');
buttonSelfComment.on('click', () => {
  const scheduleId = buttonSelfComment.data('schedule-id') as string;
  const userId = parseInt(buttonSelfComment.data('user-id') as string, 10);
  const comment = prompt('コメント255文字以内で入力してください。');
  if (comment) {
    $.post(
      `/schedules/${scheduleId}/users/${userId}/comments`,
      {
        comment,
      },
      (data: CommentAttributes) => $('#self-comment').text(data.comment),
    ).catch((err) => {
      console.error(err);
      alert('コメントの投稿に失敗しました');
    });
  }
});
