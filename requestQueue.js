'use strict';

const Queue = require('queue');

// Class written by GitHub user chetanism
// https://github.com/jessetane/queue/wiki/Recipes
// Permalink to wiki contribution: https://git.io/JfNeN
class RequestQueue {
  constructor(queueOptions) {
    this.theQueue = new Queue(queueOptions);
    this.jobResolveRejectMap = new Map();

    this.theQueue.on('success', this.onJobComplete.bind(this));
    this.theQueue.on('error', this.onJobFailed.bind(this));
  }

  async addJob(job) {
    this.theQueue.push(job);
    return new Promise((resolve, reject) => {
      this.jobResolveRejectMap.set(job, { resolve, reject });
    });
  }

  onJobComplete(result, job) {
    const { resolve } = this.jobResolveRejectMap.get(job);
    this.jobResolveRejectMap.delete(job);
    resolve(result);
  }

  onJobFailed(error, job) {
    const { reject } = this.jobResolveRejectMap.get(job);
    this.jobResolveRejectMap.delete(job);
    reject(error);
  }
}

module.exports = RequestQueue;
