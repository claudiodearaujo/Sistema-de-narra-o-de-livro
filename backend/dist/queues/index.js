"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeNotificationWorker = exports.setNotificationWorkerEmitter = exports.notificationWorker = exports.narrationWorker = exports.queueNotification = exports.NOTIFICATION_JOB_NAMES = exports.notificationQueue = exports.AUDIO_JOB_NAME = exports.audioQueue = exports.NARRATION_JOB_NAME = exports.narrationQueue = void 0;
// Queue exports
var narration_queue_1 = require("./narration.queue");
Object.defineProperty(exports, "narrationQueue", { enumerable: true, get: function () { return narration_queue_1.narrationQueue; } });
Object.defineProperty(exports, "NARRATION_JOB_NAME", { enumerable: true, get: function () { return narration_queue_1.NARRATION_JOB_NAME; } });
var audio_queue_1 = require("./audio.queue");
Object.defineProperty(exports, "audioQueue", { enumerable: true, get: function () { return audio_queue_1.audioQueue; } });
Object.defineProperty(exports, "AUDIO_JOB_NAME", { enumerable: true, get: function () { return audio_queue_1.AUDIO_JOB_NAME; } });
var notification_queue_1 = require("./notification.queue");
Object.defineProperty(exports, "notificationQueue", { enumerable: true, get: function () { return notification_queue_1.notificationQueue; } });
Object.defineProperty(exports, "NOTIFICATION_JOB_NAMES", { enumerable: true, get: function () { return notification_queue_1.NOTIFICATION_JOB_NAMES; } });
Object.defineProperty(exports, "queueNotification", { enumerable: true, get: function () { return notification_queue_1.queueNotification; } });
// Worker exports
var narration_processor_1 = require("./narration.processor");
Object.defineProperty(exports, "narrationWorker", { enumerable: true, get: function () { return narration_processor_1.narrationWorker; } });
var notification_worker_1 = require("./notification.worker");
Object.defineProperty(exports, "notificationWorker", { enumerable: true, get: function () { return notification_worker_1.notificationWorker; } });
Object.defineProperty(exports, "setNotificationWorkerEmitter", { enumerable: true, get: function () { return notification_worker_1.setNotificationWorkerEmitter; } });
Object.defineProperty(exports, "closeNotificationWorker", { enumerable: true, get: function () { return notification_worker_1.closeNotificationWorker; } });
