const handleUserGreetings = (req, res) => {
  res.json({ message: "Hello, User!" });
};

module.exports = {
  handleUserGreetings,
};
