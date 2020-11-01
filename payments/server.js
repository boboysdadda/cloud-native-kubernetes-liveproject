const bodyParser = require("body-parser")
const express = require("express")
const pino = require('pino')

const config = require("./config")()
const logger = pino(pino.destination())

const app = express();

app.use(bodyParser.json());

const loadRepositories = require("./repositories")
const loadControllers = require("./controllers")

const repositories = loadRepositories(config)
loadControllers(app, repositories, logger)

const server_port = config.server_port
app.listen(server_port, () => {
    logger.info(`Server is running on port ${server_port}.`)
})

const health = require('@cloudnative/health-connect')
let healthCheck = new health.HealthChecker();
const livePromise = () => new Promise((resolve, _reject) => {

  const appFunctioning = true;

  // You should change the above to a task to determine if your app is functioning correctly

  if (appFunctioning) {
    logger.info('Im alive');
    resolve();

  } else {
    logger.error('Im dead');
    reject(new Error("App is not functioning correctly"));
  }

});

let liveCheck = new health.LivenessCheck("LivenessCheck", livePromise);

healthCheck.registerLivenessCheck(liveCheck);
let readyCheck = new health.PingCheck(`localhost`,`3000`)

healthCheck.registerReadinessCheck(readyCheck);

app.use('/live', health.LivenessEndpoint(healthCheck));

app.use('/ready', health.ReadinessEndpoint(healthCheck));

