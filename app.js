require('dotenv-extended').load();

var builder = require('botbuilder');
var restify = require('restify');
var Store = require('./store');
var botbuilder_azure = require("botbuilder-azure");


var spellService = require('./spellservice');

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3988, function () {
    console.log('%s listening to %s', server.name, server.url);
});
// Create connector and listen for messages
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
server.post('/api/messages', connector.listen());
var tableName = 'botdata';
var azureTableClient = new botbuilder_azure.AzureTableClient(tableName, process.env['AzureWebJobsStorage']);
var tableStorage = new botbuilder_azure.AzureBotStorage({ gzipData: false }, azureTableClient);


var bot = new builder.UniversalBot(connector, function (session) {
    session.send('Sorry, I did not understand \'%s\'. Type \'help\' if you need assistance.', session.message.text);
});
bot.dialog('Help', function (session) {
    session.endDialog('Hi! Try asking me things like \'search hotels in Seattle\', \'search hotels near LAX airport');
}).triggerAction({
    matches: 'Help'
});

// You can provide your own model by specifing the 'LUIS_MODEL_URL' environment variable
// This Url can be obtained by uploading or creating your model from the LUIS portal: https://www.luis.ai/
var recognizer = new builder.LuisRecognizer(process.env.LUIS_MODEL_URL);
bot.recognizer(recognizer);
bot.on('conversationUpdate', function (message) {    
    if (message.membersAdded[0].id === message.address.bot.id) {             
          var reply = new builder.Message()    
                .address(message.address)    
                .text("Hello, I'm Chatbot! How's your day going? Type'help' to know more!");        
          bot.send(reply);    
    }
 }); 
 var destination;
 bot.dialog('SearchHotels', [
    function (session, args, next) {
        session.send('Welcome to the Hotels finder! We are analyzing your message: \'%s\'', session.message.text);

        // try extracting entities
        var cityEntity = builder.EntityRecognizer.findEntity(args.intent.entities, 'builtin.geography.city');
        var airportEntity = builder.EntityRecognizer.findEntity(args.intent.entities, 'AirportCode');
        if (cityEntity) {
            destination=cityEntity.entity;
            // city entity detected, continue to next step
            session.dialogData.searchType = 'city';
            console.log(cityEntity);
            next({ response: cityEntity.entity });
        } else if (airportEntity) {
            // airport entity detected, continue to next step
            session.dialogData.searchType = 'airport';
            next({ response: airportEntity.entity });
        } else {
            // no entities detected, ask user for a destination
            builder.Prompts.text(session, 'Please enter your destination');
        }
    },
    function (session, results) {
         destination = results.response;

        var message = 'Looking for hotels';
        if (session.dialogData.searchType === 'airport') {
            message += ' near %s airport...';
        } else {
            message += ' in %s...';
        }

        session.send(message, destination);

        // Async search
        Store
            .searchHotels(destination)
            .then(function (hotels) {
                // args
                session.send('I found %d hotels:', hotels.length);

                var message = new builder.Message()
                    .attachmentLayout(builder.AttachmentLayout.carousel)
                    .attachments(hotels.map(hotelAsAttachment));

                session.send(message);

                // End
                session.endDialog();
            });
    },
    bot.dialog('Reserve', [
        function (session, args, next) {
        session.send("Do You Want to reserve");
        builder.Prompts.time(session, "Please provide a reservation date and time (e.g.: June 6th at 5pm)");
    },
    function (session, results) {
        session.dialogData.reservationDate = builder.EntityRecognizer.resolveTime([results.response]);
        builder.Prompts.number(session, "How many people are in your party?");
    },
    function (session, results) {
        session.dialogData.partySize = results.response;
        builder.Prompts.text(session, "Whose name will this reservation be under?");
    },
    function (session, results) {
        session.dialogData.reservationName = results.response;

        // Process request and display reservation details
        session.send(`Reservation confirmed. Reservation details: <br/>Date/Time: ${session.dialogData.reservationDate} <br/>Party size: ${session.dialogData.partySize} <br/>Reservation name: ${session.dialogData.reservationName}`);
        session.endDialog();
         // book
       
    }
    ]).triggerAction({
        matches: [/bookHotels/i,/reserve first/i,/reserve/i,/book now/i,/get me a reservation/i,/book/i],
        onInterrupted: function (session) {
            session.send('Please provide a correct details');
        }
    }).cancelAction('cancelAction','Ok,reservation cancelled',{
        matches: [/cancel/i,/change/i,/stop/i,/quit/i],
        confirmPrompt:'Are you sure?'
    })

]).triggerAction({
    matches: 'SearchHotels',
    onInterrupted: function (session) {
        session.send('Please provide a location');
    }
});
bot.dialog('SearchHotelsspa', [
    function (session, args, next) {
        session.send('yep I am thinking on %s', session.message.text);

        // try extracting entities
        var cityEntity = builder.EntityRecognizer.findEntity(args.intent.entities, 'builtin.geography.city');
        var airportEntity = builder.EntityRecognizer.findEntity(args.intent.entities, 'AirportCode');
        if (cityEntity) {
            destination=cityEntity.entity;
            // city entity detected, continue to next step
            session.dialogData.searchType = 'city';
            console.log(cityEntity);
            next({ response: cityEntity.entity });
        } else if (airportEntity) {
            // airport entity detected, continue to next step
            session.dialogData.searchType = 'airport';
            next({ response: airportEntity.entity });
        } else {
            // no entities detected, ask user for a destination
            next({ response: destination });
        }
    },
    function (session, results) {
         destination = results.response;

        var message = 'Looking for hotels with spa/bar';
        if (session.dialogData.searchType === 'airport') {
            message += ' near %s airport...';
        } else {
            message += ' in %s...';
        }

        session.send(message, destination);

        // Async search
        Store
            .searchHotelsspa(destination)
            .then(function (hotels) {
                // args
                session.send('I found %d hotels with spa:', hotels.length);

                var message = new builder.Message()
                    .attachmentLayout(builder.AttachmentLayout.carousel)
                    .attachments(hotels.map(hotelAsAttachment));

                session.send(message);

                // End
                session.endDialog();
            });
    }
]).triggerAction({
    matches: 'SearchHotelsspa',
    onInterrupted: function (session) {
        session.send('Please provide a location');
    }
})
var location=destination;
bot.dialog('Taxi.Book',[
    
     function(session, args,next){
         //  entity passed from LUIS.
         var destination=0;
         var intent = args.intent;
         var intent1 = args.intent;
         var TaxiPlaceNameEntity=builder.EntityRecognizer.findEntity(intent.entities,'Taxi.PlaceName');
         var TaxiAddressEntity  = builder.EntityRecognizer.findEntity(intent.entities, 'Taxi.Address' );
        var TaxiDestinationAddressEntity  =builder.EntityRecognizer.findEntity(intent1.entities, 'Taxi.DestinationAddress' );
        var TaxiDestinationPlaceNameEntity=builder.EntityRecognizer.findEntity(intent1.entities,'Taxi.DestinationPlaceName');
        var TaxiPlaceTypeEntity=builder.EntityRecognizer.findEntity(intent1.entities,'Taxi.PlaceType');
        var message =[];
        
    
         if (TaxiAddressEntity) {
             session.send('Ok, finding your taxi to %s', TaxiAddressEntity.entity);
             var destination=TaxiAddressEntity.entity;
             next({ response: destination });
             // Put your code here for calling the IoT web service that turns on a device
         } if(TaxiDestinationAddressEntity){
             // Assuming turning on lights is the default
             session.send('we will get to you at %s',TaxiDestinationAddressEntity.entity);
             var location=TaxiDestinationAddressEntity.entity;
             next({ response: location });
             // Put your code here for calling the IoT web service that turns on a device
         }
         if(TaxiDestinationPlaceNameEntity){
            // Assuming turning on lights is the default
            session.send('Ok we will visit %s',TaxiDestinationPlaceNameEntity.entity);
            var destination=TaxiDestinationPlaceNameEntity.entity;
            next({ response: destination });
            // Put your code here for calling the IoT web service that turns on a device
        }
        if(TaxiPlaceNameEntity)
        {
            session.send('Ok we will pick u from %s',TaxiPlaceNameEntity.entity);
            var destination=TaxiPlaceNameEntity.entity;
            next({ response: destination });
        }
        if(TaxiPlaceTypeEntity)
        {
            session.send('Ok we will go to %s',TaxiPlaceTypeEntity.entity);
            if(TaxiPlaceTypeEntity.entity=='work')
            var location=TaxiPlaceTypeEntity.entity;
    
        }
          if(destination==0){
            // no entities detected, ask user for a destination
            console.log(typeof(builder.Prompts.text(session, 'Please enter your destination')));
    
            
        }
        if(location==0){
            
            // no entities detected, ask user for a destination
            console.log(typeof(builder.Prompts.text(session, 'Please enter your location')));
        }
    },
    function (session,results) {
        location=session.dialogData.location;
        destination=session.dialogData.destination;
         location= results.response;
        session.send(
            'Ok. Searching for cab from %s to %s...',
        location,destination)
        Store
            .searchcab(location, destination)
            .then(function (det) 
                {
                    // args
                    session.send('The map Data');
    
                    var message = new builder.Message()
                        .attachmentLayout(builder.AttachmentLayout.carousel)
                        .attachments(det.map(mapAsAttachment));
    
                    session.send(message);
    
                    // End
                    session.endDialog();
                });
            
        bot.dialog('Reserve', [
            function (session, args, next) {
            session.send("Do You Want to reserve");
            builder.Prompts.time(session, "Please provide a reservation date and time (e.g.: June 6th at 5pm)");
        },
        function (session, results) {
            session.dialogData.reservationDate = builder.EntityRecognizer.resolveTime([results.response]);
            builder.Prompts.number(session, "How many people are in ?");
        },
        function (session, results) {
            session.dialogData.partySize = results.response;
            builder.Prompts.text(session, "Whose name will this reservation be under?");
        },
        function (session, results) {
            session.dialogData.reservationName = results.response;
    
            // Process request and display reservation details
            session.send(`Reservation confirmed. Reservation details: <br/>Date/Time: ${session.dialogData.reservationDate} <br/>Party size: ${session.dialogData.partySize} <br/>Reservation name: ${session.dialogData.reservationName}`);
            session.endDialog();
             // book
           
        }
        ]).triggerAction({
            matches: [/bookHotels/i,/reserve first/i,/reserve/i,/book now/i,/get me a reservation/i,/book/i],
            onInterrupted: function (session) {
                session.send('Please provide a correct details');
            }
        }).cancelAction('cancelAction','Ok,reservation cancelled',{
            matches: [/cancel/i,/change/i,/stop/i,/quit/i],
            confirmPrompt:'Are you sure?'
        })
         session.endDialog();
     }
    
     ]).triggerAction({
     matches: 'Taxi.Book'
    }).reloadAction('startOver', 'Ok, starting over.', {
        matches: /^start over$/i
    });
    bot.dialog('askName', [
        function (session) {
            builder.Prompts.text(session, 'Hi! enter location?');
        },
        function (session, results) {
            session.endDialogWithResult(results);
        }
    ]);
    function mapAsAttachment(det) {
        return new builder.HeroCard()
            .title(det.journey)
            .subtitle('Distance:%s & Time:%s', det.info,det.info1)
            .images([new builder.CardImage().url(det.image)])
            .buttons([
                new builder.CardAction()
                    .title('Book A cab')
                    .type('openUrl')
                    .value('https://book.olacabs.com/'+encodeURIComponent(det.ola))
            
            
                ]);
    
        }
bot.dialog('ShowHotelsReviews', function (session, args) {
    // retrieve hotel name from matched entities
    var hotelEntity = builder.EntityRecognizer.findEntity(args.intent.entities, 'Hotel');
    if (hotelEntity) {
        session.send('We will find review of \'%s\'...', hotelEntity.entity);
        Store.searchHotelReviews(hotelEntity.entity)
            .then(function (reviews) {
                var message = new builder.Message()
                    .attachmentLayout(builder.AttachmentLayout.carousel)
                    .attachments(reviews.map(reviewAsAttachment));
                session.endDialog(message);
            });
    }
}).triggerAction({
    matches: 'ShowHotelsReviews'
});
bot.dialog('noreply', function (session) {
    session.send('This bot cant find such intents like \'%s\'...',session.message.text);

}).triggerAction({
    matches: 'noreply'
});


// Spell Check
if (process.env.IS_SPELL_CORRECTION_ENABLED === 'true') {
    bot.use({
        botbuilder: function (session, next) {
            spellService
                .getCorrectedText(session.message.text)
                .then(function (text) {
                    session.message.text = text;
                    next();
                })
                .catch(function (error) {
                    console.error(error);
                    next();
                });
        }
    });
}

// Helpers
function hotelAsAttachment(hotel) {
    return new builder.HeroCard()
        .title(hotel.name)
        .subtitle('%d stars. %d reviews. From $%d per night.', hotel.rating, hotel.numberOfReviews, hotel.priceStarting)
        .images([new builder.CardImage().url(hotel.image)])
        .buttons([
            new builder.CardAction()
                .title('More details')
                .type('openUrl')
                .value('https://www.tripadvisor.in/'+encodeURIComponent(hotel.name))
        
        
            ]);

}
function reviewAsAttachment(review) {
    return new builder.ThumbnailCard()
        .title(review.title)
        .text(review.text)
        .images([new builder.CardImage().url(review.image)]);
}

function mapAsAttachment(det) {
    return new builder.HeroCard()
        .title(det.journey)
        .subtitle('Distance:%s & Time:%s', det.info,det.info1)
        .images([new builder.CardImage().url(det.image)])
        .buttons([
            new builder.CardAction()
                .title('Book A cab')
                .type('openUrl')
                .value('https://book.olacabs.com/'+encodeURIComponent(det.ola))
        
        
            ]);

    }