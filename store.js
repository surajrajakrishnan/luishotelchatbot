


var Promise = require('bluebird');

    function getObjects(obj, key, val) {
        var objects = [];
        for (var i in obj) {
            if (!obj.hasOwnProperty(i)) continue;
            if (typeof obj[i] == 'object') {
                objects = objects.concat(getObjects(obj[i], key, val));    
            } else 
            //if key matches and value matches or if key matches and value is not passed (eliminating the case where key matches but passed value does not)
            if (i == key && obj[i] == val || i == key && val == '') { //
                objects.push(obj);
            } else if (obj[i] == val && key == ''){
                //only add if the object is not already in the array
                if (objects.lastIndexOf(obj) == -1){
                    objects.push(obj);
                }
            }
        }
        return objects;
    }
    var ReviewsOptions = [
        '“Very stylish, great stay, great staff”',
        '“good hotel awful meals”',
        '“Need more attention to little things”',
        '“Lovely small hotel ideally situated to explore the area.”',
        '“Positive surprise”',
        '“Beautiful suite and resort”'];
    
    
    //return an array of values that match on a certain key
    function getValues(obj, key) {
        var objects = [];
        for (var i in obj) {
            if (!obj.hasOwnProperty(i)) continue;
            if (typeof obj[i] == 'object') {
                objects = objects.concat(getValues(obj[i], key));
            } else if (i == key) {
                objects.push(obj[i]);
            }
        }
        return objects;
    }
    
    //return an array of keys that match on a certain value
    function getKeys(obj, val) {
        var objects = [];
        for (var i in obj) {
            if (!obj.hasOwnProperty(i)) continue;
            if (typeof obj[i] == 'object') {
                objects = objects.concat(getKeys(obj[i], val));
            } else if (obj[i] == val) {
                objects.push(i);
            }
        }
        return objects;
    }

module.exports = {
    searchHotelReviews: function (hotelName) {
        return new Promise(function (resolve) {

            // Filling the review results manually just for demo purposes
            var reviews = [];
            for (var i = 0; i < 5; i++) {
                reviews.push({
                    title: ReviewsOptions[Math.floor(Math.random() * ReviewsOptions.length)],
                    text: 'The discription of hotel',
                    image: 'https://upload.wikimedia.org/wikipedia/en/'
                });
            }

            // complete promise with a timer to simulate async response
            setTimeout(function () { resolve(reviews); }, 1000);
        });
},
    
    searchHotels: function (destination) {
        return new Promise(function (resolve) {
            var hotelname=[];
            var hotelimage=[];
            var hotels = [];
            var k;
            var request = require('request');
            request('https://maps.googleapis.com/maps/api/place/textsearch/json?query=hotels+in+' + encodeURIComponent(destination)+'&radius=6000&key=AIzaSyA_wWAux04WJDJDIZFcbIA3PgtnH_FdWaE', function (error, response, body) {
            if (!error && response.statusCode == 200) {
            // console.log(response.body); 
            console.log(typeof(response.body));   // Prints the JSON object
            var object = JSON.parse(response.body);
            console.log(typeof(object));   // Prints the JSON object                              
            var result = object["results"];
            hotelname=getValues(object,'name');
            hotelimage=getValues(object,'name');
            console.log(hotelname);
            console.log(hotelimage);
            k=hotelname[1];
            console.log(k); 
           
        }
    
  

    for (var i = 1; i <= 5; i++) {
        hotels.push({
            name:hotelname[i],
            location: destination,
            rating: Math.ceil(Math.random() * 5),
            numberOfReviews: Math.floor(Math.random() * 5000) + 1,
            priceStarting: Math.floor(Math.random() * 450) + 80,
            image: 'https://static.pexels.com/photos/6267/menu-restaurant-vintage-table.jpg'
        });
    }

            hotels.sort(function (a, b) { return a.priceStarting - b.priceStarting; });
                    // complete promise with a timer to simulate async response
            setTimeout(function () { resolve(hotels); }, 1000);
        });
    });  
    },
    searchHotelsspa: function (destination) {
        return new Promise(function (resolve) {
            var hotelname=[];
            var hotelimage=[];
            var hotels = [];
            var k;
            var request = require('request');
            request('https://maps.googleapis.com/maps/api/place/textsearch/json?query=hotels+spa+bar+in+' + encodeURIComponent(destination)+'&radius=6000&key=AIzaSyA_wWAux04WJDJDIZFcbIA3PgtnH_FdWaE', function (error, response, body) {
            if (!error && response.statusCode == 200) {
            // console.log(response.body); 
            console.log(typeof(response.body));   // Prints the JSON object
            var object = JSON.parse(response.body);
            console.log(typeof(object));   // Prints the JSON object                              
            var result = object["results"];
            hotelname=getValues(object,'name');
            hotelimage=getValues(object,'name');
            console.log(hotelname);
            console.log(hotelimage);
            k=hotelname[1];
            console.log(k); 
           
        }
    
  

    for (var i = 1; i <= 5; i++) {
        hotels.push({
            name:hotelname[i],
            location: destination,
            rating: Math.ceil(Math.random() * 5),
            numberOfReviews: Math.floor(Math.random() * 5000) + 1,
            priceStarting: Math.floor(Math.random() * 450) + 80,
            image: 'https://i.pinimg.com/originals/0d/fa/eb/0dfaeb38f9afa74cfcc996bf29cb5e54.jpg'
        });
    }

            hotels.sort(function (a, b) { return a.priceStarting - b.priceStarting; });
                    // complete promise with a timer to simulate async response
            setTimeout(function () { resolve(hotels); }, 1000);
        });
    });  
    },
    
    
    searchcab: function (location,destination) {
        return new Promise(function (resolve) {

            var det = [];
            var hotelname=[];
            var request = require('request');
            request('https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial&origins='+encodeURIComponent(location)+'&destinations='+encodeURIComponent(destination)+'&key=AIzaSyBEU0NQVtJKttc6LmOClVBPayZwF5VKBRs', function (error, response, body) {
            if (!error && response.statusCode == 200) {
            console.log(response.body); 
            console.log(typeof(response.body));   // Prints the JSON object
            var object = JSON.parse(response.body);
            console.log(typeof(object));   // Prints the JSON object                              
            hotelname=getValues(object,'text');
            console.log(hotelname);
            var miles=hotelname[1];
            var miles1=hotelname[0];
            console.log(miles);
            console.log(miles1);
                }
                det.push({
                    journey:location+' to '+destination,
                    info:miles,
                    info1:miles1,
                    ola:location,
                    image:'https://searchengineland.com/figz/wp-content/seloads/2015/10/google-maps2-fade-ss-1920.jpg'
                    
                });
            });
        setTimeout(function () { resolve(det); }, 1000);
        });
    }
}
