<?php
/*
	Photo Booth Feed

	Pull in inline JSON varaible from various pages:
	* https://www.newyorker.com/culture/photo-booth/page/1
	* https://www.newyorker.com/culture/photo-booth/page/n

	Parses the data, and pubishes a reuced feed of about 50 items
	* https://donohoe.io/project/feeds/photo-booth/feed.js

	Relies on CRON to run daily. Example:
	  00 00 * * * wget -q -O /dev/null http://example.com/build-newyorker-photobooth.php
*/

date_default_timezone_set("America/New_York");
header('Content-Type: application/json; charset=utf-8');
header("X-Clacks-Overhead: GNU Terry Pratchett");
include_once ("./lib/phpQuery/phpQuery.php");

class Feed {

	public $version = "0.0.1";

	public function __construct() {
		$this->response = array();
		$this->limit    = 10;
		$this->fileName = "feed-newyorker-photobooth.js";
	}

	function Run() {

		$data = array(
			"status" => array(
				"code"    => 200,
				"message" => "ok",
				"haiku"   => "No haiku for you",
				"key"     => "",
				"updated" => date('r'),
				"debug"   => array(),
				"version" => $this->version
			),
			"response" => array()
		);

		for ($i=1; $i<=$this->limit; $i++) {
			$url    = "https://www.newyorker.com/culture/photo-booth/page/" . $i;
			$result = $this->getItems($url);
		}

		$data["response"] = $this->response;

		$json = json_encode($data, JSON_PRETTY_PRINT);
		file_put_contents($this->fileName, $json);
		file_put_contents("feed.js", $json); // Old, but actively used

		return $json;
	}

	function getItems($url) {
		$item = array();
		$html = file_get_contents($url);
		phpQuery::newDocument($html, $contentType = null);

		$scriptText = "";
		foreach(pq('script') as $script) {
			$textContent = $script->textContent;
			if ($this->startsWith( $textContent, "window.__TNY__.INITIAL_STATE" )) {
				$scriptText = trim (str_replace( "window.__TNY__.INITIAL_STATE =", "", $textContent ));
				$scriptText = substr($scriptText, 0, -1);
				$item = $this->filterItemData( $scriptText );
				break;
			}
		}
	}

	function filterItemData($data) {

		$data = json_decode($data, true);
		$result = array();

		if (isset($data['primary'])) {
			if (isset($data['primary']['items'])) {

				$items = $data['primary']['items'];

				foreach ($items as $item) {

					$photo = $item["photo"];
					$image = $photo["aspectRatios"]["2:2"];

					$image = implode("", array(
						"https://media.newyorker.com/photos/",
						$photo["id"],
						"/2:2/w_344,c_limit/",
						$photo["filename"]
					));

					$this->response[] = array(
						"title"     => $item["hed"],
						"link"      => "https://www.newyorker.com" . $item["url"],
						"caption"   => $photo["caption"],
						"credit"    => $photo["credit"],
						"image"     => $image
					);
				}
			}
		}
	}

/*	UTF-8 and Encoding voodoo goes here... */

	function file_get_contents_utf8($url) {
		$content = file_get_contents($url);
		$content = mb_convert_encoding($content, "HTML-ENTITIES", 'UTF-8');
		return $content;
	}

	private function response_200() {
		$msgs = array(
			"Falcon at light speed / wit banter swagger shoot first/ carbonite classic",
			"We are no strangers / Never gonna give you up / Ain't gonna let go",
			"C-Beams in the dark / Ships burning near Orion / Lost like tears in rain",
			"A world with two suns / You'd think they'd have two shadows / What's up, Tatooine?",
			"If time is money / Are ATMs time machines? / our mind has been blown",
			"1981 / I'm into Space Invaders / 2600",
			"This tiny haiku / is just sixty characters / ideal for Twitter.",
			"When I read haiku, / I hear it in the voice of / William Shatner."
		);
		return $msgs[array_rand($msgs, 1)];
	}

/*
	Utilities
	http://stackoverflow.com/a/17852480/24224
*/

	function truncate($str, $width) {
		return strtok(wordwrap($str, $width, "&hellip;\n"), "\n");
	}

	private function startsWith($haystack, $needle) {
		if (!is_string($haystack)) { return false; }
		return $needle === "" || strrpos($haystack, $needle, -strlen($haystack)) !== FALSE;
	}

	private function endsWith($haystack, $needle) {
		if (!is_string($haystack)) { return false; }
		return $needle === "" || (($temp = strlen($haystack) - strlen($needle)) >= 0 && strpos($haystack, $needle, $temp) !== FALSE);
	}
}

$feed     = new Feed;
$response = $feed->Run();

print $response;
