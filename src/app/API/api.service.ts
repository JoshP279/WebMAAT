import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
/**
 * ApiService class
 * This class is used to make API calls to the backend server
 * The base URL is set to the IP address of the backend server
 * The methods in this class are used to make requests to the server
 */
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
  sendStudentEmail(emailData:any): Observable<any> {
    return this.http.post(`${this.baseUrl}/sendStudentEmail`, emailData);
  }
  sendModeratorEmail(emailData:any): Observable<any> {
    return this.http.post(`${this.baseUrl}/sendModeratorEmail`, emailData);
  }
  editAssessment(assessmentForm: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/editAssessment`, assessmentForm);
  }
}