import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Course, CourseService, CreateCourseRequest } from '../CORE/services/course';
import { DashboardService, DashboardUser } from '../CORE/services/dashboard';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
})
export class AdminDashboard implements OnInit, OnDestroy {

  courses: Course[] = [];

  totalUsers: number = 0;
  users: DashboardUser[] = [];

  loadingCourses = false;
  loadingUsers = false;
  addingCourse = false;

  errorMessage = '';
  successMessage = '';

  private coursesSubscription?: Subscription;

  newCourse: CreateCourseRequest = {
    title: '',
    language: '',
    level: '',
    description: '',
    imageUrl: '',
    lessonsCount: 0,
    isPublished: true,
    courseUrl: '',
  };

  constructor(
    private courseService: CourseService,
    private dashboardService: DashboardService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone
  ) {}

  ngOnInit(): void {
    this.loadingCourses = true;

    this.coursesSubscription = this.courseService.courses$.subscribe({
      next: (courses) => {
        this.zone.run(() => {
          this.courses = courses;
          this.loadingCourses = false;

          console.log('ADMIN COURSES UPDATED:', courses);

          this.cdr.detectChanges();
        });
      }
    });

    this.courseService.loadCourses();
    this.loadUsersSummary();
  }

  ngOnDestroy(): void {
    if (this.coursesSubscription) {
      this.coursesSubscription.unsubscribe();
    }
  }

  loadCourses(): void {
    this.loadingCourses = true;
    this.errorMessage = '';

    this.courseService.loadCourses();
  }

  loadUsersSummary(): void {
    this.loadingUsers = true;

    this.dashboardService.getUsersSummary().subscribe({
      next: (res) => {
        this.zone.run(() => {
          this.totalUsers = res.totalUsers;
          this.users = res.users;
          this.loadingUsers = false;

          console.log('ADMIN USERS:', res);

          this.cdr.detectChanges();
        });
      },
      error: (err: any) => {
        this.zone.run(() => {
          this.loadingUsers = false;
          console.log('Load Users Error:', err);
          this.errorMessage = 'فشل تحميل المستخدمين';

          this.cdr.detectChanges();
        });
      }
    });
  }

  addCourse(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.newCourse.title || !this.newCourse.language) {
      this.errorMessage = 'اسم الكورس واللغة مطلوبين';
      return;
    }

    this.addingCourse = true;

    this.courseService.addCourse(this.newCourse).subscribe({
      next: () => {
        this.zone.run(() => {
          this.addingCourse = false;
          this.successMessage = 'تم إضافة الكورس بنجاح';

          this.newCourse = {
            title: '',
            language: '',
            level: '',
            description: '',
            imageUrl: '',
            lessonsCount: 0,
            isPublished: true,
            courseUrl: '',
          };

          this.cdr.detectChanges();
        });
      },
      error: (err: any) => {
        this.zone.run(() => {
          this.addingCourse = false;
          console.log('Add Course Error:', err);

          if (err.status === 401) {
            this.errorMessage = 'يجب تسجيل الدخول أولًا';
          } else if (err.status === 403) {
            this.errorMessage = 'ليس لديك صلاحية الأدمن';
          } else {
            this.errorMessage = 'فشل إضافة الكورس';
          }

          this.cdr.detectChanges();
        });
      }
    });
  }

  deleteCourse(id: number): void {
    const confirmed = confirm('هل أنت متأكد من حذف هذا الكورس؟');

    if (!confirmed) {
      return;
    }

    this.courseService.deleteCourse(id).subscribe({
      next: () => {
        this.zone.run(() => {
          this.successMessage = 'تم حذف الكورس بنجاح';
          this.errorMessage = '';

          this.cdr.detectChanges();
        });
      },
      error: (err: any) => {
        this.zone.run(() => {
          console.log('Delete Course Error:', err);

          if (err.status === 401) {
            this.errorMessage = 'يجب تسجيل الدخول أولًا';
          } else if (err.status === 403) {
            this.errorMessage = 'ليس لديك صلاحية الأدمن';
          } else {
            this.errorMessage = 'فشل حذف الكورس';
          }

          this.cdr.detectChanges();
        });
      }
    });
  }
}