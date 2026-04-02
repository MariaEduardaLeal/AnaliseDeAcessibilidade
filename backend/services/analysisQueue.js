const queue = [];
let activeCount = 0;
const MAX_CONCURRENT_ANALYSES = 1;

async function runNext() {
  if (activeCount >= MAX_CONCURRENT_ANALYSES || queue.length === 0) {
    return;
  }

  const job = queue.shift();
  activeCount += 1;

  try {
    await job();
  } finally {
    activeCount -= 1;
    setImmediate(runNext);
  }
}

function enqueue(job) {
  queue.push(job);
  setImmediate(runNext);
}

function getQueueStats() {
  return {
    activeCount,
    pendingCount: queue.length,
    maxConcurrentAnalyses: MAX_CONCURRENT_ANALYSES,
  };
}

module.exports = {
  enqueue,
  getQueueStats,
};
