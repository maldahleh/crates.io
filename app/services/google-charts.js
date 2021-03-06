import { alias, bool } from '@ember/object/computed';
import Service from '@ember/service';

import { task } from 'ember-concurrency';

import { ignoreCancellation } from '../utils/concurrency';

export default class GoogleChartsService extends Service {
  @alias('loadTask.lastSuccessful.value') visualization;
  @bool('visualization') loaded;

  async load() {
    await this.loadTask.perform().catch(ignoreCancellation);
  }

  @(task(function* () {
    let api = yield loadJsApi();
    yield loadCoreChart(api);
    return api.visualization;
  }).keepLatest())
  loadTask;
}

async function loadScript(src) {
  await new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.addEventListener('load', resolve);
    script.addEventListener('error', event => {
      reject(new ExternalScriptError(event.target.src));
    });
    document.body.append(script);
  });
}

export class ExternalScriptError extends Error {
  constructor(url) {
    let message = `Failed to load script at ${url}`;
    super(message);
    this.name = 'ExternalScriptError';
    this.url = url;
  }
}

async function loadJsApi() {
  if (!window.google) {
    await loadScript('https://www.gstatic.com/charts/loader.js');
  }
  return window.google;
}

async function loadCoreChart(api) {
  await new Promise(resolve => {
    api.load('visualization', '1.0', {
      packages: ['corechart'],
      callback: resolve,
    });
  });
}
