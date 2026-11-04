// 화면 전환은 언어 선택(/)과 로그인(/login) 사이에서만 켠다(student/fragments.html의 pageTransition).
// 그 밖의 화면으로 넘어가면 그쪽은 전환을 켜지 않아 브라우저가 전환을 중간에 그만두며 콘솔에 오류를 남긴다.
// 떠나는 화면에서 미리 전환을 건너뛰고, 건너뛰거나 그만둘 때 생기는 거절(promise rejection)은 조용히 받는다.
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
	const path = url ? new URL(url).pathname : null;
	if (path !== '/' && path !== '/login') {
		transition.skipTransition();
	}
});
