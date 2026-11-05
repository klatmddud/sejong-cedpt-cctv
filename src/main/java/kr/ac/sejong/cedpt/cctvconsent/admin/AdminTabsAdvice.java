package kr.ac.sejong.cedpt.cctvconsent.admin;

import java.util.List;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ModelAttribute;

/** 관리자 상단 바 탭 목록을 모든 화면에 넘긴다. 학생 로그인 화면도 관리자 로그아웃 직후의 고스트를 그릴 때 쓴다 */
@ControllerAdvice
class AdminTabsAdvice {

	@ModelAttribute("adminTabs")
	List<AdminTab> adminTabs() {
		return AdminTab.ALL;
	}

}
