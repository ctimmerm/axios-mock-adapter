function replyWithConfig(reply) {
  return function(config) {
    reply(function() {
      return new Promise(function(resolve) {
        setTimeout(function() {
          config.responses = {
            success: config.responses.success ? config.responses.success : [200, { message: 'success' }],
            error: config.responses.error ? config.responses.error : [500, { message: 'error' }]
          };

          var errorChance = config.errorChance || 0;
          if (Math.random() < errorChance) {
            resolve(config.responses.error);
          } else {
            resolve(config.responses.success);
          }
        }, delayTime(config.delay));
      });
    });
  };
}

function delayTime(delay) {
  var pendingTime = 300;
  if (Number.isInteger(delay)) {
    pendingTime = delay;
  } else if (Array.isArray(delay)) {
    pendingTime = Math.floor(Math.random() * (delay[1] - delay[0] + 1) + delay[0]);
  }
  return pendingTime;
}
module.exports = replyWithConfig;
