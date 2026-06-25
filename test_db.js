import('./server/src/db.js').then(async (db) => {
  const payload = {
    reel_id: '123',
    user_id: '60c72b2f9b1d8e4b88a91b2c',
    author_name: 'Test',
    author_handle: '@test',
    text: 'test comment'
  };
  console.log("creating payload:", payload);
  try {
    const doc = await db.ReelComment.create(payload);
    console.log('Result:', doc);
  } catch (err) {
    console.error('Caught error:', err);
  }
  process.exit(0);
}).catch(console.error);
