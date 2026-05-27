import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

export interface Course {
  id: number;
  title: string;
  language: string;
  level: string;
  description: string;
  imageUrl: string;
  lessonsCount: number;
  isPublished: boolean;
  courseUrl: string;
}

export interface CreateCourseRequest {
  title: string;
  language: string;
  level: string;
  description: string;
  imageUrl: string;
  lessonsCount: number;
  isPublished: boolean;
  courseUrl: string;
}

@Injectable({
  providedIn: 'root'
})
export class CourseService {

  private apiUrl = 'https://localhost:7148/api/Courses';

  private coursesSubject = new BehaviorSubject<Course[]>([]);
  courses$ = this.coursesSubject.asObservable();

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');

    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  loadCourses(): void {
    this.http.get<Course[]>(this.apiUrl, {
      headers: this.getAuthHeaders()
    }).subscribe({
      next: (res: any) => {
        let courses: Course[] = [];

        if (Array.isArray(res)) {
          courses = res;
        } else if (Array.isArray(res.courses)) {
          courses = res.courses;
        } else if (Array.isArray(res.data)) {
          courses = res.data;
        } else if (Array.isArray(res.results)) {
          courses = res.results;
        }

        this.coursesSubject.next(courses);

        console.log('COURSES UPDATED IN SERVICE:', courses);
      },
      error: (err) => {
        console.error('Load Courses Error:', err);
        this.coursesSubject.next([]);
      }
    });
  }

  getCourses(): Observable<Course[]> {
    return this.http.get<Course[]>(this.apiUrl, {
      headers: this.getAuthHeaders()
    });
  }

  addCourse(course: CreateCourseRequest): Observable<Course> {
    return this.http.post<Course>(this.apiUrl, course, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(() => {
        this.loadCourses();
      })
    );
  }

  updateCourse(id: number, course: CreateCourseRequest): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, course, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(() => {
        this.loadCourses();
      })
    );
  }

deleteCourse(id: number): Observable<any> {
  return this.http.delete(`${this.apiUrl}/${id}`, {
    headers: this.getAuthHeaders(),
    responseType: 'text' as 'json'
  }).pipe(
    tap(() => {
      this.loadCourses();
    })
  );
}
}