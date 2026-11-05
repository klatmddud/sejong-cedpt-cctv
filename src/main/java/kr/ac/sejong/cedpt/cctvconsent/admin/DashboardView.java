package kr.ac.sejong.cedpt.cctvconsent.admin;

import java.time.OffsetDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.function.Function;
import kr.ac.sejong.cedpt.cctvconsent.roster.RosterQueryService.CourseSummary;
import kr.ac.sejong.cedpt.cctvconsent.roster.RosterQueryService.SemesterSummary;
import kr.ac.sejong.cedpt.cctvconsent.roster.RosterQueryService.SjptOnlyEnrollment;
import kr.ac.sejong.cedpt.cctvconsent.roster.RosterQueryService.StudentSummary;
import kr.ac.sejong.cedpt.cctvconsent.roster.TargetRooms;

/**
 * 관리자 첫 화면의 학기 요약: 강의실별 제출률과 그 머리의 전체 제출률·미제출 학생 수, 데이터 점검.
 * 수는 모두 수강 중인 수강(최근 명부 또는 sjpt에서 확인됨) 기준이다.
 *
 * @param pendingStudents 수강 중인 강의 중 하나라도 동의서를 내지 않은 학생 수(학생 한 명씩 센다)
 * @param sjptOnly 명부에 없고 학생 로그인으로만 확인된 수강
 * @param lastRosterUploadAt 이 학기에 마지막으로 명부를 반영한 시각, 없으면 null
 */
record DashboardView(SemesterSummary semester, long total, long submitted, int rate, int pendingStudents,
		List<RoomRate> rooms, List<SjptOnlyEnrollment> sjptOnly,
		List<CourseSummary> unscheduled, OffsetDateTime lastRosterUploadAt) {

	record RoomRate(String room, long total, long submitted, int rate) {
	}

	static DashboardView of(SemesterSummary semester, List<CourseSummary> courses,
			Function<String, List<TargetRooms.Room>> targetRooms, List<SjptOnlyEnrollment> sjptOnly,
			OffsetDateTime lastRosterUploadAt) {
		long total = courses.stream().mapToLong(CourseSummary::studentCount).sum();
		long submitted = total - courses.stream().mapToLong(CourseSummary::unsubmittedCount).sum();

		// 한 학생이 여러 강의에서 미제출이어도 한 명으로 센다
		Set<String> pending = new HashSet<>();
		for (CourseSummary course : courses) {
			for (StudentSummary student : course.students()) {
				if (!student.submitted()) {
					pending.add(student.studentId());
				}
			}
		}

		List<RoomRate> rooms = SemesterPage.groupByRoom(courses, targetRooms).stream()
				.map(group -> new RoomRate(group.room(), group.studentCount(),
						group.studentCount() - group.unsubmittedCount(),
						rate(group.studentCount() - group.unsubmittedCount(), group.studentCount())))
				.toList();
		List<CourseSummary> unscheduled = courses.stream().filter(course -> course.times().isEmpty()).toList();
		return new DashboardView(semester, total, submitted, rate(submitted, total), pending.size(), rooms, sjptOnly, unscheduled, lastRosterUploadAt);
	}

	/** 백분율, 내림. 대상이 없으면 0 */
	private static int rate(long part, long whole) {
		return whole == 0 ? 0 : (int) (part * 100 / whole);
	}

}
