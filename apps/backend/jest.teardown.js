// Global teardown to ensure all connections are closed
module.exports = async () => {
  // Give time for all async operations to complete
  await new Promise((resolve) => setTimeout(resolve, 100));
};

