const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZG1pbklkIjoiNjlkNjYzYzMwMDAxM2FlMzFiYjQiLCJpYXQiOjE3NzYzMjc4NTIsImV4cCI6MTc3NjkzMjY1Mn0.09zExOl_1Av-RzU9FxfFJoAKitvT1T9OJxfatGO5rb4";
(async () => {
  const d = await fetch("http://localhost:4000/api/news/69e09d3d003962786059", {
    method:"GET",
    headers: {"Authorization": "Bearer "+token}
  });
  console.log("Get status:", d.status);
})();
