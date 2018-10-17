import { Injectable } from "@angular/core";
import { Observable, Subject, BehaviorSubject, timer } from "rxjs";
import { Course } from "../model/course";
import { createHttpObservable } from "./util";
import { tap, map, shareReplay, retryWhen, delayWhen, filter } from "rxjs/operators";
import { fromPromise } from "rxjs/internal-compatibility";


@Injectable({
  providedIn: 'root'
})
export class Store {

  private subject = new BehaviorSubject<Course[]>([]);

  courses$ : Observable<Course[]> = this.subject.asObservable();

  init() {

    const http$ = createHttpObservable('/api/courses');

    http$
        .pipe(
            tap(() => console.log("HTTP request executed")),
            map(res => Object.values(res["payload"]) )
        )
        .subscribe(
          courses => this.subject.next(courses)
        )

  }

  selectBeginnerCourses() {
    return this.filterByCategory("BEGINNER");
  }

  selectAdvancedCourses() {
    return this.filterByCategory("ADVANCED");
  }

  selectCourseById(courseId: number) {
    return this.courses$
    .pipe(
        map(courses => courses.find(course => course.id == courseId)),
        filter(course => !!course)
    );
  }

  filterByCategory(category: string) {
    return this.courses$
    .pipe(
        map(courses => courses
            .filter(course => course.category == category))
    );
  }

  saveCourse(courseId:number, changes): Observable<any> {

    // First, modify the course in-memory

    const courses = this.subject.getValue(); // Get a reference to the complete array of courses in memory. 

    const courseIndex = courses.findIndex(course => course.id == courseId); // Get a reference to the course with this courseId. Now we know where the course is in the array.

    const newCourses = courses.slice(0); // creating a copy of the array of courses using the slice operator.

    newCourses[courseIndex] = { // look for the course with courseIndex and assign it a completly a new course object.
      ...courses[courseIndex], // creating a copy of the course we are trying to modify.
      ...changes // use the changes we received as parameter to saveCourse function to modify the copy. 
    };

    this.subject.next(newCourses); // take this newCourses value and broadcast it to the application using the subject

    // Second, save the changes to the backend
    return fromPromise(fetch(`/api/courses/${courseId}`, {
        method: 'PUT',
        body: JSON.stringify(changes),
        headers: {
          'content-type': 'application/json'
        }
      }
    )) 

  }

}