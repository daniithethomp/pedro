const pedroImage = document.getElementById("pedro-image");

if (pedroImage) {
	const originalSrc = pedroImage.src;
	const brushedSrc = new URL("./pedro2.png", window.location.href).href;
	let hoverTimer = null;
	let idleResetTimer = null;
	let didChangeDuringHover = false;
	let isHovering = false;
	let activePointerId = null;
	let animationFrame = null;
	let particles = [];
	let lastPointer = null;
	let isPointerMoving = false;
	let particleCanvas = null;
	let particleContext = null;

	const brushCursorSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><rect x="14" y="2" width="4" height="15" rx="2" fill="#9c6a3a"/><rect x="12" y="15" width="8" height="7" rx="2" fill="#6a4b2f"/><rect x="9" y="21" width="14" height="5" rx="2" fill="#d3b48a"/><path d="M10 26v4M12 26v4M14 26v4M16 26v4M18 26v4M20 26v4M22 26v4" stroke="#3a2a1a" stroke-width="1" stroke-linecap="round"/></svg>`;
	const brushCursorUrl = `url("data:image/svg+xml;utf8,${encodeURIComponent(brushCursorSvg)}") 2 28, auto`;

	pedroImage.style.cursor = "default";

	function ensureParticleCanvas() {
		if (particleCanvas && particleContext) {
			return;
		}

		const wrapper = document.createElement("div");
		wrapper.style.position = "relative";
		wrapper.style.display = "inline-block";

		pedroImage.parentNode.insertBefore(wrapper, pedroImage);
		wrapper.appendChild(pedroImage);

		particleCanvas = document.createElement("canvas");
		particleCanvas.style.position = "absolute";
		particleCanvas.style.inset = "0";
		particleCanvas.style.width = "100%";
		particleCanvas.style.height = "100%";
		particleCanvas.style.pointerEvents = "none";
		wrapper.appendChild(particleCanvas);

		particleContext = particleCanvas.getContext("2d");
		resizeParticleCanvas();
		window.addEventListener("resize", resizeParticleCanvas);
	}

	function resizeParticleCanvas() {
		if (!particleCanvas || !particleContext) {
			return;
		}

		const bounds = pedroImage.getBoundingClientRect();
		const dpr = window.devicePixelRatio || 1;
		particleCanvas.width = Math.max(1, Math.floor(bounds.width * dpr));
		particleCanvas.height = Math.max(1, Math.floor(bounds.height * dpr));
		particleContext.setTransform(dpr, 0, 0, dpr, 0, 0);
	}

	function createHairParticle(originX, originY) {
		const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.1;
		const speed = 0.4 + Math.random() * 1.4;
		return {
			x: originX + (Math.random() - 0.5) * 14,
			y: originY + (Math.random() - 0.5) * 14,
			vx: Math.cos(angle) * speed,
			vy: Math.sin(angle) * speed,
			length: 5 + Math.random() * 8,
			alpha: 0.55 + Math.random() * 0.35,
			spin: (Math.random() - 0.5) * 0.05
		};
	}

	function spawnHairParticles() {
		if (!lastPointer || !isPointerMoving) {
			return;
		}

		for (let i = 0; i < 4; i += 1) {
			particles.push(createHairParticle(lastPointer.x, lastPointer.y));
		}

		isPointerMoving = false;

		if (particles.length > 350) {
			particles = particles.slice(particles.length - 350);
		}
	}

	function animateHair() {
		if (!particleCanvas || !particleContext) {
			return;
		}

		const width = particleCanvas.width / (window.devicePixelRatio || 1);
		const height = particleCanvas.height / (window.devicePixelRatio || 1);
		particleContext.clearRect(0, 0, width, height);

		spawnHairParticles();

		particles = particles.filter((particle) => {
			particle.x += particle.vx;
			particle.y += particle.vy;
			particle.vx += (Math.random() - 0.5) * 0.04;
			particle.vy -= 0.007;
			particle.vx *= 0.985;
			particle.vy *= 0.99;
			particle.alpha -= 0.006;
			particle.length += particle.spin;

			if (particle.alpha <= 0) {
				return false;
			}

			particleContext.globalAlpha = Math.max(0, particle.alpha);
			particleContext.strokeStyle = "#a6a6a6";
			particleContext.lineWidth = 1;
			particleContext.beginPath();
			particleContext.moveTo(particle.x, particle.y);
			particleContext.lineTo(particle.x - particle.vx * particle.length, particle.y - particle.vy * particle.length);
			particleContext.stroke();
			return true;
		});

		particleContext.globalAlpha = 1;
		animationFrame = requestAnimationFrame(animateHair);
	}

	function startHairAnimation() {
		ensureParticleCanvas();
		resizeParticleCanvas();

		if (!animationFrame) {
			animationFrame = requestAnimationFrame(animateHair);
		}
	}

	function stopHairAnimation() {
		if (animationFrame) {
			cancelAnimationFrame(animationFrame);
			animationFrame = null;
		}

		particles = [];
		lastPointer = null;
		isPointerMoving = false;

		if (particleCanvas && particleContext) {
			const width = particleCanvas.width / (window.devicePixelRatio || 1);
			const height = particleCanvas.height / (window.devicePixelRatio || 1);
			particleContext.clearRect(0, 0, width, height);
		}
	}

	function updatePointer(event) {
		const rect = pedroImage.getBoundingClientRect();
		lastPointer = {
			x: event.clientX - rect.left,
			y: event.clientY - rect.top
		};
	}

	function resetToOriginalImage() {
		if (!didChangeDuringHover) {
			return;
		}

		pedroImage.src = originalSrc;
		didChangeDuringHover = false;
		clearTimeout(idleResetTimer);

		if (isHovering) {
			scheduleChange();
		}
	}

	function scheduleIdleReset() {
		clearTimeout(idleResetTimer);

		if (!didChangeDuringHover) {
			return;
		}

		const randomIdleDelay = Math.floor(Math.random() * 650) + 250;
		idleResetTimer = setTimeout(() => {
			resetToOriginalImage();
		}, randomIdleDelay);
	}

	function scheduleChange() {
		clearTimeout(hoverTimer);
		didChangeDuringHover = false;

		const randomDelay = Math.floor(Math.random() * 2500) + 500;

		hoverTimer = setTimeout(() => {
			if (didChangeDuringHover) {
				return;
			}

			pedroImage.src = brushedSrc;
			didChangeDuringHover = true;
			scheduleIdleReset();
		}, randomDelay);
	}

	function startInteraction(event, isTouchLike) {
		isHovering = true;

		if (!isTouchLike) {
			pedroImage.style.cursor = brushCursorUrl;
		}

		updatePointer(event);
		isPointerMoving = false;
		startHairAnimation();
		scheduleChange();
	}

	function moveInteraction(event) {
		if (!isHovering) {
			return;
		}

		updatePointer(event);
		isPointerMoving = true;
		scheduleIdleReset();
	}

	function endInteraction() {
		isHovering = false;
		clearTimeout(hoverTimer);
		clearTimeout(idleResetTimer);
		pedroImage.style.cursor = "default";
		stopHairAnimation();

		if (didChangeDuringHover) {
			pedroImage.src = originalSrc;
			didChangeDuringHover = false;
		}
	}

	pedroImage.addEventListener("pointerenter", (event) => {
		if (event.pointerType !== "mouse") {
			return;
		}

		startInteraction(event, false);
	});

	pedroImage.addEventListener("pointermove", (event) => {
		if (event.pointerType === "mouse") {
			moveInteraction(event);
			return;
		}

		if (event.pointerId !== activePointerId) {
			return;
		}

		event.preventDefault();
		moveInteraction(event);
	});

	pedroImage.addEventListener("pointerleave", (event) => {
		if (event.pointerType !== "mouse") {
			return;
		}

		endInteraction();
	});

	pedroImage.addEventListener("pointerdown", (event) => {
		if (event.pointerType === "mouse") {
			return;
		}

		activePointerId = event.pointerId;
		pedroImage.setPointerCapture(event.pointerId);
		event.preventDefault();
		startInteraction(event, true);
	});

	pedroImage.addEventListener("pointerup", (event) => {
		if (event.pointerId !== activePointerId) {
			return;
		}

		if (pedroImage.hasPointerCapture(event.pointerId)) {
			pedroImage.releasePointerCapture(event.pointerId);
		}

		activePointerId = null;
		endInteraction();
	});

	pedroImage.addEventListener("pointercancel", (event) => {
		if (event.pointerId !== activePointerId) {
			return;
		}

		if (pedroImage.hasPointerCapture(event.pointerId)) {
			pedroImage.releasePointerCapture(event.pointerId);
		}

		activePointerId = null;
		endInteraction();
	});

	pedroImage.addEventListener("lostpointercapture", (event) => {
		if (event.pointerId !== activePointerId) {
			return;
		}

		activePointerId = null;
		endInteraction();
	});
}
