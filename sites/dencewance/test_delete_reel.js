const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZG1pbklkIjoiNjlkNjYzYzMwMDAxM2FlMzFiYjQiLCJpYXQiOjE3NzYzMjc4NTIsImV4cCI6MTc3NjkzMjY1Mn0.09zExOl_1Av-RzU9FxfFJoAKitvT1T9OJxfatGO5rb4";
(async () => {
  const p = await fetch("http://localhost:4000/api/reels", {
    method:"POST",
    headers: {"Authorization": "Bearer "+token, "Content-Type":"application/json"},
    body: JSON.stringify({video_url:"https://example.com/test"})
  });
  const pr = await p.json();
  console.log("Created reel:", pr);
  const id = pr.data._id || pr.data.id;
  const d = await fetch("http://localhost:4000/api/reels/"+id, {
    method:"DELETE",
    headers: {"Authorization": "Bearer "+token}
  });
  console.log("Deleted status:", d.status);
  if(d.status !== 204) console.log("Del Response:", await d.text());
})();
