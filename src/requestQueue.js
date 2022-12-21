'use strict';

const Queue = require('queue');

// Class originally written by GitHub user chetanism
// https://github.com/jessetane/queue/wiki/Recipes
// Permalink to wiki contribution: https://git.io/JfNeN


// Code has been modified to solve 2 problems specific to this use case:

// 1) A limited number of commands can be executed simultaneously
// A visca camera has 2 command buffers where commands are stored when they
// are being executed. Should more than 2 commands be requested to be
// executed at once, only the first 2 will be kept and the rest discarded
// with an error message being returned.
// Therefore we use a queue with 2 heads (set with concurrency: 2
// in queueOptions).
// In essence, this isn't a problem with the queue, but a justification of why
// the queue is necessary in the first place

// 2) When commands are queued, the camera is not as responsive as it tries
//    to 'catch up' with the commands sent
// In the interest of responsiveness from the camera, only last generated
// command in each category (ie. move, zoom etc.) should be kept in the
// queue.
// As an example, if a camera is told to zoom at speed 1, then 2,
// then 3 in a short enough space of time that only the first command can be
// executed, the second command no longer matters, and so the next command
// to be sent to the camera should be to zoom at speed 3.


class RequestQueue {
  /**
   * @class
   * @param {object} options For full options, see https://git.io/JUOUH
   * @param {number} options.concurrency Number of commands a camera can work on
   */
  constructor(options) {
    options = options || {};
    options.concurrency = options.concurrency || 2;
    options.autostart = true;

    this.q = new Queue(options);
    this.jobResolveRejectMap = new Map();

    this.q.on('success', this.onJobComplete.bind(this));
    this.q.on('error', this.onJobFailed.bind(this));
  }

  /**
   * Schedules a command to be send to a camera
   * 
   * @param {Function} job The function which sends the command to a camera
   * @param {string} job.commandCategory The category of command to be sent
   */
  async addJob(job) {
    // The queue should only have *up to* 2 jobs per command category

    let foundMatch = false;
    // look backwards through jobs until the head(s) of the queue are reached
    for (let i = this.q.jobs.length - 1; i >= this.q.concurrency; i--) {
      // replace job if match is found
      if (this.q.jobs[i].commandCategory === job.commandCategory &&
          job.commandCategory !== undefined) {
        foundMatch = true;
        // I'm not sure if the next line is acceptable or not...
        // Skip job by 'completing' it, so that it can be discarded
        this.onJobComplete('', this.q.jobs[i]);
        this.q.jobs[i] = job;
      }
    }

    if (!foundMatch) {
      this.q.push(job);
    }

    return new Promise((resolve, reject) => {
      this.jobResolveRejectMap.set(job, { resolve, reject });
    });
  }

  /**
   * Called when a job is finished, and resolves the promise wrapping that job
   * 
   * @private
   * @param {*} result The return value from the job
   * @param {Function} job The job that was has completed
   */
  onJobComplete(result, job) {
    const { resolve } = this.jobResolveRejectMap.get(job);
    this.jobResolveRejectMap.delete(job);
    resolve(result);
  }

  /**
   * Called when a job fails, and rejects the promise wrapping that job
   * 
   * @private
   * @param {*} error The error from the job
   * @param {*} job The job that has failed
   */
  onJobFailed(error, job) {
    const { reject } = this.jobResolveRejectMap.get(job);
    this.jobResolveRejectMap.delete(job);
    reject(error);
  }
}

module.exports = RequestQueue;
