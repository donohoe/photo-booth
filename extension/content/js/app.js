var wow = new WOW({});
var app = {

	sources: {
		newyorker: {
			label: "The New Yorker",
			dek:   "Photo Booth",
			feed:  "newyorker.js",
			icon:  "newyorker.svg",
			link:  "https://www.newyorker.com/culture/photo-booth",
			subs:  "https://www.newyorker.com/subscribe"
		},
		nytimes: {
			label: "The New York Times",
			dek:   "Lens",
			feed:  "nytimes.js",
			icon:  "nytimes.svg",
			link:  "https://lens.blogs.nytimes.com",
			subs:  "https://www.nytimes.com/subscription/multiproduct/lp8XKUR.html"
		},
		natgeo: {
			label: "National Geographic",
			dek:   "Photo of the Day",
			feed:  "nationalgeographic.js",
			icon:  "nationalgeographic.svg",
			link:  "https://www.nationalgeographic.com/photography/photo-of-the-day/",
			subs:  "https://www.nationalgeographic.com/subscribe/magazines/"
		},
	},

	run: function() {
		console.log("Photobooth (Chrome browser extension)");
		this.setup();
		if (window.navigator.onLine) {
			this.requestData();
		} else {
			setTimeout(function() {
				app.haiku();
				document.body.className = "offline";
			}, 10);
		}
	},

	setup: function() {
		this.currentSource  = this.getSource();
		this.allowedSources = Object.keys(app.sources);
		this.setupDropDown();
		this.setupFooter();
	},

	setupFooter: function() {
		var html = "";
		var len = this.allowedSources.length;
		for (var i=0; i<len; i++) {
			var k = this.allowedSources[i];
			var label = this.sources[k].label;
			var dek   = this.sources[k].dek;
			var link  = this.sources[k].link;
			var subs  = this.sources[k].subs;
			html += "<div><a href=\"" + link + "\">" + label + ": " + dek + "</a> <a class=\"subs\" href=\"" + subs + "\">Subscribe</a></div>";
		}
		document.getElementById("footer-links").innerHTML = html;
	},

	updateModifiedDate: function(data) {
		if (data.status) {
			var monthNames = [
				"January", "February", "March", "April", "May", "June",
				"July", "August", "September", "October", "November", "December"
			];

			var d = new Date(data.status.updated);
			var updated = 'm d Y'
				.replace('Y', d.getFullYear())
				.replace('m', monthNames[d.getMonth()])
				.replace('d', d.getDate());

			var h = "Updated: " + updated;
			h += "&nbsp;<a href='https://github.com/donohoe/photo-booth/issues'>Report a problem</a>"
			document.getElementById("version").innerHTML = h;
		}
	},

	updateSourceLabel: function(){
		var el = document.getElementById("source-name");
		el.innerHTML = this.sources[this.currentSource].label;
		if (el.className === "") {
			el.className = "show";
		}
	},

	setupDropDown: function() {
		var that = this;
		var html = "";
		var el = document.getElementById("dd");

		var len = this.allowedSources.length;
		for (var i=0; i<len; i++) {
			var k = this.allowedSources[i];
			var l = this.sources[ k ].label;
			html += "<li data-source=\"" + k + "\" data-label=\"" + l + "\"><a href=\"#\"><i class=\"icon icon-" + k + "\"></i>" + l + "</a></li>";
		}
		document.getElementById("source-list").innerHTML = html;

		el.addEventListener('click', function() {
			if (this.className.indexOf("active") > -1) {
				this.className = this.className.replace("active", "").trim();
			} else {
				this.className += " active";
			}
			return false;
		});

		var opts = el.querySelectorAll('ul > li');
		var len = opts.length;
		for (var i=0; i<len; i++) {
			opts[i].addEventListener('click', function() {
				var chosenSource = this.getAttribute("data-source");
				if (chosenSource !== that.currentSource) {
					that.setSource(chosenSource);
					that.requestData();
				}
				return false;
			});
		}
	},

	buildTheDamnThing: function(data) {
		var items = data.response || false;
		if (items) {

			var html = "";
			var realWidth = window.innerWidth;
			var numPerRow = parseInt(realWidth / 250, 10);
			var w = parseInt((realWidth / numPerRow), 10) + "px";
			var h = w;

			var tmp1 = items.slice(0, 4); // Preserve the order of the first few items...
			tmp1.sort(function() {
				return .5 - Math.random();
			});

			var tmp2 = items.slice(4); // but lets randomize the rest for a nice sense of freshness & discovery
			tmp2.sort(function() {
				return .5 - Math.random();
			});

			var len1 = tmp1.length;
			for (var i=0; i<len1; i++) {
				html += this.buildItem(tmp1[i], w, h);
			}

			var len2 = tmp2.length;
			for (var j=0; j<len2; j++) {
				html += this.buildItem(tmp2[j], w, h);
			}

			document.getElementById("content").innerHTML = html;
			this.loadImages();

			wow.init();
			window.scrollTo(0, 1);

			document.body.className = "loaded";
			this.addEvents();
			this.updateSourceLabel();
			this.updateModifiedDate(data);
		}
	},

	loadImages: function() {
		var imgs = document.querySelectorAll('a.link img');
		var len = imgs.length;
		for (var i=0; i<len; i++) {
			var img = imgs[i];
			var src = img.getAttribute("data-src");

			var image = new Image();
			image.id = i;
			image.addEventListener('load', function() { 
				if (this.naturalHeight > this.naturalWidth) {
					imgs[this.id].className = "vertical";
				}
				imgs[this.id].src = imgs[this.id].getAttribute("data-src");
			}, false);

			image.src = src;
		}
	},

	buildItem: function(item, w, h) {
		var duration = this.randomIntFromInterval(500, 3000) + "ms";
		var offset = this.randomIntFromInterval(10, 160);
		var effect = this.randomEffect();
		return [
			'<a data-wow-offset="' + offset + '" data-wow-duration="' + duration + '" class="wow link ' + effect + '" href="' + item.link + '" target="_blank" style="width: '+ w +'; height: '+ h +';">',
			'<img class="' + item.orientation + '" data-src="' + item.image + '" style="min-width: ' + w + 'px;" data-title="' + item.title + '">',
			'</a>'
		].join("");
	},

	addEvents: function() {
		if (this.eventsAdded) {
			return;
		}
		var self = this;
		self.eventsAdded = true;

		window.addEventListener('resize', function(event) {
			var realWidth = window.innerWidth;
			var numPerRow = parseInt(realWidth / 250, 10);
			var w = parseInt((realWidth / numPerRow), 10) + "px";
			var links = document.querySelectorAll("a.link");
			var len = links.length;
			for (var i=0; i<len; i++) {
				links[i].style.width  = w;
				links[i].style.height = w;
			}
		});

		setTimeout(function() {
			document.getElementById("footer").style.opacity = 1;
		}, 2201); // If you deviate from 2201 then kittens die
	},

	randomEffect: function() {
		var effects = [ 'fadeIn', 'fadeInUp', 'fadeInLeft', 'fadeInRight' ];
		return effects[Math.floor(Math.random() * effects.length)];
	},

	randomIntFromInterval: function (min,max) {
		return Math.floor(Math.random()*(max-min+1)+min);
	},

	requestData: function() {

		var responseText = this.getFromCache();
		if (responseText) {
			this.buildTheDamnThing(JSON.parse(responseText));
			return;
		}

		var self = this;
		var xmlhttp = new XMLHttpRequest();
		xmlhttp.onreadystatechange = function() {
			if (xmlhttp.readyState == 4 ) {
				if(xmlhttp.status == 200 && xmlhttp.responseText.length > 99) {
					self.saveToCache(xmlhttp.responseText);
					var json = JSON.parse(xmlhttp.responseText);
					self.buildTheDamnThing(json);
					return;
				}
			}
		}

		var feed = this.sources[this.currentSource].feed || false;
		if (feed) {
		//	A seperate service pulls data and drops it as JSON. Source must be on HTTPS and declared in the manifest.
			xmlhttp.open("GET", "https://donohoe.io/project/feeds/photo-booth/" + feed, true);
			xmlhttp.send();
		}
	},

	getSource: function() {
		return localStorage.getItem("photobooth-source") || "newyorker";
	},

	setSource: function(source) {
		if (this.allowedSources.indexOf(source) > -1) {
			localStorage.setItem("photobooth-source", source);
			this.currentSource = source;
		}
	},

	getFromCache: function() {
		var key = "photobooth-data-" + this.currentSource;
		var data = JSON.parse(localStorage.getItem(key)) || false;
		if (!data) {
			return false;
		}
		var expiration = data.expiration;
		var now = new Date().getTime();
		if (now > expiration) {
			return false;
		}
		return data.responseText || false;
	},

	saveToCache: function(response) {
		var key = "photobooth-data-" + this.currentSource;
		localStorage.setItem(key, JSON.stringify({
			expiration: new Date().getTime() + 6 * 60 * 60 * 1000, // 6 hours
			responseText: response
		}));
	},

	haiku: function() {
		var hs = [
			"when you talk to me // time is no longer lonely // night seems like a day",
			"you’re an awesome friend // a sister to me as well // two-in-one god’s gift",
			"your knowledge and skills // always unselfishly shared // your praise: mind tonic",
			"my inspiration // in all my writing passions // you have touched my life",
			"moments that we have // be kept in my treasure box // i thank you so much",
			"may our friendship lasts // as i keep you in my heart // forever you’re loved",
			"sharing is friendship. // moon and sun are best of friends. // they take turns to shine",
			"explosion of light // pooled the bay with reds and gold // catching fishermen",
			"Falcon at light speed // wit banter swagger shoot first // carbonite classic",
			"We are no strangers // Never gonna give you up // Ain't gonna let go",
			"C-Beams in the dark // Ships burning near Orion // Lost like tears in rain",
			"A world with two suns // You'd think they'd have two shadows // What's up, Tatooine?",
			"If time is money // Are ATMs time machines? // our mind has been blown",
			"1981 // I'm into Space Invaders // 2600",
			"This tiny haiku // is just sixty characters // ideal for Twitter.",
			"When I read haiku, // I hear it in the voice of // William Shatner."
		];
		var el = document.getElementById("offline");
		var h = hs[Math.floor(Math.random()*hs.length)];
		h = h.replace(/ \/\/ /g, ' <br/> ');
		el.innerHTML = h;
		el.style.display = "block";
	}
};

app.run();
