var wow = new WOW({});
var app = {

	run: function() {
		console.log("Photobooth - The New Yorker (Chrome brwoser extension)");
		if (window.navigator.onLine) {
			this.requestData();
		} else {
			setTimeout(function() {
				document.body.className = "offline";
			}, 10);
		}
	},

	buildTheDamnThing: function(data) {
		var items = data.response || false;
		if (items) {

			this.scrollBarWidth = this.measureScrollBar();

			var html = "";
			var realWidth = (window.innerWidth - this.scrollBarWidth);
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

			document.body.className = "loaded";
			this.addEvents();
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
				'<img class="' + item.orientation + '" data-src="' + item.image + '" style="min-width: ' + w + 'px;" title="' + item.title + '">',
			'</a>'
		].join("");
	},

	addEvents: function() {
		var self = this;
		window.addEventListener('resize', function(event) {
			var realWidth = (window.innerWidth - self.scrollBarWidth);
			var numPerRow = parseInt(realWidth / 250, 10);
			var w = parseInt((realWidth / numPerRow), 10) + "px";
			var links = document.querySelectorAll("a.link");
			var len = links.length;
			for (var i=0; i<len; i++) {
				links[i].style.width  = w;
				links[i].style.height = w;
			}
		});

		var contentHeight = document.getElementById("content").offsetHeight;
		window.onscroll = function (event) {
			var scrollPosition = window.pageYOffset;
			if (window.pageYOffset % 15 == 0) {
				if (contentHeight - scrollPosition < 803) {
					document.getElementById("button").className = "bottom";
				} else {
					document.getElementById("button").className = "";
				}
			}
		}

		setTimeout(function() {
			document.getElementById("footer").style.display = "block";
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

	//	A seperate service pulls data and drops it as JSON. Source must be on HTTPS and declared in the manifest.
		xmlhttp.open("GET", "https://donohoe.io/project/feeds/photo-booth/feed.js", true);
		xmlhttp.send();
	},

	getFromCache: function() {
		var data = JSON.parse(localStorage.getItem("photobooth-data")) || false;
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
		localStorage.setItem("photobooth-data", JSON.stringify({
			expiration: new Date().getTime() + 6 * 60 * 60 * 1000, // 6 hours
			responseText: response
		}));
	},

	measureScrollBar: function() {
		var scrollDiv = document.createElement("div");
		scrollDiv.className = "scrollbar-measure";
		document.body.appendChild(scrollDiv);
		var scrollBarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;
		document.body.removeChild(scrollDiv);
		return scrollBarWidth || 15;
	}
};

app.run();
