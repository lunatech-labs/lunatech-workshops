var express = require('express');
var request = require('request');
var async = require('async');
var _ = require('lodash');
var enforce = require('express-sslify');

var eventBriteToken = process.env.EVENTBRITE_TOKEN;

var app = express();
app.set('json spaces', 2);

app.use(express.static('public'))
app.use(enforce.HTTPS({ trustProtoHeader: true }))

app.get('/events', function(req, res) {
  request('https://www.eventbriteapi.com/v3/users/me/owned_events?token=' + eventBriteToken + '&status=live', function(error, response, body) {
    if (!error && response.statusCode == 200) {
      var events = JSON.parse(body).events;

      // Ugly hack to hide the bowling tournament
      events = events.filter(function(event) { return event.id != "54580110580"; });

      async.map(events, function(event, callback) {
        request('https://www.eventbriteapi.com/v3/events/' + event.id + '/ticket_classes/?token=' + eventBriteToken, function(error, response, body) {
          var ticket = JSON.parse(body).ticket_classes[0];

          var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

          function padLeft(nr, n, str) {
            return Array(n - String(nr).length + 1).join(str || '0') + nr;
          }


          var location;
          console.log("Event Description Text: ", event.description.text);

var lcDesc = event.description.text.toLowerCase();
          console.log("lcDesc", lcDesc);

          if(lcDesc.indexOf('amsterdam') > -1){
            location = "Amsterdam";
          } else if(lcDesc.indexOf('rotterdam') > -1){
            location = "Rotterdam";
          } else {
            location = "See Details"
          }

          var startDate = new Date(event.start.local);
          var endDate = new Date(event.end.local);

          var result = {
            name: event.name.text,
            description: event.description.text.split('\n')[0],
            url: event.vanity_url ? event.vanity_url : event.url,
            logoUrl: event.logo ? event.logo.url : null,
            date: monthNames[startDate.getMonth()] + " " + startDate.getDate(),
            // startTime: startDate.getHours() + ":" + padLeft(startDate.getMinutes(), 2),
            // endTime: endDate.getHours() + ":" + padLeft(endDate.getMinutes(), 2),
            location: location,
            totalTickets: ticket.quantity_total,
            availableTickets: ticket.quantity_total - ticket.quantity_sold
          }

          callback(error, result);
        });
      }, function(err, results) {
        res.json(results);
      });
    }
    // TODO, error?
  });
});

app.listen(8080, function() {
  console.log('App listening on port 8080!');
});
