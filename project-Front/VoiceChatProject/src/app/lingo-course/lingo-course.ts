import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { Course, CourseService } from '../CORE/services/course';

@Component({
  selector: 'app-lingo-course',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lingo-course.html',
  styleUrl: './lingo-course.css'
})
export class LingoCourse implements OnInit, OnDestroy {

  courses: Course[] = [];
  loading = false;
  errorMessage = '';

  private coursesSubscription?: Subscription;
  private loadingTimer: any;

  constructor(
    private courseService: CourseService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loading = true;

    this.coursesSubscription = this.courseService.courses$.subscribe({
      next: (courses) => {
        this.courses = courses;
        this.loading = false;
        this.cdr.detectChanges();

        console.log('LINGO COURSES UPDATED:', courses);
      }
    });

    this.courseService.loadCourses();
  }

  ngOnDestroy(): void {
    if (this.loadingTimer) {
      clearTimeout(this.loadingTimer);
    }

    if (this.coursesSubscription) {
      this.coursesSubscription.unsubscribe();
    }
  }
}