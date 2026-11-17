import queueReviews from './queueReviews';

describe('queueReviews', () => {

  // ****
  test('reviews should work with empty array', () => {
    const queue = queueReviews([])
    expect(queue).toEqual([]);
  });

});