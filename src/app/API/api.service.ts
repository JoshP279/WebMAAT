import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://10.0.0.110:3306';

  constructor(private http: HttpClient) { }

  login(loginObj: any): Observable<any> {
    return this.http.get(`${this.baseUrl}/login?MarkerEmail=${loginObj.MarkerEmail}&Password=${loginObj.Password}`, loginObj);
  }
  getAssessments(email: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/assessments?MarkerEmail=${email}`);
  }
  getSubmissions(assessmentID: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/submissions?AssessmentID=${assessmentID}`);
  }
  getLecturers(): Observable<any> {
    return this.http.get(`${this.baseUrl}/lecturers`);
  }
  getModules(): Observable<any> {
    return this.http.get(`${this.baseUrl}/modules`);
  }
  getModerators(): Observable<any> {
    return this.http.get(`${this.baseUrl}/moderators`);
  }
  getMarkers(): Observable<any> {
    return this.http.get(`${this.baseUrl}/markers`);
  }
  addAssessment(assessmentForm: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/addAssessment`, assessmentForm);
  }
  addSubmission(submissionForm: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/addSubmission`, submissionForm);
  }
  getMarkedSubmission(submissionID: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/markedSubmission?SubmissionID=${submissionID}`);
  }
  sendEmail(emailData:any): Observable<any> {
    return this.http.post(`${this.baseUrl}/sendEmail`, emailData);
  }
  editAssessment(assessmentForm: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/editAssessment`, assessmentForm);
  }
}