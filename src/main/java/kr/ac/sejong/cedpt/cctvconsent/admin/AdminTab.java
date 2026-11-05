package kr.ac.sejong.cedpt.cctvconsent.admin;

import java.util.List;

/**
 * 관리자 상단 바의 탭. 상단 바(admin/fragments.html), 관리자가 로그아웃한 뒤 로그인 화면에 그리는 상단 바 고스트
 * (student/fragments.html), 로그아웃 폼이 넘기는 탭 값 확인(SecurityConfig)이 이 목록 하나를 같이 쓴다.
 * 화면에는 {@link AdminTabsAdvice}가 모델 속성 adminTabs로 넘긴다.
 *
 * @param id 각 화면이 nav(active)로 넘기는 값
 * @param label 탭 글자
 * @param path 탭 주소
 */
public record AdminTab(String id, String label, String path) {

	public static final List<AdminTab> ALL = List.of(
			new AdminTab("dashboard", "학기 현황", "/admin"),
			new AdminTab("roster", "명부 업로드", "/admin/roster"),
			new AdminTab("login-locks", "로그인 제한", "/admin/login-locks"));

	static boolean isKnown(String id) {
		return ALL.stream().anyMatch(tab -> tab.id.equals(id));
	}

}
