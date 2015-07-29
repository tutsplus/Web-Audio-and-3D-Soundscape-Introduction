//
// Web Audio and 3D Soundscapes: Introduction
// http://webdesign.tutsplus.com/tutorials/web-audio-and-3d-soundscapes-introduction--cms-22650
//
(function(){
	var canvas = document.getElementById("canvas")
	var status = document.getElementById("status")

	function setStatus(text) {
		status.innerHTML = String(text)
	}

	// Make sure Web Audio is available.
	if (window.AudioContext === undefined) {
		setStatus("Sorry, your internet browser cannot run this demo")
		return
	}

	// Grab the canvas context.
	var canvasContext = canvas.getContext("2d")

	var imagePaths = [
		"res/node.png"
	]
	var imageBitmaps = []
	var imagePointer = 0

	var audioPaths = [
		"res/snd-01.ogg",
		"res/snd-02.ogg",
		"res/snd-03.ogg"
	]
	var audioBuffers = []
	var audioRequest = new XMLHttpRequest()
	var audioPointer = 0
	var audioContext = new AudioContext()
	var audioGain = audioContext.createGain()

	// The demo will be muted initially.
	audioGain.gain.value = 0.0
	
	// Connect the gain node to the destination (output) node.
	// DemoNode objects connect to the gain node.
	audioGain.connect(audioContext.destination)
	
	// Point the listener in the correct direction.
	audioContext.listener.setOrientation(0, 1, 0, 0, 0, 1)

	// DemoNode objects represent the rotating sounds/bitmaps.
	function DemoNode() {
		this.x = 0.0
		this.y = 0.0
		this.position = 0.0
		this.rotation = 0.0
		this.rotationSpeed = 0.0
		this.bitmap = null // Image
		this.buffer = null // AudioBufferSourceNode
		this.panner = null // PannerNode
	}

	DemoNode.prototype.updatePosition = function() {
		// We only need a 2D position for this demo.
		this.x = this.position * Math.cos(this.rotation)
		this.y = this.position * Math.sin(this.rotation)

		this.rotation += this.rotationSpeed

		// Position the sound in 3D space.
		this.panner.setPosition(this.x, this.y, 0)
	}

	var demoNodes = []
	var demoMuted = true

	function load() {
		loadImage()
	}

	function whenLoaded() {
		var i = 0
		var n = audioBuffers.length

		while (i < n) {
			var node = new DemoNode()

			node.bitmap = imageBitmaps[0]

			node.source = audioContext.createBufferSource()
			node.panner = audioContext.createPanner()
			
			node.source.buffer = audioBuffers[i]
			node.source.loop = true

			node.panner.panningModel = "HRTF"
			node.panner.distanceModel = "linear"

			node.source.connect(node.panner)
			node.panner.connect(audioGain)

			// Start the sound now.
			node.source.start()

			node.position = 50 + (i * 50)
			node.rotationSpeed = (Math.PI / 180) * (i + 0.5)

			demoNodes.push(node)
			i++
		}
		
		setStatus("Click to unmute the audio")

		window.addEventListener("click", whenMouseClicked)
		window.requestAnimationFrame(update)
	}

	function loadImage() {
		if (imagePointer >= imagePaths.length) {
			loadAudio()
			return
		}
		
		var image = new Image()
		image.src = imagePaths[imagePointer]
		image.onload = whenImageLoaded

		imagePointer++
	}

	function whenImageLoaded(event) {
		imageBitmaps.push(event.currentTarget)
		loadImage()
	}

	function loadAudio() {
		if (audioPointer >= audioPaths.length) {
			whenLoaded()
			return
		}

		audioRequest.open("GET", audioPaths[audioPointer])
		audioRequest.responseType = "arraybuffer"
		audioRequest.onload = whenAudioLoaded
		audioRequest.send()

		audioPointer++
	}

	function whenAudioLoaded(event) {
		var data = audioRequest.response

		if (data === null) {
			setStatus("Failed to load resources")
			return
		}

		// Reset the XMLHttpRequest object.
		audioRequest.abort()

		// Decode the loaded audio file.
		audioContext.decodeAudioData(data, whenAudioDecoded)
	}

	function whenAudioDecoded(buffer) {
		audioBuffers.push(buffer)
		loadAudio()
	}

	function whenMouseClicked(event) {
		var value
		
		if (demoMuted) {
			value = 1.0
			demoMuted = false
			setStatus("Click to mute the audio")
		} else {
			value = 0.0
			demoMuted = true
			setStatus("Click to unmute the audio")
		}

		var time = audioContext.currentTime
		
		// Fade the volume for one second.
		audioGain.gain.cancelScheduledValues(0)
		audioGain.gain.setTargetAtTime(audioGain.gain.value, time, 0)
		audioGain.gain.linearRampToValueAtTime(value, time + 1.0)
	}

	function update(t) {
		window.requestAnimationFrame(update)

		var w = canvas.width
		var h = canvas.height
		
		canvasContext.clearRect(0, 0, w, h)

		var i = 0
		var n = demoNodes.length
		var x = 0
		var y = 0
		var o = null

		while (i < n) {
			o = demoNodes[i]
			
			o.updatePosition()

			x = (w * 0.5) + o.x - (o.bitmap.width * 0.5)
			y = (h * 0.5) - o.y - (o.bitmap.height * 0.5)

			canvasContext.drawImage(o.bitmap, x|0, y|0)
			i++
		}
	}
	
	function cancelEvent(event) {
		event.preventDefault()
	}

	window.addEventListener("selectstart", cancelEvent)
	window.addEventListener("contextmenu", cancelEvent)

	load()
})()
