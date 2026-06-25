fetch("http://localhost:5001/api/reels/123/comments", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    user_id: "60c72b2f9b1d8e4b88a91b2c",
    author_name: "Test",
    author_handle: "@test",
    text: "test comment"
  })
}).then(res => res.json()).then(console.log).catch(console.error);
