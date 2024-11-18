const config = require('./config.js');
const os = require('os');

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
        }, 60000); // report each minute
        timer.unref();
    }

    sendAllMetricsToGrafana() {
        // update system each report
        this.allMetrics.system.cpu = this.getCpuUsagePercentage();
        this.allMetrics.system.memory = this.getMemoryUsagePercentage();

        Object.entries(this.allMetrics).forEach(([category, items]) => {
            Object.entries(items).forEach(([metric, value]) => {
                this.sendMetricToGrafana(category, metric, value);
            })
        })
        this.resetMetrics(this.allMetrics); // reset all to 0 on report
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

    incrementRequests(method) {
        this.allMetrics.requests.total++;
        this.allMetrics.requests[method]++;
    }

    addActiveUser() {
        this.allMetrics.activeUsers.total++;
    }

    removeActiveUser() {
        this.allMetrics.activeUsers.total--;
    }

    incrementSuccessfulAuth() {
        this.allMetrics.authAttempts.success++;
    }

    incrementFailureAuth() {
        this.allMetrics.authAttempts.failure++;
    }

    getCpuUsagePercentage() {
        const cpuUsage = os.loadavg()[0] / os.cpus().length;
        return cpuUsage.toFixed(2) * 100;
    }

    getMemoryUsagePercentage() {
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const usedMemory = totalMemory - freeMemory;
        const memoryUsage = (usedMemory / totalMemory) * 100;
        return memoryUsage.toFixed(2);
    }

    incrementPizzaSold() {
        this.allMetrics.pizza.sold++;
    }

    incrementPizzaFailures() {
        this.allMetrics.pizza.failures++;
    }

    incrementRevenue(price) {
        this.allMetrics.pizza.revenue += price;
    }

    setEndpointLatency(time) {
        this.allMetrics.latency.endpoint = time;
    }

    setPizzaCreationLatency(time) {
        this.allMetrics.latency.creation = time;
    }

    // reset all except active users and revenue
    resetMetrics(obj) {
        for (const key in obj) {
            if (key === 'activeUsers') {
                continue;
            }
            if (typeof obj[key] === 'object') {
                this.resetMetrics(obj[key]);
            } else if (typeof obj[key] === 'number' && key !== 'revenue') {
                obj[key] = 0;
            }
        }
    }
}

const metrics = new Metrics();
module.exports = metrics;