const config = require('./config.js');

class Metrics {
    constructor() {
        this.allMetrics = {
            requests: {
                total: 0,
                GET: 0,
                PUT: 0,
                POST: 0,
                DELETE: 0
            },
            activeUsers: {
                total: 0
            },
            authAttempts: {
                success: 0,
                failure: 0
            },
            system: {
                cpu: 0,
                memory: 0
            },
            pizza: {
                sold: 0,
                failures: 0,
                revenue: 0
            },
            latency: {
                endpoint: 0,
                creation: 0
            }
        }

        const timer = setInterval(() => {
            this.sendAllMetricsToGrafana();
        }, 10000);
        timer.unref();
    }

    sendAllMetricsToGrafana() {
        Object.entries(this.allMetrics).forEach(([category, items]) => {
            Object.entries(items).forEach(([metric, value]) => {
                this.sendMetricToGrafana(category, metric, value);
            })
        })
    }

    sendMetricToGrafana(metricPrefix, metricName, metricValue) {
        const metric = `${metricPrefix},source=${config.metrics.source} ${metricName}=${metricValue}`;

        fetch(`${config.metrics.url}`, {
            method: 'POST',
            body: metric,
            headers: { Authorization: `Bearer ${config.metrics.userId}:${config.metrics.apiKey}` },
        })
          .then(response => {
              if (!response.ok) {
                  console.error('Failed to push metrics data to Grafana');
              } else {
                  console.log(`Pushed ${metric}`);
              }
          })
          .catch(error => console.log('Error pushing metric:', error));
    }
}

const metrics = new Metrics();
module.exports = metrics;