var express = require('express');
var request = require('request');
var _ = require('lodash');

var eventBriteToken = process.env.EVENTBRITE_TOKEN;

var app = express();
app.set('json spaces', 2);

app.use(express.static('public'))

app.get('/events', function (req, res) {
  request('https://www.eventbriteapi.com/v3/users/me/owned_events?token=' + eventBriteToken + '&status=live', function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var events = JSON.parse(body).events;

      var eventData = _.map(events, function(event) {

        var monthNames = ["January", "February", "March","April", "May", "June", "July","August", "September", "October","November", "December"];

        function padLeft(nr, n, str){
          return Array(n-String(nr).length+1).join(str||'0')+nr;
        }

        var startDate = new Date(event.start.local);
        var endDate = new Date(event.end.local);

        return {
          name: event.name.text,
          description: event.description.text.split('\n')[0],
          url: event.vanity_url ? event.vanity_url : event.url,
          logoUrl: event.logo ? event.logo.url : null,
          date: monthNames[startDate.getMonth()] + " " + startDate.getDate(),
          startTime: startDate.getHours() + ":" + padLeft(startDate.getMinutes(), 2),
          endTime: endDate.getHours() + ":" + padLeft(endDate.getMinutes(), 2)
        };

      });
      res.json(eventData);
    }
    // TODO, error?
  });

});

app.listen(8080, function () {
  console.log('App listening on port 8080!');
});
