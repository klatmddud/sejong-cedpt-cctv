// 관리자 로그인·로그아웃 직후 한 번: 상단 바의 알약 하나를 이전 화면 자리에서 새 자리로 옮긴다.
// 로그인이면 언어 버튼 알약이 지금 보고 있는 탭 표시가 되고, 로그아웃이면 그 탭 알약이 언어 버튼이 된다.
// 출발 자리는 서버가 .topbar-ghost에 이전 화면의 배치로 그려 둔다. 이 스크립트가 없으면 CSS만으로 제자리에서 흐려진다.
(() => {
	// 로고가 이전 화면 어디에 있었는지 남겨 둔다. 로고 출발 자리는 CSS(--brand-from)가 화면 폭으로 어림하지만,
	// 이전 화면에만 스크롤바가 있었으면 그 폭의 절반만큼 어긋나므로 다음 화면에서 이 값으로 다시 맞춘다
	const KEY = 'cctv-topbar-brand';
	const brandLeft = (brand) => {
		// 움직이는 중에도 원래 자리를 재도록 transform을 뺀 레이아웃 위치(offsetLeft)를 쓴다
		const parent = brand.offsetParent;
		return brand.offsetLeft + (parent ? parent.getBoundingClientRect().left : 0);
	};
	addEventListener('pagehide', () => {
		const brand = document.querySelector('.topbar .brand');
		try {
			if (brand) {
				sessionStorage.setItem(KEY, JSON.stringify({ x: brandLeft(brand), at: Date.now() }));
			}
		}
		catch (e) {
			// 저장소를 못 쓰면 CSS 어림값을 쓴다
		}
	});

	const bar = document.querySelector('.topbar.signed-in, .topbar.admin-signed-out');
	const ghost = bar && bar.querySelector('.topbar-ghost');
	if (!ghost || !ghost.animate || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
		return;
	}
	try {
		const saved = JSON.parse(sessionStorage.getItem(KEY) || 'null');
		const brand = bar.querySelector('.brand');
		if (saved && brand && Date.now() - saved.at < 10000) {
			bar.style.setProperty('--brand-from', (saved.x - brandLeft(brand)) + 'px');
		}
	}
	catch (e) {
		// 저장소를 못 쓰면 CSS 어림값을 쓴다
	}
	// 이 스크립트는 화면이 그려진 뒤에 늦게 도착할 수 있다(새 버전을 처음 받거나 서버가 막 떠서 느릴 때).
	// 그동안 CSS 쪽 움직임(로고 미끄러짐, 출발 알약 흐려지기, 탭 나타나기)은 이미 흘렀으므로,
	// CSS 로고 움직임이 흐른 시간만큼 JS 움직임도 앞당겨 박자를 맞춘다
	const brandMotion = (bar.querySelector('.brand')?.getAnimations() || [])[0];
	const late = brandMotion ? Math.max(0, Number(brandMotion.currentTime) || 0) : 0;
	if (late > 200) {
		// 너무 늦었으면 JS 움직임은 건너뛰고 끝난 모습으로 바로 맞춘다(출발 알약을 치우고 도착할 알약을 보인다)
		ghost.remove();
		for (const el of bar.querySelectorAll('nav a[aria-current], .lang-switch')) {
			el.style.animation = 'none';
		}
		return;
	}
	const played = [];
	const play = (el, keyframes, options) => {
		const motion = el.animate(keyframes, options);
		played.push(motion);
		return motion;
	};
	const catchUp = () => {
		for (const motion of played) {
			motion.currentTime = late;
		}
	};
	// 로고 옆 앱 이름: 이전 화면의 이름(data-brand-from)에서 새 이름으로 바꾼다.
	// 두 이름에 같이 있는 앞 단어(예: "CCTV ")는 그대로 두고, 그 뒤에서 같이 있는 가장 긴 글자 묶음(예: "동의")은
	// 이전 자리에서 새 자리로 미끄러진다. 나머지 글자만 흐려지거나 떠오른다(예: "촬영 " → "서 관리")
	const name = bar.querySelector('.brand-name');
	const prev = ghost.dataset.brandFrom;
	const now = name ? name.textContent.trim() : '';
	if (name && prev && prev !== now) {
		let same = 0;
		while (same < prev.length && same < now.length && prev[same] === now[same]) {
			same++;
		}
		const cut = now.slice(0, same).lastIndexOf(' ') + 1;
		const oldRest = prev.slice(cut);
		const newRest = now.slice(cut);
		let keep = { i: 0, j: 0, len: 0 };
		for (let x = 0; x < oldRest.length; x++) {
			for (let y = 0; y < newRest.length; y++) {
				let len = 0;
				while (x + len < oldRest.length && y + len < newRest.length && oldRest[x + len] === newRest[y + len]) {
					len++;
				}
				if (len > keep.len) {
					keep = { i: x, j: y, len };
				}
			}
		}
		const color = getComputedStyle(name).color;
		const seg = (text, cls) => {
			const span = document.createElement('span');
			span.className = cls;
			span.textContent = text;
			return span;
		};
		// 미끄러지는 묶음과 겹치지 않게, 사라질 글자는 먼저 빨리 흐리고 생길 글자는 묶음이 거의 도착한 뒤 띄운다
		const fadeOut = { duration: 150, easing: 'ease-out', fill: 'both' };
		const fadeIn = { duration: 250, delay: 250, easing: 'ease-out', fill: 'both' };
		name.textContent = now.slice(0, cut);
		name.style.position = 'relative';
		if (newRest.slice(keep.j, keep.j + keep.len).trim().length < 2) {
			// 같이 있는 글자 묶음이 없으면 뒷부분 전체를 서로 흐려지며 바꾼다
			const rest = seg(newRest, 'brand-name-rest');
			const old = seg(oldRest, 'brand-name-prev');
			old.style.color = color;
			name.append(rest, old);
			old.style.left = (rest.getBoundingClientRect().left - name.getBoundingClientRect().left) + 'px';
			play(old, [{ opacity: 1 }, { opacity: 0 }], fadeOut).finished.then(() => old.remove(), () => old.remove());
			play(rest, [{ opacity: 0 }, { opacity: 1 }], fadeIn);
		}
		else {
			// 새 이름 = 앞 단어 + 새로 생길 앞글자 + 같이 있는 묶음 + 새로 생길 뒷글자
			const before = seg(newRest.slice(0, keep.j), 'brand-seg');
			const kept = seg(newRest.slice(keep.j, keep.j + keep.len), 'brand-seg brand-seg-keep');
			const after = seg(newRest.slice(keep.j + keep.len), 'brand-seg');
			const gone = [seg(oldRest.slice(0, keep.i), 'brand-name-prev'), seg(oldRest.slice(keep.i + keep.len), 'brand-name-prev')];
			name.append(before, kept, after, ...gone);
			const nb = name.getBoundingClientRect();
			const bb = before.getBoundingClientRect();
			const kb = kept.getBoundingClientRect();
			// 묶음은 이전 이름에서 (사라질 앞글자 폭 - 생길 앞글자 폭)만큼 떨어진 자리에서 출발한다
			const dx = gone[0].getBoundingClientRect().width - bb.width;
			gone[0].style.left = (bb.left - nb.left) + 'px';
			gone[1].style.left = (kb.left - nb.left + dx + kb.width) + 'px';
			for (const el of gone) {
				el.style.color = color;
				play(el, [{ opacity: 1 }, { opacity: 0 }], fadeOut).finished.then(() => el.remove(), () => el.remove());
			}
			play(kept, [{ transform: 'translateX(' + dx + 'px)' }, { transform: 'none' }], { duration: 500, easing: 'cubic-bezier(0.3, 0.6, 0.3, 1)' });
			play(before, [{ opacity: 0 }, { opacity: 1 }], fadeIn);
			play(after, [{ opacity: 0 }, { opacity: 1 }], fadeIn);
		}
	}

	const toAdmin = bar.classList.contains('signed-in');
	const from = ghost.querySelector(toAdmin ? '.ghost-pill' : '.ghost-tab.current');
	const to = bar.querySelector(toAdmin ? 'nav a[aria-current]' : '.lang-switch');
	if (!from || !to) {
		catchUp();
		return;
	}
	// 로고(CSS의 brand-shift)와 같은 시간, 같은 가감속으로 움직여야 함께 움직이는 것처럼 보인다
	const duration = 500;
	const easing = 'cubic-bezier(0.3, 0.6, 0.3, 1)';
	const base = ghost.getBoundingClientRect();
	const a = from.getBoundingClientRect();
	const b = to.getBoundingClientRect();
	const start = getComputedStyle(from);
	const end = getComputedStyle(to);
	// 두께가 0인 테두리는 글자색으로 읽히므로 투명으로 본다
	const border = (cs) => (parseFloat(cs.borderTopWidth) > 0 ? cs.borderTopColor : 'transparent');
	const box = (r) => ({
		left: (r.left - base.left) + 'px',
		top: (r.top - base.top) + 'px',
		width: r.width + 'px',
		height: r.height + 'px'
	});

	// 날아가는 알약: 출발 알약과 도착 알약의 글자를 겹쳐 담고, 가는 동안 앞 글자에서 뒤 글자로 바꾼다
	const flight = document.createElement('span');
	flight.className = 'topbar-flight';
	Object.assign(flight.style, box(a));
	const layer = (el, cs) => {
		const span = document.createElement('span');
		span.className = 'topbar-flight-label';
		span.innerHTML = el.innerHTML;
		Object.assign(span.style, {
			color: cs.color,
			fontSize: cs.fontSize,
			fontWeight: cs.fontWeight,
			gap: cs.columnGap
		});
		flight.appendChild(span);
		return span;
	};
	const fromLabel = layer(from, start);
	const toLabel = layer(to, end);
	ghost.appendChild(flight);
	from.style.visibility = 'hidden';

	const move = play(flight, [
		{ ...box(a), backgroundColor: start.backgroundColor, borderColor: border(start) },
		{ ...box(b), backgroundColor: end.backgroundColor, borderColor: border(end) }
	], { duration, easing, fill: 'forwards' });
	play(fromLabel, [{ opacity: 1 }, { opacity: 0, offset: 0.45 }, { opacity: 0 }], { duration, fill: 'forwards' });
	play(toLabel, [{ opacity: 0 }, { opacity: 0, offset: 0.35 }, { opacity: 1, offset: 0.8 }, { opacity: 1 }], { duration, fill: 'forwards' });
	// 도착한 자리의 진짜 알약은 날아온 알약과 똑같으므로, 도착하는 순간 바로 바꾼다
	play(to, [{ opacity: 0 }, { opacity: 0 }], { duration, fill: 'backwards' });
	move.finished.then(() => flight.remove(), () => flight.remove());

	// 알약이 지나가는 길의 탭: 로그인이면 알약이 지나간 뒤 오른쪽 탭부터 나타나고,
	// 로그아웃이면 알약이 닿기 전에 먼저 사라진다
	const fromX = a.left + a.width / 2;
	const toX = b.left + b.width / 2;
	const others = toAdmin
		? Array.from(bar.querySelectorAll('nav > :not([aria-current])'))
		: Array.from(ghost.querySelectorAll('.ghost-tab:not(.current), .ghost-divider'));
	for (const el of others) {
		const r = el.getBoundingClientRect();
		const x = r.left + r.width / 2;
		// 알약이 이 탭 가운데를 지나는 진행률(0~1). 길 밖에 있으면 0
		const along = Math.min(1, Math.max(0, (x - fromX) / (toX - fromX)));
		el.style.animation = 'none';
		if (toAdmin) {
			play(el, [{ opacity: 0, transform: 'translateX(8px)' }, { opacity: 1, transform: 'none' }], {
				duration: 260, delay: 120 + along * duration * 0.6, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)', fill: 'backwards'
			});
		}
		else {
			play(el, [{ opacity: 1 }, { opacity: 0 }], {
				duration: 160, delay: Math.max(0, along * duration * 0.5 - 120), easing: 'ease-out', fill: 'forwards'
			});
		}
	}

	catchUp();
})();
