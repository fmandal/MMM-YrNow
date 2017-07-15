Module.register('MMM-YrThen', {
    defaults: {
        location: "1-2820936",
        yrApiUrl: "https://www.yr.no/api/v0/locations/id/%s/forecast",
        yrCelestialApiUrl: "https://www.yr.no//api/v0/locations/%s/celestialevent",
        updateInterval: 3600000,
        initialLoadDelay: 1000,
        showAll: true,
        showPrecipitation: true,
        showMaxMin: true,
        details: true,
        detailedPrec: true,
        numDetails: 2,
        numDays: 7,
        roundTemp: true,
        roundPrec: false,
        title: 'Værmelding for Skrubblivegen',
        header: false
    },

    getTranslations: function() {
        return {
            no: "translations/no.json",
        }
    },

    getScripts: function() {
        return [
            'printf.js',
            'readTextFile.js',
            'moment.js'
        ];
    },

    getStyles: function() {
        return [
            'MMM-YrThen.css'
        ];
    },

    start: function() {
        Log.info('Starting module ' + this.name);
        moment.locale(config.language);
        this.dataFromYr;
        this.loaded = false;
        this.forecastData = {};
        this.scheduleUpdate(this.config.initialLoadDelay);
        var self = this;
        setInterval(function() {
            self.updateDom();
        }, 1000);
    },

    round: function(value, precision){
        var multiplier = Math.pow(10, precision || 0);
        var tempV = Math.round(value * multiplier) / multiplier;
        return tempV.toFixed(precision);
    },

    getDom: function() {
        var wrapper = document.createElement('div');
        if(!this.loaded){
            wrapper.innerHTML = this.translate('loading');
            wrapper.className = "dimmed light small";
            return wrapper;
        }

        if(this.config.header){
            var header = document.createElement('header');
            header.innerHTML = this.config.title;
            header.className = 'align-left';
            wrapper.appendChild(header);
        }
        wrapper.classList.add = "dimmed light small";

        var table = document.createElement('table');
        table.className = "xsmall yrthen-table";

// SHOWING DETAILED FORECAST
        if(this.config.showAll == true){
            var day;
            var x = 0;
            var first = true;
            var timeRow = document.createElement('tr');
            table.appendChild(timeRow);
            for(var i = 0; i < 5; i++){
                var newCell = document.createElement('td');
                newCell.className = 'align-left bright xsmall yrthen-header';
                if(i == 0) newCell.innerHTML = '&nbsp;';
                if(i == 1) newCell.innerHTML = this.translate("night");
                if(i == 2) newCell.innerHTML = this.translate("morning");
                if(i == 3) newCell.innerHTML = this.translate("afternoon");
                if(i == 4) newCell.innerHTML = this.translate("evening");
                timeRow.appendChild(newCell);
            }


            for (var f in this.dataFromYr) {
                    var newData = this.dataFromYr[f];
                    var checkTime = moment(newData.start).format("HH");
                    var today = moment(newData.start).format("ddd");
                    // Make max four cells pr day
                    if(day != today){
                        if(x < this.config.numDays){
                            var row = document.createElement('tr');
                            table.appendChild(row);

                            var dayCell = document.createElement("td");
                            dayCell.className = "yrthen-day align-left";
                            dayCell.innerHTML = moment(newData.start).format("dddd");
                            row.appendChild(dayCell);
                        }
                        day = today;
                        x++;
                    }
                    if(first == true){
                        if(checkTime >= "06"){
                            var emptyCell = document.createElement("td");
                            emptyCell.innerHTML = "&nbsp;";
                            row.appendChild(emptyCell);
                        }
                        if(checkTime >= "12"){
                            var emptyCell = document.createElement("td");
                            emptyCell.innerHTML = "&nbsp;";
                            row.appendChild(emptyCell);
                        }
                        if(checkTime >= "18"){
                            var emptyCell = document.createElement("td");
                            emptyCell.innerHTML = "&nbsp;";
                            row.appendChild(emptyCell);
                        }
                    }
                    first = false;
                if(x <= this.config.numDays){
                    var forecastCell = document.createElement("td");
                    forecastCell.className = "yrthen-forecast-cell";
                    var icon = document.createElement("img");
                    icon.className = "yrthen-icon";
    //                icon.width = "40";
                    var weatherSymbol = this.calculateWeatherSymbolId(newData.symbol);
                    icon.src = this.file(printf('images/%s.svg', weatherSymbol));
                    forecastCell.appendChild(icon);
                    forecastCell.innerHTML += '<br>';
                    if(this.config.roundTemp){
                        tempValue = this.round(newData.temperature.value, 0);
                        maxValue = this.round(newData.temperature.max, 0);
                        minValue = this.round(newData.temperature.min, 0);
                    }
                    else{
                        tempValue = this.round(newData.temperature.value, 1);
                        maxValue = this.round(newData.temperature.max, 1);
                        minValue = this.round(newData.temperature.min, 1);
                    }
                    if(this.config.showMaxMin){
                        if(newData.temperature.min && newData.temperature.max) forecastCell.innerHTML += '<span class="bright small">' + minValue + '-' + maxValue + '</span><br>';
                        else forecastCell.innerHTML += ' <span class="bright small">' + tempValue + '</span><br>';
                    }
                    else{
                        forecastCell.innerHTML += ' <span class="bright small">' + tempValue + '</span>';
                        if(this.config.showMaxMin){
                            forecastCell.innerHTML += '<br>';
                        }
                        if(newData.temperature.min && newData.temperature.max && this.config.showMaxMin){
                            forecastCell.innerHTML += '<span class="dimmed">(' + minValue + '/' + maxValue + ')</span><br>';
                        }
                        else if(!newData.temperature.min && !newData.temperature.max && this.config.showMaxMin){
                            forecastCell.innerHTML += '<span class="dimmed">(' + tempValue + '/' + tempValue + ')</span><br>';
                        }
                    }
                    if(this.config.showPrecipitation){
                        var precValue = ' <span class="dimmed">(';
                        if(this.config.detailedPrec){
                            if(newData.precipitation.min || newData.precipitation.max){
                                if(this.config.roundPrec) precValue += this.round(newData.precipitation.min, 0);
                                else precValue += this.round(newData.precipitation.min, 1);
                                precValue += "-";
                                if(this.config.roundPrec) precValue += this.round(newData.precipitation.max, 0);
                                else precValue += this.round(newData.precipitation.max, 1);
                            }
                            else{
                                if(this.config.roundPrec) precValue += this.round(newData.precipitation.value, 0);
                                else precValue += this.round(newData.precipitation.value, 1);
                            }
                        }
                        else {
                            if(this.config.roundPrec) precValue += this.round(newData.precipitation.value, 0);
                            else precValue += this.round(newData.precipitation.value, 1);
                        }
                        if(this.config.showMaxMin && !this.config.detailedPrec){
                            precValue += ' mm';
                        }
                        precValue += ')</span>';
                        forecastCell.innerHTML += precValue;
                    }
                    row.appendChild(forecastCell);
                }
            }
        }

// SHOWING DAILY FORECAST
        else{
            var x = 0;
            for (var f in this.dataFromYr) {
                var newData = this.dataFromYr[f];
                var checkTime = moment(newData.start).format("HH");

                var show = false;
                if(f < this.config.numDetails && this.config.details == true) show = true;
                if(checkTime > 11 && checkTime < 15) show = true;
                if(x >= this.config.numDays) show = false;
                if(show == true){
                    var row = document.createElement('tr');
                    table.appendChild(row);

                    var dayCell = document.createElement("td");
                    dayCell.className = "yrthen-day align-left";
                    if(f < this.config.numDetails && this.config.details == true) dayCell.innerHTML = moment(newData.start).format("ddd HH:mm");
                    else dayCell.innerHTML = moment(newData.start).format("dddd");
                    row.appendChild(dayCell);

                    var iconCell = document.createElement("td");
                    iconCell.className = "yrthen-icon-cell";
                    row.appendChild(iconCell);

                    var icon = document.createElement("img");
                    icon.className = "yrthen-icon ";
                    icon.width = "40";
                    var weatherSymbol = this.calculateWeatherSymbolId(newData.symbol);
                    icon.src = this.file(printf('images/%s.svg', weatherSymbol));
                    iconCell.appendChild(icon);
        
                    var maxTempCell = document.createElement("td");
                    if(this.config.roundTemp) maxTempCell.innerHTML = this.round(newData.temperature.value, 0);
                    else maxTempCell.innerHTML = this.round(newData.temperature.value, 1);
                    maxTempCell.className = "align-right bright yrthen-temp small";
                    row.appendChild(maxTempCell);

                    var minTempCell = document.createElement("td");
                    minTempCell.innerHTML = this.round(newData.precipitation.value, 1);
                    minTempCell.className = "align-right yrthen-prec dimmed";
                    row.appendChild(minTempCell);

                    x++;
                }
            }
        }


        wrapper.appendChild(table);
        this.loaded = true;
        return wrapper;
    },

    updateForecast: function() {
        Log.info('Updating forecast now');
        var forecastUrl = printf(printf('%s', this.config.yrApiUrl),this.config.location);
        this.sendSocketNotification('GET_YRTHEN_FORECAST', {
            forecastUrl: forecastUrl,
            config: this.config.updateInterval
        });
        this.scheduleUpdate();
    },

    processForecast: function(obj) {
        if(obj.longIntervals){
            this.loaded = true;
            this.dataFromYr = obj.longIntervals;
        }
        else{
            Log.info('I have no data!');
        }
    },

    calculateWeatherSymbolId: function(data) {
        if (!data) return '';
        let id = data.n < 10 ? printf('0%s', data.n) : data.n;
        switch (data.var) {
            case 'Sun':
            id += 'd';
            break;
            case 'PolarNight':
            id += 'm';
            break;
            case 'Moon':
            id += 'n';
            break;
        }
        return id;
    },

    socketNotificationReceived: function(notification, payload) {
        if(notification === 'YRTHEN_FORECAST_DATA') {
            Log.info('Got forecast');
            this.processForecast(payload.forecast);
            this.updateDom(1000);
        }
    },

    scheduleUpdate: function(delay) {
        var nextLoad = this.config.updateInterval;
        if (typeof delay !== "undefined" && delay >= 0) {
            nextLoad = delay;
        }

        var self = this;
        setTimeout(function() {
            self.updateForecast();
        }, nextLoad);
    },

});
