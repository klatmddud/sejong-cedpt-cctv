// 화면 전환은 언어 선택과 로그인 화면 사이에서만 켠다(student/fragments.html의 pageTransition).
// 그 밖의 화면으로 넘어가면 그쪽은 전환을 켜지 않아 브라우저가 전환을 중간에 그만두며 콘솔에 오류를 남긴다.
// 떠나는 화면에서 미리 전환을 건너뛰고, 건너뛰거나 그만둘 때 생기는 거절(promise rejection)은 조용히 받는다.
(() => {
	// 두 화면 주소는 서버가 이 스크립트 태그에 적어 준다(data-home, data-login). 하위 경로(context path)에 배포해도 맞는다.
	// 세션 ID가 주소에 붙는 경우(;jsessionid=…)를 대비해 ';' 뒤는 떼고 비교한다
	const pathOf = (url) => url.split(/[?#;]/)[0];
	const script = document.currentScript;
	const keep = new Set([
		pathOf(new URL((script && script.dataset.home) || '/', location.href).pathname),
		pathOf(new URL((script && script.dataset.login) || '/login', location.href).pathname)
	]);

	addEventListener('pageswap', (event) => {
		const transition = event.viewTransition;
		if (!transition) {
			return;
		}
		const quiet = () => {};
		transition.ready.catch(quiet);
		transition.finished.catch(quiet);
		transition.updateCallbackDone.catch(quiet);
		const url = event.activation && event.activation.entry && event.activation.entry.url;
		const path = url ? pathOf(new URL(url).pathname) : null;
		if (!keep.has(path)) {
			transition.skipTransition();
		}
	});
})();
