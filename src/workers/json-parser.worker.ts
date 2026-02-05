// Handle large AI responses in background thread
self.onmessage = (e: MessageEvent<string>) => {
  try {
    const parsed = JSON.parse(e.data);
    self.postMessage({ success: true, data: parsed });
  } catch (error) {
    self.postMessage({ success: false, error: String(error) });
  }
};
