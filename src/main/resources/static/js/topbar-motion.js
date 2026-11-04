// 관리자 로그인·로그아웃 직후 한 번: 상단 바의 알약 하나를 이전 화면 자리에서 새 자리로 옮긴다.
// 로그인이면 언어 버튼 알약이 지금 보고 있는 탭 표시가 되고, 로그아웃이면 그 탭 알약이 언어 버튼이 된다.
// 출발 자리는 서버가 .topbar-ghost에 이전 화면의 배치로 그려 둔다. 이 스크립트가 없으면 CSS만으로 제자리에서 흐려진다.
(() => {
	const bar = document.querySelector('.topbar.signed-in, .topbar.admin-signed-out');
	const ghost = bar && bar.querySelector('.topbar-ghost');
	if (!ghost || !ghost.animate || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
		return;
	}
	const toAdmin = bar.classList.contains('signed-in');
	const from = ghost.querySelector(toAdmin ? '.ghost-pill' : '.ghost-tab.current');
	const to = bar.querySelector(toAdmin ? 'nav a[aria-current]' : '.lang-switch');
	if (!from || !to) {
		return;
	}
	const base = ghost.getBoundingClientRect();
	const a = from.getBoundingClientRect();
	const b = to.getBoundingClientRect();
	const start = getComputedStyle(from);
	const end = getComputedStyle(to);
	const box = (r) => ({
		left: (r.left - base.left) + 'px',
		top: (r.top - base.top) + 'px',
		width: r.width + 'px',
		height: r.height + 'px'
	});
	// 두께가 0인 테두리는 글자색으로 읽히므로 투명으로 본다
	const border = (cs) => (parseFloat(cs.borderTopWidth) > 0 ? cs.borderTopColor : 'transparent');
	const duration = 450;
	const easing = 'cubic-bezier(0.2, 0.8, 0.2, 1)';

	// 같은 폭의 빈자리를 남기고 배치에서 꺼내 옮긴다(옆 탭이 당겨지지 않게). CSS의 흐려지기는 끈다
	const spacer = document.createElement('span');
	spacer.style.cssText = 'flex: none; width: ' + a.width + 'px; height: ' + a.height + 'px';
	from.before(spacer);
	from.style.animation = 'none';
	Object.assign(from.style, { position: 'absolute', margin: '0', boxSizing: 'border-box' }, box(a));
	const flight = from.animate([
		{ ...box(a), backgroundColor: start.backgroundColor, borderColor: border(start) },
		{ ...box(b), backgroundColor: end.backgroundColor, borderColor: border(end) }
	], { duration, easing, fill: 'forwards' });
	// 알약 안의 글자는 먼저 흐려지고, 도착한 자리의 글자가 마지막에 나타난다
	for (const label of from.children) {
		label.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150, fill: 'forwards' });
	}
	to.animate([{ opacity: 0 }, { opacity: 0, offset: 0.7 }, { opacity: 1 }], { duration: duration + 120, fill: 'backwards' });
	flight.finished.then(() => from.remove(), () => from.remove());
})();
