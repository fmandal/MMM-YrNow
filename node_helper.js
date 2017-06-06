var NodeHelper = require('node_helper');
var request = require('request');

module.exports = NodeHelper.create({
    start: function() {
        this.config = null;
        this.forecastUrl = '';
    },

    socketNotificationReceived: function(notification, payload) {
        var self = this;
        if(notification === 'GET_YRTHEN_FORECAST') {
            self.config = payload.config;
            self.forecastUrl = payload.forecastUrl;
            this.getForecastFromYrThen();
        }
    },

    getForecastFromYrThen: function() {
        var self = this;
        var locationData = {};

        request({url: self.forecastUrl, method: 'GET'}, function(error, response, message) {
            if (!error && (response.statusCode == 200 || response.statusCode == 304)) {
                locationData.forecast = JSON.parse(message);
                self.sendSocketNotification('YRTHEN_FORECAST_DATA', locationData);
            }
            setTimeout(function() { self.getForecast(); }, self.config.updateInterval);
        });
    },

    setNextUpdateYrThen: function(headers) {
        var cacheControlHeader = headers['cache-control'];
        var maxAge = cacheControlHeader.slice(cacheControlHeader.indexOf('=') + 1);
        this.config.updateInterval = maxAge * 1000;
    }
});
