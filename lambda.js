var firebase = require('firebase');
var config = require('./config');

var firebaseConfig = config.firebaseConfig;

var firebaseApp = firebase.initializeApp(firebaseConfig);

function getRemindersText(value) {
  var reminderIntro = value.length === 1 ? "You have 1 reminder. " : "You have " + value.length + " reminders. ";
  var reminderNumber = 0;

  return reminderIntro + value.map(function(reminder) {
      reminderNumber += 1;
    return "Reminder " + reminderNumber + ": " + reminder.message + " ";
  });
}

function listReminders(value, event, context, callback) {
  value = value || [];

  if (callback) {
    context.callbackWaitsForEmptyEventLoop = false;
    callback(null, {
      "version": "1.0",
      "sessionAttributes": {},
      "response": {
        "outputSpeech": {
          "type": "PlainText",
          "text": getRemindersText(value)
        },
        "card": {
          "type": "Simple",
          "title": "Appris",
          "content": "I got all of your reminders"
        },
        "reprompt": {
          "outputSpeech": {
            "type": "PlainText",
            "text": null
          }
        }
      }
    });
  }
}

function handleListRemindersIntent(event, context, callback) {
  console.log(config.auth.email, config.auth.password, firebaseConfig);
  firebaseApp.auth().signInWithEmailAndPassword(config.auth.email, config.auth.password).then(function() {
    var db = firebaseApp.database().ref('reminders');

    return db.once('value').then(
      snapshot => listReminders(snapshot.val(), event, context, callback),
      err => listReminders([], event, context, callback));

  });
}

function createReminder(value, db, event, context, callback) {
  value = value || [];

  const date = new Date();
  date.setHours(0, 0, 0, 0);
  const currentDateText = (date.getMonth() + 1) + "/" + (date.getDate()) + "/" + (date.getFullYear());

  console.log(value);
  value.push({
    dateText: event.request.intent.slots.Date.value || currentDateText,
    hour: event.request.intent.slots.Time.value.split(":")[0],
    id: parseInt(Math.random() * 1000000).toString(),
    message: event.request.intent.slots.Message.value,
    minute: event.request.intent.slots.Time.value.split(":")[1],
    timeText: event.request.intent.slots.Time.value
  });

  db.set(value);

  if (callback) {
    context.callbackWaitsForEmptyEventLoop = false;
    callback(null, {
      "version": "1.0",
      "sessionAttributes": {},
      "response": {
        "outputSpeech": {
          "type": "PlainText",
          "text": "Okay, I will remind you of that"
        },
        "card": {
          "type": "Simple",
          "title": "Appris",
          "content": "I got all of your reminders"
        },
        "reprompt": {
          "outputSpeech": {
            "type": "PlainText",
            "text": null
          }
        }
      }
    });
  }
}

function handleCreateReminderIntent(event, context, callback) {
  firebaseApp.auth().signInWithEmailAndPassword(config.auth.email, config.auth.password).then(function() {
    var db = firebaseApp.database().ref('reminders');

    return db.once('value').then(
      snapshot => createReminder(snapshot.val(), db, event, context, callback),
      err => createReminder([], db, event, context, callback));
  });
}

function handleLaunchRequest(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;
	callback(null, {
		"version": "1.0",
		"response": {
			"outputSpeech": {
				"type": "PlainText",
				"text": "What can I help you with?"
			},
			"card": {
				"type": "Simple",
				"title": "Appris",
				"content": "What can I help you with?"
			},
			"reprompt": {
				"outputSpeech": {
					"type": "PlainText",
					"text": "Can I help you with anything else?"
				}
			},
			"shouldEndSession": false
		}
	});
}

function handleSessionEndedRequest(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;
	callback(null, {
		"version": "1.0",
		"response": {
			"outputSpeech": {
				"type": "PlainText",
				"text": "Goodbye!"
			},
			"card": {
				"type": "Simple",
				"title": "Appris",
				"content": "Goodbye!"
			}
		}
	});
}

exports.handler = function(event, context, callback) {
  console.log('EVENT', JSON.stringify(event, null, 2));
  console.log('CONTEXT', JSON.stringify(context, null, 2));

  if (event.request.type === "LaunchRequest") {
    handleLaunchRequest(event, context, callback);
  } else if (event.request.type === "SessionEndedRequest") {
    handleSessionEndedRequest(event, context, callback);
  } else if (event.request.intent.name === "ListRemindersIntent") {
    handleListRemindersIntent(event, context, callback);
  } else if (event.request.intent.name === "CreateReminderIntent") {
    handleCreateReminderIntent(event, context, callback);
  } else {
    handleListRemindersIntent(event, context, callback);
  }
}
